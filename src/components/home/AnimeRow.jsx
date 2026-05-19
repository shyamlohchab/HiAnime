import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import AnimeCard from '../ui/AnimeCard'
import { SkeletonCard } from '../ui/Skeleton'

export default function AnimeRow({ title, href, animes = [], loading }) {
  const scrollRef = useRef(null)

  const scroll = (dir) => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir * 280, behavior: 'smooth' })
  }

  return (
    <section className="px-4 sm:px-8 py-6">
      <div className="max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title">{title}</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => scroll(-1)}
              className="p-2 rounded-lg bg-bg-elevated hover:bg-bg-card border border-white/8 text-text-muted hover:text-white transition-all">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => scroll(1)}
              className="p-2 rounded-lg bg-bg-elevated hover:bg-bg-card border border-white/8 text-text-muted hover:text-white transition-all">
              <ChevronRight size={18} />
            </button>
            {href && (
              <Link to={href}
                className="flex items-center gap-1 text-sm text-accent-light hover:text-accent-glow transition-colors ml-2 font-medium">
                View all <ChevronRight size={14} />
              </Link>
            )}
          </div>
        </div>

        {/* Scroll container */}
        <div ref={scrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar pb-2"
          style={{ scrollSnapType: 'x mandatory' }}>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-40 sm:w-44" style={{ scrollSnapAlign: 'start' }}>
                  <SkeletonCard />
                </div>
              ))
            : animes.map(anime => (
                <div key={anime.id || anime.animeId}
                  className="flex-shrink-0 w-40 sm:w-44"
                  style={{ scrollSnapAlign: 'start' }}>
                  <AnimeCard anime={anime} />
                </div>
              ))}
        </div>
      </div>
    </section>
  )
}
