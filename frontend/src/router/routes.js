/**
 * Application Route Configuration
 * 
 * This file defines all the routes used in the application with their
 * access levels and descriptions.
 */

export const ROUTES = {
  // Public routes - accessible without authentication
  PUBLIC: {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    UNAUTHORIZED: '/unauthorized'
  },

  // Protected routes - require authentication, prefixed with /app
  APP: {
    // Base app route
    ROOT: '/app',

    // Main application pages
    DASHBOARD: '/app/dashboard',
    SEARCH: '/app/search',
    SETTINGS: '/app/settings',
    PROFILE: '/app/profile',
    PUBLIC_PROFILE: '/app/users/:id',
    GENRES: '/app/genres',
    COMMUNITY: '/app/community',

    // Artists management
    ARTISTS: '/app/artists',
    ARTIST_DETAIL: '/app/artists/:id',

    // Albums management  
    ALBUMS: '/app/albums',
    ALBUM_DETAIL: '/app/albums/:id',

    // Songs management
    SONGS: '/app/songs',
    SONG_DETAIL: '/app/songs/:id',

    // Playlists management
    PLAYLISTS: '/app/playlists',
    PLAYLIST_DETAIL: '/app/playlists/:id',

    // Library Views (Split)
    LIBRARY_ALBUMS: '/app/library/albums',
    LIBRARY_ARTISTS: '/app/library/artists',
    LIBRARY_PLAYLISTS: '/app/library/playlists',

    // Admin-only routes
    ADMIN: {
      ROOT: '/admin',
      DASHBOARD: '/admin',
      CONTENT: '/admin/content',
      USERS: '/admin/users',
      REPORTS: '/admin/reports',
    }
  }
}

/**
 * Route helper functions
 */
export const routeHelpers = {
  // Generate dynamic routes
  artistDetail: (id) => `/app/artists/${id}`,
  albumDetail: (id) => `/app/albums/${id}`,
  songDetail: (id) => `/app/songs/${id}`,
  playlistDetail: (id) => `/app/playlists/${id}`,
  profile: () => '/app/profile',
  search: () => '/app/search',
  userProfile: (id) => `/app/users/${id}`,

  // Static routes
  playlists: () => '/app/playlists',
  reports: () => '/admin/reports',

  // Report routes
  genreReport: () => '/admin/reports/genre',
  albumReport: () => '/admin/reports/album',
  userReport: () => '/admin/reports/user',
  topSongsReport: () => '/admin/reports/top-songs',

  // Check if route requires admin access
  isAdminRoute: (path) => {
    return Object.values(ROUTES.APP.ADMIN).includes(path) || path.startsWith('/admin')
  },

  // Check if route is public
  isPublicRoute: (path) => {
    return Object.values(ROUTES.PUBLIC).includes(path)
  },

  // Check if route is protected
  isProtectedRoute: (path) => {
    return path.startsWith('/app')
  }
}

/**
 * Navigation menu configuration
 * Used by AppLayout component for rendering navigation
 */
export const NAVIGATION = {
  // Base navigation for all authenticated users
  BASE: [
    { name: 'Panel', href: ROUTES.APP.DASHBOARD },
    { name: 'Sanatçılar', href: ROUTES.APP.ARTISTS },
    { name: 'Albümler', href: ROUTES.APP.ALBUMS },
    { name: 'Şarkılar', href: ROUTES.APP.SONGS },
    { name: 'Ara', href: ROUTES.APP.SEARCH },
    { name: 'Topluluk', href: ROUTES.APP.COMMUNITY },
  ],

  // Admin-only navigation
  ADMIN: [
    { name: 'Yönetim Paneli', href: ROUTES.APP.ADMIN.ROOT },
    { name: 'Raporlar', href: ROUTES.APP.ADMIN.REPORTS }
  ]
}

export default ROUTES
