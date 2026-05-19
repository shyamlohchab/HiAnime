import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Play, Star, Calendar, Clock, Tv, Bookmark, BookmarkCheck } from 'lucide-react'
import { getAnimeInfo, getAnimeEpisodes } from '../api/anime'
import AnimeCard from '../components/ui/AnimeCard'
import { SkeletonText } from '../components/ui/Skeleton'
import { useWatchlist } from '../context/WatchlistContext'
import { useToast } from '../context/ToastContext'
import { useScrollTop } from '../hooks/useAnime'

const EPS_PER_PAGE = 50

export default function AnimePage() {
  const { id } = useParams()
  const [info, setInfo] = useState(null)
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [epPage, setEpPage] = useState(1)
  const { toggle, inList } = useWatchlist()
  const { show } = useToast()
  useScrollTop()

  useEffect(() => {
    setLoading(true)
    setInfo(null)
    setEpisodes([])
    setEpPage(1)
    Promise.all([getAnimeInfo(id), getAnimeEpisodes(id)])
      .then(([infoRes, epRes]) => {
        setInfo(infoRes.data?.data || infoRes.data)
        setEpisodes(epRes.data?.data?.episodes || epRes.data?.episodes || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const anime = info?.anime?.info || info?.info || info
  const moreInfo = info?.anime?.moreInfo || info?.moreInfo || {}
  const related = info?.relatedAnimes || []
  const recommended = info?.recommendedAnimes || []
  const seasons = info?.seasons || []

  if (loading) return <PageSkeleton />
  if (!anime) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center text-text-muted"><p className="text-6xl mb-4">🎌</p><p>Anime not found</p></div>
    </div>
  )

  const title = anime.name || anime.title || 'Unknown'
  const poster = anime.poster || anime.image
  const desc = anime.description || ''
  const rating = anime.stats?.rating || anime.rating
  const genres = anime.genres || moreInfo.genres || []
  const totalEps = episodes.length
  const pagedEps = episodes.slice((epPage - 1) * EPS_PER_PAGE, epPage * EPS_PER_PAGE)
  const totalPages = Math.ceil(totalEps / EPS_PER_PAGE)
  const firstEpId = episodes[0]?.episodeId || ''

  const handleWatchlist = () => {
    toggle({ id, name: title, poster })
    show(inList(id) ? 'Removed from watchlist' : 'Added to watchlist ✓', inList(id) ? 'info' : 'success')
  }

  return (
    <div className="min-h-screen pt-16">
      {/* Banner */}
      <div className="relative h-72 overflow-hidden">
        <img src={anime.banner || poster} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,transparent 20%,rgba(9,9,11,1) 100%)' }} />
      </div>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-8 -mt-36 relative z-10">
        <div className="flex gap-8 flex-col md:flex-row">
          {/* Poster + actions */}
          <div className="flex-shrink-0">
            <div className="w-40 rounded-2xl overflow-hidden shadow-2xl border border-white/10 mx-auto md:mx-0">
              <img src={poster} alt={title} className="w-full aspect-[2/3] object-cover" />
            </div>
            <div className="flex flex-col gap-2 mt-4 w-40 mx-auto md:mx-0">
              <Link to={`/watch/${id}?ep=${firstEpId}`} className="btn-accent flex items-center justify-center gap-2 w-full">
                <Play size={15} fill="white" /> Watch Now
              </Link>
              <button onClick={handleWatchlist} className="btn-ghost flex items-center justify-center gap-2 w-full text-sm">
                {inList(id) ? <><BookmarkCheck size={15} className="text-accent-light" /> Saved</> : <><Bookmark size={15} /> Add to List</>}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 pt-32 md:pt-0">
            <div className="flex flex-wrap gap-2 mb-3">
              {genres.map(g => <span key={g} className="genre-tag">{g}</span>)}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2" style={{ fontFamily: 'Outfit' }}>{title}</h1>
            {anime.jname && <p className="text-text-muted text-sm mb-3">{anime.jname}</p>}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {rating && <span className="score-badge"><Star size={11} fill="currentColor" /> {rating}</span>}
              {anime.stats?.episodes?.sub > 0 && <span className="badge-sub">Sub · {anime.stats.episodes.sub} ep</span>}
              {anime.stats?.episodes?.dub > 0 && <span className="badge-dub">Dub · {anime.stats.episodes.dub} ep</span>}
              {moreInfo.status && <span className="text-xs text-text-secondary flex items-center gap-1"><Tv size={12} /> {moreInfo.status}</span>}
            </div>
            <p className="text-text-secondary text-sm leading-relaxed max-w-2xl mb-6">{desc}</p>
            {seasons.length > 1 && (
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-2">Seasons</p>
                <div className="flex flex-wrap gap-2">
                  {seasons.map(s => (
                    <Link key={s.id} to={`/anime/${s.id}`}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${s.id === id ? 'border-accent/60 bg-accent/10 text-accent-light' : 'border-white/10 bg-bg-elevated text-text-secondary hover:border-accent/30'}`}>
                      {s.title || s.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Episodes */}
        {episodes.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="section-title">Episodes <span className="text-text-muted font-normal text-base ml-1">({totalEps})</span></h2>
              {totalPages > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button key={i} onClick={() => setEpPage(i + 1)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${epPage === i + 1 ? 'bg-accent text-white' : 'bg-bg-elevated text-text-muted hover:text-white border border-white/8'}`}>
                      {i * EPS_PER_PAGE + 1}–{Math.min((i + 1) * EPS_PER_PAGE, totalEps)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {pagedEps.map(ep => (
                <Link key={ep.episodeId} to={`/watch/${id}?ep=${ep.episodeId}`}
                  className="episode-item flex-col items-start gap-0.5 bg-bg-elevated">
                  <span className="text-xs text-accent-light font-bold">EP {ep.number}</span>
                  <span className="text-text-primary text-xs leading-snug line-clamp-2">{ep.title || `Episode ${ep.number}`}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="section-title mb-5">Related Anime</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {related.slice(0, 6).map(a => <AnimeCard key={a.id} anime={a} />)}
            </div>
          </div>
        )}

        {recommended.length > 0 && (
          <div className="mt-12 mb-16">
            <h2 className="section-title mb-5">Recommended</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recommended.slice(0, 12).map(a => <AnimeCard key={a.id} anime={a} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="min-h-screen pt-16">
      <div className="skeleton h-72 w-full" />
      <div className="max-w-screen-xl mx-auto px-4 sm:px-8 -mt-36 relative z-10 flex gap-8">
        <div className="skeleton w-40 h-56 rounded-2xl flex-shrink-0" />
        <div className="flex-1 pt-32 space-y-4"><SkeletonText lines={5} /></div>
      </div>
    </div>
  )
}
