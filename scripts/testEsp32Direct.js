/**
 * Test direct connection to your real ESP32 at 172.20.10.4
 * This helps verify the ESP32 is reachable and debug parsing
 * 
 * Usage: node scripts/testEsp32Direct.js
 */

const ESP32_HOST = process.env.ESP32_HOST || 'http://172.20.10.4'

async function testConnection() {
  console.log('╔══════════════════════════════════════════╗')
  console.log('║   TEST ESP32 DIRECT CONNECTION           ║')
  console.log('╚══════════════════════════════════════════╝')
  console.log(`\n📡 Testing connection to: ${ESP32_HOST}\n`)

  // Test root endpoint
  console.log('📍 Testing root endpoint (/)...')
  try {
    const rootResponse = await fetch(`${ESP32_HOST}/`)
    console.log(`   ✅ Status: ${rootResponse.status} ${rootResponse.statusText}`)
    console.log(`   📄 Content-Type: ${rootResponse.headers.get('content-type')}`)
    
    const rootHtml = await rootResponse.text()
    console.log(`   📦 Response length: ${rootHtml.length} bytes`)
    console.log(`\n📝 HTML Response Preview (first 500 chars):`)
    console.log('   ' + '─'.repeat(70))
    console.log(rootHtml.substring(0, 500).split('\n').map(l => '   ' + l).join('\n'))
    console.log('   ' + '─'.repeat(70))
    
    // Try parsing
    console.log(`\n🔍 Parsing sensor values from HTML...`)
    const parsed = parseHtmlPayload(rootHtml)
    console.log('   Parsed values:')
    console.log(`   • Temperature: ${parsed.temperature}°C`)
    console.log(`   • Humidity: ${parsed.humidity}%`)
    console.log(`   • LDR Value: ${parsed.ldrValue}`)
    console.log(`   • Flame DO: ${parsed.flameDO} (${parsed.flameDO === 0 ? 'DETECTED' : 'No flame'})`)
    console.log(`   • Flame AO: ${parsed.flameAO}`)
    console.log(`   • MQ Value: ${parsed.mqValue}`)
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`)
  }

  // Test JSON endpoint
  console.log(`\n📍 Testing JSON endpoint (/api/sensors)...`)
  try {
    const jsonResponse = await fetch(`${ESP32_HOST}/api/sensors`)
    console.log(`   ✅ Status: ${jsonResponse.status} ${jsonResponse.statusText}`)
    console.log(`   📄 Content-Type: ${jsonResponse.headers.get('content-type')}`)
    
    const jsonData = await jsonResponse.json()
    console.log(`\n📊 JSON Response:`)
    console.log(JSON.stringify(jsonData, null, 2).split('\n').map(l => '   ' + l).join('\n'))
    
  } catch (error) {
    console.log(`   ⚠️  JSON endpoint not available: ${error.message}`)
    console.log(`   💡 This is OK - the script will use HTML parsing as fallback`)
  }

  console.log(`\n✅ Connection test complete!`)
  console.log(`\n💡 Next steps:`)
  console.log(`   1. If HTML parsing worked, you're ready to run: npm run ingest-esp32`)
  console.log(`   2. If you want better performance, add JSON endpoint to your ESP32`)
  console.log(`   3. Check the parsed values match your sensor readings\n`)
}

function parseHtmlPayload(html) {
  const number = (regex) => {
    const match = html.match(regex)
    return match ? parseFloat(match[1]) : NaN
  }

  const boolFlame = (() => {
    const match = html.match(/Flame DO:\s*(Detected!|No Flame)/i)
    if (!match) return false
    return match[1].toLowerCase().includes('detected')
  })()

  return {
    temperature: number(/Temperature:\s*([-\d.]+)/i),
    humidity: number(/Humidity:\s*([-\d.]+)/i),
    ldrValue: number(/LDR ADC:\s*(\d+)/i),
    flameDO: boolFlame ? 0 : 1,
    flameAO: number(/Flame.*AO:\s*(\d+)/i),
    mqValue: number(/MQ Gas AO:\s*(\d+)/i),
  }
}

testConnection().catch(console.error)
