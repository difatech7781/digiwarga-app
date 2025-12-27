import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, Calendar, Clock } from 'lucide-react'

export default function Ronda() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('dg_user') || '{}')
  const apiUrl = localStorage.getItem('dg_api_url')
  const tenantId = localStorage.getItem('dg_tenant_id') || 'UMUM';
  const [schedule, setSchedule] = useState([])

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await fetch(apiUrl, {
          method: 'POST', body: JSON.stringify({ action: 'ronda_action', payload: { sub_action: 'MY_SCHEDULE', user_id: user.id, tenant_id: tenantId } })
        })
        const json = await res.json()
        setSchedule(json.data || [])
      } catch (e) { console.error(e) }
    }
    if(user.id) fetchSchedule()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-slate-700 p-6 pt-12 pb-8 text-white rounded-b-[30px] shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/20 rounded-full transition"><ArrowLeft className="w-6 h-6" /></button>
          <h1 className="text-xl font-bold">Jadwal Ronda</h1>
        </div>
      </div>

      <div className="p-4 space-y-4 -mt-4 relative z-10">
         <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center">
            <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-2"/>
            <h3 className="font-bold text-gray-800">Petugas Keamanan</h3>
            <p className="text-xs text-gray-500">Jaga keamanan lingkungan kita bersama.</p>
         </div>

         <h3 className="font-bold text-sm text-gray-600 px-2 uppercase tracking-wide">Giliran Anda</h3>
         {schedule.length > 0 ? schedule.map((item, idx) => (
            <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-slate-600 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg"><Calendar className="w-5 h-5 text-slate-700"/></div>
                  <div>
                     <p className="font-bold text-gray-800">{new Date(item.date).toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'long'})}</p>
                     <p className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3"/> 22.00 - 04.00 WIB</p>
                  </div>
               </div>
               <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-md">Wajib</span>
            </div>
         )) : (
            <div className="text-center py-8 text-xs text-gray-400">Belum ada jadwal ronda untuk Anda bulan ini.</div>
         )}
      </div>
    </div>
  )
}