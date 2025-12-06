import React from 'react'

interface RiskBadgeProps {
  level: 'NORMAL' | 'WARNING' | 'DANGER'
}

const RiskBadge: React.FC<RiskBadgeProps> = ({ level }) => {
  return (
    <span className={`risk-badge ${level.toLowerCase()}`}>
      {level}
    </span>
  )
}

export default RiskBadge

