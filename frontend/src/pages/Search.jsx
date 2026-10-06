import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES, routeHelpers } from '../router/routes'
import { songsApi, artistsApi, albumsApi, socialApi, uploadApi } from '../services/api'
import { toast } from 'react-hot-toast'
import Table from '../components/Table'

const Search = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [results, setResults] = useState({
        songs: [],
        artists: [],
        albums: [],
        users: []
    })
    const [loading, setLoading] = useState(false)
    const searchInputRef = useRef(null)

    const handleSearch = useCallback(async () => {
        if (!searchTerm.trim()) {
            setResults({ songs: [], artists: [], albums: [], users: [] })
            return
        }

        setLoading(true)
        try {
            const [songsRes, artistsRes, albumsRes, usersRes] = await Promise.all([
                songsApi.getAll({ search: searchTerm, limit: 5 }),
                artistsApi.getAll({ search: searchTerm, limit: 5 }),
                albumsApi.getAll({ search: searchTerm, limit: 5 }),
                socialApi.search({ search: searchTerm, limit: 5 })
            ])

            setResults({
                songs: songsRes.data.data.songs || [],
                artists: artistsRes.data.data.artists || [],
                albums: albumsRes.data.data.albums || [],
                users: usersRes.data.data || []
            })
        } catch (error) {
            toast.error('Arama sonuçları yüklenemedi')
        } finally {
            setLoading(false)
        }
    }, [searchTerm])

    useEffect(() => {
        const timeoutId = setTimeout(handleSearch, 300)
        return () => clearTimeout(timeoutId)
    }, [searchTerm, handleSearch])

    return (
        <div className="space-y-8 animate-fade-in p-2">
            <header className="space-y-4">
                <h1 className="text-4xl font-black text-white tracking-tighter">Ara</h1>
                <div className="relative group max-w-2xl">
                    <span className="absolute inset-y-0 left-4 flex items-center text-acrobat-text-muted pointer-events-none group-focus-within:text-white transition-colors">🔍</span>
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                        className="input rounded-full pl-12 pr-6 h-12 text-lg w-full bg-white/5 border-white/10 focus:bg-white/10 focus:border-acrobat-primary/50 transition-all outline-none"
                        placeholder="Ne dinlemek istiyorsun?"
                    />
                </div>
            </header>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-4 border-acrobat-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Top Results / Songs */}
                    {results.songs.length > 0 && (
                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-white flex items-center gap-2">
                                <span className="text-acrobat-primary">🎵</span> Şarkılar
                            </h2>
                            <div className="grid grid-cols-1 gap-2">
                                {results.songs.map(song => (
                                    <Link
                                        key={song.song_id}
                                        to={routeHelpers.songDetail(song.song_id)}
                                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5"
                                    >
                                        <div className="w-12 h-12 rounded-lg bg-acrobat-surface-light flex items-center justify-center text-lg shadow-lg group-hover:scale-105 transition-transform">
                                            🎶
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-white group-hover:text-acrobat-primary transition-colors">{song.title}</div>
                                            <div className="text-xs text-acrobat-text-muted">{song.album?.artist?.name} • {song.album?.title}</div>
                                        </div>
                                        <div className="text-acrobat-green font-black text-xs px-2 py-1 bg-acrobat-green/10 rounded">
                                            {song.average_rating ? song.average_rating.toFixed(1) : '-'}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Users */}
                    {results.users.length > 0 && (
                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-white flex items-center gap-2">
                                <span className="text-acrobat-primary">👋</span> Topluluk
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {results.users.map(user => (
                                    <Link
                                        key={user.user_id}
                                        to={routeHelpers.userProfile(user.user_id)}
                                        className="bg-acrobat-surface/40 p-4 rounded-2xl border border-white/5 hover:bg-white/5 hover:border-acrobat-primary/30 transition-all group text-center"
                                    >
                                        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-acrobat-surface-lighter flex items-center justify-center text-xl font-black shadow-lg group-hover:bg-acrobat-primary transition-colors">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="font-bold text-white truncate">{user.username}</div>
                                        <div className="text-[10px] text-acrobat-text-muted mt-1 uppercase tracking-widest font-black">
                                            {user.follower_count} Takipçi
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Artists */}
                    {results.artists.length > 0 && (
                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-white flex items-center gap-2">
                                <span className="text-acrobat-primary">👤</span> Sanatçılar
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {results.artists.map(artist => (
                                    <Link
                                        key={artist.artist_id}
                                        to={routeHelpers.artistDetail(artist.artist_id)}
                                        className="bg-acrobat-surface/40 p-4 rounded-2xl border border-white/5 hover:bg-white/5 hover:border-acrobat-primary/30 transition-all group text-center"
                                    >
                                        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-acrobat-surface-light flex items-center justify-center text-3xl shadow-2xl group-hover:scale-110 transition-transform overflow-hidden relative">
                                            {artist.image_url ? (
                                                <img src={uploadApi.fileUrl(artist.image_url)} alt={artist.name} className="w-full h-full object-cover" />
                                            ) : (
                                                "🎤"
                                            )}
                                        </div>
                                        <div className="font-black text-white truncate">{artist.name}</div>
                                        <div className="text-[10px] text-acrobat-text-muted mt-1 uppercase tracking-widest font-black">Sanatçı</div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Albums */}
                    {results.albums.length > 0 && (
                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-white flex items-center gap-2">
                                <span className="text-acrobat-primary">💿</span> Albümler
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {results.albums.map(album => (
                                    <Link
                                        key={album.album_id}
                                        to={routeHelpers.albumDetail(album.album_id)}
                                        className="bg-acrobat-surface/40 p-4 rounded-2xl border border-white/5 hover:bg-white/5 hover:border-acrobat-primary/30 transition-all group"
                                    >
                                        <div className="aspect-square mb-4 rounded-xl bg-acrobat-surface-light flex items-center justify-center text-3xl shadow-xl group-hover:scale-105 transition-transform overflow-hidden relative">
                                            {album.cover_image ? (
                                                <img src={uploadApi.fileUrl(album.cover_image)} alt={album.title} className="w-full h-full object-cover" />
                                            ) : (
                                                "📦"
                                            )}
                                        </div>
                                        <div className="font-bold text-white truncate">{album.title}</div>
                                        <div className="text-xs text-acrobat-text-muted truncate">{album.artist?.name}</div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {searchTerm && !loading && results.songs.length === 0 && results.artists.length === 0 && results.albums.length === 0 && (
                        <div className="text-center py-20 space-y-4">
                            <div className="text-6xl">😕</div>
                            <h3 className="text-xl font-black text-white">"{searchTerm}" için sonuç bulunamadı</h3>
                            <p className="text-acrobat-text-muted">Lütfen yazımı kontrol et veya farklı bir anahtar kelime dene.</p>
                        </div>
                    )}

                    {!searchTerm && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div
                                onClick={() => searchInputRef.current?.focus()}
                                className="p-8 rounded-3xl bg-gradient-to-br from-acrobat-primary/20 to-purple-600/20 border border-white/5 cursor-pointer hover:scale-105 transition-transform group"
                            >
                                <h3 className="text-2xl font-black text-white mb-2 group-hover:text-acrobat-primary">Hızlı Arama</h3>
                                <p className="text-acrobat-text-muted text-sm">Favori sanatçılarını, albümleri veya hit parçaları anında bul.</p>
                            </div>
                            <Link
                                to={ROUTES.APP.SONGS}
                                className="p-8 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-white/5 cursor-pointer hover:scale-105 transition-transform group block no-underline"
                            >
                                <h3 className="text-2xl font-black text-white mb-2 group-hover:text-acrobat-green">Trendler</h3>
                                <p className="text-acrobat-text-muted text-sm">Platformdaki en popüler müzikleri keşfetmeye başla.</p>
                            </Link>
                            <Link
                                to={ROUTES.APP.GENRES}
                                className="p-8 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-white/5 cursor-pointer hover:scale-105 transition-transform group block no-underline"
                            >
                                <h3 className="text-2xl font-black text-white mb-2 group-hover:text-amber-500">Türler</h3>
                                <p className="text-acrobat-text-muted text-sm">Geniş müzik kütüphanemizde türlere göre filtreleme yap.</p>
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default Search
