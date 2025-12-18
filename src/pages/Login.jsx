import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Loader2, XCircle } from 'lucide-react'

// IMPORT KOMPONEN BRANDING
import BrandHeader from '../components/BrandHeader'
import VendorFooter from '../components/VendorFooter'

export default function Login() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const apiUrl = localStorage.getItem('dg_api_url')

  const [statusModal, setStatusModal] = useState({ show: false, type: 'error', title: '', message: '' })

  const handleLogin = async (e) => {
    e.preventDefault()
    
    if (!apiUrl) {
      setStatusModal({ show: true, type: 'error', title: 'System Error', message: 'URL Server belum disetting!' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'login',
          payload: { phone, password }
        })
      })

      const json = await res.json()
      
      if (json.status === 'success') {
        localStorage.setItem('dg_token', json.token)
        localStorage.setItem('dg_user', JSON.stringify(json.data))
        if(json.rbac_config) localStorage.setItem('dg_rbac', JSON.stringify(json.rbac_config))
        navigate('/dashboard')
      } else {
        setStatusModal({ show: true, type: 'error', title: 'Gagal Masuk', message: json.message || 'Cek No HP & Password' })
      }
    } catch (err) {
      setStatusModal({ show: true, type: 'error', title: 'Error Koneksi', message: 'Gagal menghubungi server.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-blue-600 flex flex-col items-center justify-center p-6 relative">
      
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden p-8 animate-fade-in-up z-10">
        
        {/* 1. HEADER (Theme Light karena background putih) */}
        <BrandHeader theme="light" />

        <form onSubmit={handleLogin} className="space-y-5">
           <div><label className="text-xs font-bold text-gray-500">No. HP / WA</label><input type="text" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxx"/></div>
           <div className="relative">
             <label className="text-xs font-bold text-gray-500">Password</label>
             <input type={showPassword ? "text" : "password"} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••"/>
             <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-8 text-gray-400">{showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}</button>
           </div>
           <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/30 transition transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
             {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Masuk Sekarang"}
           </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">Belum punya akun?</p>
          <Link to="/register" className="text-blue-600 font-bold hover:underline">Daftar Warga Baru</Link>
          <p className="text-[12px] text-gray-500 mt-2">Atau hubungi Pak RT.</p>
        </div>
      </div>

      {/* 2. FOOTER (Theme Dark karena background biru) */}
      <div className="mt-8 z-0">
        <VendorFooter theme="dark" />
      </div>

      {/* MODAL STATUS */}
      {statusModal.show && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-6 bg-red-100">
              <XCircle className="h-8 w-8 text-red-600"/>
            </div>
            <h3 className="text-xl font-bold mb-2">{statusModal.title}</h3>
            <p className="text-sm text-gray-500 mb-6">{statusModal.message}</p>
            <button onClick={() => setStatusModal({...statusModal, show:false})} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold shadow-lg">Coba Lagi</button>
          </div>
        </div>
      )}
    </div>
  )
}