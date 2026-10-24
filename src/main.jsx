import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// iOS Safari ignores user-scalable=no; its proprietary gesture events are the
// reliable way to stop pinch zoom. touch-action: none (index.css) covers the rest.
document.addEventListener('gesturestart', (event) => event.preventDefault())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
