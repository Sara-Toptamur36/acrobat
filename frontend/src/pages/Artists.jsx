import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { routeHelpers } from '../router/routes'
import { artistsApi, uploadApi, API_BASE_URL } from '../services/api'
import Pagination from '../components/Pagination'
import CreateArtistForm from '../components/CreateArtistForm'

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

const ArtistCard = ({ artist, isAdmin, onDelete }) => {
  return (
    <div className="card group">
      <Link to={routeHelpers.artistDetail(artist.artist_id)} className="block">
        <div className="card-img-container shadow-2xl">
          {artist.image_url ? (
            <img
              src={uploadApi.fileUrl(artist.image_url)}
              alt={artist.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
          ) : null}
          <div className={`w-full h-full bg-acrobat-surface-lighter flex items-center justify-center ${artist.image_url ? 'hidden' : 'flex'}`}>
            <span className="text-6xl">🎤</span>
          </div>
          <div className="play-button-overlay">
            ▶
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="font-black text-white truncate">{artist.name}</h3>
          <p className="text-xs font-bold text-acrobat-text-muted uppercase tracking-widest">
            {artist.album_count || 0} Albüm
          </p>
        </div>
      </Link>

      {isAdmin && (
        <button
          onClick={(e) => {
            e.preventDefault()
            onDelete(artist)
          }}
          className="absolute top-2 right-2 p-2 bg-black/40 hover:bg-red-600 rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
          title="Sanatçıyı sil"
        >
          🗑️
        </button>
      )}
    </div>
  )
}

const Artists = () => {
  const { isAdmin } = useAuth()
  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const debouncedSearch = useDebounce(search, 300)

  const fetchArtists = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        limit: 18,
        ...(debouncedSearch && { search: debouncedSearch })
      }
      const response = await artistsApi.getAll(params)
      setArtists(response.data.data.artists || [])
      setPagination(response.data.data.pagination || {})
    } catch (error) {
      console.error('Failed to fetch artists:', error)
      toast.error('Sanatçılar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearch])

  useEffect(() => {
    fetchArtists()
  }, [fetchArtists])

  useEffect(() => {
    if (currentPage !== 1) setCurrentPage(1)
  }, [debouncedSearch])

  const handleCreateSuccess = () => {
    fetchArtists()
    setShowCreateModal(false)
  }

  const handleDeleteArtist = async (artist) => {
    const confirmed = window.confirm(`"${artist.name}" silinsin mi? Bu işlem geri alınamaz ve sadece albümü olmayan sanatçılar için çalışır.`)
    if (!confirmed) return
    try {
      await artistsApi.delete(artist.artist_id)
      toast.success('Sanatçı silindi')
      fetchArtists()
    } catch (error) {
      toast.error(error.response?.status === 409 ? 'Albümlü sanatçı silinemez' : 'Silme hatası')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-acrobat-primary mb-1">Keşfet</h4>
          <h1 className="text-4xl font-black tracking-tighter text-white">Sanatçılar</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <span className="absolute inset-y-0 left-4 flex items-center text-acrobat-text-muted pointer-events-none group-focus-within:text-white transition-colors">
              🔍
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-acrobat-surface-light border-none rounded-full pl-12 pr-6 py-3 text-sm text-white placeholder-acrobat-text-muted focus:ring-1 focus:ring-white w-full md:w-64 transition-all"
              placeholder="Sanatçı ara..."
            />
          </div>

          {isAdmin() && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary h-11"
            >
              Sanatçı Ekle
            </button>
          )}
        </div>
      </div>

      {/* Grid Results */}
      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="space-y-3 animate-pulse">
                <div className="aspect-square bg-white/5 rounded-lg"></div>
                <div className="h-3 bg-white/5 rounded w-3/4"></div>
                <div className="h-2 bg-white/5 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : artists.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {artists.map((artist) => (
              <ArtistCard
                key={artist.artist_id}
                artist={artist}
                isAdmin={isAdmin()}
                onDelete={handleDeleteArtist}
              />
            ))}
          </div>
        ) : (
          <div className="py-32 text-center opacity-30">
            <span className="text-7xl block mb-6">🏜️</span>
            <p className="text-xl font-black">Sanatçı bulunamadı</p>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="mt-12">
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.pages}
              onPageChange={setCurrentPage}
              totalItems={pagination.total}
              itemsPerPage={18}
            />
          </div>
        )}
      </div>

      <CreateArtistForm
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}

export default Artists
