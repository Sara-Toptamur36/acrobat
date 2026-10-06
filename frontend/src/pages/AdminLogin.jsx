import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { ROUTES } from '../router/routes'

const AdminLogin = () => {
    const [formData, setFormData] = useState({ email: '', password: '' })
    const [loading, setLoading] = useState(false)
    const { loginWithCredentials, isAdmin } = useAuth()
    const navigate = useNavigate()

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await loginWithCredentials(formData.email, formData.password)
            // AuthContext handles everything: state update, toast, and redirection
            setLoading(false)
        } catch (error) {
            const msg = error.response?.data?.error?.message || 'Giriş başarısız'
            toast.error(msg)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-acrobat-black flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-red-900/20 via-black to-black">
            <div className="absolute top-8 left-8">
                <Link to="/" className="flex items-center gap-2 group transition-transform hover:scale-105">
                    <div className="w-8 h-8 bg-acrobat-primary rounded-lg flex items-center justify-center shadow-lg">
                        <span className="text-white text-xl font-black italic">A</span>
                    </div>
                    <span className="text-xl font-black tracking-tighter text-white">Acrobat</span>
                </Link>
            </div>

            <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-3xl rounded-[2.5rem] p-12 shadow-2xl border border-white/5 animate-fade-in relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-acrobat-primary/10 blur-[80px] rounded-full"></div>

                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-3 bg-red-500/10 rounded-2xl mb-4 border border-red-500/20">
                        <span className="text-2xl">🛡️</span>
                    </div>
                    <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">Yönetici Girişi</h1>
                    <p className="text-acrobat-text-muted text-sm font-medium">Platform operasyonlarını yönetin.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-acrobat-text-muted px-2">E-posta</label>
                        <input
                            type="email"
                            name="email"
                            required
                            className="input h-14 text-lg bg-white/5 border-white/10 focus:border-red-500/50"
                            placeholder="admin@acrobat.com"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-acrobat-text-muted px-2">Şifre</label>
                        <input
                            type="password"
                            name="password"
                            required
                            className="input h-14 text-lg bg-white/5 border-white/10 focus:border-red-500/50"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-red-600/20 active:scale-[0.98] disabled:opacity-50 mt-4"
                    >
                        {loading ? 'Yetkilendiriliyor...' : 'Yönetici Paneline Gir'}
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t border-white/5 text-center">
                    <Link to="/login" className="text-xs font-bold text-acrobat-text-muted hover:text-white transition-colors">
                        Kullanıcı Girişine Dön
                    </Link>
                </div>
            </div>

            <div className="mt-8 text-[10px] font-black uppercase tracking-widest text-white/20 select-none">
                Acrobat Management System v2.0
            </div>
        </div>
    )
}

export default AdminLogin
