import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { routeHelpers } from '../../router/routes'
import { reportsApi } from '../../services/api'
import Table from '../../components/Table'
import Pagination from '../../components/Pagination'

const UserReport = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchUsers()
  }, [currentPage])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        limit: 20
      }

      const response = await reportsApi.getActiveUsers(params)
      setUsers(response.data.data.users || [])
      setPagination(response.data.data.pagination || {})
    } catch (error) {
      console.error('Failed to fetch user activity data:', error)
      toast.error('Kullanıcı aktivite verisi yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const getRankBadge = (rank) => {
    if (rank === 1) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    if (rank === 2) return 'bg-white/10 text-gray-300 border-white/20'
    if (rank === 3) return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  }

  const getRankIcon = (rank) => {
    if (rank <= 3) return <span className="text-sm mr-1">🏆</span>
    return <span className="text-sm font-bold mr-1">#{rank}</span>
  }

  const columns = [
    {
      key: 'rank',
      title: 'Sıralama',
      render: (_, row, index) => {
        const rank = ((currentPage - 1) * 20) + index + 1
        return (
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRankBadge(rank)}`}>
            {getRankIcon(rank)}
            {rank}
          </div>
        )
      }
    },
    {
      key: 'username',
      title: 'Kullanıcı',
      render: (value, row) => (
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-sm font-medium text-primary-600">
              {value.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-3">
            <p className="font-medium text-white">{value}</p>
            <p className="text-sm text-neutral-500">
              {new Date(row.created_at).toLocaleDateString()} tarihinden beri üye
            </p>
          </div>
        </div>
      )
    },
    {
      key: 'total_ratings',
      title: 'Verilen Puanlar',
      render: (value) => (
        <div className="flex items-center">
          <span className="mr-2 text-yellow-500">⭐</span>
          <span className="font-semibold">{value}</span>
        </div>
      )
    },
    {
      key: 'total_comments',
      title: 'Yorumlar',
      render: (value) => (
        <div className="flex items-center">
          <span className="mr-2 text-blue-500">💬</span>
          <span className="font-semibold">{value}</span>
        </div>
      )
    },
    {
      key: 'avg_rating',
      title: 'Ort. Puan',
      render: (value) => (
        <span className="text-acrobat-text-muted">
          {value !== null && value !== undefined ? parseFloat(value).toFixed(1) : 'Yok'}
        </span>
      )
    },
    {
      key: 'total_playlists',
      title: 'Listeler',
      render: (value) => (
        <span className="text-acrobat-text-muted">{value}</span>
      )
    }
  ]

  const topUsers = users.slice(0, 3)
  const totalActivity = users.reduce((sum, user) => sum + user.total_ratings + user.total_comments, 0)

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
              <span className="mr-3 text-acrobat-primary">👥</span>
              En Aktif Kullanıcılar
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              Puanlar ve yorumlara dayalı kullanıcı aktivite liderlik tablosu
            </p>
          </div>
        </div>
      </div>

      {/* Top 3 Users Podium */}
      {topUsers.length > 0 && (
        <div className="bg-black/40 backdrop-blur-md rounded-lg shadow-sm border border-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-6 text-center">En Çok Katkıda Bulunanlar</h2>
          <div className="flex justify-center items-end space-x-8">
            {/* 2nd Place */}
            {topUsers[1] && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-3 mx-auto">
                  <span className="text-xl font-bold text-gray-300">
                    {topUsers[1].username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="bg-white/10 rounded-t-lg p-4 h-20 flex flex-col justify-center">
                  <span className="text-xl text-gray-300 mx-auto mb-1">🥈</span>
                  <p className="font-semibold text-sm text-white">{topUsers[1].username}</p>
                  <p className="text-xs text-neutral-400">{topUsers[1].total_ratings + topUsers[1].total_comments} aktivite</p>
                </div>
              </div>
            )}

            {/* 1st Place */}
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mb-3 mx-auto border border-yellow-500/30">
                <span className="text-2xl font-bold text-yellow-500">
                  {topUsers[0].username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="bg-yellow-500/20 rounded-t-lg p-4 h-28 flex flex-col justify-center border-x border-t border-yellow-500/20">
                <span className="text-2xl text-yellow-500 mx-auto mb-1">🏆</span>
                <p className="font-bold text-white">{topUsers[0].username}</p>
                <p className="text-sm text-yellow-500 font-medium">{topUsers[0].total_ratings + topUsers[0].total_comments} aktivite</p>
              </div>
            </div>

            {/* 3rd Place */}
            {topUsers[2] && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mb-3 mx-auto border border-orange-500/30">
                  <span className="text-xl font-bold text-orange-500">
                    {topUsers[2].username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="bg-orange-500/20 rounded-t-lg p-4 h-16 flex flex-col justify-center border-x border-t border-orange-500/20">
                  <span className="text-xl text-orange-500 mx-auto mb-1">🥉</span>
                  <p className="font-semibold text-sm text-white">{topUsers[2].username}</p>
                  <p className="text-xs text-orange-400 font-medium">{topUsers[2].total_ratings + topUsers[2].total_comments} aktivite</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-black/40 backdrop-blur-md rounded-lg shadow-sm border border-white/5 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-500/20">
              <span className="text-2xl text-blue-500">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-400">Aktif Kullanıcılar</p>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : pagination.total || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-md rounded-lg shadow-sm border border-white/5 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-500/20">
              <span className="text-2xl text-yellow-500">⭐</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-400">Toplam Puan</p>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : users.reduce((sum, user) => sum + user.total_ratings, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-md rounded-lg shadow-sm border border-white/5 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-500/20">
              <span className="text-2xl text-green-500">💬</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-400">Toplam Yorum</p>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : users.reduce((sum, user) => sum + user.total_comments, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-md rounded-lg shadow-sm border border-white/5 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-500/20">
              <span className="text-2xl text-purple-500">🏆</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-400">Toplam Aktivite</p>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : totalActivity}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Full Leaderboard */}
      <div className="bg-black/40 backdrop-blur-md rounded-lg shadow-sm border border-white/5">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">Tam Liderlik Tablosu</h2>
          <p className="text-sm text-neutral-400 mt-1">
            Toplam aktivitelerine (puanlar + yorumlar) göre sıralanmış tüm kullanıcılar
          </p>
        </div>

        <Table
          columns={columns}
          data={users}
          loading={loading}
        />

        {!loading && users.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl text-gray-300 mb-4">👥</div>
            <p className="text-gray-500 mb-4">Kullanıcı aktivite verisi bulunmuyor</p>
            <p className="text-sm text-gray-400">Kullanıcılar şarkıları puanlamaya ve listeler oluşturmaya başladığında aktivite burada görünecektir</p>
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

export default UserReport
