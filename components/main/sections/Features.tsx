import React from 'react';

const features = [
  {
    title: "R&A 공식 비공인",
    description: "영국 왕립 골프협회가 경계할 정도로 강력한 반발력",
    icon: "🏆"
  },
  {
    title: "시니어 최적화 설계",
    description: "느려진 스윙에도 최대 반발력을 내는 2.2mm 초박형 페이스",
    icon: "💪"
  },
  {
    title: "즉각적인 비거리 회복",
    description: "첨 시타부터 체감하는 30m 이상의 비거리 증가",
    icon: "🚀"
  },
  {
    title: "일본 장인정신",
    description: "40년 전통 골프스튜디오에서 한정 제작",
    icon: "💎"
  }
];

export default function Features() {
  return (
    <section id="features" className="py-20 bg-gray-50">
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
