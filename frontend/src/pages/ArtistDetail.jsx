import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { routeHelpers } from '../router/routes'
import api, { API_BASE_URL, favoritesApi, uploadApi } from '../services/api'

const ArtistDetail = () => {
  const { id } = useParams()
  const [artist, setArtist] = useState(null)
  const [albums, setAlbums] = useState([])
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [albumsLoading, setAlbumsLoading] = useState(true)
  const [songsLoading, setSongsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    fetchArtistAndAlbums()
  }, [id])

  const fetchArtistAndAlbums = async () => {
    setLoading(true)
    try {
      // Use direct fetch by ID instead of filtering all artists
      const response = await api.get(`/artists/${id}`)
      const foundArtist = response.data.data

      if (!foundArtist) {
        setNotFound(true)
        return
      }
      setArtist(foundArtist)
      setIsFavorite(foundArtist.is_favorite || false)

      setAlbumsLoading(true)
      try {
        const albumsResponse = await api.get(`/albums?artist_id=${id}`)
        setAlbums(albumsResponse.data.data.albums || [])
      } catch (e) { setAlbums([]) }
      finally { setAlbumsLoading(false) }

      setSongsLoading(true)
      try {
        const songsResponse = await api.get(`/songs?artist_id=${id}&limit=5&sort_by_rating=true`)
        setSongs(songsResponse.data.data.songs || [])
      } catch (e) { setSongs([]) }
      finally { setSongsLoading(false) }

    } catch (error) {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  const handleArtistFavorite = async () => {
    try {
      if (isFavorite) {
        await favoritesApi.removeArtist(id)
        toast.success('Sanatçı favorilerden çıkarıldı')
        setIsFavorite(false)
      } else {
        await favoritesApi.addArtist(id)
        toast.success('Sanatçı favorilere eklendi')
        setIsFavorite(true)
      }
    } catch (error) {
      toast.error('İşlem başarısız oldu')
    }
  }

  if (loading) return (
    <div className="animate-pulse space-y-10">
      <div className="h-[300px] bg-white/5 rounded-3xl"></div>
      <div className="grid grid-cols-6 gap-6">
        {[...Array(6)].map((_, i) => <div key={i} className="aspect-square bg-white/5 rounded-xl"></div>)}
      </div>
    </div>
  )

  if (notFound) return (
    <div className="py-20 text-center">
      <h1 className="text-4xl font-black mb-4">Sanatçı Bulunamadı</h1>
      <Link to="/app/artists" className="btn btn-primary">Diğerlerini Keşfet</Link>
    </div>
  )

  const totalSongs = albums.reduce((sum, album) => sum + (album.song_count || 0), 0)

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Hero Header */}
      <section className="relative h-[360px] rounded-2xl flex items-end p-8 overflow-hidden border border-white/5 group">
        <div className="absolute inset-0 z-0">
          {artist.image_url ? (
            <img src={uploadApi.fileUrl(artist.image_url)} className="w-full h-full object-cover grayscale brightness-50 group-hover:scale-105 transition-transform duration-[2s]" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-black"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
        </div>

        <div className="relative z-10 flex flex-col items-start">
          <div className="flex items-center gap-2 mb-4">
            <span className="p-1 bg-blue-500 rounded-full text-[10px] text-white">✓</span>
            <span className="text-xs font-black uppercase tracking-widest text-acrobat-text-muted">Doğrulanmış Sanatçı</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-4 animate-slide-up">
            {artist.name}
          </h1>
          <span className="flex items-center gap-4 text-sm font-bold text-white mb-4">
            <span className="flex items-center gap-2"><span className="text-acrobat-green">💿</span> {albums.length} Albüm</span>
            <span className="flex items-center gap-2"><span className="text-acrobat-green">♪</span> {totalSongs} Aylık Dinleyici (tahmini)</span>
          </span>
          <div className="flex gap-3">
            <button
              onClick={handleArtistFavorite}
              className={`btn ${isFavorite ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
            >
              {isFavorite ? '❤️ Favorilerde' : '🤍 Favorilere Ekle'}
            </button>
          </div>
        </div>
      </section>

      {/* Discovery Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Bio, Details & Popular Songs */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-acrobat-surface p-6 rounded-2xl border border-white/5">
            <h3 className="text-lg font-black mb-3 text-white">Hakkında</h3>
            <p className="text-acrobat-text-muted text-xs leading-relaxed font-medium mb-5">
              {artist.bio || "Henüz resmi biyografi bildirilmedi. Sanatçı yönetiminden güncellemeleri bekleyin."}
            </p>
            <div className="pt-5 border-t border-white/5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-acrobat-text-muted mb-2">Yönetim</p>
              <div className="flex gap-2">
                {['Artist', 'Producer', 'Verified'].map(tag => (
                  <span key={tag} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] font-black uppercase tracking-widest text-white/40">
                    {tag === 'Artist' ? 'Sanatçı' : tag === 'Producer' ? 'Yapımcı' : 'Doğrulanmış'}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-acrobat-surface p-6 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-white">Popüler Şarkılar</h3>
              <Link to={`/app/songs?artist_id=${id}`} className="text-[10px] font-black text-acrobat-primary uppercase hover:underline">Tümünü Gör</Link>
            </div>

            <div className="space-y-2">
              {songs.map((song, idx) => (
                <Link
                  key={song.song_id}
                  to={routeHelpers.songDetail(song.song_id)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all group"
                >
                  <span className="text-xs font-black text-acrobat-text-muted w-4">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate group-hover:text-acrobat-primary transition-colors">{song.title}</p>
                    <p className="text-[10px] text-acrobat-text-muted">{song.average_rating ? `⭐ ${song.average_rating.toFixed(1)}` : 'Henüz puan yok'}</p>
                  </div>
                </Link>
              ))}
              {songs.length === 0 && !songsLoading && (
                <p className="text-xs text-acrobat-text-muted opacity-50 text-center py-4">Şarkı bulunamadı.</p>
              )}
            </div>
          </div>
        </div>

        {/* Albums Grid */}
        <div className="lg:col-span-8">
          <h2 className="text-xl font-black tracking-tight mb-6">Diskografi</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {albums.map(album => (
              <Link key={album.album_id} to={routeHelpers.albumDetail(album.album_id)} className="group bg-transparent text-inherit no-underline">
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 shadow-xl border border-white/5">
                  {album.cover_image ? (
                    <img src={uploadApi.fileUrl(album.cover_image)} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  ) : (
                    <div className="w-full h-full bg-acrobat-surface flex items-center justify-center text-4xl">💿</div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 bg-acrobat-green rounded-full flex items-center justify-center text-black shadow-2xl scale-0 group-hover:scale-100 transition-transform">▶</div>
                  </div>
                </div>
                <p className="font-bold truncate text-white">{album.title}</p>
                <p className="text-xs font-bold text-acrobat-text-muted">{album.release_year || 'Single'}</p>
              </Link>
            ))}
            {albums.length === 0 && !albumsLoading && (
              <div className="col-span-full py-20 bg-white/5 rounded-3xl text-center opacity-30">
                <p className="text-4xl mb-2">📦</p>
                <p className="font-bold">Henüz albüm bildirilmedi</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ArtistDetail
