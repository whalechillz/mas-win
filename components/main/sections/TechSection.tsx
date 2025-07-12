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
            <h3 className="text-2xl font-bold mb-6">티타늄 소재의 차이</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-red-600 font-bold text-xl mr-3">✓</span>
                <div>
                  <h4 className="font-semibold mb-1">DAT55G+ Grade 5 (시크릿포스 GOLD 2)</h4>
                  <p className="text-gray-600">최고급 항공우주용 티타늄. 최상의 탄성과 내구성으로 2.2mm 초박형 페이스 구현 가능</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 font-bold text-xl mr-3">✓</span>
                <div>
                  <h4 className="font-semibold mb-1">SP700 Grade 5 (시크릿웨폰 블랙)</h4>
                  <p className="text-gray-600">특수 가공 티타늄. 블랙 PVD 코팅과 결합하여 프리미엄 비주얼과 성능 제공</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 font-bold text-xl mr-3">✓</span>
                <div>
                  <h4 className="font-semibold mb-1">DAT55G (시크릿포스 PRO 3, V3)</h4>
                  <p className="text-gray-600">고강도 티타늄. 안정적인 성능과 내구성으로 일반 골퍼에게 최적</p>
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