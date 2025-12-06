import React from 'react'

const TopNavbar: React.FC = () => {
  return (
    <div className="top-navbar">
      <div className="navbar-search">
        <input 
          type="text" 
          className="form-control" 
          placeholder="Search sensor data, events, or nodes..."
        />
      </div>
      <div className="navbar-actions">
        <button className="navbar-btn">
          <i className="bi bi-bell"></i>
          <span className="badge bg-danger">3</span>
        </button>
        <button className="navbar-btn">
          <i className="bi bi-gear"></i>
        </button>
        <div className="user-avatar">
          <i className="bi bi-person"></i>
        </div>
      </div>
    </div>
  )
}

export default TopNavbar

