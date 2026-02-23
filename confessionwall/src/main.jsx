import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthProvider } from './AuthContext'
import App from './App.jsx'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

if (!GOOGLE_CLIENT_ID) {
  throw new Error('Add your Google OAuth Client ID to the .env file as VITE_GOOGLE_CLIENT_ID')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </AuthProvider>
  </StrictMode>,
)
