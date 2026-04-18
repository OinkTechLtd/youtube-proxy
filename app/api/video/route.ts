import { NextRequest, NextResponse } from 'next/server'

// Edge Runtime - runs in European datacenters
export const runtime = 'edge'
export const preferredRegion = ['fra1', 'arn1', 'cdg1'] // Frankfurt, Stockholm, Paris

// Cobalt API instances
const COBALT_INSTANCES = [
  'https://api.cobalt.tools',
  'https://cobalt-api.hyper.lol',
  'https://cobalt.canine.tools',
]

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// Cobalt API - for direct video URLs
async function fetchFromCobalt(instance: string, videoId: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  
  try {
    const response = await fetch(`${instance}/api/json`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify({
        url: `https://www.youtube.com/watch?v=${videoId}`,
        vCodec: 'h264',
        vQuality: '1080',
        aFormat: 'mp3',
        filenamePattern: 'basic',
        isAudioOnly: false,
        isNoTTWatermark: false,
        isTTFullAudio: false,
        disableMetadata: false,
      }),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.status === 'error') {
      throw new Error(data.text || 'Cobalt error')
    }
    
    // Cobalt returns direct URL or picker with multiple qualities
    const formats = []
    
    if (data.status === 'redirect' || data.status === 'stream') {
      formats.push({
        url: data.url,
        quality: '720p',
        type: 'video/mp4',
      })
    } else if (data.status === 'picker' && data.picker) {
      for (const item of data.picker) {
        if (item.type === 'video') {
          formats.push({
            url: item.url,
            quality: item.quality || '720p',
            type: 'video/mp4',
          })
        }
      }
    }
    
    return {
      formats,
      source: 'cobalt',
      instance,
    }
  } finally {
    clearTimeout(timeout)
  }
}

// Get basic metadata from YouTube oEmbed (works from Europe)
async function fetchMetadata(videoId: string) {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    )
    
    if (response.ok) {
      const data = await response.json()
      return {
        title: data.title,
        author: data.author_name,
        thumbnail: data.thumbnail_url,
      }
    }
  } catch {
    // Ignore
  }
  
  return {
    title: `YouTube Video`,
    author: 'YouTube',
    thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')
  
  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
  }
  
  const videoId = extractVideoId(url)
  
  if (!videoId) {
    return NextResponse.json({ error: 'Invalid YouTube URL or video ID' }, { status: 400 })
  }
  
  const errors: string[] = []
  
  // Get metadata first (from European server)
  const metadata = await fetchMetadata(videoId)
  
  // Try Cobalt instances
  for (const instance of COBALT_INSTANCES) {
    try {
      const data = await fetchFromCobalt(instance, videoId)
      if (data.formats.length > 0) {
        return NextResponse.json({
          videoId,
          title: metadata.title,
          author: metadata.author,
          description: '',
          lengthSeconds: 0,
          viewCount: 0,
          likeCount: 0,
          publishedText: '',
          thumbnail: metadata.thumbnail,
          formats: data.formats,
          source: 'cobalt',
          instance,
        })
      }
      errors.push(`Cobalt ${new URL(instance).hostname}: No formats`)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error'
      errors.push(`Cobalt ${new URL(instance).hostname}: ${errMsg}`)
    }
  }
  
  // Fallback: YouTube embed (youtube-nocookie.com) - проксируется через Edge в Европе
  return NextResponse.json({
    videoId,
    title: metadata.title,
    author: metadata.author,
    description: '',
    lengthSeconds: 0,
    viewCount: 0,
    likeCount: 0,
    publishedText: '',
    thumbnail: metadata.thumbnail,
    formats: [],
    embedOnly: true,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
    source: 'youtube-embed',
    instance: 'youtube-nocookie.com',
    errors,
  })
}
