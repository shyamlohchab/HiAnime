import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { searchAnime } from '../api/anime'
import { useDebounce, useScrollTop } from '../hooks/useAnime'
import { addSearchHistory } from '../utils/localStorage'
import AnimeCard from '../components/ui/AnimeCard'
import { SkeletonCard } from '../components/ui/Skeleton'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  useScrollTop()

  useEffect(() => {
    if (!q) { setResults([]); return }
    setLoading(true)
    setPage(1)
    searchAnime(q, 1)
      .then(r => {
        const data = r.data?.data || r.data
        setResults(data?.animes || [])
        setHasMore(data?.hasNextPage || false)
        addSearchHistory(q)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [q])

  const loadMore = () => {
    const next = page + 1
    setLoading(true)
    searchAnime(q, next)
      .then(r => {
        const data = r.data?.data || r.data
        setResults(prev => [...prev, ...(data?.animes || [])])
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
          <h1 className="text-2xl font-bold text-text-primary mb-2" style={{ fontFamily: 'Outfit' }}>
            {q ? `Results for "${q}"` : 'Search Anime'}
          </h1>
          {q && results.length > 0 && <p className="text-text-muted text-sm">{results.length}+ results found</p>}
        </div>

        {!q && (
          <div className="text-center py-20 text-text-muted">
            <Search size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">Search for your favorite anime above</p>
          </div>
        )}

        {q && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {results.map(a => <AnimeCard key={a.id} anime={a} />)}
            {loading && Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {hasMore && !loading && (
          <div className="flex justify-center mt-10">
            <button onClick={loadMore} className="btn-accent px-10">Load More</button>
          </div>
        )}

        {q && !loading && results.length === 0 && (
          <div className="text-center py-20 text-text-muted">
            <p className="text-5xl mb-4">😔</p>
            <p className="text-lg font-medium mb-2">No results for "{q}"</p>
            <p className="text-sm">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  )
}
