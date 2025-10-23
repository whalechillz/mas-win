import Head from 'next/head';
import Image from 'next/image';
import { useState } from 'react';

export default function Gold2SapphireFunnel() {
  const [selectedImage, setSelectedImage] = useState(0);
  const [showSpecs, setShowSpecs] = useState(false);

  const productImages = [
    '/muziik/products/sapphire/sapphire_shaft_main2.webp',
    '/muziik/products/sapphire/sapphire_shaft_40.webp',
    '/muziik/products/sapphire/sapphire_shaft_bending_profile.webp'
  ];

  return (
    <>
      <Head>
        <title>시크릿포스 GOLD 2 + MUZIIK 사파이어 | 일본 장인정신의 완벽한 조합</title>
        <meta name="description" content="R&A 비공인 0.87 반발계수 + 오토플렉스 기술. 혼마, 마제스티 대비 50-60% 저렴한 가격으로 동일한 성능을 경험하세요. 무료 시타 체험 가능." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-yellow-50 via-yellow-100 to-blue-50">
        {/* 헤더 */}
        <header className="bg-white shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <Image 
                  src="/muziik/logos/muziik-logo2.webp" 
                  alt="MUZIIK Logo" 
                  width={120} 
                  height={40}
                  className="h-10 w-auto"
                />
                <span className="text-2xl font-bold text-gray-800">X MASSGOO</span>
              </div>
              <a href="tel:080-028-8888" className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-bold">
                080-028-8888 (무료 상담)
              </a>
            </div>
          </div>
        </header>

        {/* 제품 히어로 섹션 */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* 제품 이미지 */}
              <div className="space-y-4">
                <div className="relative">
                  <Image 
                    src={productImages[selectedImage]} 
                    alt="GOLD 2 + 사파이어 콤보" 
                    width={600} 
                    height={400}
                    className="w-full h-96 object-cover rounded-2xl shadow-2xl"
                  />
                  <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    NEW
                  </div>
                </div>
                
                {/* 썸네일 이미지들 */}
                <div className="flex space-x-4">
                  {productImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                        selectedImage === index ? 'border-red-600' : 'border-gray-300'
                      }`}
                    >
                      <Image 
                        src={image} 
                        alt={`제품 이미지 ${index + 1}`} 
                        width={80} 
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* 제품 정보 */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    시크릿포스 GOLD 2 + MUZIIK 사파이어
                  </h1>
                  <p className="text-xl text-gray-600 mb-6">
                    일본 장인정신 + 혁신 기술의 완벽한 조합
                  </p>
                  <div className="flex items-center space-x-4 mb-6">
                    <span className="text-3xl font-bold text-red-600">2,200,000원</span>
                    <span className="text-lg text-gray-500 line-through">4,500,000원</span>
                    <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-bold">
                      51% 할인
                    </span>
                  </div>
                </div>

                {/* 핵심 특징 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-900 mb-2">R&A 비공인</h3>
                    <p className="text-sm text-gray-600">0.87 반발계수</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-900 mb-2">비거리 증가</h3>
                    <p className="text-sm text-gray-600">+35m 보장</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-900 mb-2">일본 제조</h3>
                    <p className="text-sm text-gray-600">60년 전통</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-900 mb-2">한정 제작</h3>
                    <p className="text-sm text-gray-600">월 10개</p>
                  </div>
                </div>

                {/* 구매 버튼 */}
                <div className="space-y-4">
                  <a href="tel:080-028-8888" className="w-full bg-red-600 text-white text-xl font-bold py-4 px-8 rounded-lg hover:bg-red-700 transition-colors text-center block">
                    080-028-8888 무료 상담하기
                  </a>
                  <p className="text-center text-sm text-gray-500">
                    KGFA 1급 전문 피터가 직접 상담
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 기술 사양 섹션 */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">혁신적인 기술 사양</h2>
              <p className="text-lg text-gray-600">일본 최고급 기술의 완벽한 조합</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">초고반발 기술</h3>
                <p className="text-gray-600">R&A 규정을 초과하는 0.87 반발계수로 최대 비거리 실현</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">오토플렉스 설계</h3>
                <p className="text-gray-600">모든 골퍼의 스윙에 최적화된 자동 조절 기술</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏆</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">일본 장인정신</h3>
                <p className="text-gray-600">60년 전통의 수제 공정과 최고급 소재</p>
              </div>
            </div>

            {/* 상세 스펙 테이블 */}
            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">DOGATTI GENERATION SAPPHIRE 40/50</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-4 px-4 font-bold">Model</th>
                      <th className="text-center py-4 px-4 font-bold">전장(mm)</th>
                      <th className="text-center py-4 px-4 font-bold">중량(g)</th>
                      <th className="text-center py-4 px-4 font-bold">Tip(mm)</th>
                      <th className="text-center py-4 px-4 font-bold">Butt(mm)</th>
                      <th className="text-center py-4 px-4 font-bold">토크(°↓)</th>
                      <th className="text-center py-4 px-4 font-bold">CPM</th>
                      <th className="text-center py-4 px-4 font-bold">K.P.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-4 px-4 font-semibold">40</td>
                      <td className="text-center py-4 px-4">1130</td>
                      <td className="text-center py-4 px-4">45</td>
                      <td className="text-center py-4 px-4">8.55</td>
                      <td className="text-center py-4 px-4">15.05</td>
                      <td className="text-center py-4 px-4">5.0</td>
                      <td className="text-center py-4 px-4">200</td>
                      <td className="text-center py-4 px-4">더블킥</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-4 font-semibold">50</td>
                      <td className="text-center py-4 px-4">1130</td>
                      <td className="text-center py-4 px-4">54</td>
                      <td className="text-center py-4 px-4">8.55</td>
                      <td className="text-center py-4 px-4">15.4</td>
                      <td className="text-center py-4 px-4">4.2</td>
                      <td className="text-center py-4 px-4">215</td>
                      <td className="text-center py-4 px-4">더블킥</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* 경쟁사 비교 섹션 */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">프리미엄 브랜드 대비 50% 저렴</h2>
              <p className="text-lg text-gray-600">동일한 성능, 더 나은 가격</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-4 px-4 font-bold">브랜드</th>
                      <th className="text-right py-4 px-4 font-bold">가격</th>
                      <th className="text-right py-4 px-4 font-bold">우리 제품</th>
                      <th className="text-right py-4 px-4 font-bold">절약 금액</th>
                      <th className="text-center py-4 px-4 font-bold">성능</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-4 px-4 font-semibold">혼마</td>
                      <td className="text-right py-4 px-4">5,000,000원</td>
                      <td className="text-right py-4 px-4 text-red-600 font-bold">2,200,000원</td>
                      <td className="text-right py-4 px-4 text-green-600 font-bold">2,800,000원</td>
                      <td className="text-center py-4 px-4">동일</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-4 px-4 font-semibold">마제스티</td>
                      <td className="text-right py-4 px-4">5,800,000원</td>
                      <td className="text-right py-4 px-4 text-red-600 font-bold">2,200,000원</td>
                      <td className="text-right py-4 px-4 text-green-600 font-bold">3,600,000원</td>
                      <td className="text-center py-4 px-4">동일</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-4 px-4 font-semibold">마루망</td>
                      <td className="text-right py-4 px-4">3,500,000원</td>
                      <td className="text-right py-4 px-4 text-red-600 font-bold">2,200,000원</td>
                      <td className="text-right py-4 px-4 text-green-600 font-bold">1,300,000원</td>
                      <td className="text-center py-4 px-4">우수</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* 고객 후기 섹션 */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">실제 고객 후기</h2>
              <p className="text-lg text-gray-600">시니어 골퍼들의 생생한 경험담</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-yellow-50 rounded-2xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-white font-bold">
                    김
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-gray-900">김성호 대표 (62세)</h4>
                    <p className="text-sm text-gray-600">+35m 비거리 증가</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">"혼마보다 더 나은 성능을 경험했습니다. 나이 들면서 비거리가 계속 줄어 고민이었는데, 이제 젊은 후배들과 비거리 차이가 거의 안 납니다."</p>
              </div>

              <div className="bg-blue-50 rounded-2xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center text-white font-bold">
                    박
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-gray-900">박준영 원장 (65세)</h4>
                    <p className="text-sm text-gray-600">+32m 비거리 증가</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">"마제스티 수준의 성능을 합리적인 가격에 경험할 수 있어서 만족합니다. 첫 시타부터 확실한 차이를 느꼈습니다."</p>
              </div>

              <div className="bg-green-50 rounded-2xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center text-white font-bold">
                    이
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-gray-900">이재민 회장 (58세)</h4>
                    <p className="text-sm text-gray-600">+28m 비거리 증가</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">"마루망의 신뢰성과 혁신 기술의 완벽한 조합입니다. 동반자들이 다들 비거리 늘었다고 놀라더군요."</p>
              </div>
            </div>
          </div>
        </section>

        {/* 한정성 섹션 */}
        <section className="py-16 bg-red-50">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">월 10개 한정 제작</h2>
              <p className="text-lg text-gray-600 mb-8">일본 장인정신의 수제 제작으로 인한 희소성</p>
              
              <div className="grid md:grid-cols-3 gap-8 mb-8">
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">혼마 수준의 수제 제작</h3>
                  <p className="text-gray-600">60년 전통의 수제 공정</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">마제스티 수준의 품질 관리</h3>
                  <p className="text-gray-600">엄격한 품질 관리 시스템</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">마루망 수준의 신뢰성</h3>
                  <p className="text-gray-600">50년 역사의 신뢰성</p>
                </div>
              </div>

              <a href="tel:080-028-8888" className="inline-block bg-red-600 text-white text-2xl font-bold px-12 py-6 rounded-lg hover:bg-red-700 transition-colors">
                080-028-8888 지금 바로 상담하기
              </a>
            </div>
          </div>
        </section>

        {/* 푸터 */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-4 mb-6">
                <Image 
                  src="/muziik/logos/muziik-logo2.webp" 
                  alt="MUZIIK Logo" 
                  width={120} 
                  height={40}
                  className="h-10 w-auto"
                />
                <span className="text-2xl font-bold">X MASSGOO</span>
              </div>
              <p className="text-gray-400 mb-4">© 2025 MASGOLF X MUZIIK. All rights reserved.</p>
              <p className="text-sm text-gray-500">
                사업자등록번호: 877-07-00641 | 대표자: 김탁수 | 통신판매업신고번호: 제 2017-수원영통-0623호
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
