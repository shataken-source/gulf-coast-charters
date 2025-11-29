/**
 * BUOY & USCG DATA INTEGRATION
 * Real-time marine data for Gulf Coast
 */

const BUOY_STATIONS = {
  tampa: {
    id: '42036',
    name: 'West Tampa',
    lat: 28.500,
    lon: -84.517,
    depth: 53
  },
  miami: {
    id: '41010',
    name: 'Canaveral East',
    lat: 28.878,
    lon: -78.485,
    depth: 870
  },
  pensacola: {
    id: '42039',
    name: 'Pensacola',
    lat: 28.791,
    lon: -86.008,
    depth: 244
  },
  mobile: {
    id: '42007',
    name: 'South of Mobile',
    lat: 30.093,
    lon: -88.769,
    depth: 14
  }
};

async function fetchBuoyData(stationId) {
  const url = `https://www.ndbc.noaa.gov/data/realtime2/${stationId}.txt`;
  const response = await fetch(url);
  const text = await response.text();
  
  const lines = text.split('\n');
  const headers = lines[0].replace('#', '').trim().split(/\s+/);
  const data = lines[2].trim().split(/\s+/);
  
  const parsed = {};
  headers.forEach((h, i) => parsed[h.toLowerCase()] = data[i]);
  
  return {
    station_id: stationId,
    wind_speed: parseFloat(parsed.wspd) * 1.94384, // m/s to knots
    wave_height: parseFloat(parsed.wvht) * 3.28084, // m to feet
    pressure: parseFloat(parsed.pres),
    water_temp: parseFloat(parsed.wtmp),
    timestamp: new Date()
  };
}

module.exports = { BUOY_STATIONS, fetchBuoyData };
