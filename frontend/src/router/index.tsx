import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import AuthLayout from '../layouts/AuthLayout';
import RHLayout from '../layouts/RHLayout';
import AdminLayout from '../layouts/AdminLayout';
import CandidateLayout from '../layouts/CandidateLayout';
import AgentLayout from '../layouts/AgentLayout';

// Public pages
import HomePage from '../pages/public/HomePage';
import OfferDetailPage from '../pages/public/OfferDetailPage';

// Auth pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// Candidate pages
import CandidateDashboard from '../pages/candidate/DashboardPage';
import MyCVPage from '../pages/candidate/MyCVPage';
import ApplicationsPage from '../pages/candidate/ApplicationsPage';
import CandidateProfilePage from '../pages/candidate/ProfilePage';

// Agent pages
import AgentDashboard from '../pages/agent/DashboardPage';
import UploadCVPage from '../pages/agent/UploadCVPage';
import CVListPage from '../pages/agent/CVListPage';

// RH pages
import RHDashboard from '../pages/rh/DashboardPage';
import OffersPage from '../pages/rh/OffersPage';
import OfferFormPage from '../pages/rh/OfferFormPage';
import MatchingPage from '../pages/rh/MatchingPage';
import ResultsPage from '../pages/rh/ResultsPage';

// Admin pages
import AdminDashboard from '../pages/admin/DashboardPage';
import UsersPage from '../pages/admin/UsersPage';
import UserFormPage from '../pages/admin/UserFormPage';

export const router = createBrowserRouter([
  // Public
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/offers/:id', element: <OfferDetailPage /> },
    ],
  },

  // Auth
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },

  // Candidate
  {
    path: '/candidate',
    element: (
      <ProtectedRoute allowedRoles={['CANDIDATE']}>
        <CandidateLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <CandidateDashboard /> },
      { path: 'cv', element: <MyCVPage /> },
      { path: 'applications', element: <ApplicationsPage /> },
      { path: 'profile', element: <CandidateProfilePage /> },
    ],
  },

  // Agent
  {
    path: '/agent',
    element: (
      <ProtectedRoute allowedRoles={['AGENT']}>
        <AgentLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AgentDashboard /> },
      { path: 'upload', element: <UploadCVPage /> },
      { path: 'cvs', element: <CVListPage /> },
    ],
  },

  // RH
  {
    path: '/rh',
    element: (
      <ProtectedRoute allowedRoles={['RH']}>
        <RHLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <RHDashboard /> },
      { path: 'offers', element: <OffersPage /> },
      { path: 'offers/new', element: <OfferFormPage /> },
      { path: 'offers/:id/edit', element: <OfferFormPage /> },
      { path: 'matching', element: <MatchingPage /> },
      { path: 'results', element: <ResultsPage /> },
    ],
  },

  // Admin
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'users/new', element: <UserFormPage /> },
    ],
  },
]);
