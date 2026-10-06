# Route Guards

This directory contains route guard components for protecting routes based on authentication and authorization.

## Components

### ProtectedRoute
Protects routes that require authentication. Redirects unauthenticated users to login with return URL preservation.

```jsx
import ProtectedRoute from './components/ProtectedRoute'

<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

### AdminRoute
Protects routes that require admin privileges. Must be used inside ProtectedRoute.

```jsx
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

<Route path="/admin" element={
  <ProtectedRoute>
    <AdminRoute>
      <AdminPanel />
    </AdminRoute>
  </ProtectedRoute>
} />
```

## Redirect Flow

1. **Unauthenticated user** → `/login` (with return URL preserved)
2. **Authenticated non-admin user accessing admin route** → `/unauthorized`
3. **Successful login** → Original intended page or `/dashboard`

## Pages

### Unauthorized
A user-friendly page shown when authenticated users try to access admin-only content.

## Usage Examples

```jsx
// Public route
<Route path="/login" element={<Login />} />

// Protected route (any authenticated user)
<Route path="/profile" element={
  <ProtectedRoute>
    <Profile />
  </ProtectedRoute>
} />

// Admin-only route
<Route path="/reports" element={
  <ProtectedRoute>
    <AdminRoute>
      <Reports />
    </AdminRoute>
  </ProtectedRoute>
} />
```
