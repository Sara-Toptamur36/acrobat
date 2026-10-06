import { BrowserRouter as Router } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { PlayerProvider } from './contexts/PlayerContext'
import AppRouter from './router/AppRouter'
import ErrorBoundary from './components/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <PlayerProvider>
            <AppRouter />
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#4ade80',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </PlayerProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  )
}
