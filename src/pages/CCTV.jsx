import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Video, Wifi, WifiOff, MapPin, RefreshCw, Loader2 } from 'lucide-react'

export default function CCTV() {
  const navigate = useNavigate()
  const apiUrl = localStorage.getItem('dg_api_url')
  const tenantId = localStorage.getItem('dg_tenant_id') || 'UMUM';
  
  const [cams, setCams] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0) // Untuk force reload gambar/stream

  const fetchCCTV = async () => {
    setLoading(true)
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'cctv_action',
          payload: { sub_action: 'LIST', tenant_id: tenantId }
        })
      })
      const json = await res.json()
      setCams(json.data || [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { fetchCCTV() }, [])

  // Fungsi Refresh Stream Manual
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-20 font-sans">
      
      {/* Header Dark Mode */}
      <div className="bg-gray-800 p-4 pt-12 pb-6 shadow-lg sticky top-0 z-20 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-700 rounded-full transition text-gray-200">
                <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <Video className="w-5 h-5 text-red-500"/> Monitoring
                </h1>
                <p className="text-xs text-gray-400">Real-time Area Surveillance</p>
            </div>
          </div>
          <button onClick={handleRefresh} className="p-2 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 active:scale-95 transition">
             <RefreshCw className="w-5 h-5"/>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
            <div className="text-center py-20 text-gray-500 flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin"/>
                <p className="text-xs">Menghubungkan ke DVR...</p>
            </div>
        ) : cams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cams.map((cam, idx) => (
                    <div key={idx} className="bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-700 flex flex-col">
                        
                        {/* Video Container */}
                        <div className="relative aspect-video bg-black flex items-center justify-center group">
                            {cam.status === 'ONLINE' ? (
                                <img 
                                    src={`${cam.stream_url}?t=${refreshKey}`} // Hack force reload cache
                                    alt={cam.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null; 
                                        e.target.src="https://placehold.co/640x360/000/333?text=NO+SIGNAL";
                                    }}
                                />
                            ) : (
                                <div className="text-gray-600 flex flex-col items-center">
                                    <WifiOff className="w-10 h-10 mb-2"/>
                                    <span className="text-xs font-mono">SIGNAL LOSS</span>
                                </div>
                            )}

                            {/* Overlay Status Badge */}
                            <div className="absolute top-3 right-3">
                                {cam.status === 'ONLINE' ? (
                                    <span className="flex items-center gap-1 bg-red-600/90 text-white px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
                                        <div className="w-2 h-2 bg-white rounded-full"></div> LIVE
                                    </span>
                                ) : (
                                    <span className="bg-gray-600/80 text-gray-300 px-2 py-0.5 rounded text-[10px] font-bold">
                                        OFFLINE
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Detail Info */}
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-gray-200 text-sm">{cam.name}</h3>
                                <Wifi className={`w-4 h-4 ${cam.status==='ONLINE'?'text-green-500':'text-gray-600'}`}/>
                            </div>
                            <div className="flex items-center gap-1 text-gray-500 text-xs">
                                <MapPin className="w-3 h-3"/> {cam.location}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-10 text-gray-500 text-sm">Tidak ada kamera terhubung.</div>
        )}
      </div>
    </div>
  )
}