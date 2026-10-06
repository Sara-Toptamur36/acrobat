import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { ROUTES } from '../router/routes'
import { authApi, uploadApi } from '../services/api'
import ImageUpload from '../components/ImageUpload'
import Modal from '../components/Modal'

const Profile = () => {
    const { user, setUser } = useAuth()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showUploadModal, setShowUploadModal] = useState(false)

    if (!user) return null

    return (
        <div className="max-w-5xl mx-auto space-y-8 p-6 animate-fade-in">
            {/* Hero Section */}
            <div className="relative h-64 rounded-3xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-acrobat-primary/40 to-purple-600/40 backdrop-blur-3xl"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80')] bg-cover bg-center mix-blend-overlay opacity-50 group-hover:scale-105 transition-transform duration-700"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-acrobat-surface via-transparent to-transparent"></div>

                <div className="absolute bottom-8 left-8 flex items-end gap-6">
                    <div className="w-32 h-32 rounded-2xl bg-acrobat-surface-light border-4 border-acrobat-surface shadow-2xl flex items-center justify-center text-4xl font-black text-white overflow-hidden">
                        {user.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="pb-2">
                        <div className="text-acrobat-primary font-black text-[10px] uppercase tracking-[0.2em] mb-1">PROFIL</div>
                        <h1 className="text-5xl font-black text-white mb-2">{user.username}</h1>
                        <p className="text-acrobat-text-muted flex items-center gap-2">
                            <span>{user.email}</span>
                            <span className="w-1 h-1 rounded-full bg-acrobat-text-muted"></span>
                            <span className="capitalize">{user.role || 'Kullanıcı'}</span>
                        </p>
                    </div>
                </div>

                <div className="absolute top-8 right-8">
                    <Link
                        to={ROUTES.APP.SETTINGS}
                        className="btn btn-primary rounded-full px-6 py-2 flex items-center gap-2 group/btn"
                    >
                        <span className="group-hover/btn:rotate-90 transition-transform duration-300">⚙</span>
                        Profili Düzenle
                    </Link>
                </div>
            </div>

            {/* Content Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-acrobat-surface/40 border border-white/5 rounded-2xl p-6 backdrop-blur-xl hover:border-acrobat-primary/30 transition-colors">
                    <div className="text-acrobat-text-muted text-[10px] font-black uppercase tracking-widest mb-2">HESAP DURUMU</div>
                    <div className="text-2xl font-black text-white mb-2">Aktif</div>
                    <p className="text-xs text-acrobat-text-muted">Kayıtlı ve doğrulanmış kullanıcı.</p>
                </div>
                <div className="bg-acrobat-surface/40 border border-white/5 rounded-2xl p-6 backdrop-blur-xl hover:border-acrobat-primary/30 transition-colors">
                    <div className="text-acrobat-text-muted text-[10px] font-black uppercase tracking-widest mb-2">ROL</div>
                    <div className="text-2xl font-black text-white capitalize mb-2">{user.role || 'Standart'}</div>
                    <p className="text-xs text-acrobat-text-muted">Platform erişim seviyeniz.</p>
                </div>
                <div className="bg-acrobat-surface/40 border border-white/5 rounded-2xl p-6 backdrop-blur-xl hover:border-acrobat-primary/30 transition-colors">
                    <div className="text-acrobat-text-muted text-[10px] font-black uppercase tracking-widest mb-2">KİMLİK</div>
                    <div className="text-2xl font-black text-white mb-2">#{user.user_id}</div>
                    <p className="text-xs text-acrobat-text-muted">Sistemdeki benzersiz numaranız.</p>
                </div>
            </div>

            {/* Quick Actions */}
            <section className="space-y-4">
                <h3 className="text-xl font-black text-white">Hızlı İşlemler</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link to={ROUTES.APP.SETTINGS} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors group">
                        <div className="w-12 h-12 rounded-xl bg-acrobat-primary/10 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                            🔐
                        </div>
                        <div>
                            <div className="text-sm font-bold text-white">Şifre Değiştir</div>
                            <div className="text-xs text-acrobat-text-muted">Güvenliğiniz için şifrenizi güncelleyin.</div>
                        </div>
                    </Link>
                    <Link to={ROUTES.APP.PLAYLISTS} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors group">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                            🎵
                        </div>
                        <div>
                            <div className="text-sm font-bold text-white">Çalma Listelerim</div>
                            <div className="text-xs text-acrobat-text-muted">Favori müziklerinize göz atın.</div>
                        </div>
                    </Link>
                </div>
            </section>

            {/* Account Details */}
            <section className="bg-acrobat-surface/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl">
                <div className="px-8 py-6 border-b border-white/5">
                    <h3 className="text-xl font-black text-white">Hesap Detayları</h3>
                </div>
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="text-[10px] font-black text-acrobat-text-muted uppercase tracking-widest block mb-1">KULLANICI ADI</label>
                            <p className="text-white font-bold">{user.username}</p>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-acrobat-text-muted uppercase tracking-widest block mb-1">E-POSTA ADRESİ</label>
                            <p className="text-white font-bold">{user.email}</p>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-acrobat-text-muted uppercase tracking-widest block mb-1"> KAYIT TARİHİ</label>
                            <p className="text-white font-bold">{user.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}</p>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-acrobat-text-muted uppercase tracking-widest block mb-1">HESAP TÜRÜ</label>
                            <p className="text-acrobat-primary font-bold">Premium Acrobat</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Profile
