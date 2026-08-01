import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppShell } from '@/components/layout/AppShell'
import { ThemeProvider } from '@/components/theme-provider'
import { StudioHeaderControlsProvider } from '@/context/StudioHeaderControlsProvider'
import { DestinationOutputsProvider } from '@/context/DestinationOutputsProvider'
import { TenantProvider } from '@/context/TenantProvider'
import { HomePage } from '@/pages/HomePage'
import { JoinPage } from '@/pages/JoinPage'
import { StudioPage } from '@/pages/StudioPage'
import { TwitchOAuthCompletePage } from '@/pages/TwitchOAuthCompletePage'

export default function App() {
  return (
    <ThemeProvider>
      <TenantProvider>
        <StudioHeaderControlsProvider>
          <BrowserRouter>
            <DestinationOutputsProvider>
              <AppShell>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/join/:sessionId" element={<JoinPage />} />
                  <Route path="/studio/:sessionId" element={<StudioPage />} />
                  <Route path="/oauth/twitch/complete" element={<TwitchOAuthCompletePage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppShell>
              <Toaster richColors position="top-center" closeButton />
            </DestinationOutputsProvider>
          </BrowserRouter>
        </StudioHeaderControlsProvider>
      </TenantProvider>
    </ThemeProvider>
  )
}
