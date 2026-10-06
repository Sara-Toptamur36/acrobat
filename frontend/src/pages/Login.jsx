import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { loginWithCredentials } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/app/dashboard'

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await loginWithCredentials(formData.email, formData.password)
      setLoading(false)
      // Context will handle navigation
      toast.success('Tekrar hoş geldin!')
    } catch (error) {
      const msg = error.response?.data?.error?.message || 'Giriş başarısız'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-acrobat-black flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-acrobat-primary/10 via-black to-black">
      <Link to="/" className="flex items-center gap-2 mb-12 group transition-transform hover:scale-105">
        <div className="w-12 h-12 bg-acrobat-primary rounded-full flex items-center justify-center shadow-2xl shadow-acrobat-primary/20">
          <span className="text-white text-3xl font-black italic">A</span>
        </div>
        <span className="text-3xl font-black tracking-tighter text-white">Acrobat</span>
      </Link>

      <div className="w-full max-w-md bg-acrobat-dark rounded-3xl p-10 shadow-2xl border border-white/5 animate-slide-up">
        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter text-center">Giriş Yap</h1>
        <p className="text-acrobat-text-muted text-center mb-10 font-medium">Premium kataloğunu yönet.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-black uppercase tracking-widest text-acrobat-text-muted px-1">E-posta</label>
            <input
              type="email"
              name="email"
              required
              className="input h-14 text-lg font-bold"
              placeholder="E-posta adresin"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black uppercase tracking-widest text-acrobat-text-muted px-1">Şifre</label>
            <input
              type="password"
              name="password"
              required
              className="input h-14 text-lg font-bold"
              placeholder="Şifren"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full h-14 text-xl mt-4"
          >
            {loading ? 'Doğrulanıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div className="mt-10 pt-10 border-t border-white/5 text-center space-y-4">
          <p className="text-acrobat-text-muted font-bold text-sm">
            Hala hesabın yok mu? {' '}
            <Link to="/register" className="text-white hover:text-acrobat-primary underline transition-colors decoration-acrobat-primary">
              Acrobat'a Katıl
            </Link>
          </p>
          <Link to="/admin-login" className="block text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-red-500 transition-colors">
            Yönetici Girişi 🛡️
          </Link>
        </div>
      </div>

      <div className="mt-8 text-[10px] font-black uppercase tracking-widest text-acrobat-text-muted opacity-40">
        Güvenli • Yerel • Premium
      </div>
    </div>
  )
}

export default Login
