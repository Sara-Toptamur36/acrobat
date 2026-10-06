import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { authApi } from '../services/api'

const Settings = () => {
    const { user, updateUserData } = useAuth()
    const [profileData, setProfileData] = useState({
        username: '',
        email: ''
    })
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState({ type: '', message: '' })

    useEffect(() => {
        if (user) {
            setProfileData({
                username: user.username || '',
                email: user.email || ''
            })
        }
    }, [user])

    const handleProfileUpdate = async (e) => {
        e.preventDefault()
        setLoading(true)
        setStatus({ type: '', message: '' })
        try {
            const res = await authApi.updateProfile(profileData)
            const updatedUser = res.data.data
            updateUserData(updatedUser)
            setStatus({ type: 'success', message: 'Profil başarıyla güncellendi.' })
        } catch (err) {
            setStatus({ type: 'error', message: err.response?.data?.error?.message || 'Güncelleme başarısız.' })
        } finally {
            setLoading(false)
        }
    }

    const handlePasswordUpdate = async (e) => {
        e.preventDefault()
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setStatus({ type: 'error', message: 'Yeni şifreler eşleşmiyor.' })
            return
        }
        setLoading(true)
        try {
            await authApi.updatePassword(passwordData.currentPassword, passwordData.newPassword)
            setStatus({ type: 'success', message: 'Şifre başarıyla güncellendi.' })
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        } catch (err) {
            setStatus({ type: 'error', message: err.response?.data?.error?.message || 'Şifre güncelleme başarısız.' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-6 animate-fade-in">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-white mb-2">Hesap Ayarları</h1>
                <p className="text-acrobat-text-muted">Profil bilgilerini ve güvenlik ayarlarını buradan yönetebilirsin.</p>
            </header>

            {status.message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 animate-slide-up ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                    }`}>
                    <span>{status.type === 'success' ? '✓' : '⚠'}</span>
                    <p className="font-bold text-sm">{status.message}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Profile Info */}
                <section className="bg-acrobat-surface/30 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
                    <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                        <span className="text-acrobat-primary">👤</span> Profil Bilgileri
                    </h2>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-acrobat-text-muted mb-2">Kullanıcı Adı</label>
                            <input
                                type="text"
                                className="input-field"
                                value={profileData.username}
                                onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-acrobat-text-muted mb-2">E-posta</label>
                            <input
                                type="email"
                                className="input-field opacity-50 cursor-not-allowed"
                                value={profileData.email}
                                disabled
                            />
                            <p className="text-[9px] text-acrobat-text-muted mt-1 italic">* E-posta adresi şu an değiştirilemez.</p>
                        </div>
                        <button type="submit" className="btn btn-primary w-full py-3 mt-4" disabled={loading}>
                            {loading ? 'Güncelleniyor...' : 'Bilgileri Kaydet'}
                        </button>
                    </form>
                </section>

                {/* Password Update */}
                <section className="bg-acrobat-surface/30 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
                    <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                        <span className="text-acrobat-primary">🔐</span> Güvenlik & Şifre
                    </h2>
                    <form onSubmit={handlePasswordUpdate} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-acrobat-text-muted mb-2">Mevcut Şifre</label>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="••••••••"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div className="pt-2 border-t border-white/5">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-acrobat-text-muted mb-2">Yeni Şifre</label>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="En az 6 karakter"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-acrobat-text-muted mb-2">Yeni Şifre (Tekrar)</label>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="En az 6 karakter"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-secondary w-full py-3 mt-4" disabled={loading}>
                            {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                        </button>
                    </form>
                </section>
            </div>

            {/* Account Info Footer */}
            <footer className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6">
                <p className="text-xs text-amber-200/60 leading-relaxed italic">
                    <strong>Not:</strong> Güvenlik sebebiyle e-posta adresi değişikliği şu an için sistem üzerinden yapılamamaktadır. Değişiklik talebi için yönetici ile iletişime geçiniz.
                    Hesabınızın silinmesi durumunda tüm çalma listeleriniz ve beğenileriniz kalıcı olarak kaldırılacaktır.
                </p>
            </footer>
        </div>
    )
}

export default Settings
