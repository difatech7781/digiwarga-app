import { LogIn } from 'lucide-react'

export default function BrandHeader({ theme = 'light' }) {
  // Theme 'dark' = Background Biru (Text Putih) -> Cocok buat Login/Register
  // Theme 'light' = Background Putih (Text Hitam) -> Cocok buat Dashboard/Halaman lain
  
  const titleColor = theme === 'dark' ? 'text-white' : 'text-gray-800'
  const subtitleColor = theme === 'dark' ? 'text-blue-100' : 'text-gray-500'
  const iconBg = theme === 'dark' ? 'bg-white/10 text-white' : 'bg-blue-50 text-blue-600'

  // [BARU] Baca Config dari Storage
  const config = JSON.parse(localStorage.getItem('dg_config') || '{}');
  const appName = config.APP_NAME || "DigiWarga"; // Default Name

  return (
    <div className="text-center mb-8">
      <div className="flex justify-center mb-4">
        {/* LOGO IMAGE (Wajib ada di folder public/logo.png) */}
        <img 
          src="/logo.png" 
          alt="Logo DigiWarga" 
          className="w-24 h-24 object-contain drop-shadow-lg"
          onError={(e) => {
            // Auto Fallback ke Icon jika gambar gagal load
            e.target.style.display='none'
            e.target.nextSibling.style.display='flex'
          }} 
        />
        
        {/* FALLBACK ICON */}
        <div className={`w-20 h-20 rounded-full items-center justify-center hidden ${iconBg} backdrop-blur-sm border border-white/20 shadow-xl`}>
          <LogIn className="w-10 h-10" />
        </div>
      </div>
      
      <h1 className={`text-3xl font-bold mb-1 tracking-tight ${titleColor}`}>
        {appName}
      </h1>
      <p className={`text-sm font-medium ${subtitleColor}`}>
        Sistem Informasi Warga Digital
      </p>
    </div>
  )
}