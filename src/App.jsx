import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom'

// --- PAGES ---
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'
import CitizenReport from './pages/CitizenReport'
import Payment from './pages/Payment'
import RequestLetter from './pages/RequestLetter'
import Landing from './pages/Landing'
import Market from './pages/Market'
import Polling from './pages/Polling'
import Inventory from './pages/Inventory'
import Ronda from './pages/Ronda'
import Directory from './pages/Directory'
import GuestBook from './pages/GuestBook'
import CCTV from './pages/CCTV'
import GlobalLanding from './pages/GlobalLanding' 
import CreateTenant from './pages/CreateTenant'

// --- ROOT DISPATCHER (Logika Pemilih Halaman Depan) ---
const RootRoute = () => {
  const [searchParams] = useSearchParams();
  // Cek apakah ada ID di URL (misal: ?id=rt02 atau ?rt=rt02)
  const hasId = searchParams.get('id') || searchParams.get('rt');
  
  // LOGIKA: Jika ada ID -> Landing Page RT. Jika TIDAK -> Global Search.
  return hasId ? <Landing /> : <GlobalLanding />;
}

// --- AUTH GUARD ---
const RootHandler = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem('dg_token');
    if (token) navigate('/dashboard'); else navigate('/login');
  }, [navigate]);
  return <div className="p-10 text-center text-gray-500 text-sm">Checking Access...</div>;
};

function App() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // 1. Simpan Tenant ID jika ada di URL
    const tenantId = searchParams.get('id') || searchParams.get('rt');
    if (tenantId) {
       localStorage.setItem('dg_tenant_id', tenantId);
    } 
    
    // 2. Set API URL (Pastikan URL ini adalah versi DEPLOY TERBARU Anda)
    const MY_API_URL = 'https://script.google.com/macros/s/AKfycbyU7yV_-HrrCumNUJR2azZKdy4xKykKZaygPdzH7Z4sXRvRZtK9zUKXgHQ7bAh9JL344w/exec' 
    if (!localStorage.getItem('dg_api_url')) localStorage.setItem('dg_api_url', MY_API_URL)
  }, [searchParams])

  return (
    <Routes>
      {/* ROOT: Dinamis (Global Landing vs Tenant Landing) */}
      <Route path="/" element={<RootRoute />} /> 
      
      {/* AUTH CHECKER */}
      <Route path="/auth-check" element={<RootHandler />} />

      {/* PUBLIC ROUTES */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/create-rt" element={<CreateTenant />} />
      
      {/* PRIVATE DASHBOARD */}
      <Route path="/dashboard" element={<Dashboard />} />
      
      {/* CORE FEATURES */}
      <Route path="/bayar" element={<Payment />} />
      <Route path="/surat" element={<RequestLetter />} />
      <Route path="/lapor" element={<CitizenReport />} />
      <Route path="/admin" element={<AdminPanel />} />

      {/* SUPER APP MODULES */}
      <Route path="/market" element={<Market />} />
      <Route path="/vote" element={<Polling />} />
      <Route path="/aset" element={<Inventory />} />
      <Route path="/ronda" element={<Ronda />} />
      <Route path="/tamu" element={<GuestBook />} />
      <Route path="/info" element={<Directory />} />
      <Route path="/cctv" element={<CCTV />} />
    </Routes>
  )
}

export default App