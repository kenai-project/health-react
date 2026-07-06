import { createBrowserRouter, Navigate } from 'react-router';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import RecordsPage from './pages/RecordsPage';
import UserManagementPage from './pages/UserManagementPage';
import ProfilePage from './pages/ProfilePage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import StaffRecordsPage from './pages/StaffRecordsPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';

export const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: <AuthLayout />,
      children: [{ index: true, element: <LoginPage /> }],
    },
    {
      path: '/register',
      element: <AuthLayout />,
      children: [{ index: true, element: <RegisterPage /> }],
    },

    {
      path: '/',
      element: (
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <Navigate to="/home" replace /> },
        { path: 'home', element: <HomePage /> },
        { path: 'dashboard', element: <DashboardPage /> },
        { path: 'records', element: <RecordsPage /> },
        { path: 'analytics', element: <AnalyticsPage /> },
        { path: 'profile', element: <ProfilePage /> },
        { path: 'settings', element: <SettingsPage /> },
        { path: 'admin/users', element: <UserManagementPage /> },
        { path: 'staff/records', element: <StaffRecordsPage /> },
      ],
    },
    {
      path: '*',
      element: <NotFoundPage />,
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  },
);

