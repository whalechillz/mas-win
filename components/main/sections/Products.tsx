import React from 'react';
import Link from 'next/link';

const products = [
  {
    id: 1,
    name: "시크릿포스 GOLD 2",
    category: "프리미엄 드라이버",
    price: "1,890,000원",
    bgColor: "bg-gradient-to-br from-yellow-600 to-yellow-800",
    slug: "secret-force-gold-2",
    badge: "BEST"
  },
  {
    id: 2,
    name: "시크릿포스 PRO 3",
    category: "고반발 드라이버",
    price: "1,590,000원",
    bgColor: "bg-gradient-to-br from-gray-700 to-gray-900",
    slug: "secret-force-pro-3"
  },
  {
    id: 3,
    name: "시크릿웨폰 블랙",
    category: "투어 드라이버",
    price: "1,390,000원",
    bgColor: "bg-gradient-to-br from-black to-gray-800",
    slug: "secret-weapon-black"
  }
];

export default function Products() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">고반발 드라이버 커렉션</h2>
          <p className="text-xl text-gray-600">엄격한 품질관리로 한정 생산되는 프리미엄 드라이버</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((product) => (
            <Link 
              key={product.id}
              href={`/main/products/${product.slug}`}
              className="group"
            >
              <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all">
                <div className={`h-64 ${product.bgColor} flex items-center justify-center group-hover:scale-105 transition-transform duration-300 relative`}>
                  {product.badge && (
                    <span className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {product.badge}
                    </span>
                  )}
                  <div className="text-white text-center">
                    <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6l4 2"/>
                    </svg>
                    <p className="text-4xl font-bold opacity-20">MASGOLF</p>
                  </div>
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
