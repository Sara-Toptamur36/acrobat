import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { usePlayer } from '../contexts/PlayerContext'
import { toast } from 'react-hot-toast'
import { routeHelpers } from '../router/routes'
import { songsApi } from '../services/api'
import Table from '../components/Table'
import Pagination from '../components/Pagination'
import StarRating from '../components/StarRating'

const Songs = () => {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [searchParams] = useSearchParams()
  const genreId = searchParams.get('genre_id')
  const artistId = searchParams.get('artist_id')
  const { playSong, togglePlay, currentSong, isPlaying, isShuffle, setIsShuffle } = usePlayer()

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      fetchSongs()
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm, genreId, artistId])

  useEffect(() => {
    fetchSongs()
  }, [currentPage, genreId, artistId])

  const handleShufflePlay = () => {
    if (songs.length > 0) {
      setIsShuffle(true)
      const randomIdx = Math.floor(Math.random() * songs.length)
      playSong(songs[randomIdx], songs)
    }
  }

  const fetchSongs = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: currentPage, limit: 100, sort_by_rating: true }
      if (searchTerm.trim()) params.search = searchTerm.trim()
      if (genreId) params.genre_id = genreId
      if (artistId) params.artist_id = artistId
      const response = await songsApi.getAll(params)
      setSongs(response.data.data.songs || [])
      setPagination(response.data.data.pagination || {})
    } catch (error) {
      toast.error('Şarkılar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm])

  const formatDuration = (seconds) => {
    if (!seconds) return '-'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const columns = [
    {
      key: 'play_action',
      title: '',
      className: 'w-10 text-center',
      render: (v, row) => {
        const isCurrent = currentSong?.song_id === row.song_id
        const rowPlaying = isCurrent && isPlaying
        return (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (rowPlaying) togglePlay()
              else playSong(row, songs)
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${rowPlaying ? 'bg-acrobat-green text-black' : 'bg-white/10 hover:bg-white text-white hover:text-black'
              }`}
          >
            {rowPlaying ? '⏸' : '▶'}
          </button>
        )
      }
    },
    {
      key: 'title',
      title: 'Parça',
      render: (v, row) => (
        <Link to={routeHelpers.songDetail(row.song_id)} className="block group">
          <p className={`font-bold transition-colors ${currentSong?.song_id === row.song_id ? 'text-acrobat-green' : 'text-white group-hover:text-acrobat-green'}`}>{v}</p>
          <p className="text-xs text-acrobat-text-muted">{row.album?.artist?.name}</p>
        </Link>
      )
    },
    {
      key: 'album',
      title: 'Koleksiyon',
      className: 'hidden md:table-cell',
      render: (v) => (
        <Link to={routeHelpers.albumDetail(v?.album_id)} className="text-acrobat-text-muted hover:text-white transition-colors text-sm font-medium">
          {v?.title}
        </Link>
      )
    },
    {
      key: 'genre',
      title: 'Tür',
      render: (v) => (
        <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] uppercase font-black tracking-widest text-acrobat-text-muted">
          {v?.name || 'Pop'}
        </span>
      )
    },
    {
      key: 'duration',
      title: '⏱️',
      className: 'text-right',
      render: (v) => <span className="text-acrobat-text-muted tabular-nums">{formatDuration(v)}</span>
    },
    {
      key: 'average_rating',
      title: 'Trend',
      className: 'text-right',
      render: (v) => (
        <div className="inline-flex items-center gap-2">
          <span className="text-acrobat-green font-black tabular-nums">{v ? v.toFixed(1) : '–'}</span>
          <span className="text-[10px] text-white/20">/ 10</span>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-acrobat-green mb-1">Popüler</h4>
          <h1 className="text-4xl font-black tracking-tighter text-white">En İyi Parçalar</h1>
          <button
            onClick={handleShufflePlay}
            className="mt-4 px-6 py-2 bg-acrobat-primary rounded-full text-white font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-acrobat-primary/20"
          >
            🔀 Karışık Çal
          </button>
        </div>

        <div className="relative group">
          <span className="absolute inset-y-0 left-4 flex items-center text-acrobat-text-muted pointer-events-none group-focus-within:text-white transition-colors">🔍</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input rounded-full pl-12 pr-6 h-10 text-sm md:w-80"
            placeholder="Şarkı, sanatçı veya albüm ara..."
          />
        </div>
      </div>

      <div className="mt-6">
        <Table columns={columns} data={songs} loading={loading} />

        {pagination.total_pages > 1 && (
          <div className="mt-12">
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.total_pages}
              onPageChange={setCurrentPage}
              totalItems={pagination.total_items}
              itemsPerPage={20}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default Songs
