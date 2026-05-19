import { useEffect, useState } from 'react'
import { getHome } from '../api/anime'
import Hero from '../components/home/Hero'
import AnimeRow from '../components/home/AnimeRow'
import { Link } from 'react-router-dom'
import { getHistory } from '../utils/localStorage'
import AnimeCard from '../components/ui/AnimeCard'

const genres = [
  { name: 'Action', emoji: '⚔️' }, { name: 'Romance', emoji: '💕' },
  { name: 'Comedy', emoji: '😄' }, { name: 'Fantasy', emoji: '✨' },
  { name: 'Horror', emoji: '👻' }, { name: 'Sci-Fi', emoji: '🚀' },
  { name: 'Adventure', emoji: '🗺️' }, { name: 'Drama', emoji: '🎭' },
  { name: 'Sports', emoji: '⚽' }, { name: 'Slice of Life', emoji: '🌸' },
  { name: 'Supernatural', emoji: '🌙' }, { name: 'Thriller', emoji: '🔪' },
]

export default function Home() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState([])

  useEffect(() => {
    setHistory(getHistory().slice(0, 6))
    getHome()
      .then(r => setData(r.data?.data || r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const spotlights = data?.spotlightAnimes || []
  const trending = data?.trendingAnimes || []
  const topAiring = data?.topAiringAnimes || []
  const mostPopular = data?.mostPopularAnimes || []
  const mostFavorite = data?.mostFavoriteAnimes || []
  const latestEpisode = data?.latestEpisodeAnimes || []
  const upcoming = data?.topUpcomingAnimes || []

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <Hero spotlights={spotlights} />

      {/* Continue Watching */}
      {history.length > 0 && (
        <section className="px-4 sm:px-8 py-6 -mt-6 relative z-10">
          <div className="max-w-screen-xl mx-auto">
            <h2 className="section-title mb-5">Continue Watching</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {history.map(h => (
                <AnimeCard key={h.episodeId} anime={{ id: h.animeId, name: h.title, poster: h.poster }} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending */}
      <div className="relative z-10 -mt-4">
        <AnimeRow title="🔥 Trending Now" animes={trending} loading={loading} href="/trending" />
        <AnimeRow title="📺 Top Airing" animes={topAiring} loading={loading} />

        {/* Genre Quick Access */}
        <section className="px-4 sm:px-8 py-6">
          <div className="max-w-screen-xl mx-auto">
            <h2 className="section-title mb-5">Browse by Genre</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {genres.map(g => (
                <Link key={g.name} to={`/genre/${g.name.toLowerCase().replace(/ /g,'-')}`}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-bg-elevated hover:bg-bg-card border border-white/5 hover:border-accent/30 transition-all group">
                  <span className="text-2xl group-hover:scale-110 transition-transform">{g.emoji}</span>
                  <span className="text-text-secondary text-xs font-medium group-hover:text-text-primary transition-colors text-center">{g.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <AnimeRow title="⭐ Most Popular" animes={mostPopular} loading={loading} />
        <AnimeRow title="💖 Most Favorite" animes={mostFavorite} loading={loading} />
        <AnimeRow title="🆕 Latest Episodes" animes={latestEpisode} loading={loading} />
        <AnimeRow title="⏳ Upcoming" animes={upcoming} loading={loading} />
      </div>
    </div>
  )
}
