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
import GoogleCallbackPage from '../pages/auth/GoogleCallbackPage';

// Candidate pages
import CandidateDashboard from '../pages/candidate/DashboardPage';
import MyCVPage from '../pages/candidate/MyCVPage';
import ApplicationsPage from '../pages/candidate/ApplicationsPage';
import CandidateProfilePage from '../pages/candidate/ProfilePage';
import CoverLettersPage from '../pages/candidate/CoverLettersPage';
import DocumentsPage from '../pages/candidate/DocumentsPage';
import SettingsPage from '../pages/candidate/SettingsPage';
import FavoritesPage from '../pages/candidate/FavoritesPage';
import CVGeneratorPage from '../pages/candidate/CVGeneratorPage';
import OffresPage from '../pages/candidate/OffresPage';
import OffreDetailPage from '../pages/candidate/OffreDetailPage';

// Agent pages
import AgentDashboard from '../pages/agent/DashboardPage';
import UploadCVPage from '../pages/agent/UploadCVPage';
import CVListPage from '../pages/agent/CVListPage';
import BatchUploadPage from '../pages/agent/BatchUploadPage';
import HistoryPage from '../pages/agent/HistoryPage';

// RH pages
import RHDashboard from '../pages/rh/DashboardPage';
import OffersPage from '../pages/rh/OffersPage';
import OfferFormPage from '../pages/rh/OfferFormPage';
import MatchingPage from '../pages/rh/MatchingPage';
import ResultsPage from '../pages/rh/ResultsPage';
import CVthequePage from '../pages/rh/CVthequePage';
import CandidaturesPage from '../pages/rh/CandidaturesPage';
import CalendarPage from '../pages/rh/CalendarPage';

// Admin pages
import AdminDashboard from '../pages/admin/DashboardPage';
import UsersPage from '../pages/admin/UsersPage';
import UserFormPage from '../pages/admin/UserFormPage';
import AuditPage from '../pages/admin/AuditPage';
import SystemHealthPage from '../pages/admin/SystemHealthPage';
import AdminCVsPage from '../pages/admin/AdminCVsPage';

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

  // Google OAuth callback (pas de layout, pas de protection)
  { path: '/auth/google/success', element: <GoogleCallbackPage /> },

  // Candidate
  {
    path: '/candidate',
    element: (
      <ProtectedRoute allowedRoles={['CANDIDATE']}>
        <CandidateLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true,                 element: <CandidateDashboard /> },
      { path: 'cv',                  element: <MyCVPage /> },
      { path: 'cv-generator',        element: <CVGeneratorPage /> },
      { path: 'applications',        element: <ApplicationsPage /> },
      { path: 'profile',             element: <CandidateProfilePage /> },
      { path: 'favorites',           element: <FavoritesPage /> },
      { path: 'cover-letters',       element: <CoverLettersPage /> },
      { path: 'documents',           element: <DocumentsPage /> },
      { path: 'settings',            element: <SettingsPage /> },
      { path: 'offres',              element: <OffresPage /> },
      { path: 'offres/:id',          element: <OffreDetailPage /> },
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
      { index: true,      element: <AgentDashboard /> },
      { path: 'upload',   element: <UploadCVPage /> },
      { path: 'batch',    element: <BatchUploadPage /> },
      { path: 'cvs',      element: <CVListPage /> },
      { path: 'history',  element: <HistoryPage /> },
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
      { index: true,                element: <RHDashboard /> },
      { path: 'offers',             element: <OffersPage /> },
      { path: 'offers/new',         element: <OfferFormPage /> },
      { path: 'offers/:id/edit',    element: <OfferFormPage /> },
      { path: 'matching',           element: <MatchingPage /> },
      { path: 'results',            element: <ResultsPage /> },
      { path: 'cvtheque',           element: <CVthequePage /> },
      { path: 'candidatures',       element: <CandidaturesPage /> },
      { path: 'calendar',           element: <CalendarPage /> },
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
      { index: true,              element: <AdminDashboard /> },
      { path: 'dashboard',        element: <AdminDashboard /> },
      { path: 'users',            element: <UsersPage /> },
      { path: 'users/new',        element: <UserFormPage /> },
      { path: 'audit',            element: <AuditPage /> },
      { path: 'system/health',    element: <SystemHealthPage /> },
      { path: 'cvs',              element: <AdminCVsPage /> },
    ],
  },
]);
