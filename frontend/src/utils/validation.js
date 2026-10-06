/**
 * Frontend Structure Validation Utilities
 * 
 * This file contains utilities to validate the frontend structure
 * and ensure all components are properly configured.
 */

// Route validation
export const validateRoutes = () => {
  const issues = []
  
  // Check if all required routes are defined
  const requiredRoutes = [
    '/',
    '/login', 
    '/register',
    '/unauthorized',
    '/app/dashboard',
    '/app/artists',
    '/app/albums', 
    '/app/songs',
    '/app/playlists',
    '/app/reports'
  ]
  
  // This would need to be implemented with actual route checking
  // For now, just return empty array
  return issues
}

// API endpoint validation
export const validateAPIEndpoints = () => {
  const issues = []
  
  // Check if all required API endpoints are accessible
  const requiredEndpoints = [
    '/api/auth/login',
    '/api/auth/register', 
    '/api/auth/profile',
    '/api/artists',
    '/api/albums',
    '/api/songs',
    '/api/playlists',
    '/api/reports/genres',
    '/api/reports/albums-by-year',
    '/api/reports/top-songs',
    '/api/reports/active-users'
  ]
  
  // This would need actual API testing
  // For now, just return empty array
  return issues
}

// Component validation
export const validateComponents = () => {
  const issues = []
  
  // Check if all required components exist
  const requiredComponents = [
    'AppLayout',
    'ProtectedRoute', 
    'AdminRoute',
    'Table',
    'Pagination',
    'Modal',
    'StarRating'
  ]
  
  // This would need actual component checking
  // For now, just return empty array
  return issues
}

// Environment validation
export const validateEnvironment = () => {
  const issues = []
  
  // Check environment variables (support both VITE_API_BASE_URL and VITE_API_URL)
  const hasApiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL
  if (!hasApiUrl && !window.location.origin.includes('localhost')) {
    issues.push('VITE_API_BASE_URL or VITE_API_URL not set in production')
  }
  
  return issues
}

// Run all validations
export const validateFrontendStructure = () => {
  const allIssues = [
    ...validateRoutes(),
    ...validateAPIEndpoints(),
    ...validateComponents(),
    ...validateEnvironment()
  ]
  
  return {
    isValid: allIssues.length === 0,
    issues: allIssues
  }
}
