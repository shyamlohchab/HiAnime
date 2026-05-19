import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { WatchlistProvider } from './context/WatchlistContext'
import { SettingsProvider } from './context/SettingsContext'
import { ToastProvider } from './context/ToastContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Home from './pages/Home'
import AnimePage from './pages/AnimePage'
import WatchPage from './pages/WatchPage'
import SearchPage from './pages/SearchPage'
import GenrePage from './pages/GenrePage'
import TrendingPage from './pages/TrendingPage'
import WatchlistPage from './pages/WatchlistPage'
import SchedulePage from './pages/SchedulePage'
import NotFound from './pages/NotFound'
import ScrollToTop from './components/ui/ScrollToTop'

function AppLayout() {
  const location = useLocation()
  const isWatch = location.pathname.startsWith('/watch')

  return (
    <div className="relative min-h-screen bg-bg-base text-text-primary overflow-x-hidden">
      {/* Premium Floating Ambient Background Glow Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        <div className="absolute top-[10%] left-[-15%] w-[600px] h-[600px] rounded-full bg-glow-purple filter blur-[150px] animate-float-slow-1" />
        <div className="absolute top-[45%] right-[-15%] w-[700px] h-[700px] rounded-full bg-glow-pink filter blur-[160px] animate-float-slow-2" />
        <div className="absolute bottom-[5%] left-[10%] w-[650px] h-[650px] rounded-full bg-glow-cyan filter blur-[140px] animate-float-slow-1" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className={`flex-grow page-enter ${isWatch ? '' : 'pt-6'}`}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/anime/:id" element={<AnimePage />} />
            <Route path="/watch/:id" element={<WatchPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/genre/:genre" element={<GenrePage />} />
            <Route path="/trending" element={<TrendingPage />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        {!isWatch && <Footer />}
        <ScrollToTop />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <WatchlistProvider>
          <ToastProvider>
            <AppLayout />
          </ToastProvider>
        </WatchlistProvider>
      </SettingsProvider>
    </BrowserRouter>
  )
}
