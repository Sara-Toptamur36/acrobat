# AppLayout Component

A responsive main application layout with sidebar navigation, topbar, and role-based menu rendering.

## Features

- **Responsive Design**: Mobile-first with collapsible sidebar
- **Role-based Navigation**: Different menu items for regular users vs admins
- **React Router Integration**: Uses `<Outlet />` for nested routing
- **No External Dependencies**: Uses only Tailwind CSS and inline SVG icons
- **User Management**: Displays user info and logout functionality

## Usage

### Basic Setup with React Router

```jsx
import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      
      {/* Protected routes with layout */}
      <Route element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/artists" element={<Artists />} />
        
        {/* Admin-only routes */}
        <Route path="/reports" element={
          <AdminRoute>
            <Reports />
          </AdminRoute>
        } />
      </Route>
    </Routes>
  )
}
```

## Menu Structure

### Regular Users See:
- Dashboard
- Artists
- Albums
- Songs
- Playlists

### Admin Users See:
- All regular user items
- **Administration section:**
  - Reports (with distinct styling)

## Customization

### Adding New Menu Items

Edit the navigation arrays in `AppLayout.jsx`:

```jsx
// For all users
const baseNavigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'New Feature', href: '/new-feature' },
  // ...
]

// For admins only
const adminNavigation = [
  { name: 'Reports', href: '/reports' },
  { name: 'Admin Panel', href: '/admin' },
  // ...
]
```

### Styling Customization

The component uses Tailwind CSS classes. Key customization points:

- **Sidebar width**: Change `w-64` class
- **Colors**: Modify `primary-*` and `red-*` color classes
- **Active states**: Update the conditional classes in navigation links
- **Mobile breakpoint**: Adjust `lg:` responsive prefixes

### Icons

Currently uses simple SVG icons and Unicode symbols. To add custom icons:

```jsx
// Replace the simple dot indicators with custom icons
<span className="mr-3 w-5 h-5 flex-shrink-0">
  <YourCustomIcon />
</span>
```

## Mobile Behavior

- **< 1024px**: Sidebar hidden by default, accessible via hamburger menu
- **≥ 1024px**: Sidebar always visible, no mobile topbar

## Authentication Integration

Requires `useAuth()` hook that provides:
- `user`: Current user object with `username` and `role`
- `logout()`: Function to log out the user
- `isAdmin()`: Function returning boolean for admin status

## Accessibility

- Keyboard navigation support
- Screen reader friendly
- Focus management for mobile menu
- Semantic HTML structure
