import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getSchedule } from '../api/anime'
import { useScrollTop } from '../hooks/useAnime'

export default function SchedulePage() {
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  useScrollTop()

  useEffect(() => {
    getSchedule()
      .then(data => setSchedule(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const formatTime = (timestamp) => {
    if (!timestamp) return null
    return new Date(timestamp * 1000).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const withAiring = schedule.filter(s => s.nextAiringEpisode)
  const withoutAiring = schedule.filter(s => !s.nextAiringEpisode)

  return (
    <div className="min-h-screen pt-24 px-4 sm:px-8">
      <div className="max-w-screen-xl mx-auto">
        <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'Outfit' }}>Airing Schedule</h1>
        <p className="text-text-muted text-sm mb-8">Currently airing anime and their next episode schedule</p>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-xl" />
            ))}
          </div>
        )}

        {withAiring.length > 0 && (
          <div className="mb-10">
            <h2 className="section-title mb-5">Upcoming Episodes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {withAiring.slice(0, 30).map(anime => (
                <Link key={anime.id} to={`/anime/${anime.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated hover:bg-bg-card border border-white/5 hover:border-accent/30 transition-all">
                  <img src={anime.coverImage?.medium} alt="" className="w-12 h-16 object-cover rounded-lg flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-text-primary text-sm font-medium line-clamp-1">{anime.title?.english || anime.title?.romaji}</p>
                    <p className="text-accent-light text-xs mt-0.5">EP {anime.nextAiringEpisode.episode}</p>
                    <p className="text-text-muted text-xs mt-0.5">{formatTime(anime.nextAiringEpisode.airingAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {withoutAiring.length > 0 && (
          <div className="mb-16">
            <h2 className="section-title mb-5">Currently Airing</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {withoutAiring.slice(0, 24).map(anime => (
                <Link key={anime.id} to={`/anime/${anime.id}`}
                  className="flex flex-col items-center text-center gap-2 p-3 rounded-xl bg-bg-elevated hover:bg-bg-card border border-white/5 hover:border-accent/30 transition-all">
                  <img src={anime.coverImage?.medium} alt="" className="w-full aspect-[2/3] object-cover rounded-lg" />
                  <p className="text-text-secondary text-xs line-clamp-2">{anime.title?.english || anime.title?.romaji}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
