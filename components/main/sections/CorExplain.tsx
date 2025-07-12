import React, { useEffect, useState } from 'react';

export default function CorExplain() {
  const [corValue, setCorValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
            // COR 애니메이션
            const target = 0.87;
            const increment = target / 100;
            let current = 0;
            const timer = setInterval(() => {
              current += increment;
              if (current >= target) {
                current = target;
                clearInterval(timer);
              }
              setCorValue(current);
            }, 30);
          }
        });
      },
      { threshold: 0.5 }
    );

    const element = document.querySelector('.cor-animation-trigger');
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, [isVisible]);

  return (
    <section className="py-20 bg-black text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">COR 0.87의 비밀</h2>
          <p className="text-xl text-gray-300">영국 왕립 골프협회(R&A)가 경계하는 수치</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="cor-animation-trigger">
            <div className="text-center">
              <div className="text-8xl font-bold text-yellow-400 mb-4">
                {corValue.toFixed(2)}
              </div>
              <p className="text-2xl mb-8">반발 계수 (COR)</p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-gray-800 p-4 rounded-lg">
                  <span>일반 드라이버</span>
                  <span className="text-2xl font-bold">0.83</span>
                </div>
                <div className="flex items-center justify-between bg-yellow-900 p-4 rounded-lg">
                  <span>MASGOLF 고반발</span>
                  <span className="text-2xl font-bold text-yellow-400">0.87</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <h3 className="text-2xl font-bold mb-4">COR이 높으면 왜 비거리가 늘어날까?</h3>
            
            <div className="space-y-4">
              <div className="bg-gray-800 p-6 rounded-lg">
                <h4 className="text-lg font-bold text-yellow-400 mb-2">에너지 전달 효율</h4>
                <p className="text-gray-300">
                  COR 0.87은 임팩트 시 87%의 에너지가 볼에 전달됩니다. 
                  일반 드라이버(0.83)보다 4% 더 많은 에너지가 전달되어 비거리가 증가합니다.
                </p>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-lg">
                <h4 className="text-lg font-bold text-yellow-400 mb-2">실제 비거리 증가</h4>
                <p className="text-gray-300">
                  COR 0.01 증가 시 약 7-8m의 비거리 증가 효과.
                  0.83 → 0.87은 약 30m의 비거리 증가를 의미합니다.
                </p>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-lg">
                <h4 className="text-lg font-bold text-yellow-400 mb-2">R&A 비공인 이유</h4>
                <p className="text-gray-300">
                  R&A는 COR 0.83을 상한선으로 규정. 
                  MASGOLF의 0.87은 이를 초과하는 '비공인' 고반발 드라이버입니다.
                </p>
              </div>
            </div>
            
            <div className="bg-yellow-900 p-6 rounded-lg text-center">
              <p className="text-xl font-bold">
                "경기용이 아닌, 즐거운 라운드를 위한 선택"
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}