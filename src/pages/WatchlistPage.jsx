import { useScrollTop } from '../hooks/useAnime'
import { useWatchlist } from '../context/WatchlistContext'
import { getHistory, clearHistory } from '../utils/localStorage'
import { useState } from 'react'
import AnimeCard from '../components/ui/AnimeCard'
import { Bookmark, Clock, Trash2 } from 'lucide-react'

export default function WatchlistPage() {
  useScrollTop()
  const { watchlist } = useWatchlist()
  const [history, setHistory] = useState(() => getHistory())
  const [tab, setTab] = useState('watchlist')

  return (
    <div className="min-h-screen pt-24 px-4 sm:px-8">
      <div className="max-w-screen-xl mx-auto">
        <h1 className="text-3xl font-black text-white mb-6" style={{ fontFamily: 'Outfit' }}>My Library</h1>
        <div className="flex items-center gap-1 p-1 bg-bg-elevated rounded-xl w-fit mb-8">
          {[['watchlist', 'Watchlist', Bookmark], ['history', 'History', Clock]].map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? 'bg-accent text-white' : 'text-text-muted hover:text-white'}`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {tab === 'watchlist' && (
          watchlist.length === 0
            ? <EmptyState icon="🔖" title="Your watchlist is empty" desc="Browse anime and click the bookmark icon to save them here." />
            : <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {watchlist.map(a => <AnimeCard key={a.id} anime={a} />)}
              </div>
        )}

        {tab === 'history' && (
          history.length === 0
            ? <EmptyState icon="⏱️" title="No watch history yet" desc="Start watching anime to track your history here." />
            : <>
                <div className="flex justify-end mb-4">
                  <button onClick={() => { clearHistory(); setHistory([]) }}
                    className="flex items-center gap-2 text-sm text-text-muted hover:text-red-400 transition-colors">
                    <Trash2 size={15} /> Clear History
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {history.map(h => (
                    <AnimeCard key={h.episodeId} anime={{ id: h.animeId, name: h.title, poster: h.poster, type: `EP ${h.number}` }} />
                  ))}
                </div>
              </>
        )}
      </div>
    </div>
  )
}

function EmptyState({ icon, title, desc }) {
  return (
    <div className="text-center py-24 text-text-muted">
      <p className="text-6xl mb-4">{icon}</p>
      <p className="text-xl font-semibold text-text-secondary mb-2">{title}</p>
      <p className="text-sm">{desc}</p>
    </div>
  )
}
