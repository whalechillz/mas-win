import React from 'react';

export default function FamilyStory() {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">가족과 함께하는 골프의 의미</h2>
          <p className="text-xl text-gray-600">나이가 들수록 소중해지는 것들</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <img 
              src="/assets/hero/hero_father_son_golf_1080x1920.jpg" 
              alt="아버지와 아들의 골프"
              className="w-full rounded-lg shadow-xl"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-8">
              <p className="text-white text-xl font-light italic">
                "아버지, 정말 멋지세요!"
              </p>
              <p className="text-white/80 text-sm mt-2">
                - 아들의 한마디가 주는 행복
              </p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-3 text-gray-800">왜 시니어에게 고반발 드라이버가 필요한가?</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-green-600 font-bold text-xl mr-3">✓</span>
                  <div>
                    <h4 className="font-semibold mb-1">느려진 스윙 스피드 보완</h4>
                    <p className="text-gray-600">나이가 들면서 자연스럽게 느려지는 스윙 스피드를 고반발 페이스가 보완해줍니다</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 font-bold text-xl mr-3">✓</span>
                  <div>
                    <h4 className="font-semibold mb-1">자존감 회복</h4>
                    <p className="text-gray-600">동반자들과 비슷한 비거리로 자신감 있는 라운드가 가능합니다</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 font-bold text-xl mr-3">✓</span>
                  <div>
                    <h4 className="font-semibold mb-1">가족과의 즐거운 시간</h4>
                    <p className="text-gray-600">자녀들과 함께하는 라운드에서 멋진 모습을 보여줄 수 있습니다</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-200">
              <p className="text-lg font-medium text-gray-800">
                <span className="text-2xl font-bold text-yellow-600">30년</span>의 골프 경력,
                <br/>이제는 장비가 당신을 도와드릴 차례입니다
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}