/**
 * WEATHER ALERTS SYSTEM
 * NOAA Buoy Integration + Email Alerts
 * Runs hourly via cron to check upcoming trips
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// NOAA Buoy API endpoint
const NOAA_BUOY_API = 'https://www.ndbc.noaa.gov/data/realtime2';

// Gulf Coast Buoy Stations
const BUOY_STATIONS = {
  'pensacola': '42039',
  'mobile': '42007',
  'orange_beach': '42012',
  'tampa': '42036',
  'grand_isle': '42001',
  'freeport': '42019',
  'corpus_christi': '42020'
};

// Weather thresholds
const THRESHOLDS = {
  DANGER: {
    wind_knots: 25,
    wave_feet: 6,
    pressure_hpa: 1000
  },
  WARNING: {
    wind_knots: 15,
    wave_feet: 4,
    pressure_hpa: 1005
  }
};

/**
 * Main function - runs hourly
 */
async function sendWeatherAlerts() {
  try {
    console.log('Starting weather alert check...');
    
    // Get all bookings in next 24 hours
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        user_id,
        captain_id,
        location,
        users!inner(email, full_name),
        captains!inner(business_name, home_port)
      `)
      .eq('status', 'confirmed')
      .gte('booking_date', new Date().toISOString())
      .lte('booking_date', tomorrow.toISOString())
      .eq('weather_alert_sent', false);
    
    if (error) throw error;
    
    console.log(`Found ${bookings?.length || 0} bookings to check`);
    
    if (!bookings || bookings.length === 0) {
      return { success: true, alerts_sent: 0 };
    }
    
    let alertsSent = 0;
    
    // Check weather for each booking
    for (const booking of bookings) {
      const buoyId = getNearestBuoy(booking.location || booking.captains.home_port);
      const weatherData = await fetchNOAABuoyData(buoyId);
      
      if (!weatherData) continue;
      
      const alertLevel = checkConditions(weatherData);
      
      if (alertLevel !== 'safe') {
        await sendAlert(booking, weatherData, alertLevel, buoyId);
        alertsSent++;
        
        // Mark alert as sent
        await supabase
          .from('bookings')
          .update({ weather_alert_sent: true })
          .eq('id', booking.id);
      }
    }
    
    console.log(`Sent ${alertsSent} weather alerts`);
    
    return {
      success: true,
      bookings_checked: bookings.length,
      alerts_sent: alertsSent
    };
    
  } catch (error) {
    console.error('Weather alert error:', error);
    throw error;
  }
}

/**
 * Fetch real-time NOAA buoy data
 */
async function fetchNOAABuoyData(stationId) {
  try {
    const response = await fetch(`${NOAA_BUOY_API}/${stationId}.txt`);
    const text = await response.text();
    
    const lines = text.split('\n');
    const headers = lines[0].replace('#', '').trim().split(/\s+/);
    const data = lines[2].trim().split(/\s+/);
    
    const parsed = {};
    headers.forEach((header, i) => {
      parsed[header.toLowerCase()] = data[i];
    });
    
    return {
      wind_direction: parseFloat(parsed.wdir) || 0,
      wind_speed: parseFloat(parsed.wspd) || 0, // m/s
      gust_speed: parseFloat(parsed.gst) || 0,
      wave_height: parseFloat(parsed.wvht) || 0, // meters
      dominant_period: parseFloat(parsed.dpd) || 0,
      pressure: parseFloat(parsed.pres) || 0, // hPa
      air_temp: parseFloat(parsed.atmp) || 0,
      water_temp: parseFloat(parsed.wtmp) || 0,
      timestamp: new Date()
    };
    
  } catch (error) {
    console.error(`Error fetching buoy ${stationId}:`, error);
    return null;
  }
}

/**
 * Check if conditions are hazardous
 */
function checkConditions(weather) {
  const windKnots = weather.wind_speed * 1.94384; // m/s to knots
  const waveFeet = weather.wave_height * 3.28084; // meters to feet
  
  // Check DANGER conditions
  if (windKnots >= THRESHOLDS.DANGER.wind_knots ||
      waveFeet >= THRESHOLDS.DANGER.wave_feet ||
      weather.pressure <= THRESHOLDS.DANGER.pressure_hpa) {
    return 'danger';
  }
  
  // Check WARNING conditions
  if (windKnots >= THRESHOLDS.WARNING.wind_knots ||
      waveFeet >= THRESHOLDS.WARNING.wave_feet ||
      weather.pressure <= THRESHOLDS.WARNING.pressure_hpa) {
    return 'warning';
  }
  
  return 'safe';
}

/**
 * Get nearest buoy to location
 */
function getNearestBuoy(location) {
  const locationLower = (location || '').toLowerCase();
  
  if (locationLower.includes('pensacola')) return BUOY_STATIONS.pensacola;
  if (locationLower.includes('mobile')) return BUOY_STATIONS.mobile;
  if (locationLower.includes('orange beach')) return BUOY_STATIONS.orange_beach;
  if (locationLower.includes('tampa')) return BUOY_STATIONS.tampa;
  if (locationLower.includes('grand isle')) return BUOY_STATIONS.grand_isle;
  if (locationLower.includes('freeport')) return BUOY_STATIONS.freeport;
  if (locationLower.includes('corpus')) return BUOY_STATIONS.corpus_christi;
  
  // Default to Orange Beach
  return BUOY_STATIONS.orange_beach;
}

/**
 * Send weather alert email
 */
async function sendAlert(booking, weather, alertLevel, buoyId) {
  const windKnots = (weather.wind_speed * 1.94384).toFixed(1);
  const waveFeet = (weather.wave_height * 3.28084).toFixed(1);
  
  const subject = alertLevel === 'danger' 
    ? '🚨 HAZARDOUS WEATHER ALERT - Trip Tomorrow'
    : '⚠️ WEATHER CAUTION - Trip Tomorrow';
  
  const emailHtml = generateEmailHTML(booking, weather, alertLevel, windKnots, waveFeet, buoyId);
  
  // Send email (using your email service)
  await sendEmail({
    to: booking.users.email,
    subject: subject,
    html: emailHtml
  });
  
  // Log alert in database
  await supabase
    .from('weather_alerts')
    .insert({
      booking_id: booking.id,
      user_id: booking.user_id,
      alert_type: alertLevel,
      severity: alertLevel === 'danger' ? 3 : 2,
      buoy_station: buoyId,
      wind_speed: parseFloat(windKnots),
      wave_height: parseFloat(waveFeet),
      pressure: weather.pressure,
      conditions: weather,
      message: `${alertLevel.toUpperCase()} conditions detected`,
      recommendation: getRecommendation(alertLevel)
    });
}

/**
 * Generate email HTML
 */
function generateEmailHTML(booking, weather, alertLevel, windKnots, waveFeet, buoyId) {
  const color = alertLevel === 'danger' ? '#DC2626' : '#F59E0B';
  const icon = alertLevel === 'danger' ? '🚨' : '⚠️';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0066CC 0%, #1E90FF 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⚓ Gulf Coast Charters</h1>
            </td>
          </tr>
          
          <!-- Alert Banner -->
          <tr>
            <td style="background-color: ${color}; padding: 20px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 20px;">
                ${icon} ${alertLevel.toUpperCase()} WEATHER ALERT
              </h2>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="font-size: 16px; color: #1f2937; margin: 0 0 20px 0;">
                Hi ${booking.users.full_name},
              </p>
              
              <p style="font-size: 16px; color: #1f2937; margin: 0 0 20px 0;">
                We've detected ${alertLevel === 'danger' ? 'hazardous' : 'concerning'} weather conditions for your upcoming charter trip tomorrow.
              </p>
              
              <!-- Weather Stats -->
              <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin: 20px 0;">
                <tr>
                  <td width="50%" style="border-right: 1px solid #e5e7eb;">
                    <div style="text-align: center;">
                      <div style="color: #6b7280; font-size: 14px;">Wind Speed</div>
                      <div style="color: ${color}; font-size: 24px; font-weight: bold; margin-top: 5px;">
                        ${windKnots} kt
                      </div>
                    </div>
                  </td>
                  <td width="50%">
                    <div style="text-align: center;">
                      <div style="color: #6b7280; font-size: 14px;">Wave Height</div>
                      <div style="color: ${color}; font-size: 24px; font-weight: bold; margin-top: 5px;">
                        ${waveFeet} ft
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="border-right: 1px solid #e5e7eb;">
                    <div style="text-align: center;">
                      <div style="color: #6b7280; font-size: 14px;">Pressure</div>
                      <div style="color: #1f2937; font-size: 20px; font-weight: bold; margin-top: 5px;">
                        ${weather.pressure} hPa
                      </div>
                    </div>
                  </td>
                  <td width="50%">
                    <div style="text-align: center;">
                      <div style="color: #6b7280; font-size: 14px;">Water Temp</div>
                      <div style="color: #1f2937; font-size: 20px; font-weight: bold; margin-top: 5px;">
                        ${weather.water_temp}°C
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Recommendation -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <strong style="color: #92400e;">⚓ Recommendation:</strong>
                <p style="color: #92400e; margin: 10px 0 0 0;">
                  ${getRecommendation(alertLevel)}
                </p>
              </div>
              
              <!-- Trip Details -->
              <p style="font-size: 14px; color: #6b7280; margin: 20px 0;">
                <strong>Your Trip:</strong><br>
                Captain: ${booking.captains.business_name}<br>
                Date: ${new Date(booking.booking_date).toLocaleDateString()}<br>
                Buoy Station: ${buoyId}
              </p>
              
              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="https://gulfcoastcharters.com/bookings/${booking.id}" 
                       style="background-color: #0066CC; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                      View Booking Details
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 14px; color: #6b7280; margin: 20px 0 0 0;">
                Please contact your captain to discuss conditions. Safety is our top priority.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 12px; color: #6b7280; margin: 0;">
                Data from NOAA Buoy ${buoyId}<br>
                Gulf Coast Charters - Fishing Made Easy
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Get safety recommendation
 */
function getRecommendation(alertLevel) {
  if (alertLevel === 'danger') {
    return 'Strong winds and rough seas. We strongly recommend rescheduling your trip for safety. Contact your captain immediately.';
  } else {
    return 'Moderate conditions expected. Experienced anglers only. Monitor weather closely and follow your captain\'s guidance.';
  }
}

/**
 * Send email via SendGrid/SMTP
 */
async function sendEmail({ to, subject, html }) {
  // Implement your email service here (SendGrid, AWS SES, etc.)
  console.log(`Sending email to ${to}: ${subject}`);
  
  // Example with fetch (you'd use your actual email service)
  // await fetch('https://api.sendgrid.com/v3/mail/send', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     personalizations: [{ to: [{ email: to }] }],
  //     from: { email: 'alerts@gulfcoastcharters.com' },
  //     subject: subject,
  //     content: [{ type: 'text/html', value: html }]
  //   })
  // });
}

// Export for Supabase Edge Function
module.exports = { sendWeatherAlerts };

// For local testing
if (require.main === module) {
  sendWeatherAlerts()
    .then(result => console.log('Result:', result))
    .catch(error => console.error('Error:', error));
}
