import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Siren, Ambulance, Flame, ShieldAlert, 
  Trash2, Lightbulb, MessageSquare, Send, Loader2,
  Camera, MapPin, CheckCircle, XCircle
} from 'lucide-react'

export default function CitizenReport() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('dg_user') || '{}')
  const apiUrl = localStorage.getItem('dg_api_url')

  // STATE DATA
  const [step, setStep] = useState(1)
  const [category, setCategory] = useState('')
  const [message, setMessage] = useState('')
  const [isPanic, setIsPanic] = useState(false)
  
  // STATE BUKTI & LOKASI
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [location, setLocation] = useState(null) // { lat: ..., lng: ... }
  const [locStatus, setLocStatus] = useState('idle') // idle, finding, found, error

  // STATE UI
  const [loading, setLoading] = useState(false)
  const [statusModal, setStatusModal] = useState({ show: false, type: 'success', title: '', message: '' })

  const categories = [
    { id: 'KEBAKARAN', label: 'KEBAKARAN', icon: Flame, color: 'bg-red-600', panic: true },
    { id: 'MEDIS', label: 'DARURAT MEDIS', icon: Ambulance, color: 'bg-green-600', panic: true },
    { id: 'KAMTIBMAS', label: 'GANGGUAN KAMTIBMAS', icon: ShieldAlert, color: 'bg-orange-600', panic: true },
    { id: 'SAMPAH', label: 'SAMPAH TUMPUK', icon: Trash2, color: 'bg-blue-500', panic: false },
    { id: 'FASUM', label: 'LAMPU/JALAN RUSAK', icon: Lightbulb, color: 'bg-yellow-500', panic: false },
    { id: 'LAINNYA', label: 'LAIN-LAIN', icon: MessageSquare, color: 'bg-gray-500', panic: false },
  ]

  // 1. PILIH KATEGORI
  const handleSelect = (cat) => {
    setCategory(cat.id)
    setIsPanic(cat.panic)
    if (cat.panic) setMessage(`TOLONG! Ada ${cat.label} di lokasi saya! Segera butuh bantuan!`)
    else setMessage('')
    
    // Otomatis cari lokasi saat masuk step 2 biar cepat
    getLocation()
    setStep(2)
  }

  // 2. FUNGSI GEOLOCATION (GPS)
  const getLocation = () => {
    setLocStatus('finding')
    if (!navigator.geolocation) {
      setLocStatus('error')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocStatus('found')
      },
      () => setLocStatus('error'),
      { enableHighAccuracy: true } // Minta akurasi tinggi (GPS)
    )
  }

  // 3. FUNGSI KAMERA/FOTO
  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 3 * 1024 * 1024) { // Limit 3MB
        setStatusModal({ show: true, type: 'error', title: 'File Besar', message: 'Maksimal 3MB' })
        return
      }
      setPhoto(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  // 4. SUBMIT REPORT
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message) return

    setLoading(true)

    // Convert Foto ke Base64 (Jika ada)
    let base64String = ''
    if (photo) {
      const reader = new FileReader()
      reader.readAsDataURL(photo)
      await new Promise(resolve => reader.onload = () => {
        base64String = reader.result
        resolve()
      })
    }

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'submit_citizen_report', // Action sudah benar
          payload: {
            user_id: user.id,
            category,
            message,
            is_panic: isPanic,
            photo_base64: base64String, // Kirim foto
            location: location // Kirim koordinat {lat, lng}
          }
        })
      })
      const json = await res.json()
      
      if (json.status === 'success') {
        setStatusModal({
          show: true, type: 'success', 
          title: isPanic ? 'SINYAL DARURAT TERKIRIM!' : 'Laporan Terkirim',
          message: isPanic ? 'Petugas telah menerima lokasi Anda. Bantuan segera datang.' : 'Terima kasih atas laporan Anda.'
        })
      } else {
        setStatusModal({ show: true, type: 'error', title: 'Gagal', message: json.message })
      }
    } catch (err) {
      setStatusModal({ show: true, type: 'error', title: 'Error Koneksi', message: 'Gunakan panggilan darurat manual!' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen pb-10 ${isPanic ? 'bg-red-50' : 'bg-gray-50'}`}>
      
      {/* HEADER */}
      <div className="bg-white p-4 shadow-sm flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => step === 1 ? navigate(-1) : setStep(1)} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-gray-700"/>
        </button>
        <h1 className="text-lg font-bold text-gray-800">
          {step === 1 ? 'Layanan Laporan Warga' : 'Lengkapi Laporan'}
        </h1>
      </div>

      <div className="p-6 max-w-md mx-auto animate-fade-in">
        
        {/* STEP 1: PILIH KATEGORI */}
        {step === 1 && (
          <>
            <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-r-xl mb-6 shadow-sm">
              <h2 className="text-red-800 font-bold flex items-center gap-2">
                <Siren className="w-5 h-5 animate-pulse"/> MODE DARURAT
              </h2>
              <p className="text-xs text-red-600 mt-1">Tombol Merah = Sinyal Bahaya. Lokasi Anda akan dikirim otomatis ke petugas.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {categories.map((cat) => (
                <button key={cat.id} onClick={() => handleSelect(cat)} className={`${cat.color} text-white p-4 rounded-2xl shadow-lg active:scale-95 transition flex flex-col items-center justify-center gap-3 h-32`}>
                  <cat.icon className="w-10 h-10"/>
                  <span className="text-xs font-bold text-center leading-tight">{cat.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* STEP 2: DETAIL LAPORAN */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Header Kategori */}
            <div className={`p-4 rounded-xl text-white text-center shadow-lg ${isPanic ? 'bg-red-600 animate-pulse' : 'bg-blue-600'}`}>
              <h2 className="text-xl font-bold uppercase">{category.replace('_', ' ')}</h2>
            </div>

            {/* 1. LOKASI (GPS) */}
            <div className="bg-white p-3 rounded-xl border border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${locStatus==='found'?'bg-green-100 text-green-600':'bg-gray-100 text-gray-500'}`}>
                  <MapPin className={`w-5 h-5 ${locStatus==='finding'?'animate-bounce':''}`}/>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-700">Lokasi Kejadian</p>
                  <p className="text-[10px] text-gray-500">
                    {locStatus === 'finding' ? 'Mencari koordinat...' : 
                     locStatus === 'found' ? 'Terkunci (Akurat)' : 'GPS Tidak Aktif'}
                  </p>
                </div>
              </div>
              {locStatus !== 'found' && (
                <button type="button" onClick={getLocation} className="text-xs bg-gray-100 px-3 py-1 rounded font-bold hover:bg-gray-200">
                  Cari Ulang
                </button>
              )}
            </div>

            {/* 2. FOTO BUKTI */}
            <div className="bg-white p-3 rounded-xl border border-gray-200">
              <label className="flex items-center gap-3 w-full cursor-pointer">
                <div className={`p-2 rounded-full ${preview?'bg-blue-100 text-blue-600':'bg-gray-100 text-gray-500'}`}>
                  <Camera className="w-5 h-5"/>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-700">Foto Bukti / Situasi</p>
                  <p className="text-[10px] text-gray-500">{preview ? 'Foto terlampir' : 'Ketuk untuk ambil foto'}</p>
                </div>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
              </label>
              {preview && (
                <div className="mt-2 relative">
                  <img src={preview} alt="Bukti" className="w-full h-32 object-cover rounded-lg"/>
                  <button type="button" onClick={()=>{setPhoto(null);setPreview(null)}} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"><XCircle className="w-4 h-4"/></button>
                </div>
              )}
            </div>

            {/* 3. PESAN DETAIL */}
            <div className="bg-white p-3 rounded-xl border border-gray-200">
              <textarea 
                rows="4"
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full p-2 text-sm outline-none resize-none font-medium text-gray-800 placeholder-gray-400"
                placeholder={isPanic ? "Jelaskan situasi singkat..." : "Jelaskan detail laporan..."}
              ></textarea>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-xl text-lg flex items-center justify-center gap-2 transition active:scale-95 ${isPanic ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
            >
              {loading ? <Loader2 className="animate-spin w-6 h-6"/> : <Send className="w-6 h-6"/>}
              {loading ? 'MENGIRIM...' : 'KIRIM LAPORAN'}
            </button>
          </form>
        )}
      </div>

      {/* MODERN MODAL STATUS */}
      {statusModal.show && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-6 ${statusModal.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
              {statusModal.type === 'success' ? <CheckCircle className="h-8 w-8 text-green-600"/> : <XCircle className="h-8 w-8 text-red-600"/>}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{statusModal.title}</h3>
            <p className="text-sm text-gray-500 mb-6">{statusModal.message}</p>
            <button onClick={() => { setStatusModal({...statusModal, show:false}); if(statusModal.type==='success') navigate('/dashboard') }} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold shadow-lg">
              {statusModal.type === 'success' ? 'Kembali ke Dashboard' : 'Coba Lagi'}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}