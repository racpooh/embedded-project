import { useState, useEffect } from 'react'
import { getFirestoreInstance } from '../lib/firebase'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { SensorLog } from '../utils/mockData'

export function useFirebaseData() {
  const [sensorData, setSensorData] = useState<SensorLog[]>([])
  const [loading, setLoading] = useState(true)
  const [hasData, setHasData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const db = getFirestoreInstance()

    const sensorLogsQuery = query(
      collection(db, 'sensor_logs'),
      orderBy('timestamp', 'desc'),
      limit(50)
    )

    const unsubscribe = onSnapshot(
      sensorLogsQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const logs = snapshot.docs.map((doc) => doc.data() as SensorLog)
          setSensorData(logs.reverse()) // Reverse for chronological order
          setHasData(true)
        } else {
          // No data in Firestore
          setSensorData([])
          setHasData(false)
        }
        setLoading(false)
        setError(null)
      },
      (error) => {
        console.error('Error fetching sensor data:', error)
        setError(error.message)
        setSensorData([])
        setHasData(false)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  return { sensorData, loading, hasData, error }
}

