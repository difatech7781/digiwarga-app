import { useState } from 'react'
import { ArrowLeft, Copy, Upload, CheckCircle, XCircle, Loader2, QrCode, Building2, Image, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Payment() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('dg_user') || '{}')
  const apiUrl = localStorage.getItem('dg_api_url')
  
  // CONFIG
  const config = JSON.parse(localStorage.getItem('dg_config') || '{}');
  const defaultAmount = config.IURAN_AMT || '50000';
  const bankInfo = config.BANK_INFO || "Hubungi Bendahara RT";
  const qrisRawUrl = config.QRIS_IMAGE_URL || "";
  
  // [BARU] HELPER: CONVERT DRIVE LINK TO DIRECT IMAGE
  const getDriveDirectLink = (url) => {
    if (!url) return "https://placehold.co/400x400?text=No+QRIS";
    // Regex untuk ambil ID dari link sharing biasa
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      // Format export=view lebih stabil untuk image tag
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
    return url;
  }

  const qrisImage = getDriveDirectLink(qrisRawUrl);
  
  // FORM STATE
  const [amount, setAmount] = useState(defaultAmount) 
  const [category, setCategory] = useState('IURAN')
  const [method, setMethod] = useState('TRANSFER') 
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  
  // UI STATE
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false) // State Copy
  const [statusModal, setStatusModal] = useState({ show: false, type: 'success', title: '', message: '' })

  // HANDLERS
  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected) {
      if (selected.size > 2 * 1024 * 1024) { 
        setStatusModal({ show: true, type: 'error', title: 'File Terlalu Besar', message: 'Maksimal 2MB.' })
        return
      }
      setFile(selected)
      setPreview(URL.createObjectURL(selected))
    }
  }

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(bankInfo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2s
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return setStatusModal({ show: true, type: 'error', title: 'Bukti Kosong', message: 'Upload bukti transfer wajib.' })

    setLoading(true)
    try {
      const base64Str = await toBase64(file)
      const res = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'submit_payment',
          payload: {
            user_id: user.id,
            amount: amount,
            category: category,
            notes: `[${method}] ${notes}`, 
            proof_base64: base64Str, 
            tenant_id: localStorage.getItem('dg_tenant_id') 
          }
        })
      })
      const json = await res.json()
      if (json.status === 'success') {
        setStatusModal({ show: true, type: 'success', title: 'Berhasil Terkirim!', message: 'Pembayaran sedang diverifikasi.' })
        setAmount(defaultAmount); setNotes(''); setFile(null); setPreview(null);
      } else { throw new Error(json.message) }
    } catch (err) {
      setStatusModal({ show: true, type: 'error', title: 'Gagal Mengirim', message: err.message })
    } finally { setLoading(false) }
  }

  const handleStatusOk = () => {
    setStatusModal({ ...statusModal, show: false })
    if (statusModal.type === 'success') navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-md bg-white shadow-xl min-h-screen flex flex-col">
        
        {/* Header Modern */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 pt-12 pb-8 text-white shadow-lg rounded-b-[30px] relative z-20">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/20 rounded-full transition backdrop-blur-sm"><ArrowLeft className="w-6 h-6" /></button>
            <h1 className="text-xl font-bold tracking-tight">Pembayaran Baru</h1>
          </div>
          <p className="text-blue-100 text-sm ml-11">Silakan pilih metode dan isi nominal.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-20 -mt-4 relative z-10">
          
          {/* === PILIHAN METODE === */}
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex gap-2">
             <button onClick={() => setMethod('TRANSFER')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${method === 'TRANSFER' ? 'bg-indigo-50 text-indigo-700 shadow-inner' : 'text-gray-400 hover:bg-gray-50'}`}>
                <Building2 className="w-4 h-4"/> Transfer
             </button>
             <button onClick={() => setMethod('QRIS')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${method === 'QRIS' ? 'bg-indigo-50 text-indigo-700 shadow-inner' : 'text-gray-400 hover:bg-gray-50'}`}>
                <QrCode className="w-4 h-4"/> QRIS
             </button>
          </div>

          {/* === INFO REKENING / QRIS === */}
          <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-md text-center transition-all animate-fade-in">
            {method === 'TRANSFER' ? (
                <>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Building2 className="w-6 h-6 text-blue-600"/>
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Rekening Tujuan</p>
                    <div className="flex flex-col items-center gap-2">
                        <p className="font-mono font-bold text-gray-800 text-lg">{bankInfo}</p>
                        <button 
                          onClick={handleCopy}
                          className={`text-xs font-bold flex items-center gap-1 px-3 py-1 rounded-full transition-all ${copied ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600 hover:text-blue-800'}`}
                        >
                            {copied ? <><Check className="w-3 h-3"/> Tersalin!</> : <><Copy className="w-3 h-3"/> Salin Info</>}
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Scan QRIS</p>
                    <div className="relative inline-block group">
                        <img 
                            src={qrisImage} 
                            alt="QRIS Code" 
                            className="w-48 h-48 mx-auto object-contain rounded-lg border border-gray-200 shadow-sm transition-transform group-hover:scale-105"
                            onError={(e) => {
                                e.target.src="https://placehold.co/400x400?text=Gagal+Muat+QRIS";
                                console.log("Failed loading QRIS from:", qrisImage);
                            }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-lg transition-colors pointer-events-none"></div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-3">Pastikan nama merchant sesuai dengan RT.</p>
                </>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Input Nominal */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nominal (Rp)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                <input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                    className="w-full pl-10 pr-4 py-4 text-xl font-bold bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition shadow-sm text-gray-800" 
                    required 
                />
              </div>
            </div>

            {/* Pilihan Kategori */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Kategori</label>
              <div className="grid grid-cols-2 gap-3">
                {['IURAN', 'SUMBANGAN', 'KEAMANAN', 'LAINNYA'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all ${
                      category === cat 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-[1.02]' 
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Bukti */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Bukti Transfer</label>
              <div className={`border-2 border-dashed rounded-2xl p-6 text-center relative transition-all group ${file ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'}`}>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                />
                
                {preview ? (
                  <div className="relative">
                      <img src={preview} alt="Preview" className="h-32 mx-auto object-contain rounded-lg shadow-sm" />
                      <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold">Terpilih</div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-white transition">
                        <Upload className="w-6 h-6 text-gray-400 group-hover:text-indigo-500"/>
                    </div>
                    <p className="text-xs text-gray-400 font-medium">Klik untuk upload foto bukti</p>
                  </div>
                )}
              </div>
            </div>

            {/* Catatan */}
            <div className="space-y-1">
               <label className="text-xs font-bold text-gray-500 uppercase ml-1">Catatan (Opsional)</label>
               <textarea rows="2" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Contoh: Bayar untuk bulan Januari..." className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-sm shadow-sm transition"></textarea>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 transition-all mt-4">
              {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : "Kirim Pembayaran"}
            </button>

          </form>
        </div>

        {/* MODAL STATUS */}
        {statusModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center transform transition-all scale-100">
              <div className={`mx-auto flex items-center justify-center h-20 w-20 rounded-full mb-6 ${statusModal.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                {statusModal.type === 'success' ? <CheckCircle className="h-10 w-10 text-green-600" /> : <XCircle className="h-10 w-10 text-red-600" />}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{statusModal.title}</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">{statusModal.message}</p>
              <button onClick={handleStatusOk} className="w-full py-4 rounded-2xl text-white font-bold shadow-lg transition transform active:scale-95 bg-gray-900 hover:bg-gray-800">
                {statusModal.type === 'success' ? 'Selesai' : 'Coba Lagi'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}