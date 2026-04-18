import { Metadata } from 'next'

// Piped instances for embedding
const PIPED_INSTANCES = [
  'https://proxyvideo.vercel.app/www.youtube-nocookie.com/embed/',
  'https://www.youtube-nocookie.com/embed/',
  'https://secure-272717.vercel.app/www.youtube-nocookie.com/embed/',
  'https://secure-272717.tatnet.app/www.youtube-nocookie.com/embed/',
]

interface Props {
  params: Promise<{ videoId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { videoId } = await params
  
  return {
    title: `Video ${videoId} - YouTube Proxy`,
    description: 'Watch YouTube videos without restrictions',
  }
}

export default async function EmbedPage({ params }: Props) {
  const { videoId } = await params
  
  // Use Piped embed as the source
  const embedUrl = `${PIPED_INSTANCES[0]}/embed/${videoId}`
  
  return (
    <html lang="ru">
      <head>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
          iframe { width: 100%; height: 100%; border: none; }
        `}</style>
      </head>
      <body>
        <iframe
          src={embedUrl}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </body>
    </html>
  )
}
