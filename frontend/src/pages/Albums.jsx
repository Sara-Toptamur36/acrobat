import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { routeHelpers } from '../router/routes'
import { albumsApi, artistsApi, uploadApi, API_BASE_URL } from '../services/api'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

const AlbumCard = ({ album }) => {
  return (
    <div className="card group">
      <Link to={routeHelpers.albumDetail(album.album_id)} className="block text-inherit no-underline">
        <div className="card-img-container shadow-2xl">
          {album.cover_image ? (
            <img
              src={uploadApi.fileUrl(album.cover_image)}
              alt={album.title}
              className="card-img"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
          ) : null}
          <div className={`w-full h-full bg-acrobat-surface-lighter flex items-center justify-center ${album.cover_image ? 'hidden' : 'flex'}`}>
            <span className="text-6xl">💿</span>
          </div>
          <div className="play-button-overlay">
            ▶
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="font-black text-white truncate">{album.title}</h3>
          <p className="text-xs font-bold text-acrobat-text-muted transition-colors group-hover:text-white truncate">
            {album.artist?.name}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-white/5 rounded text-acrobat-text-muted">
              {album.release_year || 'Yıl'}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-acrobat-text-muted">
              {album.song_count || 0} parça
            </span>
          </div>
        </div>
      </Link>
    </div>
  )
}

const Albums = () => {
  const { isAdmin } = useAuth()
  const [albums, setAlbums] = useState([])
  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({ title: '', artist_id: '', release_year: '', cover_image: '' })
  const [formErrors, setFormErrors] = useState({})
  const [formLoading, setFormLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')

  const debouncedSearch = useDebounce(search, 300)

  const fetchAlbums = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        limit: 18,
        ...(debouncedSearch && { search: debouncedSearch })
      }
      const response = await albumsApi.getAll(params)
      setAlbums(response.data.data.albums || [])
      setPagination(response.data.data.pagination || {})
    } catch (error) {
      console.error('Failed to fetch albums:', error)
      toast.error('Albümler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearch])

  const fetchArtists = useCallback(async () => {
    try {
      const response = await artistsApi.getAll({ limit: 100 })
      setArtists(response.data.data.artists || [])
    } catch (error) {
      console.error('Failed to fetch artists:', error)
    }
  }, [])

  useEffect(() => {
    fetchAlbums()
  }, [fetchAlbums])

  useEffect(() => {
    fetchArtists()
  }, [fetchArtists])

  useEffect(() => {
    if (currentPage !== 1) setCurrentPage(1)
  }, [debouncedSearch])

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    const errors = {}
    if (!formData.title.trim()) errors.title = 'Başlık zorunludur'
    if (!formData.artist_id) errors.artist_id = 'Sanatçı seçilmelidir'
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setFormLoading(true)
    try {
      await albumsApi.create({
        ...formData,
        artist_id: parseInt(formData.artist_id),
        release_year: formData.release_year ? parseInt(formData.release_year) : undefined
      })
      toast.success('Albüm oluşturuldu')
      fetchAlbums()
      closeModal()
    } catch (error) {
      toast.error('Albüm oluşturulamadı')
    } finally {
      setFormLoading(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploadLoading(true)
    try {
      const url = await uploadApi.uploadFile(selectedFile)
      setFormData(prev => ({ ...prev, cover_image: url }))
      toast.success('Kapak yüklendi')
    } catch (error) {
      toast.error('Yükleme başarısız')
    } finally {
      setUploadLoading(false)
    }
  }

  const closeModal = () => {
    setShowCreateModal(false)
    setFormData({ title: '', artist_id: '', release_year: '', cover_image: '' })
    setSelectedFile(null)
    setPreviewUrl('')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400 mb-1">Koleksiyon</h4>
          <h1 className="text-4xl font-black tracking-tighter text-white">Albümler</h1>
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
              className="input rounded-full pl-12 pr-6 h-11 text-sm md:w-64"
              placeholder="Albüm ara..."
            />
          </div>

          {isAdmin() && (
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary h-11">
              Albüm Ekle
            </button>
          )}
        </div>
      </div>

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
        ) : albums.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-inherit no-underline">
            {albums.map((album) => <AlbumCard key={album.album_id} album={album} />)}
          </div>
        ) : (
          <div className="py-32 text-center opacity-30">
            <span className="text-7xl block mb-6">💿</span>
            <p className="text-xl font-black">Albüm bulunamadı</p>
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

      <Modal isOpen={showCreateModal} onClose={closeModal} title="Yeni Albüm Oluştur">
        <form onSubmit={handleCreateSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-acrobat-text-muted px-1">Albüm Başlığı *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input font-bold"
              placeholder="Albüm adını yazın"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-acrobat-text-muted px-1">Sanatçı *</label>
              <select
                name="artist_id"
                value={formData.artist_id}
                onChange={(e) => setFormData({ ...formData, artist_id: e.target.value })}
                className="input font-bold"
                required
              >
                <option value="">Sanatçı Seç</option>
                {artists.map(a => <option key={a.artist_id} value={a.artist_id}>{a.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-acrobat-text-muted px-1">Yıl</label>
              <input
                type="number"
                name="release_year"
                value={formData.release_year}
                onChange={(e) => setFormData({ ...formData, release_year: e.target.value })}
                className="input font-bold"
                placeholder="2024"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-acrobat-text-muted px-1">Kapak Resmi</label>
            <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center gap-4">
              <div className="w-16 h-16 bg-acrobat-surface-light rounded overflow-hidden">
                {previewUrl && <img src={previewUrl} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1">
                <input type="file" onChange={handleFileSelect} className="text-xs file:btn file:btn-secondary file:py-1 file:px-2" />
              </div>
              {selectedFile && !formData.cover_image && (
                <button type="button" onClick={handleUpload} disabled={uploadLoading} className="btn btn-primary btn-sm">
                  {uploadLoading ? '...' : 'Yükle'}
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={closeModal} className="btn btn-secondary flex-1">İptal</button>
            <button type="submit" disabled={formLoading} className="btn btn-primary flex-1">{formLoading ? 'Oluşturuluyor...' : 'Albüm Oluştur'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Albums
