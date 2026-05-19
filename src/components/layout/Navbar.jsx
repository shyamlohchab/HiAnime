import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, Menu, X, Bookmark, Home, TrendingUp, Calendar, ChevronDown } from 'lucide-react'
import { searchSuggestions } from '../../api/anime'
import { useDebounce } from '../../hooks/useAnime'
import { addSearchHistory, getSearchHistory } from '../../utils/localStorage'

const navLinks = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Trending', href: '/trending', icon: TrendingUp },
  { label: 'Schedule', href: '/schedule', icon: Calendar },
]

const genres = ['Action','Adventure','Comedy','Drama','Fantasy','Horror','Romance','Sci-Fi','Slice of Life','Sports','Supernatural','Thriller']

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [genreOpen, setGenreOpen] = useState(false)
  const [searchHistory, setSearchHistory] = useState([])
  const debounced = useDebounce(query, 350)
  const navigate = useNavigate()
  const location = useLocation()
  const searchRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    if (!debounced.trim()) { setSuggestions([]); return }
    searchSuggestions(debounced)
      .then(r => setSuggestions(r.data?.data?.animes?.slice(0, 6) || []))
      .catch(() => setSuggestions([]))
  }, [debounced])

  useEffect(() => {
    setMenuOpen(false)
    setSearchOpen(false)
    setQuery('')
  }, [location])

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false)
        setSuggestions([])
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const openSearch = () => {
    setSearchOpen(true)
    setSearchHistory(getSearchHistory())
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleSearch = (q) => {
    const term = q || query
    if (!term.trim()) return
    addSearchHistory(term.trim())
    navigate(`/search?q=${encodeURIComponent(term.trim())}`)
    setSearchOpen(false)
    setQuery('')
  }

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'nav-floating scrolled' : 'nav-floating'
      }`}>
        <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
              <span className="text-white font-black text-sm">Hi</span>
            </div>
            <span className="font-black text-xl text-white" style={{ fontFamily: 'Outfit' }}>
              Hi<span className="gradient-text">Anime</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1 flex-1">
            {navLinks.map(link => (
              <Link key={link.href} to={link.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${location.pathname === link.href
                    ? 'text-accent-light bg-accent/10'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`}>
                <link.icon size={15} />
                {link.label}
              </Link>
            ))}

            {/* Genre Dropdown */}
            <div className="relative" onMouseLeave={() => setGenreOpen(false)}>
              <button onMouseEnter={() => setGenreOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all">
                Genres <ChevronDown size={13} className={`transition-transform ${genreOpen ? 'rotate-180' : ''}`} />
              </button>
              {genreOpen && (
                <div className="absolute top-full left-0 mt-1 glass rounded-xl p-3 w-72 grid grid-cols-3 gap-1 shadow-2xl animate-fade-in">
                  {genres.map(g => (
                    <Link key={g} to={`/genre/${g.toLowerCase().replace(/ /g,'-')}`}
                      className="genre-tag text-center">{g}</Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={openSearch}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 transition-all text-text-secondary hover:text-white text-sm">
              <Search size={16} />
              <span className="hidden sm:block text-xs">Search anime...</span>
            </button>
            <Link to="/watchlist"
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 transition-all text-text-secondary hover:text-accent-light">
              <Bookmark size={18} />
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 transition-all text-text-secondary hover:text-white">
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden glass-strong border-t border-white/8 animate-fade-in">
            <div className="max-w-screen-xl mx-auto px-4 py-4 flex flex-col gap-1">
              {navLinks.map(link => (
                <Link key={link.href} to={link.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all">
                  <link.icon size={18} />
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-white/8 mt-2">
                <p className="text-xs text-text-muted px-4 mb-2 font-medium uppercase tracking-wider">Genres</p>
                <div className="flex flex-wrap gap-2 px-4">
                  {genres.map(g => (
                    <Link key={g} to={`/genre/${g.toLowerCase().replace(/ /g,'-')}`} className="genre-tag">{g}</Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setSearchOpen(false)}>
          <div className="flex items-start justify-center pt-24 px-4" onClick={e => e.stopPropagation()}>
            <div ref={searchRef} className="w-full max-w-2xl glass rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-white/8">
                <Search size={20} className="text-text-muted flex-shrink-0" />
                <input ref={inputRef} value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Search for anime..."
                  className="flex-1 bg-transparent text-text-primary placeholder-text-muted outline-none text-lg" />
                {query && <button onClick={() => setQuery('')} className="text-text-muted hover:text-white"><X size={18} /></button>}
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="p-2">
                  {suggestions.map(s => (
                    <button key={s.id} onClick={() => handleSearch(s.name)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-left">
                      {s.poster && <img src={s.poster} alt="" className="w-10 h-14 object-cover rounded-lg flex-shrink-0" />}
                      <div>
                        <p className="text-text-primary font-medium text-sm line-clamp-1">{s.name}</p>
                        {s.jname && <p className="text-text-muted text-xs line-clamp-1">{s.jname}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Search History */}
              {!query && searchHistory.length > 0 && (
                <div className="p-4">
                  <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-3">Recent Searches</p>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.map(h => (
                      <button key={h} onClick={() => { setQuery(h); handleSearch(h) }}
                        className="genre-tag">{h}</button>
                    ))}
                  </div>
                </div>
              )}

              {!query && searchHistory.length === 0 && (
                <div className="p-6 text-center text-text-muted text-sm">
                  Start typing to search anime...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
