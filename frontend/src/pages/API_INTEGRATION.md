# Dashboard API Integration

This document explains how the Dashboard component integrates with the backend APIs.

## API Endpoints Used

### 1. Songs API (`/songs`)
**Endpoint**: `GET /songs?limit=1`
**Purpose**: Get total song count
**Response Format**:
```json
{
  "data": [...],
  "pagination": {
    "total_items": 1250,
    "page": 1,
    "per_page": 1
  }
}
```
**Usage**: Extract `pagination.total_items` for summary card

### 2. Artists API (`/artists`)
**Endpoint**: `GET /artists?limit=1`
**Purpose**: Get total artist count
**Response Format**:
```json
{
  "data": {
    "artists": [...],
    "pagination": {
      "total": 85,
      "page": 1,
      "per_page": 1
    }
  }
}
```
**Usage**: Extract `data.pagination.total` for summary card

### 3. Albums API (`/albums`)
**Endpoint**: `GET /albums?limit=1`
**Purpose**: Get total album count
**Response Format**:
```json
{
  "data": {
    "albums": [...],
    "pagination": {
      "total": 320,
      "page": 1,
      "per_page": 1
    }
  }
}
```
**Usage**: Extract `data.pagination.total` for summary card

### 4. Playlists API (`/playlists`)
**Endpoint**: `GET /playlists?limit=1`
**Purpose**: Get user's playlist count
**Response Format**:
```json
{
  "data": {
    "playlists": [...],
    "pagination": {
      "total": 12,
      "page": 1,
      "per_page": 1
    }
  }
}
```
**Usage**: Extract `data.pagination.total` for summary card

## Recent Activity APIs

### Recent Songs
**Endpoint**: `GET /songs?limit=3`
**Purpose**: Get latest songs for activity feed
**Data Extracted**:
- `song_id` - for navigation
- `title` - display name
- `album.artist.name` - artist info
- `album.title` - album info
- `created_at` - timestamp (if available)

### Recent Albums
**Endpoint**: `GET /albums?limit=2`
**Purpose**: Get latest albums for activity feed
**Data Extracted**:
- `album_id` - for navigation
- `title` - display name
- `artist.name` - artist info
- `created_at` - timestamp (if available)

### Recent Playlists
**Endpoint**: `GET /playlists?limit=2`
**Purpose**: Get latest playlists for activity feed
**Data Extracted**:
- `playlist_id` - for navigation
- `name` - display name
- `song_count` - playlist size
- `created_at` - timestamp (if available)

## Error Handling Strategy

### API Response Variations
Different endpoints return data in different formats:

```javascript
// Songs API - direct pagination
const totalSongs = songsRes.data?.pagination?.total_items || 0

// Artists/Albums/Playlists - nested in data object
const totalArtists = artistsRes.data?.data?.pagination?.total || 0
```

### Fallback Values
All data extraction uses fallback values to handle:
- Missing response data
- Network errors
- Malformed responses
- Empty datasets

### Error Recovery
```javascript
try {
  // API calls
} catch (error) {
  console.error('Failed to fetch dashboard data:', error)
  setError('Failed to load dashboard data. Please try again.')
} finally {
  setLoading(false)
}
```

## Performance Optimizations

### Parallel Requests
All API calls execute in parallel using `Promise.all()`:

```javascript
const [songsRes, artistsRes, albumsRes, playlistsRes] = await Promise.all([
  api.get('/songs?limit=1'),
  api.get('/artists?limit=1'), 
  api.get('/albums?limit=1'),
  api.get('/playlists?limit=1')
])
```

### Minimal Data Fetching
- Use `limit=1` for count-only requests
- Fetch only necessary fields
- Limit recent activity to reasonable amounts

### Caching Considerations
- Data is fetched on component mount
- No automatic refresh (user must reload page)
- Consider adding refresh button for real-time updates

## Authentication Integration

### JWT Token Handling
All API calls automatically include JWT token via axios interceptor:

```javascript
// In api.js
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### User Context
Dashboard uses `useAuth()` hook for:
- User information display
- Role-based feature visibility
- Authentication state management

## Data Transformation

### Activity Feed Processing
Raw API data is transformed into unified activity items:

```javascript
// Transform song data
{
  id: `song-${song.song_id}`,
  type: 'song',
  title: song.title,
  subtitle: `${song.album?.artist?.name} • ${song.album?.title}`,
  link: routeHelpers.songDetail(song.song_id),
  timestamp: song.created_at || new Date().toISOString()
}
```

### Timestamp Handling
- Uses `created_at` field when available
- Falls back to current timestamp
- Sorts activity by timestamp (newest first)

## Future Enhancements

### Real-time Updates
- WebSocket integration for live data
- Periodic refresh mechanism
- Push notifications for new content

### Advanced Analytics
- User-specific statistics
- Listening history integration
- Personalized recommendations

### Caching Strategy
- Local storage for dashboard data
- Cache invalidation on user actions
- Background refresh mechanisms

### Performance Monitoring
- API response time tracking
- Error rate monitoring
- User interaction analytics
