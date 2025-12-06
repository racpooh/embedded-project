import React from 'react'

interface StatCardProps {
  title: string
  value: string | number
  icon: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  subtitle?: string
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  change, 
  changeType = 'neutral',
  subtitle 
}) => {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div className="stat-card-content">
          <h6>{title}</h6>
          <div className="stat-card-value">{value}</div>
        </div>
        <div className="stat-card-icon">
          <i className={`bi ${icon}`}></i>
        </div>
      </div>
      {(change || subtitle) && (
        <div className="stat-card-footer">
          {change && (
            <span className={`stat-change ${changeType}`}>{change}</span>
          )}
          {subtitle && ` ${subtitle}`}
        </div>
      )}
    </div>
  )
}

export default StatCard

