import Head from 'next/head';
import Image from 'next/image';
import { useState } from 'react';

export default function WeaponBerylProduct() {
  const [selectedImage, setSelectedImage] = useState(0);

  const productImages = [
    '/main/products/black-beryl/massgoo_sw_black_muz_11.webp',
    '/main/products/black-beryl/massgoo_sw_black_muz_01.webp',
    '/main/products/black-beryl/massgoo_sw_black_muz_01_n.webp',
    '/main/products/black-beryl/massgoo_sw_black_muz_12.webp',
    '/main/products/black-beryl/massgoo_sw_black_muz_13.webp',
    '/main/products/black-beryl/massgoo_sw_black_muz_14_b.webp',
    '/main/products/black-beryl/massgoo_sw_black_muz_15.webp',
    '/main/products/black-beryl/massgoo_sw_black_muz_18.webp',
    '/main/products/black-beryl/massgoo_sw_black_muz_23.webp',
  ];

  return (
    <>
      <Head>
        <title>시크리트웨폰 블랙 + MUZIIK 베릴 | 하이테크 얼리아답터를 위한 궁극의 콤보</title>
        <meta name="description" content="프리미엄 비주얼 + 최고 성능의 완벽한 조합. 블랙 PVD 코팅 + 에메랄드 그린 샤프트. 하이테크 얼리아답터를 위한 리미티드 에디션." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-green-50">
        {/* 헤더 */}
        <header className="bg-black shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 sm:py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <span className="text-lg sm:text-2xl font-bold text-white">MUZIIK</span>
                <span className="text-lg sm:text-2xl font-bold text-white">X MASSGOO</span>
              </div>
              <a href="tel:080-028-8888" className="bg-red-600 text-white px-3 py-2 sm:px-6 sm:py-3 rounded-lg hover:bg-red-700 transition-colors font-bold text-sm sm:text-base whitespace-nowrap">
                <span className="hidden sm:inline">080-028-8888 (무료 상담)</span>
                <span className="sm:hidden">전화</span>
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
                <div className="relative aspect-square">
                  <Image 
                    src={productImages[selectedImage]} 
                    alt="웨폰 블랙 + 베릴 콤보" 
                    fill
                    className="object-cover rounded-2xl shadow-2xl"
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
                    시크리트웨폰 블랙 + MUZIIK 베릴
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
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <h3 className="font-bold text-gray-900 mb-2">에메랄드 그린</h3>
                    <p className="text-sm text-gray-600">마제스티 수준의 세련됨</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-900 mb-2">리미티드 에디션</h3>
                    <p className="text-sm text-gray-600">월 15개 한정</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-900 mb-2">성능 보장</h3>
                    <p className="text-sm text-gray-600">+15-25m 비거리</p>
                  </div>
                </div>

                {/* 구매 버튼 */}
                <div className="space-y-4">
                  <a href="tel:080-028-8888" className="w-full bg-green-600 text-white text-xl font-bold py-4 px-8 rounded-lg hover:bg-green-700 transition-colors text-center block">
                    080-028-8888 무료 상담하기
                  </a>
                  <a href="https://smartstore.naver.com/mas9golf/products/12606826152" target="_blank" rel="noopener noreferrer" className="w-full bg-blue-600 text-white text-xl font-bold py-4 px-8 rounded-lg hover:bg-blue-700 transition-colors text-center block">
                    네이버 스마트스토어에서 구매하기
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
                <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
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
            <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl p-4 sm:p-8 shadow-2xl border border-gray-800 overflow-x-auto">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8 text-center">시크리트웨폰 블랙 MUZIIK</h3>
              <p className="text-center text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base">상품 스펙 안내</p>
              
              <div className="grid grid-cols-[120px_1fr_1fr_1fr] sm:grid-cols-[180px_1fr_1fr_1fr] gap-2 sm:gap-4 mb-6 sm:mb-8 min-w-[700px] sm:min-w-0">
                <div></div>
                <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                  <div className="text-2xl font-black text-white mb-1">230</div>
                  <div className="text-xs text-gray-400">스티프 레귤러</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                  <div className="text-2xl font-black text-white mb-1">240</div>
                  <div className="text-xs text-gray-400">스티프</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                  <div className="text-2xl font-black text-white mb-1">250</div>
                  <div className="text-xs text-gray-400">엑스</div>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8 min-w-[700px] sm:min-w-0">
                <div className="grid grid-cols-[120px_1fr_1fr_1fr] sm:grid-cols-[180px_1fr_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4 border-b border-gray-800">
                  <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">헤드 각도</div>
                  <div className="text-center">
                    <div className="text-white font-bold text-xl">10°</div>
                    <div className="text-gray-400 text-sm mt-1">드로우 페이스 0.5° [10.5°®]</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400 text-sm">-</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400 text-sm">-</div>
                  </div>
                </div>
                <div className="grid grid-cols-[120px_1fr_1fr_1fr] sm:grid-cols-[180px_1fr_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4 border-b border-gray-800">
                  <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">최적 무게</div>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg">277</div>
                    <div className="text-gray-400 text-xs">230</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg">280</div>
                    <div className="text-gray-400 text-xs">240</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg">283</div>
                    <div className="text-gray-400 text-xs">250</div>
                  </div>
                </div>
                <div className="grid grid-cols-[120px_1fr_1fr_1fr] sm:grid-cols-[180px_1fr_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4 border-b border-gray-800">
                  <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">탄성 샤프트</div>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg">42</div>
                    <div className="text-gray-400 text-xs">Torque 4.8</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg">47</div>
                    <div className="text-gray-400 text-xs">Torque 3.8</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg">49</div>
                    <div className="text-gray-400 text-xs">Torque 3.8</div>
                  </div>
                </div>
                <div className="grid grid-cols-[120px_1fr_1fr_1fr] sm:grid-cols-[180px_1fr_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4 border-b border-gray-800">
                  <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">탄성 그립</div>
                  <div className="text-center">
                    <div className="text-white font-bold text-xl">35</div>
                    <div className="text-gray-400 text-sm mt-1">600 스탠다드 [장갑 23호 ±1 적합]</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400 text-sm">-</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400 text-sm">-</div>
                  </div>
                </div>
                <div className="grid grid-cols-[120px_1fr_1fr_1fr] sm:grid-cols-[180px_1fr_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4 border-b border-gray-800">
                  <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">고반발 헤드</div>
                  <div className="text-white font-bold text-xl text-center">193</div>
                  <div className="text-gray-400 text-sm text-center"></div>
                  <div className="text-gray-400 text-sm text-center"></div>
                </div>
                <div className="grid grid-cols-[120px_1fr_1fr_1fr] sm:grid-cols-[180px_1fr_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4 border-b border-gray-800">
                  <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">헤드 라이각</div>
                  <div className="text-center">
                    <div className="text-white font-bold text-xl">59.5°</div>
                    <div className="text-gray-400 text-sm mt-1">표준 [키 165cm-175cm 적합]</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400 text-sm">-</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400 text-sm">-</div>
                  </div>
                </div>
                <div className="grid grid-cols-[120px_1fr_1fr_1fr] sm:grid-cols-[180px_1fr_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4 border-b border-gray-800">
                  <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">킥 포인트</div>
                  <div className="text-center">
                    <div className="text-white font-bold text-xl">Mid Low</div>
                    <div className="text-gray-400 text-sm mt-1">중하단</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400 text-sm">-</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400 text-sm">-</div>
                  </div>
                </div>
                <div className="grid grid-cols-[120px_1fr_1fr_1fr] sm:grid-cols-[180px_1fr_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4 border-b border-gray-800">
                  <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">최적의 길이 & 헤드 부피</div>
                  <div className="col-span-3">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center">
                        <div className="text-gray-400 text-sm mb-2">최적의 길이</div>
                        <div className="text-white font-bold text-2xl">46&quot;</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400 text-sm mb-2">헤드 부피</div>
                        <div className="text-white font-bold text-2xl">460 cc</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-[120px_1fr_1fr_1fr] sm:grid-cols-[180px_1fr_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4 border-b border-gray-800">
                  <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">최적 밸런스</div>
                  <div className="text-white font-bold text-xl text-center">D2</div>
                  <div className="text-gray-400 text-sm text-center"></div>
                  <div className="text-gray-400 text-sm text-center"></div>
                </div>
                <div className="grid grid-cols-[120px_1fr_1fr_1fr] sm:grid-cols-[180px_1fr_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4 border-b border-gray-800">
                  <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">샤프트 진동수</div>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg">230</div>
                    <div className="text-gray-400 text-xs">cpm</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg">240</div>
                    <div className="text-gray-400 text-xs">cpm</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg">250</div>
                    <div className="text-gray-400 text-xs">cpm</div>
                  </div>
                </div>
                <div className="grid grid-cols-[120px_1fr_1fr_1fr] sm:grid-cols-[180px_1fr_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4">
                  <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">맞춤 볼스피드</div>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg">58</div>
                    <div className="text-gray-400 text-xs">m/s</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg">62</div>
                    <div className="text-gray-400 text-xs">m/s</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg">66</div>
                    <div className="text-gray-400 text-xs">m/s</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-800">
                <h4 className="text-xl font-bold text-white mb-6 text-center">DOGATTI GENERATION BERYL</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-4 px-4 font-bold text-gray-300">FLEX</th>
                        <th className="text-center py-4 px-4 font-bold text-gray-300">전장(mm)</th>
                        <th className="text-center py-4 px-4 font-bold text-gray-300">중량(g)</th>
                        <th className="text-center py-4 px-4 font-bold text-gray-300">Tip(mm)</th>
                        <th className="text-center py-4 px-4 font-bold text-gray-300">Butt(mm)</th>
                        <th className="text-center py-4 px-4 font-bold text-gray-300">토크(°↓)</th>
                        <th className="text-center py-4 px-4 font-bold text-gray-300">CPM</th>
                        <th className="text-center py-4 px-4 font-bold text-gray-300">K.P.</th>
                    </tr>
                  </thead>
                  <tbody>
                      <tr className="border-b border-gray-800">
                        <td className="py-4 px-4 font-semibold text-white">R2</td>
                        <td className="text-center py-4 px-4 text-gray-300">1136</td>
                        <td className="text-center py-4 px-4 text-gray-300">42</td>
                        <td className="text-center py-4 px-4 text-gray-300">8.55</td>
                        <td className="text-center py-4 px-4 text-gray-300">14.95</td>
                        <td className="text-center py-4 px-4 text-gray-300">5.0</td>
                        <td className="text-center py-4 px-4 text-white font-bold">230</td>
                        <td className="text-center py-4 px-4 text-gray-300">先中調子</td>
                    </tr>
                      <tr className="border-b border-gray-800">
                        <td className="py-4 px-4 font-semibold text-white">R</td>
                        <td className="text-center py-4 px-4 text-gray-300">1136</td>
                        <td className="text-center py-4 px-4 text-gray-300">48</td>
                        <td className="text-center py-4 px-4 text-gray-300">8.55</td>
                        <td className="text-center py-4 px-4 text-gray-300">15.1</td>
                        <td className="text-center py-4 px-4 text-gray-300">4.0</td>
                        <td className="text-center py-4 px-4 text-white font-bold">240</td>
                        <td className="text-center py-4 px-4 text-gray-300">先中調子</td>
                    </tr>
                      <tr className="border-b border-gray-800">
                        <td className="py-4 px-4 font-semibold text-white">SR</td>
                        <td className="text-center py-4 px-4 text-gray-300">1136</td>
                        <td className="text-center py-4 px-4 text-gray-300">49</td>
                        <td className="text-center py-4 px-4 text-gray-300">8.55</td>
                        <td className="text-center py-4 px-4 text-gray-300">15.15</td>
                        <td className="text-center py-4 px-4 text-gray-300">4.0</td>
                        <td className="text-center py-4 px-4 text-white font-bold">250</td>
                        <td className="text-center py-4 px-4 text-gray-300">先中調子</td>
                    </tr>
                      <tr className="border-b border-gray-800">
                        <td className="py-4 px-4 font-semibold text-white">S</td>
                        <td className="text-center py-4 px-4 text-gray-300">1136</td>
                        <td className="text-center py-4 px-4 text-gray-300">50</td>
                        <td className="text-center py-4 px-4 text-gray-300">8.55</td>
                        <td className="text-center py-4 px-4 text-gray-300">15.2</td>
                        <td className="text-center py-4 px-4 text-gray-300">4.0</td>
                        <td className="text-center py-4 px-4 text-white font-bold">260</td>
                        <td className="text-center py-4 px-4 text-gray-300">先中調子</td>
                    </tr>
                    <tr>
                        <td className="py-4 px-4 font-semibold text-white">X</td>
                        <td className="text-center py-4 px-4 text-gray-300">1136</td>
                        <td className="text-center py-4 px-4 text-gray-300">53</td>
                        <td className="text-center py-4 px-4 text-gray-300">8.55</td>
                        <td className="text-center py-4 px-4 text-gray-300">15.3</td>
                        <td className="text-center py-4 px-4 text-gray-300">3.9</td>
                        <td className="text-center py-4 px-4 text-white font-bold">270</td>
                        <td className="text-center py-4 px-4 text-gray-300">先中調子</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-sm text-gray-500 mt-4 text-center">※ BERYL 50 (SR: 55g, S: 56g, X: 57g) 中調子</p>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-gray-800">
                <p className="text-sm text-gray-400 text-center leading-relaxed">
                  *권장 스펙은 마쓰구골프 고객님들께서 가장 만족하시고 적합했던 표준값 입니다.<br />
                  모든 고객님들께 적합하지 않을수 있으니 스페셜 스펙은 별도 문의해 주세요.
                </p>
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
                      <th className="text-center py-4 px-4 font-bold">젝시오</th>
                      <th className="text-center py-4 px-4 font-bold text-green-600">우리 제품</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-4 px-4 font-semibold">가격</td>
                      <td className="text-center py-4 px-4">5,000,000원</td>
                      <td className="text-center py-4 px-4">5,800,000원</td>
                      <td className="text-center py-4 px-4">4,200,000원</td>
                      <td className="text-center py-4 px-4 text-green-600 font-bold">2,200,000원</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-4 px-4 font-semibold">성능</td>
                      <td className="text-center py-4 px-4">탁월</td>
                      <td className="text-center py-4 px-4">탁월</td>
                      <td className="text-center py-4 px-4">우수</td>
                      <td className="text-center py-4 px-4 text-green-600 font-bold">탁월</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-4 px-4 font-semibold">디자인</td>
                      <td className="text-center py-4 px-4">탁월</td>
                      <td className="text-center py-4 px-4">탁월</td>
                      <td className="text-center py-4 px-4">우수</td>
                      <td className="text-center py-4 px-4 text-green-600 font-bold">탁월</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-4 px-4 font-semibold">가성비</td>
                      <td className="text-center py-4 px-4">보통</td>
                      <td className="text-center py-4 px-4">보통</td>
                      <td className="text-center py-4 px-4">양호</td>
                      <td className="text-center py-4 px-4 text-green-600 font-bold">탁월</td>
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

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="group relative bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-800 hover:border-green-400">
                <div className="relative min-h-80 md:h-96 overflow-hidden">
                  <div className="absolute inset-0">
                    <Image 
                      src="/main/testimonials/hero-faces/review-face-02.jpg"
                      alt="하이테크 얼리 어답터 후기"
                      fill
                      className="object-contain md:object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
                  </div>
                  <div className="absolute top-4 left-4 z-10">
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">시크리트웨폰 블랙 MUZIIK</span>
                  </div>
                  <div className="absolute bottom-4 right-4 z-10 text-right">
                    <div className="text-3xl font-black text-green-400 mb-1">+20m</div>
                    <div className="text-xs text-gray-400 font-semibold">비거리 증가</div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white mb-1">하이테크 얼리 어답터</h3>
                  <p className="text-sm text-gray-400 mb-4">최신 기술 선호자</p>
                  <p className="text-gray-300 text-sm leading-relaxed italic">
                    &quot;블랙 PVD 코팅과 에메랄드 그린 샤프트의 조합이 정말 인상적입니다. 비거리도 확실히 늘었고, 무엇보다 시각적으로도 완벽합니다.&quot;
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="text-center bg-emerald-50 rounded-2xl p-6 border border-emerald-200">
                  <div className="text-3xl font-bold text-emerald-600 mb-2">+15m ~ +25m</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">비거리 증가</h3>
                  <p className="text-sm text-gray-600">실제 측정 데이터 기반</p>
                </div>
                <div className="text-center bg-blue-50 rounded-2xl p-6 border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600 mb-2">+15% ~ +20%</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">정확도 향상</h3>
                  <p className="text-sm text-gray-600">프로 골퍼 테스트 결과</p>
                </div>
                <div className="text-center bg-purple-50 rounded-2xl p-6 border border-purple-200">
                  <div className="text-3xl font-bold text-purple-600 mb-2">98%</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">만족도</h3>
                  <p className="text-sm text-gray-600">실제 사용자 조사</p>
              </div>
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
                <div className="bg-gradient-to-br from-white to-emerald-50 rounded-lg p-6 shadow-md border border-emerald-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">월 15개 한정 제작</h3>
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
                <span className="text-2xl font-bold">MUZIIK</span>
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

