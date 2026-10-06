import axios from 'axios'

/* =========================================================
   BASE URL & CONSTANTS
   ========================================================= */
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
export const API_BASE_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`

const BASE_URL = API_BASE_URL

/* =========================================================
   AXIOS INSTANCE
   ========================================================= */
export const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
})

/* =========================================================
   TOKEN MANAGER
   ========================================================= */
export const tokenManager = {
    getToken: () => localStorage.getItem('token'),

    setToken: (token) => {
        if (token) {
            localStorage.setItem('token', token)
            api.defaults.headers.common.Authorization = `Bearer ${token}`
        } else {
            localStorage.removeItem('token')
            delete api.defaults.headers.common.Authorization
        }
    },

    removeToken: () => {
        localStorage.removeItem('token')
        delete api.defaults.headers.common.Authorization
    },
}

// Initialize token
const token = tokenManager.getToken()
if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
}

// Global 401 handler
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            tokenManager.removeToken()
        }
        return Promise.reject(err)
    }
)

/* =========================================================
   HEALTH API  ✅ (ApiStatus.jsx bunu istiyor)
   ========================================================= */
export const healthApi = {
    check: () => api.get('/health'),
}

/* =========================================================
   AUTH API
   ========================================================= */
export const authApi = {
    login: (email, password) =>
        api.post('/auth/login', { email, password }),

    register: (username, email, password) =>
        api.post('/auth/register', { username, email, password }),

    getProfile: () => api.get('/auth/profile'),

    updateProfile: (data) => api.put('/auth/profile', data),

    updatePassword: (currentPassword, newPassword) =>
        api.put('/auth/profile/password', { current_password: currentPassword, new_password: newPassword }),

    adminLogin: (email, password) =>
        api.post('/admin/login', { email, password }),
}

/* =========================================================
   GENERIC CRUD FACTORY
   ========================================================= */
const crud = (resource) => ({
    list: (params) => api.get(`/${resource}`, { params }),
    getAll: (params) => api.get(`/${resource}`, { params }),
    get: (id) => api.get(`/${resource}/${id}`),
    getById: (id) => api.get(`/${resource}/${id}`),
    create: (data) => api.post(`/${resource}`, data),
    update: (id, data) => api.put(`/${resource}/${id}`, data),
    remove: (id) => api.delete(`/${resource}/${id}`),
    delete: (id) => api.delete(`/${resource}/${id}`),
})

/* =========================================================
   RESOURCE APIs
   ========================================================= */
export const artistsApi = crud('artists')
export const albumsApi = crud('albums')
export const songsApi = crud('songs')

export const genresApi = {
    ...crud('genres'),
    // Genre management is admin-only
    createGenre: (name) => api.post('/genres', { name }),
    deleteGenre: (genreId) => api.delete(`/genres/${genreId}`),
}

export const playlistsApi = {
    ...crud('playlists'),
    addSong: (playlistId, songId) =>
        api.post(`/playlists/${playlistId}/songs`, { song_id: songId }),
    removeSong: (playlistId, songId) =>
        api.delete(`/playlists/${playlistId}/songs/${songId}`),
    createFromGenre: (genreId) =>
        api.post('/playlists/from-genre', { genre_id: genreId }),
    reorder: (playlistId, songOrders) =>
        api.put(`/playlists/${playlistId}/reorder`, { song_orders: songOrders }),
    uploadCover: (playlistId, file) => {
        const formData = new FormData()
        formData.append('cover', file)
        return api.post(`/playlists/${playlistId}/cover`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },
    deleteCover: (playlistId) =>
        api.delete(`/playlists/${playlistId}/cover`),
}

/* =========================================================
   RATINGS API
   ========================================================= */
export const ratingsApi = {
    listForSong: (songId, params) => api.get(`/songs/${songId}/ratings`, { params }),
    getSongRatings: (songId, params) => api.get(`/songs/${songId}/ratings`, { params }),
    rateSong: (songId, data) => api.post(`/songs/${songId}/rating`, data),
    create: (songId, rating, comment = null) =>
        api.post(`/songs/${songId}/rating`, { rating, comment }),
    updateRating: (songId, data) => api.put(`/songs/${songId}/rating`, data),
    update: (ratingId, rating, comment = null) =>
        api.put(`/ratings/${ratingId}`, { rating, comment }),
    deleteRating: (songId) => api.delete(`/songs/${songId}/rating`),
    remove: (ratingId) => api.delete(`/ratings/${ratingId}`),
}

/* =========================================================
   REVIEWS API
   ========================================================= */
export const reviewsApi = {
    listForAlbum: (albumId) => api.get(`/albums/${albumId}/reviews`),
    listForSong: (songId) => api.get(`/songs/${songId}/reviews`),

    createForAlbum: (albumId, data) =>
        api.post(`/albums/${albumId}/reviews`, data),

    createForSong: (songId, data) =>
        api.post(`/songs/${songId}/reviews`, data),

    update: (reviewId, data) =>
        api.put(`/reviews/${reviewId}`, data),

    remove: (reviewId) =>
        api.delete(`/reviews/${reviewId}`),
}

/* =========================================================
   FAVORITES API
   ========================================================= */
export const favoritesApi = {
    list: (params) => api.get('/favorites', { params }),

    addSong: (songId) => api.post('/playlists/like', { song_id: songId }),
    removeSong: (songId) => api.post('/playlists/like', { song_id: songId }), // Same endpoint toggles
    toggle: (songId) => api.post('/playlists/like', { song_id: songId }),

    addAlbum: (albumId) =>
        api.post('/favorites/albums', { album_id: albumId }),
    removeAlbum: (albumId) =>
        api.delete(`/favorites/albums/${albumId}`),

    addArtist: (artistId) =>
        api.post('/favorites/artists', { artist_id: artistId }),
    removeArtist: (artistId) =>
        api.delete(`/favorites/artists/${artistId}`),
}

/* =========================================================
   REPORTS API
   ========================================================= */
export const reportsApi = {
    // Existing (Updated paths)
    genreReport: (params) => api.get('/reports/genres', { params }),
    artistReport: (params) => api.get('/reports/artists', { params }),
    albumReport: (params) => api.get('/reports/albums-by-year', { params }),
    songReport: (params) => api.get('/reports/songs', { params }),

    // Aliases for Components (Fixes "Missing Data" / 0 issue)
    getGenreStats: (params) => api.get('/reports/genres', { params }),
    getAlbumStats: (params) => api.get('/reports/albums-by-year', { params }),
    getActiveUsers: (params) => api.get('/reports/active-users', { params }),
    getTopSongs: (params) => api.get('/reports/top-songs', { params }),

    get: (name, params) => api.get(`/reports/${name}`, { params }),
}

/* =========================================================
   UPLOAD API
   ========================================================= */
export const uploadApi = {
    upload: (file, fieldName = 'file') => {
        const formData = new FormData()
        formData.append(fieldName, file)
        return api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },

    // Artist image upload/delete
    uploadArtistImage: (artistId, file) => {
        const formData = new FormData()
        formData.append('image', file)
        return api.post(`/artists/${artistId}/image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },

    deleteArtistImage: (artistId) => {
        return api.delete(`/artists/${artistId}/image`)
    },

    // Album cover upload/delete
    uploadAlbumCover: (albumId, file) => {
        const formData = new FormData()
        formData.append('image', file)
        return api.post(`/albums/${albumId}/cover`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },

    deleteAlbumCover: (albumId) => {
        return api.delete(`/albums/${albumId}/cover`)
    },

    // Song audio upload
    uploadSongAudio: (song_id, file) => {
        const formData = new FormData()
        formData.append('audio', file)
        return api.post(`/songs/${song_id}/audio`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },

    // Integrated song upload (metadata + audio)
    uploadSongIntegrated: (data, file) => {
        const formData = new FormData()
        formData.append('audio', file)
        // Add all metadata fields to form data
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key])
            }
        })
        return api.post('/songs/upload-integrated', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },

    // Get image info
    getImageInfo: () => {
        return api.get('/uploads/info')
    },

    // Profile picture upload/delete
    uploadProfileImage: (file) => {
        const formData = new FormData()
        formData.append('image', file)
        return api.post('/uploads/profile/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },

    deleteProfileImage: () => {
        return api.delete('/uploads/profile/image')
    },

    fileUrl: (pathOrFilename) => {
        if (!pathOrFilename || typeof pathOrFilename !== 'string') return ''
        if (pathOrFilename.startsWith('http')) return pathOrFilename

        // Ensure path starts with /
        let path = pathOrFilename.startsWith('/') ? pathOrFilename : `/${pathOrFilename}`

        // If path already contains /api, use it from root
        if (path.startsWith('/api')) {
            const root = API_BASE_URL.replace(/\/api\/?$/, '')
            return `${root}${path}`
        }

        // Standard behavior: Append to API_BASE_URL
        // This works with backend endpoints like /api/uploads/... and /api/static/uploads/...
        return `${API_BASE_URL}${path}`
    },
}

/* =========================================================
   SOCIAL API
   ========================================================= */
export const socialApi = {
    getPublicProfile: (userId) => api.get(`/social/profile/${userId}`),
    toggleFollow: (userId) => api.post(`/social/follow/${userId}`),
    getFollowing: () => api.get('/social/following'),
    getFollowers: () => api.get('/social/followers'),
    getFollowers: () => api.get('/social/followers'),
    search: (params) => api.get('/social/search', { params }),
}

/* =========================================================
   ADMIN USERS API
   ========================================================= */
export const adminUsersApi = {
    list: (params) => api.get('/admin/users/', { params }),
    update: (userId, data) => api.put(`/admin/users/${userId}`, data),
    delete: (userId) => api.delete(`/admin/users/${userId}`),
    ban: (userId) => api.post(`/admin/users/${userId}/ban`),
}

export const adminDashboardApi = {
    getStats: () => api.get('/admin/dashboard/stats'),
}

/* =========================================================
   DEFAULT EXPORT
   ========================================================= */
export default api
