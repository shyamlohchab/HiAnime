import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Play, Info, ChevronLeft, ChevronRight, Star } from 'lucide-react'

export default function Hero({ spotlights = [] }) {
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)

  const goTo = useCallback((idx) => {
    if (animating || idx === current) return
    setAnimating(true)
    setCurrent(idx)
    setTimeout(() => setAnimating(false), 600)
  }, [animating, current])

  const prev = () => goTo((current - 1 + spotlights.length) % spotlights.length)
  const next = useCallback(() => goTo((current + 1) % spotlights.length), [current, spotlights.length, goTo])

  useEffect(() => {
    if (!spotlights.length) return
    const t = setInterval(next, 6000)
    return () => clearInterval(t)
  }, [next, spotlights.length])

  if (!spotlights.length) return <HeroSkeleton />

  const anime = spotlights[current]
  const id = anime?.id
  const title = anime?.name || 'Unknown'
  const desc = anime?.description || ''
  const poster = anime?.poster || ''
  const banner = anime?.banner || poster
  const rating = anime?.rating
  const episodes = anime?.episodes

  return (
    <div className="relative w-full overflow-hidden" style={{ height: '90vh', minHeight: 500 }}>
      {/* Background Image */}
      {spotlights.map((s, i) => (
        <div key={s.id || i}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0 }}>
          <img
            src={s.banner || s.poster}
            alt=""
            className="w-full h-full object-cover"
          />
          {/* Overlays */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to right, rgba(9,9,11,0.95) 0%, rgba(9,9,11,0.7) 40%, rgba(9,9,11,0.2) 70%, transparent 100%)'
          }} />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to top, rgba(9,9,11,1) 0%, rgba(9,9,11,0.4) 30%, transparent 60%)'
          }} />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 h-full flex items-end pb-20 px-4 sm:px-8">
        <div className="max-w-screen-xl mx-auto w-full">
          <div className="max-w-2xl" style={{ opacity: animating ? 0 : 1, transform: animating ? 'translateY(10px)' : 'translateY(0)', transition: 'all 0.5s ease' }}>
            {/* Rank badge */}
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
                #{current + 1} Spotlight
              </span>
              {rating && (
                <span className="score-badge">
                  <Star size={10} fill="currentColor" /> {rating}
                </span>
              )}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-3 leading-tight text-glow"
              style={{ fontFamily: 'Outfit' }}>
              {title}
            </h1>

            {/* Episodes info */}
            {episodes && (
              <div className="flex items-center gap-3 mb-4">
                {episodes.sub > 0 && <span className="badge-sub">Sub · {episodes.sub} ep</span>}
                {episodes.dub > 0 && <span className="badge-dub">Dub · {episodes.dub} ep</span>}
              </div>
            )}

            <p className="text-text-secondary text-sm sm:text-base leading-relaxed mb-8 line-clamp-3">
              {desc}
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              <Link to={`/watch/${id}`}
                className="btn-accent flex items-center gap-2 text-base px-8 py-3">
                <Play size={18} fill="white" /> Watch Now
              </Link>
              <Link to={`/anime/${id}`}
                className="btn-ghost flex items-center gap-2 text-base px-6 py-3">
                <Info size={18} /> More Info
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="absolute bottom-8 right-8 z-10 flex items-center gap-3">
        <button onClick={prev}
          className="w-10 h-10 rounded-full glass flex items-center justify-center hover:border-accent/50 transition-all hover:text-accent-light">
          <ChevronLeft size={20} />
        </button>

        {/* Dots */}
        <div className="flex items-center gap-2">
          {spotlights.slice(0, 8).map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${i === current
                ? 'w-6 h-2 bg-accent-light'
                : 'w-2 h-2 bg-white/30 hover:bg-white/60'}`} />
          ))}
        </div>

        <button onClick={next}
          className="w-10 h-10 rounded-full glass flex items-center justify-center hover:border-accent/50 transition-all hover:text-accent-light">
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}

function HeroSkeleton() {
  return (
    <div className="skeleton w-full" style={{ height: '90vh', minHeight: 500 }} />
  )
}
