import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ROUTES } from '../router/routes'

const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { user, logout } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + '/')
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const navItems = [
        { name: 'Genel Bakış', path: '/admin', icon: '📊' },
        { name: 'Kullanıcılar', path: '/admin/users', icon: '👥' },
        { name: 'İçerik Yönetimi', path: '/admin/content', icon: '💿' },
        { name: 'Raporlar', path: '/admin/reports', icon: '📈' },
    ]

    return (
        <div className="flex h-screen bg-acrobat-black text-white overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-acrobat-black border-r border-acrobat-primary/20 flex flex-col">
                {/* Logo Area */}
                <div className="p-6 border-b border-acrobat-primary/10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-acrobat-primary to-black rounded-lg flex items-center justify-center shadow-lg shadow-acrobat-primary/50">
                        <span className="text-2xl">⚡</span>
                    </div>
                    <div>
                        <h1 className="font-black text-xl tracking-tighter text-acrobat-primary">ADMIN</h1>
                        <p className="text-[10px] text-neutral-500 tracking-widest uppercase">System Control</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all border border-transparent ${isActive(item.path)
                                ? 'bg-acrobat-primary/10 text-acrobat-primary border-acrobat-primary/20 shadow-lg shadow-acrobat-primary/20'
                                : 'text-neutral-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <span className="text-lg">{item.icon}</span>
                            <span className="font-bold text-sm tracking-wide">{item.name}</span>
                        </Link>
                    ))}
                </nav>

                {/* User / Logout */}
                <div className="p-4 border-t border-acrobat-primary/10 bg-black/20">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-acrobat-primary/20 border border-acrobat-primary/30 flex items-center justify-center text-acrobat-primary font-bold">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-bold text-sm truncate text-white">{user?.username}</p>
                            <p className="text-[10px] text-acrobat-primary truncate">Administrator</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Link to="/app" className="btn bg-neutral-800 hover:bg-neutral-700 text-xs py-2 rounded-lg text-center border border-white/5 transition-colors">
                            Uygulamaya Dön
                        </Link>
                        <button onClick={handleLogout} className="btn bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/30 text-xs py-2 rounded-lg transition-colors">
                            Çıkış
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header */}
                <header className="h-16 border-b border-acrobat-primary/10 bg-acrobat-dark/50 backdrop-blur-md flex items-center justify-between px-8">
                    <h2 className="text-xl font-black tracking-tight text-white/80">
                        {navItems.find(i => isActive(i.path))?.name || 'Dashboard'}
                    </h2>
                    <div className="flex items-center gap-4">
                        <span className="px-3 py-1 rounded-full bg-acrobat-primary/10 text-acrobat-primary text-[10px] font-black uppercase tracking-widest border border-acrobat-primary/20">
                            Live System
                        </span>
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-acrobat-black">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}

export default AdminLayout
