import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, XCircle, Phone, ArrowLeft, Building, Search, LogIn } from 'lucide-react'

// IMPORT COMPONENTS
import BrandHeader from '../components/BrandHeader'
import VendorFooter from '../components/VendorFooter'

export default function Login() {
  const navigate = useNavigate()
  
  // STATE LOGIN
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // STATE MODAL ERROR (Agar UI Konsisten)
  const [statusModal, setStatusModal] = useState({ show: false, type: 'error', title: '', message: '' })

  // STATE KHUSUS: Untuk Input Manual ID RT (Jalur Global Landing)
  const [manualId, setManualId] = useState('')
  const [tenantId, setTenantId] = useState(localStorage.getItem('dg_tenant_id'))

  // CONFIG & API
  const apiUrl = localStorage.getItem('dg_api_url')
  const savedConfig = JSON.parse(localStorage.getItem('dg_config') || '{}');
  const waAdmin = savedConfig.WA_ADMIN || ''; 

  // ============================================================
  // BAGIAN 1: PENGECUALIAN (JIKA ID RT BELUM ADA)
  // Tampil jika user klik "Masuk" dari Lobi Utama
  // ============================================================
  if (!tenantId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white w-full max-w-sm p-8 rounded-[30px] shadow-xl text-center border border-gray-100">
          
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
            <Building className="w-7 h-7"/>
          </div>
          
          <h2 className="text-xl font-black text-gray-800 mb-2 tracking-tight">Masuk Lingkungan</h2>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed px-4">
            Anda masuk lewat jalur umum. Silakan masukkan <b>Kode ID RT</b> Anda (contoh: <code>rt02-melati</code>) untuk melanjutkan.
          </p>
          
          <div className="relative group mb-4">
             <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition"/>
             </div>
             <input 
                type="text" 
                placeholder="Ketik Kode RT..." 
                className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-bold text-gray-700 text-center transition"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && manualId) {
                        const id = manualId.trim();
                        localStorage.setItem('dg_tenant_id', id);
                        setTenantId(id);
                    }
                }}
             />
          </div>

          <button 
            disabled={!manualId}
            onClick={() => {
                const id = manualId.trim();
                localStorage.setItem('dg_tenant_id', id);
                setTenantId(id);
            }}
            className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 shadow-lg shadow-blue-200 active:scale-95"
          >
            Lanjut ke Login
          </button>

          <button onClick={() => navigate('/')} className="mt-8 text-[10px] text-gray-400 font-bold hover:text-gray-600 flex items-center justify-center gap-1 transition">
             <ArrowLeft className="w-3 h-3"/> Kembali ke Pencarian
          </button>
        </div>
        
        <div className="mt-8 opacity-50">
           <VendorFooter theme="light" />
        </div>
      </div>
    )
  }

  // ============================================================
  // BAGIAN 2: FORM LOGIN UTAMA (JIKA ID RT SUDAH ADA)
  // ============================================================
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'login',
          payload: { ...form, tenant_id: tenantId }
        })
      })
      const json = await res.json()
      if (json.status === 'success') {
        localStorage.setItem('dg_token', json.token)
        localStorage.setItem('dg_user', JSON.stringify(json.data))
        if(json.config) localStorage.setItem('dg_config', JSON.stringify(json.config))
        navigate('/dashboard')
      } else {
        setStatusModal({ show: true, type: 'error', title: 'Gagal Masuk', message: json.message })
      }
    } catch (err) {
      setStatusModal({ show: true, type: 'error', title: 'Koneksi Gagal', message: 'Tidak dapat terhubung ke server.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-72 h-72 bg-purple-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

      <div className="w-full max-w-sm bg-white rounded-[35px] shadow-2xl overflow-hidden relative z-10">
        
        {/* HEADER */}
        <div className="bg-white p-6 pb-2">
            <BrandHeader theme="light" />
            <div className="mt-4 flex items-center justify-center gap-2 bg-gray-50 py-1.5 rounded-lg border border-gray-100">
               <Building className="w-3 h-3 text-gray-400"/>
               <span className="text-[10px] font-mono text-gray-500 font-bold uppercase tracking-wider">ID: {tenantId}</span>
            </div>
        </div>

        {/* FORM */}
        <div className="px-8 pb-8 pt-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Selamat Datang</h2>
            <p className="text-xs text-gray-400 mt-1">Silakan masuk untuk akses layanan warga.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Username */}
            <div className="group">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1 group-focus-within:text-blue-600 transition">No. HP / Username</label>
              <input 
                type="text" 
                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition font-bold text-gray-700 text-sm"
                value={form.username}
                onChange={(e) => setForm({...form, username: e.target.value})}
                placeholder="0812..."
                required
              />
            </div>

            {/* Password */}
            <div className="group">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1 group-focus-within:text-blue-600 transition">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition font-bold text-gray-700 text-sm pr-10"
                  value={form.password}
                  onChange={(e) => setForm({...form, password: e.target.value})}
                  placeholder="••••••"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 active:scale-95 transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button 
              disabled={loading} 
              className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition active:scale-95 flex justify-center items-center gap-2 shadow-lg shadow-gray-200 mt-6 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <><LogIn className="w-4 h-4"/> Masuk Sekarang</>}
            </button>
          </form>

          {/* Footer Actions */}
          <div className="mt-8 text-center space-y-4">
            <button onClick={() => navigate('/register')} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition">
                Daftar Warga Baru
            </button>
            
            <div className="pt-4 border-t border-dashed border-gray-200 flex justify-between items-center">
                <button onClick={() => {
                    localStorage.removeItem('dg_tenant_id');
                    setTenantId(null);
                }} className="text-[10px] text-red-400 hover:text-red-600 font-bold transition flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3"/> Ganti ID RT
                </button>

                {waAdmin && (
                    <a href={`https://wa.me/${waAdmin}`} target="_blank" rel="noreferrer" className="text-[10px] text-gray-400 hover:text-green-600 font-bold transition flex items-center gap-1">
                        <Phone className="w-3 h-3"/> Hubungi Admin
                    </a>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-8 absolute bottom-4 w-full text-center pointer-events-none">
         <div className="pointer-events-auto inline-block">
            <VendorFooter theme="light" />
         </div>
      </div>

      {/* MODAL ERROR STATUS */}
      {statusModal.show && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[30px] shadow-2xl w-full max-w-xs p-6 text-center animate-scale-up">
            <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full mb-4 bg-red-100">
              <XCircle className="h-8 w-8 text-red-600"/>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{statusModal.title}</h3>
            <p className="text-xs text-gray-500 mb-6 px-2 leading-relaxed">{statusModal.message}</p>
            <button 
              onClick={() => setStatusModal({ ...statusModal, show: false })}
              className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}
    </div>
  )
}