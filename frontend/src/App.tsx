import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { theme } from './theme'
import AppLayout from './layout/AppLayout'
import { ToastProvider } from './components/PageHeader'
import ServicesPage from './pages/ServicesPage'
import ServiceDetailPage from './pages/ServiceDetailPage'
import SourcesPage from './pages/SourcesPage'
import RulesPage from './pages/RulesPage'
import ActionsPage from './pages/ActionsPage'
import LabelsPage from './pages/LabelsPage'
import PrayPage from './pages/PrayPage'

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/services" replace />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/services/:id" element={<ServiceDetailPage />} />
              <Route path="/sources" element={<SourcesPage />} />
              <Route path="/rules" element={<RulesPage />} />
              <Route path="/actions" element={<ActionsPage />} />
              <Route path="/labels" element={<LabelsPage />} />
              <Route path="/pray" element={<PrayPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  )
}
