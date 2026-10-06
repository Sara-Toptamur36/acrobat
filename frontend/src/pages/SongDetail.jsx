import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { usePlayer } from '../contexts/PlayerContext'
import { ROUTES, routeHelpers } from '../router/routes'
import { songsApi, ratingsApi, playlistsApi, favoritesApi } from '../services/api'
import StarRating from '../components/StarRating'
import Pagination from '../components/Pagination'

const SongDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { playSong } = usePlayer()
  const [song, setSong] = useState(null)
  const [ratings, setRatings] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [ratingsLoading, setRatingsLoading] = useState(true)
  const [ratingsAvailable, setRatingsAvailable] = useState(true)
  const [pagination, setPagination] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [userRating, setUserRating] = useState(null)
  const [showRatingForm, setShowRatingForm] = useState(false)
  const [ratingForm, setRatingForm] = useState({ rating: '', comment: '' })

  useEffect(() => {
    fetchSong()
    fetchRatings()
    fetchUserPlaylists()
  }, [id])

  useEffect(() => {
    fetchRatings()
  }, [currentPage])

  const fetchSong = async () => {
    setLoading(true)
    try {
      const response = await songsApi.getById(id)
      setSong(response.data.data)
    } catch (error) {
      console.error('Failed to fetch song:', error)
      toast.error('Şarkı detayları yüklenemedi')
      navigate(ROUTES.APP.SONGS)
    } finally {
      setLoading(false)
    }
  }

  const fetchRatings = async () => {
    setRatingsLoading(true)
    try {
      const response = await ratingsApi.getSongRatings(id, { page: currentPage, limit: 10 })
      const ratingsData = response.data.data.ratings || []
      setRatings(ratingsData)
      setPagination(response.data.data.pagination || {})

      // Check if current user has rated this song
      const currentUserRating = ratingsData.find(r => r.user_id === user?.user_id)
      setUserRating(currentUserRating)
      setRatingsAvailable(true)
    } catch (error) {
      console.error('Failed to fetch ratings:', error)
      setRatingsAvailable(false)
      setRatings([])
      setPagination({})
    } finally {
      setRatingsLoading(false)
    }
  }

  const fetchUserPlaylists = async () => {
    try {
      const response = await playlistsApi.getAll({ limit: 100 })
      setPlaylists(response.data.data.playlists || [])
    } catch (error) {
      console.error('Failed to fetch playlists:', error)
    }
  }

  const handleRatingSubmit = async (e) => {
    e.preventDefault()

    if (!ratingsAvailable) {
      toast.error('Ratings are not available at this time')
      return
    }

    if (!ratingForm.rating && !ratingForm.comment.trim()) {
      toast.error('Lütfen bir puan veya yorum belirtin')
      return
    }

    try {
      const payload = {}
      if (ratingForm.rating) payload.rating = parseFloat(ratingForm.rating)
      if (ratingForm.comment.trim()) payload.comment = ratingForm.comment.trim()

      if (userRating) {
        // Use song_id for update, not rating_id
        await ratingsApi.updateRating(id, payload)
        toast.success('Puan başarıyla güncellendi')
      } else {
        await ratingsApi.rateSong(id, payload)
        toast.success('Puan başarıyla eklendi')
      }

      setShowRatingForm(false)
      setRatingForm({ rating: '', comment: '' })
      fetchRatings()
      fetchSong() // Refresh to get updated average rating
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error('Bu şarkıyı zaten puanladınız')
      } else {
        toast.error('Puan kaydedilemedi')
      }
    }
  }

  const handleDeleteRating = async () => {
    if (!ratingsAvailable) {
      toast.error('Ratings are not available at this time')
      return
    }

    try {
      // Use song_id for delete, not rating_id
      await ratingsApi.deleteRating(id)
      toast.success('Puan başarıyla silindi')
      setUserRating(null)
      setRatingForm({ rating: '', comment: '' })
      fetchRatings()
      fetchSong()
    } catch (error) {
      console.error('Delete rating error:', error)
      toast.error('Puan silinemedi')
    }
  }

  const handleAddToPlaylist = async (playlistId) => {
    try {
      await playlistsApi.addSong(playlistId, parseInt(id))
      toast.success('Şarkı listeye eklendi')
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error('Şarkı zaten listede mevcut')
      } else {
        toast.error('Şarkı listeye eklenemedi')
      }
    }
  }

  const handleLike = async () => {
    try {
      const response = await favoritesApi.toggle(song.song_id)
      if (response.data.data.status === 'liked') {
        toast.success('Şarkı beğenildi!')
      } else {
        toast.success('Şarkı beğenilenlerden çıkarıldı')
      }
    } catch (error) {
      toast.error('İşlem başarısız oldu')
    }
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!song) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎵</div>
        <p className="text-gray-500 mb-4">Şarkı bulunamadı</p>
        <Link to={ROUTES.APP.SONGS} className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
          Şarkılara Dön
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to={ROUTES.APP.SONGS}
          className="p-3 rounded-xl hover:bg-white/5 transition-all"
        >
          <span className="text-xl">❮</span>
        </Link>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter">{song.title}</h1>
          <p className="text-sm text-gray-600">
            by <Link
              to={routeHelpers.artistDetail(song.album?.artist_id)}
              className="text-acrobat-primary font-bold hover:underline"
            >
              {song.album?.artist?.name}
            </Link> • <Link
              to={routeHelpers.albumDetail(song.album_id)}
              className="text-acrobat-primary font-bold hover:underline"
            >
              {song.album?.title}
            </Link>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Song Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-acrobat-surface rounded-3xl shadow-2xl border border-white/5 p-8 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-acrobat-primary/5 to-transparent pointer-events-none"></div>
            <div className="flex items-start space-x-8 relative z-10">
              <div className="w-32 h-32 rounded-2xl bg-acrobat-surface-light border-4 border-white/5 flex items-center justify-center shadow-2xl">
                <span className="text-6xl">🎵</span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-black text-white mb-2">{song.title}</h2>
                <p className="text-gray-600 mb-4">
                  <Link
                    to={routeHelpers.artistDetail(song.album?.artist_id)}
                    className="text-acrobat-primary font-bold hover:underline"
                  >
                    {song.album?.artist?.name}
                  </Link> • <Link
                    to={routeHelpers.albumDetail(song.album_id)}
                    className="text-acrobat-primary font-bold hover:underline"
                  >
                    {song.album?.title}
                  </Link>
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2">⏱️</span>
                    <span>{formatDuration(song.duration)}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {song.genre?.name || 'Tür yok'}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <button
                      onClick={() => playSong(song)}
                      className="inline-flex items-center px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest bg-acrobat-green text-black hover:scale-105 transition-all shadow-lg mr-3"
                    >
                      <span className="mr-2">▶</span>
                      Oynat
                    </button>
                    <button
                      onClick={handleLike}
                      className="inline-flex items-center px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest bg-white/5 text-acrobat-text-muted hover:bg-acrobat-primary hover:text-white transition-all border border-white/10"
                    >
                      <span className="mr-2">❤</span>
                      Beğen
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">Parça #{song.track_number || 'Bilinmiyor'}</span>
            </div>
          </div>

          {/* User Rating Section */}
          <div className="bg-acrobat-surface rounded-3xl shadow-2xl border border-white/5 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-white">Senin Puanın</h3>
              {userRating && ratingsAvailable && (
                <button
                  onClick={handleDeleteRating}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Puanı Kaldır
                </button>
              )}
            </div>

            {!ratingsAvailable ? (
              <div className="text-center py-4">
                <div className="text-4xl text-gray-300 mb-2">⭐</div>
                <p className="text-gray-500">Ratings not available</p>
              </div>
            ) : userRating ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <StarRating rating={userRating.rating} readonly />
                  <span className="text-sm text-gray-600">
                    {userRating.rating}/10
                  </span>
                </div>
                {userRating.comment && (
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    "{userRating.comment}"
                  </p>
                )}
                <button
                  onClick={() => {
                    setRatingForm({
                      rating: userRating.rating?.toString() || '',
                      comment: userRating.comment || ''
                    })
                    setShowRatingForm(true)
                  }}
                  className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 transition-colors"
                >
                  Puanı Düzenle
                </button>
              </div>
            ) : (
              <div>
                <p className="text-acrobat-text-muted mb-6">Henüz bu şarkıyı puanlamadınız</p>
                <button
                  onClick={() => setShowRatingForm(true)}
                  className="btn btn-primary"
                >
                  <span className="mr-2">⭐</span>
                  Bu Şarkıyı Puanla
                </button>
              </div>
            )}

            {/* Rating Form */}
            {showRatingForm && ratingsAvailable && (
              <form onSubmit={handleRatingSubmit} className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/5 space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-acrobat-text-muted mb-3">
                    Puan (0-10)
                  </label>
                  <select
                    value={ratingForm.rating}
                    onChange={(e) => setRatingForm(prev => ({ ...prev, rating: e.target.value }))}
                    className="input rounded-xl h-12"
                  >
                    <option value="">Puan yok</option>
                    {[...Array(11)].map((_, i) => (
                      <option key={i} value={i}>{i}/10</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-acrobat-text-muted mb-3">
                    Yorum (isteğe bağlı)
                  </label>
                  <textarea
                    value={ratingForm.comment}
                    onChange={(e) => setRatingForm(prev => ({ ...prev, comment: e.target.value }))}
                    className="input rounded-xl"
                    rows={4}
                    placeholder="Bu şarkı hakkındaki düşüncelerinizi paylaşın..."
                  />
                </div>
                <div className="flex space-x-4">
                  <button type="submit" className="btn btn-primary px-8">
                    {userRating ? 'Puanı Güncelle' : 'Puan Ver'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRatingForm(false)
                      setRatingForm({ rating: '', comment: '' })
                    }}
                    className="btn btn-secondary px-8"
                  >
                    İptal
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* All Ratings */}
          <div className="bg-acrobat-surface rounded-3xl shadow-2xl border border-white/5 overflow-hidden">
            <div className="p-8 border-b border-white/5 bg-white/5">
              <h3 className="text-xl font-black text-white">Tüm Puanlar & Yorumlar</h3>
            </div>

            {!ratingsAvailable ? (
              <div className="p-12 text-center">
                <div className="text-6xl text-gray-300 mb-4">💬</div>
                <p className="text-gray-500">Ratings not available</p>
              </div>
            ) : ratingsLoading ? (
              <div className="p-6">
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : ratings.length > 0 ? (
              <>
                <div className="p-6 space-y-4">
                  {ratings.map((rating) => (
                    <div key={rating.review_id || rating.rating_id} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="font-medium text-gray-900">{rating.user?.username || rating.username || 'Anonim'}</span>
                            {(rating.rating !== null && rating.rating !== undefined) && (
                              <StarRating rating={rating.rating} readonly size="sm" />
                            )}
                            <span className="text-sm text-gray-500">
                              {new Date(rating.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {rating.comment && (
                            <p className="text-gray-700">{rating.comment}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {pagination.pages > 1 && (
                  <div className="p-6 border-t border-gray-200">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={pagination.pages}
                      onPageChange={setCurrentPage}
                      totalItems={pagination.total}
                      itemsPerPage={10}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="p-12 text-center">
                <div className="text-6xl text-gray-300 mb-4">💬</div>
                <p className="text-gray-500">Henüz puan veya yorum yok</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Add to Playlist */}
          <div className="bg-acrobat-surface rounded-3xl shadow-2xl border border-white/5 p-8">
            <h3 className="text-xl font-black text-white mb-6">Listeye Ekle</h3>
            {playlists.length > 0 ? (
              <div className="space-y-2">
                {playlists.map((playlist) => (
                  <button
                    key={playlist.playlist_id}
                    onClick={() => handleAddToPlaylist(playlist.playlist_id)}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-900">{playlist.name}</span>
                    <span className="text-gray-400">➕</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-3">Henüz liste yok</p>
                <Link
                  to={ROUTES.APP.PLAYLISTS}
                  className="bg-primary-600 text-white px-3 py-1 rounded text-sm hover:bg-primary-700 transition-colors"
                >
                  Liste Oluştur
                </Link>
              </div>
            )}
          </div>

          {/* Song Stats */}
          <div className="bg-acrobat-surface rounded-3xl shadow-2xl border border-white/5 p-8">
            <h3 className="text-xl font-black text-white mb-6">Şarkı İstatistikleri</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Ortalama Puan:</span>
                <span className="font-medium">
                  {song.average_rating !== null && song.average_rating !== undefined ? song.average_rating.toFixed(1) : 'Puan yok'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Toplam Puan:</span>
                <span className="font-medium">
                  {ratingsAvailable ? (pagination.total || 0) : 'Kullanılamıyor'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Süre:</span>
                <span className="font-medium">{formatDuration(song.duration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Parça Numarası:</span>
                <span className="font-medium">#{song.track_number || 'Bilinmiyor'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SongDetail
