// USCG buoy data fetcher
export async function fetchBuoyData(buoyId) {
  const url = `https://www.ndbc.noaa.gov/data/realtime2/${buoyId}.txt`
  const response = await fetch(url)
  const text = await response.text()
  
  const lines = text.split('\n')
  const dataLine = lines[2]
  const values = dataLine.trim().split(/\s+/)
  
  return {
    windSpeed: parseFloat(values[6]) * 1.944, // m/s to knots
    waveHeight: parseFloat(values[8]) * 3.281, // m to ft
    pressure: parseFloat(values[12])
  }
}
