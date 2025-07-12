import React from 'react';
import Link from 'next/link';
import products from '../../lib/products';

export default function Products() {
  return (
    <section id="products" className="py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">고반발 드라이버 커렉션</h2>
          <p className="text-xl text-gray-600">엄격한 품질관리로 한정 생산되는 프리미엄 드라이버</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <Link 
              key={product.id}
              href="/funnel-2025-07"
              className="group"
            >
              <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all">
                <div className="relative h-64 overflow-hidden group">
                  {product.badge && (
                    <span className={`absolute top-4 right-4 ${product.badge === 'LIMITED' ? 'bg-black' : 'bg-red-600'} text-white px-3 py-1 rounded-full text-sm font-bold z-10`}>
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
                  {product.originalPrice && (
                    <p className="text-lg text-gray-400 line-through">{product.originalPrice}</p>
                  )}
                  <p className="text-2xl font-bold text-red-600 mb-4">{product.price}</p>
                  <div className="space-y-1">
                    {product.features.map((feature, idx) => (
                      <p key={idx} className="text-sm text-gray-600">• {feature}</p>
                    ))}
                  </div>
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
