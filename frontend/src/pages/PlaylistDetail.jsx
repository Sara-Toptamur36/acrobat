import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { usePlayer } from '../contexts/PlayerContext'
import { routeHelpers } from '../router/routes'
import { playlistsApi, songsApi, uploadApi } from '../services/api'
import Modal from '../components/Modal'
import ImageUpload from '../components/ImageUpload'

const PlaylistDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [playlist, setPlaylist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddSongModal, setShowAddSongModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [availableSongs, setAvailableSongs] = useState([])
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [reordering, setReordering] = useState(false)
  const [showCoverModal, setShowCoverModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const { playSong, isShuffle, toggleShuffle, currentSong, isPlaying, togglePlay, setIsShuffle } = usePlayer()

  // Create a pure list of songs for player context
  const songList = playlist?.songs?.map(item => item.song).filter(Boolean) || []

  const handlePlayPlaylist = () => {
    if (songList.length > 0) {
      setIsShuffle(false)
      playSong(songList[0], songList)
    }
  }

  const handleShufflePlay = () => {
    if (songList.length > 0) {
      setIsShuffle(true)
      const randomIdx = Math.floor(Math.random() * songList.length)
      playSong(songList[randomIdx], songList)
    }
  }

  useEffect(() => {
    fetchPlaylist()
  }, [id])

  const fetchPlaylist = async () => {
    setLoading(true)
    try {
      const response = await playlistsApi.getById(id)
      setPlaylist(response.data.data)
    } catch (error) { navigate('/app/playlists') }
    finally { setLoading(false) }
  }

  const fetchAvailableSongs = async () => {
    try {
      const response = await songsApi.getAll({ limit: 50, search: searchTerm })
      // Extract songs from nested data structure
      const songsData = response.data.data?.songs || response.data.data || []
      setAvailableSongs(Array.isArray(songsData) ? songsData : [])
    } catch (e) {
      setAvailableSongs([])
    }
  }

  useEffect(() => {
    if (showAddSongModal) fetchAvailableSongs()
  }, [showAddSongModal, searchTerm])

  const handleDragEnd = async () => {
    if (draggedIndex === null) return

    setReordering(true)
    try {
      // Create song_orders array with song_id and position
      const songOrders = playlist.songs.map((song, index) => ({
        song_id: song.song_id,
        position: index + 1
      }))

      await playlistsApi.reorder(id, songOrders)
      toast.success('Sıralama kaydedildi')
    } catch (error) {
      console.error('Reorder error:', error)
      toast.error('Sıralama kaydedilemedi')
      fetchPlaylist() // Revert on error
    } finally {
      setDraggedIndex(null)
      setReordering(false)
    }
  }

  const handleCoverUpload = async (fileToUpload) => {
    const file = fileToUpload || selectedFile
    if (!file) return

    setIsUploading(true)
    try {
      await playlistsApi.uploadCover(id, file)
      toast.success('Kapak resmi yüklendi')
      setSelectedFile(null)
      setShowCoverModal(false)
      fetchPlaylist()
    } catch (error) {
      console.error('Cover upload error:', error)
      toast.error('Kapak resmi yüklenemedi')
      throw error // Re-throw so ImageUpload knows if auto-uploading
    } finally {
      setIsUploading(false)
    }
  }

  const handleCoverDelete = async () => {
    try {
      await playlistsApi.deleteCover(id)
      toast.success('Kapak resmi silindi')
      fetchPlaylist()
    } catch (error) {
      console.error('Cover delete error:', error)
      toast.error('Kapak resmi silinemedi')
    }
  }

  const handleAddSong = async (songId) => {
    try {
      await playlistsApi.addSong(id, songId)
      toast.success('Parça eklendi')
      fetchPlaylist()
    } catch (e) { toast.error('Çakışma veya hata') }
  }

  const handleRemoveSong = async (songId) => {
    try {
      await playlistsApi.removeSong(id, songId)
      toast.success('Parça çıkarıldı')
      fetchPlaylist()
    } catch (e) { toast.error('Çıkarılamadı') }
  }

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (loading) return <div className="animate-pulse space-y-10"><div className="h-[300px] bg-white/5 rounded-3xl"></div></div>

  if (!playlist) return null

  const totalDuration = playlist?.songs?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0
  // Check if current user is the owner of THIS playlist (not just any logged-in user)
  const isOwner = playlist.user_id === user?.user_id

  return (
    <div className="space-y-10 animate-fade-in text-inherit no-underline">
      {/* Hero Header */}
      <section className="flex flex-col md:flex-row items-end gap-8 pb-8 border-b border-white/5 relative overflow-hidden text-inherit no-underline">
        <div className="w-56 h-56 shadow-2xl rounded-2xl shrink-0 border border-white/10 overflow-hidden group relative">
          {playlist.cover_image ? (
            <img src={uploadApi.fileUrl(playlist.cover_image)} alt={playlist.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-800 flex items-center justify-center">
              <span className="text-7xl">🎵</span>
            </div>
          )}
          {isOwner && (
            <button
              onClick={() => setShowCoverModal(true)}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold"
            >
              {playlist.cover_image ? 'Kapağı Değiştir' : 'Kapak Ekle'}
            </button>
          )}
        </div>
        <div className="flex-1 space-y-3">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-acrobat-text-muted">Çalma Listesi</span>
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter leading-none text-white">{playlist.name}</h1>
          <div className="flex items-center gap-2 text-sm font-bold">
            <span className="text-white">{playlist.username}</span>
            <span className="text-acrobat-text-muted">•</span>
            <span className="text-acrobat-text-muted">{playlist.songs?.length || 0} parça</span>
            <span className="text-acrobat-text-muted">, {Math.floor(totalDuration / 60)} dak</span>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-between text-inherit no-underline">
        <div className="flex items-center gap-5 text-inherit no-underline">
          <button onClick={handlePlayPlaylist} className="w-14 h-14 bg-acrobat-green rounded-full flex items-center justify-center text-black text-2xl hover:scale-105 transition-transform shadow-xl">▶</button>
          <button onClick={handleShufflePlay} className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-white text-2xl hover:bg-white/20 hover:scale-105 transition-all shadow-xl" title="Karışık Çal">🔀</button>
          {isOwner && (
            <>
              <button
                onClick={async () => {
                  try {
                    const newStatus = !playlist.is_public;
                    await playlistsApi.update(id, { is_public: newStatus });
                    toast.success(newStatus ? 'Liste artık herkese açık' : 'Liste artık gizli');
                    fetchPlaylist();
                  } catch (e) {
                    toast.error('Görünürlük değiştirilemedi');
                  }
                }}
                className={`btn ${playlist.is_public ? 'btn-primary' : 'btn-secondary'} border-white/10`}
              >
                {playlist.is_public ? '🌍 Herkese Açık' : '🔒 Gizli'}
              </button>
              <button onClick={() => setShowAddSongModal(true)} className="btn btn-secondary border-white/10 hover:border-white">Şarkı Ekle</button>
            </>
          )}
        </div>
        {isOwner && (
          <button onClick={async () => {
            if (window.confirm('Bu listeyi silmek istediğinize emin misiniz?')) {
              await playlistsApi.delete(id)
              toast.success('Liste silindi')
              navigate('/app/playlists')
            }
          }} className="text-red-500 font-bold hover:underline text-xs">Listeyi Sil</button>
        )}
      </div>

      {/* Song List */}
      <div className="table-container bg-transparent text-inherit no-underline">
        <table className="table-modern text-inherit no-underline">
          <thead>
            <tr className="text-inherit no-underline">
              <th className="w-12 text-center text-inherit no-underline">#</th>
              <th className="text-inherit no-underline">Başlık</th>
              <th className="hidden md:table-cell text-inherit no-underline">Albüm</th>
              <th className="w-20 text-right text-inherit no-underline">⏱️</th>
              {isOwner && <th className="w-12 text-inherit no-underline"></th>}
            </tr>
          </thead>
          <tbody>
            {playlist.songs?.map((playlistSong, idx) => {
              const song = playlistSong.song
              const isCurrent = currentSong?.song_id === song?.song_id
              const rowPlaying = isCurrent && isPlaying

              return (
                <tr key={playlistSong.song_id} className={`group text-inherit no-underline ${isCurrent ? 'bg-white/10' : ''}`}>
                  <td className="text-center font-medium opacity-50 group-hover:opacity-100 text-inherit no-underline w-12">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (rowPlaying) togglePlay()
                        else playSong(song, songList)
                      }}
                      className="hidden group-hover:flex w-8 h-8 mx-auto items-center justify-center rounded-full bg-white text-black"
                    >
                      {rowPlaying ? '⏸' : '▶'}
                    </button>
                    <span className="block group-hover:hidden">{idx + 1}</span>
                  </td>
                  <td className="text-inherit no-underline">
                    <Link to={routeHelpers.songDetail(playlistSong.song_id)} className="block group-hover:text-white transition-colors text-inherit no-underline">
                      <p className="font-bold text-white text-inherit no-underline">{playlistSong.song?.title}</p>
                      <p className="text-xs text-acrobat-text-muted text-inherit no-underline">{playlistSong.song?.album?.artist?.name}</p>
                    </Link>
                  </td>
                  <td className="hidden md:table-cell text-sm text-acrobat-text-muted text-inherit no-underline">{playlistSong.song?.album?.title}</td>
                  <td className="text-right tabular-nums text-acrobat-text-muted text-inherit no-underline">{formatDuration(playlistSong.song?.duration)}</td>
                  {isOwner && (
                    <td className="text-center text-inherit no-underline">
                      <button onClick={() => handleRemoveSong(playlistSong.song_id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-300 transition-opacity">✕</button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
        {(!playlist.songs || playlist.songs.length === 0) && (
          <div className="py-20 text-center opacity-30 text-inherit no-underline">
            <p className="text-4xl">🌫️</p>
            <p className="font-bold">Bu liste boş</p>
          </div>
        )}
      </div>

      <Modal isOpen={showAddSongModal} onClose={() => setShowAddSongModal(false)} title="Şarkı Ara">
        <div className="space-y-4">
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input" placeholder="Şarkı ara..." />
          <div className="max-h-80 overflow-y-auto space-y-2">
            {availableSongs.map(song => (
              <div key={song.song_id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <p className="font-bold text-white text-sm">{song.title}</p>
                  <p className="text-xs text-acrobat-text-muted">{song.album?.artist?.name}</p>
                </div>
                <button onClick={() => handleAddSong(song.song_id)} className="btn btn-primary btn-sm px-3 py-1">Ekle</button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Cover Upload Modal */}
      <Modal isOpen={showCoverModal} onClose={() => { setShowCoverModal(false); setSelectedFile(null); }} title="Playlist Kapağı">
        <div className="space-y-6">
          <ImageUpload
            currentImage={playlist.cover_image ? uploadApi.fileUrl(playlist.cover_image) : null}
            onUpload={handleCoverUpload}
            onDelete={playlist.cover_image ? handleCoverDelete : null}
            autoUpload={false}
            onFileSelect={(file) => setSelectedFile(file)}
          />

          {selectedFile && (
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => setSelectedFile(null)}
                disabled={isUploading}
                className="btn btn-secondary btn-sm"
              >
                Vazgeç
              </button>
              <button
                onClick={() => handleCoverUpload()}
                disabled={isUploading}
                className="btn btn-primary btn-sm px-8"
              >
                {isUploading ? 'Yükleniyor...' : 'Kapağı Kaydet'}
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default PlaylistDetail
