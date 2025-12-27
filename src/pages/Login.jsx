import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Loader2, XCircle, Phone, ArrowLeft } from 'lucide-react'

// IMPORT COMPONENTS
import BrandHeader from '../components/BrandHeader'
import VendorFooter from '../components/VendorFooter'

export default function Login() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  
  const apiUrl = localStorage.getItem('dg_api_url')
  const savedConfig = JSON.parse(localStorage.getItem('dg_config') || '{}');
  const waAdmin = savedConfig.WA_ADMIN || ''; 

  const [statusModal, setStatusModal] = useState({ show: false, type: 'error', title: '', message: '' })

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('dg_user') || '{}');
    if (user.id) navigate('/dashboard');
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault()
    
    // Validasi Tenant
    const activeTenantId = localStorage.getItem('dg_tenant_id');
    if (!activeTenantId && !phone.startsWith('08')) { 
       // Fallback logic jika tenant hilang tapi user login
    }

    if (!activeTenantId) {
       setStatusModal({ show: true, type: 'error', title: 'Kode RT Hilang', message: 'Silakan scan ulang QR Code RT Anda.' })
       return
    }

    setLoading(true)
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'login',
          payload: { 
            phone, 
            password,
            tenant_id: activeTenantId 
          }
        })
      })

      const json = await res.json()
      
      if (json.status === 'success') {
        localStorage.setItem('dg_user', JSON.stringify(json.data))
        localStorage.setItem('dg_token', json.token)
        localStorage.setItem('dg_config', JSON.stringify(json.config || {}))
        localStorage.setItem('dg_rbac', JSON.stringify(json.rbac_config || {}))
        navigate('/dashboard')
      } else {
        setStatusModal({ show: true, type: 'error', title: 'Gagal Masuk', message: json.message || 'Cek No HP & Password.' })
      }
    } catch (err) {
      setStatusModal({ show: true, type: 'error', title: 'Koneksi Error', message: 'Gagal menghubungi server.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1877F2] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* TOMBOL KEMBALI KE LANDING */}
      <button 
        onClick={() => navigate('/')} 
        className="absolute top-6 left-6 text-white/80 hover:text-white flex items-center gap-2 z-20"
      >
        <ArrowLeft className="w-5 h-5"/> <span className="text-sm font-bold">Beranda</span>
      </button>

      {/* BACKGROUND DECOR */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-blue-400 opacity-20 rounded-full blur-3xl pointer-events-none"></div>

      {/* LOGIN CARD (MODAL STYLE) */}
      <div className="bg-white rounded-[30px] shadow-2xl w-full max-w-sm overflow-hidden relative z-10 animate-scale-up">
        <div className="p-8">
          
          <div className="mb-6">
             <BrandHeader theme="card" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
             <div className="space-y-1">
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">No. Handphone</label>
               <input 
                 type="number" 
                 value={phone}
                 onChange={(e) => setPhone(e.target.value)}
                 className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-lg rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none transition-all font-bold placeholder:text-gray-300" 
                 placeholder="08xxxxxxxxxx" 
                 required 
               />
             </div>

             <div className="space-y-1">
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Kata Sandi</label>
               <div className="relative">
                 <input 
                   type={showPassword ? "text" : "password"} 
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-lg rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3 pr-12 outline-none transition-all font-bold placeholder:text-gray-300" 
                   placeholder="••••••" 
                   required 
                 />
                 <button 
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
                   className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-blue-600"
                 >
                   {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                 </button>
               </div>
             </div>

             <button 
               type="submit" 
               disabled={loading}
               className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-bold rounded-xl text-lg px-5 py-3.5 text-center transition-all shadow-lg active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2 mt-4"
             >
               {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Masuk"}
             </button>
          </form>

          <div className="mt-6 text-center space-y-3 border-t border-gray-100 pt-4">
            <Link to="/register" className="text-sm font-bold text-blue-600 hover:underline block">
              Daftar Warga Baru
            </Link>
            
            {/* WA LINK FIX */}
            <a 
               href={waAdmin ? `https://wa.me/${waAdmin}?text=Halo%20Pak%20RT,%20saya%20lupa%20password%20DigiWarga.` : '#'} 
               target="_blank"
               rel="noreferrer"
               className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-green-600 transition-colors cursor-pointer"
            >
               <Phone className="w-3 h-3"/> Hubungi Pak RT
            </a>
          </div>

        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-8">
         <VendorFooter theme="blue_solid" />
      </div>

      {/* MODAL ERROR STATUS */}
      {statusModal.show && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[30px] shadow-2xl w-full max-w-xs p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full mb-4 bg-red-100">
              <XCircle className="h-8 w-8 text-red-600"/>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{statusModal.title}</h3>
            <p className="text-xs text-gray-500 mb-6 px-2">{statusModal.message}</p>
            <button 
              onClick={() => setStatusModal({ ...statusModal, show: false })}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition text-sm"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

    </div>
  )
}