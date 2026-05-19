import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "application/json, */*"
};

// Cache for AniList ID -> AnimeX slug
const slugCache = new Map();

async function getAnimeXSlug(anilistId) {
  const parsedId = parseInt(anilistId);
  if (isNaN(parsedId)) return null;

  if (slugCache.has(parsedId)) {
    return slugCache.get(parsedId);
  }

  try {
    const query = 'query ($id: Int) { anime(anilistId: $id) { id } }';
    const variables = { id: parsedId };
    
    const res = await fetch('https://graphql.animex.one/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://animex.one',
        'Referer': 'https://animex.one/'
      },
      body: JSON.stringify({ query, variables })
    });
    
    if (!res.ok) {
      throw new Error(`GraphQL failed: HTTP ${res.status}`);
    }
    
    const data = await res.json();
    const slug = data?.data?.anime?.id || null;
    
    if (slug) {
      slugCache.set(parsedId, slug);
    }
    return slug;
  } catch (err) {
    console.error(`Error mapping AniList ID ${anilistId} to AnimeX:`, err.message);
    return null;
  }
}

// Check if an HLS stream is valid and not returning a Cloudflare challenge/HTML block
async function isValidStream(hlsUrl, referer) {
  try {
    const res = await fetch(hlsUrl, {
      headers: {
        ...HEADERS,
        "Referer": referer,
        "Origin": new URL(referer).origin
      }
    });
    if (!res.ok) return false;
    const text = await res.text();
    return text.startsWith('#EXTM3U');
  } catch (err) {
    return false;
  }
}

app.get('/stream/:anilistId/:episode', async (req, res) => {
  const { anilistId, episode } = req.params;
  const targetServer = req.query.server || 'beep';
  const targetType = req.query.type || 'sub';
  
  try {
    const slug = await getAnimeXSlug(anilistId);
    if (!slug) {
      throw new Error(`Anime not found on AnimeX for AniList ID: ${anilistId}`);
    }
    
    console.log(`Fetching stream: AniList ${anilistId} -> Slug ${slug}, Ep: ${episode}, Server: ${targetServer}, Type: ${targetType}`);
    
    // Fetch all available servers to use as fallbacks
    const serversRes = await fetch(`https://pp.animex.one/rest/api/servers?id=${slug}&epNum=${episode}`, {
      headers: {
        'Origin': 'https://animex.one',
        'Referer': 'https://animex.one/'
      }
    });
    
    if (!serversRes.ok) {
      throw new Error(`Failed to fetch servers: HTTP ${serversRes.status}`);
    }
    
    const serversData = await serversRes.json();
    const providers = targetType === 'dub' ? (serversData.dubProviders || []) : (serversData.subProviders || []);
    const filteredProviders = providers.filter(p => p.id !== 'uwu');
    if (filteredProviders.length === 0) {
      throw new Error("No providers found for this episode");
    }
    
    // Build an ordered list of server IDs, starting with the requested one, excluding 'uwu'
    const orderedServers = [
      targetServer,
      ...filteredProviders.map(p => p.id).filter(id => id !== targetServer)
    ].filter(id => id !== 'uwu');
    
    let resolvedData = null;
    let finalServer = targetServer;
    
    for (const serverId of orderedServers) {
      try {
        console.log(`Trying server: ${serverId} for AniList ${anilistId}`);
        const sourcesRes = await fetch(`https://pp.animex.one/rest/api/sources?id=${slug}&epNum=${episode}&type=${targetType}&providerId=${serverId}`, {
          headers: {
            'Origin': 'https://animex.one',
            'Referer': 'https://animex.one/'
          }
        });
        if (!sourcesRes.ok) continue;
        
        const data = await sourcesRes.json();
        if (!data.sources || data.sources.length === 0) continue;
        
        const hlsSource = data.sources.find(s => s.quality === 'auto') || data.sources[0];
        const hlsUrl = hlsSource.url;
        let referer = data.headers?.Referer || data.headers?.referer || 'https://vibeplayer.site/';
        if (!referer.endsWith('/')) referer += '/';
        
        // Verify that the stream actually works
        const valid = await isValidStream(hlsUrl, referer);
        if (valid) {
          resolvedData = { hlsUrl, referer, chapters: data.chapters || [], headers: data.headers || {} };
          finalServer = serverId;
          break;
        } else {
          console.warn(`Server ${serverId} returned invalid or blocked stream, trying fallback...`);
        }
      } catch (err) {
        console.error(`Error checking server ${serverId}:`, err.message);
      }
    }
    
    if (!resolvedData) {
      throw new Error("All streaming servers returned invalid or blocked streams");
    }
    
    const proxiedUrl = `http://localhost:8000/proxy?url=${encodeURIComponent(resolvedData.hlsUrl)}&referer=${encodeURIComponent(resolvedData.referer)}`;
    
    console.log(`Stream successfully resolved on server: ${finalServer} -> ${resolvedData.hlsUrl}`);
    
    res.json({
      success: true,
      data: {
        url: proxiedUrl,
        server: finalServer,
        headers: resolvedData.headers,
        chapters: resolvedData.chapters,
        intro: resolvedData.chapters?.find(c => c.title?.toLowerCase() === 'intro'),
        outro: resolvedData.chapters?.find(c => c.title?.toLowerCase() === 'outro')
      }
    });
  } catch (err) {
    console.error("Stream Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/servers/:anilistId/:episode', async (req, res) => {
  const { anilistId, episode } = req.params;
  try {
    const slug = await getAnimeXSlug(anilistId);
    if (!slug) {
      throw new Error(`Anime not found on AnimeX for AniList ID: ${anilistId}`);
    }
    
    console.log(`Fetching servers: AniList ${anilistId} -> Slug ${slug}, Ep: ${episode}`);
    
    const serversRes = await fetch(`https://pp.animex.one/rest/api/servers?id=${slug}&epNum=${episode}`, {
      headers: {
        'Origin': 'https://animex.one',
        'Referer': 'https://animex.one/'
      }
    });
    
    if (!serversRes.ok) {
      throw new Error(`Failed to fetch servers: HTTP ${serversRes.status}`);
    }
    
    const data = await serversRes.json();
    
    const sub = (data.subProviders || [])
      .filter(p => p.id !== 'uwu')
      .map(p => ({
        serverName: p.id,
        serverId: p.id,
        tip: p.tip
      }));
    const dub = (data.dubProviders || [])
      .filter(p => p.id !== 'uwu')
      .map(p => ({
        serverName: p.id,
        serverId: p.id,
        tip: p.tip
      }));
    
    console.log(`Servers fetched: ${sub.length} sub, ${dub.length} dub`);
    
    res.json({ success: true, servers: { sub, dub } });
  } catch (err) {
    console.error("Servers Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// A smart CORS proxy for M3U8 and TS files with dynamic referers
app.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  let referer = req.query.referer || 'https://vibeplayer.site/';
  if (!referer.endsWith('/')) referer += '/';
  
  if (!targetUrl) return res.status(400).send("No URL provided");

  const host = req.get('host');
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const base = `${protocol}://${host}`;

  try {
    const headers = { 
      ...HEADERS, 
      "Referer": referer,
      "Origin": new URL(referer).origin
    };
    
    const fetchRes = await fetch(targetUrl, { headers });
    
    const contentType = fetchRes.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (targetUrl.includes('.m3u8')) {
      let body = await fetchRes.text();
      const baseUrl = new URL(targetUrl);
      const lines = body.split('\n');
      const rewritten = lines.map(line => {
        line = line.trim();
        
        // Rewrite HLS key URI
        if (line.startsWith('#EXT-X-KEY:')) {
          const match = line.match(/URI="([^"]+)"/);
          if (match) {
            let absoluteUrl = match[1];
            if (!absoluteUrl.startsWith('http')) {
              absoluteUrl = new URL(absoluteUrl, baseUrl.href).href;
            }
            const proxiedUrl = `${base}/proxy?url=${encodeURIComponent(absoluteUrl)}&referer=${encodeURIComponent(referer)}`;
            return line.replace(/URI="[^"]+"/, `URI="${proxiedUrl}"`);
          }
        }
        
        // Rewrite HLS map URI
        if (line.startsWith('#EXT-X-MAP:')) {
          const match = line.match(/URI="([^"]+)"/);
          if (match) {
            let absoluteUrl = match[1];
            if (!absoluteUrl.startsWith('http')) {
              absoluteUrl = new URL(absoluteUrl, baseUrl.href).href;
            }
            const proxiedUrl = `${base}/proxy?url=${encodeURIComponent(absoluteUrl)}&referer=${encodeURIComponent(referer)}`;
            return line.replace(/URI="[^"]+"/, `URI="${proxiedUrl}"`);
          }
        }

        if (line && !line.startsWith('#')) {
          let absoluteUrl = line;
          if (!line.startsWith('http')) {
            absoluteUrl = new URL(line, baseUrl.href).href;
          }
          return `${base}/proxy?url=${encodeURIComponent(absoluteUrl)}&referer=${encodeURIComponent(referer)}`;
        }
        return line;
      });
      res.send(rewritten.join('\n'));
    } else {
      const buffer = await fetchRes.arrayBuffer();
      res.send(Buffer.from(buffer));
    }
  } catch (err) {
    console.error("Proxy Error:", err.message);
    res.status(500).send("Proxy error");
  }
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`AnimeX Proxy running on http://localhost:${PORT}`);
});
