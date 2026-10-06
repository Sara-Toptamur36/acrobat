import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { routeHelpers } from '../../router/routes'
import { reportsApi } from '../../services/api'
import Table from '../../components/Table'
import Pagination from '../../components/Pagination'

const GenreReport = () => {
  const [genres, setGenres] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchGenres()
  }, [currentPage])

  const fetchGenres = async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        limit: 20
      }

      const response = await reportsApi.getGenreStats(params)
      setGenres(response.data.data.genres || [])
      setPagination(response.data.data.pagination || {})
    } catch (error) {
      console.error('Failed to fetch genre report:', error)
      toast.error('Tür istatistikleri yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      key: 'genre_name',
      title: 'Tür',
      render: (value, row) => (
        <div className="flex items-center">
          <span className="mr-2 text-acrobat-primary">🎵</span>
          <span className="font-medium text-white">{value}</span>
        </div>
      )
    },
    {
      key: 'song_count',
      title: 'Şarkılar',
      render: (value) => (
        <div className="text-center">
          <span className="text-lg font-semibold text-white">{value || 0}</span>
        </div>
      )
    },
    {
      key: 'percentage',
      title: 'Yüzde',
      render: (value, row) => {
        const total = genres.reduce((sum, genre) => sum + (genre.song_count || 0), 0)
        const percentage = total > 0 ? ((row.song_count || 0) / total * 100).toFixed(1) : 0
        return (
          <div className="flex items-center">
            <div className="flex-1 bg-white/10 rounded-full h-2 mr-3">
              <div
                className="bg-acrobat-primary h-2 rounded-full shadow-[0_0_10px_rgba(158,18,32,0.5)]"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-neutral-400">{percentage}%</span>
          </div>
        )
      }
    },
    {
      key: 'description',
      title: 'Açıklama',
      render: (value) => (
        <p className="text-sm text-neutral-500 truncate max-w-xs">
          {value || 'Açıklama bulunmuyor'}
        </p>
      )
    }
  ]

  const totalSongs = genres.reduce((sum, genre) => sum + (genre.song_count || 0), 0)

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
          <h1 className="text-2xl font-bold text-white">Tür İstatistikleri</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Farklı müzik türleri arasındaki şarkı dağılımı
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black/40 backdrop-blur-md rounded-lg shadow-sm border border-white/5 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-500/20">
              <span className="text-2xl text-blue-500">🎵</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-400">Toplam Tür</p>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : genres.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-md rounded-lg shadow-sm border border-white/5 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-500/20">
              <span className="text-2xl text-green-500">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-400">Toplam Şarkı</p>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : totalSongs.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-md rounded-lg shadow-sm border border-white/5 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-500/20">
              <span className="text-2xl text-purple-500">📈</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-400">Ort. Şarkı/Tür</p>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : genres.length > 0 ? Math.round(totalSongs / genres.length) : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Genre Table */}
      <div className="space-y-4">
        {pagination.total > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              {pagination.total} türden {((currentPage - 1) * 20) + 1} ile {Math.min(currentPage * 20, pagination.total)} arası gösteriliyor
            </p>
          </div>
        )}

        <Table
          columns={columns}
          data={genres}
          loading={loading}
        />

        {!loading && genres.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl text-gray-300 mb-4">🎵</div>
            <p className="text-gray-500 mb-4">Tür verisi bulunmuyor</p>
            <p className="text-sm text-gray-400">Kataloğa şarkılar eklendiğinde tür istatistikleri burada görünecektir</p>
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

export default GenreReport
