import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './hooks/useApp'
import Navbar from './components/Navbar'
import Toasts from './components/Toasts'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import CatalogPage from './pages/CatalogPage'
import CarDetailPage from './pages/CarDetailPage'
import CabinetPage from './pages/CabinetPage'
import ManagerPage from './pages/ManagerPage'
import AdminPage from './pages/AdminPage'
import type { Role } from './types'

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const { user, role } = useApp()
  if (!user) return <Navigate to="/auth" replace />
  if (roles && !roles.includes(role)) return <Navigate to="/" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/car/:id" element={<CarDetailPage />} />
        <Route path="/cabinet" element={<ProtectedRoute roles={['client', 'manager', 'admin']}><CabinetPage /></ProtectedRoute>} />
        <Route path="/manager" element={<ProtectedRoute roles={['manager']}><ManagerPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toasts />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  )
}
