import { useState, useEffect } from 'react'
import { 
  LogOut, CreditCard, FileText, Bell, RefreshCw, 
  Download, Clock, CheckCircle, XCircle, Loader2,
  Settings, User, Save, X, AlertCircle, 
  ShieldCheck // Icon Admin
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// IMPORT FOOTER
import VendorFooter from '../components/VendorFooter'

export default function Dashboard() {
  const navigate = useNavigate()
  
  // 1. SAFETY CHECK
  const userString = localStorage.getItem('dg_user')
  const user = userString ? JSON.parse(userString) : {}
  const clientName = localStorage.getItem('dg_client_name')
  const apiUrl = localStorage.getItem('dg_api_url')

  // CEK ROLE ADMIN
  const isAdmin = ['SUPERADMIN', 'ADMIN', 'OPERATOR'].includes(user.role?.toUpperCase())

  useEffect(() => {
    if (!user || !user.id) {
      navigate('/')
    }
  }, [user, navigate])

  // --- STATE ---
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)

  // State Modals
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [statusModal, setStatusModal] = useState({ show: false, type: 'success', title: '', message: '' })
  
  const [profileData, setProfileData] = useState({
    name: user.name || '', phone: user.phone || '', address: user.address || '', password: ''
  })

  // State Paginasi
  const [suratPage, setSuratPage] = useState(1)
  const [itemsPerPage] = useState(3)

  // --- FETCH DATA ---
  const fetchDashboard = async () => {
    if (!dashboardData) setLoading(true)
    
    try {
      if (!user.id) return 

      const res = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'get_dashboard',
          payload: { user_id: user.id }
        })
      })
      const json = await res.json()
      const finalData = json.data || json
      
      if (json.status === 'success' || finalData.user) {
        setDashboardData(finalData)
      } else {
        console.warn("Data dashboard tidak lengkap:", json.message)
      }
    } catch (err) {
      console.error("Gagal ambil data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user.id) fetchDashboard()
  }, [])

  // --- LOGIC PERHITUNGAN ---
  const allSurat = dashboardData?.documents || []
  const visibleSurat = allSurat.slice((suratPage - 1) * itemsPerPage, suratPage * itemsPerPage)

  const totalBill = (dashboardData?.bills || [])
    .filter(item => item.status === 'PENDING')
    .reduce((acc, item) => acc + Number(item.amount || 0), 0)

  const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0)

  // --- LOGIC LAIN ---
  const handleLogout = () => {
    localStorage.removeItem('dg_token')
    localStorage.removeItem('dg_user')
    navigate('/')
  }

  const initiateSaveProfile = (e) => { e.preventDefault(); setShowConfirmDialog(true); }

  const processUpdateProfile = async () => {
    setShowConfirmDialog(false)
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'update_profile', payload: { user_id: user.id, data: profileData } })
      })
      const json = await res.json()
      if (json.status === 'success') {
        setStatusModal({ show: true, type: 'success', title: 'Berhasil Disimpan!', message: 'Silakan login ulang agar data terupdate.' })
        setShowProfileModal(false)
      } else {
        setStatusModal({ show: true, type: 'error', title: 'Gagal', message: json.message })
      }
    } catch (err) { 
       setStatusModal({ show: true, type: 'error', title: 'Error', message: 'Koneksi bermasalah.' })
    }
  }

  const handleStatusOk = () => {
    setStatusModal({ ...statusModal, show: false })
    if (statusModal.type === 'success' && statusModal.title.includes('Berhasil')) handleLogout()
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* 1. HEADER & SALDO */}
      <div className="bg-indigo-600 px-6 pt-8 pb-20 rounded-b-[2.5rem] shadow-lg relative">
        <div className="flex justify-between items-center text-white mb-6">
          <div>
            <p className="text-indigo-200 text-xs">Selamat datang,</p>
            <h2 className="text-2xl font-bold">{dashboardData?.user?.name || user.name || 'Warga'}</h2>
            <p className="text-xs text-indigo-200 mt-1">{clientName || 'Warga Digital'} - {dashboardData?.user?.rt_code || user.rt_code || ''}</p>
          </div>
          
          <div className="flex gap-2">
            
            {/* TOMBOL ADMIN PANEL */}
            {isAdmin && (
              <button 
                onClick={() => navigate('/admin')} 
                className="p-2 bg-orange-500/20 text-orange-200 rounded-full hover:bg-orange-500/40 transition border border-orange-500/30"
                title="Akses Admin Panel"
              >
                <ShieldCheck className="w-5 h-5" />
              </button>
            )}

            {/* TOMBOL EDIT PROFIL */}
            <button onClick={() => { setProfileData({ ...profileData, name: user.name, phone: user.phone }); setShowProfileModal(true); }} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition">
              <Settings className="w-5 h-5" />
            </button>
            
            {/* TOMBOL LOGOUT */}
            <button onClick={handleLogout} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition">
              <LogOut className="w-5 h-5" />
            </button>

            {/* --- DUPLIKAT SUDAH DIHAPUS --- */}
          </div>
        </div>

        {/* KARTU TAGIHAN */}
        <div className="bg-white text-gray-800 p-5 rounded-2xl shadow-xl border border-gray-100 relative overflow-hidden">
          {loading && !dashboardData ? (
             <div className="animate-pulse h-16 bg-gray-100 rounded w-full"></div>
          ) : (
            <>
               <div className="absolute top-0 right-0 p-4 opacity-5"><CreditCard className="w-24 h-24 text-indigo-600" /></div>
               <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Tagihan Saya</p>
               <div className="flex justify-between items-end mt-2 relative z-10">
                 <div>
                   <h3 className={`text-3xl font-bold ${totalBill > 0 ? 'text-orange-500' : 'text-gray-900'}`}>{formatRupiah(totalBill)}</h3>
                   <p className="text-[10px] text-gray-400 mt-1">{totalBill > 0 ? 'Mohon segera lunasi.' : 'Terima kasih sudah tertib!'}</p>
                 </div>
                 {totalBill > 0 ? (
                    <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-bold animate-pulse">BELUM BAYAR</div>
                 ) : (
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold">LUNAS</div>
                 )}
               </div>
            </>
          )}
        </div>
      </div>

      {/* 2. MENU UTAMA */}
      <div className="px-6 -mt-8 grid grid-cols-2 gap-4 relative z-10 mb-8">
        <MenuCard icon={CreditCard} label="Bayar Iuran" color="bg-orange-500" onClick={() => navigate('/pay')} />
        <MenuCard icon={FileText} label="Surat Online" color="bg-purple-500" onClick={() => navigate('/request-letter')} />
        <MenuCard icon={Bell} label="Lapor / Info" color="bg-teal-500" onClick={() => navigate('/citizen-report')} />
        
        <button onClick={() => { setLoading(true); fetchDashboard(); }} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 active:scale-95 transition">
          <div className="p-3 rounded-full bg-blue-500 text-white shadow-md">
            <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
          </div>
          <span className="text-xs font-medium text-gray-600">Refresh</span>
        </button>
      </div>

      <div className="px-6 space-y-8">
        
        {/* 3. RIWAYAT SURAT */}
        <div>
           <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
             <FileText className="w-4 h-4 text-purple-500"/> Riwayat Surat
           </h3>

           {loading && !dashboardData ? <SkeletonList /> : (!allSurat || allSurat.length === 0) ? (
              <EmptyState text="Belum ada pengajuan surat." />
           ) : (
             <div className="space-y-3">
               {visibleSurat.map((doc) => (
                 <div key={doc.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden animate-fade-in">
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${doc.status === 'APPROVED' ? 'bg-green-500' : doc.status === 'REJECTED' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                    <div className="pl-3">
                       <div className="flex justify-between items-start mb-2">
                          <div>
                             <h4 className="font-bold text-gray-800 text-sm">{doc.type.replace(/_/g, ' ')}</h4>
                             <p className="text-[10px] text-gray-400">ID: {doc.id.substring(0,8)}...</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${doc.status === 'APPROVED' ? 'bg-green-100 text-green-700' : doc.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                             {doc.status}
                          </span>
                       </div>
                       <div className="flex justify-end pt-2 mt-2 border-t border-gray-50">
                          {doc.status === 'APPROVED' && doc.pdf_url ? (
                             <a href={doc.pdf_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow hover:bg-green-700 transition">
                                <Download className="w-3 h-3" /> Download PDF
                             </a>
                          ) : doc.status === 'APPROVED' ? (
                             <span className="text-[10px] text-gray-400 italic">Sedang generate PDF...</span>
                          ) : doc.status === 'REQUESTED' ? (
                             <span className="text-[10px] text-yellow-600 flex items-center gap-1"><Clock className="w-3 h-3"/> Menunggu Admin</span>
                          ) : (
                             <span className="text-[10px] text-red-500 flex items-center gap-1"><XCircle className="w-3 h-3"/> Ditolak</span>
                          )}
                       </div>
                    </div>
                 </div>
               ))}
               
               {allSurat.length > itemsPerPage && (
                 <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-100">
                    <span className="text-[10px] text-gray-400">Hal {suratPage} dari {Math.ceil(allSurat.length / itemsPerPage)}</span>
                    <div className="flex gap-2">
                      <button disabled={suratPage === 1} onClick={() => setSuratPage(p => p - 1)} className="px-3 py-1 text-xs border rounded-lg hover:bg-gray-50 disabled:opacity-50">Prev</button>
                      <button disabled={suratPage >= Math.ceil(allSurat.length / itemsPerPage)} onClick={() => setSuratPage(p => p + 1)} className="px-3 py-1 text-xs border rounded-lg hover:bg-gray-50 disabled:opacity-50">Next</button>
                    </div>
                 </div>
               )}
             </div>
           )}
        </div>

        {/* 4. INFO WARGA */}
        <div>
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
             <Bell className="w-4 h-4 text-teal-500"/> Info Warga
          </h3>
          <div className="space-y-3">
             {dashboardData?.feed?.map((item, idx) => (
               <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center mb-2 gap-2">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded inline-block ${item.category.includes('DARURAT') ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                       {item.category}
                    </span>
                    {item.is_urgent && (
                      <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1 shadow-sm">
                        <AlertCircle className="w-3 h-3"/> PENTING
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{item.content}</p>
                  <p className="text-[10px] text-gray-400 mt-2 text-right">{new Date(item.date).toLocaleDateString()}</p>
               </div>
             ))}
             {!loading && (!dashboardData?.feed || dashboardData.feed.length === 0) && (
                <EmptyState text="Belum ada info terbaru." />
             )}
          </div>
        </div>

      </div>

      {/* FOOTER VENDOR */}
      <VendorFooter theme="light" />

      {/* --- MODALS (PROFIL, CONFIRM, STATUS) --- */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center shrink-0">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><User className="w-5 h-5 text-indigo-600"/> Edit Profil Saya</h3>
              <button onClick={() => setShowProfileModal(false)} className="p-1 bg-gray-200 rounded-full text-gray-500 hover:bg-gray-300"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form onSubmit={initiateSaveProfile} className="space-y-5">
                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nama</label><input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full border-b-2 py-2 outline-none"/></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">No HP</label><input type="text" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="w-full border-b-2 py-2 outline-none"/></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Alamat</label><textarea rows="2" value={profileData.address} onChange={e => setProfileData({...profileData, address: e.target.value})} className="w-full border-b-2 py-2 outline-none"/></div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                   <label className="text-xs font-bold text-red-500 uppercase block mb-1">Password Baru</label>
                   <input type="text" value={profileData.password} onChange={e => setProfileData({...profileData, password: e.target.value})} className="w-full bg-white px-3 py-2 rounded border border-red-200 text-sm outline-none"/>
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg mt-4 flex justify-center gap-2"><Save className="w-4 h-4"/> Simpan</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showConfirmDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100 text-center">
            <CheckCircle className="h-16 w-16 text-indigo-600 mx-auto mb-6 bg-indigo-100 rounded-full p-3" />
            <h3 className="text-lg font-bold">Simpan Perubahan?</h3>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowConfirmDialog(false)} className="flex-1 px-4 py-2.5 bg-gray-100 font-bold rounded-xl">Batal</button>
              <button onClick={processUpdateProfile} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl">Ya, Simpan</button>
            </div>
          </div>
        </div>
      )}

      {statusModal.show && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            {statusModal.type === 'success' ? <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4 bg-green-100 rounded-full p-3"/> : <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4 bg-red-100 rounded-full p-3"/>}
            <h3 className="text-xl font-bold mb-2">{statusModal.title}</h3>
            <p className="text-sm text-gray-500 mb-6">{statusModal.message}</p>
            <button onClick={handleStatusOk} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold shadow-lg">Mengerti</button>
          </div>
        </div>
      )}

    </div>
  )
}

function MenuCard({ icon: Icon, label, color, onClick }) {
  return (
    <button onClick={onClick} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 active:scale-95 transition">
      <div className={`p-3 rounded-full ${color} text-white shadow-md`}><Icon className="w-6 h-6" /></div>
      <span className="text-xs font-medium text-gray-600">{label}</span>
    </button>
  )
}

function EmptyState({ text }) { return <div className="text-center p-6 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400 text-xs">{text}</div> }
function SkeletonList() { return <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse"></div>)}</div> }