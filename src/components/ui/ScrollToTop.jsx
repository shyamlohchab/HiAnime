import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 left-6 z-50 p-3 rounded-xl shadow-glow-md animate-fade-in transition-all hover:scale-110"
      style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}
      aria-label="Scroll to top">
      <ArrowUp size={20} className="text-white" />
    </button>
  )
}
