import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export default function Contact() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [footerExpanded, setFooterExpanded] = useState(false);

  return (
    <>
      <Head>
        <title>마쓰구 수원본점 - MASGOLF 시타센터 | 위치 안내</title>
        <meta name="description" content="마쓰구 수원본점 위치 안내. 경기도 수원시 영통구 법조로149번길 200. 시타 및 피팅 예약: 031-215-0013. 다양한 네비게이션으로 찾아오세요." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content="마쓰구 수원본점 - MASGOLF 시타센터" />
        <meta property="og:description" content="경기도 수원시 영통구 법조로149번길 200. 시타 및 피팅 예약: 031-215-0013" />
        <meta property="og:image" content="https://www.masgolf.co.kr/main/contact/masgolf-store-exterior-brick-01.webp" />
        <meta property="og:url" content="https://www.masgolf.co.kr/contact" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="마쓰구 수원본점 - MASGOLF 시타센터" />
        <meta name="twitter:description" content="경기도 수원시 영통구 법조로149번길 200. 시타 및 피팅 예약: 031-215-0013" />
        <meta name="twitter:image" content="https://www.masgolf.co.kr/main/contact/masgolf-store-exterior-brick-01.webp" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.masgolf.co.kr/contact" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              name: '마쓰구 수원본점',
              alternateName: 'MASGOLF 수원본점',
              image: 'https://www.masgolf.co.kr/main/contact/masgolf-store-exterior-brick-01.webp',
              address: {
                '@type': 'PostalAddress',
                streetAddress: '법조로149번길 200',
                addressLocality: '수원시 영통구',
                addressRegion: '경기도',
                postalCode: '16229',
                addressCountry: 'KR',
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: '37.2808',
                longitude: '127.0498',
              },
              description: '마쓰구 수원본점 - MASGOLF 시타센터. 골프 드라이버 피팅 및 상담 전문 매장.',
              telephone: '031-215-0013',
              priceRange: '$$',
              openingHoursSpecification: [
                {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                  opens: '09:00',
                  closes: '18:00',
                },
              ],
            }),
          }}
        />
      </Head>

      <main className="min-h-screen bg-white">
        {/* 헤더 네비게이션 */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center">
                <div className="relative h-8 w-auto max-w-[140px]">
                  <Image
                    src="/main/logo/massgoo_logo_black.png"
                    alt="MASSGOO 로고"
                    width={140}
                    height={32}
                    priority
                    className="h-8 w-auto object-contain max-w-full"
                  />
                </div>
              </Link>
              <nav className="hidden md:flex space-x-8 items-center">
                <a href="https://www.masgolf.co.kr/" className="text-gray-700 hover:text-gray-900">드라이버</a>
                <Link href="/#technology" className="text-gray-700 hover:text-gray-900">기술력</Link>
                <Link href="/#reviews" className="text-gray-700 hover:text-gray-900">고객후기</Link>
                <Link href="/about" className="text-gray-700 hover:text-gray-900">브랜드 스토리</Link>
                <Link href="/blog" className="text-gray-700 hover:text-gray-900">골프 가이드</Link>
                <Link href="/contact" className="text-red-600 font-semibold">시타매장</Link>
                <Link href="/try-a-massgoo" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                  무료 시타
                </Link>
              </nav>
              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-gray-700 hover:text-gray-900 transition-colors"
                  aria-label="메뉴 열기/닫기"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
            {/* 모바일 메뉴 */}
            {isMobileMenuOpen && (
              <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-col space-y-3">
                  <a href="https://www.masgolf.co.kr/" className="text-gray-700 hover:text-gray-900 py-2">드라이버</a>
                  <Link href="/#technology" className="text-gray-700 hover:text-gray-900 py-2" onClick={() => setIsMobileMenuOpen(false)}>기술력</Link>
                  <Link href="/#reviews" className="text-gray-700 hover:text-gray-900 py-2" onClick={() => setIsMobileMenuOpen(false)}>고객후기</Link>
                  <Link href="/about" className="text-gray-700 hover:text-gray-900 py-2" onClick={() => setIsMobileMenuOpen(false)}>브랜드 스토리</Link>
                  <Link href="/contact" className="text-red-600 font-semibold py-2" onClick={() => setIsMobileMenuOpen(false)}>시타매장</Link>
                  <Link href="/try-a-massgoo" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-center">
                    무료 시타
                  </Link>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* 히어로 섹션 */}
        <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900">
          <div className="absolute inset-0 z-0">
            <div className="relative w-full h-full">
              <Image
                src="/main/contact/masgolf-store-exterior-brick-01.webp"
                alt="마쓰구 수원본점 외관"
                fill
                className="object-cover opacity-70"
                priority
                quality={90}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80"></div>
          </div>
          <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">마쓰구 수원본점</h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-4">MASGOLF Suwon Main Branch</p>
            <p className="text-lg text-gray-300">경기도 수원시 영통구 법조로149번길 200</p>
          </div>
        </section>

        {/* 매장 정보 */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <div className="flex items-start space-x-4 mb-6">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">📍</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">주소</h2>
                      <p className="text-lg text-gray-700 leading-relaxed mb-4">
                        경기도 수원시 영통구 법조로149번길 200<br/>
                        마쓰구골프 [수원 본점]
                      </p>
                      <div className="space-y-2">
                        <p className="flex items-center space-x-2">
                          <span className="text-gray-600">📞</span>
                          <a href="tel:031-215-0013" className="text-lg text-blue-600 hover:text-blue-800 font-semibold">
                            031-215-0013
                          </a>
                        </p>
                        <p className="flex items-center space-x-2">
                          <span className="text-gray-600">☎</span>
                          <a href="tel:080-028-8888" className="text-lg text-blue-600 hover:text-blue-800 font-semibold">
                            080-028-8888 (무료)
                          </a>
                          <span className="text-sm text-gray-500">비거리 상담</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <div className="flex items-start space-x-4 mb-6">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">🕘</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">매장 운영 시간</h2>
                      <div className="space-y-2 text-lg">
                        <p className="flex justify-between">
                          <span className="text-gray-700">월요일</span>
                          <span className="text-gray-900 font-semibold">오전 9:00 - 오후 6:00</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-gray-700">화요일</span>
                          <span className="text-gray-900 font-semibold">오전 9:00 - 오후 6:00</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-gray-700">수요일</span>
                          <span className="text-gray-900 font-semibold">오전 9:00 - 오후 6:00</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-gray-700">목요일</span>
                          <span className="text-gray-900 font-semibold">오전 9:00 - 오후 6:00</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-gray-700">금요일</span>
                          <span className="text-gray-900 font-semibold">오전 9:00 - 오후 6:00</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-gray-700">토요일</span>
                          <span className="text-red-600 font-semibold">휴무</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-gray-700">일요일</span>
                          <span className="text-red-600 font-semibold">휴무</span>
                        </p>
                        <p className="text-sm text-gray-500 mt-4 pt-4 border-t">* 주말은 예약제로 운영됩니다</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 지도 섹션 */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">지도로 찾아오기</h2>
                <div className="w-24 h-1 bg-red-600 mx-auto mb-8"></div>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">선호하시는 네비게이션 앱을 선택하여 길찾기를 시작하세요</p>
              </div>
              <div className="mb-12">
                <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-200 bg-gray-100">
                  <iframe
                    src={`https://www.google.com/maps/embed/v1/search?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&q=경기도 수원시 영통구 법조로149번길 200+마쓰구&zoom=17`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0"
                    title="마쓰구 수원본점 위치"
                    onLoad={() => {
                      // iframe이 로드되면 로딩 메시지 숨김
                      setIsMapLoading(false);
                    }}
                  />
                  {/* 로딩 메시지 - 지도가 로드되면 숨김 */}
                  {isMapLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                      <p className="text-gray-600">지도를 로드하는 중입니다...</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <a
                  href="https://www.google.com/maps/search/?api=1&query=경기도 수원시 영통구 법조로149번길 200+마쓰구"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all border-2 border-gray-200 hover:border-red-500 group"
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-200 transition">
                    <svg className="w-10 h-10" viewBox="0 0 24 24" fill="#4285F4">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-red-600 transition">Google Maps</span>
                </a>
                <a
                  href="https://naver.me/x7nKAjkL"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all border-2 border-gray-200 hover:border-green-500 group"
                >
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-200 transition">
                    <span className="text-3xl font-bold text-green-600">N</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-green-600 transition">네이버 지도</span>
                </a>
                <a
                  href="https://tmap.life/693d6191"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all border-2 border-gray-200 hover:border-orange-500 group"
                >
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-orange-200 transition">
                    <span className="text-2xl font-bold text-orange-600">T</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-600 transition">T맵</span>
                </a>
                <a
                  href="https://map.kakao.com/?q=마쓰구"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all border-2 border-gray-200 hover:border-yellow-500 group"
                >
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-yellow-200 transition">
                    <span className="text-2xl font-bold text-yellow-600">K</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-yellow-600 transition">카카오맵</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 매장 둘러보기 */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">매장 둘러보기</h2>
                <div className="w-24 h-1 bg-red-600 mx-auto mb-8"></div>
              </div>
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">외관</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl">
                    <Image
                      src="/main/contact/masgolf-store-exterior-brick-01.webp"
                      alt="마쓰구 수원본점 외관 (벽돌 건물)"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl">
                    <Image
                      src="/main/contact/masgolf-store-exterior-glass-01.webp"
                      alt="마쓰구 수원본점 외관 (유리 외벽)"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl">
                    <Image
                      src="/main/contact/masgolf-store-exterior-glass-02.webp"
                      alt="마쓰구 수원본점 외관 (현대적인 외관)"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">내부</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl">
                    <Image
                      src="/main/contact/masgolf-store-interior-display-01.webp"
                      alt="마쓰구 수원본점 내부 제품 진열"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl">
                    <Image
                      src="/main/contact/masgolf-store-interior-fitting-01.webp"
                      alt="마쓰구 수원본점 시타 센터"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 찾아오는 길 */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">찾아오는 길</h2>
                <div className="w-24 h-1 bg-red-600 mx-auto mb-8"></div>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-gray-50 rounded-2xl p-8">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">🚇</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">대중교통</h3>
                  </div>
                  <div className="space-y-4 text-lg">
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">지하철</p>
                      <p className="text-gray-700">신분당선 상현역 2번 출구에서 하차</p>
                      <p className="text-sm text-gray-500 mt-1">도보 약 10분</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">버스</p>
                      <p className="text-gray-700 font-medium">이의초중고교.광교호수마을호반써밋</p>
                      <p className="text-sm text-gray-600 mt-1">버스 노선: 720-1, 720-2, 730, 81번 등</p>
                      <p className="text-sm text-gray-500 mt-1">도보 약 3분</p>
                      <p className="text-xs text-gray-400 mt-2">
                        ※ 다른 정류장: 광교휴먼시아32단지, 광교휴먼시아32단지.이의고교
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-8">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">🚗</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">자가용</h3>
                  </div>
                  <div className="space-y-4 text-lg">
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">고속도로 이용</p>
                      <p className="text-gray-700">
                        영동고속도로 동수원IC, 경부고속도로 신갈IC, 용인서울고속도로 광교상현IC
                      </p>
                      <p className="text-gray-700 mt-1">→ 법조로149번길 200</p>
                      <p className="text-sm text-gray-500 mt-1">수원고등법원 근처</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">주차 안내</p>
                      <p className="text-gray-700">1층 전용 주차공간 이용 가능</p>
                      <p className="text-sm text-gray-500 mt-1">방문 고객 편의 제공</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">📍 주변 랜드마크</h3>
                <div className="grid md:grid-cols-2 gap-4 text-gray-700">
                  <p>• 광교 갤러리아에서 차량 5분</p>
                  <p>• 수원고등법원 근처</p>
                  <p>• 수원 광교신도시 내</p>
                  <p>• 신분당선 상현역 인근</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA 섹션 */}
        <section className="py-20 bg-gradient-to-br from-gray-900 via-black to-gray-900">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center text-white">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">마쓰구의 압도적인 비거리를 경험해보세요</h2>
              <p className="text-xl text-gray-300 mb-8">전문 피팅을 통해 당신에게 가장 적합한 드라이버를 찾아보세요</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/try-a-massgoo"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition shadow-lg hover:shadow-2xl"
                >
                  📞 시타 신청하기
                </Link>
                <a
                  href="tel:080-028-8888"
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-8 rounded-xl text-lg transition shadow-lg hover:shadow-2xl"
                >
                  ☎ 비거리 상담하기
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 푸터 */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              {/* 통합 신뢰도 섹션 - 한 줄 (아이콘만) */}
              <div className="py-6 border-b border-gray-800">
                <div className="flex items-center justify-center gap-4 text-gray-500">
                  {/* 다른 브랜드 보기 */}
                  <div className="flex items-center gap-2">
                    <Link 
                      href="/" 
                      className="opacity-50 hover:opacity-100 transition-opacity"
                      title="MASSGOO 드라이버"
                    >
                      <img 
                        src="/main/logo/massgoo_logo_white.png" 
                        alt="MASSGOO"
                        className="h-4 w-auto object-contain"
                      />
                    </Link>
                    <span className="text-gray-700 text-xs">/</span>
                    <Link 
                      href="/muziik" 
                      className="opacity-50 hover:opacity-100 transition-opacity"
                      title="MUZIIK 샤프트"
                    >
                      <img 
                        src="/muziik/brand/muziik-logo-art.png" 
                        alt="MUZIIK"
                        className="h-4 w-auto object-contain"
                      />
                    </Link>
                  </div>
                  
                  {/* 구분선 */}
                  <div className="w-px h-4 bg-gray-800"></div>
                  
                  {/* SSL 보안 */}
                  <Link 
                    href="#" 
                    className="opacity-50 hover:opacity-100 transition-opacity"
                    title="SSL 보안 인증"
                  >
                    <img 
                      src="/main/brand/ssl-secure-badge.svg" 
                      alt="SSL"
                      className="h-4 w-4 object-contain"
                    />
                  </Link>
                  
                  {/* 구분선 */}
                  <div className="w-px h-4 bg-gray-800"></div>
                  
                  {/* 프리미엄 품질 */}
                  <Link 
                    href="#" 
                    className="opacity-50 hover:opacity-100 transition-opacity"
                    title="프리미엄 품질"
                  >
                    <img 
                      src="/main/brand/premium-quality-badge.svg" 
                      alt="프리미엄"
                      className="h-4 w-4 object-contain"
                    />
                  </Link>
                  
                  {/* 구분선 */}
                  <div className="w-px h-4 bg-gray-800"></div>
                  
                  {/* mas9golf.com */}
                  <Link 
                    href="https://www.mas9golf.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="opacity-50 hover:opacity-100 transition-opacity"
                    title="MASSGOO 공식몰"
                  >
                    <img 
                      src="/main/brand/mas9golf-icon.svg" 
                      alt="MASSGOO 공식몰"
                      className="h-4 w-4 object-contain"
                    />
                  </Link>
                  
                  {/* 구분선 */}
                  <div className="w-px h-4 bg-gray-800"></div>
                  
                  {/* 네이버 스마트스토어 */}
                  <Link 
                    href="https://smartstore.naver.com/mas9golf" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="opacity-50 hover:opacity-100 transition-opacity"
                    title="네이버 스마트스토어"
                  >
                    <img 
                      src="/main/brand/naver-smartstore-icon.svg" 
                      alt="네이버 스마트스토어"
                      className="h-4 w-4 object-contain"
                    />
                  </Link>
                </div>
              </div>
              
              {/* 토글 버튼 */}
              <button
                onClick={() => setFooterExpanded(!footerExpanded)}
                className="w-full py-3 px-4 text-xs text-gray-400 hover:text-gray-300 
                           border-b border-gray-800 transition-all duration-300
                           flex items-center justify-center gap-2
                           hover:bg-gray-800/30"
              >
                <span>회사 정보</span>
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${
                    footerExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* 토글 콘텐츠 */}
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  footerExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="py-6 px-4">
                  <div className="grid md:grid-cols-3 gap-8 text-sm text-gray-400">
                    {/* MASSGOO 브랜드 정보 */}
                    <div>
                      <div className="mb-4">
                        <div className="relative h-10 w-auto max-w-[140px] mb-4">
                          <Image
                            src="/main/logo/massgoo_logo_white.png"
                            alt="MASSGOO 로고"
                            width={140}
                            height={40}
                            className="h-10 w-auto object-contain max-w-full"
                          />
                        </div>
                        <p className="text-sm text-gray-400">MASGOLF® 프리미엄 드라이버 브랜드</p>
                      </div>
                    </div>
                    
                    {/* 고객센터 정보 */}
                    <div>
                      <h4 className="font-bold mb-4 text-white">MASSGOO 고객센터</h4>
                      <div className="space-y-2">
                        <p>비거리 상담: 080-028-8888 (무료)</p>
                        <p>피팅 & 방문 상담: 031-215-0013</p>
                        <p>📍 수원시 영통구 법조로 149번길 200</p>
                        <p>🕘 월-금 09:00 - 18:00 / 주말 예약제 운영</p>
                      </div>
                    </div>
                    
                    {/* 사업자 정보 */}
                    <div>
                      <h4 className="font-bold mb-4 text-white">사업자 정보</h4>
                      <div className="space-y-2">
                        <p>사업자등록번호: 877-07-00641</p>
                        <p>통신판매업신고번호: 제 2017-수원영통-0623호</p>
                        <p>사업자명: MASGOLF® | 대표자명: 김탁수</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 저작권 정보 */}
              <div className="py-4 text-center text-xs text-gray-500 border-t border-gray-800">
                <p>© 2025 MASGOLF All Rights Reserved.</p>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

