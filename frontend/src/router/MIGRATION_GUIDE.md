# Router Migration Guide

This guide helps migrate from the old routing structure to the new `/app` prefixed structure.

## Route Changes

### Old Routes → New Routes

| Old Route | New Route | Notes |
|-----------|-----------|-------|
| `/dashboard` | `/app/dashboard` | Main dashboard |
| `/artists` | `/app/artists` | Artists listing |
| `/artists/:id` | `/app/artists/:id` | Artist details |
| `/albums` | `/app/albums` | Albums listing |
| `/albums/:id` | `/app/albums/:id` | Album details |
| `/songs` | `/app/songs` | Songs listing |
| `/songs/:id` | `/app/songs/:id` | Song details |
| `/playlists` | `/app/playlists` | Playlists listing |
| `/playlists/:id` | `/app/playlists/:id` | Playlist details |
| `/reports` | `/app/reports` | Reports (admin only) |
| `/reports/genres` | `/app/reports/genres` | Genre report (admin only) |
| `/reports/top-songs` | `/app/reports/top-songs` | **Removed** |
| `/reports/albums-by-year` | `/app/reports/albums` | Albums report (admin only) |
| `/reports/active-users` | **Removed** | No longer available |
| **New** | `/app/admin` | Admin panel (admin only) |

## Integration Steps

### 1. Update Existing Page Imports

Replace the placeholder components in `AppRouter.jsx` with your actual page components:

```jsx
// Replace these placeholder components
const Dashboard = () => <div>Dashboard Page</div>
const Artists = () => <div>Artists Page</div>

// With your actual imports
import Dashboard from '../pages/Dashboard'
import Artists from '../pages/Artists'
import ArtistDetail from '../pages/ArtistDetail'
// ... etc
```

### 2. Update Navigation Links

Update any hardcoded navigation links in your components:

```jsx
// ❌ Old way
<Link to="/dashboard">Dashboard</Link>
<Link to="/artists">Artists</Link>

// ✅ New way
import { ROUTES } from '../router/routes'
<Link to={ROUTES.APP.DASHBOARD}>Dashboard</Link>
<Link to={ROUTES.APP.ARTISTS}>Artists</Link>
```

### 3. Update Programmatic Navigation

Update `useNavigate` calls:

```jsx
// ❌ Old way
navigate('/dashboard')
navigate('/artists/123')

// ✅ New way
import { ROUTES, routeHelpers } from '../router/routes'
navigate(ROUTES.APP.DASHBOARD)
navigate(routeHelpers.artistDetail(123))
```

### 4. Update Form Redirects

Update form submission redirects:

```jsx
// ❌ Old way
const handleSubmit = async () => {
  await createArtist(data)
  navigate('/artists')
}

// ✅ New way
const handleSubmit = async () => {
  await createArtist(data)
  navigate(ROUTES.APP.ARTISTS)
}
```

### 5. Update API Redirects

Update any API error handling that redirects:

```jsx
// ❌ Old way
if (error.status === 401) {
  navigate('/login')
}

// ✅ New way
if (error.status === 401) {
  navigate(ROUTES.PUBLIC.LOGIN)
}
```

## Complete AppRouter.jsx with Real Components

```jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import AppLayout from '../components/AppLayout'
import ProtectedRoute from '../components/ProtectedRoute'
import AdminRoute from '../components/AdminRoute'

// Public pages
import Landing from '../pages/Landing'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Unauthorized from '../pages/Unauthorized'

// Protected pages - Replace placeholders with actual imports
import Dashboard from '../pages/Dashboard'
import Artists from '../pages/Artists'
import ArtistDetail from '../pages/ArtistDetail'
import Albums from '../pages/Albums'
import AlbumDetail from '../pages/AlbumDetail'
import Songs from '../pages/Songs'
import SongDetail from '../pages/SongDetail'
import Playlists from '../pages/Playlists'
import PlaylistDetail from '../pages/PlaylistDetail'
import Reports from '../pages/Reports'
import GenreReport from '../pages/reports/GenreReport'
import AlbumReport from '../pages/reports/AlbumReport'

// New admin page - needs to be created
const AdminPanel = () => <div>Admin Panel - To be implemented</div>

const AppRouter = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected routes with /app prefix */}
        <Route path="/app" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          <Route path="artists" element={<Artists />} />
          <Route path="artists/:id" element={<ArtistDetail />} />
          
          <Route path="albums" element={<Albums />} />
          <Route path="albums/:id" element={<AlbumDetail />} />
          
          <Route path="songs" element={<Songs />} />
          <Route path="songs/:id" element={<SongDetail />} />
          
          <Route path="playlists" element={<Playlists />} />
          <Route path="playlists/:id" element={<PlaylistDetail />} />
          
          {/* Admin routes */}
          <Route path="reports" element={
            <AdminRoute><Reports /></AdminRoute>
          } />
          <Route path="reports/genres" element={
            <AdminRoute><GenreReport /></AdminRoute>
          } />
          <Route path="reports/albums" element={
            <AdminRoute><AlbumReport /></AdminRoute>
          } />
          <Route path="admin" element={
            <AdminRoute><AdminPanel /></AdminRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default AppRouter
```

## Testing the Migration

1. **Start the development server**
2. **Test public routes**: `/`, `/login`, `/register`
3. **Test authentication flow**: Login should redirect to `/app/dashboard`
4. **Test protected routes**: All `/app/*` routes should require authentication
5. **Test admin routes**: `/app/reports/*` and `/app/admin` should require admin role
6. **Test navigation**: Sidebar navigation should work correctly
7. **Test direct URL access**: Typing URLs directly should work with proper redirects

## Rollback Plan

If issues arise, you can temporarily revert by:

1. Restoring the old `App.jsx` from git history
2. Commenting out the new router files
3. Using the old `Layout.jsx` component

The new router is designed to be a drop-in replacement, so rollback should be straightforward.
