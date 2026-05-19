import { Link } from 'react-router-dom'
import { Play, Bookmark, BookmarkCheck, Star } from 'lucide-react'
import { useWatchlist } from '../../context/WatchlistContext'
import { useToast } from '../../context/ToastContext'

export default function AnimeCard({ anime, showRank }) {
  const { toggle, inList } = useWatchlist()
  const { show } = useToast()

  if (!anime) return null

  const id = anime.id || anime.animeId
  const title = anime.name || anime.title || 'Unknown Title'
  const poster = anime.poster || anime.image || ''
  const rating = anime.rating || anime.score
  const episodes = anime.episodes

  const handleWatchlist = (e) => {
    e.preventDefault()
    e.stopPropagation()
    toggle({ id, name: title, poster })
    show(inList(id) ? 'Removed from watchlist' : 'Added to watchlist ✓',
      inList(id) ? 'info' : 'success')
  }

  return (
    <Link to={`/anime/${id}`} className="anime-card group block">
      {/* Poster */}
      <div className="relative aspect-[2/3] bg-bg-elevated overflow-hidden">
        {poster ? (
          <img src={poster} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl">🎌</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-card-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Card overlay glow */}
        <div className="card-overlay" />

        {/* Rank badge */}
        {showRank && (
          <div className="absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
            {showRank}
          </div>
        )}

        {/* Rating */}
        {rating && (
          <div className="absolute top-2 right-2 score-badge opacity-0 group-hover:opacity-100 transition-opacity">
            <Star size={10} fill="currentColor" />
            {rating}
          </div>
        )}

        {/* Episodes badges */}
        {episodes && (
          <div className="absolute bottom-2 left-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {episodes.sub > 0 && <span className="badge-sub">Sub {episodes.sub}</span>}
            {episodes.dub > 0 && <span className="badge-dub">Dub {episodes.dub}</span>}
          </div>
        )}

        {/* Play + Watchlist on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="flex flex-col items-center gap-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', boxShadow: '0 0 20px rgba(124,58,237,0.6)' }}>
              <Play size={20} fill="white" className="text-white ml-0.5" />
            </div>
            <button onClick={handleWatchlist}
              className="p-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 hover:border-accent/50 transition-all">
              {inList(id)
                ? <BookmarkCheck size={16} className="text-accent-light" />
                : <Bookmark size={16} className="text-white" />}
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-text-primary font-semibold text-sm line-clamp-2 leading-snug group-hover:text-accent-light transition-colors">
          {title}
        </h3>
        {anime.type && (
          <p className="text-text-muted text-xs mt-1">{anime.type}{anime.episodes?.sub ? ` · ${anime.episodes.sub} ep` : ''}</p>
        )}
      </div>
    </Link>
  )
}
