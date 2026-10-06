import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ROUTES, routeHelpers } from '../router/routes'
import { artistsApi, albumsApi, songsApi, playlistsApi } from '../services/api'

const Dashboard = () => {
  const { user, isAdmin } = useAuth()
  const [stats, setStats] = useState({
    totalSongs: 0,
    totalArtists: 0,
    totalAlbums: 0,
    totalPlaylists: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        const safeFetch = async (promise, fallback = { data: { data: {} } }) => {
          try { return await promise }
          catch (e) {
            console.warn('Individual API fetch failed:', e.message)
            return fallback
          }
        }

        const [songsRes, artistsRes, albumsRes, playlistsRes] = await Promise.all([
          safeFetch(songsApi.getAll({ limit: 1 })),
          safeFetch(artistsApi.getAll({ limit: 1 })),
          safeFetch(albumsApi.getAll({ limit: 1 })),
          safeFetch(playlistsApi.getAll({ limit: 1 }))
        ])

        setStats({
          totalSongs: songsRes.data?.data?.pagination?.total_items || 0,
          totalArtists: artistsRes.data?.data?.pagination?.total || 0,
          totalAlbums: albumsRes.data?.data?.pagination?.total || 0,
          totalPlaylists: playlistsRes.data?.data?.pagination?.total || 0
        })

        const [recentSongsRes, recentAlbumsRes] = await Promise.all([
          safeFetch(songsApi.getAll({ limit: 8 })),
          safeFetch(albumsApi.getAll({ limit: 8 }))
        ])

        const activity = []
        const songs = recentSongsRes.data?.data?.data || []
        songs.forEach(song => {
          activity.push({
            id: `song-${song.song_id}`,
            type: 'song',
            title: song.title,
            subtitle: song.album?.artist?.name ? `${song.album.artist.name} • ${song.album?.title || 'Unknown Album'}` : song.album?.title || 'Unknown Album',
            link: routeHelpers.songDetail(song.song_id),
            timestamp: song.created_at || new Date().toISOString()
          })
        })

        const albums = recentAlbumsRes.data?.data?.albums || []
        albums.forEach(album => {
          activity.push({
            id: `album-${album.album_id}`,
            type: 'album',
            title: album.title,
            subtitle: `Album by ${album.artist?.name || 'Unknown Artist'}`,
            link: routeHelpers.albumDetail(album.album_id),
            timestamp: album.created_at || new Date().toISOString()
          })
        })

        activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        setRecentActivity(activity.slice(0, 8))

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        // Only set error if we have no stats at all
        if (!stats.totalSongs && !stats.totalArtists) {
          setError('Failed to load dashboard data. Please try again.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const StatCard = ({ title, value, color, link, type }) => {
    const getIcon = () => {
      switch (type) {
        case 'songs': return '♪'
        case 'artists': return '👤'
        case 'albums': return '💿'
        case 'playlists': return '📋'
        default: return '📊'
      }
    }

    return (
      <Link to={link} className="card group">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-md flex items-center justify-center text-white text-xl shadow-2xl ${color}`}>
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-acrobat-text-muted mb-0.5">{title}</p>
            <p className="text-xl font-black text-white">
              {loading ? '...' : value.toLocaleString()}
            </p>
          </div>
          <div className="w-7 h-7 bg-acrobat-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs shadow-lg shadow-acrobat-primary/40">
            ▶
          </div>
        </div>
      </Link>
    )
  }

  const ActivityItem = ({ item }) => {
    return (
      <Link to={item.link} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors group">
        <div className="w-12 h-12 bg-acrobat-surface-light rounded overflow-hidden flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
          {item.type === 'song' ? '♪' : '💿'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{item.title}</p>
          <p className="text-xs text-acrobat-text-muted truncate">{item.subtitle}</p>
        </div>
        <div className="text-[10px] font-bold text-acrobat-text-muted uppercase tracking-widest">
          {item.type}
        </div>
      </Link>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center animate-slide-up">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-xl font-black mb-2">Something went wrong</h3>
        <p className="text-acrobat-text-muted mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-acrobat-dark via-acrobat-black to-black p-8 border border-white/5">
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-acrobat-primary-light mb-1">Genel Bakış</h4>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-3">
              Merhaba, <span className="text-acrobat-primary-light">{user?.username}</span>!
            </h1>
            <p className="text-indigo-200/60 max-w-md font-medium text-base leading-relaxed">
              Müzik merkezine tekrar hoş geldin. Sanatçılarını, albümlerini ve parçalarını buradan yönetebilirsin.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to={ROUTES.APP.SONGS} className="btn btn-primary py-2.5 px-6 text-base">
              Hemen Keşfet
            </Link>
          </div>
        </div>
        <div className="absolute top-[-10%] right-[-10%] w-[40%] aspect-square bg-acrobat-primary/10 blur-[100px] rounded-full"></div>
      </section>

      {/* Summary Statistics */}
      <section>
        <h2 className="text-2xl font-black tracking-tight mb-6">Hızlı İstatistikler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Toplam Şarkı"
            value={stats.totalSongs}
            color="bg-blue-600"
            link={ROUTES.APP.SONGS}
            type="songs"
          />
          <StatCard
            title="Sanatçılar"
            value={stats.totalArtists}
            color="bg-emerald-600"
            link={ROUTES.APP.ARTISTS}
            type="artists"
          />
          <StatCard
            title="Albümler"
            value={stats.totalAlbums}
            color="bg-purple-600"
            link={ROUTES.APP.ALBUMS}
            type="albums"
          />
          <StatCard
            title="Çalma Listelerin"
            value={stats.totalPlaylists}
            color="bg-amber-600"
            link={ROUTES.APP.PLAYLISTS}
            type="playlists"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-8 bg-acrobat-dark/40 rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <span className="text-acrobat-primary">⚡</span> Son Aktiviteler
            </h2>
            <Link to={ROUTES.APP.SONGS} className="text-xs font-bold text-acrobat-text-muted hover:text-white transition-colors">
              Tüm parçaları gör
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
                  <div className="w-12 h-12 bg-white/5 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-white/5 rounded w-3/4"></div>
                    <div className="h-2 bg-white/5 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : recentActivity.length > 0 ? (
              recentActivity.map((item) => <ActivityItem key={item.id} item={item} />)
            ) : (
              <div className="col-span-2 text-center py-20 opacity-50">
                <p className="text-4xl mb-4">💿</p>
                <p className="font-bold">Pure silence. Add some music!</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Board */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-xl font-black tracking-tight mb-1 px-2">Kısayollar</h2>
          <Link to={ROUTES.APP.SONGS} className="group block bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 rounded-2xl hover:to-indigo-700 transition-all shadow-xl">
            <span className="text-2xl mb-3 block group-hover:scale-105 transition-transform origin-left">🎵</span>
            <p className="text-lg font-black text-white mb-1">Müziğe Göz At</p>
            <p className="text-indigo-200 text-xs font-medium">En sevilen küresel parçaları keşfet</p>
          </Link>

          <Link to={ROUTES.APP.PLAYLISTS} className="group block bg-acrobat-surface p-5 rounded-2xl hover:bg-acrobat-surface-light transition-all border border-white/5">
            <span className="text-2xl mb-3 block group-hover:scale-105 transition-transform origin-left">📋</span>
            <p className="text-lg font-black text-white mb-1">Listelerini Düzenle</p>
            <p className="text-acrobat-text-muted text-xs font-medium">Müzik koleksiyonunu organize et</p>
          </Link>

          {isAdmin() && (
            <Link to={ROUTES.APP.ADMIN.REPORTS} className="group block bg-acrobat-primary/10 p-6 rounded-3xl hover:bg-acrobat-primary/20 transition-all border border-acrobat-primary/20">
              <span className="text-2xl mb-3 block group-hover:scale-105 transition-transform origin-left">📊</span>
              <p className="text-lg font-black text-white mb-1">Analizler</p>
              <p className="text-acrobat-primary-light text-xs font-medium">Sistem verilerine eriş</p>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
