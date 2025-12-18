import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'

// --- 1. IMPORT SEMUA HALAMAN ---
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'
import CitizenReport from './pages/CitizenReport'

// --- FIX: IMPORT FITUR WARGA (Sesuai nama file asli) ---
import Payment from './pages/Payment'             // <--- File: src/pages/Payment.jsx
import RequestLetter from './pages/RequestLetter' // <--- File: src/pages/RequestLetter.jsx

function App() {
  const navigate = useNavigate()

  // Setup URL API sekali di awal
  useEffect(() => {
    // ⚠️ Gunakan URL Deployment Terbaru (v5.2)
    const MY_API_URL = 'https://script.google.com/macros/s/AKfycbxojXTmr0lZP2lZLWflEtqz-Xcclp1uP95aQbvA_k-iOh5UlCHsHLfiJob5DyHoyiH9/exec' 
    
    // Simpan ke localStorage jika belum ada
    if (!localStorage.getItem('dg_api_url')) {
      localStorage.setItem('dg_api_url', MY_API_URL)
    }
  }, [])

  return (
    <Routes>
      {/* Route Default: Lempar ke Login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* --- DAFTAR RUTE UTAMA --- */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin" element={<AdminPanel />} />
      
      {/* --- RUTE FITUR WARGA --- */}
      <Route path="/pay" element={<Payment />} />
      <Route path="/request-letter" element={<RequestLetter />} />
      <Route path="/citizen-report" element={<CitizenReport />} />
    </Routes>
  )
}

export default App