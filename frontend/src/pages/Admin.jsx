import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { artistsApi, albumsApi, uploadApi, genresApi } from '../services/api'
import ImageUpload from '../components/ImageUpload'

const Admin = () => {
  const [activeTab, setActiveTab] = useState('artists')
  const [artists, setArtists] = useState([])
  const [albums, setAlbums] = useState([])
  const [genres, setGenres] = useState([])
  const [selectedArtist, setSelectedArtist] = useState(null)
  const [selectedAlbum, setSelectedAlbum] = useState(null)
  const [loading, setLoading] = useState(false)
  const [newGenreName, setNewGenreName] = useState('')

  useEffect(() => {
    if (activeTab === 'artists') {
      fetchArtists()
    } else if (activeTab === 'albums') {
      fetchAlbums()
    } else if (activeTab === 'genres') {
      fetchGenres()
    }
  }, [activeTab])

  const fetchArtists = async () => {
    setLoading(true)
    try {
      const response = await artistsApi.getAll({ limit: 100 })
      const artistsData = response.data.data?.artists || response.data.data || []
      setArtists(Array.isArray(artistsData) ? artistsData : [])
    } catch (error) {
      toast.error('Sanatçılar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const fetchAlbums = async () => {
    setLoading(true)
    try {
      const response = await albumsApi.getAll({ limit: 100 })
      const albumsData = response.data.data?.albums || response.data.data || []
      setAlbums(Array.isArray(albumsData) ? albumsData : [])
    } catch (error) {
      toast.error('Albümler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const handleArtistImageUpload = async (file) => {
    if (!selectedArtist) return
    await uploadApi.uploadArtistImage(selectedArtist.artist_id, file)
    fetchArtists()
  }

  const handleArtistImageDelete = async () => {
    if (!selectedArtist) return
    await uploadApi.deleteArtistImage(selectedArtist.artist_id)
    fetchArtists()
    setSelectedArtist({ ...selectedArtist, image_url: null })
  }

  const handleAlbumCoverUpload = async (file) => {
    if (!selectedAlbum) return
    await uploadApi.uploadAlbumCover(selectedAlbum.album_id, file)
    fetchAlbums()
  }

  const handleAlbumCoverDelete = async () => {
    if (!selectedAlbum) return
    await uploadApi.deleteAlbumCover(selectedAlbum.album_id)
    fetchAlbums()
    setSelectedAlbum({ ...selectedAlbum, cover_image: null })
  }

  const fetchGenres = async () => {
    setLoading(true)
    try {
      const response = await genresApi.getAll({ limit: 100 })
      const genresData = response.data.data?.genres || response.data.data || []
      setGenres(Array.isArray(genresData) ? genresData : [])
    } catch (error) {
      toast.error('Türler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGenre = async (e) => {
    e.preventDefault()
    if (!newGenreName.trim()) {
      toast.error('Tür adı gerekli')
      return
    }

    try {
      await genresApi.createGenre(newGenreName.trim())
      toast.success('Tür başarıyla oluşturuldu')
      setNewGenreName('')
      fetchGenres()
    } catch (error) {
      toast.error('Tür oluşturulamadı')
    }
  }

  const handleDeleteGenre = async (genreId, genreName) => {
    if (!window.confirm(`"${genreName}" türünü silmek istediğinize emin misiniz?`)) return

    try {
      await genresApi.deleteGenre(genreId)
      toast.success('Tür başarıyla silindi')
      fetchGenres()
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error('Bu tür kullanımda olduğu için silinemez')
      } else {
        toast.error('Tür silinemedi')
      }
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Admin Panel 👑</h1>
        <p className="text-acrobat-text-muted font-medium">Sistem yönetimi ve içerik düzenleme.</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10">
        <button
          onClick={() => setActiveTab('artists')}
          className={`px-6 py-3 font-bold transition-all ${activeTab === 'artists'
            ? 'text-acrobat-primary border-b-2 border-acrobat-primary'
            : 'text-acrobat-text-muted hover:text-white'
            }`}
        >
          🎤 Sanatçı Resimleri
        </button>
        <button
          onClick={() => setActiveTab('albums')}
          className={`px-6 py-3 font-bold transition-all ${activeTab === 'albums'
            ? 'text-acrobat-primary border-b-2 border-acrobat-primary'
            : 'text-acrobat-text-muted hover:text-white'
            }`}
        >
          💿 Albüm Kapakları
        </button>
      </div>

      {/* Artist Images Tab */}
      {activeTab === 'artists' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Artist List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-white">Sanatçılar</h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 border-4 border-acrobat-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : (
                artists.map((artist) => (
                  <button
                    key={artist.artist_id}
                    onClick={() => setSelectedArtist(artist)}
                    className={`w-full p-4 rounded-xl text-left transition-all ${selectedArtist?.artist_id === artist.artist_id
                      ? 'bg-acrobat-primary text-white'
                      : 'bg-white/5 hover:bg-white/10 text-white'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-acrobat-surface-light flex items-center justify-center text-xl">
                        {artist.image_url ? '✅' : '📷'}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">{artist.name}</p>
                        <p className="text-xs opacity-70">
                          {artist.image_url ? 'Resim mevcut' : 'Resim yok'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Upload Area */}
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-white">
              {selectedArtist ? `${selectedArtist.name} - Resim Yükle` : 'Sanatçı Seçin'}
            </h2>
            {selectedArtist ? (
              <ImageUpload
                currentImage={selectedArtist.image_url ? uploadApi.fileUrl(selectedArtist.image_url) : null}
                onUpload={handleArtistImageUpload}
                onDelete={selectedArtist.image_url ? handleArtistImageDelete : null}
              />
            ) : (
              <div className="bg-white/5 rounded-2xl p-12 text-center border border-dashed border-white/20">
                <p className="text-4xl mb-4">👈</p>
                <p className="text-acrobat-text-muted font-bold">
                  Resim yüklemek için sol taraftan bir sanatçı seçin
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Album Covers Tab */}
      {activeTab === 'albums' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Album List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-white">Albümler</h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 border-4 border-acrobat-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : (
                albums.map((album) => (
                  <button
                    key={album.album_id}
                    onClick={() => setSelectedAlbum(album)}
                    className={`w-full p-4 rounded-xl text-left transition-all ${selectedAlbum?.album_id === album.album_id
                      ? 'bg-acrobat-primary text-white'
                      : 'bg-white/5 hover:bg-white/10 text-white'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-acrobat-surface-light flex items-center justify-center text-xl">
                        {album.cover_image ? '✅' : '💿'}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">{album.title}</p>
                        <p className="text-xs opacity-70">
                          {album.artist?.name} • {album.cover_image ? 'Kapak mevcut' : 'Kapak yok'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Upload Area */}
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-white">
              {selectedAlbum ? `${selectedAlbum.title} - Kapak Yükle` : 'Albüm Seçin'}
            </h2>
            {selectedAlbum ? (
              <ImageUpload
                currentImage={selectedAlbum.cover_image ? uploadApi.fileUrl(selectedAlbum.cover_image) : null}
                onUpload={handleAlbumCoverUpload}
                onDelete={selectedAlbum.cover_image ? handleAlbumCoverDelete : null}
              />
            ) : (
              <div className="bg-white/5 rounded-2xl p-12 text-center border border-dashed border-white/20">
                <p className="text-4xl mb-4">👈</p>
                <p className="text-acrobat-text-muted font-bold">
                  Kapak yüklemek için sol taraftan bir albüm seçin
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Genre Management Tab */}
      {activeTab === 'genres' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Genre Form */}
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-white">Yeni Tür Oluştur</h2>
            <form onSubmit={handleCreateGenre} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-white mb-2">Tür Adı</label>
                <input
                  type="text"
                  value={newGenreName}
                  onChange={(e) => setNewGenreName(e.target.value)}
                  placeholder="Örn: Rock, Pop, Jazz..."
                  className="input w-full"
                />
              </div>
              <button type="submit" className="btn btn-primary w-full">
                Tür Oluştur
              </button>
            </form>
          </div>

          {/* Genre List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-white">Mevcut Türler ({genres.length})</h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 border-4 border-acrobat-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : genres.length === 0 ? (
                <div className="bg-white/5 rounded-2xl p-12 text-center border border-dashed border-white/20">
                  <p className="text-4xl mb-4">🎵</p>
                  <p className="text-acrobat-text-muted font-bold">Henüz hiç tür yok</p>
                </div>
              ) : (
                genres.map((genre) => (
                  <div
                    key={genre.genre_id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-acrobat-primary/20 flex items-center justify-center text-lg">
                        🎵
                      </div>
                      <div>
                        <p className="font-bold text-white">{genre.name}</p>
                        <p className="text-xs text-acrobat-text-muted">
                          ID: {genre.genre_id}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteGenre(genre.genre_id, genre.name)}
                      className="px-4 py-2 bg-red-500/20 text-red-500 rounded-lg font-bold text-sm hover:bg-red-500 hover:text-white transition-all"
                    >
                      Sil
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin
