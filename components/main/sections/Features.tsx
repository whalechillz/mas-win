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
