import { Link } from 'react-router-dom'

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-red-600 text-3xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page. This area is restricted to administrators only.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
            <p className="text-sm text-yellow-800">
              <span className="font-medium">Need admin access?</span> Contact your system administrator to request the necessary permissions.
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          <Link 
            to="/app/dashboard" 
            className="block w-full bg-primary-600 text-white py-3 px-4 rounded-md hover:bg-primary-700 transition-colors font-medium"
          >
            📊 Go to Dashboard
          </Link>
          <Link 
            to="/app/songs" 
            className="block w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
          >
            🎵 Browse Songs
          </Link>
          <Link 
            to="/" 
            className="block w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            🏠 Back to Home
          </Link>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Unauthorized
