import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { routeHelpers } from '../../router/routes'
import { reportsApi } from '../../services/api'
import Table from '../../components/Table'
import Pagination from '../../components/Pagination'

const AlbumReport = () => {
  const [statistics, setStatistics] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchStatistics()
  }, [currentPage])

  const fetchStatistics = async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        limit: 20
      }

      const response = await reportsApi.getAlbumStats(params)
      setStatistics(response.data.data.release_statistics || [])
      setPagination(response.data.data.pagination || {})
    } catch (error) {
      console.error('Failed to fetch album statistics:', error)
      toast.error('Albüm istatistikleri yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      key: 'release_year',
      title: 'Yıl',
      render: (value) => (
        <div className="flex items-center">
          <span className="mr-2 text-neutral-500">📅</span>
          <span className="font-medium text-white">{value || 'Bilinmiyor'}</span>
        </div>
      )
    },
    {
      key: 'album_count',
      title: 'Yayınlanan Albümler',
      render: (value) => (
        <div className="flex items-center">
          <span className="mr-2 text-acrobat-primary">💿</span>
          <span className="font-semibold text-acrobat-primary">{value}</span>
        </div>
      )
    },
    {
      key: 'total_songs',
      title: 'Toplam Şarkı',
      render: (value) => (
        <span className="text-neutral-400">{value}</span>
      )
    },
    {
      key: 'avg_songs_per_album',
      title: 'Ort. Şarkı/Albüm',
      render: (value) => (
        <span className="text-neutral-400">{parseFloat(value).toFixed(1)}</span>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to={routeHelpers.reports()}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
          >
            <span className="text-xl">←</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center">
              <span className="mr-3 text-acrobat-primary">📈</span>
              Albüm Yayın İstatistikleri
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              Yıllara göre albüm yayınları ve şarkı sayıları
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black/40 backdrop-blur-md rounded-lg shadow-sm border border-white/5 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-500/20">
              <span className="text-2xl text-blue-500">📅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-400">Kapsanan Yıl</p>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : pagination.total || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-md rounded-lg shadow-sm border border-white/5 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-500/20">
              <span className="text-2xl text-green-500">💿</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-400">Toplam Albüm</p>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : statistics.reduce((sum, stat) => sum + stat.album_count, 0)}
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
              <p className="text-sm font-medium text-neutral-400">Zirve Yılı</p>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' :
                  statistics.length > 0 ?
                    statistics.reduce((max, stat) =>
                      stat.album_count > max.album_count ? stat : max
                    ).release_year || 'Yok' : 'Yok'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Table */}
      <div className="bg-black/40 backdrop-blur-md rounded-lg shadow-sm border border-white/5">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">Yıllara Göre Yayın İstatistikleri</h2>
          <p className="text-sm text-neutral-400 mt-1">
            Yıl başına albüm yayınları ve şarkı sayılarının detaylı dökümü
          </p>
        </div>

        <Table
          columns={columns}
          data={statistics}
          loading={loading}
        />

        {!loading && statistics.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl text-gray-300 mb-4">📅</div>
            <p className="text-gray-500 mb-4">Albüm yayın verisi bulunmuyor</p>
            <p className="text-sm text-gray-400">Kataloğa albümler eklendiğinde albüm istatistikleri burada görünecektir</p>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="p-6 border-t border-gray-200">
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.pages}
              onPageChange={setCurrentPage}
              totalItems={pagination.total}
              itemsPerPage={20}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default AlbumReport
