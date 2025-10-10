import Head from 'next/head';
import Link from 'next/link';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export default function Layout({ children, title, description }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title || 'MUZIIK - DOGATTI GENERATION シャフト'}</title>
        <meta name="description" content={description || 'DOGATTI GENERATION シャフト - 日本製プレミアムゴルフシャフトの最高峰'} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <header className="bg-black border-b border-gray-800">
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <Link href="/muziik" className="text-2xl font-bold text-white hover:text-blue-400 transition-colors">
                MUZIIK
              </Link>
              <nav className="hidden md:flex space-x-8">
                <Link href="/muziik" className="text-gray-300 hover:text-white transition-colors">
                  ホーム
                </Link>
                <Link href="/muziik/sapphire" className="text-gray-300 hover:text-white transition-colors">
                  Sapphire
                </Link>
                <Link href="/muziik/beryl" className="text-gray-300 hover:text-white transition-colors">
                  Beryl
                </Link>
                <a href="mailto:info@masgolf.co.kr" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  お問い合わせ
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 border-t border-gray-800 py-8">
          <div className="container mx-auto px-4">
            <div className="text-center text-gray-400">
              <p>&copy; 2025 MUZIIK. All rights reserved.</p>
              <p className="mt-2">DOGATTI GENERATION シャフト - 日本製プレミアムゴルフシャフト</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
