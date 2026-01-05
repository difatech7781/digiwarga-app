import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  LogIn, UserPlus, Megaphone, TrendingUp, ShoppingBag, 
  MapPin, ChevronRight, Image as ImageIcon, ShieldAlert,
  ArrowRight, Siren, Bell, ChevronLeft, User,
  ShieldCheck, Users, Vote, Box, Store, Phone, Info,
  Menu, Wallet, Video // Icon tambahan
} from 'lucide-react'
import BrandHeader from '../components/BrandHeader'
import VendorFooter from '../components/VendorFooter'

export default function Landing() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // STATE TAB KABAR
  const [activeNewsTab, setActiveNewsTab] = useState('DARURAT') 
  const [newsPage, setNewsPage] = useState(1)
  
  // LOGIC: Capture Tenant ID
  const queryParams = new URLSearchParams(window.location.search);
  const urlTenant = queryParams.get('rt') || queryParams.get('id');
  const tenantId = urlTenant || localStorage.getItem('dg_tenant_id') || 'UMUM';
  
  useEffect(() => {
    if (urlTenant) localStorage.setItem('dg_tenant_id', urlTenant);
  }, [urlTenant]);

  const apiUrl = localStorage.getItem('dg_api_url');

  // FETCH DATA
  useEffect(() => {
    const fetchLanding = async () => {
      if (!apiUrl) return;
      try {
        const res = await fetch(apiUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'get_landing_data',
            payload: { tenant_id: tenantId }
          })
        });
        const json = await res.json();
        if (json.status === 'success') {
          setData(json.data);
          if (json.data.app_name) {
             const currentConfig = JSON.parse(localStorage.getItem('dg_config') || '{}');
             currentConfig.APP_NAME = json.data.app_name;
             localStorage.setItem('dg_config', JSON.stringify(currentConfig));
          }
        }
      } catch (e) {
        console.error("Landing Load Error", e);
      } finally {
        setLoading(false);
      }
    }
    fetchLanding();
  }, [apiUrl, tenantId]);

  // FILTER BERITA
  const getNewsData = () => {
    if (!data?.news) return { emergency: [], regular: [] };
    const emergencyCats = ['DARURAT', 'KEBAKARAN', 'KAMTIBMAS', 'MEDIS', 'BENCANA'];
    const emergency = data.news.filter(item => emergencyCats.includes(item.category) || item.is_panic === true);
    const regular = data.news.filter(item => !emergencyCats.includes(item.category) && item.is_panic !== true);
    return { emergency, regular };
  }

  const { emergency, regular } = getNewsData();
  const ITEMS_PER_PAGE = 3;
  const paginatedRegular = regular.slice((newsPage - 1) * ITEMS_PER_PAGE, newsPage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(regular.length / ITEMS_PER_PAGE);

  useEffect(() => {
    if (data && emergency.length === 0 && regular.length > 0) setActiveNewsTab('REGULER');
  }, [data]);

  const getImgUrl = (src) => {
    if (!src) return "https://placehold.co/800x600/1e40af/ffffff?text=DigiWarga";
    if (!src.startsWith('http')) return `https://drive.google.com/uc?export=view&id=${src}`;
    const match = src.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return (match && match[1]) ? `https://drive.google.com/uc?export=view&id=${match[1]}` : src;
  }
  const fmtRp = (n) => "Rp " + Number(n).toLocaleString('id-ID');

  // --- QUICK FEATURES CONFIG ---
  const quickFeatures = [
    { label: 'CCTV', icon: Video, link: '/cctv', color: 'bg-red-600' },
    { label: 'Ronda', icon: ShieldCheck, link: '/ronda', color: 'bg-slate-700' },
    { label: 'Tamu', icon: Users, link: '/tamu', color: 'bg-pink-600' },
    { label: 'Vote', icon: Vote, link: '/vote', color: 'bg-teal-600' },
    { label: 'Aset', icon: Box, link: '/aset', color: 'bg-indigo-500' },
    { label: 'Lapak', icon: Store, link: '/market', color: 'bg-orange-600' },
    { label: 'Info', icon: Phone, link: '/info', color: 'bg-green-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-10 font-sans">
      
      {/* 1. HEADER (LOGO IMAGE & ICONS) */}
      <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-50 flex justify-between items-center">
         <div className="flex items-center gap-3">
            {/* Logo Image */}
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-10 w-10 object-contain"
              onError={(e) => {
                e.target.style.display='none';
                e.target.nextSibling.style.display='flex';
              }} 
            />
            {/* Fallback jika logo.png tidak ada */}
            <div className="h-10 w-10 bg-blue-600 rounded-full hidden items-center justify-center text-white font-bold text-xs shadow-md">DW</div>
            
            <div className="leading-tight">
               <h1 className="text-sm font-extrabold text-gray-800 tracking-tight">{data?.app_name || "DigiWarga"}</h1>
               <p className="text-[10px] text-gray-500 font-medium">Sistem RT Digital</p>
            </div>
         </div>
         <div className="flex gap-2">
            <button 
              onClick={() => navigate('/login')} 
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" /> Masuk
            </button>
            <button 
              onClick={() => navigate('/register')} 
              className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow hover:bg-blue-700 transition flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" /> Daftar
            </button>
         </div>
      </div>

      {/* 2. HERO SECTION (CAROUSEL BACKGROUND) */}
      <div className="relative bg-gray-900 h-[280px]">
         
         {/* Carousel Background Layer */}
         <div className="absolute inset-0 z-0">
            {data?.gallery && data.gallery.length > 0 ? (
               <div className="flex overflow-x-auto snap-x snap-mandatory gap-0 no-scrollbar h-full w-full">
                  {data.gallery.map((imgId, idx) => (
                     <div key={idx} className="snap-center shrink-0 w-full h-full relative">
                        <img 
                          src={getImgUrl(imgId)} 
                          className="w-full h-full object-cover opacity-80" 
                          loading="lazy" 
                        />
                        {/* Dark Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80"></div>
                     </div>
                  ))}
               </div>
            ) : (
               <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-white/20"/>
               </div>
            )}
         </div>

         {/* Content Overlay (Text & Badge) */}
         <div className="absolute top-6 left-4 z-10">
            <span className="bg-white/20 backdrop-blur-md border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit mb-2">
               <ImageIcon className="w-3 h-3"/> Kegiatan Terbaru
            </span>
         </div>

         {/* Floating Finance Card (Overlapping) */}
         <div className="absolute -bottom-12 left-4 right-4 z-20">
            {data?.finance ? (
               <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 flex flex-col gap-3 animate-slide-up">
                  
                  {/* Saldo Utama */}
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                     <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                           <Wallet className="w-3 h-3"/> Saldo Kas RT
                        </p>
                        <h2 className="text-2xl font-black text-gray-800 tracking-tight">{fmtRp(data.finance.balance)}</h2>
                     </div>
                     
                     {/* Progress Circle (Visual Only) */}
                     <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                           <circle cx="24" cy="24" r="20" stroke="#f3f4f6" strokeWidth="4" fill="none" />
                           <circle cx="24" cy="24" r="20" stroke="#10b981" strokeWidth="4" fill="none" strokeDasharray="125" strokeDashoffset={125 - (125 * data.finance.target_progress) / 100} strokeLinecap="round" />
                        </svg>
                        <span className="absolute text-[10px] font-bold text-green-600">{data.finance.target_progress}%</span>
                     </div>
                  </div>

                  {/* Detail In/Out */}
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <p className="text-[10px] text-gray-400 mb-0.5">Pemasukan</p>
                        <p className="text-xs font-bold text-green-600 flex items-center gap-1">
                           <TrendingUp className="w-3 h-3"/> {fmtRp(data.finance.income)}
                        </p>
                     </div>
                     <div>
                        <p className="text-[10px] text-gray-400 mb-0.5">Pengeluaran</p>
                        <p className="text-xs font-bold text-red-500 flex items-center gap-1">
                           <TrendingUp className="w-3 h-3 rotate-180"/> {fmtRp(data.finance.expense)}
                        </p>
                     </div>
                  </div>
               </div>
            ) : (
               <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center">
                  <p className="text-xs text-gray-400 font-medium">Data keuangan sedang diperbarui...</p>
               </div>
            )}
         </div>
      </div>

      {/* Spacer for Floating Card */}
      <div className="h-16 bg-gray-50"></div>

      <div className="px-4 space-y-8 pt-4 pb-12">

         {/* 3. QUICK FEATURES (STORIES SCROLL) */}
         <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 pl-1">Menu Cepat</h3>
            <div className="flex overflow-x-auto snap-x gap-4 pb-2 no-scrollbar px-1">
               {quickFeatures.map((feat, idx) => (
                  <button key={idx} onClick={() => navigate(feat.link)} className="snap-start shrink-0 flex flex-col items-center gap-2 group min-w-[64px]">
                     <div className={`w-14 h-14 ${feat.color} rounded-[20px] flex items-center justify-center text-white shadow-lg shadow-gray-200 group-active:scale-90 transition-transform duration-200`}>
                        <feat.icon className="w-6 h-6" />
                     </div>
                     <span className="text-[10px] font-bold text-gray-600 group-hover:text-blue-600 transition-colors">{feat.label}</span>
                  </button>
               ))}
            </div>
         </div>

         {/* 4. KABAR LINGKUNGAN (TABS) */}
         <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-100 bg-gray-50/50">
               <button onClick={() => setActiveNewsTab('DARURAT')} className={`flex-1 py-3 text-[10px] font-bold flex items-center justify-center gap-2 transition ${activeNewsTab==='DARURAT' ? 'bg-white text-red-600 border-b-2 border-red-600 shadow-sm' : 'text-gray-400 hover:bg-gray-100'}`}>
                 <Siren className={`w-4 h-4 ${activeNewsTab==='DARURAT'?'animate-pulse':''}`}/> DARURAT ({emergency.length})
               </button>
               <button onClick={() => setActiveNewsTab('REGULER')} className={`flex-1 py-3 text-[10px] font-bold flex items-center justify-center gap-2 transition ${activeNewsTab==='REGULER' ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm' : 'text-gray-400 hover:bg-gray-100'}`}>
                 <Bell className="w-4 h-4"/> INFO WARGA
               </button>
            </div>

            <div className="min-h-[180px] p-1 bg-white">
               {loading ? <div className="p-8 text-center text-[10px] text-gray-400 flex flex-col items-center gap-2"><Siren className="w-6 h-6 animate-spin text-gray-300"/>Memuat data...</div> : (
                  <>
                     {activeNewsTab === 'DARURAT' && (
                         <div className="space-y-3 p-3">
                            {emergency.length > 0 ? emergency.map((item, idx) => (
                               <div key={idx} className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm animate-pulse">
                                  <div className="flex justify-between items-center mb-1">
                                     <span className="bg-red-200 text-red-800 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide">{item.category}</span>
                                     <span className="text-[10px] text-red-400 font-mono">{new Date(item.date).toLocaleDateString('id-ID')}</span>
                                  </div>
                                  <p className="font-bold text-sm text-red-900 leading-snug mt-1">{item.message}</p>
                                  {item.source === 'LAPORAN WARGA' && <div className="mt-2 text-[9px] text-red-400 flex items-center gap-1"><User className="w-3 h-3"/> Laporan Warga</div>}
                               </div>
                            )) : <div className="text-center py-10 text-[10px] text-gray-400 flex flex-col items-center"><ShieldCheck className="w-10 h-10 text-green-500 mb-2 opacity-50"/>Alhamdulillah, Lingkungan Aman.</div>}
                         </div>
                     )}

                     {activeNewsTab === 'REGULER' && (
                         <div>
                            <div className="divide-y divide-gray-50">
                               {paginatedRegular.length > 0 ? paginatedRegular.map((item, idx) => (
                                  <div key={idx} className="p-4 hover:bg-gray-50 transition flex gap-3 items-start">
                                     <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-1 ${item.source==='INFO PENGURUS'?'bg-blue-100 text-blue-600':'bg-orange-100 text-orange-600'}`}>
                                        {item.source==='INFO PENGURUS' ? <Megaphone className="w-5 h-5"/> : <User className="w-5 h-5"/>}
                                     </div>
                                     <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                           <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">{item.category}</span>
                                           <span className="text-[10px] text-gray-400 font-mono">{new Date(item.date).toLocaleDateString('id-ID', {day:'numeric', month:'short'})}</span>
                                        </div>
                                        <p className="text-xs text-gray-700 leading-relaxed font-medium">{item.message}</p>
                                     </div>
                                  </div>
                               )) : <div className="text-center py-10 text-[10px] text-gray-400">Belum ada info baru.</div>}
                            </div>
                            {regular.length > ITEMS_PER_PAGE && (
                               <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100 bg-gray-50">
                                  <button disabled={newsPage===1} onClick={()=>setNewsPage(p=>p-1)} className="p-1.5 rounded-lg bg-white border shadow-sm hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4 text-gray-600"/></button>
                                  <span className="text-[10px] font-bold text-gray-500">Halaman {newsPage}/{totalPages}</span>
                                  <button disabled={newsPage===totalPages} onClick={()=>setNewsPage(p=>p+1)} className="p-1.5 rounded-lg bg-white border shadow-sm hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-4 h-4 text-gray-600"/></button>
                               </div>
                            )}
                         </div>
                     )}
                  </>
               )}
            </div>
         </div>

         {/* 5. MARKET TEASER (HORIZONTAL CARD) */}
         <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
            <div className="flex justify-between items-center mb-4">
               <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-orange-100 rounded-lg text-orange-600"><ShoppingBag className="w-4 h-4"/></div>
                  <h3 className="text-sm font-bold text-gray-800">Lapak Warga</h3>
               </div>
               <button onClick={() => navigate('/market')} className="text-[10px] text-orange-600 font-bold flex items-center gap-1 hover:underline">
                 Lihat Semua <ArrowRight className="w-3 h-3"/>
               </button>
            </div>

            <div className="flex overflow-x-auto snap-x gap-3 pb-2 no-scrollbar">
               {loading ? <div className="w-full text-center py-4 text-[10px] text-gray-400">Memuat lapak...</div> : 
                  data?.market?.length > 0 ? data.market.map((item, idx) => (
                     <div key={idx} className="snap-start shrink-0 w-36 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:shadow-md transition">
                        <div className="h-28 w-full bg-gray-100 relative overflow-hidden">
                           <img src={getImgUrl(item.image)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                           <div className="absolute top-1 right-1 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-bold shadow-sm uppercase text-gray-600">{item.type}</div>
                        </div>
                        <div className="p-2.5 flex-1 flex flex-col">
                           <h4 className="text-[11px] font-bold text-gray-800 line-clamp-2 mb-1 leading-snug">{item.title}</h4>
                           <p className="text-xs text-orange-600 font-black mt-auto">{fmtRp(item.price)}</p>
                        </div>
                     </div>
                  )) : (
                     <div className="w-full text-center py-8 border-2 border-dashed border-gray-100 rounded-xl text-gray-400 text-[10px] bg-gray-50">
                        Belum ada yang jualan hari ini.
                     </div>
                  )
               }
            </div>
         </div>

      </div>

      <div className="mt-6 pt-4 pb-2 border-t border-gray-100 bg-gray-50">
         <VendorFooter theme="light" />
      </div>

    </div>
  )
}