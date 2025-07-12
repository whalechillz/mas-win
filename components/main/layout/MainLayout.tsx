import React from 'react';
import Link from 'next/link';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* 네비게이션 */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              MASGOLF
            </Link>
            <div className="hidden md:flex space-x-8">
              <a href="#products" className="text-gray-700 hover:text-black">
                드라이버
              </a>
              <a href="#features" className="text-gray-700 hover:text-black">
                기술력
              </a>
              <a href="#reviews" className="text-gray-700 hover:text-black">
                고객후기
              </a>
              <a href="#contact" className="text-gray-700 hover:text-black">
                문의하기
              </a>
              <Link href="/funnel-2025-07" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                무료 시타
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      {/* 메인 콘텐츠 */}
      <main className="pt-16">
        {children}
      </main>
      
      {/* 푸터 */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">MASGOLF</h3>
              <p className="text-gray-400">
                영국 왕립 골프협회(R&A) 인증<br/>
                고반발 드라이버 전문 브랜드
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">제품</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#products">골드 드라이버</a></li>
                <li><a href="#products">블랙 드라이버</a></li>
                <li><a href="#products">여성용 드라이버</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">고객지원</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#contact">문의하기</a></li>
                <li><Link href="/funnel-2025-07">A/S 안내</Link></li>
                <li><Link href="/funnel-2025-07">고객후기</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">연락처</h4>
              <p className="text-gray-400">
                전화: 080-028-8888<br/>
                수원 매장: 경기도 수원시<br/>
                평일 10:00 - 19:00
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 MASGOLF. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
