'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Hls from 'hls.js'

interface VideoFormat {
  url: string
  quality: string
  type: string
}

interface VideoPlayerProps {
  formats: VideoFormat[]
  title: string
  thumbnail: string
  hlsUrl?: string
  embedUrl?: string
  embedOnly?: boolean
  videoId?: string
}

export function VideoPlayer({ 
  formats, 
  title, 
  thumbnail, 
  hlsUrl, 
  embedUrl, 
  embedOnly,
  videoId 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [selectedQuality, setSelectedQuality] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [useHls, setUseHls] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hideControlsTimeout = useRef<NodeJS.Timeout>()

  const currentFormat = formats[selectedQuality] || formats[0]

  // Initialize HLS or direct video
  useEffect(() => {
    if (embedOnly) return
    
    const video = videoRef.current
    if (!video) return

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    setError(null)
    setIsLoading(true)

    // Try HLS first if available and supported
    if (hlsUrl && Hls.isSupported() && useHls) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      })
      
      hls.loadSource(hlsUrl)
      hls.attachMedia(video)
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false)
      })
      
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setUseHls(false)
        }
      })
      
      hlsRef.current = hls
    } else if (hlsUrl && video.canPlayType('application/vnd.apple.mpegurl') && useHls) {
      // Native HLS support (Safari)
      video.src = hlsUrl
    } else if (currentFormat?.url) {
      // Direct video URL
      video.src = currentFormat.url
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [hlsUrl, useHls, currentFormat?.url, embedOnly])

  // Try HLS by default if available
  useEffect(() => {
    if (hlsUrl && !useHls && formats.length === 0) {
      setUseHls(true)
    }
  }, [hlsUrl, formats.length, useHls])

  useEffect(() => {
    if (embedOnly) return
    
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleDurationChange = () => setDuration(video.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleWaiting = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)
    const handleError = () => {
      setIsLoading(false)
      if (useHls && formats.length > 0) {
        setUseHls(false)
      } else if (!useHls && hlsUrl) {
        setUseHls(true)
      } else {
        setError('Failed to load video. The source may be unavailable.')
      }
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('error', handleError)
    }
  }, [useHls, hlsUrl, formats.length, embedOnly])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setIsMuted(newVolume === 0)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume || 1
        setIsMuted(false)
      } else {
        videoRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    if (isFullscreen) {
      await document.exitFullscreen()
    } else {
      await containerRef.current.requestFullscreen()
    }
  }

  const handleQualityChange = (index: number) => {
    const currentPlayTime = videoRef.current?.currentTime || 0
    const wasPlaying = isPlaying
    setSelectedQuality(index)
    setUseHls(false)
    
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = currentPlayTime
        if (wasPlaying) {
          videoRef.current.play()
        }
      }
    }, 100)
  }

  const handleSwitchToHls = () => {
    if (hlsUrl) {
      const currentPlayTime = videoRef.current?.currentTime || 0
      const wasPlaying = isPlaying
      setUseHls(true)
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = currentPlayTime
          if (wasPlaying) {
            videoRef.current.play()
          }
        }
      }, 100)
    }
  }

  const handleRetry = () => {
    setError(null)
    setIsLoading(true)
    if (videoRef.current) {
      videoRef.current.load()
    }
  }

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current)
    }
    hideControlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3000)
  }

  // If embed-only mode, show YouTube embed
  if (embedOnly && embedUrl) {
    return (
      <div className="space-y-2">
        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
          <iframe
            src={embedUrl}
            title={title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
        
        <p className="text-xs text-muted-foreground">
          Используется встроенный плеер YouTube (youtube-nocookie.com)
        </p>
      </div>
    )
  }

  if (!formats.length && !hlsUrl && !embedUrl) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">No video formats available</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative aspect-video bg-black rounded-lg overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        poster={thumbnail}
        className="w-full h-full object-contain"
        onClick={handlePlayPause}
        playsInline
        crossOrigin="anonymous"
      />

      {/* Loading indicator */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white text-center p-4">
          <p className="mb-4">{error}</p>
          <Button onClick={handleRetry} variant="secondary" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      )}

      {/* Play button overlay */}
      {!isPlaying && !isLoading && !error && (
        <button
          onClick={handlePlayPause}
          className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity"
        >
          <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors">
            <Play className="w-10 h-10 text-black ml-1" fill="currentColor" />
          </div>
        </button>
      )}

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress bar */}
        <div className="mb-3">
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlayPause}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" fill="currentColor" />
              ) : (
                <Play className="w-5 h-5" fill="currentColor" />
              )}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="text-white hover:bg-white/20"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-20"
              />
            </div>

            <span className="text-white text-sm ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 gap-1"
                >
                  <Settings className="w-4 h-4" />
                  {useHls ? 'Auto' : currentFormat?.quality || 'Quality'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {hlsUrl && (
                  <DropdownMenuItem
                    onClick={handleSwitchToHls}
                    className={useHls ? 'bg-accent' : ''}
                  >
                    Auto (HLS)
                  </DropdownMenuItem>
                )}
                {formats.map((format, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => handleQualityChange(index)}
                    className={!useHls && selectedQuality === index ? 'bg-accent' : ''}
                  >
                    {format.quality}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Title overlay */}
      <div
        className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <h2 className="text-white font-medium line-clamp-1">{title}</h2>
      </div>
    </div>
  )
}
