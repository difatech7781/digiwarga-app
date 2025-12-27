import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, User, Search } from 'lucide-react'

export default function Directory() {
  const navigate = useNavigate()
  const apiUrl = localStorage.getItem('dg_api_url')
  const tenantId = localStorage.getItem('dg_tenant_id') || 'UMUM';
  const [contacts, setContacts] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await fetch(apiUrl, {
          method: 'POST', body: JSON.stringify({ action: 'directory_action', payload: { sub_action: 'LIST', tenant_id: tenantId } })
        })
        const json = await res.json()
        setContacts(json.data || [])
      } catch (e) { console.error(e) }
    }
    fetchContacts()
  }, [])

  const filtered = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-green-600 p-6 pt-12 pb-8 text-white rounded-b-[30px] shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/20 rounded-full transition"><ArrowLeft className="w-6 h-6" /></button>
          <h1 className="text-xl font-bold">Kontak Penting</h1>
        </div>
        <div className="relative">
           <Search className="absolute left-3 top-3 w-4 h-4 text-green-200"/>
           <input placeholder="Cari kontak..." className="w-full pl-10 p-2.5 bg-green-700/50 rounded-xl text-sm text-white placeholder:text-green-200 outline-none focus:bg-green-700 transition" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
      </div>

      <div className="p-4 space-y-3 -mt-4 relative z-10">
         {filtered.map((c, idx) => (
            <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full ${c.category==='KEAMANAN'?'bg-red-100 text-red-600':c.category==='MEDIS'?'bg-blue-100 text-blue-600':'bg-gray-100 text-gray-600'}`}><User className="w-5 h-5"/></div>
                  <div>
                     <h4 className="font-bold text-gray-800 text-sm">{c.name}</h4>
                     <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wide">{c.category}</p>
                     <p className="text-[10px] text-gray-400 mt-0.5">{c.description}</p>
                  </div>
               </div>
               <a href={`tel:${c.phone}`} className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition"><Phone className="w-5 h-5"/></a>
            </div>
         ))}
      </div>
    </div>
  )
}