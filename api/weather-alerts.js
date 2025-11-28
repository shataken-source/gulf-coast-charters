// =====================================================
// WEATHER ALERTS SYSTEM - NOAA BUOY INTEGRATION
// =====================================================
// Purpose: Automated weather monitoring for trip safety
// Runs: Hourly via cron
// Alerts: 24 hours before trips if dangerous conditions
// =====================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

// NOAA Buoy IDs for Gulf Coast
const GULF_COAST_BUOYS = {
  'Northern Gulf': '42040',      // Luke Offshore
  'Florida Panhandle': '42039',  // Pensacola
  'Louisiana': '42001',          // East of Mississippi Delta
  'Texas Coast': '42019',        // Freeport
  'Mobile Bay': '42012',         // Orange Beach
}

interface NOAABuoyData {
  windSpeed: number
  windGust: number
  waveHeight: number
  pressure: number
  temperature: number
  timestamp: Date
}

interface WeatherAlert {
  level: 'safe' | 'caution' | 'hazardous'
  message: string
  recommendation: string
}

// Main handler
Deno.serve(async (req) => {
  try {
    console.log('🌊 Weather Alerts: Starting hourly check...')
    
    // Get bookings in next 24-48 hours
    const tomorrow = new Date()
    tomorrow.setHours(tomorrow.getHours() + 24)
    const dayAfter = new Date()
    dayAfter.setHours(dayAfter.getHours() + 48)

    const { data: upcomingBookings, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        trip_date,
        start_time,
        weather_alert_sent,
        charters (
          id,
          title,
          location,
          coordinates
        ),
        users!customer_id (
          id,
          email,
          full_name,
          phone
        ),
        captains (
          id,
          business_name,
          users!user_id (
            email,
            phone
          )
        )
      `)
      .gte('trip_date', tomorrow.toISOString().split('T')[0])
      .lte('trip_date', dayAfter.toISOString().split('T')[0])
      .eq('status', 'confirmed')
      .eq('weather_alert_sent', false)

    if (bookingError) throw bookingError

    console.log(`📅 Found ${upcomingBookings?.length || 0} upcoming bookings to check`)

    let alertsSent = 0
    let errors = 0

    for (const booking of upcomingBookings || []) {
      try {
        // Find nearest buoy
        const nearestBuoy = await findNearestBuoy(booking.charters.coordinates)
        
        // Fetch NOAA data
        const buoyData = await fetchNOAABuoyData(nearestBuoy)
        
        // Analyze conditions
        const alert = analyzeWeatherConditions(buoyData)
        
        // Only send if caution or hazardous
        if (alert.level === 'caution' || alert.level === 'hazardous') {
          await sendWeatherAlert(booking, buoyData, alert, nearestBuoy)
          
          // Mark as sent
          await supabase
            .from('bookings')
            .update({ weather_alert_sent: true })
            .eq('id', booking.id)
          
          alertsSent++
          console.log(`⚠️  Alert sent for booking ${booking.id} (${alert.level})`)
        } else {
          console.log(`✅ Safe conditions for booking ${booking.id}`)
        }
        
      } catch (error) {
        console.error(`❌ Error processing booking ${booking.id}:`, error)
        errors++
      }
    }

    // Log to cron_logs
    await supabase
      .from('cron_logs')
      .insert({
        cron_job_id: await getCronJobId('weather-alerts'),
        status: 'success',
        completed_at: new Date().toISOString(),
        records_processed: upcomingBookings?.length || 0,
        execution_time_ms: Date.now()
      })

    return new Response(
      JSON.stringify({
        success: true,
        bookings_checked: upcomingBookings?.length || 0,
        alerts_sent: alertsSent,
        errors: errors,
        timestamp: new Date().toISOString()
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('🔥 Weather Alerts Error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
})

// =====================================================
// NOAA DATA FETCHING
// =====================================================

async function fetchNOAABuoyData(buoyId: string): Promise<NOAABuoyData> {
  const url = `https://www.ndbc.noaa.gov/data/realtime2/${buoyId}.txt`
  
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`NOAA API error: ${response.status}`)
    
    const text = await response.text()
    const lines = text.split('\n')
    
    // Skip header lines (first 2 lines)
    const dataLine = lines[2]
    if (!dataLine) throw new Error('No data available from buoy')
    
    const values = dataLine.trim().split(/\s+/)
    
    // NOAA format: YY MM DD hh mm WDIR WSPD GST WVHT DPD APD MWD PRES ATMP WTMP DEWP VIS TIDE
    return {
      windSpeed: parseFloat(values[6]) || 0,      // WSPD (m/s) -> convert to knots
      windGust: parseFloat(values[7]) || 0,       // GST (m/s) -> convert to knots
      waveHeight: parseFloat(values[8]) || 0,     // WVHT (meters) -> convert to feet
      pressure: parseFloat(values[12]) || 1013,   // PRES (hPa)
      temperature: parseFloat(values[13]) || 20,  // ATMP (°C)
      timestamp: new Date()
    }
  } catch (error) {
    console.error(`Failed to fetch buoy ${buoyId}:`, error)
    throw error
  }
}

// =====================================================
// WEATHER ANALYSIS
// =====================================================

function analyzeWeatherConditions(data: NOAABuoyData): WeatherAlert {
  // Convert m/s to knots (1 m/s = 1.944 knots)
  const windSpeed = data.windSpeed * 1.944
  const windGust = data.windGust * 1.944
  
  // Convert meters to feet (1m = 3.281 ft)
  const waveHeight = data.waveHeight * 3.281
  
  const pressure = data.pressure

  // HAZARDOUS CONDITIONS
  if (windSpeed > 25 || windGust > 35 || waveHeight > 6 || pressure < 1000) {
    return {
      level: 'hazardous',
      message: `HAZARDOUS CONDITIONS: ${windSpeed.toFixed(1)} kt winds, ${waveHeight.toFixed(1)} ft waves`,
      recommendation: 'Trip cancellation strongly recommended. Dangerous sea conditions. Contact captain immediately to reschedule.'
    }
  }

  // CAUTION CONDITIONS
  if (windSpeed > 15 || windGust > 20 || waveHeight > 4 || pressure < 1005) {
    return {
      level: 'caution',
      message: `MODERATE CONDITIONS: ${windSpeed.toFixed(1)} kt winds, ${waveHeight.toFixed(1)} ft waves`,
      recommendation: 'Conditions are marginal. Suitable for experienced boaters. Be prepared for choppy seas. Monitor forecast closely.'
    }
  }

  // SAFE CONDITIONS
  return {
    level: 'safe',
    message: `Favorable conditions: ${windSpeed.toFixed(1)} kt winds, ${waveHeight.toFixed(1)} ft waves`,
    recommendation: 'Good weather for fishing. Have a great trip!'
  }
}

// =====================================================
// EMAIL NOTIFICATIONS
// =====================================================

async function sendWeatherAlert(
  booking: any,
  buoyData: NOAABuoyData,
  alert: WeatherAlert,
  buoyId: string
) {
  const smtpHost = Deno.env.get('SMTP_HOST')!
  const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587')
  const smtpUser = Deno.env.get('SMTP_USER')!
  const smtpPassword = Deno.env.get('SMTP_PASSWORD')!
  const smtpFrom = Deno.env.get('SMTP_FROM') || 'alerts@gulfcoastcharters.com'

  const alertIcon = alert.level === 'hazardous' ? '🚨' : '⚠️'
  const alertColor = alert.level === 'hazardous' ? '#dc2626' : '#f59e0b'
  const subject = `${alertIcon} Weather Alert: ${booking.charters.title}`

  const windKnots = (buoyData.windSpeed * 1.944).toFixed(1)
  const gustKnots = (buoyData.windGust * 1.944).toFixed(1)
  const waveFeet = (buoyData.waveHeight * 3.281).toFixed(1)

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6; 
      color: #1f2937; 
      margin: 0;
      padding: 0;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      padding: 32px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      font-size: 24px;
      margin: 0;
    }
    .alert-banner {
      background: ${alertColor};
      padding: 24px;
      text-align: center;
      color: #ffffff;
    }
    .alert-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }
    .alert-level {
      font-size: 28px;
      font-weight: 700;
      margin: 0;
      text-transform: uppercase;
    }
    .content {
      padding: 32px;
    }
    .conditions-box {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .condition-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .condition-row:last-child {
      border-bottom: none;
    }
    .condition-label {
      font-weight: 600;
      color: #374151;
    }
    .condition-value {
      color: #6b7280;
    }
    .recommendation {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .button {
      display: inline-block;
      background: #0ea5e9;
      color: #ffffff;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 16px 0;
    }
    .footer {
      background: #f9fafb;
      padding: 24px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎣 Gulf Coast Charters</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Weather Alert System</p>
    </div>

    <div class="alert-banner">
      <div class="alert-icon">${alertIcon}</div>
      <h2 class="alert-level">${alert.level} Alert</h2>
    </div>

    <div class="content">
      <p>Hi ${booking.users.full_name},</p>
      
      <p><strong>${alert.message}</strong></p>
      
      <p>We're monitoring weather conditions for your upcoming trip:</p>
      
      <div class="conditions-box">
        <h3 style="margin-top: 0;">📍 ${booking.charters.location}</h3>
        <p style="margin: 4px 0 16px 0; color: #6b7280; font-size: 14px;">
          Trip Date: ${new Date(booking.trip_date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
        
        <div class="condition-row">
          <span class="condition-label">Wind Speed:</span>
          <span class="condition-value">${windKnots} knots sustained</span>
        </div>
        <div class="condition-row">
          <span class="condition-label">Wind Gusts:</span>
          <span class="condition-value">${gustKnots} knots</span>
        </div>
        <div class="condition-row">
          <span class="condition-label">Wave Height:</span>
          <span class="condition-value">${waveFeet} feet</span>
        </div>
        <div class="condition-row">
          <span class="condition-label">Pressure:</span>
          <span class="condition-value">${buoyData.pressure.toFixed(1)} hPa</span>
        </div>
        <div class="condition-row">
          <span class="condition-label">Data Source:</span>
          <span class="condition-value">NOAA Buoy ${buoyId}</span>
        </div>
      </div>

      <div class="recommendation">
        <strong>⚠️ Recommendation:</strong><br>
        ${alert.recommendation}
      </div>

      <p>Please contact your captain <strong>${booking.captains.business_name}</strong> to discuss your options.</p>

      <a href="https://gulfcoastcharters.com/bookings/${booking.id}" class="button">
        View Booking Details
      </a>

      <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
        For the latest forecast, visit 
        <a href="https://www.ndbc.noaa.gov/station_page.php?station=${buoyId}">NOAA Buoy ${buoyId}</a>
      </p>

      <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
        Safety first! 🌊
      </p>
    </div>

    <div class="footer">
      <p>This is an automated weather alert from Gulf Coast Charters.</p>
      <p>
        <a href="https://gulfcoastcharters.com">Website</a> | 
        <a href="mailto:support@gulfcoastcharters.com">Support</a>
      </p>
      <p style="margin-top: 12px; font-size: 12px;">
        © 2025 Gulf Coast Charters. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `

  // Send email (using fetch to SMTP API or SendGrid)
  // For production, use SendGrid API or AWS SES
  try {
    // Example with SendGrid
    const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${smtpPassword}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: booking.users.email, name: booking.users.full_name }],
          subject: subject
        }],
        from: { email: smtpFrom, name: 'Gulf Coast Charters Alerts' },
        content: [{
          type: 'text/html',
          value: html
        }]
      })
    })

    if (!sendgridResponse.ok) {
      throw new Error(`SendGrid error: ${sendgridResponse.status}`)
    }

    // Log alert to database
    await supabase.from('weather_alerts').insert({
      booking_id: booking.id,
      alert_level: alert.level,
      wind_speed: buoyData.windSpeed * 1.944,
      wind_gust: buoyData.windGust * 1.944,
      wave_height: buoyData.waveHeight * 3.281,
      pressure: buoyData.pressure,
      buoy_id: buoyId,
      alert_message: alert.message,
      recommendation: alert.recommendation,
      email_sent: true
    })

    console.log(`✉️  Email sent to ${booking.users.email}`)

  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function findNearestBuoy(coordinates: any): Promise<string> {
  // For now, use simple region mapping
  // In production, calculate actual distance using PostGIS
  
  // Default to Northern Gulf buoy
  return '42040'
}

async function getCronJobId(jobName: string): Promise<string> {
  const { data } = await supabase
    .from('cron_jobs')
    .select('id')
    .eq('name', jobName)
    .single()
  
  return data?.id || ''
}

// =====================================================
// EXPORTS
// =====================================================

export { 
  fetchNOAABuoyData, 
  analyzeWeatherConditions, 
  sendWeatherAlert 
}
