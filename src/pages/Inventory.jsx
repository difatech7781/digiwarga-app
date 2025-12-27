import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Box, Loader2, Info } from 'lucide-react'

export default function Inventory() {
  const navigate = useNavigate()
  const tenantId = localStorage.getItem('dg_tenant_id') || 'UMUM';
  const apiUrl = localStorage.getItem('dg_api_url')
  
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(apiUrl, {
          method: 'POST', body: JSON.stringify({ action: 'inventory_action', payload: { sub_action: 'LIST', tenant_id: tenantId } })
        })
        const json = await res.json()
        setItems(json.data || [])
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    fetchItems()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-indigo-600 p-6 pt-12 pb-8 text-white rounded-b-[30px] shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/20 rounded-full transition"><ArrowLeft className="w-6 h-6" /></button>
          <h1 className="text-xl font-bold">Inventaris RT</h1>
        </div>
      </div>

      <div className="p-4 space-y-4 -mt-4 relative z-10">
        {loading ? <div className="text-center py-10 text-gray-400"><Loader2 className="w-8 h-8 animate-spin mx-auto"/></div> : items.map((item) => (
          <div key={item.asset_id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
             <img src={item.photo_url} className="w-20 h-20 rounded-xl object-cover bg-gray-200" onError={(e)=>e.target.src="https://placehold.co/100x100?text=Aset"}/>
             <div className="flex-1">
                <h3 className="font-bold text-gray-800">{item.name}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                <div className="flex items-center gap-2 mt-3">
                   <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md font-bold">Stok: {item.total_qty}</span>
                   <span className={`text-[10px] px-2 py-1 rounded-md font-bold ${item.condition==='BAIK'?'bg-green-50 text-green-700':'bg-red-50 text-red-700'}`}>{item.condition}</span>
                </div>
             </div>
          </div>
        ))}
        <div className="text-center text-xs text-gray-400 mt-4"><Info className="w-3 h-3 inline mr-1"/>Hubungi Pak RT untuk peminjaman.</div>
      </div>
    </div>
  )
}