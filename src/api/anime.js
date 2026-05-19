import { gql, normalizeMedia } from './api'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Fragment for media fields
const MEDIA_FIELDS = `
  id title { romaji english native }
  coverImage { large extraLarge medium }
  bannerImage description genres format status episodes
  averageScore popularity trending duration season seasonYear
  startDate { year month day } endDate { year month day }
  studios(isMain:true) { nodes { name } }
  tags { name rank isMediaSpoiler }
  characters(role:MAIN, page:1, perPage:6) {
    edges { role node { id name { full } image { medium } } voiceActors(language:JAPANESE) { name { full } image { medium } } }
  }
  recommendations(perPage:8) { nodes { mediaRecommendation { id title { english romaji } coverImage { large } averageScore format } } }
  relations { edges { relationType(version:2) node { id title { english romaji } coverImage { large } format type } } }
`

const CARD_FIELDS = `
  id title { romaji english native }
  coverImage { large extraLarge }
  averageScore format episodes genres status trending popularity
`

// Home page data
export const getHome = async () => {
  const query = `
    query {
      spotlight: Page(page:1, perPage:8) {
        media(type:ANIME, sort:TRENDING_DESC, status:RELEASING, isAdult:false) { ${MEDIA_FIELDS} }
      }
      trending: Page(page:1, perPage:20) {
        media(type:ANIME, sort:TRENDING_DESC, isAdult:false) { ${CARD_FIELDS} }
      }
      topAiring: Page(page:1, perPage:20) {
        media(type:ANIME, sort:SCORE_DESC, status:RELEASING, isAdult:false) { ${CARD_FIELDS} }
      }
      popular: Page(page:1, perPage:20) {
        media(type:ANIME, sort:POPULARITY_DESC, isAdult:false) { ${CARD_FIELDS} }
      }
      favorite: Page(page:1, perPage:20) {
        media(type:ANIME, sort:FAVOURITES_DESC, isAdult:false) { ${CARD_FIELDS} }
      }
      upcoming: Page(page:1, perPage:20) {
        media(type:ANIME, sort:POPULARITY_DESC, status:NOT_YET_RELEASED, isAdult:false) { ${CARD_FIELDS} }
      }
    }
  `
  const res = await gql(query)
  const d = res.data?.data
  return {
    data: {
      spotlightAnimes: d?.spotlight?.media?.map(normalizeMedia) || [],
      trendingAnimes: d?.trending?.media?.map(normalizeMedia) || [],
      topAiringAnimes: d?.topAiring?.media?.map(normalizeMedia) || [],
      mostPopularAnimes: d?.popular?.media?.map(normalizeMedia) || [],
      mostFavoriteAnimes: d?.favorite?.media?.map(normalizeMedia) || [],
      topUpcomingAnimes: d?.upcoming?.media?.map(normalizeMedia) || [],
      latestEpisodeAnimes: d?.trending?.media?.slice(0, 20).map(normalizeMedia) || [],
    }
  }
}

// Search anime
export const searchAnime = async (q, page = 1) => {
  const query = `
    query($search:String, $page:Int) {
      Page(page:$page, perPage:24) {
        pageInfo { hasNextPage total }
        media(search:$search, type:ANIME, isAdult:false, sort:SEARCH_MATCH) { ${CARD_FIELDS} }
      }
    }
  `
  const res = await gql(query, { search: q, page })
  const d = res.data?.data?.Page
  return { data: { animes: d?.media?.map(normalizeMedia) || [], hasNextPage: d?.pageInfo?.hasNextPage || false } }
}

// Search suggestions
export const searchSuggestions = async (q) => {
  const query = `
    query($search:String) {
      Page(page:1, perPage:6) {
        media(search:$search, type:ANIME, isAdult:false) {
          id title { english romaji } coverImage { medium }
        }
      }
    }
  `
  const res = await gql(query, { search: q })
  const media = res.data?.data?.Page?.media || []
  return { data: { animes: media.map(m => ({ id: String(m.id), name: m.title?.english || m.title?.romaji, jname: m.title?.romaji, poster: m.coverImage?.medium })) } }
}

// Anime info
export const getAnimeInfo = async (id) => {
  const query = `
    query($id:Int) {
      Media(id:$id, type:ANIME) { ${MEDIA_FIELDS} }
    }
  `
  const res = await gql(query, { id: parseInt(id) })
  const m = res.data?.data?.Media
  if (!m) return { data: null }
  const anime = normalizeMedia(m)
  const related = m.relations?.edges
    ?.filter(e => e.node?.type === 'ANIME')
    .map(e => normalizeMedia({ ...e.node, coverImage: e.node.coverImage, averageScore: null, genres: [], episodes: null })) || []
  const recommended = m.recommendations?.nodes
    ?.map(n => n.mediaRecommendation ? normalizeMedia({ ...n.mediaRecommendation, bannerImage: null, description: null, genres: [], episodes: n.mediaRecommendation.episodes || null }) : null)
    .filter(Boolean) || []
  const characters = m.characters?.edges?.map(e => ({
    id: e.node?.id, name: e.node?.name?.full, image: e.node?.image?.medium,
    role: e.role, voiceActor: e.voiceActors?.[0] ? { name: e.voiceActors[0].name?.full, image: e.voiceActors[0].image?.medium } : null
  })) || []
  return {
    data: {
      anime: { info: { ...anime, characters }, moreInfo: {
        status: m.status, aired: m.startDate?.year ? `${m.startDate.year}` : null,
        duration: m.duration ? `${m.duration} min` : null,
        studios: m.studios?.nodes?.map(s => s.name).join(', ') || null,
        genres: m.genres || [],
      }},
      relatedAnimes: related.slice(0, 8),
      recommendedAnimes: recommended.slice(0, 12),
    }
  }
}

// Episodes - AniList doesn't have episode list, generate them from episode count
export const getAnimeEpisodes = async (id) => {
  const query = `query($id:Int) { Media(id:$id, type:ANIME) { id episodes nextAiringEpisode { episode } } }`
  const res = await gql(query, { id: parseInt(id) })
  const m = res.data?.data?.Media
  
  // If the anime is currently airing, only show episodes up to the latest aired one.
  // Otherwise, fallback to the total episode count.
  const count = m?.nextAiringEpisode ? m.nextAiringEpisode.episode - 1 : (m?.episodes || 0)
  
  const episodes = Array.from({ length: count }, (_, i) => ({
    episodeId: `${id}-ep-${i + 1}`,
    number: i + 1,
    title: `Episode ${i + 1}`,
    isFiller: false,
  }))
  return { data: { episodes } }
}

export const getEpisodeSources = async (episodeId, server = 'beep', category = 'sub') => {
  try {
    const [anilistId, epNum] = episodeId.split('-ep-')
    console.log(`Fetching stream for AniList ID: ${anilistId}, Ep: ${epNum}, Server: ${server}, Type: ${category} from local AnimeX proxy`)
    
    const res = await fetch(`${API_BASE}/stream/${anilistId}/${epNum}?server=${server}&type=${category}`)
    const data = await res.json()
    
    if (data.success && data.data) {
      return {
        data: {
          sources: [{ url: data.data.url, isM3U8: true }],
          embed_url: null, // No iframe for AnimeX HLS stream!
          chapters: data.data.chapters || [],
          intro: data.data.intro,
          outro: data.data.outro,
          message: 'Playing decrypted AnimeX HLS stream'
        }
      }
    } else {
      throw new Error("Proxy failed to return a valid stream url")
    }
  } catch (err) {
    console.error("Stream fetch error:", err)
    return {
      data: {
        sources: [{ url: `https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8?ep=${episodeId}`, isM3U8: true }],
        message: 'Stream failed. Falling back to test stream.'
      }
    }
  }
}

export const getEpisodeServers = async (episodeId) => {
  try {
    const [anilistId, epNum] = episodeId.split('-ep-')
    const res = await fetch(`${API_BASE}/servers/${anilistId}/${epNum}`)
    const data = await res.json()
    
    if (data.success && data.servers) {
      return {
        data: data.servers
      }
    }
  } catch (err) {
    console.error("Servers fetch error:", err)
  }
  return { data: { sub: [], dub: [] } }
}

// Genre browse
export const getGenreAnime = async (genre, page = 1) => {
  const genreName = genre.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const query = `
    query($genre:String, $page:Int) {
      Page(page:$page, perPage:24) {
        pageInfo { hasNextPage }
        media(genre:$genre, type:ANIME, isAdult:false, sort:POPULARITY_DESC) { ${CARD_FIELDS} }
      }
    }
  `
  const res = await gql(query, { genre: genreName, page })
  const d = res.data?.data?.Page
  return { data: { animes: d?.media?.map(normalizeMedia) || [], hasNextPage: d?.pageInfo?.hasNextPage || false } }
}

// Category pages
export const getCategory = async (name, page = 1) => {
  const sortMap = {
    'top-airing': ['TRENDING_DESC', 'RELEASING'],
    'most-popular': ['POPULARITY_DESC', null],
    'most-favorite': ['FAVOURITES_DESC', null],
    'top-upcoming': ['POPULARITY_DESC', 'NOT_YET_RELEASED'],
  }
  const [sort, status] = sortMap[name] || ['TRENDING_DESC', null]
  const query = `
    query($sort:[MediaSort], $status:MediaStatus, $page:Int) {
      Page(page:$page, perPage:24) {
        pageInfo { hasNextPage }
        media(type:ANIME, sort:$sort, status:$status, isAdult:false) { ${CARD_FIELDS} }
      }
    }
  `
  const res = await gql(query, { sort: [sort], status: status || undefined, page })
  const d = res.data?.data?.Page
  return { data: { animes: d?.media?.map(normalizeMedia) || [], hasNextPage: d?.pageInfo?.hasNextPage || false } }
}

// Schedule - get current season airing
export const getSchedule = async () => {
  const query = `
    query {
      Page(page:1, perPage:50) {
        media(type:ANIME, status:RELEASING, sort:POPULARITY_DESC, isAdult:false) {
          id title { english romaji } coverImage { medium }
          nextAiringEpisode { airingAt episode timeUntilAiring }
          format
        }
      }
    }
  `
  const res = await gql(query)
  return res.data?.data?.Page?.media || []
}

export const getAllGenres = async () => ({ data: { genres: ['Action','Adventure','Comedy','Drama','Fantasy','Horror','Romance','Sci-Fi','Slice of Life','Sports','Supernatural','Thriller'] } })
