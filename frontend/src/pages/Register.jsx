import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { register } = useAuth()
  const navigate = useNavigate()

  const validate = () => {
    const newErrors = {}
    if (formData.username.length < 3) {
      newErrors.username = 'Kullanıcı adı en az 3 karakter olmalıdır'
    }
    if (!formData.email.includes('@')) {
      newErrors.email = 'Geçerli bir e-posta adresi girin'
    }
    if (formData.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır'
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await register(
        formData.username,
        formData.email,
        formData.password
      )
      setLoading(false)
      // Context will handle navigation to /app/dashboard
      toast.success('Kayıt başarılı! Hoş geldiniz.')
    } catch (error) {
      if (error.response?.status === 409) {
        const errorMsg = error.response?.data?.error?.message || ''
        if (errorMsg.toLowerCase().includes('email')) {
          setErrors({ email: 'E-posta zaten kayıtlı' })
        } else {
          setErrors({ username: 'Kullanıcı adı zaten mevcut' })
        }
      } else {
        toast.error('Kayıt başarısız. Lütfen tekrar deneyin.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-acrobat-black flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-acrobat-primary/10 via-black to-black">
      <Link to="/" className="flex items-center gap-2 mb-12 group transition-transform hover:scale-105">
        <div className="w-12 h-12 bg-acrobat-primary rounded-full flex items-center justify-center shadow-2xl shadow-acrobat-primary/20">
          <span className="text-white text-3xl font-black italic">A</span>
        </div>
        <span className="text-3xl font-black tracking-tighter text-white">Acrobat</span>
      </Link>

      <div className="w-full max-w-md bg-acrobat-dark rounded-3xl p-10 shadow-2xl border border-white/5 animate-slide-up">
        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter text-center">Bize Katıl</h1>
        <p className="text-acrobat-text-muted text-center mb-10 font-medium">Premium hesabını oluştur.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-acrobat-text-muted px-1">Kullanıcı Adı</label>
            <input
              type="text"
              name="username"
              required
              className={`input h-14 font-bold ${errors.username ? 'ring-1 ring-red-500' : ''}`}
              placeholder="En az 3 karakter"
              value={formData.username}
              onChange={handleChange}
            />
            {errors.username && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest px-1">{errors.username}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-acrobat-text-muted px-1">E-posta</label>
            <input
              type="email"
              name="email"
              required
              className={`input h-14 font-bold ${errors.email ? 'ring-1 ring-red-500' : ''}`}
              placeholder="E-posta adresin"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest px-1">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-acrobat-text-muted px-1">Şifre</label>
            <input
              type="password"
              name="password"
              required
              className={`input h-14 font-bold ${errors.password ? 'ring-1 ring-red-500' : ''}`}
              placeholder="En az 6 karakter"
              value={formData.password}
              onChange={handleChange}
            />
            {errors.password && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest px-1">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-acrobat-text-muted px-1">Şifreyi Onayla</label>
            <input
              type="password"
              name="confirmPassword"
              required
              className={`input h-14 font-bold ${errors.confirmPassword ? 'ring-1 ring-red-500' : ''}`}
              placeholder="Şifreyi tekrarla"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            {errors.confirmPassword && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest px-1">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full h-14 text-xl mt-6"
          >
            {loading ? 'Hesap Oluşturuluyor...' : 'Hemen Başla'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-acrobat-text-muted font-bold text-sm">
            Zaten üye misiniz? {' '}
            <Link to="/login" className="text-white hover:text-acrobat-primary underline transition-colors decoration-acrobat-primary">
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 text-[10px] font-black uppercase tracking-widest text-acrobat-text-muted opacity-40">
        Sonsuza dek ücretsiz • Reklamsız deneyim
      </div>
    </div>
  )
}

export default Register
