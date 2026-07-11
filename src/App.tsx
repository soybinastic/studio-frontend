import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppShell } from '@/components/layout/AppShell'
import { ThemeProvider } from '@/components/theme-provider'
import { HomePage } from '@/pages/HomePage'
import { JoinPage } from '@/pages/JoinPage'
import { StudioPage } from '@/pages/StudioPage'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/join/:sessionId" element={<JoinPage />} />
            <Route path="/studio/:sessionId" element={<StudioPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
        <Toaster richColors position="top-center" closeButton />
      </BrowserRouter>
    </ThemeProvider>
  )
}
