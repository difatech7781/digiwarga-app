import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building, MapPin, Phone, Lock, ArrowLeft, Loader2 } from 'lucide-react'

export default function CreateTenant() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ rt_name: '', city: '', area: '', owner_phone: '', password: '' })
  const [loading, setLoading] = useState(false)

  const apiUrl = localStorage.getItem('dg_api_url')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'create_tenant', // Panggil fungsi SaaS Backend
          payload: form
        })
      })
      const json = await res.json()
      if (json.status === 'success') {
        alert(`Selamat! Lingkungan ${json.data.rt_name} berhasil dibuat.\nID Anda: ${json.data.tenant_id}`)
        // Redirect ke Landing Page RT Baru
        window.location.href = `/?id=${json.data.tenant_id}`
      } else {
        alert("Gagal: " + json.message)
      }
    } catch (err) {
      alert("Error Network")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-gray-900 p-6 text-white relative">
            <button onClick={() => navigate('/')} className="absolute top-6 left-6 p-1 bg-white/20 rounded-full hover:bg-white/30 transition"><ArrowLeft className="w-5 h-5"/></button>
            <div className="mt-8">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-900/50">
                    <Building className="w-6 h-6 text-white"/>
                </div>
                <h1 className="text-2xl font-bold">Buat Lingkungan Baru</h1>
                <p className="text-gray-400 text-sm mt-1">Digitalisasikan RT/RW Anda dalam 1 menit.</p>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nama Lingkungan (RT/RW)</label>
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 mt-1 focus-within:ring-2 ring-blue-100 transition">
                    <Building className="w-5 h-5 text-gray-400"/>
                    <input required type="text" placeholder="Contoh: RT 02 Griya Melati" className="bg-transparent w-full outline-none text-sm font-bold text-gray-700"
                        onChange={e => setForm({...form, rt_name: e.target.value})}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Kota</label>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 mt-1">
                        <input required type="text" placeholder="Depok" className="bg-transparent w-full outline-none text-sm font-bold text-gray-700"
                            onChange={e => setForm({...form, city: e.target.value})}
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Area/Kec</label>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 mt-1">
                        <input required type="text" placeholder="Cilodong" className="bg-transparent w-full outline-none text-sm font-bold text-gray-700"
                            onChange={e => setForm({...form, area: e.target.value})}
                        />
                    </div>
                </div>
            </div>

            <div className="border-t border-dashed border-gray-200 pt-2"></div>
            
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">No HP Admin (Ketua RT)</label>
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 mt-1 focus-within:ring-2 ring-blue-100 transition">
                    <Phone className="w-5 h-5 text-gray-400"/>
                    <input required type="number" placeholder="0812..." className="bg-transparent w-full outline-none text-sm font-bold text-gray-700"
                        onChange={e => setForm({...form, owner_phone: e.target.value})}
                    />
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Password Admin</label>
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 mt-1 focus-within:ring-2 ring-blue-100 transition">
                    <Lock className="w-5 h-5 text-gray-400"/>
                    <input required type="password" placeholder="Rahasia..." className="bg-transparent w-full outline-none text-sm font-bold text-gray-700"
                        onChange={e => setForm({...form, password: e.target.value})}
                    />
                </div>
            </div>

            <button disabled={loading} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition shadow-lg active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Buat Database Sekarang'}
            </button>
        </form>
      </div>
    </div>
  )
}