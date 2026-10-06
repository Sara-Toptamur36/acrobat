import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { socialApi, uploadApi } from '../services/api'
import { routeHelpers } from '../router/routes'
import { useAuth } from '../contexts/AuthContext'

const PublicProfile = () => {
    const { id } = useParams()
    const { user: currentUser } = useAuth()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        fetchProfile()
    }, [id])

    const fetchProfile = async () => {
        if (!id) return
        setLoading(true)
        try {
            const response = await socialApi.getPublicProfile(id)
            if (response.data && response.data.data) {
                setProfile(response.data.data)
            } else {
                setProfile(null)
            }
        } catch (error) {
            console.error('Profile fetch error:', error)
            toast.error('Profil yüklenemedi')
            setProfile(null)
        } finally {
            setLoading(false)
        }
    }

    const handleFollowToggle = async () => {
        if (!currentUser) {
            toast.error('Takip etmek için giriş yapmalısınız')
            return
        }
        setActionLoading(true)
        try {
            const response = await socialApi.toggleFollow(id)
            const { is_following } = response.data.data
            setProfile(prev => ({
                ...prev,
                user: {
                    ...prev.user,
                    is_following,
                    follower_count: is_following
                        ? prev.user.follower_count + 1
                        : prev.user.follower_count - 1
                }
            }))
            toast.success(is_following ? 'Takip edildi' : 'Takipten çıkıldı')
        } catch (error) {
            toast.error('İşlem başarısız oldu')
        } finally {
            setActionLoading(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-acrobat-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    )

    if (!profile) return (
        <div className="text-center py-20">
            <h1 className="text-2xl font-black text-white">Kullanıcı bulunamadı</h1>
            <Link to="/app/search" className="text-acrobat-primary mt-4 inline-block hover:underline">Aramaya geri dön</Link>
        </div>
    )

    const isOwnProfile = currentUser?.user_id === parseInt(id)

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in p-4">
            {/* User Header */}
            <div className="relative group p-8 rounded-3xl bg-acrobat-surface border border-white/5 flex flex-col md:flex-row items-center gap-8 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-acrobat-primary/10 to-transparent pointer-events-none"></div>

                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full shrink-0 border-4 border-acrobat-primary shadow-2xl overflow-hidden relative z-10">
                    {profile.user.profile_image ? (
                        <img src={uploadApi.fileUrl(profile.user.profile_image)} alt={profile.user.username} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-acrobat-primary to-purple-600 flex items-center justify-center text-5xl font-black text-white">
                            {profile.user.username?.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                <div className="flex-1 text-center md:text-left relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                        <h1 className="text-4xl font-black text-white tracking-tighter">
                            {profile.user.username}
                        </h1>
                        {!isOwnProfile && (
                            <button
                                onClick={handleFollowToggle}
                                disabled={actionLoading}
                                className={`px - 8 py - 2 rounded - full font - black text - xs uppercase tracking - widest transition - all ${profile.user.is_following
                                        ? 'bg-transparent border border-white/20 text-white hover:bg-white/10'
                                        : 'bg-acrobat-primary text-white hover:bg-acrobat-primary-light shadow-lg hover:shadow-acrobat-primary/20'
                                    } `}
                            >
                                {profile.user.is_following ? 'Takibi Bırak' : 'Takip Et'}
                            </button>
                        )}
                        {isOwnProfile && (
                            <Link
                                to={routeHelpers.profile()}
                                className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/10"
                            >
                                Profilini Düzenle
                            </Link>
                        )}
                    </div>

                    <div className="flex items-center justify-center md:justify-start gap-6 text-sm mt-4">
                        <div className="flex flex-col">
                            <span className="text-white font-black text-xl">{profile.user.follower_count}</span>
                            <span className="text-acrobat-text-muted text-[10px] uppercase font-black tracking-widest">Takipçi</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white font-black text-xl">{profile.user.following_count}</span>
                            <span className="text-acrobat-text-muted text-[10px] uppercase font-black tracking-widest">Takip</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white font-black text-xl">{profile.playlists.length}</span>
                            <span className="text-acrobat-text-muted text-[10px] uppercase font-black tracking-widest">Çalma Listesi</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Follow stats and Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Followers List */}
                <div className="bg-acrobat-surface rounded-3xl p-6 border border-white/5 space-y-4">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                        <span className="text-acrobat-primary">👥</span> Takipçiler ({profile.user.follower_count})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {profile.user.followers?.map(f => (
                            <Link
                                key={f.user_id}
                                to={routeHelpers.userProfile(f.user_id)}
                                className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-acrobat-text-muted hover:bg-acrobat-primary hover:text-white transition-colors border border-white/5"
                            >
                                @{f.username}
                            </Link>
                        ))}
                        {(!profile.user.followers || profile.user.followers.length === 0) && (
                            <p className="text-xs text-acrobat-text-muted italic">Henüz takipçisi yok.</p>
                        )}
                    </div>
                </div>

                {/* Following List */}
                <div className="bg-acrobat-surface rounded-3xl p-6 border border-white/5 space-y-4">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                        <span className="text-acrobat-primary">🏃</span> Takip Ediliyor ({profile.user.following_count})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {profile.user.following?.map(f => (
                            <Link
                                key={f.user_id}
                                to={routeHelpers.userProfile(f.user_id)}
                                className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-acrobat-text-muted hover:bg-acrobat-primary hover:text-white transition-colors border border-white/5"
                            >
                                @{f.username}
                            </Link>
                        ))}
                        {(!profile.user.following || profile.user.following.length === 0) && (
                            <p className="text-xs text-acrobat-text-muted italic">Kimseyi takip etmiyor.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Playlists */}
                <div className="md:col-span-3 space-y-6">
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <span className="text-acrobat-primary">📂</span> Çalma Listeleri
                    </h2>

                    {profile.playlists.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {profile.playlists.map(playlist => (
                                <Link
                                    key={playlist.playlist_id}
                                    to={routeHelpers.playlistDetail(playlist.playlist_id)}
                                    className="card group"
                                >
                                    <div className="card-img-container aspect-square bg-gradient-to-br from-acrobat-surface-light to-acrobat-surface flex items-center justify-center text-4xl">
                                        📁
                                        <div className="play-button-overlay">▶</div>
                                    </div>
                                    <div className="p-1">
                                        <h3 className="font-bold text-white group-hover:text-acrobat-primary transition-colors truncate">
                                            {playlist.name}
                                        </h3>
                                        <p className="text-xs text-acrobat-text-muted truncate mt-1">
                                            {playlist.description || 'Herhangi bir açıklama yok'}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl py-20 text-center">
                            <div className="text-4xl mb-4">📭</div>
                            <p className="text-acrobat-text-muted font-bold">Bu kullanıcının henüz herkese açık bir listesi yok.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default PublicProfile
