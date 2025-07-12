import React from 'react';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* 배경 */}
      <div className="absolute inset-0 z-0">
        {/* 실제 이미지 사용 */}
        <img 
          src="/assets/campaigns/2025-07/hero-summer-golf-mas-wide.jpg" 
          alt="MASGOLF Summer Campaign"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>
      
      {/* 콘텐츠 */}
      <div className="relative z-10 text-center text-white px-4">
        <p className="text-xl md:text-2xl mb-4 text-yellow-400 animate-fade-in">
          시니어 골퍼를 위한 특별한 선택
        </p>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
          나이가 들수록 비거리는
        </h1>
        <p className="text-3xl md:text-4xl font-bold text-yellow-400 mb-8 animate-fade-in-delay">
          더 멀리 나가야 합니다
        </p>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto animate-fade-in-delay">
          스윙 스피드가 느려져도 괜찮습니다<br/>
          초박형 2.2mm 페이스가 젊은 날의 비거리를 돌려드립니다
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-delay-2">
          <Link 
            href="/funnel-2025-07" 
            className="bg-red-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-red-700 transition text-lg"
          >
            무료 시타 신청하기
          </Link>
          <a 
            href="#products" 
            className="bg-white text-black px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            제품 둘러보기
          </a>
        </div>
        <p className="mt-6 text-lg opacity-90 animate-fade-in-delay-2">
          50대, 60대, 70대... 나이는 숫자에 불과합니다
        </p>
      </div>
      
      {/* 스크롤 인디케이터 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}