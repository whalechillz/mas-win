import React from 'react';
import Link from 'next/link';

const products = [
  {
    id: 1,
    name: "시크릿포스 GOLD 2",
    category: "프리미엄 드라이버",
    price: "1,890,000원",
    image: "/assets/product/titanium_club_face_1200x800.jpg",
    slug: "secret-force-gold-2",
    badge: "BEST"
  },
  {
    id: 2,
    name: "시크릿포스 PRO 3",
    category: "고반발 드라이버",
    price: "1,590,000원",
    image: "/assets/campaigns/2025-07/secret-force-pro3.jpg",
    slug: "secret-force-pro-3"
  },
  {
    id: 3,
    name: "시크릿웨폰 블랙",
    category: "투어 드라이버",
    price: "1,390,000원",
    image: "/assets/campaigns/2025-07/secret-weapon-black.jpg",
    slug: "secret-weapon-black"
  }
];

export default function Products() {
  return (
    <section id="products" className="py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">고반발 드라이버 커렉션</h2>
          <p className="text-xl text-gray-600">엄격한 품질관리로 한정 생산되는 프리미엄 드라이버</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((product) => (
            <Link 
              key={product.id}
              href="/funnel-2025-07"
              className="group"
            >
              <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all">
                <div className="relative h-64 overflow-hidden group">
                  {product.badge && (
                    <span className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold z-10">
                      {product.badge}
                    </span>
                  )}
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
            href="/funnel-2025-07" 
            className="inline-block bg-black text-white px-8 py-4 rounded-lg hover:bg-gray-800 transition"
          >
            무료 시타 신청하기
          </Link>
        </div>
      </div>
    </section>
  );
}
