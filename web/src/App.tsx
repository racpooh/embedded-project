import { useEffect, useState } from 'react'
import { initializeFirebase, signInAnonymously } from './lib/firebase'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        initializeFirebase()
        await signInAnonymously()
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
        <h1>Initializing...</h1>
      </div>
    )
  }

  return <Dashboard />
}

export default App

