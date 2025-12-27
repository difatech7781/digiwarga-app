import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingBag, PlusCircle, Tag, Loader2, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'

export default function Market() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('dg_user') || '{}')
  const apiUrl = localStorage.getItem('dg_api_url')
  const tenantId = localStorage.getItem('dg_tenant_id') || 'UMUM';

  const [activeTab, setActiveTab] = useState('BUY') // BUY | SELL
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  
  // PAGINATION STATE
  const [page, setPage] = useState(1)
  const ITEMS_PER_PAGE = 5

  // FORM STATE (SELL)
  const [newItem, setNewItem] = useState({ title: '', price: '', type: 'PO_MAKANAN', description: '', quota: '', deadline: '', image: null })
  const [preview, setPreview] = useState(null)
  
  // ORDER STATE
  const [orderModal, setOrderModal] = useState({ show: false, item: null, qty: 1, notes: '' })
  const [statusModal, setStatusModal] = useState({ show: false, type: 'success', title: '', message: '' })
  const [actionLoading, setActionLoading] = useState(false)

  // --- FETCH ITEMS ---
  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'market_action',
          payload: { sub_action: 'LIST_ITEMS', tenant_id: tenantId }
        })
      })
      const json = await res.json()
      setItems(json.data || [])
      setPage(1) // Reset ke halaman 1 saat refresh
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { fetchItems() }, [])

  // --- HANDLERS ---
  const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result); reader.onerror = error => reject(error);
  });

  const handleSellSubmit = async (e) => {
    e.preventDefault()
    if (!newItem.image) return setStatusModal({show:true, type:'error', title:'Gambar Wajib', message:'Mohon upload foto produk.'})
    
    setActionLoading(true)
    try {
      const base64 = await toBase64(newItem.image)
      const res = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'market_action',
          payload: {
            sub_action: 'ADD_ITEM',
            tenant_id: tenantId,
            user_id: user.id,
            data: { ...newItem, image_base64: base64 }
          }
        })
      })
      const json = await res.json()
      if (json.status === 'success') {
        setStatusModal({show:true, type:'success', title:'Berhasil', message:'Lapak Anda sudah dibuka!'})
        setNewItem({ title: '', price: '', type: 'PO_MAKANAN', description: '', quota: '', deadline: '', image: null })
        setPreview(null)
        setActiveTab('BUY')
        fetchItems()
      } else throw new Error(json.message)
    } catch (e) { setStatusModal({show:true, type:'error', title:'Gagal', message: e.message}) } 
    finally { setActionLoading(false) }
  }

  const handleOrderSubmit = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'market_action',
          payload: {
            sub_action: 'PLACE_ORDER',
            tenant_id: tenantId,
            user_id: user.id,
            data: {
              item_id: orderModal.item.id,
              buyer_name: user.name,
              qty: orderModal.qty,
              total_price: orderModal.qty * orderModal.item.price,
              notes: orderModal.notes
            }
          }
        })
      })
      const json = await res.json()
      if (json.status === 'success') {
        setOrderModal({ ...orderModal, show: false })
        setStatusModal({show:true, type:'success', title:'Pesanan Diterima', message:'Silakan hubungi penjual untuk pembayaran.'})
        fetchItems()
      } else throw new Error(json.message)
    } catch (e) { setStatusModal({show:true, type:'error', title:'Gagal', message: e.message}) }
    finally { setActionLoading(false) }
  }

  // Helper
  const getImgUrl = (src) => {
    if (!src) return "https://placehold.co/400x300?text=No+Image";
    if (!src.startsWith('http')) return `https://drive.google.com/uc?export=view&id=${src}`;
    const match = src.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return (match && match[1]) ? `https://drive.google.com/uc?export=view&id=${match[1]}` : src;
  }
  const fmtRp = (n) => "Rp " + Number(n).toLocaleString('id-ID');

  // PAGINATION LOGIC
  const paginatedItems = items.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* Header */}
      <div className="bg-orange-500 p-6 pt-12 pb-8 text-white rounded-b-[30px] shadow-lg relative z-20">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/20 rounded-full transition"><ArrowLeft className="w-6 h-6" /></button>
          <h1 className="text-xl font-bold">Lapak Warga</h1>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-orange-600/50 p-1 rounded-xl">
          <button onClick={() => setActiveTab('BUY')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${activeTab === 'BUY' ? 'bg-white text-orange-600 shadow' : 'text-orange-100 hover:bg-white/10'}`}>Belanja</button>
          <button onClick={() => setActiveTab('SELL')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${activeTab === 'SELL' ? 'bg-white text-orange-600 shadow' : 'text-orange-100 hover:bg-white/10'}`}>Buka Lapak</button>
        </div>
      </div>

      <div className="relative z-10 space-y-4">
        
        {/* LIST BARANG (SLIDER MODE) */}
        {activeTab === 'BUY' && (
          <div className="pt-4 px-2">
            {loading ? (
               <div className="text-center py-10 text-gray-400"><Loader2 className="w-8 h-8 animate-spin mx-auto"/></div>
            ) : items.length === 0 ? (
               <div className="text-center py-10 text-gray-400 border-2 border-dashed rounded-xl m-4">Belum ada barang.</div>
            ) : (
               <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-8 px-2 no-scrollbar">
                 {items.map((item) => (
                  <div key={item.id} className="snap-center shrink-0 w-[85%] sm:w-[300px] bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden flex flex-col">
                    <div className="h-48 w-full bg-gray-200 relative">
                       <img src={getImgUrl(item.image)} className="w-full h-full object-cover" />
                       <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm border">{item.type}</div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                       <h3 className="font-bold text-gray-800 text-lg line-clamp-1">{item.title}</h3>
                       <p className="text-orange-600 font-extrabold text-lg">{fmtRp(item.price)}</p>
                       <p className="text-xs text-gray-500 mt-2 line-clamp-2 flex-1">{item.description}</p>
                       
                       {/* Quota Bar Specific */}
                       <div className="mt-4 bg-orange-50 p-2 rounded-lg border border-orange-100">
                          <div className="flex justify-between text-[10px] font-bold text-orange-800">
                             <span>Terpesan: {item.filled}</span>
                             <span>Sisa: {item.quota > 0 ? (item.quota - item.filled) : '∞'}</span>
                          </div>
                          {item.quota > 0 && (
                             <div className="w-full bg-white h-1.5 rounded-full overflow-hidden mt-1 border border-orange-100">
                                <div className="bg-orange-500 h-1.5 rounded-full" style={{width: `${Math.min((item.filled/item.quota)*100, 100)}%`}}></div>
                             </div>
                          )}
                       </div>

                       <button 
                         onClick={() => setOrderModal({show:true, item: item, qty: 1, notes: ''})}
                         disabled={item.quota > 0 && item.filled >= item.quota}
                         className="w-full mt-4 bg-orange-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
                       >
                         {item.quota > 0 && item.filled >= item.quota ? "Habis" : "Pesan Sekarang"}
                       </button>
                    </div>
                  </div>
                 ))}
               </div>
            )}
          </div>
        )}

        {/* FORM JUALAN (SELL) */}
        {activeTab === 'SELL' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 animate-slide-up m-4">
             <form onSubmit={handleSellSubmit} className="space-y-4">
                {/* Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center relative hover:bg-gray-50 transition">
                   <input type="file" accept="image/*" onChange={(e) => {
                      const f = e.target.files[0];
                      if(f) { setNewItem({...newItem, image: f}); setPreview(URL.createObjectURL(f)); }
                   }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                   {preview ? <img src={preview} className="h-32 mx-auto object-contain rounded"/> : <div className="text-gray-400 text-xs"><ShoppingBag className="w-8 h-8 mx-auto mb-2"/>Upload Foto Produk</div>}
                </div>

                <input placeholder="Nama Produk" className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none" value={newItem.title} onChange={e=>setNewItem({...newItem, title: e.target.value})} required/>
                <input type="number" placeholder="Harga (Rp)" className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none" value={newItem.price} onChange={e=>setNewItem({...newItem, price: e.target.value})} required/>
                <textarea placeholder="Deskripsi (Bahan, Kondisi, dll)" className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none" rows="3" value={newItem.description} onChange={e=>setNewItem({...newItem, description: e.target.value})} required></textarea>
                
                <div className="grid grid-cols-2 gap-3">
                   <input type="number" placeholder="Kuota (0 = Unlimited)" className="p-3 bg-gray-50 rounded-xl text-sm outline-none" value={newItem.quota} onChange={e=>setNewItem({...newItem, quota: e.target.value})}/>
                   <select className="p-3 bg-gray-50 rounded-xl text-sm outline-none" value={newItem.type} onChange={e=>setNewItem({...newItem, type: e.target.value})}>
                      <option value="PO_MAKANAN">PO Makanan</option>
                      <option value="JASA">Jasa</option>
                      <option value="PRELOVED">Preloved</option>
                   </select>
                </div>

                <button type="submit" disabled={actionLoading} className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-orange-700">
                   {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto"/> : "Buka Lapak"}
                </button>
             </form>
          </div>
        )}

      </div>

      {/* MODAL ORDER */}
      {orderModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
           <div className="bg-white w-full max-w-sm rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-4">Konfirmasi Pesanan</h3>
              <p className="text-sm text-gray-600 mb-4">Anda memesan <strong>{orderModal.item.title}</strong></p>
              
              <div className="flex items-center gap-4 mb-4">
                 <button onClick={()=>setOrderModal({...orderModal, qty: Math.max(1, orderModal.qty-1)})} className="p-2 bg-gray-100 rounded-lg font-bold">-</button>
                 <span className="font-bold text-lg">{orderModal.qty}</span>
                 <button onClick={()=>setOrderModal({...orderModal, qty: orderModal.qty+1})} className="p-2 bg-gray-100 rounded-lg font-bold">+</button>
              </div>
              
              <textarea placeholder="Catatan (Pedas/Tidak, dll)" className="w-full p-3 bg-gray-50 rounded-xl text-sm mb-4" rows="2" value={orderModal.notes} onChange={e=>setOrderModal({...orderModal, notes:e.target.value})}></textarea>
              
              <div className="flex justify-between font-bold text-lg mb-6">
                 <span>Total:</span>
                 <span className="text-orange-600">{fmtRp(orderModal.qty * orderModal.item.price)}</span>
              </div>

              <button onClick={handleOrderSubmit} disabled={actionLoading} className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold shadow-lg mb-2">
                 {actionLoading ? "Memproses..." : "Kirim Pesanan"}
              </button>
              <button onClick={()=>setOrderModal({...orderModal, show: false})} className="w-full py-3 text-gray-500">Batal</button>
           </div>
        </div>
      )}

      {/* MODAL STATUS */}
      {statusModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
           <div className="bg-white w-full max-w-sm rounded-2xl p-6 text-center">
              <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${statusModal.type==='success'?'bg-green-100 text-green-600':'bg-red-100 text-red-600'}`}>
                 {statusModal.type==='success'?<CheckCircle/>:<XCircle/>}
              </div>
              <h3 className="font-bold text-lg mb-2">{statusModal.title}</h3>
              <p className="text-gray-500 text-sm mb-6">{statusModal.message}</p>
              <button onClick={()=>setStatusModal({...statusModal, show:false})} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold">Tutup</button>
           </div>
        </div>
      )}

    </div>
  )
}