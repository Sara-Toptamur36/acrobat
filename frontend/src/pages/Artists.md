# Artists Management System

Comprehensive Artists management with list view, detail view, and full CRUD operations.

## Components Overview

### 1. Artists List (`Artists.jsx`)
- **Purpose**: Main listing page with search, pagination, and management actions
- **Features**: Create, edit, delete artists with proper confirmation dialogs
- **Access Control**: Admin-only create/edit/delete operations

### 2. Artist Detail (`ArtistDetail.jsx`)  
- **Purpose**: Individual artist page showing info and associated albums
- **Features**: Artist information display, albums listing with pagination
- **Access Control**: Admin-only edit/delete operations

## State Management Structure

### Artists List State
```javascript
const [artists, setArtists] = useState([])           // Artist data array
const [loading, setLoading] = useState(true)         // Loading state for list
const [pagination, setPagination] = useState({})     // Pagination metadata
const [search, setSearch] = useState('')             // Search query
const [currentPage, setCurrentPage] = useState(1)    // Current page number

// Modal states
const [showCreateModal, setShowCreateModal] = useState(false)
const [showEditModal, setShowEditModal] = useState(false)
const [showDeleteModal, setShowDeleteModal] = useState(false)
const [selectedArtist, setSelectedArtist] = useState(null)

// Form states
const [formData, setFormData] = useState({ name: '', bio: '' })
const [formErrors, setFormErrors] = useState({})
const [formLoading, setFormLoading] = useState(false)
```

### Artist Detail State
```javascript
const [artist, setArtist] = useState(null)           // Artist data object
const [albums, setAlbums] = useState([])             // Associated albums
const [loading, setLoading] = useState(true)         // Loading state for artist
const [albumsLoading, setAlbumsLoading] = useState(true) // Loading state for albums
const [pagination, setPagination] = useState({})     // Albums pagination
const [currentPage, setCurrentPage] = useState(1)    // Albums page number

// Modal and form states (same as list)
```

## API Functions Used

### Artists List Operations

#### 1. Fetch Artists
```javascript
GET /artists?page={page}&limit=20&search={search}
```
**Response Format:**
```json
{
  "data": {
    "artists": [
      {
        "artist_id": 1,
        "name": "Artist Name",
        "bio": "Artist biography",
        "album_count": 5
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

#### 2. Create Artist
```javascript
POST /artists
```
**Request Body:**
```json
{
  "name": "Artist Name",
  "bio": "Optional biography"
}
```

#### 3. Update Artist
```javascript
PUT /artists/{id}
```
**Request Body:**
```json
{
  "name": "Updated Name",
  "bio": "Updated biography"
}
```

#### 4. Delete Artist
```javascript
DELETE /artists/{id}
```
**Constraints:** Can only delete artists with no albums (409 error if albums exist)

### Artist Detail Operations

#### 1. Fetch Artist Data
```javascript
// No individual artist endpoint - fetch from list and filter
GET /artists?page=1&limit=100
// Filter by artist_id on frontend
```

#### 2. Fetch Artist Albums
```javascript
GET /albums?artist_id={id}&page={page}&limit=10
```
**Response Format:**
```json
{
  "data": {
    "albums": [
      {
        "album_id": 1,
        "title": "Album Title",
        "release_year": 2023,
        "song_count": 12
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

## Component Features

### Reusable Table Component
- **Configurable columns** with custom render functions
- **Loading states** with skeleton animations
- **Empty states** with appropriate messaging
- **Responsive design** with horizontal scrolling
- **Hover effects** for better UX

### Modal System
- **Create Artist Modal**: Form for adding new artists
- **Edit Artist Modal**: Pre-populated form for updates
- **Delete Confirmation Modal**: Safety confirmation with warnings
- **Keyboard support** (ESC to close)
- **Click outside to close**
- **Form validation** with error display

### Pagination Component
- **Smart page number display** with ellipsis for large ranges
- **Mobile-responsive** with simplified controls
- **Accessible** with proper ARIA labels
- **Item count display** showing current range

## Form Validation

### Client-Side Validation
```javascript
const validateForm = () => {
  const errors = {}
  if (!formData.name.trim()) {
    errors.name = 'Artist name is required'
  }
  return errors
}
```

### Server-Side Error Handling
```javascript
const handleApiError = (error) => {
  if (error.response?.data?.details) {
    // Field-specific errors from backend
    const fieldErrors = {}
    error.response.data.details.forEach(detail => {
      fieldErrors[detail.field] = detail.message
    })
    setFormErrors(fieldErrors)
  } else if (error.response?.status === 409) {
    // Conflict errors (duplicate names, foreign key constraints)
    setFormErrors({ name: 'An artist with this name already exists' })
  } else {
    // Generic error fallback
    toast.error('Operation failed. Please try again.')
  }
}
```

## Access Control

### Role-Based UI
```javascript
const { isAdmin } = useAuth()

// Admin-only create button
{isAdmin() && (
  <button onClick={handleCreateClick}>
    Add Artist
  </button>
)}

// Admin-only table actions column
if (isAdmin()) {
  columns.push({
    key: 'actions',
    title: 'Actions',
    render: (_, row) => (
      <div className="flex items-center space-x-2">
        <button onClick={() => handleEditClick(row)}>Edit</button>
        <button onClick={() => handleDeleteClick(row)}>Delete</button>
      </div>
    )
  })
}
```

### Backend Authorization
- All CUD operations require admin role
- Read operations available to all authenticated users
- JWT token automatically attached via axios interceptor

## Error Handling

### Network Errors
- **Connection failures**: Generic error message with retry option
- **Timeout errors**: User-friendly timeout messaging
- **Server errors (5xx)**: "Server error, please try again later"

### Business Logic Errors
- **Validation errors (400)**: Field-specific error display
- **Conflict errors (409)**: Specific constraint violation messages
- **Not found errors (404)**: Redirect to list with error message

### User Experience
- **Loading states**: Skeleton animations during data fetching
- **Empty states**: Helpful messaging when no data exists
- **Success feedback**: Toast notifications for successful operations
- **Error recovery**: Clear error messages with actionable guidance

## Performance Optimizations

### Data Fetching
- **Pagination**: Limit data transfer with server-side pagination
- **Search debouncing**: Prevent excessive API calls during typing
- **Parallel requests**: Independent loading of artist and album data

### State Management
- **Minimal re-renders**: Proper dependency arrays in useEffect
- **Form state isolation**: Separate form state from list state
- **Modal state cleanup**: Reset form data when modals close

### User Interface
- **Optimistic updates**: Immediate UI feedback before API confirmation
- **Skeleton loading**: Maintain layout during loading states
- **Responsive design**: Efficient rendering across device sizes

## Navigation Integration

### Route Structure
```javascript
// List view
/app/artists

// Detail view  
/app/artists/:id

// Navigation helpers
import { ROUTES, routeHelpers } from '../router/routes'

// Static route
<Link to={ROUTES.APP.ARTISTS}>Artists</Link>

// Dynamic route
<Link to={routeHelpers.artistDetail(artist.artist_id)}>
  {artist.name}
</Link>
```

### Breadcrumb Navigation
- **Back button**: Clear navigation back to list
- **Contextual links**: Artist name links to detail page
- **Album links**: Navigate to album detail pages

## Testing Considerations

### Unit Tests
- Form validation logic
- API error handling
- State management functions
- Component rendering with different props

### Integration Tests
- Complete CRUD workflows
- Search and pagination functionality
- Modal interactions
- Role-based access control

### E2E Tests
- Full user journeys (create → edit → delete)
- Search and filter operations
- Navigation between list and detail views
- Error scenarios and recovery
