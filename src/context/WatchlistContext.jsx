import { createContext, useContext, useState, useEffect } from 'react'
import { getWatchlist, addToWatchlist, removeFromWatchlist, isInWatchlist } from '../utils/localStorage'

const WatchlistContext = createContext(null)

export const WatchlistProvider = ({ children }) => {
  const [watchlist, setWatchlist] = useState([])

  useEffect(() => { setWatchlist(getWatchlist()) }, [])

  const add = (anime) => {
    addToWatchlist(anime)
    setWatchlist(getWatchlist())
  }
  const remove = (id) => {
    removeFromWatchlist(id)
    setWatchlist(getWatchlist())
  }
  const inList = (id) => isInWatchlist(id)
  const toggle = (anime) => inList(anime.id) ? remove(anime.id) : add(anime)

  return (
    <WatchlistContext.Provider value={{ watchlist, add, remove, toggle, inList }}>
      {children}
    </WatchlistContext.Provider>
  )
}

export const useWatchlist = () => {
  const ctx = useContext(WatchlistContext)
  if (!ctx) throw new Error('useWatchlist must be inside WatchlistProvider')
  return ctx
}
