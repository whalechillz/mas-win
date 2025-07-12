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
