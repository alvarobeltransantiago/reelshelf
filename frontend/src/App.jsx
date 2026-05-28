import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'

import { useAuth } from './hooks/useAuth'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import PageWrapper from './components/layout/PageWrapper'
import Spinner from './components/common/Spinner'
import Home, { LibraryHome } from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import ReviewDetail from './pages/ReviewDetail'
import ReviewForm from './pages/ReviewForm'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'

function AppLayout() {
  return (
    <>
      <Header />
      <PageWrapper>
        <Outlet />
      </PageWrapper>
      <Footer />
    </>
  )
}

function ProtectedRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth()
  const location = useLocation()

  if (isBootstrapping) {
    return <Spinner label="Preparando sesión" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

function GuestRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return <Spinner label="Preparando sesión" />
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="/u/:username" element={<Profile />} />
        <Route path="/review/:id" element={<ReviewDetail />} />

        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/library" element={<LibraryHome />} />
          <Route path="/review/new" element={<ReviewForm />} />
          <Route path="/review/:id/edit" element={<ReviewForm />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
