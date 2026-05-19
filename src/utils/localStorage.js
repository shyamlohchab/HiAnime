// Watchlist
export const getWatchlist = () => {
  try { return JSON.parse(localStorage.getItem('hianime_watchlist') || '[]') }
  catch { return [] }
}
export const addToWatchlist = (anime) => {
  const list = getWatchlist()
  if (!list.find(a => a.id === anime.id)) {
    localStorage.setItem('hianime_watchlist', JSON.stringify([anime, ...list]))
  }
}
export const removeFromWatchlist = (id) => {
  const list = getWatchlist().filter(a => a.id !== id)
  localStorage.setItem('hianime_watchlist', JSON.stringify(list))
}
export const isInWatchlist = (id) => getWatchlist().some(a => a.id === id)

// Watch History
export const getHistory = () => {
  try { return JSON.parse(localStorage.getItem('hianime_history') || '[]') }
  catch { return [] }
}
export const addToHistory = (entry) => {
  const list = getHistory().filter(h => h.animeId !== entry.animeId || h.episodeId !== entry.episodeId)
  localStorage.setItem('hianime_history', JSON.stringify([entry, ...list].slice(0, 50)))
}
export const clearHistory = () => localStorage.removeItem('hianime_history')

// Settings
export const getSettings = () => {
  try {
    return JSON.parse(localStorage.getItem('hianime_settings') || JSON.stringify({
      autoPlay: true, autoNext: true, autoSkip: false, preferDub: false,
    }))
  } catch { return { autoPlay: true, autoNext: true, autoSkip: false, preferDub: false } }
}
export const saveSettings = (settings) => {
  localStorage.setItem('hianime_settings', JSON.stringify(settings))
}

// Search History
export const getSearchHistory = () => {
  try { return JSON.parse(localStorage.getItem('hianime_search_history') || '[]') }
  catch { return [] }
}
export const addSearchHistory = (query) => {
  const list = getSearchHistory().filter(q => q !== query)
  localStorage.setItem('hianime_search_history', JSON.stringify([query, ...list].slice(0, 10)))
}
export const clearSearchHistory = () => localStorage.removeItem('hianime_search_history')
