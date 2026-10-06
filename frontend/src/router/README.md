# React Router Configuration

This directory contains the complete routing configuration for the Music Catalog application.

## File Structure

```
src/router/
├── AppRouter.jsx     # Main router component with all route definitions
├── routes.js         # Route constants and helper functions
└── README.md         # This documentation
```

## Route Structure

### Public Routes (No Authentication Required)
- `/` - Landing page
- `/login` - User login
- `/register` - User registration  
- `/unauthorized` - Access denied page

### Protected Routes (Authentication Required)
All protected routes are prefixed with `/app` and require user authentication:

- `/app` - Redirects to `/app/dashboard`
- `/app/dashboard` - Main dashboard

#### Content Management Routes
- `/app/artists` - Artists listing
- `/app/artists/:id` - Individual artist details
- `/app/albums` - Albums listing  
- `/app/albums/:id` - Individual album details
- `/app/songs` - Songs listing
- `/app/songs/:id` - Individual song details
- `/app/playlists` - Playlists listing
- `/app/playlists/:id` - Individual playlist details

#### Admin-Only Routes (Require Admin Role)
- `/app/reports` - Reports dashboard
- `/app/reports/genres` - Genre analytics report
- `/app/reports/albums` - Album analytics report
- `/app/admin` - Admin control panel

## Usage

### Basic Setup

```jsx
// main.jsx or index.js
import App from './App'

ReactDOM.render(<App />, document.getElementById('root'))
```

### Navigation

```jsx
import { Link } from 'react-router-dom'
import { ROUTES, routeHelpers } from './router/routes'

// Static routes
<Link to={ROUTES.APP.DASHBOARD}>Dashboard</Link>

// Dynamic routes
<Link to={routeHelpers.artistDetail(123)}>Artist 123</Link>
```

### Programmatic Navigation

```jsx
import { useNavigate } from 'react-router-dom'
import { ROUTES } from './router/routes'

const navigate = useNavigate()

// Navigate to dashboard
navigate(ROUTES.APP.DASHBOARD)

// Navigate with replacement
navigate(ROUTES.PUBLIC.LOGIN, { replace: true })
```

## Route Protection

### Authentication Protection
All `/app/*` routes are protected by `ProtectedRoute` component:
- Redirects unauthenticated users to `/login`
- Preserves intended destination for post-login redirect

### Admin Protection  
Admin routes are additionally protected by `AdminRoute` component:
- Redirects non-admin users to `/unauthorized`
- Requires both authentication and admin role

### Protection Hierarchy
```
ProtectedRoute (Authentication)
  └── AppLayout (Layout wrapper)
      └── AdminRoute (Admin authorization)
          └── Admin Components
```

## Route Constants

Use the `ROUTES` object from `routes.js` instead of hardcoding paths:

```jsx
// ❌ Don't do this
navigate('/app/dashboard')

// ✅ Do this
import { ROUTES } from './router/routes'
navigate(ROUTES.APP.DASHBOARD)
```

## Helper Functions

### Route Helpers
```jsx
import { routeHelpers } from './router/routes'

// Generate dynamic routes
const artistUrl = routeHelpers.artistDetail(artistId)
const albumUrl = routeHelpers.albumDetail(albumId)

// Check route types
const isAdmin = routeHelpers.isAdminRoute('/app/reports') // true
const isPublic = routeHelpers.isPublicRoute('/login') // true
```

### Navigation Configuration
```jsx
import { NAVIGATION } from './router/routes'

// Base navigation for all users
const userNav = NAVIGATION.BASE

// Admin navigation items
const adminNav = NAVIGATION.ADMIN
```

## Adding New Routes

### 1. Add Route Constant
```jsx
// routes.js
export const ROUTES = {
  APP: {
    // ... existing routes
    NEW_FEATURE: '/app/new-feature'
  }
}
```

### 2. Add Route Definition
```jsx
// AppRouter.jsx
<Route path="new-feature" element={<NewFeature />} />
```

### 3. Add Navigation Item (Optional)
```jsx
// routes.js
export const NAVIGATION = {
  BASE: [
    // ... existing items
    { name: 'New Feature', href: ROUTES.APP.NEW_FEATURE }
  ]
}
```

## Best Practices

1. **Use Route Constants**: Always import routes from `routes.js`
2. **Consistent Prefixing**: All protected routes use `/app` prefix
3. **Nested Protection**: Apply protection at layout level, not individual routes
4. **Helper Functions**: Use route helpers for dynamic routes
5. **Documentation**: Update this README when adding new routes

## Error Handling

- **404 Routes**: Catch-all route redirects to `/app/dashboard`
- **Unauthorized Access**: Admin routes redirect to `/unauthorized`
- **Unauthenticated Access**: Protected routes redirect to `/login`

## Testing Routes

```jsx
// Test route protection
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AppRouter from './AppRouter'

// Test protected route redirect
render(
  <MemoryRouter initialEntries={['/app/dashboard']}>
    <AppRouter />
  </MemoryRouter>
)
```
