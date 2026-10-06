# Dashboard Component

A comprehensive dashboard page that provides an overview of the music catalog with summary statistics and recent activity.

## Features

### Summary Cards
- **Total Songs**: Count of all songs in the catalog
- **Artists**: Count of all artists
- **Albums**: Count of all albums  
- **My Playlists**: Count of user's personal playlists

### Recent Activity
- Latest songs added to the catalog
- Recently created albums
- Recently created playlists
- Mixed activity feed sorted by timestamp

### Quick Actions
- Direct navigation to main sections
- Role-based actions (admin sees reports)
- Visual icons and descriptions

## API Calls Used

### Summary Statistics
```javascript
// Get total counts by fetching first page with limit=1
const [songsRes, artistsRes, albumsRes, playlistsRes] = await Promise.all([
  api.get('/songs?limit=1'),      // Returns pagination.total_items
  api.get('/artists?limit=1'),    // Returns data.pagination.total
  api.get('/albums?limit=1'),     // Returns data.pagination.total
  api.get('/playlists?limit=1')   // Returns data.pagination.total
])
```

### Recent Activity
```javascript
// Fetch recent items from each category
const [recentSongsRes, recentAlbumsRes, recentPlaylistsRes] = await Promise.all([
  api.get('/songs?limit=3'),      // Latest songs
  api.get('/albums?limit=2'),     // Latest albums
  api.get('/playlists?limit=2')   // Latest playlists
])
```

## State Management

### Primary State
```javascript
const [stats, setStats] = useState({
  totalSongs: 0,
  totalArtists: 0,
  totalAlbums: 0,
  totalPlaylists: 0
})

const [recentActivity, setRecentActivity] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)
```

### State Flow
1. **Initial Load**: `loading = true`, fetch all data in parallel
2. **Success**: Update stats and activity, `loading = false`
3. **Error**: Set error message, `loading = false`
4. **Retry**: Reset error, reload data

## Data Processing

### Activity Aggregation
Recent activity combines different item types into a unified feed:

```javascript
// Transform each item type into common format
const activity = []

songs.forEach(song => {
  activity.push({
    id: `song-${song.song_id}`,
    type: 'song',
    title: song.title,
    subtitle: `${song.album?.artist?.name} • ${song.album?.title}`,
    link: routeHelpers.songDetail(song.song_id),
    timestamp: song.created_at || new Date().toISOString()
  })
})

// Sort by timestamp and limit results
activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
setRecentActivity(activity.slice(0, 8))
```

### Statistics Extraction
Different API endpoints return totals in different formats:

```javascript
setStats({
  totalSongs: songsRes.data?.pagination?.total_items || 0,     // Direct pagination
  totalArtists: artistsRes.data?.data?.pagination?.total || 0, // Nested in data
  totalAlbums: albumsRes.data?.data?.pagination?.total || 0,   // Nested in data
  totalPlaylists: playlistsRes.data?.data?.pagination?.total || 0 // Nested in data
})
```

## Loading States

### Summary Cards
- Shows "..." while loading
- Displays formatted numbers when loaded
- Maintains layout during loading

### Recent Activity
- Skeleton loading with animated placeholders
- Preserves list structure during loading
- Shows empty state if no activity

### Error Handling
- Comprehensive error boundary
- Retry functionality
- User-friendly error messages

## Component Architecture

### StatCard Component
```javascript
const StatCard = ({ title, value, color, link, type }) => {
  // Renders clickable summary statistics
  // Uses Unicode icons (no external dependencies)
  // Responsive design with hover effects
}
```

### ActivityItem Component
```javascript
const ActivityItem = ({ item }) => {
  // Renders individual activity items
  // Type-specific icons and colors
  // Truncated text with hover states
}
```

## Responsive Design

### Grid Layout
- **Mobile**: Single column layout
- **Tablet**: 2-column stats grid
- **Desktop**: 4-column stats grid, 2-column content

### Typography
- Responsive text sizing
- Proper contrast ratios
- Consistent spacing

## Navigation Integration

### Route Constants
Uses centralized route configuration:
```javascript
import { ROUTES, routeHelpers } from '../router/routes'

// Static routes
<Link to={ROUTES.APP.SONGS}>Browse Songs</Link>

// Dynamic routes
<Link to={routeHelpers.songDetail(song.song_id)}>Song Title</Link>
```

### Role-Based Actions
```javascript
{user?.role === 'admin' && (
  <Link to={ROUTES.APP.ADMIN.REPORTS}>
    View Reports
  </Link>
)}
```

## Performance Considerations

### Parallel API Calls
All data fetching happens in parallel using `Promise.all()` to minimize loading time.

### Efficient Re-renders
- Minimal state updates
- Proper dependency arrays in useEffect
- Memoized components where beneficial

### Error Boundaries
- Graceful error handling
- Retry mechanisms
- Fallback UI states

## Accessibility

### Semantic HTML
- Proper heading hierarchy
- Meaningful link text
- Screen reader friendly

### Keyboard Navigation
- All interactive elements focusable
- Logical tab order
- Visual focus indicators

### Color Contrast
- WCAG compliant color combinations
- Meaningful color coding
- Not relying solely on color for information

## Testing Considerations

### Unit Tests
- Component rendering
- State management
- Error handling
- User interactions

### Integration Tests
- API call mocking
- Loading states
- Navigation flows
- Role-based rendering

### E2E Tests
- Full dashboard loading
- Navigation functionality
- Error recovery
- Responsive behavior
