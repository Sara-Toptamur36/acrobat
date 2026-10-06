import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { artistsApi, albumsApi, uploadApi, genresApi } from '../../services/api'
import ImageUpload from '../../components/ImageUpload'

const AdminContent = () => {
    const [activeTab, setActiveTab] = useState('artists')
    const [artists, setArtists] = useState([])
    const [albums, setAlbums] = useState([])
    const [genres, setGenres] = useState([])
    const [songs, setSongs] = useState([])
    const [selectedArtist, setSelectedArtist] = useState(null)
    const [selectedAlbum, setSelectedAlbum] = useState(null)
    const [selectedSong, setSelectedSong] = useState(null)
    const [loading, setLoading] = useState(false)
    const [newGenreName, setNewGenreName] = useState('')

    // Song Form State
    const [newSong, setNewSong] = useState({
        title: '',
        album_id: '',
        new_album_title: '',
        artist_id: '',
        new_artist_name: '',
        genre_id: '',
        new_genre_name: '',
        track_number: '',
        duration: 180
    })

    useEffect(() => {
        if (activeTab === 'artists') {
            fetchArtists()
        } else if (activeTab === 'albums') {
            fetchAlbums()
        } else if (activeTab === 'genres') {
            fetchGenres()
        } else if (activeTab === 'songs') {
            fetchSongs()
            fetchAlbums() // For dropdown
            fetchGenres() // For dropdown
        }
    }, [activeTab])

    const fetchArtists = async () => {
        setLoading(true)
        try {
            const response = await artistsApi.getAll({ limit: 100 })
            const artistsData = response.data.data?.artists || response.data.data || []
            setArtists(Array.isArray(artistsData) ? artistsData : [])
        } catch (error) {
            toast.error('Sanatçılar yüklenemedi')
        } finally {
            setLoading(false)
        }
    }

    const fetchAlbums = async () => {
        setLoading(true)
        try {
            const response = await albumsApi.getAll({ limit: 100 })
            const albumsData = response.data.data?.albums || response.data.data || []
            setAlbums(Array.isArray(albumsData) ? albumsData : [])
        } catch (error) {
            toast.error('Albümler yüklenemedi')
        } finally {
            setLoading(false)
        }
    }

    const handleArtistImageUpload = async (file) => {
        if (!selectedArtist) return
        await uploadApi.uploadArtistImage(selectedArtist.artist_id, file)
        fetchArtists()
    }

    const handleArtistImageDelete = async () => {
        if (!selectedArtist) return
        await uploadApi.deleteArtistImage(selectedArtist.artist_id)
        fetchArtists()
        setSelectedArtist({ ...selectedArtist, image_url: null })
    }

    const handleAlbumCoverUpload = async (file) => {
        if (!selectedAlbum) return
        await uploadApi.uploadAlbumCover(selectedAlbum.album_id, file)
        fetchAlbums()
    }

    const handleAlbumCoverDelete = async () => {
        if (!selectedAlbum) return
        await uploadApi.deleteAlbumCover(selectedAlbum.album_id)
        fetchAlbums()
        setSelectedAlbum({ ...selectedAlbum, cover_url: null })
    }

    const fetchGenres = async () => {
        setLoading(true)
        try {
            const response = await genresApi.getAll({ limit: 100 })
            const genresData = response.data.data?.genres || response.data.data || []
            setGenres(Array.isArray(genresData) ? genresData : [])
        } catch (error) {
            toast.error('Türler yüklenemedi')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateGenre = async (e) => {
        e.preventDefault()
        if (!newGenreName.trim()) {
            toast.error('Tür adı gerekli')
            return
        }

        try {
            await genresApi.createGenre(newGenreName.trim())
            toast.success('Tür başarıyla oluşturuldu')
            setNewGenreName('')
            fetchGenres()
        } catch (error) {
            toast.error('Tür oluşturulamadı')
        }
    }

    const handleDeleteGenre = async (genreId, genreName) => {
        if (!window.confirm(`"${genreName}" türünü silmek istediğinize emin misiniz?`)) return

        try {
            await genresApi.deleteGenre(genreId)
            toast.success('Tür başarıyla silindi')
            fetchGenres()
        } catch (error) {
            if (error.response?.status === 409) {
                toast.error('Bu tür kullanımda olduğu için silinemez')
            } else {
                toast.error('Tür silinemedi')
            }
        }
    }

    const fetchSongs = async () => {
        setLoading(true)
        try {
            const { songsApi } = await import('../../services/api')
            const response = await songsApi.getAll({ limit: 100 })
            setSongs(response.data.data?.songs || response.data.data || [])
        } catch (error) {
            toast.error('Şarkılar yüklenemedi')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateSong = async (e) => {
        e.preventDefault()

        // Check if file is selected for integrated upload
        const fileInput = document.getElementById('song-file-input')
        const file = fileInput?.files[0]

        try {
            if (file) {
                setLoading(true)
                // Integrated song upload (metadata + audio)
                // The actual implementation of uploadApi.uploadSongIntegrated is in '../../services/api'
                // This block is just a comment/placeholder for the user's reference on how it works.
                // The call to uploadApi.uploadSongIntegrated is already correct.
                await uploadApi.uploadSongIntegrated(newSong, file)
                toast.success('Şarkı ve dosya başarıyla yüklendi')
            } else {
                const { songsApi } = await import('../../services/api')
                await songsApi.create(newSong)
                toast.success('Şarkı metadata oluşturuldu')
            }

            fetchSongs()
            setNewSong({
                title: '',
                album_id: '',
                new_album_title: '',
                artist_id: '',
                new_artist_name: '',
                genre_id: '',
                new_genre_name: '',
                track_number: '',
                duration: 180
            })
            if (fileInput) fileInput.value = ''

            // Refresh lists if new items were created
            fetchArtists()
            fetchAlbums()
            fetchGenres()
        } catch (error) {
            toast.error('İşlem başarısız: ' + (error.response?.data?.error?.message || error.message))
        } finally {
            setLoading(false)
        }
    }

    const handleSongAudioUpload = async (file) => {
        if (!selectedSong) return
        try {
            await uploadApi.uploadSongAudio(selectedSong.song_id, file)
            toast.success('Şarkı dosyası yüklendi')
            fetchSongs()
            setSelectedSong(null)
        } catch (error) {
            toast.error('Yükleme başarısız')
        }
    }

    const handleDeleteSong = async (songId, title) => {
        if (!window.confirm(`"${title}" şarkısını silmek istediğinize emin misiniz?`)) return
        try {
            const { songsApi } = await import('../../services/api')
            await songsApi.delete(songId)
            toast.success('Şarkı silindi')
            fetchSongs()
        } catch (error) {
            toast.error('Silme işlemi başarısız')
        }
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header removed as it is in layout */}

            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('artists')}
                    className={`px-6 py-3 font-bold transition-all ${activeTab === 'artists'
                        ? 'text-yellow-500 border-b-2 border-yellow-500'
                        : 'text-neutral-500 hover:text-white'
                        }`}
                >
                    🎤 Sanatçı Resimleri
                </button>
                <button
                    onClick={() => setActiveTab('albums')}
                    className={`px-6 py-3 font-bold transition-all ${activeTab === 'albums'
                        ? 'text-yellow-500 border-b-2 border-yellow-500'
                        : 'text-neutral-500 hover:text-white'
                        }`}
                >
                    💿 Albüm Kapakları
                </button>
                <button
                    onClick={() => setActiveTab('genres')}
                    className={`px-6 py-3 font-bold transition-all ${activeTab === 'genres'
                        ? 'text-yellow-500 border-b-2 border-yellow-500'
                        : 'text-neutral-500 hover:text-white'
                        }`}
                >
                    🎸 Tür Yönetimi
                </button>
                <button
                    onClick={() => setActiveTab('songs')}
                    className={`px-6 py-3 font-bold transition-all ${activeTab === 'songs'
                        ? 'text-yellow-500 border-b-2 border-yellow-500'
                        : 'text-neutral-500 hover:text-white'
                        }`}
                >
                    🎵 Şarkı Yönetimi
                </button>
            </div>

            {/* Artist Images Tab */}
            {activeTab === 'artists' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Artist List */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-black text-white">Sanatçılar</h2>
                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {loading ? (
                                <div className="text-center py-10">
                                    <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                </div>
                            ) : (
                                artists.map((artist) => (
                                    <button
                                        key={artist.artist_id}
                                        onClick={() => setSelectedArtist(artist)}
                                        className={`w-full p-4 rounded-xl text-left transition-all border border-transparent ${selectedArtist?.artist_id === artist.artist_id
                                            ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 shadow-lg'
                                            : 'bg-white/5 hover:bg-white/10 text-white'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-xl border border-white/5">
                                                {artist.image_url ? '✅' : '📷'}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold">{artist.name}</p>
                                                <p className="text-xs opacity-70">
                                                    {artist.image_url ? 'Resim mevcut' : 'Resim yok'}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Upload Area */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-black text-white">
                            {selectedArtist ? `${selectedArtist.name} - Resim Yükle` : 'Sanatçı Seçin'}
                        </h2>
                        {selectedArtist ? (
                            <ImageUpload
                                currentImage={selectedArtist.image_url ? uploadApi.fileUrl(selectedArtist.image_url) : null}
                                onUpload={handleArtistImageUpload}
                                onDelete={selectedArtist.image_url ? handleArtistImageDelete : null}
                            />
                        ) : (
                            <div className="bg-white/5 rounded-2xl p-12 text-center border border-dashed border-white/20 text-neutral-500">
                                <p className="text-4xl mb-4">👈</p>
                                <p className="font-bold">
                                    Resim yüklemek için sol taraftan bir sanatçı seçin
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Album Covers Tab */}
            {activeTab === 'albums' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Album List */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-black text-white">Albümler</h2>
                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {loading ? (
                                <div className="text-center py-10">
                                    <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                </div>
                            ) : (
                                albums.map((album) => (
                                    <button
                                        key={album.album_id}
                                        onClick={() => setSelectedAlbum(album)}
                                        className={`w-full p-4 rounded-xl text-left transition-all border border-transparent ${selectedAlbum?.album_id === album.album_id
                                            ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 shadow-lg'
                                            : 'bg-white/5 hover:bg-white/10 text-white'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center text-xl border border-white/5">
                                                {album.cover_url ? '✅' : '💿'}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold">{album.title}</p>
                                                <p className="text-xs opacity-70">
                                                    {album.artist?.name} • {album.cover_url ? 'Kapak mevcut' : 'Kapak yok'}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Upload Area */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-black text-white">
                            {selectedAlbum ? `${selectedAlbum.title} - Kapak Yükle` : 'Albüm Seçin'}
                        </h2>
                        {selectedAlbum ? (
                            <ImageUpload
                                currentImage={selectedAlbum.cover_url ? uploadApi.fileUrl(selectedAlbum.cover_url) : null}
                                onUpload={handleAlbumCoverUpload}
                                onDelete={selectedAlbum.cover_url ? handleAlbumCoverDelete : null}
                            />
                        ) : (
                            <div className="bg-white/5 rounded-2xl p-12 text-center border border-dashed border-white/20 text-neutral-500">
                                <p className="text-4xl mb-4">👈</p>
                                <p className="font-bold">
                                    Kapak yüklemek için sol taraftan bir albüm seçin
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Genre Management Tab */}
            {activeTab === 'genres' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Create Genre Form */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-black text-white">Yeni Tür Oluştur</h2>
                        <form onSubmit={handleCreateGenre} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-neutral-400 mb-2">Tür Adı</label>
                                <input
                                    type="text"
                                    value={newGenreName}
                                    onChange={(e) => setNewGenreName(e.target.value)}
                                    placeholder="Örn: Rock, Pop, Jazz..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 transition-colors"
                                />
                            </div>
                            <button type="submit" className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-xl transition-colors">
                                Tür Oluştur
                            </button>
                        </form>
                    </div>

                    {/* Genre List */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-black text-white">Mevcut Türler ({genres.length})</h2>
                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {loading ? (
                                <div className="text-center py-10">
                                    <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                </div>
                            ) : genres.length === 0 ? (
                                <div className="bg-white/5 rounded-2xl p-12 text-center border border-dashed border-white/20">
                                    <p className="text-4xl mb-4">🎵</p>
                                    <p className="text-neutral-500 font-bold">Henüz hiç tür yok</p>
                                </div>
                            ) : (
                                genres.map((genre) => (
                                    <div
                                        key={genre.genre_id}
                                        className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-lg text-yellow-500">
                                                🎵
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">{genre.name}</p>
                                                <p className="text-xs text-neutral-500">
                                                    ID: {genre.genre_id}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteGenre(genre.genre_id, genre.name)}
                                            className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg font-bold text-sm hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                                        >
                                            Sil
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Songs Management Tab */}
            {activeTab === 'songs' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Create Song Form */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-black text-white">Yeni Şarkı Ekle</h2>
                        <form onSubmit={handleCreateSong} className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/5">
                            <div>
                                <label className="block text-sm font-bold text-neutral-400 mb-2">Şarkı Adı</label>
                                <input
                                    type="text"
                                    required
                                    value={newSong.title}
                                    onChange={e => setNewSong({ ...newSong, title: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-neutral-400 mb-2">Sanatçı</label>
                                    <select
                                        required
                                        value={newSong.artist_id}
                                        onChange={e => setNewSong({ ...newSong, artist_id: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50"
                                    >
                                        <option value="">Seçiniz</option>
                                        <option value="new">+ Yeni Sanatçı</option>
                                        {artists.map(a => <option key={a.artist_id} value={a.artist_id}>{a.name}</option>)}
                                    </select>
                                    {newSong.artist_id === 'new' && (
                                        <input
                                            type="text"
                                            placeholder="Yeni Sanatçı Adı"
                                            required
                                            value={newSong.new_artist_name}
                                            onChange={e => setNewSong({ ...newSong, new_artist_name: e.target.value })}
                                            className="w-full mt-2 bg-yellow-500/5 border border-yellow-500/20 rounded-xl px-4 py-2 text-white focus:outline-none"
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-neutral-400 mb-2">Albüm</label>
                                    <select
                                        required
                                        value={newSong.album_id}
                                        onChange={e => setNewSong({ ...newSong, album_id: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50"
                                    >
                                        <option value="">Seçiniz</option>
                                        <option value="new">+ Yeni Albüm</option>
                                        {albums
                                            .filter(a => !newSong.artist_id || newSong.artist_id === 'new' || a.artist_id == newSong.artist_id)
                                            .map(a => <option key={a.album_id} value={a.album_id}>{a.title}</option>)}
                                    </select>
                                    {newSong.album_id === 'new' && (
                                        <input
                                            type="text"
                                            placeholder="Yeni Albüm Başlığı"
                                            required
                                            value={newSong.new_album_title}
                                            onChange={e => setNewSong({ ...newSong, new_album_title: e.target.value })}
                                            className="w-full mt-2 bg-yellow-500/5 border border-yellow-500/20 rounded-xl px-4 py-2 text-white focus:outline-none"
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-neutral-400 mb-2">Tür</label>
                                    <select
                                        required
                                        value={newSong.genre_id}
                                        onChange={e => setNewSong({ ...newSong, genre_id: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50"
                                    >
                                        <option value="">Seçiniz</option>
                                        <option value="new">+ Yeni Tür</option>
                                        {genres.map(g => <option key={g.genre_id} value={g.genre_id}>{g.name}</option>)}
                                    </select>
                                    {newSong.genre_id === 'new' && (
                                        <input
                                            type="text"
                                            placeholder="Yeni Tür Adı"
                                            required
                                            value={newSong.new_genre_name}
                                            onChange={e => setNewSong({ ...newSong, new_genre_name: e.target.value })}
                                            className="w-full mt-2 bg-yellow-500/5 border border-yellow-500/20 rounded-xl px-4 py-2 text-white focus:outline-none"
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-neutral-400 mb-2">Sıra No</label>
                                    <input
                                        type="number"
                                        required
                                        value={newSong.track_number}
                                        onChange={e => setNewSong({ ...newSong, track_number: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-neutral-400 mb-2">Süre (sn)</label>
                                    <input
                                        type="number"
                                        value={newSong.duration}
                                        onChange={e => setNewSong({ ...newSong, duration: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-neutral-400 mb-2">Ses Dosyası (Opsiyonel)</label>
                                    <input
                                        type="file"
                                        id="song-file-input"
                                        accept=".mp3,.wav,.ogg,.m4a"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 file:bg-yellow-600 file:border-none file:rounded-lg file:text-black file:font-bold file:mr-4 file:px-4 file:py-1 hover:file:bg-yellow-500"
                                    />
                                    <p className="text-[10px] text-neutral-500 mt-1">Dosya seçerseniz hem metadata hem ses dosyası tek adımda yüklenir.</p>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-xl transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Yükleniyor...' : 'Şarkıyı Ekle'}
                            </button>
                        </form>
                    </div>

                    {/* Song List & Upload */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-black text-white">
                            {selectedSong ? `${selectedSong.title} - Dosya Yükle` : `Şarkılar (${songs.length})`}
                        </h2>

                        {selectedSong ? (
                            <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
                                <p className="mb-4 text-neutral-400">MP3, WAV veya OGG dosyası seçin (Max 50MB)</p>
                                <ImageUpload
                                    currentImage={null}
                                    onUpload={handleSongAudioUpload}
                                    onDelete={null}
                                    isAudio={true}
                                />
                                <button
                                    onClick={() => setSelectedSong(null)}
                                    className="mt-4 text-sm text-neutral-500 hover:text-white underline"
                                >
                                    Listeye Dön
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {songs.map(song => (
                                    <div key={song.song_id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-xl text-neutral-400">
                                                {song.file_path ? '🔊' : '🔇'}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-white">{song.title}</p>
                                                <p className="text-xs text-neutral-500">{song.album?.title}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setSelectedSong(song)}
                                                className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-bold border border-blue-500/20 hover:bg-blue-500 hover:text-white"
                                            >
                                                {song.file_path ? 'Dosya Güncelle' : 'Dosya Yükle'}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSong(song.song_id, song.title)}
                                                className="px-3 py-1 bg-red-500/10 text-red-500 rounded-lg text-xs font-bold border border-red-500/20 hover:bg-red-500 hover:text-white"
                                            >
                                                Sil
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminContent
