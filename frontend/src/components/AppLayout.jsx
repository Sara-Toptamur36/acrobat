import { useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { NAVIGATION, ROUTES } from '../router/routes'
import Player from './Player'

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout, isAdmin } = useAuth()
  const location = useLocation()

  // Combine navigation based on user role
  const navigation = isAdmin()
    ? [...NAVIGATION.BASE, ...NAVIGATION.ADMIN]
    : NAVIGATION.BASE

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="flex h-screen bg-acrobat-black text-white overflow-hidden p-2 gap-2">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={closeSidebar}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-acrobat-black transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col gap-2
      `}>
        {/* Navigation Pane */}
        <div className="bg-acrobat-dark rounded-xl p-4">
          <div className="flex flex-col px-4 mb-8">
            <div className="flex items-center">
              <span className="text-3xl font-black tracking-tighter text-acrobat-primary leading-none">ACROBAT</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white ml-[2px] mt-[-2px]">Basstastic</span>
          </div>

          <nav className="space-y-1">
            {NAVIGATION.BASE.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`sidebar-item ${isActive(item.href) ? 'sidebar-item-active' : ''}`}
                onClick={closeSidebar}
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  {item.name === 'Dashboard' && <span>🏠</span>}
                  {item.name === 'Artists' && <span>👤</span>}
                  {item.name === 'Albums' && <span>💿</span>}
                  {item.name === 'Songs' && <span>♪</span>}
                  {item.name === 'Playlists' && <span>📋</span>}
                  {item.name === 'Ara' && <span>🔍</span>}
                  {item.name === 'Türler' && <span>🎸</span>}
                  {item.name === 'Topluluk' && <span>👋</span>}
                </div>
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Secondary Pane (Library) */}
        <div className="bg-acrobat-dark rounded-xl flex-1 p-4 overflow-y-auto">
          <div className="px-4 mb-2 flex justify-between items-center text-acrobat-text-muted">
            <span className="text-sm font-bold flex items-center gap-2">
              <span>📚</span> Kitaplığın
            </span>
            <Link to={ROUTES.APP.PLAYLISTS} className="hover:text-white transition-colors" title="Yeni Liste">➕</Link>
          </div>

          <nav className="space-y-1 mb-6">
            <Link
              to={ROUTES.APP.PLAYLISTS}
              className={`sidebar-item ${isActive(ROUTES.APP.PLAYLISTS) ? 'sidebar-item-active' : ''}`}
              onClick={closeSidebar}
            >
              <div className="w-6 h-6 flex items-center justify-center">📋</div>
              Çalma Listem
            </Link>
            <Link
              to={ROUTES.APP.LIBRARY_ALBUMS}
              className={`sidebar-item ${isActive(ROUTES.APP.LIBRARY_ALBUMS) ? 'sidebar-item-active' : ''}`}
              onClick={closeSidebar}
            >
              <div className="w-6 h-6 flex items-center justify-center">💿</div>
              Albümlerim
            </Link>
            <Link
              to={ROUTES.APP.LIBRARY_ARTISTS}
              className={`sidebar-item ${isActive(ROUTES.APP.LIBRARY_ARTISTS) ? 'sidebar-item-active' : ''}`}
              onClick={closeSidebar}
            >
              <div className="w-6 h-6 flex items-center justify-center">🎤</div>
              Artistlerim
            </Link>
          </nav>

          {isAdmin() && (
            <div className="mt-4 border-t border-white/5 pt-4">
              <h3 className="px-4 mb-2 text-xs font-semibold text-acrobat-text-muted uppercase tracking-widest">
                Admin
              </h3>
              <nav className="space-y-1">
                {NAVIGATION.ADMIN.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`sidebar-item ${isActive(item.href) ? 'sidebar-item-active text-red-400' : ''}`}
                    onClick={closeSidebar}
                  >
                    <div className="w-6 h-6 flex items-center justify-center text-xs">
                      {item.name.includes('Panel') ? '⚙️' : '📊'}
                    </div>
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* User Profile Summary */}
        <div className="p-4 border-t border-white/5 backdrop-blur-xl bg-white/[0.02]">
          <Link
            to={ROUTES.APP.PROFILE}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-acrobat-surface flex items-center justify-center text-sm font-black text-acrobat-primary border border-white/5 group-hover:scale-105 transition-transform shadow-lg">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white truncate group-hover:text-acrobat-primary transition-colors">{user?.username || 'Kullanıcı'}</p>
              <p className="text-[10px] text-acrobat-text-muted truncate uppercase tracking-widest">{user?.role || 'User'}</p>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault()
                logout()
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-acrobat-text-muted hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
              title="Çıkış Yap"
            >
              🚪
            </button>
          </Link>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 pane flex flex-col relative group/main">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-acrobat-dark/90 backdrop-blur-sm px-6 py-3 flex items-center justify-between border-b border-white/5 mx-[-2px]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-white hover:bg-white/10 rounded-full transition-colors"
          >
            ☰
          </button>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-2">
              <button
                onClick={() => window.history.back()}
                className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                ❮
              </button>
              <button
                onClick={() => window.history.forward()}
                className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                ❯
              </button>
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              {navigation.find(item => isActive(item.href))?.name || 'Panel'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin() && (
              <Link to="/admin" className="hidden sm:inline-flex px-3 py-1 rounded-full bg-acrobat-primary/10 text-acrobat-primary text-xs font-bold uppercase tracking-widest border border-acrobat-primary/20 hover:bg-acrobat-primary hover:text-white transition-all items-center gap-2 shadow-sm">
                <span>⚙️</span> Admin
              </Link>
            )}
            <Link
              to={ROUTES.APP.PROFILE}
              className="w-8 h-8 rounded-full bg-acrobat-surface-light flex items-center justify-center text-[10px] font-black hover:bg-acrobat-primary transition-colors border border-white/5"
              title="Profil"
            >
              {user?.username?.charAt(0).toUpperCase()}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto scroll-smooth animate-in mb-20">
          <div className="p-6 pb-24 max-w-[1200px] mx-auto">
            <Outlet />
          </div>
        </div>

        <Player />
      </main>
    </div>
  )
}

export default AppLayout
