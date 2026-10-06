import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { routeHelpers } from '../../router/routes'
import { reportsApi } from '../../services/api'
import Table from '../../components/Table'
import Pagination from '../../components/Pagination'
import StarRating from '../../components/StarRating'

const TopSongsReport = () => {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchTopSongs()
  }, [currentPage])

  const fetchTopSongs = async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        limit: 20
      }

      const response = await reportsApi.getTopSongs(params)
      setSongs(response.data.data.songs || [])
      setPagination(response.data.data.pagination || {})
    } catch (error) {
      console.error('Failed to fetch top songs report:', error)
      toast.error('En yüksek puanlı şarkılar raporu yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getRankIcon = (index) => {
    if (index === 0) return <span className="text-xl text-yellow-500">🏆</span>
    if (index === 1) return <span className="text-xl text-gray-400">🥈</span>
    if (index === 2) return <span className="text-xl text-amber-600">🥉</span>
    return <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
  }

  const columns = [
    {
      key: 'rank',
      title: 'Sıralama',
      render: (_, row, index) => (
        <div className="flex items-center justify-center">
          {getRankIcon(((currentPage - 1) * 20) + index)}
        </div>
      )
    },
    {
      key: 'song_title',
      title: 'Şarkı',
      render: (value, row) => (
        <div>
          <Link
            to={routeHelpers.songDetail(row.song_id)}
            className="font-medium text-white hover:text-acrobat-primary"
          >
            {value || row.title}
          </Link>
          <p className="text-sm text-neutral-500">{row.artist_name}</p>
        </div>
      )
    },
    {
      key: 'album_title',
      title: 'Albüm',
      render: (value, row) => (
        <Link
          to={routeHelpers.albumDetail(row.album_id)}
          className="text-white hover:text-acrobat-primary"
        >
          {value}
        </Link>
      )
    },
    {
      key: 'average_rating',
      title: 'Puan',
      render: (value) => (
        <div className="flex items-center">
          <StarRating rating={value} readonly size="sm" showValue={false} />
          <span className="ml-2 text-sm font-semibold text-white">
            {value !== null && value !== undefined ? value.toFixed(2) : 'Yok'}
          </span>
        </div>
      )
    },
    {
      key: 'rating_count',
      title: 'Değerlendirmeler',
      render: (value) => (
        <div className="text-center">
          <span className="text-sm text-neutral-400">{value || 0} değerlendirme</span>
        </div>
      )
    },
    {
      key: 'duration',
      title: 'Süre',
      render: (value) => (
        <span className="text-sm text-neutral-500">
          {value ? formatDuration(value) : '-'}
        </span>
      )
    }
  ]

  const averageRating = songs.length > 0
    ? songs.reduce((sum, song) => sum + (song.average_rating || 0), 0) / songs.length
    : 0

  const totalReviews = songs.reduce((sum, song) => sum + (song.rating_count || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to={routeHelpers.reports()}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
        >
          <span className="text-xl">←</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">En Yüksek Puanlı Şarkılar</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Müzik kataloğundaki en yüksek puanlı şarkılar
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black/40 backdrop-blur-md rounded-lg shadow-sm border border-white/5 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-500/20">
              <span className="text-2xl">⭐</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-400">Ortalama Puan</p>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : averageRating.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-md rounded-lg shadow-sm border border-white/5 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-500/20">
              <span className="text-2xl text-blue-500">🎵</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-400">Toplam Değerlendirme</p>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : totalReviews.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-md rounded-lg shadow-sm border border-white/5 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-500/20">
              <span className="text-2xl px-1">🏆</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-400">En İyi Şarkılar</p>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : pagination.total || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Songs Table */}
      <div className="space-y-4">
        {pagination.total > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              {pagination.total} şarkıdan {((currentPage - 1) * 20) + 1} ile {Math.min(currentPage * 20, pagination.total)} arası gösteriliyor
            </p>
          </div>
        )}

        <Table
          columns={columns}
          data={songs}
          loading={loading}
        />

        {!loading && songs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl text-gray-300 mb-4">⭐</div>
            <p className="text-gray-500 mb-4">Puanlanmış şarkı bulunmuyor</p>
            <p className="text-sm text-gray-400">Kullanıcılar şarkıları puanlamaya başladığında en iyi şarkılar burada görünecektir</p>
          </div>
        )}

        {pagination.pages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.pages}
            onPageChange={setCurrentPage}
            totalItems={pagination.total}
            itemsPerPage={20}
          />
        )}
      </div>
    </div>
  )
}

export default TopSongsReport
