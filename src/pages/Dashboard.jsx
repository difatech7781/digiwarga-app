import { useState, useEffect } from 'react'
import { 
  LogOut, CreditCard, FileText, Bell, User, ShieldCheck,
  ShoppingBag, Vote, Box, Siren, Users, BookOpen, ChevronDown, ChevronUp, Loader2, CheckCircle, XCircle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  
  // 1. SAFETY CHECK
  const userString = localStorage.getItem('dg_user')
  const user = userString ? JSON.parse(userString) : {}
  const apiUrl = localStorage.getItem('dg_api_url')
  const tenantId = localStorage.getItem('dg_tenant_id') || 'UMUM';
  const isAdmin = ['SUPERADMIN', 'ADMIN', 'OPERATOR'].includes(user.role?.toUpperCase())

  useEffect(() => {
    if (!user || !user.id) navigate('/')
  }, [user, navigate])

  // STATE
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('PAYMENT')
  
  const [payHistory, setPayHistory] = useState([])
  const [payLoading, setPayLoading] = useState(false)
  const [payYear, setPayYear] = useState(new Date().getFullYear().toString())
  const [payPage, setPayPage] = useState(1)
  const [expandedPayId, setExpandedPayId] = useState(null)

  const [letterHistory, setLetterHistory] = useState([])
  const [letterLoading, setLetterLoading] = useState(false)
  const [letterYear, setLetterYear] = useState(new Date().getFullYear().toString())
  const [letterPage, setLetterPage] = useState(1)
  const [expandedLetterId, setExpandedLetterId] = useState(null)

  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [statusModal, setStatusModal] = useState({ show: false, type: 'success', title: '', message: '' })
  
  const [formData, setFormData] = useState({ name: user.name || '', phone: user.phone || '', password: '', address: user.address || '' })
  const [isUpdating, setIsUpdating] = useState(false)

  const ITEMS_PER_PAGE = 3

  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 11 ? 'Selamat Pagi' : h < 15 ? 'Selamat Siang' : h < 18 ? 'Selamat Sore' : 'Selamat Malam';
  }

  const getRTLabel = () => (user.rt_code && user.rt_code !== 'UMUM') ? user.rt_code.toUpperCase() : tenantId.toUpperCase();

  // FETCH DATA
  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(apiUrl, { method: 'POST', body: JSON.stringify({ action: 'get_dashboard', payload: { user_id: user.id, tenant_id } }) })
      const json = await res.json()
      setDashboardData(json.data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const fetchPayHistory = async () => {
    setPayLoading(true)
    try {
      const res = await fetch(apiUrl, { method: 'POST', body: JSON.stringify({ action: 'get_user_history', payload: { user_id: user.id, type: 'PAYMENT', year: payYear, tenant_id } }) })
      const json = await res.json()
      setPayHistory(json.data || [])
      setPayPage(1)
    } catch(e) { console.error(e) } finally { setPayLoading(false) }
  }

  const fetchLetterHistory = async () => {
    setLetterLoading(true)
    try {
      const res = await fetch(apiUrl, { method: 'POST', body: JSON.stringify({ action: 'get_user_history', payload: { user_id: user.id, type: 'LETTER', year: letterYear, tenant_id } }) })
      const json = await res.json()
      setLetterHistory(json.data || [])
      setLetterPage(1)
    } catch(e) { console.error(e) } finally { setLetterLoading(false) }
  }

  useEffect(() => { if(user.id) { fetchData(); fetchPayHistory(); fetchLetterHistory(); } }, [])
  useEffect(() => { if(user.id) fetchPayHistory() }, [payYear])
  useEffect(() => { if(user.id) fetchLetterHistory() }, [letterYear])

  const handleUpdateProfile = async (e) => {
    e.preventDefault(); setIsUpdating(true);
    try {
      const res = await fetch(apiUrl, { method: 'POST', body: JSON.stringify({ action: 'update_profile', payload: { user_id: user.id, data: formData, tenant_id } }) })
      const json = await res.json()
      if (json.status === 'success') {
        setStatusModal({ show: true, type: 'success', title: 'Berhasil', message: 'Profil diupdate.' })
        localStorage.setItem('dg_user', JSON.stringify({ ...user, ...formData }))
        setShowProfileModal(false)
      } else { setStatusModal({ show: true, type: 'error', title: 'Gagal', message: json.message }) }
    } catch (error) { setStatusModal({ show: true, type: 'error', title: 'Error', message: 'Koneksi gagal.' }) } finally { setIsUpdating(false) }
  }

  const handleLogout = () => { localStorage.clear(); navigate('/') }
  
  // --- MENU CONFIG (LABEL UPDATED) ---
  const menuItems = [
    { label: 'Bayar Iuran', icon: CreditCard, color: 'bg-blue-500', link: '/bayar' },
    { label: 'Surat', icon: FileText, color: 'bg-purple-500', link: '/surat' },
    { label: 'Lapor!', icon: Siren, color: 'bg-red-500', link: '/lapor' },
    { label: 'Lapak Warga', icon: ShoppingBag, color: 'bg-orange-500', link: '/market' }, // Label Updated
    { label: 'Musyawarah', icon: Vote, color: 'bg-teal-500', link: '/vote' },
    { label: 'Aset RT', icon: Box, color: 'bg-indigo-500', link: '/aset' },
    { label: 'Ronda', icon: ShieldCheck, color: 'bg-slate-600', link: '/ronda' },
    { label: 'Buku Tamu', icon: Users, color: 'bg-pink-500', link: '/tamu' },
    { label: 'Info Penting', icon: BookOpen, color: 'bg-green-500', link: '/info' },
  ];

  const paginatedPay = payHistory.slice((payPage - 1) * ITEMS_PER_PAGE, payPage * ITEMS_PER_PAGE);
  const paginatedLetter = letterHistory.slice((letterPage - 1) * ITEMS_PER_PAGE, letterPage * ITEMS_PER_PAGE);
  const getNote = (jsonStr) => { try { return JSON.parse(jsonStr).keperluan || '-' } catch(e) { return '-' } }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      
      {/* HEADER */}
      <div className="bg-[#1877F2] pb-24 pt-8 px-6 rounded-b-[40px] shadow-xl relative overflow-hidden">
        <div className="absolute top-[-50%] left-[-20%] w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex justify-between items-start">
          <div className="text-white">
            <p className="text-blue-200 text-sm font-medium mb-1">{getGreeting()}</p>
            <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
            <div className="flex items-center gap-2 mt-2 bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm shadow-sm border border-white/10">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-xs font-mono font-bold uppercase tracking-wide">WARGA | {getRTLabel()}</span>
            </div>
          </div>
          <div className="flex gap-2">
             {isAdmin && <button onClick={()=>navigate('/admin')} className="p-2 bg-orange-500 hover:bg-orange-600 rounded-xl shadow-lg text-white"><ShieldCheck className="w-6 h-6"/></button>}
             <button onClick={()=>setShowProfileModal(true)} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-md"><User className="text-white w-6 h-6"/></button>
             <button onClick={()=>setShowConfirmDialog(true)} className="p-2 bg-red-500/80 hover:bg-red-600 rounded-xl shadow-lg"><LogOut className="text-white w-6 h-6"/></button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="px-4 -mt-16 relative z-20 space-y-6">
        
        {/* 1. SUPER MENU GRID */}
        <div className="bg-white rounded-3xl shadow-lg p-6 animate-slide-up">
          <h2 className="text-gray-400 font-bold text-[10px] mb-4 uppercase tracking-widest text-center">Menu Utama</h2>
          <div className="grid grid-cols-3 gap-y-6 gap-x-4">
            {menuItems.map((item, idx) => (
              <button key={idx} onClick={() => navigate(item.link)} className="flex flex-col items-center justify-center gap-2 group active:scale-95 transition">
                <div className={`p-3.5 rounded-2xl ${item.color} text-white shadow-md group-hover:shadow-lg transition-all`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-gray-600 group-hover:text-blue-600 text-center">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. FEED */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-800">Informasi & Laporan</h3>
            </div>
            <div className="p-4 space-y-4">
                {dashboardData?.feed?.filter(f => f.type !== 'REPORT' || f.status !== 'CLOSE').length > 0 ? (
                    dashboardData.feed.filter(f => f.type !== 'REPORT' || f.status !== 'CLOSE').map((item, idx) => (
                        <div key={idx} className={`relative p-4 rounded-xl border shadow-sm ${item.category==='DARURAT'||item.is_panic ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase bg-gray-100 text-gray-600">{item.category}</span>
                                </div>
                                <span className="text-[10px] text-gray-400 font-mono">{new Date(item.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
                            </div>
                            <p className="text-sm text-gray-700 leading-snug">{item.content}</p>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-xs text-gray-400">Belum ada informasi terbaru.</div>
                )}
            </div>
        </div>

        {/* 3. HISTORY TABS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-200">
               <button onClick={() => setActiveTab('PAYMENT')} className={`flex-1 py-4 text-sm font-bold text-center ${activeTab === 'PAYMENT' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}>Riwayat Iuran</button>
               <button onClick={() => setActiveTab('LETTER')} className={`flex-1 py-4 text-sm font-bold text-center ${activeTab === 'LETTER' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}>Riwayat Surat</button>
            </div>
            {activeTab === 'PAYMENT' && (
              <div className="animate-fade-in divide-y divide-gray-100">
                 {paginatedPay.map((item) => (
                    <div key={item.id} onClick={() => setExpandedPayId(expandedPayId === item.id ? null : item.id)} className="p-4 bg-white hover:bg-gray-50 transition cursor-pointer">
                        <div className="flex justify-between items-center">
                            <div><p className="font-bold text-xs uppercase">{item.category}</p><p className="text-[10px] text-gray-400">{new Date(item.date).toLocaleDateString('id-ID')}</p></div>
                            <div className="text-right"><p className="font-bold text-sm">Rp {Number(item.amount).toLocaleString('id-ID')}</p><span className="text-[9px] font-bold text-green-600">{item.status}</span></div>
                        </div>
                        {expandedPayId === item.id && <div className="mt-2 pt-2 border-t text-xs text-gray-500">Catatan: {item.notes}</div>}
                    </div>
                 ))}
                 {payHistory.length > ITEMS_PER_PAGE && <div className="p-3 flex justify-center gap-4 text-xs font-bold text-indigo-600"><button onClick={()=>setPayPage(p=>Math.max(1,p-1))}>Prev</button><span>{payPage}</span><button onClick={()=>setPayPage(p=>p+1)}>Next</button></div>}
              </div>
            )}
            {activeTab === 'LETTER' && (
              <div className="animate-fade-in divide-y divide-gray-100">
                 {paginatedLetter.map((item) => (
                    <div key={item.id} onClick={() => setExpandedLetterId(expandedLetterId === item.id ? null : item.id)} className="p-4 bg-white hover:bg-gray-50 transition cursor-pointer">
                        <div className="flex justify-between items-center">
                            <div><p className="font-bold text-xs truncate w-40">{item.type.replace(/_/g, ' ')}</p><p className="text-[10px] text-gray-400">{new Date(item.date).toLocaleDateString('id-ID')}</p></div>
                            <span className="text-[9px] font-bold text-green-600 border px-2 py-1 rounded">{item.status}</span>
                        </div>
                        {expandedLetterId === item.id && <div className="mt-2 pt-2 border-t text-xs text-gray-500">Keperluan: {getNote(item.note)}</div>}
                    </div>
                 ))}
                 {letterHistory.length > ITEMS_PER_PAGE && <div className="p-3 flex justify-center gap-4 text-xs font-bold text-purple-600"><button onClick={()=>setLetterPage(p=>Math.max(1,p-1))}>Prev</button><span>{letterPage}</span><button onClick={()=>setLetterPage(p=>p+1)}>Next</button></div>}
              </div>
            )}
        </div>

      </div>

      {/* MODALS */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6">
            <h3 className="font-bold text-lg mb-4">Edit Profil</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-3">
               <input value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} className="w-full p-2 border rounded" placeholder="Nama"/>
               <input value={formData.phone} onChange={e=>setFormData({...formData,phone:e.target.value})} className="w-full p-2 border rounded" placeholder="HP"/>
               <button type="submit" disabled={isUpdating} className="w-full py-3 bg-blue-600 text-white rounded font-bold">{isUpdating ? 'Menyimpan...' : 'Simpan'}</button>
               <button type="button" onClick={()=>setShowProfileModal(false)} className="w-full py-3 text-gray-500">Batal</button>
            </form>
          </div>
        </div>
      )}

      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white p-6 rounded-2xl text-center shadow-2xl">
                <h3 className="font-bold text-lg mb-4">Keluar Aplikasi?</h3>
                <div className="flex gap-3">
                    <button onClick={()=>setShowConfirmDialog(false)} className="flex-1 py-2 bg-gray-100 rounded-lg">Batal</button>
                    <button onClick={handleLogout} className="flex-1 py-2 bg-red-600 text-white rounded-lg">Ya</button>
                </div>
            </div>
        </div>
      )}

    </div>
  )
}