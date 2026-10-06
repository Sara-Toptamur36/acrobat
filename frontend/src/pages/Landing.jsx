import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

const Landing = () => {
  const [topSongs, setTopSongs] = useState([])
  const [stats, setStats] = useState({ totalSongs: 0, totalArtists: 0, totalAlbums: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const songsResponse = await api.get('/songs?limit=6&min_rating=7')
        setTopSongs(songsResponse.data.data.songs || [])

        // Parallel requests for stats
        const [artistsRes, albumsRes, songsRes, ratedSongsRes] = await Promise.all([
          api.get('/artists?limit=1'),
          api.get('/albums?limit=1'),
          api.get('/songs?limit=1'), // Total songs
          api.get('/songs?limit=1&min_rating=1') // Rated songs (min_rating=1 filters for rated)
        ])

        setStats({
          totalArtists: artistsRes.data.data.pagination?.total || 0,
          totalAlbums: albumsRes.data.data.pagination?.total || 0,
          totalSongs: ratedSongsRes.data.data.pagination?.total || 0 // User request: "değerlendirme yapılmış şarkı sayısı"
        })
      } catch (error) {
        console.error('Failed to fetch landing data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-acrobat-black text-white font-sans selection:bg-acrobat-primary selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-acrobat-primary rounded-full flex items-center justify-center shadow-lg shadow-acrobat-primary/20">
              <span className="text-white text-2xl font-black">A</span>
            </div>
            <span className="text-2xl font-black tracking-tighter">Acrobat</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="font-bold hover:text-acrobat-primary-light transition-colors">Giriş Yap</Link>
            <Link to="/register" className="btn btn-primary py-2.5 px-6">Hemen Başla</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-block px-4 py-1.5 bg-acrobat-primary/10 border border-acrobat-primary/20 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-6 text-acrobat-primary animate-in">
            Premium Katalog Yöneticisi
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
            Müziğin Gücü<br />
            <span className="text-acrobat-primary">Profesyoneller İçin.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-acrobat-text-muted font-medium mb-12">
            Binlerce şarkıyı keşfedin, favorilerinizi yönetin ve müzik severler için tasarlanmış premium bir arayüzü deneyimleyin.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn btn-primary text-xl py-4 px-12">Şimdi Katıl</Link>
            <Link to="/login" className="btn btn-secondary text-xl py-4 px-12">Giriş Yap</Link>
          </div>
        </div>

        {/* Abstract Background Shapes */}
        <div className="absolute top-[20%] left-[-10%] w-[50%] aspect-square bg-acrobat-primary/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] aspect-square bg-blue-600/10 blur-[120px] rounded-full"></div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-acrobat-dark/50">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { label: 'Küresel Şarkılar', val: stats.totalSongs, icon: '🎵' },
            { label: 'Sanatçılar', val: stats.totalArtists, icon: '🎤' },
            { label: 'Albümler', val: stats.totalAlbums, icon: '💿' }
          ].map((stat, i) => (
            <div key={i} className="text-center group">
              <span className="text-5xl block mb-4 group-hover:scale-110 transition-transform">{stat.icon}</span>
              <h3 className="text-5xl font-black mb-1 tabular-nums tracking-tighter">{stat.val.toLocaleString()}</h3>
              <p className="text-acrobat-text-muted font-bold uppercase tracking-widest text-xs">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Songs */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
            <div>
              <h4 className="text-acrobat-primary text-sm font-black uppercase tracking-widest mb-2">Editörün Seçimi</h4>
              <h2 className="text-5xl font-black tracking-tight">En Yüksek Puanlılar</h2>
            </div>
            <Link to="/register" className="text-sm font-bold text-acrobat-text-muted hover:text-white transition-colors uppercase tracking-widest border-b border-acrobat-text-muted hover:border-white py-1">Hepsini Keşfet</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="bg-acrobat-surface p-8 rounded-2xl animate-pulse space-y-4">
                  <div className="h-6 bg-white/5 rounded w-3/4"></div>
                  <div className="h-4 bg-white/5 rounded w-1/2"></div>
                  <div className="h-4 bg-white/5 rounded w-full mt-8"></div>
                </div>
              ))
            ) : (
              topSongs.map((song) => (
                <div key={song.song_id} className="bg-acrobat-surface p-8 rounded-3xl hover:bg-acrobat-surface-light transition-all group border border-white/5">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-black mb-1 group-hover:text-acrobat-primary transition-colors">{song.title}</h3>
                      <p className="text-acrobat-text-muted font-bold text-sm">{song.artist_name}</p>
                    </div>
                    <span className="text-2xl opacity-20 group-hover:opacity-100 transition-opacity">♪</span>
                  </div>
                  <p className="text-acrobat-text-muted text-xs mb-8 uppercase tracking-widest">{song.album_title}</p>
                  <div className="flex items-center justify-between border-t border-white/5 pt-6">
                    <span className="text-acrobat-primary font-black text-2xl">
                      {song.average_rating ? song.average_rating.toFixed(1) : '–'}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-acrobat-text-muted">Puan / 10</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-black border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-acrobat-primary rounded-full flex items-center justify-center">
              <span className="text-white font-black text-xs">A</span>
            </div>
            <span className="text-xl font-black tracking-tighter">Acrobat</span>
          </div>
          <div className="flex gap-12 text-sm font-bold text-acrobat-text-muted">
            <Link to="/login" className="hover:text-white transition-colors">Giriş Yap</Link>
            <Link to="/register" className="hover:text-white transition-colors">Kayıt Ol</Link>
            <a href="#" className="hover:text-white transition-colors">Gizlilik</a>
            <a href="#" className="hover:text-white transition-colors">Şartlar</a>
          </div>
          <p className="text-xs text-acrobat-text-muted font-bold">© 2025 Acrobat. Premium Mühendislik tarafından tasarlandı.</p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
