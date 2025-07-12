import React from 'react';

export default function TechSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">페이스 두께의 비밀</h2>
          <p className="text-xl text-gray-600">일반 드라이버보다 33.33% 얇은 2.2mm 티타늄 페이스</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <img 
              src="/assets/product/titanium-face-2.2mm.jpg" 
              alt="2.2mm 티타늄 페이스"
              className="w-full rounded-lg shadow-xl"
            />
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-6">왜 얇은 페이스가 중요한가?</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-red-600 font-bold text-xl mr-3">✓</span>
                <div>
                  <h4 className="font-semibold mb-1">탄성 에너지 극대화</h4>
                  <p className="text-gray-600">얇은 페이스는 임팩트 시 더 많이 휘어져 강력한 반발력 생성</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 font-bold text-xl mr-3">✓</span>
                <div>
                  <h4 className="font-semibold mb-1">스윗스팟 확대</h4>
                  <p className="text-gray-600">페이스 전체가 고르게 휘어져 미스샷에도 안정적인 비거리</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 font-bold text-xl mr-3">✓</span>
                <div>
                  <h4 className="font-semibold mb-1">일본 JFE사 프리미엄 티타늄</h4>
                  <p className="text-gray-600">항공우주급 소재로 내구성과 탄성을 동시에 확보</p>
                </div>
              </li>
            </ul>
            <div className="mt-8 p-6 bg-gray-100 rounded-lg">
              <p className="text-lg font-semibold text-center">
                "한 번의 시타로 <span className="text-red-600">30m 비거리 증가</span>를 직접 체험하세요"
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}