import { useState } from 'react'
import { ArrowLeft, Copy, Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Payment() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('dg_user') || '{}')
  const apiUrl = localStorage.getItem('dg_api_url')
  
  // --- STATE FORM ---
  const [amount, setAmount] = useState('50000') // Default harga iuran
  const [category, setCategory] = useState('IURAN')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  
  // --- STATE UI ---
  const [loading, setLoading] = useState(false)
  const [statusModal, setStatusModal] = useState({ 
    show: false, type: 'success', title: '', message: '' 
  })

  // 1. Logic: Handle File Select & Preview
  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected) {
      // Limit 2MB biar GAS aman
      if (selected.size > 2 * 1024 * 1024) { 
        setStatusModal({
          show: true, type: 'error', 
          title: 'File Terlalu Besar', 
          message: 'Maksimal ukuran file adalah 2MB.'
        })
        return
      }
      setFile(selected)
      setPreview(URL.createObjectURL(selected))
    }
  }

  // 2. Logic: Submit ke Backend
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setStatusModal({
        show: true, type: 'error', 
        title: 'Bukti Kurang', 
        message: 'Mohon upload foto bukti transfer.'
      })
      return
    }

    setLoading(true)

    // Convert File to Base64 String
    const reader = new FileReader()
    reader.readAsDataURL(file)
    
    reader.onload = async () => {
      const base64String = reader.result

      try {
        const res = await fetch(apiUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'submit_payment',
            payload: {
              user_id: user.id,
              amount: amount.replace(/\D/g, ''), // Pastikan angka murni
              category,
              notes,
              proof_base64: base64String
            }
          })
        })
        
        const json = await res.json()
        
        if (json.status === 'success') {
          // SUKSES -> TAMPILKAN MODAL
          setStatusModal({
            show: true, type: 'success', 
            title: 'Pembayaran Terkirim!', 
            message: 'Admin akan memverifikasi bukti Anda. Terima kasih!'
          })
        } else {
          // GAGAL DARI BACKEND
          throw new Error(json.message)
        }
      } catch (err) {
        // ERROR KONEKSI
        setStatusModal({
          show: true, type: 'error', 
          title: 'Gagal Kirim', 
          message: err.message || 'Terjadi kesalahan koneksi.'
        })
      } finally {
        setLoading(false)
      }
    }
  }

  // 3. Logic: Handle Tutup Modal
  const handleStatusOk = () => {
    setStatusModal({ ...statusModal, show: false })
    // Jika sukses, kembali ke Dashboard
    if (statusModal.type === 'success') {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Setor Iuran / Kas</h1>
      </div>

      <div className="p-6 max-w-lg mx-auto space-y-6">
        
        {/* Info Rekening Card */}
        <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-blue-200 text-xs uppercase font-semibold">Transfer ke Bank BCA</p>
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-2xl font-mono font-bold">123 456 7890</h2>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText('1234567890')
                  alert('No Rekening Disalin!') // Alert kecil gpp utk copy
                }} 
                className="p-1.5 bg-white/20 rounded hover:bg-white/30 transition"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm mt-2 opacity-90">a.n Bendahara RT 05 (Budi)</p>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Pilihan Kategori */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Jenis Pembayaran</label>
            <div className="grid grid-cols-2 gap-2">
              {['IURAN', 'SUMBANGAN', 'SAMPAH', 'LAINNYA'].map(cat => (
                <button 
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-3 text-sm font-medium rounded-lg border transition ${
                    category === cat 
                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Input Nominal & Catatan */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
             <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nominal (Rp)</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-lg font-bold border-b border-gray-200 focus:border-blue-500 outline-none py-2 text-gray-800 placeholder-gray-300"
                  placeholder="0"
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Catatan (Opsional)</label>
                <input 
                  type="text" 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-sm border-b border-gray-200 focus:border-blue-500 outline-none py-2 text-gray-700"
                  placeholder="Misal: Bayar untuk 3 bulan"
                />
             </div>
          </div>

          {/* Upload Area */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Bukti Transfer</label>
            
            {!preview ? (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition bg-gray-50">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-xs text-gray-500">Klik untuk upload foto</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            ) : (
              <div className="relative">
                <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-gray-200" />
                <button 
                  type="button"
                  onClick={() => {setFile(null); setPreview(null)}}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600"
                >
                  <ArrowLeft className="w-4 h-4 rotate-45" /> {/* Ikon X manual */}
                </button>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl shadow-xl shadow-gray-900/20 active:scale-95 transition disabled:bg-gray-400 disabled:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin w-5 h-5" /> Mengirim...
              </>
            ) : (
              'Konfirmasi Pembayaran'
            )}
          </button>

        </form>
      </div>

      {/* --- MODAL STATUS (STANDAR BARU) --- */}
      {statusModal.show && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center transform transition-all scale-100">
            
            {/* Ikon Dinamis */}
            <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-6 ${
              statusModal.type === 'success' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {statusModal.type === 'success' ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600" />
              )}
            </div>

            {/* Teks */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {statusModal.title}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {statusModal.message}
            </p>

            {/* Tombol OK */}
            <button
              onClick={handleStatusOk}
              className={`w-full py-3 rounded-xl text-white font-bold shadow-lg transition transform active:scale-95 ${
                statusModal.type === 'success' 
                  ? 'bg-green-600 hover:bg-green-700 shadow-green-200' 
                  : 'bg-red-600 hover:bg-red-700 shadow-red-200'
              }`}
            >
              {statusModal.type === 'success' ? 'Kembali ke Dashboard' : 'Coba Lagi'}
            </button>

          </div>
        </div>
      )}

    </div>
  )
}