import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { routeHelpers } from '../router/routes'
import api, { API_BASE_URL, favoritesApi, uploadApi } from '../services/api'
import { usePlayer } from '../contexts/PlayerContext'

const AlbumDetail = () => {
  const { id } = useParams()
  const [album, setAlbum] = useState(null)
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [songsLoading, setSongsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const { playSong, togglePlay, currentSong, isPlaying, isShuffle, setIsShuffle } = usePlayer()

  useEffect(() => {
    fetchAlbumAndSongs()
  }, [id])

  const handleShufflePlay = () => {
    if (songs.length > 0) {
      setIsShuffle(true)
      const randomIdx = Math.floor(Math.random() * songs.length)
      playSong(songs[randomIdx], songs)
    }
  }

  const handleNormalPlay = () => {
    if (songs.length > 0) {
      setIsShuffle(false)
      playSong(songs[0], songs)
    } else {
      toast.error('Bu albümde şarkı yok')
    }
  }

  const fetchAlbumAndSongs = async () => {
    try {
      const albumResponse = await api.get(`/albums/${id}`)
      setAlbum(albumResponse.data.data)
      setIsFavorite(albumResponse.data.data.is_favorite || false)

      setSongsLoading(true)
      try {
        // Use album_id parameter to filter songs for this specific album
        const songsResponse = await api.get(`/songs`, { params: { limit: 100, album_id: id } })
        const songsData = songsResponse.data.data?.songs || songsResponse.data.data || []
        setSongs(Array.isArray(songsData) ? songsData : [])
      } catch (e) {
        console.error('Failed to fetch album songs:', e)
        setSongs([])
      }
      finally { setSongsLoading(false) }

    } catch (error) { setNotFound(true) }
    finally { setLoading(false) }
  }

  const handleLike = async (songId) => {
    try {
      const response = await favoritesApi.toggle(songId)
      if (response.data.data.status === 'liked') {
        toast.success('Şarkı beğenildi!')
      } else {
        toast.success('Şarkı beğenilenlerden çıkarıldı')
      }
    } catch (error) {
      toast.error('İşlem başarısız oldu')
    }
  }

  const handleAlbumFavorite = async () => {
    try {
      if (isFavorite) {
        await favoritesApi.removeAlbum(id)
        toast.success('Albüm favorilerden çıkarıldı')
        setIsFavorite(false)
      } else {
        await favoritesApi.addAlbum(id)
        toast.success('Albüm favorilere eklendi')
        setIsFavorite(true)
      }
    } catch (error) {
      toast.error('İşlem başarısız oldu')
    }
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (loading) return (
    <div className="animate-pulse space-y-10">
      <div className="flex gap-10 items-end h-[300px]">
        <div className="w-64 h-64 bg-white/5 rounded-3xl"></div>
        <div className="flex-1 space-y-4">
          <div className="h-4 bg-white/5 rounded w-24"></div>
          <div className="h-12 bg-white/5 rounded w-3/4"></div>
          <div className="h-4 bg-white/5 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-white/5 rounded-xl"></div>)}
      </div>
    </div>
  )

  if (notFound) return <div className="py-20 text-center"><h1 className="text-4xl font-black">Albüm Bulunamadı</h1></div>

  const totalDuration = songs.reduce((sum, s) => sum + (s.duration || 0), 0)
  const albumTime = Math.floor(totalDuration / 60)

  return (
    <div className="space-y-10 animate-fade-in text-inherit no-underline">
      {/* Header Info */}
      <section className="flex flex-col md:flex-row items-end gap-8 pb-8 border-b border-white/5 relative overflow-hidden text-inherit no-underline">
        <div className="w-56 h-56 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden shrink-0 border border-white/10 group">
          {album.cover_image ? (
            <img src={uploadApi.fileUrl(album.cover_image)} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full bg-acrobat-surface-light flex items-center justify-center text-7xl">💿</div>
          )}
        </div>
        <div className="flex-1 space-y-3">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-acrobat-text-muted">Albüm</span>
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter leading-none text-white">{album.title}</h1>
          <div className="flex items-center gap-2 text-sm font-bold flex-wrap">
            <Link to={routeHelpers.artistDetail(album.artist_id)} className="hover:underline transition-all">
              <div className="flex items-center gap-2 group">
                <span className="text-white group-hover:text-acrobat-green transition-colors">{album.artist?.name}</span>
              </div>
            </Link>
            <span className="text-acrobat-text-muted">•</span>
            <span className="text-acrobat-text-muted">{album.release_year}</span>
            <span className="text-acrobat-text-muted">•</span>
            <span className="text-white font-black">{songs.length} şarkı</span>
            <span className="text-acrobat-text-muted">, {albumTime} dak</span>
          </div>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-1/3 aspect-square bg-acrobat-primary/10 blur-[100px] rounded-full"></div>
      </section>

      {/* Action Bar */}
      <div className="flex items-center gap-5 text-inherit no-underline">
        <button
          onClick={handleNormalPlay}
          className="w-14 h-14 bg-acrobat-primary rounded-full flex items-center justify-center text-white text-2xl hover:scale-105 transition-transform shadow-xl shadow-acrobat-primary/20"
        >
          ▶
        </button>
        <button
          onClick={handleShufflePlay}
          className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-white text-2xl hover:bg-white/20 hover:scale-105 transition-all shadow-xl"
          title="Karışık Çal"
        >
          🔀
        </button>
        <button
          onClick={handleAlbumFavorite}
          className={`w-10 h-10 rounded-full border flex items-center justify-center text-xl transition-colors ${isFavorite ? 'bg-red-500 border-red-500 text-white' : 'border-white/20 hover:border-white'}`}
        >
          {isFavorite ? '❤️' : '🤍'}
        </button>
        <button className="text-acrobat-text-muted hover:text-white transition-colors text-sm">•••</button>
      </div>

      {/* Song List */}
      <div className="table-container bg-transparent text-inherit no-underline">
        <table className="table-modern text-inherit no-underline">
          <thead>
            <tr className="text-inherit no-underline">
              <th className="w-12 text-center text-inherit no-underline">#</th>
              <th className="text-inherit no-underline">Başlık</th>
              <th className="hidden md:table-cell text-inherit no-underline">Tür</th>
              <th className="text-center text-inherit no-underline">Puan</th>
              <th className="w-20 text-right text-inherit no-underline">⏱️</th>
            </tr>
          </thead>
          <tbody>
            {songs.map((song, idx) => {
              const isCurrent = currentSong?.song_id === song.song_id
              const rowPlaying = isCurrent && isPlaying
              return (
                <tr
                  key={song.song_id}
                  className={`cursor-pointer group text-inherit no-underline transition-colors ${isCurrent ? 'bg-white/10' : ''}`}
                  onClick={() => playSong(song, songs)}
                >
                  <td className="text-center font-medium opacity-50 group-hover:opacity-100 text-inherit no-underline w-12">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (rowPlaying) togglePlay()
                        else playSong(song, songs)
                      }}
                      className="hidden group-hover:flex w-8 h-8 mx-auto items-center justify-center rounded-full bg-white text-black"
                    >
                      {rowPlaying ? '⏸' : '▶'}
                    </button>
                    <span className="block group-hover:hidden">{idx + 1}</span>
                  </td>
                  <td className="text-inherit no-underline">
                    <Link to={routeHelpers.songDetail(song.song_id)} className="block group-hover:text-white transition-colors text-inherit no-underline">
                      <p className={`font-bold transition-colors text-inherit no-underline ${isCurrent ? 'text-acrobat-green' : 'text-white'}`}>{song.title}</p>
                      <p className="text-xs text-acrobat-text-muted text-inherit no-underline">{album.artist?.name}</p>
                    </Link>
                  </td>
                  <td className="hidden md:table-cell text-sm text-inherit no-underline">
                    <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] uppercase font-black tracking-widest text-inherit no-underline">
                      {song.genre?.name || 'Tarz'}
                    </span>
                  </td>
                  <td className="text-center text-inherit no-underline">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLike(song.song_id)
                      }}
                      className="hover:scale-125 transition-transform text-gray-500 hover:text-red-500"
                    >
                      ❤
                    </button>
                  </td>
                  <td className="text-right tabular-nums text-acrobat-text-muted text-inherit no-underline">{formatDuration(song.duration)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {songs.length === 0 && !songsLoading && (
          <div className="py-20 text-center opacity-30 text-inherit no-underline">
            <p className="text-4xl">🌫️</p>
            <p className="font-bold">Bu koleksiyon için listelenmiş parça yok</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AlbumDetail
