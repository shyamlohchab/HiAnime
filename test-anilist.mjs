import { META } from '@consumet/extensions'

async function test() {
  try {
    const anilist = new META.Anilist()
    console.log('Fetching 21...')
    // One Piece id is 21
    const info = await anilist.fetchAnimeInfo('21')
    console.log('Got info:', info.title)
    if (info.episodes?.length > 0) {
      console.log('Fetching stream for ep:', info.episodes[0].id)
      const stream = await anilist.fetchEpisodeSources(info.episodes[0].id)
      console.log('Stream:', stream)
    } else {
      console.log('No episodes found')
    }
  } catch (e) {
    console.error('Error:', e)
  }
}

test()
