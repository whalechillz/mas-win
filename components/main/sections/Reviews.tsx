import React from 'react';

const reviews = [
  {
    id: 1,
    name: "김성호 대표 (62세)",
    avatar: "/assets/review/golfer_avatar_512x512_01.jpg",
    rating: 5,
    distance: "+35m",
    comment: "나이 들면서 비거리가 계속 줄어 고민이었는데, 이제 젊은 후배들과 비거리 차이가 거의 안 납니다. 드라이버 하나로 10년은 젊어진 느낌이에요."
  },
  {
    id: 2,
    name: "이재민 회장 (58세)",
    avatar: "/assets/review/golfer_avatar_512x512_02.jpg",
    rating: 5,
    distance: "+28m",
    comment: "예전엔 파5홀에서 3온이 힘들었는데, 지금은 편하게 2온 합니다. 동반자들이 다들 비거리 늘었다고 놀라더군요."
  },
  {
    id: 3,
    name: "박준영 원장 (65세)",
    avatar: "/assets/review/golfer_avatar_512x512_03.jpg",
    rating: 5,
    distance: "+32m",
    comment: "스윙 스피드가 예전 같지 않아 포기하고 있었는데, 고반발 드라이버로 바꾸니 젊은 시절 비거리가 다시 나옵니다. 골프가 다시 재미있어졌어요."
  }
];

export default function Reviews() {
  return (
    <section id="reviews" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">시니어 골퍼들의 생생한 후기</h2>
          <p className="text-xl text-gray-600">나이는 숫자에 불과, 비거리는 다시 돌아옵니다</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center mb-6">
                <img 
                  src={review.avatar} 
                  alt={review.name}
                  className="w-16 h-16 rounded-full mr-4"
                />
                <div>
                  <h3 className="font-semibold">{review.name}</h3>
                  <div className="flex text-yellow-400">
                    {[...Array(review.rating)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold text-red-600">{review.distance}</span>
                <span className="text-gray-600 ml-2">비거리 증가</span>
              </div>
              <p className="text-gray-700 italic">"{review.comment}"</p>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-lg text-gray-600 mb-6">지금 무료 시타를 신청하고 직접 경험해보세요</p>
          <a 
            href="/funnel-2025-07" 
            className="inline-block bg-red-600 text-white px-8 py-4 rounded-lg hover:bg-red-700 transition font-semibold text-lg"
          >
            무료 시타 신청하기
          </a>
        </div>
      </div>
    </section>
  );
}