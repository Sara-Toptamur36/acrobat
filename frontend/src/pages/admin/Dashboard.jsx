import { useState, useEffect } from 'react'

const StatCard = ({ title, value, icon, trend, color = 'acrobat-primary' }) => (
    <div className={`p-6 rounded-2xl border bg-black/40 backdrop-blur-md relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500 border-white/5`}>
        <div className={`absolute top-0 right-0 p-4 opacity-10 text-9xl text-acrobat-primary transform translate-x-10 -translate-y-10 group-hover:rotate-12 transition-transform duration-700`}>
            {icon}
        </div>
        <div className="relative z-10">
            <p className="text-neutral-400 text-xs font-black uppercase tracking-widest mb-2">{title}</p>
            <h3 className="text-4xl font-black text-white tracking-tighter mb-4">{value}</h3>
            {trend && (
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-acrobat-primary/10 text-acrobat-primary text-xs font-bold border border-acrobat-primary/20`}>
                    <span>📈</span>
                    <span>{trend}</span>
                </div>
            )}
        </div>
    </div>
)

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        total_users: 0,
        active_content: 0,
        system_load: 'Checking...',
        pending_approvals: 0
    })
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const { adminDashboardApi } = await import('../../services/api')
            const response = await adminDashboardApi.getStats()
            if (response.data.data) {
                setStats(response.data.data.stats)
                setActivities(response.data.data.activities)
            }
        } catch (error) {
            console.error('Dashboard stats error:', error)
        } finally {
            setLoading(false)
        }
    }

    // Quick formatting for relative time could be added here or use a library
    const formatTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Sistem Özeti</h1>
                <p className="text-neutral-400">Platform metrikleri ve hızlı işlemler.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Toplam Kullanıcı"
                    value={loading ? '...' : stats.total_users}
                    icon="👥"
                    trend="Aktif"
                    color="blue"
                />
                <StatCard
                    title="Aktif İçerik"
                    value={loading ? '...' : stats.active_content}
                    icon="🎵"
                    trend="Şarkı & Albüm"
                    color="purple"
                />
                <StatCard
                    title="Sistem Durumu"
                    value={loading ? '...' : stats.system_load}
                    icon="⚡"
                    trend="Online"
                    color="green"
                />
                <StatCard
                    title="Bekleyen"
                    value={loading ? '...' : stats.pending_approvals}
                    icon="⚠️"
                    trend="İnceleme"
                    color="yellow"
                />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-8 rounded-3xl bg-neutral-800/30 border border-white/5">
                    <h3 className="text-xl font-bold text-white mb-6">Son Aktiviteler</h3>
                    <div className="space-y-4">
                        {loading ? (
                            <p className="text-neutral-500">Yükleniyor...</p>
                        ) : activities.length === 0 ? (
                            <p className="text-neutral-500">Aktivite bulunamadı.</p>
                        ) : (
                            activities.map((act, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${act.type === 'user' ? 'bg-acrobat-primary/10 text-acrobat-primary' : 'bg-white/10 text-white'}`}>
                                        {act.type === 'user' ? 'U' : 'R'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-white">{act.message}</p>
                                        <p className="text-xs text-neutral-500">{formatTime(act.time)} • {act.detail}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="p-8 rounded-3xl bg-neutral-800/30 border border-white/5">
                    <h3 className="text-xl font-bold text-white mb-6">Hızlı İşlemler</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="p-4 rounded-xl bg-gradient-to-br from-acrobat-primary to-black hover:from-acrobat-primary-light hover:to-acrobat-primary transition-all text-white font-bold text-sm shadow-lg shadow-acrobat-primary/20">
                            + Yeni Duyuru
                        </button>
                        <button className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-white font-bold text-sm">
                            Sistem Bakımı
                        </button>
                        <button className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-white font-bold text-sm">
                            Yedek Al
                        </button>
                        <button className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-white font-bold text-sm">
                            Logları Temizle
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard
