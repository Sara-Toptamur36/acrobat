import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    }
  }

  componentDidCatch(error, errorInfo) {
    // Enhanced error logging with more context
    const errorDetails = {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      errorId: this.state.errorId || 'unknown'
    }

    console.group('🚨 ErrorBoundary - Application Error')
    console.error('Error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Full Context:', errorDetails)
    console.groupEnd()

    // Store error details in state
    this.setState({
      error: error,
      errorInfo: errorInfo
    })

    // Optional: Send error to monitoring service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: true
      })
    }
  }

  // Extract file location from stack trace
  extractFileLocation = (error) => {
    if (!error || !error.stack) return null
    
    const stackLines = error.stack.split('\n')
    for (const line of stackLines) {
      // Look for lines containing file paths (src/ or components/)
      const match = line.match(/at.*\((.*\/src\/.*):(\d+):(\d+)\)/) || 
                   line.match(/(\/src\/.*):(\d+):(\d+)/)
      if (match) {
        const [, filePath, lineNum, colNum] = match
        return {
          file: filePath.replace(/.*\/src\//, 'src/'),
          line: lineNum,
          column: colNum
        }
      }
    }
    return null
  }

  // Retry mechanism
  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: prevState.retryCount + 1
    }))
  }

  // Clear error state and go to safe route
  handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    })
    window.location.href = '/'
  }

  // Report error (placeholder for future implementation)
  handleReportError = () => {
    const errorReport = {
      errorId: this.state.errorId,
      error: this.state.error?.toString(),
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      retryCount: this.state.retryCount
    }
    
    console.log('Error Report Generated:', errorReport)
    
    // Copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => alert('Error report copied to clipboard'))
      .catch(() => alert('Could not copy error report'))
  }

  render() {
    if (this.state.hasError) {
      const fileLocation = this.extractFileLocation(this.state.error)
      const isNetworkError = this.state.error?.message?.includes('Network Error') || 
                            this.state.error?.code === 'NETWORK_ERROR'
      const isAuthError = this.state.error?.status === 401 || 
                         this.state.error?.code === 'UNAUTHORIZED'

      return (
        <div style={{
          minHeight: '100vh',
          padding: '20px',
          backgroundColor: '#fef2f2',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          lineHeight: '1.6'
        }}>
          <div style={{
            maxWidth: '900px',
            margin: '0 auto',
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #fca5a5',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ 
                color: '#dc2626', 
                marginBottom: '8px',
                fontSize: '24px',
                fontWeight: '600'
              }}>
                🚨 Application Error
              </h1>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                Error ID: {this.state.errorId} | Retry Count: {this.state.retryCount}
              </p>
            </div>

            {/* Error Type Detection */}
            {isNetworkError && (
              <div style={{
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <h3 style={{ color: '#92400e', margin: '0 0 8px 0' }}>🌐 Network Error</h3>
                <p style={{ color: '#92400e', margin: 0, fontSize: '14px' }}>
                  Cannot connect to the backend server. Please check if the server is running.
                </p>
              </div>
            )}

            {isAuthError && (
              <div style={{
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <h3 style={{ color: '#92400e', margin: '0 0 8px 0' }}>🔐 Authentication Error</h3>
                <p style={{ color: '#92400e', margin: 0, fontSize: '14px' }}>
                  Your session has expired. Please log in again.
                </p>
              </div>
            )}

            {/* File Location */}
            {fileLocation && (
              <div style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #0ea5e9',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <h3 style={{ color: '#0c4a6e', margin: '0 0 8px 0' }}>📍 Error Location</h3>
                <p style={{ color: '#0c4a6e', margin: 0, fontSize: '14px', fontFamily: 'monospace' }}>
                  {fileLocation.file}:{fileLocation.line}:{fileLocation.column}
                </p>
              </div>
            )}

            {/* Error Message */}
            {this.state.error && (
              <div style={{
                backgroundColor: '#fef2f2',
                padding: '16px',
                borderRadius: '6px',
                marginBottom: '16px',
                border: '1px solid #fecaca'
              }}>
                <h3 style={{ color: '#dc2626', marginBottom: '8px', fontSize: '16px' }}>
                  Error Details:
                </h3>
                <pre style={{
                  color: '#7f1d1d',
                  fontSize: '14px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace'
                }}>
                  {this.state.error.toString()}
                </pre>
              </div>
            )}

            {/* Component Stack */}
            {this.state.errorInfo && (
              <details style={{ marginBottom: '20px' }}>
                <summary style={{
                  cursor: 'pointer',
                  padding: '8px',
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  📋 Component Stack Trace
                </summary>
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '12px',
                  borderRadius: '0 0 4px 4px',
                  border: '1px solid #e5e7eb',
                  borderTop: 'none'
                }}>
                  <pre style={{
                    color: '#6b7280',
                    fontSize: '12px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: '200px',
                    overflow: 'auto',
                    margin: 0,
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace'
                  }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              marginTop: '20px'
            }}>
              <button
                onClick={this.handleRetry}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
              >
                🔄 Try Again
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#047857'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#059669'}
              >
                🏠 Go Home
              </button>

              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#6d28d9'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#7c3aed'}
              >
                ↻ Reload Page
              </button>

              <button
                onClick={this.handleReportError}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#4b5563'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#6b7280'}
              >
                📋 Copy Error Report
              </button>
            </div>

            {/* Help Text */}
            <div style={{
              marginTop: '20px',
              padding: '12px',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              border: '1px solid #e2e8f0'
            }}>
              <h4 style={{ color: '#475569', margin: '0 0 8px 0', fontSize: '14px' }}>
                💡 What to do next:
              </h4>
              <ul style={{ color: '#64748b', fontSize: '13px', margin: 0, paddingLeft: '20px' }}>
                <li>Try clicking "Try Again" to retry the failed operation</li>
                <li>Click "Go Home" to return to the main page</li>
                <li>If the error persists, try reloading the page</li>
                <li>Copy the error report and contact support if needed</li>
                {isNetworkError && <li><strong>Check if the backend server is running on port 5000</strong></li>}
                {isAuthError && <li><strong>Clear your browser cache and log in again</strong></li>}
              </ul>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
