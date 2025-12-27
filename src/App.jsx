import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom'

// --- 1. IMPORT HALAMAN ---
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'
import CitizenReport from './pages/CitizenReport'
import Payment from './pages/Payment'
import RequestLetter from './pages/RequestLetter'
import Landing from './pages/Landing'
import Market from './pages/Market'

// --- NEW MODULES ---
import Polling from './pages/Polling'
import Inventory from './pages/Inventory'
import Ronda from './pages/Ronda'
import Directory from './pages/Directory'
import GuestBook from './pages/GuestBook'

// --- ROOT HANDLER (Redirect Logic) ---
function RootHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Tangkap Tenant ID dari URL
    const tenantId = searchParams.get('rt') || searchParams.get('id');
    if (tenantId) {
      localStorage.setItem('dg_tenant_id', tenantId);
    }

    // Cek Login
    const user = JSON.parse(localStorage.getItem('dg_user') || '{}');
    if (user.id) {
        navigate('/dashboard', { replace: true });
    } else {
        // Jika belum login, arahkan ke Landing Page dulu (Public Facade)
        navigate('/', { replace: true });
    }
  }, [navigate, searchParams]);

  return null;
}

function App() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // [FIX] GLOBAL TENANT CAPTURE
    const tenantId = searchParams.get('id') || searchParams.get('rt');
    if (tenantId) {
      console.log("🔒 Global Tenant Set:", tenantId);
      localStorage.setItem('dg_tenant_id', tenantId);
    }

    // Setup API URL Default
    const MY_API_URL = 'https://script.google.com/macros/s/AKfycbyU7yV_-HrrCumNUJR2azZKdy4xKykKZaygPdzH7Z4sXRvRZtK9zUKXgHQ7bAh9JL344w/exec' 
    if (!localStorage.getItem('dg_api_url')) {
      localStorage.setItem('dg_api_url', MY_API_URL)
    }
  }, [searchParams])

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth-check" element={<RootHandler />} />

      {/* PUBLIC */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* PRIVATE (DASHBOARD) */}
      <Route path="/dashboard" element={<Dashboard />} />
      
      {/* CORE FEATURES */}
      <Route path="/bayar" element={<Payment />} />
      <Route path="/surat" element={<RequestLetter />} />
      <Route path="/lapor" element={<CitizenReport />} />
      <Route path="/admin" element={<AdminPanel />} />

      {/* SUPER APP FEATURES */}
      <Route path="/market" element={<Market />} />
      <Route path="/vote" element={<Polling />} />
      <Route path="/aset" element={<Inventory />} />
      <Route path="/ronda" element={<Ronda />} />
      <Route path="/tamu" element={<GuestBook />} />
      <Route path="/info" element={<Directory />} />
    </Routes>
  )
}

export default App