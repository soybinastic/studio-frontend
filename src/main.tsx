import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { bootstrapTwitchOAuthFromLocation } from '@/lib/twitchOAuthPopup'

bootstrapTwitchOAuthFromLocation()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
