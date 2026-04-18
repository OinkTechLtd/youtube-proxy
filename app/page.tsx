import { VideoSearch } from '@/components/video-search'
import { Play, Shield, Zap, Code } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Play className="w-5 h-5 text-primary-foreground" fill="currentColor" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">YouTube Proxy</h1>
            <p className="text-xs text-muted-foreground">Смотрите без ограничений</p>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">Смотрите YouTube видео</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Вставьте ссылку на видео и смотрите контент через прокси-сервер.
            Поддерживаются все форматы YouTube ссылок.
          </p>
        </div>

        <VideoSearch />

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Обход блокировок</h3>
            <p className="text-sm text-muted-foreground">
              Используем Piped и Invidious для доступа к контенту
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Несколько серверов</h3>
            <p className="text-sm text-muted-foreground">
              Автоматический выбор работающего сервера с возможностью переключения
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Code className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Встраивание</h3>
            <p className="text-sm text-muted-foreground">
              Получите код для встраивания плеера на ваш сайт
            </p>
          </div>
        </div>
        
        {/* Embed Instructions */}
        <div className="mt-12 p-6 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Code className="w-5 h-5" />
            Встраивание на сайт
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Чтобы встроить видео на свой сайт, используйте следующий код, заменив VIDEO_ID на ID видео:
          </p>
          <pre className="bg-background p-4 rounded-md text-sm overflow-x-auto">
            <code>{`<iframe 
  src="${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/embed/VIDEO_ID" 
  width="560" 
  height="315" 
  frameborder="0" 
  allowfullscreen>
</iframe>`}</code>
          </pre>
          <p className="text-xs text-muted-foreground mt-3">
            Пример: для видео youtube.com/watch?v=dQw4w9WgXcQ используйте VIDEO_ID = dQw4w9WgXcQ
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Этот сервис использует Piped и Invidious - альтернативные фронтенды YouTube.</p>
          <p className="mt-1">Видео остаются собственностью правообладателей.</p>
        </div>
      </footer>
    </main>
  )
}
