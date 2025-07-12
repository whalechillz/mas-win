import React from 'react';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* 배경 */}
      <div className="absolute inset-0 z-0">
        {/* 그라데이션 배경 */}
        <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
        
        {/* 골프 패턴 오버레이 */}
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
      </div>
      
      {/* 콘텐츠 */}
      <div className="relative z-10 text-center text-white px-4">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
          드라이버 하나 바꿨을 뿐인데
        </h1>
        <p className="text-3xl md:text-4xl font-bold text-yellow-400 mb-4 animate-fade-in-delay">
          캐리 200m 넘김
        </p>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto animate-fade-in-delay">
          영국 왕립 골프협회(R&A)가 두려워한 비밀병기<br/>
          일반 드라이버보다 33.33% 얇고 강력한 티타늄
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
          +30m 비거리, 진짜 고수들은 드라이버부터 바꿨다
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
