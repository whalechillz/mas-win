#!/bin/bash

# 메인 사이트 컴포넌트 생성 스크립트
# 실행: ./scripts/create-main-components.sh

set -e

echo "🎨 메인 사이트 컴포넌트 생성 중..."

# 디렉토리 생성
mkdir -p components/main/{layout,sections,ui}

# MainLayout 컴포넌트
cat > components/main/layout/MainLayout.tsx << 'EOF'
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
              <Link href="/main/products" className="text-gray-700 hover:text-black">
                제품
              </Link>
              <Link href="/main/about" className="text-gray-700 hover:text-black">
                브랜드
              </Link>
              <Link href="/main/contact" className="text-gray-700 hover:text-black">
                문의
              </Link>
              <Link href="/funnel-2025-07" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                7월 특가
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
              <p className="text-gray-400">프리미엄 골프 클럽의 새로운 기준</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">제품</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/main/products/driver">드라이버</Link></li>
                <li><Link href="/main/products/iron">아이언</Link></li>
                <li><Link href="/main/products/putter">퍼터</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">고객지원</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/main/contact">문의하기</Link></li>
                <li><Link href="/main/warranty">품질보증</Link></li>
                <li><Link href="/main/stores">매장안내</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">연락처</h4>
              <p className="text-gray-400">
                전화: 1588-1234<br/>
                이메일: info@masgolf.co.kr<br/>
                평일 09:00 - 18:00
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
EOF

# Hero 섹션
cat > components/main/sections/Hero.tsx << 'EOF'
import React from 'react';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* 배경 이미지 */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/main/images/hero-golf.jpg" 
          alt="Golf Course"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>
      
      {/* 콘텐츠 */}
      <div className="relative z-10 text-center text-white px-4">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
          완벽한 스윙의 시작
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto animate-fade-in-delay">
          최첨단 기술과 장인정신이 만나 탄생한<br/>
          MASGOLF 프리미엄 골프 클럽
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-delay-2">
          <Link 
            href="/main/products" 
            className="bg-white text-black px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            제품 둘러보기
          </Link>
          <Link 
            href="/funnel-2025-07" 
            className="bg-red-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-red-700 transition"
          >
            7월 특가 이벤트
          </Link>
        </div>
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
EOF

# Features 섹션
cat > components/main/sections/Features.tsx << 'EOF'
import React from 'react';

const features = [
  {
    title: "최첨단 기술",
    description: "AI 기반 설계와 공기역학 최적화로 완벽한 비거리와 정확성 실현",
    icon: "🚀"
  },
  {
    title: "프리미엄 소재",
    description: "항공우주 등급 티타늄과 카본 파이버로 제작된 초경량 고강도 클럽",
    icon: "💎"
  },
  {
    title: "맞춤 피팅",
    description: "개인별 스윙 분석을 통한 완벽한 커스터마이징 서비스",
    icon: "⚡"
  },
  {
    title: "평생 보증",
    description: "품질에 대한 자신감, MASGOLF 평생 품질 보증 프로그램",
    icon: "🛡️"
  }
];

export default function Features() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">MASGOLF의 차별점</h2>
          <p className="text-xl text-gray-600">혁신적인 기술과 품질로 만드는 특별한 경험</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
EOF

# Products 섹션
cat > components/main/sections/Products.tsx << 'EOF'
import React from 'react';
import Link from 'next/link';

const products = [
  {
    id: 1,
    name: "MASGOLF Driver X1",
    category: "드라이버",
    price: "890,000원",
    image: "/main/images/driver-x1.jpg",
    slug: "driver-x1"
  },
  {
    id: 2,
    name: "MASGOLF Iron Set Pro",
    category: "아이언",
    price: "1,290,000원",
    image: "/main/images/iron-set-pro.jpg",
    slug: "iron-set-pro"
  },
  {
    id: 3,
    name: "MASGOLF Putter Elite",
    category: "퍼터",
    price: "390,000원",
    image: "/main/images/putter-elite.jpg",
    slug: "putter-elite"
  }
];

export default function Products() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">베스트셀러</h2>
          <p className="text-xl text-gray-600">프로들이 선택한 MASGOLF 인기 제품</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((product) => (
            <Link 
              key={product.id}
              href={`/main/products/${product.slug}`}
              className="group"
            >
              <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all">
                <div className="aspect-w-4 aspect-h-3 bg-gray-200">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                  <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                  <p className="text-2xl font-bold text-red-600">{product.price}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Link 
            href="/main/products" 
            className="inline-block bg-black text-white px-8 py-4 rounded-lg hover:bg-gray-800 transition"
          >
            모든 제품 보기
          </Link>
        </div>
      </div>
    </section>
  );
}
EOF

# Contact 섹션
cat > components/main/sections/Contact.tsx << 'EOF'
import React, { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // API 호출 로직
    console.log('문의 제출:', formData);
  };

  return (
    <section className="py-20 bg-gray-100">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">문의하기</h2>
          <p className="text-xl text-gray-600">MASGOLF 전문가가 답변해 드립니다</p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">이름</label>
              <input 
                type="text"
                required
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">이메일</label>
              <input 
                type="email"
                required
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">연락처</label>
            <input 
              type="tel"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">문의내용</label>
            <textarea 
              rows={5}
              required
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
            />
          </div>
          
          <button 
            type="submit"
            className="mt-8 w-full bg-black text-white py-4 rounded-lg hover:bg-gray-800 transition"
          >
            문의 전송
          </button>
        </form>
      </div>
    </section>
  );
}
EOF

echo "✅ 컴포넌트 생성 완료!"
