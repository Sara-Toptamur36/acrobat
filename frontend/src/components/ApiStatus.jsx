import { useState, useEffect } from 'react'
import { healthApi } from '../services/api'

const ApiStatus = () => {
  const [status, setStatus] = useState('checking')
  const [message, setMessage] = useState('Checking backend connection...')

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await healthApi.check()
        if (response.data.success) {
          setStatus('healthy')
          setMessage('Backend OK - API is running')
        } else {
          setStatus('unhealthy')
          setMessage('Backend FAIL - API returned error')
        }
      } catch (error) {
        setStatus('unhealthy')
        setMessage(`Backend FAIL - ${error.message || 'Connection failed'}`)
      }
    }

    checkHealth()
    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = () => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200'
      case 'unhealthy': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'healthy': return '✅'
      case 'unhealthy': return '❌'
      default: return '⏳'
    }
  }

  return (
    <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg border text-sm font-medium z-50 ${getStatusColor()}`}>
      <div className="flex items-center space-x-2">
        <span>{getStatusIcon()}</span>
        <span>{message}</span>
      </div>
    </div>
  )
}

export default ApiStatus
