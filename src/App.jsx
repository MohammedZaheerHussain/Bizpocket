import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { ToastProvider } from './hooks/useToast';
import { AppShell, AuthLayout } from './components/layout/AppShell';
import { ErrorBoundary, OfflineBanner } from './components/ui/ErrorBoundary';
import { IOSInstallPrompt } from './components/ui/IOSInstallPrompt';
import { useOnlineStatus } from './hooks/useUtils';

// Pages
import Auth from './pages/Auth';
import AuthCallback from './pages/AuthCallback';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Scan from './pages/Scan';
import History from './pages/History';
import ScanDetail from './pages/ScanDetail';
import Settings from './pages/Settings';
import PasswordVault from './pages/PasswordVault';

function AppContent() {
  const isOnline = useOnlineStatus();

  return (
    <>
      {!isOnline && <OfflineBanner />}
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/auth" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* Reset password - accessible with or without auth */}
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Auth callback for email verification */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected routes */}
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/scan/:id" element={<ScanDetail />} />
          <Route path="/history" element={<History />} />
          <Route path="/password-vault" element={<PasswordVault />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <IOSInstallPrompt />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
