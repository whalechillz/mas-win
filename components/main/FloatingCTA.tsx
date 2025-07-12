import React, { useState, useEffect } from 'react';

export default function FloatingCTA() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // 스크롤이 300px 이상일 때 표시
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* 모바일 하단 고정 CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">무료 시타 신청</p>
            <p className="text-lg font-bold">080-028-8888</p>
          </div>
          <a 
            href="tel:080-028-8888" 
            className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            전화하기
          </a>
        </div>
      </div>

      {/* 데스크톱 플로팅 버튼 */}
      <div className="hidden md:block fixed bottom-8 right-8 z-50">
        <a 
          href="/funnel-2025-07" 
          className="group bg-red-600 text-white px-8 py-4 rounded-full shadow-2xl hover:bg-red-700 transition-all duration-300 flex items-center space-x-3 hover:scale-105"
        >
          <span className="animate-pulse">🎯</span>
          <span className="font-semibold">무료 시타 신청</span>
          <span className="text-sm opacity-80">+30m 비거리</span>
        </a>
      </div>
    </>
  );
}