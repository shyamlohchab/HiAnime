import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getGenreAnime } from '../api/anime'
import AnimeCard from '../components/ui/AnimeCard'
import { SkeletonCard } from '../components/ui/Skeleton'
import { useScrollTop } from '../hooks/useAnime'

export default function GenrePage() {
  const { genre } = useParams()
  const [animes, setAnimes] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  useScrollTop()

  const displayName = genre.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  useEffect(() => {
    setLoading(true)
    setAnimes([])
    setPage(1)
    getGenreAnime(genre, 1)
      .then(r => {
        const data = r.data?.data || r.data
        setAnimes(data?.animes || [])
        setHasMore(data?.hasNextPage || false)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [genre])

  const loadMore = () => {
    const next = page + 1
    setLoading(true)
    getGenreAnime(genre, next)
      .then(r => {
        const data = r.data?.data || r.data
        setAnimes(prev => [...prev, ...(data?.animes || [])])
        setHasMore(data?.hasNextPage || false)
        setPage(next)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  return (
    <div className="min-h-screen pt-24 px-4 sm:px-8">
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white" style={{ fontFamily: 'Outfit' }}>{displayName} Anime</h1>
          <p className="text-text-muted text-sm mt-1">Browse all {displayName} anime</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {animes.map(a => <AnimeCard key={a.id} anime={a} />)}
          {loading && Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        {hasMore && !loading && (
          <div className="flex justify-center mt-10">
            <button onClick={loadMore} className="btn-accent px-10">Load More</button>
          </div>
        )}
      </div>
    </div>
  )
}
