import { createBrowserRouter, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import RhDashboardPage from './pages/rh/DashboardPage'
import RhOffersPage from './pages/rh/OffersPage'
import MatchingPage from './pages/rh/MatchingPage'
import CandidateCVPage from './pages/candidate/CVPage'
import CandidateOffersPage from './pages/candidate/OffersPage'
import ApplicationsPage from './pages/candidate/ApplicationsPage'
import AgentCVsPage from './pages/agent/CVsPage'
import AgentCandidatesPage from './pages/agent/CandidatesPage'
import AdminStatsPage from './pages/admin/StatsPage'
import AdminUsersPage from './pages/admin/UsersPage'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },

  { path: '/rh/dashboard', element: <ProtectedRoute roles={['RH', 'ADMIN']}><RhDashboardPage /></ProtectedRoute> },
  { path: '/rh/offers', element: <ProtectedRoute roles={['RH', 'ADMIN']}><RhOffersPage /></ProtectedRoute> },
  { path: '/rh/offers/:offerId/matching', element: <ProtectedRoute roles={['RH', 'ADMIN']}><MatchingPage /></ProtectedRoute> },

  { path: '/candidate/cv', element: <ProtectedRoute roles={['CANDIDATE']}><CandidateCVPage /></ProtectedRoute> },
  { path: '/candidate/offers', element: <ProtectedRoute roles={['CANDIDATE']}><CandidateOffersPage /></ProtectedRoute> },
  { path: '/candidate/applications', element: <ProtectedRoute roles={['CANDIDATE']}><ApplicationsPage /></ProtectedRoute> },

  { path: '/agent/cvs', element: <ProtectedRoute roles={['AGENT', 'ADMIN']}><AgentCVsPage /></ProtectedRoute> },
  { path: '/agent/candidates', element: <ProtectedRoute roles={['AGENT', 'ADMIN']}><AgentCandidatesPage /></ProtectedRoute> },

  { path: '/admin/stats', element: <ProtectedRoute roles={['ADMIN']}><AdminStatsPage /></ProtectedRoute> },
  { path: '/admin/users', element: <ProtectedRoute roles={['ADMIN']}><AdminUsersPage /></ProtectedRoute> },

  {
    path: '/unauthorized',
    element: (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800">Accès refusé</h1>
          <p className="text-slate-500 mt-2">Vous n'avez pas les droits nécessaires.</p>
        </div>
      </div>
    ),
  },
])