'use client'

import { useState } from 'react'
import { Search, Loader2, ExternalLink, ThumbsUp, Eye, Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { VideoPlayer } from './video-player'

interface VideoFormat {
  url: string
  quality: string
  type: string
  container: string
}

interface VideoData {
  videoId: string
  title: string
  author: string
  description: string
  lengthSeconds: number
  viewCount: number
  likeCount: number
  publishedText: string
  thumbnail: string
  formats: VideoFormat[]
  hlsUrl?: string
  embedUrl?: string
  embedOnly?: boolean
  source: string
  instance: string
  errors?: string[]
}

export function VideoSearch() {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoData, setVideoData] = useState<VideoData | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!url.trim()) return
    
    setIsLoading(true)
    setError(null)
    setVideoData(null)
    
    try {
      const response = await fetch(`/api/video?url=${encodeURIComponent(url.trim())}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch video')
      }
      
      setVideoData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Вставьте ссылку на YouTube видео или ID..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
        <Button type="submit" disabled={isLoading || !url.trim()} className="h-12 px-6">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Загрузка...
            </>
          ) : (
            'Смотреть'
          )}
        </Button>
      </form>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Попробуйте другую ссылку или повторите попытку позже.
            </p>
          </CardContent>
        </Card>
      )}

      {videoData && (
        <div className="space-y-4">
          <VideoPlayer
            formats={videoData.formats}
            title={videoData.title}
            thumbnail={videoData.thumbnail}
            hlsUrl={videoData.hlsUrl}
            embedUrl={videoData.embedUrl}
            embedOnly={videoData.embedOnly}
            videoId={videoData.videoId}
          />
          
          <Card>
            <CardContent className="pt-6">
              <h1 className="text-xl font-semibold mb-2">{videoData.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                <a
                  href={`https://youtube.com/channel/${videoData.author}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground hover:underline flex items-center gap-1"
                >
                  {videoData.author}
                  <ExternalLink className="w-3 h-3" />
                </a>
                
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {formatNumber(videoData.viewCount)} просмотров
                </span>
                
                {videoData.likeCount > 0 && (
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-4 h-4" />
                    {formatNumber(videoData.likeCount)}
                  </span>
                )}
                
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDuration(videoData.lengthSeconds)}
                </span>
                
                <span>{videoData.publishedText}</span>
              </div>
              
              {videoData.description && (
                <div className="text-sm text-muted-foreground">
                  <details>
                    <summary className="cursor-pointer hover:text-foreground transition-colors">
                      Показать описание
                    </summary>
                    <div
                      className="mt-2 prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: videoData.description }}
                    />
                  </details>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground mt-4">
                Источник: {videoData.source === 'cobalt' ? 'Cobalt' : videoData.source === 'youtube-embed' ? 'YouTube Embed' : videoData.source} ({videoData.instance})
              </p>
              
              {videoData.embedOnly && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  Cobalt не смог получить прямую ссылку. Используется YouTube Embed.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
