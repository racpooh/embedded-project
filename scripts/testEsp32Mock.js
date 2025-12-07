/**
 * Mock ESP32 server for testing ingestion without real hardware
 * Run this first, then run ingest-esp32 in another terminal
 * 
 * Usage: node scripts/testEsp32Mock.js
 */

import http from 'http'

const PORT = 8080

// Simulated sensor data matching your ESP32 format
let sensorState = {
  temp: 25.5,
  humidity: 65.0,
  ldrValue: 800,  // ADC value 0-4095
  flameDO: false,
  flameAO: 100,
  mqValue: 150
}

// Simulate changing values
function updateSensors() {
  sensorState.temp = 22 + Math.random() * 10
  sensorState.humidity = 50 + Math.random() * 20
  sensorState.ldrValue = Math.floor(Math.random() * 4095)
  sensorState.flameDO = Math.random() > 0.9
  sensorState.flameAO = Math.floor(100 + Math.random() * 200)
  sensorState.mqValue = Math.floor(100 + Math.random() * 200)
}

// Create server with multiple endpoints
const server = http.createServer((req, res) => {
  console.log(`📡 ${req.method} ${req.url}`)
  
  if (req.url === '/api/sensors') {
    // JSON endpoint (preferred)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(sensorState))
    
  } else if (req.url === '/' || req.url === '/index.html') {
    // HTML dashboard endpoint (fallback)
    const html = `<html><head><meta http-equiv='refresh' content='2'></head><body>
<h1>ESP32 Multi Sensor Dashboard</h1>
<p>🌡 Temperature: ${sensorState.temp.toFixed(1)} °C | 💧 Humidity: ${sensorState.humidity.toFixed(1)} %</p>
<p>💡 LDR ADC: ${sensorState.ldrValue}</p>
<p>🔥 Flame DO: ${sensorState.flameDO ? 'Detected!' : 'No Flame'} | AO: ${sensorState.flameAO}</p>
<p>🛢 MQ Gas AO: ${sensorState.mqValue}</p>
</body></html>`
    
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(html)
    
  } else {
    res.writeHead(404)
    res.end('Not Found')
  }
})

server.listen(PORT, () => {
  console.log('╔══════════════════════════════════════════╗')
  console.log('║   MOCK ESP32 SERVER RUNNING              ║')
  console.log('╚══════════════════════════════════════════╝')
  console.log(`\n🌐 Server running at http://localhost:${PORT}`)
  console.log(`\n📍 Available endpoints:`)
  console.log(`   • JSON: http://localhost:${PORT}/api/sensors`)
  console.log(`   • HTML: http://localhost:${PORT}/`)
  console.log(`\n💡 Test the ingestion:`)
  console.log(`   1. Keep this server running`)
  console.log(`   2. In another terminal, set: export ESP32_HOST=http://localhost:${PORT}`)
  console.log(`   3. Run: npm run ingest-esp32`)
  console.log(`\n🔄 Sensors update every 3 seconds`)
  console.log(`\nPress Ctrl+C to stop\n`)
})

// Update sensor values every 3 seconds
setInterval(updateSensors, 3000)
