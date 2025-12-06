import React from 'react'

interface SensorNode {
  nodeId: string
  sensorType: string
  status: 'active' | 'inactive' | 'warning'
  lastUpdate: string
  reading: string
}

interface SensorNodesTableProps {
  nodes: SensorNode[]
}

const SensorNodesTable: React.FC<SensorNodesTableProps> = ({ nodes }) => {
  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: 'bg-success',
      inactive: 'bg-secondary',
      warning: 'bg-warning'
    }
    return statusMap[status as keyof typeof statusMap] || 'bg-secondary'
  }

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h5>Sensor Nodes Status</h5>
        <p>Active monitoring nodes and their current state</p>
      </div>
      <div className="table-responsive">
        <table className="table table-borderless align-middle">
          <thead>
            <tr style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
              <th>NODE ID</th>
              <th>SENSOR TYPE</th>
              <th>STATUS</th>
              <th>LAST UPDATE</th>
              <th>READING</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((node, index) => (
              <tr key={index}>
                <td><strong>{node.nodeId}</strong></td>
                <td>{node.sensorType}</td>
                <td>
                  <span className={`badge ${getStatusBadge(node.status)}`}>
                    {node.status.charAt(0).toUpperCase() + node.status.slice(1)}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {node.lastUpdate}
                </td>
                <td><strong>{node.reading}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SensorNodesTable

