import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

// IMPORT KOMPONEN BRANDING
import BrandHeader from '../components/BrandHeader'
import VendorFooter from '../components/VendorFooter'

export default function Register() {
  const navigate = useNavigate()
  const apiUrl = localStorage.getItem('dg_api_url')
  
  const [formData, setFormData] = useState({
    name: '', phone: '', password: '', rt_code: '' 
  })
  
  const [loading, setLoading] = useState(false)
  const [statusModal, setStatusModal] = useState({ show: false, type: 'success', title: '', message: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'register', payload: formData })
      })
      const json = await res.json()
      
      if (json.status === 'success') {
        setStatusModal({ show: true, type: 'success', title: 'Registrasi Berhasil!', message: json.message })
      } else {
        setStatusModal({ show: true, type: 'error', title: 'Gagal Daftar', message: json.message })
      }
    } catch (err) {
      setStatusModal({ show: true, type: 'error', title: 'Error', message: 'Koneksi bermasalah.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-blue-600 flex flex-col justify-center items-center p-6">
      
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-auto animate-fade-in-up z-10">
        
        {/* 1. HEADER */}
        <BrandHeader theme="light" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="text-xs font-bold text-gray-500">Nama Lengkap</label><input type="text" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Sesuai KTP"/></div>
          <div><label className="text-xs font-bold text-gray-500">No. HP / WA</label><input type="number" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="08xxx"/></div>
          <div><label className="text-xs font-bold text-gray-500">Password</label><input type="password" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••"/></div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition flex justify-center gap-2 mt-2">
            {loading ? <Loader2 className="animate-spin"/> : "Buat Akun"}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-400 mb-2">Sudah punya akun?</p>
          <Link to="/login" className="text-sm text-blue-600 font-bold hover:underline">Login disini</Link>
          <br/>
          <span className="text-[10px] text-gray-400 mt-2 block">Atau hubungi Pak RT jika terkendala.</span>
        </div>
      </div>

      {/* 2. FOOTER */}
      <div className="mt-6 z-0">
        <VendorFooter theme="dark" />
      </div>

      {/* MODAL STATUS */}
      {statusModal.show && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-6 ${statusModal.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
              {statusModal.type === 'success' ? <CheckCircle className="h-8 w-8 text-green-600"/> : <XCircle className="h-8 w-8 text-red-600"/>}
            </div>
            <h3 className="text-xl font-bold mb-2">{statusModal.title}</h3>
            <p className="text-sm text-gray-500 mb-6">{statusModal.message}</p>
            <button onClick={() => { setStatusModal({...statusModal, show:false}); if(statusModal.type==='success') navigate('/login') }} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold shadow-lg">
              {statusModal.type === 'success' ? 'Ke Menu Login' : 'Coba Lagi'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}