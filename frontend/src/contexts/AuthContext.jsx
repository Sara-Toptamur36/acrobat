import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api, authApi, tokenManager } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initializationComplete, setInitializationComplete] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Derived state
  const isAuthenticated = Boolean(user && token)
  const role = user?.role || null

  // Clear all authentication state
  const clearAuthState = useCallback(() => {
    setToken(null)
    setUser(null)
    tokenManager.removeToken()
    localStorage.removeItem('user')
  }, [])

  // Initialize authentication state from localStorage
  const initializeFromStorage = useCallback(async () => {
    setLoading(true)

    try {
      const storedToken = tokenManager.getToken()
      const storedUser = localStorage.getItem('user')

      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser)

          // Set token in API service first
          tokenManager.setToken(storedToken)

          // Set initial state from localStorage immediately
          setToken(storedToken)
          setUser(userData)

          // Try to verify token in background (don't block UI)
          try {
            const response = await authApi.getProfile()
            const currentUser = response.data.data

            // Update with fresh user data if API call succeeds
            setUser(currentUser)
            localStorage.setItem('user', JSON.stringify(currentUser))
          } catch (apiError) {
            // API call failed, but we'll keep the stored data for now
            // The user can still use the app, and we'll handle auth errors when they occur
            console.warn('Could not verify token with server, using stored data:', apiError.message)
          }
        } catch (parseError) {
          // Stored data is corrupted, clear everything
          console.warn('Stored auth data is corrupted, clearing auth state')
          clearAuthState()
        }
      } else {
        // No stored auth data - user is not logged in
        clearAuthState()
      }
    } catch (error) {
      console.error('Error initializing auth from storage:', error)
      clearAuthState()
    } finally {
      setLoading(false)
      setInitializationComplete(true)
    }
  }, [clearAuthState])

  // Initialize on mount
  useEffect(() => {
    initializeFromStorage()
  }, [initializeFromStorage])

  // Login with token and user data (primary method)
  const login = useCallback((authToken, userData) => {
    if (!authToken || !userData) {
      throw new Error('Token and user data are required for login')
    }

    // Update state
    setToken(authToken)
    setUser(userData)

    // Persist to localStorage
    tokenManager.setToken(authToken)
    localStorage.setItem('user', JSON.stringify(userData))

    toast.success('Login successful!')

    // Redirect to intended page or dashboard based on role
    const from = location.state?.from?.pathname
    if (from) {
      navigate(from, { replace: true })
    } else if (userData.is_admin || userData.role === 'admin') {
      navigate('/admin', { replace: true })
    } else {
      navigate('/app/dashboard', { replace: true })
    }
  }, [location.state, navigate])

  // Logout and clear all state
  const logout = useCallback(() => {
    clearAuthState()
    navigate('/login')
    toast.success('Logged out successfully')
  }, [clearAuthState, navigate])

  // Legacy login method for backwards compatibility (email/password)
  const loginWithCredentials = useCallback(async (email, password) => {
    try {
      const response = await authApi.login(email, password)
      const { access_token, user: userData } = response.data.data

      // Use the primary login method
      login(access_token, userData)
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Login failed'
      toast.error(message)
      throw error
    }
  }, [login])

  // Register method
  const register = useCallback(async (username, email, password) => {
    try {
      const response = await authApi.register(username, email, password)
      const { access_token, user: userData } = response.data.data

      // Use the primary login method
      login(access_token, userData)
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Registration failed'
      toast.error(message)
      throw error
    }
  }, [login])

  // Update user data after profile change
  const updateUserData = useCallback((newData) => {
    if (!newData) return
    const updatedUser = { ...user, ...newData }
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }, [user])

  // Role-based access helpers
  const isAdmin = useCallback(() => {
    return user?.is_admin === true || role === 'admin'
  }, [user, role])

  const hasRole = useCallback((requiredRole) => {
    return role === requiredRole || (requiredRole === 'admin' && user?.is_admin === true)
  }, [role, user])

  const value = {
    // State (as required)
    user,
    token,
    role,
    isAuthenticated,
    loading,
    initializationComplete,

    // Actions (as required)
    login, // Primary login method (token, user)
    logout,
    initializeFromStorage,
    updateUserData,

    // Legacy methods for backwards compatibility
    loginWithCredentials, // For email/password login
    register,

    // Role helpers
    isAdmin,
    hasRole
  }

  // AuthProvider NEVER blocks rendering - always render children
  // Individual route guards (ProtectedRoute, AdminRoute) handle their own loading states
  // This ensures public routes (/, /login, /register) render immediately
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
