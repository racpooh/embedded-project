/**
 * Mock Data Generator for Firestore
 * Generates 50+ sensor log entries for testing
 */

export interface SensorLog {
  timestamp: number
  node_id: string
  temp: number
  humidity: number
  mq_arduino: number
  mq_gateway: number
  flame: boolean
  gas_gateway: number
  light: number
  risk_level: 'NORMAL' | 'WARNING' | 'DANGER'
  ai_fire_detected: boolean
  ai_confidence: number
  image_url: string | null
  source: 'gateway' | 'ai'
}

/**
 * Generate mock sensor data for the last 24 hours
 */
export function generateMockSensorLogs(count: number = 50): SensorLog[] {
  const logs: SensorLog[] = []
  const now = Date.now()
  const interval = (24 * 60 * 60 * 1000) / count // Distribute over 24 hours

  for (let i = 0; i < count; i++) {
    const timestamp = now - (count - i) * interval
    
    // Simulate gradual changes and occasional spikes
    const baseTemp = 28 + Math.sin(i / 10) * 5 + Math.random() * 3
    const baseHumidity = 60 + Math.cos(i / 8) * 10 + Math.random() * 5
    const baseMQ = 150 + Math.random() * 100
    const baseGas = 200 + Math.random() * 150
    
    // Simulate day/night cycle for light sensor
    const hourOfDay = new Date(timestamp).getHours()
    const isDaytime = hourOfDay >= 6 && hourOfDay <= 18
    const baseLight = isDaytime ? 0.6 + Math.random() * 0.3 : 0.1 + Math.random() * 0.2
    
    // Occasionally simulate dangerous conditions
    const isDangerous = Math.random() > 0.95
    const isWarning = !isDangerous && Math.random() > 0.85
    
    let temp = baseTemp
    let mq_arduino = baseMQ
    let mq_gateway = baseMQ * 0.9
    let gas_gateway = baseGas
    let flame = false
    let risk_level: 'NORMAL' | 'WARNING' | 'DANGER' = 'NORMAL'
    let ai_fire_detected = false
    let ai_confidence = 0.0
    let image_url: string | null = null
    
    if (isDangerous) {
      temp = 45 + Math.random() * 20
      mq_arduino = 400 + Math.random() * 200
      mq_gateway = 380 + Math.random() * 180
      gas_gateway = 500 + Math.random() * 200
      flame = Math.random() > 0.3
      risk_level = 'DANGER'
      ai_fire_detected = Math.random() > 0.4
      ai_confidence = 0.75 + Math.random() * 0.25
      image_url = ai_fire_detected 
        ? `https://storage.googleapis.com/household-fire-images/fire_${timestamp}.jpg`
        : null
    } else if (isWarning) {
      temp = 35 + Math.random() * 8
      mq_arduino = 280 + Math.random() * 100
      mq_gateway = 260 + Math.random() * 90
      gas_gateway = 350 + Math.random() * 100
      flame = Math.random() > 0.8
      risk_level = 'WARNING'
    }
    
    logs.push({
      timestamp,
      node_id: 'gw-1',
      temp: parseFloat(temp.toFixed(1)),
      humidity: parseFloat(baseHumidity.toFixed(1)),
      mq_arduino: Math.round(mq_arduino),
      mq_gateway: Math.round(mq_gateway),
      flame,
      gas_gateway: Math.round(gas_gateway),
      light: parseFloat(baseLight.toFixed(2)),
      risk_level,
      ai_fire_detected,
      ai_confidence: parseFloat(ai_confidence.toFixed(2)),
      image_url,
      source: ai_fire_detected ? 'ai' : 'gateway'
    })
  }
  
  return logs
}

/**
 * Upload mock data to Firestore
 */
export async function uploadMockDataToFirestore(db: any, count: number = 50) {
  const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
  
  const logs = generateMockSensorLogs(count)
  const results = []
  
  console.log(`📊 Uploading ${count} mock sensor logs to Firestore...`)
  
  for (const log of logs) {
    try {
      const docRef = await addDoc(collection(db, 'sensor_logs'), log)
      results.push(docRef.id)
    } catch (error) {
      console.error('Error adding document:', error)
    }
  }
  
  console.log(`✅ Successfully uploaded ${results.length} documents`)
  return results
}

/**
 * Generate mock data for local testing (without Firestore)
 */
export function useMockData(): SensorLog[] {
  return generateMockSensorLogs(50)
}

