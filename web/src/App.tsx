import { useEffect, useState } from 'react'
import { initializeFirebase, signInAnonymouslyOnce } from './lib/firebase'
import Dashboard from './pages/Dashboard'
import './App.css'

function App() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        initializeFirebase()
        await signInAnonymouslyOnce()
        setIsInitialized(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize Firebase')
      }
    }
    init()
  }, [])

  if (error) {
    return (
      <div className="error-container">
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    )
  }

  if (!isInitialized) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <h2 style={{ marginTop: '1rem' }}>Initializing...</h2>
      </div>
    )
  }

  return <Dashboard />
}

export default App
