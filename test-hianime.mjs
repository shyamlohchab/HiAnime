import { ANIME } from '@consumet/extensions'

async function test() {
  try {
    const hianime = new ANIME.Hianime()
    console.log('Searching naruto...')
    const res = await hianime.search('naruto')
    console.log('Got info:', res.results[0].title)
    
    const info = await hianime.fetchAnimeInfo(res.results[0].id)
    if (info.episodes?.length > 0) {
      console.log('Fetching stream for ep:', info.episodes[0].id)
      const stream = await hianime.fetchEpisodeSources(info.episodes[0].id)
      console.log('Stream:', stream)
    } else {
      console.log('No episodes found')
    }
  } catch (e) {
    console.error('Error:', e)
  }
}

test()
