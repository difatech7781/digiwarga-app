import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom' // <--- WAJIB IMPORT INI

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* BUNGKUS APP DENGAN BROWSER ROUTER */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)