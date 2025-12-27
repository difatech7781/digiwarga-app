import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Vote, BarChart2, Loader2, CheckCircle } from 'lucide-react'

export default function Polling() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('dg_user') || '{}')
  const apiUrl = localStorage.getItem('dg_api_url')
  const tenantId = localStorage.getItem('dg_tenant_id') || 'UMUM';

  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(null) 

  const fetchPolls = async () => {
    setLoading(true)
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'polling_action',
          payload: { sub_action: 'GET_POLLS', tenant_id: tenantId, user_id: user.id }
        })
      })
      const json = await res.json()
      setPolls(json.data || [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { fetchPolls() }, [])

  const handleVote = async (pollId, choice) => {
    setVoting(pollId)
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'polling_action',
          payload: { sub_action: 'VOTE', tenant_id: tenantId, user_id: user.id, poll_id: pollId, choice }
        })
      })
      const json = await res.json()
      if(json.status === 'success') fetchPolls()
      else alert(json.message)
    } catch(e) { alert("Gagal Vote") } 
    finally { setVoting(null) }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-teal-600 p-6 pt-12 pb-8 text-white rounded-b-[30px] shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/20 rounded-full transition"><ArrowLeft className="w-6 h-6" /></button>
          <h1 className="text-xl font-bold">Suara Warga</h1>
        </div>
        <p className="text-teal-100 text-sm ml-11">Partisipasi Anda menentukan masa depan RT.</p>
      </div>

      <div className="p-4 space-y-6 -mt-4 relative z-10">
        {loading ? <div className="text-center py-10 text-gray-400"><Loader2 className="w-8 h-8 animate-spin mx-auto"/></div> : polls.map((poll) => (
          <div key={poll.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-teal-50 rounded-lg"><Vote className="w-6 h-6 text-teal-600"/></div>
                <div><h3 className="font-bold text-gray-800 text-lg">{poll.title}</h3><p className="text-sm text-gray-500">{poll.description}</p></div>
             </div>

             {poll.my_choice ? (
                <div className="bg-teal-50 p-4 rounded-xl border border-teal-100">
                   <p className="text-xs text-teal-600 font-bold mb-3 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Anda memilih: {poll.my_choice}</p>
                   <div className="space-y-3">
                      {poll.options.map((opt) => {
                         const totalVotes = Object.values(poll.stats).reduce((a,b)=>a+b, 0) || 1;
                         const percent = Math.round((poll.stats[opt] || 0) / totalVotes * 100);
                         return (
                            <div key={opt}>
                               <div className="flex justify-between text-xs mb-1"><span>{opt}</span><span className="font-bold">{percent}%</span></div>
                               <div className="w-full bg-white h-2 rounded-full overflow-hidden"><div className="bg-teal-500 h-2 rounded-full" style={{width: `${percent}%`}}></div></div>
                            </div>
                         )
                      })}
                   </div>
                </div>
             ) : (
                <div className="grid gap-3">
                   {poll.options.map((opt) => (
                      <button 
                        key={opt} 
                        onClick={() => handleVote(poll.id, opt)}
                        disabled={voting === poll.id}
                        className="py-3 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-teal-600 hover:text-white hover:border-teal-600 transition text-left flex justify-between"
                      >
                        {opt} {voting===poll.id && <Loader2 className="w-4 h-4 animate-spin"/>}
                      </button>
                   ))}
                </div>
             )}
          </div>
        ))}
        {!loading && polls.length === 0 && <div className="text-center py-10 text-gray-400">Belum ada polling aktif.</div>}
      </div>
    </div>
  )
}