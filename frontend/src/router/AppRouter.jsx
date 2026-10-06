import { Routes, Route } from 'react-router-dom'
import { ROUTES } from '../router/routes'
import Landing from '../pages/Landing'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Unauthorized from '../pages/Unauthorized'
import ProtectedRoute from '../components/ProtectedRoute'
import AdminRoute from '../components/AdminRoute'
import AppLayout from '../components/AppLayout'
import AdminLayout from '../components/AdminLayout'
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
import TopSongsReport from '../pages/reports/TopSongsReport'
import UserReport from '../pages/reports/UserReport'
import Admin from '../pages/Admin'
import AdminContent from '../pages/admin/Content'
import AdminDashboard from '../pages/admin/Dashboard'
import AdminUsers from '../pages/admin/Users'
import AdminLogin from '../pages/AdminLogin'
import Settings from '../pages/Settings'
import Profile from '../pages/Profile'
import Search from '../pages/Search'
import PublicProfile from '../pages/PublicProfile'
import Genres from '../pages/Genres'
import Community from '../pages/Community'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected App Routes */}
      <Route path="/app" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />
        <Route path="users/:id" element={<PublicProfile />} />
        <Route path="genres" element={<Genres />} />
        <Route path="community" element={<Community />} />
        <Route path="search" element={<Search />} />
        <Route path="artists" element={<Artists />} />
        <Route path="artists/:id" element={<ArtistDetail />} />
        <Route path="albums" element={<Albums />} />
        <Route path="albums/:id" element={<AlbumDetail />} />
        <Route path="songs" element={<Songs />} />
        <Route path="songs/:id" element={<SongDetail />} />
        <Route path="playlists" element={<Playlists />} />
        <Route path="playlists/:id" element={<PlaylistDetail />} />

        {/* Library Routes reusing Playlists component */}
        <Route path="library/albums" element={<Playlists view="albums" />} />
        <Route path="library/artists" element={<Playlists view="artists" />} />
        <Route path="library/playlists" element={<Playlists view="playlists" />} />
      </Route>

      {/* Protected Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="content" element={<AdminContent />} />
        <Route path="reports" element={<Reports />} />
        <Route path="reports/genre" element={<GenreReport />} />
        <Route path="reports/album" element={<AlbumReport />} />
        <Route path="reports/top-songs" element={<TopSongsReport />} />
        <Route path="reports/user" element={<UserReport />} />
      </Route>

      <Route path="*" element={<div>Page not found</div>} />
    </Routes>
  )
}
