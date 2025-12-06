import React from 'react'
import MainLayout from '../components/layout/MainLayout'
import StatCard from '../components/dashboard/StatCard'
import ChartCard from '../components/dashboard/ChartCard'
import SensorNodesTable from '../components/dashboard/SensorNodesTable'
import EventsList from '../components/dashboard/EventsList'
import RiskBadge from '../components/common/RiskBadge'
import { useFirebaseData } from '../hooks/useFirebaseData'

const Dashboard: React.FC = () => {
  const { sensorData, loading, hasData, error } = useFirebaseData()

  if (loading) {
    return (
      <MainLayout>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="loading">
            <h4>Loading dashboard...</h4>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Show error state
  if (error) {
    return (
      <MainLayout>
        <div className="page-header">
          <h1>Dashboard</h1>
          <p>Real-time monitoring of fire detection sensors and environmental data</p>
        </div>
        <div className="alert alert-danger" role="alert">
          <h5 className="alert-heading">Connection Error</h5>
          <p>{error}</p>
          <hr />
          <p className="mb-0">Please check your Firebase configuration and try again.</p>
        </div>
      </MainLayout>
    )
  }

  // Show no data state
  if (!hasData || sensorData.length === 0) {
    return (
      <MainLayout>
        <div className="page-header">
          <h1>Dashboard</h1>
          <p>Real-time monitoring of fire detection sensors and environmental data</p>
        </div>
        
        <div className="card border-0 shadow-sm" style={{ 
          borderRadius: '1rem', 
          padding: '3rem', 
          textAlign: 'center',
          background: 'var(--primary-bg)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.3 }}>
            <i className="bi bi-database-slash"></i>
          </div>
          <h3 className="mb-3">No Sensor Data Available</h3>
          <p className="text-secondary mb-4">
            There is currently no data in the Firestore database.
          </p>
        </div>
      </MainLayout>
    )
  }

  const latestLog = sensorData[sensorData.length - 1]

  // Prepare chart data
  const chartLabels = sensorData
    .filter((_, i) => i % 8 === 0) // Show every 8th point for readability
    .map(log => new Date(log.timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }))

  const tempChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: sensorData.filter((_, i) => i % 8 === 0).map(log => log.temp),
        borderColor: '#000000',
        backgroundColor: 'rgba(0, 0, 0, 0.05)'
      },
      {
        label: 'Humidity (%)',
        data: sensorData.filter((_, i) => i % 8 === 0).map(log => log.humidity),
        borderColor: '#6c757d',
        backgroundColor: 'rgba(108, 117, 125, 0.05)'
      }
    ]
  }

  const smokeChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'MQ-135 Arduino (PPM)',
        data: sensorData.filter((_, i) => i % 8 === 0).map(log => log.mq_arduino),
        borderColor: '#000000',
        backgroundColor: 'rgba(0, 0, 0, 0.05)'
      },
      {
        label: 'MQ-135 Gateway (PPM)',
        data: sensorData.filter((_, i) => i % 8 === 0).map(log => log.mq_gateway),
        borderColor: '#6c757d',
        backgroundColor: 'rgba(108, 117, 125, 0.05)'
      }
    ]
  }

  const lightChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Light Level (%)',
        data: sensorData.filter((_, i) => i % 8 === 0).map(log => log.light * 100),
        borderColor: '#000000',
        backgroundColor: 'rgba(0, 0, 0, 0.05)'
      }
    ]
  }

  // Calculate stats
  const avgTemp = sensorData.length > 0
    ? (sensorData.reduce((sum, log) => sum + log.temp, 0) / sensorData.length).toFixed(1)
    : '0'

  const avgHumidity = sensorData.length > 0
    ? (sensorData.reduce((sum, log) => sum + log.humidity, 0) / sensorData.length).toFixed(1)
    : '0'

  const flameCount = sensorData.filter(log => log.flame).length

  // Sensor nodes data
  const sensorNodes = [
    {
      nodeId: 'GW-1',
      sensorType: 'DHT22',
      status: 'active' as const,
      lastUpdate: '2 min ago',
      reading: `${latestLog.temp.toFixed(1)}°C / ${latestLog.humidity.toFixed(1)}%`
    },
    {
      nodeId: 'GW-1',
      sensorType: 'MQ-135',
      status: 'active' as const,
      lastUpdate: '2 min ago',
      reading: `${latestLog.mq_arduino} PPM`
    },
    {
      nodeId: 'GW-1',
      sensorType: 'Flame Sensor',
      status: 'active' as const,
      lastUpdate: '2 min ago',
      reading: latestLog.flame ? 'Detection' : 'No Detection'
    },
    {
      nodeId: 'GW-1',
      sensorType: 'LDR (Light)',
      status: 'active' as const,
      lastUpdate: '2 min ago',
      reading: `${(latestLog.light * 100).toFixed(0)}%`
    },
    {
      nodeId: 'CAM-1',
      sensorType: 'ESP32-CAM',
      status: 'active' as const,
      lastUpdate: '5 min ago',
      reading: 'AI Ready'
    }
  ]

  // Recent events
  const recentEvents = sensorData
    .filter(log => log.risk_level !== 'NORMAL' || log.ai_fire_detected)
    .slice(-5)
    .reverse()
    .map(log => ({
      type: log.risk_level as 'WARNING' | 'DANGER' | 'NORMAL',
      time: new Date(log.timestamp).toLocaleString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      description: log.ai_fire_detected 
        ? 'AI Fire Detection Alert'
        : log.risk_level === 'DANGER' 
          ? 'Danger Level Detected'
          : 'Warning Level Detected',
      value: log.ai_fire_detected
        ? `Confidence: ${(log.ai_confidence * 100).toFixed(0)}%`
        : `Temperature: ${log.temp.toFixed(1)}°C, Smoke: ${log.mq_arduino} PPM`
    }))

  return (
    <MainLayout>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Real-time monitoring of fire detection sensors and environmental data</p>
        <div className="d-flex align-items-center gap-2 mt-2">
          <span className="badge bg-success">
            <i className="bi bi-wifi"></i> Live Data
          </span>
          <small style={{ color: 'var(--text-secondary)' }}>
            {sensorData.length} readings from Firestore
          </small>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-lg-3">
          <StatCard
            title="Temperature"
            value={`${latestLog.temp.toFixed(1)}°C`}
            icon="bi-thermometer-half"
            change={`+${(latestLog.temp - parseFloat(avgTemp)).toFixed(1)}°C`}
            changeType={latestLog.temp > parseFloat(avgTemp) ? 'positive' : 'neutral'}
            subtitle="from average"
          />
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <StatCard
            title="Humidity"
            value={`${latestLog.humidity.toFixed(1)}%`}
            icon="bi-droplet-half"
            change="Normal"
            changeType="neutral"
            subtitle="range"
          />
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <StatCard
            title="Smoke Level (PPM)"
            value={latestLog.mq_arduino}
            icon="bi-cloud-haze2"
            change={latestLog.mq_arduino < 300 ? 'Safe' : 'Elevated'}
            changeType={latestLog.mq_arduino < 300 ? 'positive' : 'negative'}
            subtitle="threshold"
          />
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-content">
                <h6>Risk Level</h6>
                <div className="stat-card-value">
                  <RiskBadge level={latestLog.risk_level} />
                </div>
              </div>
              <div className="stat-card-icon">
                <i className="bi bi-shield-check"></i>
              </div>
            </div>
            <div className="stat-card-footer">
              <span className="stat-change positive">All systems</span> operational
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-4">
          <ChartCard
            title="Temperature & Humidity"
            subtitle="DHT22 Sensor - Last 24 hours"
            labels={tempChartData.labels}
            datasets={tempChartData.datasets}
          />
        </div>

        <div className="col-12 col-lg-4">
          <ChartCard
            title="Smoke Detection"
            subtitle="MQ-135 Sensor - PPM Levels"
            labels={smokeChartData.labels}
            datasets={smokeChartData.datasets}
          />
        </div>

        <div className="col-12 col-lg-4">
          <ChartCard
            title="Light Level"
            subtitle="LDR Sensor - Daylight Detection"
            labels={lightChartData.labels}
            datasets={lightChartData.datasets}
          />
        </div>
      </div>

      {/* Nodes and Events Row */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-7">
          <SensorNodesTable nodes={sensorNodes} />
        </div>

        <div className="col-12 col-lg-5">
          <EventsList events={recentEvents} />
        </div>
      </div>
    </MainLayout>
  )
}

export default Dashboard

