import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom' 

// --- LOGIKA MULTI-TENANT INJECTION ---
// 1. Cek URL
const params = new URLSearchParams(window.location.search);
const tenantId = params.get('id');

// 2. Simpan Tenant ID ke Storage
if (tenantId) {
  localStorage.setItem('dg_tenant_id', tenantId);
} 

// 3. (Opsional) Validasi: Jika tidak ada ID, user mungkin nyasar
if (!localStorage.getItem('dg_tenant_id')) {
  console.warn("⚠️ Mode Tanpa Tenant ID (Global Admin Only)");
}
// -------------------------------------

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)