import { useState, useEffect } from 'react'
import { 
  CheckCircle, XCircle, DollarSign, FileText, Loader2, 
  Lock, Users, Megaphone, Send, UserCheck, UserX,
  Upload, Edit, Trash2, Search, Save, Shield,
  ArrowLeft, Database, Settings, Filter, Menu, LogOut,
  ChevronLeft, ChevronRight, AlertTriangle, Eye, Calendar,
  Info, AlertCircle, Download // [BARU] Import Download Icon
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// Import Footer Konsisten
import VendorFooter from '../components/VendorFooter'

export default function AdminPanel() {
  const navigate = useNavigate()
  
  // Ambil URL API dari LocalStorage
  const apiUrl = localStorage.getItem('dg_api_url')
  
  // ==========================================
  // 1. STATE MANAGEMENT & CONFIG
  // ==========================================

  // --- User & Role Data ---
  const adminUser = JSON.parse(localStorage.getItem('dg_user') || '{}')
  const myRole = adminUser.role || 'ADMIN' 
  const isSuperAdmin = myRole === 'SUPERADMIN'
  const myRT = adminUser.rt_code || ''

  // [BARU] Baca Config RBAC
  const rbac = JSON.parse(localStorage.getItem('dg_rbac') || '{}');
  const canImport = rbac.can_import || ['SUPERADMIN'];
  
  // --- Keamanan (PIN Access) ---
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const SECRET_PIN = "7781" // PIN Rahasia Admin

  // --- Data Utama ---
  const [dashboardStats, setDashboardStats] = useState({ 
    payments: [], docs: [], pending_users: [], stats: {} 
  })
  const [listData, setListData] = useState([]) 
  
  // --- Loading States ---
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(null) 
  
  // --- Navigasi Tab ---
  const [activeTab, setActiveTab] = useState('DASHBOARD') 
  
  // --- Filter & Search ---
  const [searchTerm, setSearchTerm] = useState('')
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString())
  
  // --- Paginasi ---
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // --- Fitur Broadcast ---
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [sendingBc, setSendingBc] = useState(false)
  
  // --- Fitur Import ---
  const [showImport, setShowImport] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importing, setImporting] = useState(false)
  
  // --- Fitur Edit (UNIVERSAL) ---
  const [editingItem, setEditingItem] = useState(null); 

  // --- Fitur Generate Tenant ---
  const [showGenerate, setShowGenerate] = useState(false)
  const [newTenant, setNewTenant] = useState({ tenant_id: '', rt_name: '' })
  const [generating, setGenerating] = useState(false)

  // --- TOAST NOTIFICATION SYSTEM (PENGGANTI ALERT JADUL) ---
  const [toasts, setToasts] = useState([])
  const showToast = (message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => removeToast(id), 3000)
  }
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  // ==========================================
  // 2. LIFECYCLE & EFFECTS
  // ==========================================

  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm('');
    setListData([]); 
  }, [activeTab, yearFilter]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('dg_user') || '{}');
    const rbacLocal = JSON.parse(localStorage.getItem('dg_rbac') || '{}'); 
    
    if (!user.id) { navigate('/'); return; }
    
    const allowedRoles = rbacLocal.admin_access || ['SUPERADMIN', 'ADMIN', 'OPERATOR'];
    if (!allowedRoles.includes(user.role)) {
      alert(`⛔ AKSES DITOLAK: Role ${user.role} tidak memiliki izin.`);
      navigate('/dashboard'); 
      return;
    }

    const session = sessionStorage.getItem('admin_session');
    if (session === 'valid') {
        setIsAuthenticated(true);
    }
  }, [navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === 'DASHBOARD') {
        fetchDashboardStats();
    } else {
        fetchGenericData(activeTab);
    }
  }, [activeTab, isAuthenticated, yearFilter]);

  // ==========================================
  // 3. HELPER FUNCTIONS
  // ==========================================

  const getKeperluan = (docItem) => {
    try {
      if (docItem.details && docItem.details.keperluan) return docItem.details.keperluan;
      if (typeof docItem.input_data === 'string') {
        const parsed = JSON.parse(docItem.input_data);
        return parsed.keperluan || '-';
      }
      if (typeof docItem.input_data === 'object') return docItem.input_data?.keperluan || '-';
      return '-';
    } catch (e) { return '-'; }
  }

  const formatDateIndo = (dateStr) => {
    if (!dateStr) return '-';
    try {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(date);
    } catch (e) { return dateStr; }
  }

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(Number(amount) || 0);
  }

  // [BARU] FUNGSI DOWNLOAD TEMPLATE CSV
  const handleDownloadTemplate = () => {
    const headers = "fullname,phone,password,address,role\n";
    const sample = "Budi Santoso,62812345678,123456,Blok A1 No 5,WARGA";
    const blob = new Blob([headers + sample], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_warga.csv';
    a.click();
  }

  // ==========================================
  // 4. API CALLS & DATA FETCHING
  // ==========================================

  const fetchDashboardStats = async () => {
    setLoading(true)
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({ 
            action: 'get_admin_data', 
            payload: { 
                requestor_role: myRole, 
                requestor_rt: myRT,
                tenant_id: localStorage.getItem('dg_tenant_id')
            } 
        })
      })
      const json = await res.json()
      setDashboardStats(json.data || json)
    } catch (err) { 
        showToast("Gagal memuat dashboard", "error")
        console.error("Dashboard Fetch Error:", err)
    } finally { 
        setLoading(false) 
    }
  }

  const fetchGenericData = async (type) => {
    setLoading(true)
    try {
      let payload = {};
      let actionName = 'manage_data'; 

      if (type === 'WARGA') {
        actionName = 'manage_users';
        payload = { type: 'LIST', requestor_role: myRole }; 
      } else {
        payload = { type: type, action_type: 'LIST', year: yearFilter, requestor_role: myRole }; 
      }
      
      payload.tenant_id = localStorage.getItem('dg_tenant_id');

      const res = await fetch(apiUrl, { 
          method: 'POST', 
          body: JSON.stringify({ action: actionName, payload: payload }) 
      })
      const json = await res.json()
      
      if (json.status === 'success') {
        setListData(json.data || [])
        if(json.data && json.data.length === 0) showToast("Data kosong / tidak ditemukan", "info")
      } else {
        showToast(json.message || "Gagal memuat data", "error")
        setListData([]) 
      }
    } catch (err) { 
      console.error("Fetch Generic Error:", err)
      showToast("Koneksi gagal. Cek internet.", "error")
    } finally { 
      setLoading(false) 
    }
  }

  // ==========================================
  // 5. ACTION HANDLERS (LOGIC)
  // ==========================================

  const handleLogin = (e) => {
    e.preventDefault()
    if (pinInput === SECRET_PIN) {
      sessionStorage.setItem('admin_session', 'valid')
      setIsAuthenticated(true)
    } else { 
      setErrorMsg('PIN Salah! Akses ditolak.')
      setPinInput('') 
    }
  }

  const handleLogout = () => { 
    sessionStorage.removeItem('admin_session'); 
    setIsAuthenticated(false) 
  }

  const handleAction = async (itemType, id, action) => {
    if (myRole === 'OPERATOR' && (action === 'REJECT' || action === 'DELETE')) {
        return showToast("Operator hanya akses View/Approve.", "error");
    }
    
    if(!confirm(`Yakin ${action}?`)) return;
    
    setProcessing(id) 
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'admin_action',
          payload: { 
              type: itemType, id, action, requestor_role: myRole,
              tenant_id: localStorage.getItem('dg_tenant_id')
          }
        })
      })
      const json = await res.json()
      
      if(json.status === 'success') {
        showToast("Berhasil diproses!", "success")
        if(activeTab === 'DASHBOARD') fetchDashboardStats()
        else fetchGenericData(activeTab)
      } else {
        showToast("Gagal: " + json.message, "error")
      }
    } catch(err) { 
        showToast("Error koneksi.", "error")
    } finally { 
        setProcessing(null) 
    }
  }

  const handleSaveItem = async (e) => {
    e.preventDefault(); 
    if(!confirm("Simpan perubahan?")) return;
    
    let actionName = 'manage_data';
    let payload = { 
        type: activeTab, 
        action_type: 'UPDATE', 
        id: editingItem.id, 
        data: editingItem, 
        requestor_role: myRole,
        tenant_id: localStorage.getItem('dg_tenant_id')
    };

    if (activeTab === 'WARGA') {
        actionName = 'manage_users';
        payload = { 
            type: 'UPDATE', 
            id: editingItem.id, 
            data: editingItem, 
            requestor_role: myRole,
            tenant_id: localStorage.getItem('dg_tenant_id')
        };
    }

    try {
      const res = await fetch(apiUrl, { 
          method: 'POST', 
          body: JSON.stringify({ action: actionName, payload: payload }) 
      });
      const json = await res.json(); 
      
      if(json.status === 'success') { 
        showToast("Data tersimpan!", "success");
        setEditingItem(null); 
        fetchGenericData(activeTab); 
      } else {
        showToast("Gagal: " + json.message, "error");
      }
    } catch(err) { 
        showToast("Error koneksi.", "error");
    }
  };

  const handleDeleteItem = async (id, name) => {
    if(!confirm(`HAPUS PERMANEN "${name || id}"?`)) return;
    
    let actionName = 'manage_data';
    let payload = { 
        type: activeTab, 
        action_type: 'DELETE', 
        id: id, 
        requestor_role: myRole,
        tenant_id: localStorage.getItem('dg_tenant_id')
    };

    if (activeTab === 'WARGA') {
        actionName = 'manage_users';
        payload = { 
            type: 'DELETE', id: id, requestor_role: myRole, 
            tenant_id: localStorage.getItem('dg_tenant_id')
        };
    }

    try {
      const res = await fetch(apiUrl, { 
          method: 'POST', 
          body: JSON.stringify({ action: actionName, payload: payload }) 
      });
      const json = await res.json(); 
      if(json.status === 'success') { 
          showToast("Data terhapus.", "success");
          fetchGenericData(activeTab); 
      } else {
          showToast("Gagal hapus: " + json.message, "error");
      }
    } catch(err) { 
        showToast("Error koneksi.", "error");
    }
  };

  const handleGenerateTenant = async (e) => {
    e.preventDefault();
    if(!newTenant.tenant_id || !newTenant.rt_name) return showToast("Isi semua data!", "error");
    if(!confirm(`Buat database baru untuk ${newTenant.rt_name}?`)) return;

    setGenerating(true);
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'manage_data',
          payload: {
            type: 'TENANT',
            action_type: 'CREATE',
            data: newTenant,
            requestor_role: myRole,
            tenant_id: localStorage.getItem('dg_tenant_id')
          }
        })
      });
      const json = await res.json();
      if(json.status === 'success') {
        showToast("Tenant berhasil dibuat!", "success");
        setShowGenerate(false);
        setNewTenant({ tenant_id: '', rt_name: '' });
        fetchGenericData('TENANT'); 
      } else {
        showToast(json.message, "error");
      }
    } catch(err) {
      showToast("Error: " + err.message, "error");
    } finally {
      setGenerating(false);
    }
  }

  const handleBroadcast = async (e) => {
    e.preventDefault(); 
    if(!confirm('Kirim Broadcast?')) return;
    
    setSendingBc(true)
    try {
      const res = await fetch(apiUrl, { 
          method: 'POST', 
          body: JSON.stringify({ 
              action: 'broadcast_message', 
              payload: { 
                  message: broadcastMsg, author_id: myRole, category: 'INFO',
                  tenant_id: localStorage.getItem('dg_tenant_id')
              } 
          }) 
      });
      const json = await res.json(); 
      showToast(json.message || 'Broadcast Terkirim', "success");
      setShowBroadcast(false); 
      setBroadcastMsg('');
      if(activeTab === 'BROADCAST') fetchGenericData('BROADCAST');
    } catch(err) { 
        showToast('Gagal kirim broadcast.', "error");
    } finally { 
        setSendingBc(false); 
    }
  }

  const handleImport = async (e) => {
    e.preventDefault(); 
    if (!importFile) return showToast("Pilih file CSV!", "error");
    
    setImporting(true)
    const reader = new FileReader(); 
    reader.readAsDataURL(importFile);
    
    reader.onload = async () => {
      try {
        const res = await fetch(apiUrl, { 
            method: 'POST', 
            body: JSON.stringify({ 
                action: 'import_users', 
                payload: { 
                    file_base64: reader.result,
                    tenant_id: localStorage.getItem('dg_tenant_id')
                } 
            }) 
        })
        const json = await res.json()
        if (json.status === 'success') {
          showToast(json.message, "success")
          setShowImport(false)
          setImportFile(null)
          if(activeTab === 'WARGA') fetchGenericData('WARGA');
        } else {
          showToast("Gagal Import: " + json.message, "error")
        }
      } catch (err) { 
          showToast("System Error: " + err.message, "error")
      } finally { 
          setImporting(false) 
      }
    }
  }

  // ==========================================
  // 6. RENDER: LOGIN SCREEN (LOCK)
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-gray-700" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-6">Restricted Area</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              value={pinInput} 
              onChange={(e) => setPinInput(e.target.value)} 
              placeholder="Masukkan PIN Admin" 
              className="w-full text-center py-3 bg-gray-50 border rounded-xl text-lg tracking-widest outline-none focus:ring-2 focus:ring-gray-900" 
              autoFocus 
            />
            {errorMsg && <p className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded">{errorMsg}</p>}
            <button className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition">
                Buka Panel 🔓
            </button>
          </form>
          <button onClick={() => navigate('/dashboard')} className="mt-6 text-xs text-gray-400 flex items-center justify-center gap-1 mx-auto hover:text-gray-600 transition">
              <ArrowLeft className="w-3 h-3"/> Kembali ke Dashboard Warga
          </button>
        </div>
      </div>
    )
  }

  // ==========================================
  // 7. RENDER: ADMIN PANEL UTAMA
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col pb-10">
      
      {/* --- HEADER SECTION --- */}
      <div className="bg-gray-900 text-white shadow-lg sticky top-0 z-30">
        <div className="p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center justify-between w-full md:w-auto">
             <div className="flex items-center gap-3">
               <button onClick={() => navigate('/dashboard')} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-300 transition" title="Kembali">
                 <ArrowLeft className="w-5 h-5"/>
               </button>
               <button onClick={handleLogout} className="p-2 hover:bg-white/20 rounded-full text-red-300 transition" title="Logout">
                 <LogOut className="w-5 h-5"/>
               </button>
               <div>
                 <h1 className="text-lg md:text-xl font-bold flex items-center gap-2">
                    <Shield className="w-5 h-5 text-orange-400"/> COMMAND CENTER
                 </h1>
                 <div className="flex gap-2 text-[10px] items-center">
                   <span className="text-gray-400 hidden sm:inline">DIGIWARGA SYSTEM v6.8</span>
                   <span className="bg-blue-600 px-2 rounded font-bold uppercase">{myRole}</span>
                 </div>
               </div>
             </div>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
             <button onClick={() => setShowBroadcast(!showBroadcast)} className="flex-1 md:flex-none text-xs bg-indigo-600 px-3 py-2 rounded hover:bg-indigo-500 flex items-center justify-center gap-2 whitespace-nowrap shadow-lg transition">
               <Megaphone className="w-3 h-3"/> Broadcast
             </button>
             <button onClick={() => activeTab === 'DASHBOARD' ? fetchDashboardStats() : fetchGenericData(activeTab)} className="flex-1 md:flex-none text-xs bg-gray-800 px-3 py-2 rounded hover:bg-gray-700 border border-gray-700 transition">
               Refresh Data
             </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto px-4 gap-2 text-sm font-medium border-t border-gray-800 scrollbar-hide bg-gray-900/50 py-2">
           <TabBtn id="DASHBOARD" label="Overview" icon={CheckCircle} activeTab={activeTab} setActiveTab={setActiveTab}/>
           <TabBtn id="WARGA" label="Warga" icon={Users} activeTab={activeTab} setActiveTab={setActiveTab}/>
           <TabBtn id="PAYMENT" label="Iuran" icon={DollarSign} activeTab={activeTab} setActiveTab={setActiveTab}/>
           <TabBtn id="BROADCAST" label="Info" icon={Megaphone} activeTab={activeTab} setActiveTab={setActiveTab}/>
           <TabBtn id="REPORT" label="Lapor" icon={FileText} activeTab={activeTab} setActiveTab={setActiveTab}/>
           {isSuperAdmin && (
             <>
               <div className="w-[1px] bg-gray-700 mx-2"></div>
               <TabBtn id="TENANT" label="Tenant" icon={Database} activeTab={activeTab} setActiveTab={setActiveTab}/>
               <TabBtn id="CONFIG" label="Config" icon={Settings} activeTab={activeTab} setActiveTab={setActiveTab}/>
             </>
           )}
        </div>
      </div>

      {/* --- BROADCAST INPUT PANEL --- */}
      {showBroadcast && (
        <div className="bg-indigo-900 p-4 text-white shadow-inner animate-fade-in border-b border-indigo-800">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-2">
            <input value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} placeholder="Tulis pesan pengumuman..." className="flex-1 px-4 py-2 rounded text-gray-900 text-sm outline-none shadow-inner focus:ring-2 focus:ring-indigo-400"/>
            <button onClick={handleBroadcast} disabled={sendingBc} className="bg-indigo-500 px-6 py-2 rounded font-bold text-xs flex items-center justify-center gap-2 hover:bg-indigo-400 shadow-lg disabled:opacity-50">
               {sendingBc ? <Loader2 className="w-3 h-3 animate-spin"/> : <Send className="w-3 h-3"/>} Kirim
            </button>
          </div>
        </div>
      )}

      {/* --- CONTENT AREA START --- */}
      <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 mt-2 flex-1">
        
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6 animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <StatCard label="Total Kas Masuk" value={formatRupiah(dashboardStats.stats?.kas_masuk || 0)} icon={DollarSign} color="green" />
              <StatCard label="Total Warga" value={dashboardStats.stats?.total_warga || 0} icon={Users} color="blue" />
              <StatCard label="Pending Task" value={dashboardStats.stats?.pending_tasks || 0} icon={CheckCircle} color="orange" />
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <PendingSection title="Warga Baru Daftar" count={dashboardStats.pending_users?.length} color="purple">
                  {dashboardStats.pending_users?.map(u => (
                    <Card key={u.user_id} color="purple">
                      <div className="flex justify-between"><h4 className="font-bold text-sm">{u.fullname}</h4><span className="text-[10px] bg-gray-100 px-1 rounded">{u.rt_code}</span></div>
                      <p className="text-xs text-gray-500 mb-2">{u.phone}</p>
                      <ActionButtons id={u.user_id} type="USER" loading={processing} onAction={handleAction} />
                    </Card>
                  ))}
                </PendingSection>

                <PendingSection title="Verifikasi Iuran" count={dashboardStats.payments?.length} color="green">
                  {dashboardStats.payments?.map(p => (
                    <Card key={p.id} color="green">
                      <div className="flex justify-between items-start mb-2">
                         <div><h4 className="font-bold text-sm">{formatRupiah(p.amount)}</h4><p className="text-[10px] text-gray-500">{p.category} • {p.name}</p></div>
                         {p.proof_url && <a href={p.proof_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 underline hover:text-blue-800">Lihat Bukti</a>}
                      </div>
                      <ActionButtons id={p.id} type="PAYMENT" loading={processing} onAction={handleAction} />
                    </Card>
                  ))}
                </PendingSection>

                <PendingSection title="Permohonan Surat" count={dashboardStats.docs?.length} color="blue">
                  {dashboardStats.docs?.map(d => (
                    <Card key={d.id} color="blue">
                      <h4 className="font-bold text-xs">{d.type}</h4>
                      <p className="text-xs text-gray-500 mb-2 italic bg-gray-50 p-1 rounded">"{getKeperluan(d)}"</p>
                      <p className="text-[10px] text-gray-400 text-right mb-2">Pemohon: {d.name}</p>
                      <div className="flex gap-2">
                        <SimpleBtn onClick={()=>handleAction('DOCUMENT', d.id, 'APPROVE')} color="bg-blue-600" label="Tanda Tangan" loading={processing===d.id}/>
                        <SimpleBtn onClick={()=>handleAction('DOCUMENT', d.id, 'REJECT')} color="bg-red-600" label="Tolak" loading={processing===d.id}/>
                      </div>
                    </Card>
                  ))}
                </PendingSection>
             </div>
          </div>
        )}

        {activeTab !== 'DASHBOARD' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-[500px] animate-fade-in relative">
            <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-3 bg-gray-50/50 rounded-t-xl">
               <div className="flex flex-col md:flex-row gap-3 flex-1">
                 <div className="relative w-full md:w-64">
                   <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400"/>
                   <input type="text" placeholder="Cari data..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"/>
                 </div>
                 {['PAYMENT', 'BROADCAST', 'REPORT'].includes(activeTab) && (
                   <div className="relative w-full md:w-32">
                      <Filter className="w-4 h-4 absolute left-3 top-3 text-gray-400"/>
                      <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none cursor-pointer shadow-sm">
                        {[0,1,2,3].map(i => { const y = new Date().getFullYear() - i; return <option key={y} value={y}>{y}</option> })}
                      </select>
                   </div>
                 )}
                 
                 {/* [BARU] IMPORT BUTTON DENGAN PERMISSION CHECK & LABEL BARU */}
                 {activeTab === 'WARGA' && canImport.includes(myRole) && (
                   <button onClick={() => setShowImport(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-700 flex items-center justify-center gap-2 md:w-auto w-full shadow-sm transition"><Upload className="w-4 h-4"/> Import Data Warga</button>
                 )}
                 {activeTab === 'TENANT' && isSuperAdmin && (
                   <button onClick={() => setShowGenerate(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center justify-center gap-2 md:w-auto w-full shadow-sm transition"><Database className="w-4 h-4"/> Generate Baru</button>
                 )}
               </div>
            </div>

            <div className="flex-1 overflow-x-auto relative">
               {loading ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-2"/>
                    <p className="text-gray-500 text-sm font-medium">Memuat Data...</p>
                 </div>
               ) : (
                 <GenericTable 
                   type={activeTab} 
                   data={listData} 
                   search={searchTerm} 
                   page={currentPage} 
                   limit={itemsPerPage}
                   onDelete={handleDeleteItem}
                   onEdit={setEditingItem}
                   formatRupiah={formatRupiah}
                   formatDateIndo={formatDateIndo}
                 />
               )}
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-b-xl">
               <span className="text-xs text-gray-500 font-medium">Halaman {currentPage}</span>
               <div className="flex gap-2">
                 <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 text-xs border bg-white rounded hover:bg-gray-100 disabled:opacity-50 flex items-center gap-1"><ChevronLeft className="w-3 h-3"/> Prev</button>
                 <button onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 text-xs border bg-white rounded hover:bg-gray-100 disabled:opacity-50 flex items-center gap-1">Next <ChevronRight className="w-3 h-3"/></button>
               </div>
            </div>
          </div>
        )}

      </div>

      {editingItem && <UniversalEditModal type={activeTab} item={editingItem} onClose={()=>setEditingItem(null)} onSave={handleSaveItem} setItem={setEditingItem}/>}
      
      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Upload className="w-5 h-5 text-green-600"/> Import Data Warga</h3>
            
            {/* [BARU] DOWNLOAD TEMPLATE SECTION */}
            <div className="flex justify-between items-center mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                <span className="text-xs text-blue-700 font-semibold">Butuh template data?</span>
                <button 
                  onClick={handleDownloadTemplate} 
                  className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-bold rounded flex items-center gap-1 transition"
                >
                  <Download className="w-3 h-3"/> Download CSV
                </button>
            </div>

            <div className="bg-gray-50 p-3 rounded text-xs text-gray-600 mb-4 border border-gray-200">
                <p className="font-bold mb-1">Panduan:</p>
                <p>Isi file CSV dengan header: <span className="font-mono bg-gray-200 px-1 rounded">fullname,phone,password,address,role</span></p>
            </div>

            <input type="file" accept=".csv" onChange={(e) => setImportFile(e.target.files[0])} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-4"/>
            <div className="flex justify-end gap-2 border-t pt-4">
              <button onClick={() => setShowImport(false)} className="px-4 py-2 text-gray-500 text-xs font-bold hover:bg-gray-100 rounded">Batal</button>
              <button onClick={handleImport} disabled={importing} className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                  {importing ? <Loader2 className="w-3 h-3 animate-spin"/> : <Upload className="w-3 h-3"/>} {importing ? 'Mengupload...' : 'Upload Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showGenerate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800"><Database className="w-5 h-5 text-blue-600"/> Setup RT Baru</h3>
            <div className="bg-blue-50 p-3 rounded text-xs text-blue-700 mb-4 border border-blue-100">
                <p className="font-bold">Otomatisasi:</p>
                <ul className="list-disc ml-4 mt-1">
                    <li>Database Sheet baru akan dibuat.</li>
                    <li>Sistem akan mendaftarkan ID ke Registry.</li>
                </ul>
            </div>
            <form onSubmit={handleGenerateTenant} className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Kode Unik (Tanpa Spasi)</label>
                    <input value={newTenant.tenant_id} onChange={e=>setNewTenant({...newTenant, tenant_id: e.target.value.replace(/\s+/g, '').toLowerCase()})} className="w-full border p-2.5 rounded-lg text-sm font-mono" placeholder="ex: rt01rw05" required/>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Nama Wilayah</label>
                    <input value={newTenant.rt_name} onChange={e=>setNewTenant({...newTenant, rt_name: e.target.value})} className="w-full border p-2.5 rounded-lg text-sm" placeholder="ex: RT 01 Gunung Sari" required/>
                </div>
                <div className="flex justify-end gap-2 border-t pt-4">
                    <button type="button" onClick={() => setShowGenerate(false)} className="px-4 py-2 text-gray-600 text-xs font-bold bg-gray-100 rounded hover:bg-gray-200">Batal</button>
                    <button type="submit" disabled={generating} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                        {generating ? <Loader2 className="w-3 h-3 animate-spin"/> : <Settings className="w-3 h-3"/>} {generating ? 'Sedang Membuat...' : 'Generate Database'}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION CONTAINER */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="mt-8 border-t pt-6 bg-gray-50">
        <VendorFooter theme="light" />
      </div>

    </div>
  )
}

// ==========================================
// 8. SUB-COMPONENTS
// ==========================================

function GenericTable({ type, data, search, page, limit, onDelete, onEdit, formatRupiah, formatDateIndo }) {
  const filtered = data.filter(item => JSON.stringify(item).toLowerCase().includes(search.toLowerCase()));
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  if (filtered.length === 0) return <div className="p-12 text-center text-gray-400 text-sm flex flex-col items-center"><Database className="w-10 h-10 mb-2 opacity-20"/><p>Data tidak ditemukan.</p></div>;

  const stickyThClass = "sticky left-0 z-20 bg-gray-50 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]";
  const stickyTdClass = "sticky left-0 z-10 bg-white border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]";

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left min-w-[1000px]">
        <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs border-b">
          <tr>
            {type === 'WARGA' && <><th className={`px-4 py-3 ${stickyThClass}`}>Nama Lengkap</th><th className="px-4 py-3">No HP / WA</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status Akun</th></>}
            {type === 'PAYMENT' && <><th className={`px-4 py-3 ${stickyThClass}`}>Tanggal</th><th className="px-4 py-3">Nama Warga</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Jumlah</th><th className="px-4 py-3">Status</th></>}
            {type === 'REPORT' && <><th className={`px-4 py-3 ${stickyThClass}`}>Waktu Lapor</th><th className="px-4 py-3">Pelapor</th><th className="px-4 py-3">Pesan Laporan</th><th className="px-4 py-3">Status</th></>}
            {type === 'BROADCAST' && <><th className={`px-4 py-3 ${stickyThClass}`}>Waktu Kirim</th><th className="px-4 py-3">Isi Pesan</th><th className="px-4 py-3">Kategori</th></>}
            {type === 'TENANT' && <><th className={`px-4 py-3 ${stickyThClass}`}>Nama Tenant</th><th className="px-4 py-3">Kode Unik</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Overdue?</th></>}
            {type === 'CONFIG' && <><th className={`px-4 py-3 ${stickyThClass}`}>Key Config</th><th className="px-4 py-3">Value</th></>}
            <th className="px-4 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {paginated.map((item, idx) => (
            <tr key={idx} className="hover:bg-gray-50 transition group">
               {type === 'WARGA' && <><td className={`px-4 py-3 font-medium text-gray-900 ${stickyTdClass}`}>{item.name}</td><td className="px-4 py-3 font-mono text-gray-500">{item.phone}</td><td className="px-4 py-3"><span className={`px-2 py-1 rounded text-[10px] font-bold ${item.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{item.role}</span></td><td className="px-4 py-3"><Badge val={item.status}/></td></>}
               {type === 'PAYMENT' && <><td className={`px-4 py-3 text-gray-500 ${stickyTdClass}`}>{formatDateIndo(item.date)}</td><td className="px-4 py-3 font-medium">{item.name}</td><td className="px-4 py-3"><span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs">{item.category}</span></td><td className="px-4 py-3 font-bold text-gray-800">{formatRupiah(item.amount)}</td><td className="px-4 py-3"><Badge val={item.status}/></td></>}
               {type === 'REPORT' && <><td className={`px-4 py-3 text-gray-500 ${stickyTdClass}`}>{formatDateIndo(item.timestamp)}</td><td className="px-4 py-3 font-medium">{item.name || item.user_id}</td><td className="px-4 py-3 max-w-xs truncate text-gray-600" title={item.message}>{item.message}</td><td className="px-4 py-3"><Badge val={item.status}/></td></>}
               {type === 'BROADCAST' && <><td className={`px-4 py-3 text-gray-500 ${stickyTdClass}`}>{formatDateIndo(item.timestamp)}</td><td className="px-4 py-3 max-w-xs truncate text-gray-600">{item.message}</td><td className="px-4 py-3"><Badge val={item.category}/></td></>}
               {type === 'TENANT' && <><td className={`px-4 py-3 font-medium ${stickyTdClass}`}>{item.name}</td><td className="px-4 py-3 font-mono">{item.code || item.tenant_id}</td><td className="px-4 py-3"><Badge val={item.status}/></td><td className="px-4 py-3"><span className={`px-2 py-1 rounded text-[10px] font-bold ${item.overdue === 'YES' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{item.overdue || 'NO'}</span></td></>}
               {type === 'CONFIG' && <><td className={`px-4 py-3 font-mono text-xs font-bold ${stickyTdClass}`}>{item.key}</td><td className="px-4 py-3 font-mono text-xs max-w-xs truncate" title={item.value}>{item.value}</td></>}
               <td className="px-4 py-3 flex justify-end gap-2">
                 <button onClick={() => onEdit(item)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition" title="Edit Data"><Edit className="w-4 h-4"/></button>
                 <button onClick={() => onDelete(item.id || item.key, item.name || item.key)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded transition" title="Hapus Data"><Trash2 className="w-4 h-4"/></button>
               </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function UniversalEditModal({ type, item, onClose, onSave, setItem }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-gray-800 border-b pb-4">
            <Edit className="w-5 h-5 text-indigo-600"/> Edit {type}
        </h3>
        <form onSubmit={onSave} className="space-y-4">
          
          {type === 'WARGA' && (
            <>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Nama Lengkap</label><input value={item.name} onChange={e=>setItem({...item,name:e.target.value})} className="w-full border p-2.5 rounded-lg text-sm" required/></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">No HP</label><input value={item.phone} onChange={e=>setItem({...item,phone:e.target.value})} className="w-full border p-2.5 rounded-lg text-sm" required/></div>
              <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Status Akun</label>
                  <select value={item.status} onChange={e=>setItem({...item,status:e.target.value})} className="w-full border p-2.5 rounded-lg text-sm bg-white"><option value="ACTIVE">ACTIVE</option><option value="PENDING">PENDING</option><option value="SUSPEND">SUSPEND</option></select>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-100"><label className="text-xs font-bold text-red-500 uppercase">Reset Password (Opsional)</label><input type="text" value={item.password || ''} onChange={e=>setItem({...item,password:e.target.value})} className="w-full bg-white border border-red-200 p-2 rounded text-sm text-red-600 font-mono mt-1" placeholder="Ketik password baru..."/></div>
            </>
          )}

          {type === 'PAYMENT' && (
            <>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Jumlah (Rp)</label><input type="number" value={item.amount} onChange={e=>setItem({...item,amount:e.target.value})} className="w-full border p-2.5 rounded-lg text-sm" required/></div>
              <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Kategori</label>
                  <select value={item.category} onChange={e=>setItem({...item,category:e.target.value})} className="w-full border p-2.5 rounded-lg text-sm bg-white"><option value="IURAN_WAJIB">Iuran Wajib</option><option value="SUMBANGAN">Sumbangan</option><option value="KEAMANAN">Keamanan</option><option value="KEBERSIHAN">Kebersihan</option><option value="DANA_SOSIAL">Dana Sosial</option><option value="LAINNYA">Lainnya</option></select>
              </div>
              <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Status Pembayaran</label>
                  <select value={item.status} onChange={e=>setItem({...item,status:e.target.value})} className="w-full border p-2.5 rounded-lg text-sm bg-white"><option value="PENDING">PENDING</option><option value="APPROVED">APPROVED</option><option value="REJECTED">REJECTED</option></select>
              </div>
            </>
          )}

          {type === 'CONFIG' && (
            <>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Key (Read Only)</label><input value={item.key} disabled className="w-full border p-2.5 rounded-lg text-sm bg-gray-100 text-gray-500"/></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Value</label><textarea rows={3} value={item.value} onChange={e=>setItem({...item,value:e.target.value})} className="w-full border p-2.5 rounded-lg text-sm" required/></div>
            </>
          )}

          {type === 'BROADCAST' && (
            <>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Pesan Broadcast</label><textarea rows={4} value={item.message} onChange={e=>setItem({...item,message:e.target.value})} className="w-full border p-2.5 rounded-lg text-sm" required/></div>
              <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Kategori</label>
                  <select value={item.category} onChange={e=>setItem({...item,category:e.target.value})} className="w-full border p-2.5 rounded-lg text-sm bg-white"><option value="INFO">INFO</option><option value="PENTING">PENTING</option><option value="DARURAT">DARURAT</option></select>
              </div>
            </>
          )}

          {type === 'TENANT' && (
            <>
              <div><label className="text-xs font-bold text-gray-500 uppercase">ID Tenant</label><input value={item.id} disabled className="w-full border p-2.5 rounded-lg text-sm bg-gray-100 text-gray-500"/></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Nama RT / Wilayah</label><input value={item.name} onChange={e=>setItem({...item,name:e.target.value})} className="w-full border p-2.5 rounded-lg text-sm" required/></div>
              <div className="grid grid-cols-2 gap-2">
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Status Layanan</label>
                      <select value={item.status} onChange={e=>setItem({...item,status:e.target.value})} className="w-full border p-2.5 rounded-lg text-sm bg-white"><option value="ACTIVE">ACTIVE</option><option value="SUSPEND">SUSPEND</option></select>
                  </div>
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Overdue (Tunggakan)</label>
                      <select value={item.overdue || 'NO'} onChange={e=>setItem({...item,overdue:e.target.value})} className="w-full border p-2.5 rounded-lg text-sm bg-white"><option value="NO">LANCAR (NO)</option><option value="YES">NUNGGAK (YES)</option></select>
                  </div>
              </div>
            </>
          )}

          {type === 'REPORT' && (
            <>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Pesan Laporan</label><textarea rows={3} value={item.message} onChange={e=>setItem({...item,message:e.target.value})} className="w-full border p-2.5 rounded-lg text-sm"/></div>
              <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Status Laporan</label>
                  <select value={item.status} onChange={e=>setItem({...item,status:e.target.value})} className="w-full border p-2.5 rounded-lg text-sm bg-white"><option value="OPEN">OPEN</option><option value="RESOLVED">RESOLVED</option><option value="INVALID">INVALID</option></select>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t">
              <button type="button" onClick={onClose} className="px-4 py-2.5 text-gray-600 text-sm font-bold bg-gray-100 rounded-lg hover:bg-gray-200 transition">Batal</button>
              <button type="submit" className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition shadow-lg flex items-center gap-2"><Save className="w-4 h-4"/> Simpan</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TabBtn({ id, label, icon: Icon, activeTab, setActiveTab }) {
  const isActive = activeTab === id;
  return (
    <button onClick={() => setActiveTab(id)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition whitespace-nowrap border ${isActive ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'}`}>
       <Icon className="w-4 h-4"/> {label}
    </button>
  )
}

function StatCard({ label, value, icon: Icon, color }) {
  const c = { green: "bg-green-100 text-green-700", blue: "bg-blue-100 text-blue-700", orange: "bg-orange-100 text-orange-700" }
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition">
      <div><p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{label}</p><p className="text-2xl font-bold text-gray-800 mt-1">{value}</p></div>
      <div className={`p-3 rounded-full ${c[color]}`}><Icon className="w-6 h-6"/></div>
    </div>
  )
}

function Card({ children, color }) {
  const c = { purple: "border-purple-500", green: "border-green-500", blue: "border-blue-500" }
  return <div className={`bg-white p-4 rounded-lg border-l-4 ${c[color]} shadow-sm mb-3 hover:shadow-md transition`}>{children}</div>
}

function PendingSection({ title, count, children }) {
  if (!count) return null;
  return (
    <div className="space-y-2">
        <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2 uppercase tracking-wide"><span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-sm">{count}</span> {title}</h3>
        {children}
    </div>
  )
}

function ActionButtons({ id, type, loading, onAction }) {
  return (
    <div className="flex gap-2 mt-3 pt-2 border-t border-gray-50">
      <SimpleBtn onClick={()=>onAction(type, id, 'APPROVE')} color="bg-green-600 hover:bg-green-700" label="Terima" icon={CheckCircle} loading={loading===id}/>
      <SimpleBtn onClick={()=>onAction(type, id, 'REJECT')} color="bg-red-600 hover:bg-red-700" label="Tolak" icon={XCircle} loading={loading===id}/>
    </div>
  )
}

function SimpleBtn({ onClick, color, label, icon: Icon, loading }) {
  return (
    <button onClick={onClick} disabled={loading} className={`flex-1 py-2 px-3 rounded-lg text-white text-xs font-bold flex items-center justify-center gap-1 transition active:scale-95 shadow-sm ${color} ${loading?'opacity-50 cursor-not-allowed':''}`}>{loading?<Loader2 className="w-3 h-3 animate-spin"/>:<><Icon className="w-3 h-3"/> {label}</>}</button>
  )
}

function Badge({ val }) {
  let c = 'bg-gray-100 text-gray-600';
  if(['APPROVED','ACTIVE','YES','RESOLVED'].includes(val)) c = 'bg-green-100 text-green-700';
  if(['REJECTED','SUSPEND','NO','INVALID','INACTIVE'].includes(val)) c = 'bg-red-100 text-red-700';
  if(['PENDING','OPEN'].includes(val)) c = 'bg-orange-100 text-orange-700';
  return <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${c}`}>{val}</span>
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div key={toast.id} className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-bold animate-fade-in-up ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4"/> : <CheckCircle className="w-4 h-4"/>}
          {toast.message}
          <button onClick={() => removeToast(toast.id)} className="ml-2 opacity-70 hover:opacity-100"><XCircle className="w-4 h-4"/></button>
        </div>
      ))}
    </div>
  )
}