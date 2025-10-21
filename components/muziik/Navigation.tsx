import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

interface NavigationProps {
  currentPath?: string;
}

export default function Navigation({ currentPath }: NavigationProps) {
  const router = useRouter();
  const { locale } = router;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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

  const t = menuText[locale as 'ja' | 'ko'];

  // 현재 페이지 확인
  const isActive = (path: string) => {
    if (currentPath) {
      return currentPath === path;
    }
    return router.pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-black border-b border-gray-800">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <Link 
            href="/" 
            className="flex items-center space-x-3 text-2xl font-bold text-white hover:text-blue-400 transition-colors"
            onClick={closeMobileMenu}
          >
            <img 
              src="/muziik/brand/muziik-logo-art.png" 
              alt="MUZIIK Logo"
              className="h-12 w-auto object-contain"
            />
            <div className="flex flex-col">
              <span>MUZIIK</span>
              <span className="text-xs text-gray-400">X MASSGOO</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex space-x-8 items-center">
            <Link 
              href="/" 
              className={`transition-colors ${
                isActive('/') 
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
            
            <Link 
              href="/contact" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t.contact}
            </Link>
            
            {/* 언어 전환 버튼 */}
            <div className="flex space-x-2">
              <button
                onClick={() => router.push(router.asPath, router.asPath, { locale: 'ja' })}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  locale === 'ja' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🇯🇵
              </button>
              <button
                onClick={() => router.push(router.asPath, router.asPath, { locale: 'ko' })}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  locale === 'ko' 
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
            <button 
              onClick={toggleMobileMenu}
              className="text-white hover:text-blue-400 transition-colors"
              aria-label="메뉴 열기/닫기"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-800">
            <nav className="flex flex-col space-y-4 pt-4">
              <Link 
                href="/" 
                className={`transition-colors py-2 ${
                  isActive('/') 
                    ? 'text-white font-semibold' 
                    : 'text-gray-300 hover:text-white'
                }`}
                onClick={closeMobileMenu}
              >
                {t.home}
              </Link>
              
              <Link 
                href="/sapphire" 
                className={`transition-colors py-2 ${
                  isActive('/sapphire') 
                    ? 'text-white font-semibold' 
                    : 'text-gray-300 hover:text-white'
                }`}
                onClick={closeMobileMenu}
              >
                Sapphire
              </Link>
              
              <Link 
                href="/beryl" 
                className={`transition-colors py-2 ${
                  isActive('/beryl') 
                    ? 'text-white font-semibold' 
                    : 'text-gray-300 hover:text-white'
                }`}
                onClick={closeMobileMenu}
              >
                Beryl
              </Link>
              
              <Link 
                href="/technology" 
                className={`transition-colors py-2 ${
                  isActive('/technology') 
                    ? 'text-white font-semibold' 
                    : 'text-gray-300 hover:text-white'
                }`}
                onClick={closeMobileMenu}
              >
                {t.technology}
              </Link>
              
              <Link 
                href="/about" 
                className={`transition-colors py-2 ${
                  isActive('/about') 
                    ? 'text-white font-semibold' 
                    : 'text-gray-300 hover:text-white'
                }`}
                onClick={closeMobileMenu}
              >
                {t.about}
              </Link>
              
              {/* 모바일 전화번호 버튼 */}
              <a 
                href="tel:+82-80-028-8888"
                className="bg-green-600 text-white px-4 py-3 rounded-lg text-center font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                onClick={closeMobileMenu}
              >
                <span>📞</span>
                <span>+82-80-028-8888</span>
              </a>
              
              <Link 
                href="/contact" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center"
                onClick={closeMobileMenu}
              >
                {t.contact}
              </Link>
              
              {/* 모바일 언어 전환 버튼 */}
              <div className="flex space-x-2 justify-center pt-4">
                <button
                  onClick={() => {
                    router.push(router.asPath, router.asPath, { locale: 'ja' });
                    closeMobileMenu();
                  }}
                  className={`px-4 py-2 rounded text-sm transition-colors ${
                    locale === 'ja' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-400 hover:text-white bg-gray-800'
                  }`}
                >
                  🇯🇵 日本語
                </button>
                <button
                  onClick={() => {
                    router.push(router.asPath, router.asPath, { locale: 'ko' });
                    closeMobileMenu();
                  }}
                  className={`px-4 py-2 rounded text-sm transition-colors ${
                    locale === 'ko' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-400 hover:text-white bg-gray-800'
                  }`}
                >
                  🇰🇷 한국어
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
