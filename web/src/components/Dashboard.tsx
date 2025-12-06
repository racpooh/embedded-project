import { useEffect, useState } from 'react'
import { getFirestoreInstance } from '../lib/firebase'
import { collection, query, orderBy, limit, onSnapshot, DocumentData } from 'firebase/firestore'
import './Dashboard.css'

interface SensorLog {
  timestamp: number
  temp?: number
  humidity?: number
  mq_arduino?: number
  mq_gateway?: number
  flame?: boolean
  light?: number
  risk_level?: 'NORMAL' | 'WARNING' | 'DANGER'
  ai_fire_detected?: boolean
  image_url?: string
  source?: string
}

interface Event {
  timestamp: number
  event_type: 'WARNING' | 'DANGER'
  reason?: string
  risk_score?: number
  ai_fire_detected?: boolean
  ai_confidence?: number
  image_url?: string
  acknowledged?: boolean
}

const Dashboard = () => {
  const [latestLog, setLatestLog] = useState<SensorLog | null>(null)
  const [recentEvents, setRecentEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const db = getFirestoreInstance()

    // Subscribe to latest sensor log
    const sensorLogsQuery = query(
      collection(db, 'sensor_logs'),
      orderBy('timestamp', 'desc'),
      limit(1)
    )

    const unsubscribeLogs = onSnapshot(
      sensorLogsQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0]
          setLatestLog(doc.data() as SensorLog)
        }
        setLoading(false)
      },
      (error) => {
        console.error('Error listening to sensor logs:', error)
        setLoading(false)
      }
    )

    // Subscribe to recent events
    const eventsQuery = query(
      collection(db, 'events'),
      orderBy('timestamp', 'desc'),
      limit(10)
    )

    const unsubscribeEvents = onSnapshot(
      eventsQuery,
      (snapshot) => {
        const events = snapshot.docs.map((doc) => doc.data() as Event)
        setRecentEvents(events)
      },
      (error) => {
        console.error('Error listening to events:', error)
      }
    )

    return () => {
      unsubscribeLogs()
      unsubscribeEvents()
    }
  }, [])

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'DANGER':
        return '#ff4444'
      case 'WARNING':
        return '#ffaa00'
      case 'NORMAL':
      default:
        return '#44ff44'
    }
  }

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>🔥 Household Fire Detection System</h1>
        <p className="subtitle">Real-time Monitoring Dashboard</p>
      </header>

      <main className="dashboard-main">
        <section className="sensor-panel">
          <h2>Current Sensor Readings</h2>
          {latestLog ? (
            <div className="sensor-grid">
              <div className="sensor-card">
                <label>Temperature</label>
                <value>{latestLog.temp?.toFixed(1) ?? 'N/A'}°C</value>
              </div>
              <div className="sensor-card">
                <label>Humidity</label>
                <value>{latestLog.humidity?.toFixed(1) ?? 'N/A'}%</value>
              </div>
              <div className="sensor-card">
                <label>MQ-135 (Arduino)</label>
                <value>{latestLog.mq_arduino ?? 'N/A'}</value>
              </div>
              <div className="sensor-card">
                <label>MQ-135 (Gateway)</label>
                <value>{latestLog.mq_gateway ?? 'N/A'}</value>
              </div>
              <div className="sensor-card">
                <label>Flame Detected</label>
                <value>{latestLog.flame ? '⚠️ YES' : '✓ No'}</value>
              </div>
              <div className="sensor-card">
                <label>Light Level</label>
                <value>{latestLog.light ?? 'N/A'}</value>
              </div>
              <div className="sensor-card risk-indicator" style={{ backgroundColor: getRiskColor(latestLog.risk_level) }}>
                <label>Risk Level</label>
                <value>{latestLog.risk_level ?? 'NORMAL'}</value>
              </div>
              <div className="sensor-card">
                <label>AI Fire Detected</label>
                <value>{latestLog.ai_fire_detected ? '🔥 YES' : '✓ No'}</value>
              </div>
            </div>
          ) : (
            <p>No sensor data available</p>
          )}
        </section>

        <section className="events-panel">
          <h2>Recent Events</h2>
          {recentEvents.length > 0 ? (
            <div className="events-list">
              {recentEvents.map((event, index) => (
                <div key={index} className={`event-card event-${event.event_type.toLowerCase()}`}>
                  <div className="event-header">
                    <span className="event-type">{event.event_type}</span>
                    <span className="event-time">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {event.reason && <p className="event-reason">{event.reason}</p>}
                  {event.risk_score !== undefined && (
                    <p className="event-score">Risk Score: {event.risk_score}</p>
                  )}
                  {event.ai_fire_detected && (
                    <div className="event-ai">
                      <p>🔥 AI Fire Detection: {event.ai_confidence ? `${(event.ai_confidence * 100).toFixed(1)}% confidence` : 'Detected'}</p>
                      {event.image_url && (
                        <img src={event.image_url} alt="Fire detection" className="event-image" />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No events yet</p>
          )}
        </section>
      </main>
    </div>
  )
}

export default Dashboard

