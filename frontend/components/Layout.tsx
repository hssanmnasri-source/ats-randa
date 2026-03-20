import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Notifications from './Notifications'

const NAV: Record<string, { label: string; icon: string; path: string }[]> = {
  RH: [
    { label: 'Dashboard', icon: '📊', path: '/rh/dashboard' },
    { label: 'Offres', icon: '💼', path: '/rh/offers' },
  ],
  AGENT: [
    { label: 'CVs', icon: '📋', path: '/agent/cvs' },
    { label: 'Candidats', icon: '👥', path: '/agent/candidates' },
  ],
  CANDIDATE: [
    { label: 'Mon CV', icon: '📄', path: '/candidate/cv' },
    { label: 'Offres', icon: '🔍', path: '/candidate/offers' },
    { label: 'Candidatures', icon: '📬', path: '/candidate/applications' },
  ],
  ADMIN: [
    { label: 'Statistiques', icon: '📈', path: '/admin/stats' },
    { label: 'Utilisateurs', icon: '👤', path: '/admin/users' },
  ],
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const links = user ? (NAV[user.role] ?? []) : []

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-blue-400">ATS RANDA</h1>
          <p className="text-xs text-slate-400 mt-1">{user?.role}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {links.map(link => (
            <Link key={link.path} to={link.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                ${location.pathname.startsWith(link.path)
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'}`}>
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <div className="text-sm text-slate-400 mb-2 truncate">{user?.email}</div>
          <button onClick={handleLogout}
            className="w-full text-left text-sm text-red-400 hover:text-red-300 transition-colors">
            &#8592; Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Notifications />
        {children}
      </main>
    </div>
  )
}
