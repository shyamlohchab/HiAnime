import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Settings, Tv, List } from 'lucide-react'
import Artplayer from 'artplayer'
import Hls from 'hls.js'
import { getAnimeEpisodes, getEpisodeSources, getEpisodeServers } from '../api/anime'
import { addToHistory } from '../utils/localStorage'
import { useSettings } from '../context/SettingsContext'
import { useToast } from '../context/ToastContext'

export default function WatchPage() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const epId = searchParams.get('ep')
  const [episodes, setEpisodes] = useState([])
  const [currentEp, setCurrentEp] = useState(null)
  const [sources, setSources] = useState(null)
  const [servers, setServers] = useState({ sub: [], dub: [] })
  const [server, setServer] = useState('beep')
  const [category, setCategory] = useState('sub')
  const [loadingSource, setLoadingSource] = useState(false)
  const [showList, setShowList] = useState(true)
  const artRef = useRef(null)
  const playerRef = useRef(null)
  const currentTimeRef = useRef(0)
  const { settings, update } = useSettings()
  const { show } = useToast()

  // Load episodes list
  useEffect(() => {
    getAnimeEpisodes(id)
      .then(r => {
        const eps = r.data?.data?.episodes || r.data?.episodes || []
        setEpisodes(eps)
      })
      .catch(console.error)
  }, [id])

  // Resolve current episode
  useEffect(() => {
    if (!episodes.length) return
    const ep = epId ? episodes.find(e => e.episodeId === epId) || episodes[0] : episodes[0]
    setCurrentEp(ep)
    currentTimeRef.current = 0 // Reset playhead when episode changes!
  }, [episodes, epId])

  // Fetch servers list once per episode
  useEffect(() => {
    if (!currentEp) return
    getEpisodeServers(currentEp.episodeId)
      .then(r => {
        const s = r.data || { sub: [], dub: [] }
        setServers(s)
        
        // Add to history once servers are loaded
        addToHistory({
          animeId: id, episodeId: currentEp.episodeId,
          title: currentEp.title || `Episode ${currentEp.number}`,
          poster: '', number: currentEp.number,
          timestamp: Date.now(),
        })
      })
      .catch(console.error)
  }, [currentEp, id])

  // Fetch actual stream URL dynamically when episode, server, or category changes
  useEffect(() => {
    if (!currentEp) return
    
    const available = servers[category] || []
    if (available.length === 0) return
    
    const activeServer = available.find(s => s.serverId === server) || available[0]
    if (activeServer && activeServer.serverId !== server) {
      setServer(activeServer.serverId)
      return
    }
    
    setLoadingSource(true)
    getEpisodeSources(currentEp.episodeId, server, category)
      .then(r => {
        const src = r.data || null
        setSources(src)
      })
      .catch(console.error)
      .finally(() => setLoadingSource(false))
  }, [currentEp, server, category, servers])

  const availableServers = servers[category] || []
  const selectedServerObj = availableServers.find(s => s.serverId === server) || availableServers[0]
  const embed_url = selectedServerObj?.embed_url || sources?.embed_url

  const handlePlaybackFailure = useCallback(() => {
    if (availableServers.length === 0) return

    const idx = availableServers.findIndex(s => (s.serverId === server || s.serverName === server))
    if (idx !== -1 && idx < availableServers.length - 1) {
      const nextServerObj = availableServers[idx + 1]
      const nextServerId = nextServerObj.serverId || nextServerObj.serverName
      show(`Server ${server} failed to respond. Auto-switching to ${nextServerId}...`, 'info')
      setServer(nextServerId)
    } else {
      show('All available streaming servers failed. Please switch sub/dub or choose another episode.', 'error')
    }
  }, [availableServers, server, show])

  const fallbackRef = useRef(handlePlaybackFailure)
  useEffect(() => {
    fallbackRef.current = handlePlaybackFailure
  }, [handlePlaybackFailure])

  // Init / update ArtPlayer
  useEffect(() => {
    if (!sources || !artRef.current) {
      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
      }
      return
    }
    const url = sources.sources?.[0]?.url || sources.url || ''
    if (!url) return

    if (playerRef.current) {
      playerRef.current.destroy()
      playerRef.current = null
    }

    const subtitles = (sources.tracks || sources.subtitles || [])
      .filter(t => t.kind === 'captions' || t.kind === 'subtitles')
      .map(t => ({ default: t.default || false, html: t.label || 'English', url: t.file || t.url }))

    let fallbackTriggered = false
    const triggerFallback = () => {
      if (fallbackTriggered) return
      fallbackTriggered = true
      fallbackRef.current()
    }

    let initialStallTimeout = null
    let midStreamStallTimeout = null

    const startInitialStallTimer = (artInstance) => {
      if (initialStallTimeout) clearTimeout(initialStallTimeout)
      initialStallTimeout = setTimeout(() => {
        if (artInstance.video && !artInstance.video.paused && artInstance.video.currentTime === 0) {
          console.warn('Initial load watchdog triggered - stalled at 0.0s.')
          triggerFallback()
        }
      }, 5500)
    }

    const clearStallTimers = () => {
      if (initialStallTimeout) { clearTimeout(initialStallTimeout); initialStallTimeout = null }
      if (midStreamStallTimeout) { clearTimeout(midStreamStallTimeout); midStreamStallTimeout = null }
    }

    const art = new Artplayer({
      container: artRef.current,
      url,
      type: 'm3u8',
      autoplay: settings.autoPlay,
      pip: true,
      fullscreen: true,
      fullscreenWeb: true,
      subtitle: subtitles[0] ? { url: subtitles[0].url, type: 'vtt', style: { color: '#fff', fontSize: '20px' } } : {},
      settings: subtitles.length > 1 ? [{ html: 'Subtitle', selector: subtitles }] : [],
      customType: {
        m3u8: (video, url, art) => {
          if (Hls.isSupported()) {
            const hls = new Hls({ enableWorker: false })
            hls.loadSource(url)
            hls.attachMedia(video)
            art.hls = hls

            hls.on(Hls.Events.ERROR, (event, data) => {
              if (data.fatal) {
                console.error(`Hls.js Fatal Error: ${data.type} - ${data.details}`)
                if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                  hls.startLoad()
                } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                  hls.recoverMediaError()
                } else {
                  triggerFallback()
                }
              }
            })

            art.on('destroy', () => hls.destroy())
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url
          }
        }
      }
    })

    playerRef.current = art

    // Track playhead position in real-time
    art.on('video:timeupdate', () => {
      if (art.video && art.video.currentTime > 0) {
        currentTimeRef.current = art.video.currentTime
      }
    })

    // Listen to native HTML5 error events
    art.on('video:error', (err) => {
      console.error('ArtPlayer native video error:', err)
      triggerFallback()
    })

    // Monitor initial and mid-playback stalled states
    art.on('video:play', () => {
      startInitialStallTimer(art)
    })

    art.on('video:playing', () => {
      clearStallTimers()
    })

    art.on('video:waiting', () => {
      if (midStreamStallTimeout) clearTimeout(midStreamStallTimeout)
      midStreamStallTimeout = setTimeout(() => {
        if (art.video && !art.video.ended && art.video.readyState < 3) {
          console.warn('Mid-stream watchdog triggered - stalled waiting for data.')
          triggerFallback()
        }
      }, 7000)
    })

    // Seek back to playhead position on ready
    art.on('ready', () => {
      if (currentTimeRef.current > 1) {
        console.log(`Resuming playback at: ${currentTimeRef.current}s`)
        art.seek = currentTimeRef.current
        art.play()
      }
    })

    return () => {
      clearStallTimers()
      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
      }
    }
  }, [sources, settings.autoPlay])

  const navigateEp = (dir) => {
    if (!episodes.length || !currentEp) return
    const idx = episodes.findIndex(e => e.episodeId === currentEp.episodeId)
    const next = episodes[idx + dir]
    if (next) setSearchParams({ ep: next.episodeId })
  }

  const prevEp = episodes[episodes.findIndex(e => e.episodeId === currentEp?.episodeId) - 1]
  const nextEp = episodes[episodes.findIndex(e => e.episodeId === currentEp?.episodeId) + 1]



  return (
    <div className="min-h-screen pt-16 bg-bg-base">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
          <Link to={`/anime/${id}`} className="hover:text-accent-light transition-colors flex items-center gap-1">
            <ChevronLeft size={14} /> Back to Info
          </Link>
          {currentEp && <span className="text-text-dim">· Episode {currentEp.number}</span>}
        </div>

        <div className={`flex gap-6 ${showList ? 'flex-col lg:flex-row' : 'flex-col'}`}>
          {/* Player Section */}
          <div className="flex-1 min-w-0">
            {/* Player Wrapper with Ambilight backglow */}
            <div className="relative">
              {/* Ambilight glow */}
              <div 
                className="theater-glow" 
                style={{ 
                  backgroundImage: currentEp?.img ? `url(${currentEp.img})` : 'none',
                  backgroundColor: 'rgba(124, 58, 237, 0.2)'
                }} 
              />
              
              <div className="relative rounded-2xl overflow-hidden bg-black shadow-glow-sm border border-white/5" style={{ aspectRatio: '16/9' }}>
                {loadingSource && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80">
                    <div className="spinner" />
                  </div>
                )}
              {embed_url ? (
                <iframe 
                  src={embed_url} 
                  allowFullScreen 
                  className="w-full h-full border-0" 
                  title="Video Player"
                />
              ) : (
                <div ref={artRef} className="w-full h-full" />
              )}
            </div>
          </div>

            {/* Controls bar */}
            <div className="glass rounded-2xl mt-3 p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-text-primary font-bold text-lg" style={{ fontFamily: 'Outfit' }}>
                    {currentEp ? `Episode ${currentEp.number}${currentEp.title ? ` — ${currentEp.title}` : ''}` : 'Loading...'}
                  </h1>
                  <Link to={`/anime/${id}`} className="text-text-muted text-sm hover:text-accent-light transition-colors">View Anime Info</Link>
                </div>

                {/* Episode Nav */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button disabled={!prevEp} onClick={() => navigateEp(-1)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${prevEp ? 'bg-bg-elevated hover:bg-bg-card text-text-secondary hover:text-white border border-white/8' : 'opacity-30 cursor-not-allowed bg-bg-elevated text-text-dim border border-white/5'}`}>
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button disabled={!nextEp} onClick={() => navigateEp(1)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${nextEp ? 'bg-accent text-white hover:bg-accent/90' : 'opacity-30 cursor-not-allowed bg-bg-elevated text-text-dim border border-white/5'}`}>
                    Next <ChevronRight size={14} />
                  </button>
                  <button onClick={() => setShowList(!showList)}
                    className="p-2 rounded-lg bg-bg-elevated hover:bg-bg-card border border-white/8 text-text-muted hover:text-white transition-all">
                    <List size={16} />
                  </button>
                </div>
              </div>

              {/* Sub/Dub + Server */}
              <div className="flex items-center gap-4 mt-4 flex-wrap">
                <div className="flex items-center gap-1 p-1 bg-bg-base rounded-xl">
                  {['sub', 'dub'].map(c => (
                    <button key={c} onClick={() => setCategory(c)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${category === c ? 'bg-accent text-white' : 'text-text-muted hover:text-white'}`}>
                      {c}
                    </button>
                  ))}
                </div>
                {availableServers.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tv size={14} className="text-text-muted" />
                    {availableServers.map(s => (
                      <button key={s.serverId || s.serverName}
                        onClick={() => setServer(s.serverName || s.serverId)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                          server === (s.serverName || s.serverId)
                            ? 'border-accent/60 bg-accent/10 text-accent-light'
                            : 'border-white/10 bg-bg-elevated text-text-secondary hover:border-accent/30'
                        }`}>
                        {s.serverName || s.serverId}
                      </button>
                    ))}
                  </div>
                )}

                {/* Settings */}
                <div className="flex items-center gap-3 ml-auto flex-wrap">
                  {[['autoPlay', 'Autoplay'], ['autoNext', 'Auto Next']].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <div onClick={() => update(key, !settings[key])}
                        className={`w-9 h-5 rounded-full transition-all relative ${settings[key] ? 'bg-accent' : 'bg-bg-elevated border border-white/20'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${settings[key] ? 'left-[18px]' : 'left-0.5'}`} />
                      </div>
                      <span className="text-xs text-text-muted">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Episode List Sidebar */}
          {showList && (
            <div className="lg:w-72 flex-shrink-0">
              <div className="glass rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/8">
                  <h3 className="font-semibold text-text-primary text-sm">Episodes ({episodes.length})</h3>
                </div>
                <div className="overflow-y-auto" style={{ maxHeight: '520px' }}>
                  {episodes.map(ep => (
                    <Link key={ep.episodeId} to={`/watch/${id}?ep=${ep.episodeId}`}
                      className={`episode-item mx-2 my-1 ${ep.episodeId === currentEp?.episodeId ? 'active' : ''}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        ep.episodeId === currentEp?.episodeId ? 'bg-accent text-white' : 'bg-bg-base text-text-muted'
                      }`}>{ep.number}</div>
                      <span className="text-xs text-text-secondary line-clamp-2 leading-snug flex-1">
                        {ep.title || `Episode ${ep.number}`}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
