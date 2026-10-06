import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { socialApi } from '../services/api'
import { routeHelpers } from '../router/routes'

const Community = () => {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const response = await socialApi.search({ limit: 100 })
            setUsers(response.data.data || [])
        } catch (error) {
            toast.error('Kullanıcılar yüklenemedi')
        } finally {
            setLoading(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-acrobat-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    )

    // Calculate rankings
    const topByFollowers = [...users].sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0)).slice(0, 5)
    const topByPlaylists = [...users].sort((a, b) => (b.playlist_count || 0) - (a.playlist_count || 0)).slice(0, 5)
    const topByReviews = [...users].sort((a, b) => (b.review_count || 0) - (a.review_count || 0)).slice(0, 5)

    const UserCard = ({ user, rank, metric }) => (
        <Link
            to={routeHelpers.userProfile(user.user_id)}
            className="bg-acrobat-surface/40 p-4 rounded-2xl border border-white/5 hover:bg-white/5 hover:border-acrobat-primary/30 transition-all group relative overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-b from-acrobat-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center gap-4 relative z-10">
                <div className="text-2xl font-black text-acrobat-primary/30">{rank}</div>
                <div className="w-12 h-12 rounded-full bg-acrobat-surface-light flex items-center justify-center text-lg font-black shadow-xl group-hover:bg-acrobat-primary group-hover:text-white transition-all">
                    {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                    <div className="font-black text-white group-hover:text-acrobat-primary transition-colors truncate">{user.username}</div>
                    <div className="text-[10px] text-acrobat-text-muted uppercase tracking-widest font-black">{metric}</div>
                </div>
            </div>
        </Link>
    )

    return (
        <div className="space-y-8 animate-fade-in p-2">
            <header>
                <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Topluluk Sıralamaları 🏆</h1>
                <p className="text-acrobat-text-muted font-medium">En aktif kullanıcıları keşfet.</p>
            </header>

            {/* Top by Followers */}
            <div className="space-y-4">
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    <span className="text-acrobat-primary">👥</span> En Çok Takipçisi Olanlar
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {topByFollowers.map((user, idx) => (
                        <UserCard key={user.user_id} user={user} rank={idx + 1} metric={`${user.follower_count || 0} Takipçi`} />
                    ))}
                </div>
            </div>

            {/* Top by Playlists */}
            <div className="space-y-4">
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    <span className="text-acrobat-primary">📂</span> En Çok Playlistesi Olanlar
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {topByPlaylists.map((user, idx) => (
                        <UserCard key={user.user_id} user={user} rank={idx + 1} metric={`${user.playlist_count || 0} Playlist`} />
                    ))}
                </div>
            </div>

            {/* Top by Reviews */}
            <div className="space-y-4">
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    <span className="text-acrobat-primary">⭐</span> En Çok Değerlendirme Yapanlar
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {topByReviews.map((user, idx) => (
                        <UserCard key={user.user_id} user={user} rank={idx + 1} metric={`${user.review_count || 0} Değerlendirme`} />
                    ))}
                </div>
            </div>

        </div>
    )
}

export default Community
