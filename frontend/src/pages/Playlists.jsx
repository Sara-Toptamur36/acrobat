import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { playlistsApi, uploadApi, favoritesApi } from '../services/api'
import { routeHelpers } from '../router/routes'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'

const PlaylistCard = ({ playlist }) => {
  return (
    <Link
      key={playlist.playlist_id}
      to={routeHelpers.playlistDetail(playlist.playlist_id)}
      className="group bg-white/5 rounded-3xl p-6 hover:bg-white/10 transition-all border border-white/5 hover:border-acrobat-primary/30"
    >
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-2xl shrink-0 overflow-hidden shadow-lg">
          {playlist.cover_image ? (
            <img src={uploadApi.fileUrl(playlist.cover_image)} alt={playlist.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-800 flex items-center justify-center text-3xl">
              🎵
            </div>
          )}
        </div>
        <div className="space-y-1">
          <h3 className="font-black text-white truncate">{playlist.name}</h3>
          <p className="text-xs font-bold text-acrobat-text-muted transition-colors group-hover:text-white truncate">
            Koleksiyon • {playlist.song_count || 0} parça
          </p>
        </div>
      </div>
    </Link>
  )
}

// Helper Components for Album and Artist Cards
const AlbumCard = ({ album }) => (
  <Link
    to={routeHelpers.albumDetail(album.album_id)}
    className="group bg-white/5 rounded-3xl p-4 hover:bg-white/10 transition-all border border-white/5 hover:border-acrobat-primary/30 block"
  >
    <div className="aspect-square bg-white/10 rounded-2xl mb-4 overflow-hidden shadow-lg relative">
      {album.cover_image ? (
        <img src={uploadApi.fileUrl(album.cover_image)} alt={album.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-4xl">💿</div>
      )}
    </div>
    <h3 className="font-bold text-white truncate">{album.title}</h3>
    <p className="text-xs text-acrobat-text-muted truncate mt-1">{album.artist?.name || 'Sanatçı'}</p>
  </Link>
)

const ArtistCard = ({ artist }) => (
  <Link
    to={routeHelpers.artistDetail(artist.artist_id)}
    className="group bg-white/5 rounded-3xl p-4 hover:bg-white/10 transition-all border border-white/5 hover:border-acrobat-primary/30 block text-center"
  >
    <div className="aspect-square bg-white/10 rounded-full mb-4 overflow-hidden shadow-lg mx-auto relative w-2/3">
      {artist.image_url ? (
        <img src={uploadApi.fileUrl(artist.image_url)} alt={artist.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-2xl">🎤</div>
      )}
    </div>
    <h3 className="font-bold text-white truncate">{artist.name}</h3>
  </Link>
)


const Playlists = ({ view }) => {
  const [playlists, setPlaylists] = useState([])
  const [favAlbums, setFavAlbums] = useState([])
  const [favArtists, setFavArtists] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({ name: '' })
  const [formLoading, setFormLoading] = useState(false)

  // Load Library (Playlists + Favorites)
  useEffect(() => {
    fetchLibrary()
  }, [currentPage, search])

  const fetchLibrary = async () => {
    setLoading(true)
    try {
      // Fetch Playlists
      const params = { page: currentPage, limit: 18 }
      if (search.trim()) params.search = search.trim()
      const plResponse = await playlistsApi.getAll(params)
      setPlaylists(plResponse.data.data.playlists || [])
      setPagination(plResponse.data.data.pagination || {})

      // Fetch Favorites (Only on first page and empty search to avoid clutter, or implement separate tabs)
      // For now, fetching them always for the 'Library' feel
      const favResponse = await favoritesApi.list()
      if (favResponse.data && favResponse.data.data) {
        setFavAlbums(favResponse.data.data.albums.map(f => ({ ...f.album, favorite_id: f.favorite_id })))
        setFavArtists(favResponse.data.data.artists.map(f => ({ ...f.artist, favorite_id: f.favorite_id })))
      }
    } catch (error) {
      console.error('Fetch library failed:', error)
      toast.error('Kütüphane yüklenemedi')
    } finally { setLoading(false) }
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    setFormLoading(true)
    try {
      await playlistsApi.create({ name: formData.name.trim() })
      toast.success('Çalma listesi oluşturuldu')
      setShowCreateModal(false)
      fetchLibrary()
    } catch (error) { toast.error('Oluşturulamadı') }
    finally { setFormLoading(false) }
  }

  // Determine what to show
  const showPlaylists = !view || view === 'playlists'
  const showAlbums = view === 'albums'
  const showArtists = view === 'artists'

  const getTitle = () => {
    if (showAlbums) return 'Favori Albümlerim'
    if (showArtists) return 'Takip Ettiğim Artistler'
    return 'Çalma Listeleri' // Default
  }

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">Kütüphanem</h4>
          <h1 className="text-4xl font-black tracking-tighter text-white">{getTitle()}</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <span className="absolute inset-y-0 left-4 flex items-center text-acrobat-text-muted pointer-events-none group-focus-within:text-white transition-colors">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input rounded-full pl-12 pr-6 h-10 text-sm md:w-64"
              placeholder="Kütüphanede ara..."
            />
          </div>
          {showPlaylists && (
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary h-10">Yeni Liste</button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-1 overflow-x-auto">
        <Link
          to="/app/playlists"
          className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors whitespace-nowrap ${showPlaylists ? 'bg-white/10 text-white border-b-2 border-acrobat-primary' : 'text-acrobat-text-muted hover:text-white hover:bg-white/5'}`}
        >
          Çalma Listeleri
        </Link>
        <Link
          to="/app/library/albums"
          className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors whitespace-nowrap ${showAlbums ? 'bg-white/10 text-white border-b-2 border-acrobat-primary' : 'text-acrobat-text-muted hover:text-white hover:bg-white/5'}`}
        >
          Favori Albümler
        </Link>
        <Link
          to="/app/library/artists"
          className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors whitespace-nowrap ${showArtists ? 'bg-white/10 text-white border-b-2 border-acrobat-primary' : 'text-acrobat-text-muted hover:text-white hover:bg-white/5'}`}
        >
          Favori Sanatçılar
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-acrobat-primary border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <>
          {/* Playlists Section */}
          {showPlaylists && (
            <section>
              <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">📂 Çalma Listelerin</h2>
              {playlists.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {playlists.map(p => <PlaylistCard key={p.playlist_id} playlist={p} />)}
                </div>
              ) : (
                <div className="text-center py-10 border border-dashed border-white/10 rounded-3xl">
                  <p className="text-acrobat-text-muted">Henüz çalma listeniz yok.</p>
                </div>
              )}
              {pagination.pages > 1 && (
                <div className="mt-8"><Pagination currentPage={currentPage} totalPages={pagination.pages} onPageChange={setCurrentPage} /></div>
              )}
            </section>
          )}

          {/* Favorite Albums Section */}
          {showAlbums && (
            <section>
              <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">💿 Favori Albümler</h2>
              {favAlbums.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {favAlbums.map(album => <AlbumCard key={album.album_id} album={album} />)}
                </div>
              ) : (
                <div className="text-center py-20">
                  <span className="text-4xl block mb-4">💿</span>
                  <p className="text-acrobat-text-muted">Henüz favori albümün yok.</p>
                </div>
              )}
            </section>
          )}

          {/* Favorite Artists Section */}
          {showArtists && (
            <section>
              <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">🎤 Takip Ettiğin Sanatçılar</h2>
              {favArtists.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {favArtists.map(artist => <ArtistCard key={artist.artist_id} artist={artist} />)}
                </div>
              ) : (
                <div className="text-center py-20">
                  <span className="text-4xl block mb-4">🎤</span>
                  <p className="text-acrobat-text-muted">Henüz takip ettiğin sanatçı yok.</p>
                </div>
              )}
            </section>
          )}

          {/* Empty State Logic */}
          {!loading &&
            ((showPlaylists && playlists.length === 0) ||
              (showAlbums && favAlbums.length === 0) ||
              (showArtists && favArtists.length === 0)) && (
              <div className="mt-8 text-center opacity-30">
                <p className="text-sm">Keşfetmeye başla!</p>
              </div>
            )}
        </>
      )}

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Yeni Çalma Listesi Oluştur">
        <form onSubmit={handleCreateSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-acrobat-text-muted px-1">Liste Adı</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
              className="input font-bold"
              placeholder="My Awesome Mix"
              required
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary flex-1">İptal</button>
            <button type="submit" disabled={formLoading} className="btn btn-primary flex-1">{formLoading ? 'Oluşturuluyor...' : 'Oluştur'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Playlists
