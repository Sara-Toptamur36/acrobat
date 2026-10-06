# Albums Management System

## Overview

The Albums management system provides comprehensive CRUD operations for managing music albums in the application. It follows the same architectural patterns as the Artists system for consistency and maintainability.

## Components

### Albums.jsx
Main albums listing page with search, filtering, and CRUD operations.

**Features:**
- Paginated album listing with search functionality
- Artist-based filtering
- Create, edit, and delete operations (admin-only)
- Responsive table display with album details
- Toast notifications for user feedback
- Form validation and error handling

**State Management:**
- `albums`: Current page of albums
- `artists`: List of artists for filtering and form dropdowns
- `pagination`: Pagination metadata
- `filters`: Search and filter criteria
- `formData`: Create/edit form data
- `formErrors`: Validation errors
- Modal visibility states

### AlbumDetail.jsx
Individual album detail page showing album information and associated songs.

**Features:**
- Album information display with metadata
- Songs listing with track numbers and ratings
- Edit and delete operations (admin-only)
- Navigation to related artists and songs
- Responsive layout with proper loading states

## API Integration

### Endpoints Used
- `GET /albums` - List albums with pagination and filtering
- `POST /albums` - Create new album
- `PUT /albums/:id` - Update album
- `DELETE /albums/:id` - Delete album
- `GET /artists` - List artists for dropdowns
- `GET /songs` - List songs for album detail

### Data Structure
```javascript
{
  album_id: number,
  title: string,
  artist_id: number,
  release_year: number | null,
  song_count: number,
  total_duration: number,
  artist: {
    name: string
  }
}
```

## Form Validation

### Create/Edit Album
- **Title**: Required, non-empty string
- **Artist**: Required, must be valid artist ID
- **Release Year**: Optional, must be valid year (1900 - current year + 1)

### Error Handling
- Field-level validation with real-time feedback
- API error handling with user-friendly messages
- Conflict detection for duplicate albums

## User Interface

### Search and Filtering
- Text search across album titles
- Artist dropdown filter
- Clear filters functionality
- Real-time filter application

### Table Columns
1. **Album** - Title with artist name, links to detail page
2. **Year** - Release year with calendar icon
3. **Songs** - Song count with music note icon
4. **Duration** - Total album duration formatted as hours/minutes
5. **Actions** - Edit/delete buttons (admin-only)

### Modals
- **Create Album**: Form for adding new albums
- **Edit Album**: Pre-populated form for updating albums
- **Delete Confirmation**: Warning dialog with cascade information

## Permissions

### Admin Users
- Create new albums
- Edit existing albums
- Delete albums (with cascade warnings)
- Access to all CRUD operations

### Regular Users
- View albums list
- Search and filter albums
- View album details
- Navigate to related content

## Navigation Integration

### Route Structure
- `/app/albums` - Albums listing
- `/app/albums/:id` - Album detail page

### Related Navigation
- Links to artist detail pages
- Links to song detail pages
- Breadcrumb navigation with back buttons

## Performance Considerations

### Data Loading
- Paginated results (20 items per page)
- Separate API calls for artists list (cached)
- Client-side filtering for songs in album detail

### State Management
- Efficient re-fetching on filter changes
- Form state isolation in modals
- Proper cleanup on component unmount

## Accessibility

### Keyboard Navigation
- Modal keyboard shortcuts (Escape to close)
- Form tab order
- Button focus management

### Screen Readers
- Semantic HTML structure
- Proper ARIA labels
- Descriptive button text

## Error States

### Loading States
- Skeleton loading for initial page load
- Button loading states during form submission
- Table loading overlay

### Empty States
- No albums found message
- Empty search results
- No songs in album

### Error Handling
- Network error recovery
- Validation error display
- User-friendly error messages

## Integration Points

### Artists System
- Artist selection in create/edit forms
- Navigation to artist detail pages
- Artist name display in album listings

### Songs System
- Song listings in album detail
- Navigation to song detail pages
- Track number ordering

### Authentication
- Role-based access control
- Admin operation restrictions
- Proper permission checking
