# Songs Management System

## Overview

The Songs management system provides comprehensive CRUD operations for managing individual songs in the music catalog. It follows the same architectural patterns as the Artists and Albums systems while adding unique features for song-specific functionality like ratings and playlist integration.

## Components

### Songs.jsx
Main songs listing page with search, filtering, and CRUD operations.

**Features:**
- Paginated song listing with comprehensive search functionality
- Multi-criteria filtering (album, genre, rating ranges)
- Create, edit, and delete operations (admin-only)
- Rating information display with StarRating component
- Responsive table display with song details
- Toast notifications for user feedback
- Form validation and error handling

**State Management:**
- `songs`: Current page of songs
- `albums`: List of albums for filtering and form dropdowns
- `genres`: List of genres for filtering and form dropdowns
- `pagination`: Pagination metadata
- `filters`: Search and filter criteria (search, album_id, genre_id, min_rating, max_rating)
- `formData`: Create/edit form data
- `formErrors`: Validation errors
- Modal visibility states

### SongDetail.jsx
Individual song detail page with rating system and playlist integration.

**Features:**
- Song information display with metadata
- User rating system with comments
- All ratings and comments display with pagination
- Add to playlist functionality
- Song statistics sidebar
- Navigation to related albums and artists
- Responsive layout with proper loading states

## API Integration

### Endpoints Used
- `GET /songs` - List songs with pagination and filtering
- `POST /songs` - Create new song
- `PUT /songs/:id` - Update song
- `DELETE /songs/:id` - Delete song
- `GET /albums` - List albums for dropdowns
- `GET /genres` - List genres for dropdowns
- `GET /songs/:id/ratings` - Get song ratings with pagination
- `POST /songs/:id/rating` - Add user rating
- `PUT /songs/:id/rating` - Update user rating
- `DELETE /songs/:id/rating` - Delete user rating
- `GET /playlists` - List user playlists
- `POST /playlists/:id/songs` - Add song to playlist

### Data Structure
```javascript
{
  song_id: number,
  title: string,
  album_id: number,
  genre_id: number | null,
  track_number: number | null,
  duration: number | null, // in seconds
  average_rating: number | null,
  album: {
    title: string,
    artist_id: number,
    artist: {
      name: string
    }
  },
  genre: {
    name: string
  }
}
```

## Form Validation

### Create/Edit Song
- **Title**: Required, non-empty string
- **Album**: Required, must be valid album ID
- **Genre**: Optional, must be valid genre ID if provided
- **Track Number**: Optional, must be positive integer if provided
- **Duration**: Optional, must be positive integer (seconds) if provided

### Rating Form
- **Rating**: Optional, must be 0-10 if provided
- **Comment**: Optional, text field for user comments
- At least one of rating or comment must be provided

### Error Handling
- Field-level validation with real-time feedback
- API error handling with user-friendly messages
- Conflict detection for duplicate songs in albums

## User Interface

### Search and Filtering
- Text search across song titles, artists, and albums
- Album dropdown filter with artist names
- Genre dropdown filter
- Rating range filters (min/max)
- Clear filters functionality
- Real-time filter application

### Table Columns
1. **Song** - Title with artist name, links to detail page
2. **Album** - Album title, links to album detail page
3. **Genre** - Genre badge display
4. **Duration** - Formatted duration with clock icon
5. **Rating** - Star rating display with numeric value
6. **Actions** - Edit/delete buttons (admin-only)

### Modals
- **Create Song**: Form for adding new songs with album/genre selection
- **Edit Song**: Pre-populated form for updating songs
- **Delete Confirmation**: Warning dialog with cascade information

### Song Detail Features
- **Song Information Card**: Complete metadata display
- **User Rating Section**: Personal rating with edit/delete options
- **Rating Form**: Inline form for adding/editing ratings
- **All Ratings Display**: Paginated list of all user ratings
- **Playlist Integration**: Add to playlist functionality
- **Statistics Sidebar**: Song metrics and information

## Permissions

### Admin Users
- Create new songs
- Edit existing songs
- Delete songs (with cascade warnings)
- Access to all CRUD operations

### Regular Users
- View songs list
- Search and filter songs
- View song details
- Rate songs and add comments
- Add songs to playlists
- Edit/delete their own ratings

## Rating System

### Rating Features
- 0-10 rating scale with star display
- Optional comments with ratings
- Edit and delete own ratings
- View all ratings from other users
- Paginated ratings display
- Average rating calculation

### Rating Validation
- Rating must be between 0-10
- At least rating or comment required
- One rating per user per song
- Proper conflict handling for duplicate ratings

## Navigation Integration

### Route Structure
- `/app/songs` - Songs listing
- `/app/songs/:id` - Song detail page

### Related Navigation
- Links to album detail pages
- Links to artist detail pages
- Links to playlist pages
- Breadcrumb navigation with back buttons

## Performance Considerations

### Data Loading
- Paginated results (20 items per page)
- Separate API calls for albums and genres (cached)
- Client-side filtering for large datasets
- Efficient rating pagination (10 per page)

### State Management
- Efficient re-fetching on filter changes
- Form state isolation in modals
- Rating form state management
- Proper cleanup on component unmount

## Accessibility

### Keyboard Navigation
- Modal keyboard shortcuts (Escape to close)
- Form tab order
- Button focus management
- Star rating keyboard interaction

### Screen Readers
- Semantic HTML structure
- Proper ARIA labels for star ratings
- Descriptive button text
- Form field labels

## Error States

### Loading States
- Skeleton loading for initial page load
- Button loading states during form submission
- Table loading overlay
- Rating form loading states

### Empty States
- No songs found message
- Empty search results
- No ratings for song
- No playlists available

### Error Handling
- Network error recovery
- Validation error display
- Rating conflict handling
- User-friendly error messages

## Integration Points

### Albums System
- Album selection in create/edit forms
- Navigation to album detail pages
- Album information display in song listings

### Artists System
- Artist name display through album relationship
- Navigation to artist detail pages
- Artist-based search functionality

### Genres System
- Genre selection in create/edit forms
- Genre filtering in song listings
- Genre badge display

### Playlists System
- Add to playlist functionality
- Playlist selection interface
- Integration with user playlists

### Rating System
- User rating management
- Rating display and aggregation
- Comment system integration

### Authentication
- Role-based access control
- User-specific rating management
- Admin operation restrictions
- Proper permission checking

## Unique Features

### Rating System
- Comprehensive rating and comment system
- User-specific rating management
- Aggregated rating display
- Paginated ratings with user information

### Playlist Integration
- Direct add-to-playlist functionality
- User playlist management
- Playlist creation shortcuts

### Advanced Filtering
- Multi-criteria filtering system
- Rating range filters
- Album and genre combinations
- Real-time search across multiple fields

### Rich Metadata Display
- Track number information
- Duration formatting
- Genre categorization
- Album and artist relationships
