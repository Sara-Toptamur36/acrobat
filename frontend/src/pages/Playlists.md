# Playlists Management Page

## Overview
The Playlists page provides a comprehensive interface for managing user playlists with full CRUD operations, search functionality, and pagination.

## Features

### Core Functionality
- **List View**: Display all user playlists with pagination
- **Search**: Real-time search across playlist names
- **Create**: Add new playlists with validation
- **Edit**: Update playlist names (owner only)
- **Delete**: Remove playlists with confirmation (owner only)
- **Navigation**: Direct links to playlist detail pages

### User Interface
- **Responsive Design**: Works on desktop and mobile devices
- **Loading States**: Skeleton loading during data fetch
- **Empty States**: Helpful messages when no playlists exist
- **Error Handling**: Toast notifications for user feedback
- **Modal Forms**: Clean modal interfaces for CRUD operations

### Data Display
- **Playlist Name**: Clickable links to detail pages
- **Song Count**: Number of songs in each playlist
- **Created Date**: When the playlist was created
- **Actions**: Edit and delete buttons for playlist owners

## Technical Implementation

### State Management
```javascript
const [playlists, setPlaylists] = useState([])
const [loading, setLoading] = useState(true)
const [pagination, setPagination] = useState({})
const [search, setSearch] = useState('')
const [currentPage, setCurrentPage] = useState(1)
const [showCreateModal, setShowCreateModal] = useState(false)
const [showEditModal, setShowEditModal] = useState(false)
const [showDeleteModal, setShowDeleteModal] = useState(false)
const [selectedPlaylist, setSelectedPlaylist] = useState(null)
const [formData, setFormData] = useState({ name: '' })
const [formErrors, setFormErrors] = useState({})
const [formLoading, setFormLoading] = useState(false)
```

### API Integration
- **GET /playlists**: Fetch user playlists with pagination and search
- **POST /playlists**: Create new playlist
- **PUT /playlists/:id**: Update playlist name
- **DELETE /playlists/:id**: Delete playlist

### Form Validation
- **Required Fields**: Playlist name is mandatory
- **Real-time Validation**: Clear errors as user types
- **Server Validation**: Handle backend validation errors

### Search & Pagination
- **Debounced Search**: Efficient search implementation
- **URL Parameters**: Search and pagination via query params
- **Clear Search**: Easy way to reset search filters

## Component Structure

### Main Component
- **Playlists.jsx**: Main playlist management component

### Reusable Components
- **Table**: Displays playlist data in tabular format
- **Pagination**: Handles page navigation
- **Modal**: Provides modal dialogs for forms

### Dependencies
- **React Router**: Navigation and routing
- **React Hot Toast**: User notifications
- **Auth Context**: User authentication state

## Usage Examples

### Basic Usage
```jsx
import Playlists from './pages/Playlists'

// In your router
<Route path="/app/playlists" element={<Playlists />} />
```

### Navigation
```jsx
import { routeHelpers } from '../router/routes'

// Navigate to playlists
<Link to={routeHelpers.playlists()}>My Playlists</Link>

// Navigate to specific playlist
<Link to={routeHelpers.playlistDetail(playlistId)}>View Playlist</Link>
```

## Accessibility Features
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Proper ARIA labels and roles
- **Focus Management**: Logical tab order
- **Color Contrast**: Meets WCAG guidelines

## Performance Considerations
- **Pagination**: Limits data load per request
- **Debounced Search**: Reduces API calls
- **Loading States**: Provides immediate user feedback
- **Error Boundaries**: Graceful error handling

## Security Features
- **Owner Validation**: Only playlist owners can edit/delete
- **Input Sanitization**: Prevents XSS attacks
- **JWT Authentication**: Secure API access
- **CSRF Protection**: Built into API layer

## Future Enhancements
- **Bulk Operations**: Select and delete multiple playlists
- **Playlist Templates**: Create playlists from templates
- **Sharing**: Share playlists with other users
- **Export**: Export playlist data
- **Advanced Search**: Filter by creation date, song count, etc.
