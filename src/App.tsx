import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import { LoginScreen } from './components/LoginScreen'
import { DashboardLayout } from './components/DashboardLayout'

function AppShell() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="dashboard-bg flex min-h-screen items-center justify-center text-slate-300">
        Initializing...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginScreen />
  }

  return <DashboardLayout />
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </AuthProvider>
  )
}

export default App
