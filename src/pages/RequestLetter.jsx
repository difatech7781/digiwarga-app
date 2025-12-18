import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, Send, Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function RequestLetter() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('dg_user') || '{}')
  const apiUrl = localStorage.getItem('dg_api_url')

  // State Form (Sesuai kode lama)
  const [type, setType] = useState('SURAT_PENGANTAR_RT')
  const [keperluan, setKeperluan] = useState('')
  
  // State UI
  const [loading, setLoading] = useState(false)
  // STANDAR NOTIFIKASI PREMIUM
  const [statusModal, setStatusModal] = useState({ show: false, type: 'success', title: '', message: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!keperluan.trim()) {
      setStatusModal({ show: true, type: 'error', title: 'Data Kurang', message: 'Mohon isi keperluan surat!' })
      return
    }

    setLoading(true)

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'request_document',
          payload: {
            user_id: user.id,
            type: type,
            input_data: { keperluan: keperluan } 
          }
        })
      })
      
      const json = await res.json()
      
      if (json.status === 'success') {
        setStatusModal({ show: true, type: 'success', title: 'Berhasil Diajukan!', message: 'Surat sedang diproses Pak RT.' })
      } else {
        setStatusModal({ show: true, type: 'error', title: 'Gagal', message: json.message || 'Gagal memproses permintaan.' })
      }
    } catch (err) {
      setStatusModal({ show: true, type: 'error', title: 'Error Koneksi', message: 'Periksa internet Anda.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white p-4 shadow-sm flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Buat Surat Baru</h1>
      </div>

      <div className="p-6 max-w-lg mx-auto animate-fade-in">
        <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg text-white mb-6 relative overflow-hidden">
          <FileText className="w-16 h-16 absolute -right-2 -bottom-2 text-indigo-400 opacity-50" />
          <div className="relative z-10">
            <h2 className="text-xl font-bold">Layanan Surat Online</h2>
            <p className="text-indigo-200 text-sm mt-1">Isi formulir untuk mengajukan surat pengantar resmi.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Jenis Surat</label>
            <div className="relative">
              <select 
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 font-semibold text-gray-700 outline-none focus:border-indigo-500 appearance-none"
              >
                <option value="SURAT_PENGANTAR_RT">📄 Surat Pengantar RT/RW</option>
                <option value="SK_DOMISILI">🏠 Surat Keterangan Domisili</option>
                <option value="SK_TIDAK_MAMPU">❤️ Surat Keterangan Tidak Mampu (SKTM)</option>
                <option value="SK_KEMATIAN">🥀 Surat Keterangan Kematian</option>
                <option value="IZIN_KERAMAIAN">🎉 Izin Keramaian</option>
                <option value="LAINNYA">📦 Surat Lainnya</option>
              </select>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Keperluan / Detail</label>
            <textarea 
              rows={4}
              value={keperluan}
              onChange={(e) => setKeperluan(e.target.value)}
              placeholder="Contoh: Untuk persyaratan perpanjangan KTP di Kelurahan."
              className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none focus:border-indigo-500 resize-none"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl shadow-xl shadow-gray-900/20 active:scale-95 transition disabled:bg-gray-400 disabled:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="animate-spin w-5 h-5" /> Memproses...</> : <><Send className="w-5 h-5" /> Kirim Pengajuan</>}
          </button>
        </form>
      </div>

      {/* --- MODAL STATUS --- */}
      {statusModal.show && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-6 ${statusModal.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
              {statusModal.type === 'success' ? <CheckCircle className="h-8 w-8 text-green-600"/> : <XCircle className="h-8 w-8 text-red-600"/>}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{statusModal.title}</h3>
            <p className="text-sm text-gray-500 mb-6">{statusModal.message}</p>
            <button 
              onClick={() => { 
                setStatusModal({...statusModal, show:false}); 
                if(statusModal.type === 'success') navigate('/dashboard');
              }} 
              className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold shadow-lg"
            >
              {statusModal.type === 'success' ? 'Kembali ke Dashboard' : 'Perbaiki Data'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}