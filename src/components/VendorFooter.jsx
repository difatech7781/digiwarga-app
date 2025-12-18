import { Heart, Globe, Instagram, Facebook } from 'lucide-react'

export default function VendorFooter({ theme = 'light' }) {
  // Theme 'light' = Text Gelap (Untuk background putih/abu)
  // Theme 'dark'  = Text Putih (Untuk background biru/gelap)
  
  const textColor = theme === 'dark' ? 'text-blue-100' : 'text-gray-400'
  const hoverColor = theme === 'dark' ? 'hover:text-white' : 'hover:text-indigo-600'

  return (
    <div className={`py-8 text-center animate-fade-in ${textColor}`}>
      
      {/* Jargon / Copyright */}
      <p className="text-[10px] font-medium tracking-wide flex items-center justify-center gap-1">
        Powered with <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" /> by 
        <span className="font-bold">DifaTech</span>
      </p>

      {/* Social Links */}
      <div className="flex justify-center gap-4 mt-3">
        <a href="https://difatech.id" target="_blank" rel="noreferrer" className={`transition ${hoverColor}`}>
          <Globe className="w-4 h-4" />
        </a>
        <a href="https://instagram.com/difatech" target="_blank" rel="noreferrer" className={`transition ${hoverColor}`}>
          <Instagram className="w-4 h-4" />
        </a>
        <a href="https://facebook.com/difatech" target="_blank" rel="noreferrer" className={`transition ${hoverColor}`}>
          <Facebook className="w-4 h-4" />
        </a>
      </div>

      <p className="text-[9px] mt-2 opacity-60">© 2025 DigiWarga System v5.4</p>
    </div>
  )
}