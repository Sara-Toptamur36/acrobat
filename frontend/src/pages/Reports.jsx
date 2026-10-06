import { Link } from 'react-router-dom'
import { routeHelpers } from '../router/routes'

const Reports = () => {
  const reports = [
    {
      id: 'genres',
      title: 'Tür İstatistikleri',
      description: 'Türlere göre şarkı sayısı ve popülerlik dağılımını görüntüleyin',
      icon: '🎵',
      color: 'bg-blue-500/10 text-blue-400',
      path: routeHelpers.genreReport()
    },
    {
      id: 'albums-by-year',
      title: 'Yayın Trendleri',
      description: 'Geçmiş albüm yayın istatistikleri ve modelleri',
      icon: '📅',
      color: 'bg-green-500/10 text-green-500',
      path: routeHelpers.albumReport()
    },
    {
      id: 'active-users',
      title: 'Kullanıcı Aktivitesi',
      description: 'En çok katkıda bulunanlar ve aktif topluluk üyeleri',
      icon: '👥',
      color: 'bg-purple-500/10 text-purple-500',
      path: routeHelpers.userReport()
    },
    {
      id: 'top-songs',
      title: 'Liderlik Tablosu',
      description: 'Topluluk tarafından oylanan en yüksek puanlı parçalar',
      icon: '⭐',
      color: 'bg-yellow-500/10 text-yellow-500',
      path: routeHelpers.topSongsReport()
    }
  ]

  const ReportCard = ({ report }) => (
    <Link
      to={report.path}
      className="card group p-8"
    >
      <div className="flex items-start gap-6">
        <div className={`p-4 rounded-2xl ${report.color} group-hover:scale-110 transition-transform`}>
          <span className="text-3xl">{report.icon}</span>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-black text-white mb-2 tracking-tight group-hover:text-acrobat-green transition-colors">
            {report.title}
          </h3>
          <p className="text-sm font-medium text-acrobat-text-muted leading-relaxed">
            {report.description}
          </p>
        </div>
        <div className="text-white/20 group-hover:text-white transition-colors self-center">
          <span className="text-xl">→</span>
        </div>
      </div>
    </Link>
  )

  return (
    <div className="space-y-12 animate-fade-in px-2">
      {/* Header */}
      <div>
        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-acrobat-green mb-2">Analizler</h4>
        <h1 className="text-5xl font-black tracking-tighter text-white">Raporlar</h1>
      </div>

      {/* Hero Overview */}
      <div className="bg-gradient-to-br from-acrobat-surface to-black p-10 rounded-3xl border border-white/5 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-4xl shadow-inner">📈</div>
          <div>
            <h2 className="text-2xl font-black text-white mb-2">Kolektif Zeka</h2>
            <p className="text-acrobat-text-muted font-medium max-w-xl">
              Katalog performansınız ve topluluk katılımınız hakkında gerçek zamanlı bilgiler edinin.
              Analiz motorumuz bu tabloları sağlamak için günlük binlerce veri noktasını işler.
            </p>
          </div>
        </div>
        <div className="absolute top-[-50%] right-[-10%] w-1/2 aspect-square bg-blue-500/5 blur-[120px] rounded-full"></div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {reports.map((report) => <ReportCard key={report.id} report={report} />)}
      </div>

      {/* Meta Labels */}
      <div className="pt-12 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-40">
        {[
          { label: 'Kaynaklar', val: 'Katalog DB' },
          { label: 'Motor', val: 'Gerçek Zamanlı v2' },
          { label: 'Çalışma Süresi', val: '100%' },
          { label: 'Son Senkronizasyon', val: 'Şimdi' }
        ].map(meta => (
          <div key={meta.label}>
            <p className="text-[10px] font-black uppercase tracking-widest text-acrobat-text-muted mb-1">{meta.label}</p>
            <p className="text-sm font-black text-white">{meta.val}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Reports
