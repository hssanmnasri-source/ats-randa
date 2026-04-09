import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Spin } from 'antd';
import ProtectedRoute from './ProtectedRoute';

// Layouts (small, always needed — keep eager)
import PublicLayout from '../layouts/PublicLayout';
import AuthLayout from '../layouts/AuthLayout';
import RHLayout from '../layouts/RHLayout';
import AdminLayout from '../layouts/AdminLayout';
import CandidateLayout from '../layouts/CandidateLayout';
import AgentLayout from '../layouts/AgentLayout';

// Auth pages (needed at startup)
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// Lazy-loaded pages
const GoogleCallbackPage  = lazy(() => import('../pages/auth/GoogleCallbackPage'));

const HomePage            = lazy(() => import('../pages/public/HomePage'));
const OfferDetailPage     = lazy(() => import('../pages/public/OfferDetailPage'));

const CandidateDashboard  = lazy(() => import('../pages/candidate/DashboardPage'));
const MyCVPage            = lazy(() => import('../pages/candidate/MyCVPage'));
const ApplicationsPage    = lazy(() => import('../pages/candidate/ApplicationsPage'));
const CandidateProfilePage = lazy(() => import('../pages/candidate/ProfilePage'));
const CoverLettersPage    = lazy(() => import('../pages/candidate/CoverLettersPage'));
const DocumentsPage       = lazy(() => import('../pages/candidate/DocumentsPage'));
const SettingsPage        = lazy(() => import('../pages/candidate/SettingsPage'));
const FavoritesPage       = lazy(() => import('../pages/candidate/FavoritesPage'));
const CVGeneratorPage     = lazy(() => import('../pages/candidate/CVGeneratorPage'));
const OffresPage          = lazy(() => import('../pages/candidate/OffresPage'));
const OffreDetailPage     = lazy(() => import('../pages/candidate/OffreDetailPage'));

const AgentDashboard      = lazy(() => import('../pages/agent/DashboardPage'));
const UploadCVPage        = lazy(() => import('../pages/agent/UploadCVPage'));
const CVListPage          = lazy(() => import('../pages/agent/CVListPage'));
const BatchUploadPage     = lazy(() => import('../pages/agent/BatchUploadPage'));
const HistoryPage         = lazy(() => import('../pages/agent/HistoryPage'));

const RHDashboard         = lazy(() => import('../pages/rh/DashboardPage'));
const N8NCalendarPage     = lazy(() => import('../pages/rh/N8NCalendarPage'));
const OffersPage          = lazy(() => import('../pages/rh/OffersPage'));
const OfferFormPage       = lazy(() => import('../pages/rh/OfferFormPage'));
const MatchingPage        = lazy(() => import('../pages/rh/MatchingPage'));
const ResultsPage         = lazy(() => import('../pages/rh/ResultsPage'));
const CVthequePage        = lazy(() => import('../pages/rh/CVthequePage'));
const CandidaturesPage    = lazy(() => import('../pages/rh/CandidaturesPage'));
const CalendarPage        = lazy(() => import('../pages/rh/CalendarPage'));
const StatsPage           = lazy(() => import('../pages/rh/StatsPage'));

const AdminDashboard      = lazy(() => import('../pages/admin/DashboardPage'));
const UsersPage           = lazy(() => import('../pages/admin/UsersPage'));
const UserFormPage        = lazy(() => import('../pages/admin/UserFormPage'));
const AuditPage           = lazy(() => import('../pages/admin/AuditPage'));
const SystemHealthPage    = lazy(() => import('../pages/admin/SystemHealthPage'));
const AdminCVsPage        = lazy(() => import('../pages/admin/AdminCVsPage'));

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" />
  </div>
);

const S = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

export const router = createBrowserRouter([
  // Public
  {
    element: <PublicLayout />,
    children: [
      { path: '/',           element: <S><HomePage /></S> },
      { path: '/offers/:id', element: <S><OfferDetailPage /></S> },
    ],
  },

  // Auth
  {
    element: <AuthLayout />,
    children: [
      { path: '/login',    element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },

  // Google OAuth callback
  { path: '/auth/google/success', element: <S><GoogleCallbackPage /></S> },

  // Candidate
  {
    path: '/candidate',
    element: (
      <ProtectedRoute allowedRoles={['CANDIDATE']}>
        <CandidateLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true,          element: <S><CandidateDashboard /></S> },
      { path: 'cv',           element: <S><MyCVPage /></S> },
      { path: 'cv-generator', element: <S><CVGeneratorPage /></S> },
      { path: 'applications', element: <S><ApplicationsPage /></S> },
      { path: 'profile',      element: <S><CandidateProfilePage /></S> },
      { path: 'favorites',    element: <S><FavoritesPage /></S> },
      { path: 'cover-letters',element: <S><CoverLettersPage /></S> },
      { path: 'documents',    element: <S><DocumentsPage /></S> },
      { path: 'settings',     element: <S><SettingsPage /></S> },
      { path: 'offres',       element: <S><OffresPage /></S> },
      { path: 'offres/:id',   element: <S><OffreDetailPage /></S> },
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
      { index: true,    element: <S><AgentDashboard /></S> },
      { path: 'upload', element: <S><UploadCVPage /></S> },
      { path: 'batch',  element: <S><BatchUploadPage /></S> },
      { path: 'cvs',    element: <S><CVListPage /></S> },
      { path: 'history',element: <S><HistoryPage /></S> },
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
      { index: true,              element: <S><RHDashboard /></S> },
      { path: 'offers',           element: <S><OffersPage /></S> },
      { path: 'offers/new',       element: <S><OfferFormPage /></S> },
      { path: 'offers/:id/edit',  element: <S><OfferFormPage /></S> },
      { path: 'matching',         element: <S><MatchingPage /></S> },
      { path: 'results',          element: <S><ResultsPage /></S> },
      { path: 'cvtheque',         element: <S><CVthequePage /></S> },
      { path: 'candidatures',     element: <S><CandidaturesPage /></S> },
      { path: 'calendar',         element: <S><CalendarPage /></S> },
      { path: 'n8n-calendar',     element: <S><N8NCalendarPage /></S> },
      { path: 'stats',            element: <S><StatsPage /></S> },
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
      { index: true,         element: <S><AdminDashboard /></S> },
      { path: 'dashboard',   element: <S><AdminDashboard /></S> },
      { path: 'users',       element: <S><UsersPage /></S> },
      { path: 'users/new',   element: <S><UserFormPage /></S> },
      { path: 'audit',       element: <S><AuditPage /></S> },
      { path: 'system/health',element: <S><SystemHealthPage /></S> },
      { path: 'cvs',         element: <S><AdminCVsPage /></S> },
    ],
  },
]);
