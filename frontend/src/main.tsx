import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './shared/contexts/AuthContext'
import { authService } from './shared/services/authService'

// Initialize auth token if it exists
const token = authService.getToken();
if (token) {
  authService.setToken(token);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
