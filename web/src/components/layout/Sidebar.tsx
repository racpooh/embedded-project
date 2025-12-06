import React from 'react'

const Sidebar: React.FC = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h4>Household Fire Detection</h4>
        <small>IoT Monitoring System</small>
      </div>

      <div className="nav-section">
        <a href="#" className="nav-link active">
          <i className="bi bi-speedometer2"></i>
          Dashboard
        </a>
      </div>
    </div>
  )
}

export default Sidebar

