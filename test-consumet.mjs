import { ANIME } from '@consumet/extensions'

async function test() {
  const gogo = new ANIME.Gogoanime()
  try {
    const res = await gogo.search('naruto')
    console.log('Search res:', res.results[0])
    const info = await gogo.fetchAnimeInfo(res.results[0].id)
    console.log('Episodes:', info.episodes.length)
    const ep = info.episodes[0]
    const stream = await gogo.fetchEpisodeSources(ep.id)
    console.log('Stream:', stream)
  } catch (e) {
    console.error(e)
  }
}

test()
