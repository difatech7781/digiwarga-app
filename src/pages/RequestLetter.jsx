import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Loader2, CheckCircle, XCircle, FileText, ChevronDown } from 'lucide-react'

export default function RequestLetter() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('dg_user') || '{}')
  const apiUrl = localStorage.getItem('dg_api_url')
  const config = JSON.parse(localStorage.getItem('dg_config') || '{}')

  // --- LOGIC: DYNAMIC LETTER TYPES ---
  // Format di Config: "SK_PENGANTAR:Pengantar RT|SK_DOMISILI:Domisili"
  const getLetterTypes = () => {
    const raw = config.LETTER_TYPES;
    const defaultTypes = [
      { id: 'SK_PENGANTAR', label: 'Surat Pengantar RT/RW' },
      { id: 'SK_DOMISILI', label: 'Surat Keterangan Domisili' },
      { id: 'SK_USAHA', label: 'Surat Keterangan Usaha' },
      { id: 'SK_KELAKUAN_BAIK', label: 'Pengantar SKCK' }
    ];

    if (!raw) return defaultTypes;

    try {
      return raw.split('|').map(item => {
        const [id, label] = item.split(':');
        return { id: id.trim(), label: label.trim() };
      });
    } catch (e) {
      console.error("Config Parse Error", e);
      return defaultTypes;
    }
  }

  const letterOptions = getLetterTypes();

  // --- FORM STATE ---
  const [docType, setDocType] = useState(letterOptions[0]?.id || '')
  const [keperluan, setKeperluan] = useState('')
  const [loading, setLoading] = useState(false)
  const [statusModal, setStatusModal] = useState({ show: false, type: 'success', title: '', message: '' })

  // --- HANDLERS ---
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
            type: docType,
            input_data: { keperluan: keperluan },
            tenant_id: localStorage.getItem('dg_tenant_id')
          }
        })
      })
      const json = await res.json()
      if (json.status === 'success') {
        setStatusModal({ show: true, type: 'success', title: 'Terkirim', message: 'Surat sedang diproses.' })
        setKeperluan('')
      } else { throw new Error(json.message) }
    } catch (err) {
      setStatusModal({ show: true, type: 'error', title: 'Gagal', message: err.message })
    } finally { setLoading(false) }
  }

  const handleStatusOk = () => {
    setStatusModal({ ...statusModal, show: false })
    if (statusModal.type === 'success') navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-md bg-white shadow-xl min-h-screen flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 pt-12 pb-8 text-white shadow-lg rounded-b-[30px] relative z-20">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/20 rounded-full transition backdrop-blur-sm"><ArrowLeft className="w-6 h-6" /></button>
            <h1 className="text-xl font-bold tracking-tight">Ajukan Surat</h1>
          </div>
          <p className="text-purple-100 text-sm ml-11">Layanan administrasi digital RT/RW.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pb-20 space-y-8 -mt-4 relative z-10">
          
          {/* === FORM SECTION === */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            
            <div className="flex items-start gap-4 mb-6 bg-purple-50 p-4 rounded-2xl">
              <div className="bg-purple-100 p-2 rounded-full"><FileText className="w-5 h-5 text-purple-600"/></div>
              <p className="text-xs text-purple-800 leading-relaxed mt-1">
                Silakan pilih jenis surat yang tersedia dan jelaskan keperluan Anda secara detail untuk mempercepat proses.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* DROPDOWN SELECT */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Jenis Surat</label>
                <div className="relative">
                  <select 
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none text-sm font-bold text-gray-700 shadow-sm appearance-none transition"
                  >
                    {letterOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <ChevronDown className="w-5 h-5"/>
                  </div>
                </div>
              </div>

              {/* TEXTAREA */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Keperluan / Keterangan</label>
                <textarea 
                  rows="5"
                  value={keperluan}
                  onChange={(e) => setKeperluan(e.target.value)}
                  placeholder="Contoh: Untuk persyaratan pembuatan KTP baru di Kelurahan..."
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none text-sm transition"
                  required
                ></textarea>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-purple-200 hover:bg-purple-700 active:scale-95 transition flex items-center justify-center gap-2 mt-4">
                {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <><Send className="w-4 h-4"/> Kirim Permohonan</>}
              </button>
            </form>
          </div>

        </div>

        {/* Modal Status */}
        {statusModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
              <div className={`mx-auto flex items-center justify-center h-20 w-20 rounded-full mb-6 ${statusModal.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                {statusModal.type === 'success' ? <CheckCircle className="h-10 w-10 text-green-600" /> : <XCircle className="h-10 w-10 text-red-600" />}
              </div>
              <h3 className="text-2xl font-bold mb-3">{statusModal.title}</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">{statusModal.message}</p>
              <button onClick={handleStatusOk} className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl font-bold shadow-lg transition transform active:scale-95">Tutup</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}