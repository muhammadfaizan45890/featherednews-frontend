import React, { useEffect } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useLocation,
} from 'react-router-dom';

// ─── Public Pages ──────────────────────────────────────
import Home from './pages/Home';
import Signup from './pages/Signup';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import Verify from './pages/Verify';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOTP from './pages/VerifyOTP';
import ChangePassword from './pages/ChangePassword';
import AuthSuccess from './pages/AuthSuccess';
import NotFound from './pages/NotFound';
import News from './pages/News';
import PostDetail from './pages/PostDetail';
import About from './pages/About';

// ─── Components ──────────────────────────────────────
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// ─── User Pages ──────────────────────────────────────
import UserProfile from './pages/User/UserProfile';

// ─── Admin Layout & Pages ─────────────────────────────
import AdminLayout from './pages/Admin/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminProfile from './pages/Admin/AdminProfile';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminPosts from './pages/Admin/AdminPosts';
import Contact from './pages/Contact';
import AdminHero from './pages/Admin/AdminHero';
import AdminMessages from './pages/Admin/AdminMessages';
import Privacy from './pages/Privacy';
import WriteForUs from './pages/WriteForUs';
import Advertise from './pages/Advetise';
import AdminAdvertise from './pages/Admin/AdminAdvertise';


// ─── ScrollToTop ──────────────────────────────────────
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
};

// ─── Root Layout ──────────────────────────────────────
const RootLayout = () => {
  const location = useLocation();
  const path = location.pathname;

  const isAuthPage =
    path === '/signup' ||
    path === '/login' ||
    path === '/forgot-password' ||
    path === '/auth-success' ||
    path.startsWith('/verify') ||
    path.startsWith('/verify-otp') ||
    path.startsWith('/change-password');

  return (
    <>
      {!isAuthPage && <Navbar />}
      <ScrollToTop />
      <Outlet />
      {!isAuthPage && <Footer />}
    </>
  );
};

// ─── Router ────────────────────────────────────────────
const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // ── Public routes ──
      { path: '/', element: <Home /> },
      { path: '/verify', element: <VerifyEmail /> },
      { path: '/verify/:token', element: <Verify /> },
      { path: '/login', element: <Login /> },
      { path: '/signup', element: <Signup /> },
      { path: '/auth-success', element: <AuthSuccess /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      { path: '/verify-otp/:email', element: <VerifyOTP /> },
      { path: '/change-password/:email', element: <ChangePassword /> },
      { path: '/news', element: <News /> },
      { path: '/news/:slug', element: <PostDetail /> },
      { path: '/about', element: <About /> },
            { path: '/contact', element: <Contact /> },
                        { path: '/privacy', element: <Privacy /> },
          { path: '/write-for-us', element: <WriteForUs /> },
                    { path: '/advertise', element: <Advertise /> },




      // ── User routes (protected) ──
      {
        element: <ProtectedRoute requiredRole="user"><Outlet /></ProtectedRoute>,
        children: [
          { path: '/profile', element: <UserProfile /> },

        ],
      },

      // ── Admin routes (protected) ──
      {
        element: <ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>,
        children: [
          { path: '/admin/dashboard', element: <AdminDashboard /> },
          { path: '/admin/profile', element: <AdminProfile /> },
          { path: '/admin/users', element: <AdminUsers /> },
          { path: '/admin/create-posts', element: <AdminPosts /> },
          { path: '/admin/admin-hero', element: <AdminHero /> },
          { path: '/admin/admin-messages', element: <AdminMessages /> },
                    { path: '/admin/admin-advertise', element: <AdminAdvertise/> },


        ],
      },

      // ── 404 – catch‑all ──
      { path: '*', element: <NotFound /> },
    ],
  },
]);

// ─── App ───────────────────────────────────────────────
const App = () => {
  return <RouterProvider router={router} />;
};

export default App;