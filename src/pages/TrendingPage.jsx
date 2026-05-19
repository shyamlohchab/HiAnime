import { useState, useEffect } from 'react'
import { getCategory } from '../api/anime'
import AnimeCard from '../components/ui/AnimeCard'
import { SkeletonCard } from '../components/ui/Skeleton'
import { useScrollTop } from '../hooks/useAnime'

export default function TrendingPage() {
  const [animes, setAnimes] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [tab, setTab] = useState('top-airing')
  useScrollTop()

  const tabs = [
    { id: 'top-airing', label: '📺 Top Airing' },
    { id: 'most-popular', label: '🔥 Most Popular' },
    { id: 'most-favorite', label: '💖 Most Favorite' },
    { id: 'top-upcoming', label: '⏳ Upcoming' },
  ]

  useEffect(() => {
    setLoading(true)
    setAnimes([])
    setPage(1)
    getCategory(tab, 1)
      .then(r => {
        const data = r.data?.data || r.data
        const list = data?.animes || data?.topAiringAnimes || data?.mostPopularAnimes || []
        setAnimes(list)
        setHasMore(data?.hasNextPage || false)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [tab])

  const loadMore = () => {
    const next = page + 1
    setLoading(true)
    getCategory(tab, next)
      .then(r => {
        const data = r.data?.data || r.data
        const list = data?.animes || data?.topAiringAnimes || data?.mostPopularAnimes || []
        setAnimes(prev => [...prev, ...list])
        setHasMore(data?.hasNextPage || false)
        setPage(next)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  return (
    <div className="min-h-screen pt-24 px-4 sm:px-8">
      <div className="max-w-screen-xl mx-auto">
        <h1 className="text-3xl font-black text-white mb-6" style={{ fontFamily: 'Outfit' }}>Browse Anime</h1>
        <div className="flex items-center gap-1 p-1 bg-bg-elevated rounded-xl w-fit mb-8 flex-wrap">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-accent text-white' : 'text-text-muted hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {animes.map((a, i) => <AnimeCard key={a.id} anime={a} showRank={i < 10 ? i + 1 : undefined} />)}
          {loading && Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        {hasMore && !loading && (
          <div className="flex justify-center mt-10 mb-10">
            <button onClick={loadMore} className="btn-accent px-10">Load More</button>
          </div>
        )}
      </div>
    </div>
  )
}
