import Head from 'next/head';
import Image from 'next/image';
import { useState } from 'react';

export default function WeaponBerylFunnel() {
  const [selectedImage, setSelectedImage] = useState(0);
  const [showSpecs, setShowSpecs] = useState(false);

  const productImages = [
    '/muziik/products/beryl/beryl_shaft_main.webp',
    '/muziik/products/beryl/beryl_shaft_40.webp',
    '/muziik/products/beryl/beryl_shaft_50.webp',
    '/muziik/products/beryl/beryl_shaft_bending_profile.webp'
  ];

  return (
    <>
      <Head>
        <title>시크릿웨폰 블랙 + MUZIIK 베릴 | 하이테크 얼리아답터를 위한 궁극의 콤보</title>
        <meta name="description" content="프리미엄 비주얼 + 최고 성능의 완벽한 조합. 블랙 PVD 코팅 + 에메랄드 그린 샤프트. 하이테크 얼리아답터를 위한 리미티드 에디션." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-green-50">
        {/* 헤더 */}
        <header className="bg-black shadow-lg sticky top-0 z-50">
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
                <span className="text-2xl font-bold text-white">X MASSGOO</span>
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
                    alt="웨폰 블랙 + 베릴 콤보" 
                    width={600} 
                    height={400}
                    className="w-full h-96 object-cover rounded-2xl shadow-2xl"
                  />
                  <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    LIMITED
                  </div>
                </div>
                
                {/* 썸네일 이미지들 */}
                <div className="flex space-x-4">
                  {productImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                        selectedImage === index ? 'border-green-600' : 'border-gray-300'
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
                    시크릿웨폰 블랙 + MUZIIK 베릴
                  </h1>
                  <p className="text-xl text-gray-600 mb-6">
                    하이테크 얼리아답터를 위한 궁극의 콤보
                  </p>
                  <div className="flex items-center space-x-4 mb-6">
                    <span className="text-3xl font-bold text-green-600">2,200,000원</span>
                    <span className="text-lg text-gray-500 line-through">4,200,000원</span>
                    <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm font-bold">
                      48% 할인
                    </span>
                  </div>
                </div>

                {/* 핵심 특징 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black text-white p-4 rounded-lg">
                    <h3 className="font-bold mb-2">블랙 PVD 코팅</h3>
                    <p className="text-sm text-gray-300">혼마 수준의 고급스러움</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-900 mb-2">에메랄드 그린</h3>
                    <p className="text-sm text-gray-600">마제스티 수준의 세련됨</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-900 mb-2">리미티드 에디션</h3>
                    <p className="text-sm text-gray-600">월 5개 한정</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-900 mb-2">성능 보장</h3>
                    <p className="text-sm text-gray-600">+30-35m 비거리</p>
                  </div>
                </div>

                {/* 구매 버튼 */}
                <div className="space-y-4">
                  <a href="tel:080-028-8888" className="w-full bg-green-600 text-white text-xl font-bold py-4 px-8 rounded-lg hover:bg-green-700 transition-colors text-center block">
                    080-028-8888 무료 상담하기
                  </a>
                  <p className="text-center text-sm text-gray-500">
                    장비 전문가가 직접 상담
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
              <h2 className="text-3xl font-bold text-gray-900 mb-4">프리미엄 디자인의 완벽한 조합</h2>
              <p className="text-lg text-gray-600">하이테크 얼리아답터를 위한 최고급 기술</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white">💎</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">블랙 PVD 코팅</h3>
                <p className="text-gray-600">혼마 수준의 고급스러운 블랙 마감으로 프리미엄 느낌 극대화</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white">✨</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">에메랄드 그린 샤프트</h3>
                <p className="text-gray-600">마제스티 수준의 세련된 그린 샤프트로 시각적 임팩트 극대화</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white">🎯</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">완벽한 조화</h3>
                <p className="text-gray-600">마루망 수준의 균형감으로 블랙과 그린의 완벽한 조화</p>
              </div>
            </div>

            {/* 상세 스펙 테이블 */}
            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">DOGATTI GENERATION BERYL</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-4 px-4 font-bold">FLEX</th>
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
                      <td className="py-4 px-4 font-semibold">R2</td>
                      <td className="text-center py-4 px-4">1136</td>
                      <td className="text-center py-4 px-4">42</td>
                      <td className="text-center py-4 px-4">8.55</td>
                      <td className="text-center py-4 px-4">14.95</td>
                      <td className="text-center py-4 px-4">5.0</td>
                      <td className="text-center py-4 px-4">230</td>
                      <td className="text-center py-4 px-4">先中調子</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-4 px-4 font-semibold">R</td>
                      <td className="text-center py-4 px-4">1136</td>
                      <td className="text-center py-4 px-4">48</td>
                      <td className="text-center py-4 px-4">8.55</td>
                      <td className="text-center py-4 px-4">15.1</td>
                      <td className="text-center py-4 px-4">4.0</td>
                      <td className="text-center py-4 px-4">240</td>
                      <td className="text-center py-4 px-4">先中調子</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-4 px-4 font-semibold">SR</td>
                      <td className="text-center py-4 px-4">1136</td>
                      <td className="text-center py-4 px-4">49</td>
                      <td className="text-center py-4 px-4">8.55</td>
                      <td className="text-center py-4 px-4">15.15</td>
                      <td className="text-center py-4 px-4">4.0</td>
                      <td className="text-center py-4 px-4">250</td>
                      <td className="text-center py-4 px-4">先中調子</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-4 px-4 font-semibold">S</td>
                      <td className="text-center py-4 px-4">1136</td>
                      <td className="text-center py-4 px-4">50</td>
                      <td className="text-center py-4 px-4">8.55</td>
                      <td className="text-center py-4 px-4">15.2</td>
                      <td className="text-center py-4 px-4">4.0</td>
                      <td className="text-center py-4 px-4">260</td>
                      <td className="text-center py-4 px-4">先中調子</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-4 font-semibold">X</td>
                      <td className="text-center py-4 px-4">1136</td>
                      <td className="text-center py-4 px-4">53</td>
                      <td className="text-center py-4 px-4">8.55</td>
                      <td className="text-center py-4 px-4">15.3</td>
                      <td className="text-center py-4 px-4">3.9</td>
                      <td className="text-center py-4 px-4">270</td>
                      <td className="text-center py-4 px-4">先中調子</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-sm text-gray-500 mt-4 text-center">※ BERYL 50 (SR: 55g, S: 56g, X: 57g) 中調子</p>
              </div>
            </div>
          </div>
        </section>

        {/* 경쟁사 비교 섹션 */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">다른 브랜드와의 비교</h2>
              <p className="text-lg text-gray-600">하이테크 얼리아답터가 인정하는 성능</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-4 px-4 font-bold">구분</th>
                      <th className="text-center py-4 px-4 font-bold">혼마</th>
                      <th className="text-center py-4 px-4 font-bold">마제스티</th>
                      <th className="text-center py-4 px-4 font-bold">마루망</th>
                      <th className="text-center py-4 px-4 font-bold text-green-600">우리 제품</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-4 px-4 font-semibold">가격</td>
                      <td className="text-center py-4 px-4">5,000,000원</td>
                      <td className="text-center py-4 px-4">5,800,000원</td>
                      <td className="text-center py-4 px-4">3,500,000원</td>
                      <td className="text-center py-4 px-4 text-green-600 font-bold">2,200,000원</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-4 px-4 font-semibold">성능</td>
                      <td className="text-center py-4 px-4">우수</td>
                      <td className="text-center py-4 px-4">우수</td>
                      <td className="text-center py-4 px-4">양호</td>
                      <td className="text-center py-4 px-4 text-green-600 font-bold">우수</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-4 px-4 font-semibold">디자인</td>
                      <td className="text-center py-4 px-4">우수</td>
                      <td className="text-center py-4 px-4">우수</td>
                      <td className="text-center py-4 px-4">양호</td>
                      <td className="text-center py-4 px-4 text-green-600 font-bold">우수</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-4 px-4 font-semibold">가성비</td>
                      <td className="text-center py-4 px-4">보통</td>
                      <td className="text-center py-4 px-4">보통</td>
                      <td className="text-center py-4 px-4">양호</td>
                      <td className="text-center py-4 px-4 text-green-600 font-bold">우수</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* 성능 검증 섹션 */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">실제 성능 데이터</h2>
              <p className="text-lg text-gray-600">하이테크 얼리아답터가 인정하는 성능</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center bg-green-50 rounded-2xl p-8">
                <div className="text-4xl font-bold text-green-600 mb-2">+30m ~ +35m</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">비거리 증가</h3>
                <p className="text-gray-600">실제 측정 데이터 기반</p>
              </div>
              <div className="text-center bg-blue-50 rounded-2xl p-8">
                <div className="text-4xl font-bold text-blue-600 mb-2">+15% ~ +20%</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">정확도 향상</h3>
                <p className="text-gray-600">프로 골퍼 테스트 결과</p>
              </div>
              <div className="text-center bg-purple-50 rounded-2xl p-8">
                <div className="text-4xl font-bold text-purple-600 mb-2">98%</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">만족도</h3>
                <p className="text-gray-600">실제 사용자 조사</p>
              </div>
            </div>
          </div>
        </section>

        {/* 한정성 섹션 */}
        <section className="py-16 bg-green-50">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">리미티드 에디션</h2>
              <p className="text-lg text-gray-600 mb-8">하이테크 얼리아답터만을 위한 특별한 제품</p>
              
              <div className="grid md:grid-cols-3 gap-8 mb-8">
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">월 5개 한정 제작</h3>
                  <p className="text-gray-600">희소성과 특별함</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">블랙 + 베릴 조합</h3>
                  <p className="text-gray-600">이번이 마지막</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">장비 전문가</h3>
                  <p className="text-gray-600">직접 상담</p>
                </div>
              </div>

              <a href="tel:080-028-8888" className="inline-block bg-green-600 text-white text-2xl font-bold px-12 py-6 rounded-lg hover:bg-green-700 transition-colors">
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
