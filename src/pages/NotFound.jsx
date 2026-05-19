import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center animate-fade-in">
        <div className="text-8xl mb-6 animate-float">🎌</div>
        <h1 className="text-7xl font-black gradient-text mb-4" style={{ fontFamily: 'Outfit' }}>404</h1>
        <p className="text-2xl font-bold text-text-primary mb-2">Page Not Found</p>
        <p className="text-text-muted mb-8 max-w-sm mx-auto">
          Looks like this page went on a filler arc. Let's get you back to the main story.
        </p>
        <Link to="/" className="btn-accent inline-flex items-center gap-2 px-8 py-3 text-base">
          <Home size={18} /> Back to Home
        </Link>
      </div>
    </div>
  )
}
