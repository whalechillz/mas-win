import Link from 'next/link';
import { useRouter } from 'next/router';

interface NavigationProps {
  language: 'ja' | 'ko';
  onLanguageChange: (lang: 'ja' | 'ko') => void;
  currentPath?: string;
}

export default function Navigation({ language, onLanguageChange, currentPath }: NavigationProps) {
  const router = useRouter();
  
  // 언어별 메뉴 텍스트
  const menuText = {
    ja: {
      home: 'ホーム',
      technology: 'テクノロジー',
      about: '会社情報',
      contact: 'お問い合わせ'
    },
    ko: {
      home: '홈',
      technology: '기술소개',
      about: '회사소개',
      contact: '문의하기'
    }
  };

  const t = menuText[language];

  // 현재 페이지 확인
  const isActive = (path: string) => {
    if (currentPath) {
      return currentPath === path;
    }
    return router.pathname === path;
  };

  return (
    <header className="bg-black border-b border-gray-800">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <Link href="/muziik" className="text-2xl font-bold text-white hover:text-blue-400 transition-colors">
            MUZIIK
          </Link>
          
          <nav className="hidden md:flex space-x-8 items-center">
            <Link 
              href="/muziik" 
              className={`transition-colors ${
                isActive('/muziik') 
                  ? 'text-white font-semibold' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {t.home}
            </Link>
            
            <Link 
              href="/sapphire" 
              className={`transition-colors ${
                isActive('/sapphire') 
                  ? 'text-white font-semibold' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Sapphire
            </Link>
            
            <Link 
              href="/beryl" 
              className={`transition-colors ${
                isActive('/beryl') 
                  ? 'text-white font-semibold' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Beryl
            </Link>
            
            <Link 
              href="/technology" 
              className={`transition-colors ${
                isActive('/technology') 
                  ? 'text-white font-semibold' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {t.technology}
            </Link>
            
            <Link 
              href="/about" 
              className={`transition-colors ${
                isActive('/about') 
                  ? 'text-white font-semibold' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {t.about}
            </Link>
            
            <a 
              href="mailto:info@masgolf.co.kr" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t.contact}
            </a>
            
            {/* 언어 전환 버튼 */}
            <div className="flex space-x-2">
              <button
                onClick={() => onLanguageChange('ja')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  language === 'ja' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🇯🇵
              </button>
              <button
                onClick={() => onLanguageChange('ko')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  language === 'ko' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🇰🇷
              </button>
            </div>
          </nav>
          
          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden">
            <button className="text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
