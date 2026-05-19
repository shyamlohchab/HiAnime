import { Link } from 'react-router-dom'

const genres = ['Action','Adventure','Comedy','Drama','Fantasy','Horror','Romance','Sci-Fi','Slice of Life','Sports','Supernatural','Thriller']

export default function Footer() {
  return (
    <footer className="border-t border-white/8 mt-20">
      <div className="max-w-screen-xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
                <span className="text-white font-black text-sm">Hi</span>
              </div>
              <span className="font-black text-xl text-white" style={{ fontFamily: 'Outfit' }}>
                Hi<span className="gradient-text">Anime</span>
              </span>
            </Link>
            <p className="text-text-muted text-sm leading-relaxed">
              Watch anime online in HD, sub & dub. Zero ads. Pure experience.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-text-secondary font-semibold mb-4 text-sm uppercase tracking-wider">Navigate</h4>
            <ul className="flex flex-col gap-2">
              {[['Home', '/'], ['Trending', '/trending'], ['Schedule', '/schedule'], ['Watchlist', '/watchlist']].map(([label, href]) => (
                <li key={href}><Link to={href} className="text-text-muted hover:text-accent-light transition-colors text-sm">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Genres */}
          <div className="md:col-span-2">
            <h4 className="text-text-secondary font-semibold mb-4 text-sm uppercase tracking-wider">Genres</h4>
            <div className="flex flex-wrap gap-2">
              {genres.map(g => (
                <Link key={g} to={`/genre/${g.toLowerCase().replace(/ /g,'-')}`} className="genre-tag">{g}</Link>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-text-dim text-xs">
            © {new Date().getFullYear()} HiAnime — For educational purposes only. We do not host any files.
          </p>
          <p className="text-text-dim text-xs">
            Powered by <span className="text-accent-light">HiAnime API</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
