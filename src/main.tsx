import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { bootstrapCmsAuthFromLocation } from '@/lib/cmsAuth'
import { bootstrapTwitchOAuthFromLocation } from '@/lib/twitchOAuthPopup'

bootstrapCmsAuthFromLocation()
bootstrapTwitchOAuthFromLocation()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
