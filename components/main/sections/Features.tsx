import React from 'react';

const features = [
  {
    title: "R&A 인증 고반발",
    description: "영국 왕립 골프협회가 인정한 최고 성능의 고반발 드라이버",
    icon: "🏆"
  },
  {
    title: "33.33% 얇은 페이스",
    description: "일본 JFE사 티타늄 사용, 일반 드라이버보다 33.33% 얇고 강력한 탄성",
    icon: "💪"
  },
  {
    title: "+30m 비거리 증가",
    description: "한 번의 시타로 비거리 30m 증가를 직접 체험할 수 있습니다",
    icon: "🚀"
  },
  {
    title: "한정 생산",
    description: "엄격한 품질관리로 한정 생산되는 프리미엄 제품",
    icon: "💎"
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
