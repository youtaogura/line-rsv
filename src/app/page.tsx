export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ゴルフレッスン予約システム
          </h1>
          <p className="text-gray-600 mb-8">
            LINEアカウントでログインして予約をお取りください
          </p>
        </div>
        
        <div className="space-y-4">
          <a
            href="/login"
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors text-center block font-medium"
          >
            予約を取る
          </a>
          
          <a
            href="/admin"
            className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors text-center block font-medium"
          >
            管理画面
          </a>
        </div>
        
        <div className="text-center text-sm text-gray-500">
          <p>初回のお客様もご利用いただけます</p>
        </div>
      </div>
    </div>
  )
}
