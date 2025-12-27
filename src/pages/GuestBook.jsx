import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, QrCode, PlusCircle, Check, Loader2, Share2 } from 'lucide-react'

export default function GuestBook() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('dg_user') || '{}')
  const apiUrl = localStorage.getItem('dg_api_url')
  const tenantId = localStorage.getItem('dg_tenant_id') || 'UMUM';
  
  const [form, setForm] = useState({ name: '', purpose: '', date: '' })
  const [passCode, setPassCode] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(apiUrl, {
        method: 'POST', body: JSON.stringify({ 
           action: 'guest_action', 
           payload: { sub_action: 'CREATE_PASS', user_id: user.id, tenant_id: tenantId, data: form } 
        })
      })
      const json = await res.json()
      if(json.status === 'success') setPassCode(json.code)
    } catch(e) { alert("Gagal") } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-pink-600 p-6 pt-12 pb-8 text-white rounded-b-[30px] shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/20 rounded-full transition"><ArrowLeft className="w-6 h-6" /></button>
          <h1 className="text-xl font-bold">Buku Tamu</h1>
        </div>
      </div>

      <div className="p-6 -mt-4 relative z-10">
         {passCode ? (
            <div className="bg-white p-8 rounded-3xl shadow-xl text-center animate-scale-up">
               <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"><Check className="w-8 h-8 text-green-600"/></div>
               <h3 className="text-2xl font-bold text-gray-800 mb-2">{passCode}</h3>
               <p className="text-sm text-gray-500 mb-6">Tunjukkan kode ini ke Satpam</p>
               <div className="bg-gray-100 p-4 rounded-xl mb-6">
                  <p className="text-xs font-bold text-gray-400 uppercase">Tamu</p>
                  <p className="font-bold text-gray-800 text-lg">{form.name}</p>
               </div>
               <button onClick={() => setPassCode(null)} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold">Buat Baru</button>
            </div>
         ) : (
            <div className="bg-white p-6 rounded-3xl shadow-sm">
               <h3 className="font-bold text-gray-800 mb-4">Registrasi Tamu</h3>
               <form onSubmit={handleSubmit} className="space-y-4">
                  <input placeholder="Nama Tamu" className="w-full p-3 bg-gray-50 rounded-xl outline-none" required value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
                  <input placeholder="Keperluan" className="w-full p-3 bg-gray-50 rounded-xl outline-none" required value={form.purpose} onChange={e=>setForm({...form, purpose:e.target.value})}/>
                  <input type="date" className="w-full p-3 bg-gray-50 rounded-xl outline-none" required value={form.date} onChange={e=>setForm({...form, date:e.target.value})}/>
                  <button disabled={loading} className="w-full py-4 bg-pink-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">
                     {loading ? <Loader2 className="animate-spin"/> : <><QrCode className="w-5 h-5"/> Buat Akses Masuk</>}
                  </button>
               </form>
            </div>
         )}
      </div>
    </div>
  )
}