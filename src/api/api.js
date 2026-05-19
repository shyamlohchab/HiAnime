import axios from 'axios'

// AniList GraphQL API - free, official, always online
const ANILIST_URL = 'https://graphql.anilist.co'

const anilistClient = axios.create({
  baseURL: ANILIST_URL,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  timeout: 15000,
})

export const gql = (query, variables = {}) =>
  anilistClient.post('', { query, variables })

// Normalize media object to our standard shape
export const normalizeMedia = (m) => ({
  id: String(m.id),
  name: m.title?.english || m.title?.romaji || m.title?.native || 'Unknown',
  jname: m.title?.native || m.title?.romaji,
  poster: m.coverImage?.extraLarge || m.coverImage?.large || m.coverImage?.medium || '',
  banner: m.bannerImage || '',
  description: m.description?.replace(/<[^>]*>/g, '') || '',
  rating: m.averageScore ? (m.averageScore / 10).toFixed(1) : null,
  genres: m.genres || [],
  type: m.format || 'TV',
  status: m.status,
  episodes: { sub: m.episodes || 0, dub: 0 },
  stats: {
    rating: m.averageScore ? (m.averageScore / 10).toFixed(1) : null,
    type: m.format,
    episodes: { sub: m.episodes || 0, dub: 0 }
  },
  duration: m.duration,
  season: m.season,
  year: m.seasonYear,
  popularity: m.popularity,
  trending: m.trending,
})

export default anilistClient
