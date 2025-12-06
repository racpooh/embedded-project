import React, { ReactNode } from 'react'
import Sidebar from './Sidebar'

interface MainLayoutProps {
  children: ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <>
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
    </>
  )
}

export default MainLayout

