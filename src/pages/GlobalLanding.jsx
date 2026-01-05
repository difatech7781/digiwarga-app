import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, ArrowRight, Building, CheckCircle, Loader2 } from 'lucide-react'
import VendorFooter from '../components/VendorFooter'

export default function GlobalLanding() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const apiUrl = localStorage.getItem('dg_api_url')

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!keyword || keyword.length < 3) return
    
    setLoading(true)
    setHasSearched(true)
    setResults([])

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'search_tenants',
          payload: { keyword }
        })
      })
      const json = await res.json()
      if (json.status === 'success') {
        setResults(json.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const goToTenant = (tenantId) => {
    // Force reload context ke RT spesifik
    localStorage.setItem('dg_tenant_id', tenantId)
    window.location.href = `/?id=${tenantId}`
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      
      {/* 1. NAVBAR */}
      <nav className="bg-white px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">DW</div>
            <span className="font-bold text-gray-800 tracking-tight">DigiWarga</span>
        </div>
        <div className="flex gap-3">
            <button onClick={() => navigate('/login')} className="text-sm font-bold text-gray-600 hover:text-blue-600">Masuk</button>
            <button onClick={() => navigate('/create-rt')} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition">Buat Baru</button>
        </div>
      </nav>

      {/* 2. HERO & SEARCH */}
      <div className="bg-white pb-16 pt-12 px-4 text-center rounded-b-[40px] shadow-sm border-b border-gray-100">
         <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
            Satu Aplikasi,<br/>Satu Lingkungan.
         </h1>
         <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
            Temukan RT/RW Anda, pantau kas transparan, dan akses layanan warga dalam satu genggaman.
         </p>

         {/* SEARCH BOX */}
         <form onSubmit={handleSearch} className="max-w-lg mx-auto relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition" />
            </div>
            <input 
              type="text" 
              placeholder="Cari nama RT, Perumahan, atau Kota..." 
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition outline-none text-gray-800 font-medium shadow-sm"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button 
                type="submit"
                disabled={loading || keyword.length < 3}
                className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white px-4 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Cari'}
            </button>
         </form>
         <p className="text-xs text-gray-400 mt-3">Contoh: "RT 02 Melati", "Grand Wisata", "Surabaya"</p>
      </div>

      {/* 3. SEARCH RESULTS */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
         {loading && (
             <div className="text-center py-10">
                 <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2"/>
                 <p className="text-gray-400 text-sm">Mencari lingkungan...</p>
             </div>
         )}

         {!loading && hasSearched && results.length === 0 && (
             <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-gray-300">
                 <Building className="w-10 h-10 text-gray-300 mx-auto mb-2"/>
                 <p className="text-gray-800 font-bold">Tidak ditemukan.</p>
                 <p className="text-gray-500 text-sm mb-4">Pastikan kata kunci benar atau daftarkan RT Anda.</p>
                 <button onClick={() => navigate('/create-rt')} className="text-blue-600 font-bold text-sm hover:underline">Daftarkan Lingkungan Baru &rarr;</button>
             </div>
         )}

         <div className="space-y-3">
             {results.map((rt, idx) => (
                 <div key={idx} onClick={() => goToTenant(rt.tenant_id)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition cursor-pointer flex justify-between items-center group">
                     <div>
                         <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition">{rt.rt_name}</h3>
                         <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                             <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {rt.area}, {rt.city}</span>
                             <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-bold text-[10px]">ACTIVE</span>
                         </div>
                         <p className="text-xs text-gray-400 mt-1 line-clamp-1">{rt.description}</p>
                     </div>
                     <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                         <ArrowRight className="w-4 h-4"/>
                     </div>
                 </div>
             ))}
         </div>
         
         {/* MARKETING TEASER (Jika belum cari) */}
         {!hasSearched && (
             <div className="grid grid-cols-2 gap-4 mt-4">
                 <div className="bg-blue-50 p-5 rounded-2xl">
                     <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-blue-600 mb-3 shadow-sm"><CheckCircle className="w-5 h-5"/></div>
                     <h3 className="font-bold text-gray-800 text-sm mb-1">Transparan</h3>
                     <p className="text-xs text-gray-500">Laporan keuangan kas RT real-time.</p>
                 </div>
                 <div className="bg-indigo-50 p-5 rounded-2xl">
                     <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-600 mb-3 shadow-sm"><CheckCircle className="w-5 h-5"/></div>
                     <h3 className="font-bold text-gray-800 text-sm mb-1">Digital</h3>
                     <p className="text-xs text-gray-500">Lapor warga, surat, & panic button online.</p>
                 </div>
             </div>
         )}
      </div>

      <div className="py-6 border-t border-gray-200 bg-white mt-auto">
        <VendorFooter theme="light" />
      </div>
    </div>
  )
}