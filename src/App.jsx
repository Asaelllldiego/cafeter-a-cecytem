import React, { Suspense, lazy, useEffect } from 'react';
import { initTheme } from '@/lib/theme';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { TeacherAreaProvider } from '@/lib/TeacherAreaContext';
// Add page imports here

const Home = lazy(() => import('@/pages/Home'));
const Orders = lazy(() => import('@/pages/Orders'));
const Promotions = lazy(() => import('@/pages/Promotions'));
const Admin = lazy(() => import('@/pages/Admin'));
const Faq = lazy(() => import('@/pages/Faq'));
const Perfil = lazy(() => import('@/pages/Perfil'));
const Reportes = lazy(() => import('@/pages/Reportes'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const TeacherArea = lazy(() => import('@/pages/TeacherArea'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));

const FullScreenLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return <FullScreenLoader />;
  }

  // Handle authentication errors
  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  // Render the main app
  return (
    <TeacherAreaProvider>
      <Suspense fallback={<FullScreenLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/pedidos" element={<Orders />} />
              <Route path="/promociones" element={<Promotions />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/faq" element={<Faq />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/admin/reportes" element={<Reportes />} />
              <Route path="/profesores" element={<TeacherArea />} />
              <Route path="/producto/:id" element={<ProductDetail />} />
            </Route>
          </Route>
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Suspense>
    </TeacherAreaProvider>
  );
};


function App() {
  useEffect(() => { initTheme(); }, []);
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App