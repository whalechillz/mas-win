import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export default function About() {
  const [footerExpanded, setFooterExpanded] = useState(false);
  
  return (
    <>
      <Head>
        <title>MASSGOO 브랜드 스토리 - 22년 전통의 프리미엄 드라이버</title>
        <meta name="description" content="2003년 설립된 마쓰구골프의 브랜드 스토리. 정직함과 정확성을 바탕으로 골프의 미래를 새롭게 정의합니다." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content="MASSGOO 브랜드 스토리 - 22년 전통의 프리미엄 드라이버" />
        <meta property="og:description" content="2003년 설립된 마쓰구골프의 브랜드 스토리. 정직함과 정확성을 바탕으로 골프의 미래를 새롭게 정의합니다." />
        <meta property="og:image" content="https://www.masgolf.co.kr/main/brand/hero-titanium.webp" />
        <meta property="og:url" content="https://www.masgolf.co.kr/about" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MASSGOO 브랜드 스토리 - 22년 전통의 프리미엄 드라이버" />
        <meta name="twitter:description" content="2003년 설립된 마쓰구골프의 브랜드 스토리. 정직함과 정확성을 바탕으로 골프의 미래를 새롭게 정의합니다." />
        <meta name="twitter:image" content="https://www.masgolf.co.kr/main/brand/hero-titanium.webp" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.masgolf.co.kr/about" />
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
                  <div className="text-xl font-bold text-gray-900 hidden">MASSGOO</div>
                </div>
              </Link>
              <nav className="hidden md:flex space-x-8 items-center">
                <a href="https://www.masgolf.co.kr/" className="text-gray-700 hover:text-gray-900">드라이버</a>
                <Link href="/#technology" className="text-gray-700 hover:text-gray-900">기술력</Link>
                <Link href="/#reviews" className="text-gray-700 hover:text-gray-900">고객후기</Link>
                <Link href="/about" className="text-gray-700 hover:text-gray-900 font-semibold">브랜드 스토리</Link>
                <Link href="/contact" className="text-gray-700 hover:text-gray-900">시타매장</Link>
                <Link href="/try-a-massgoo" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                  무료 시타
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* 히어로 섹션 */}
        <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 w-full h-full">
              <Image
                src="/main/brand/hero-titanium_02.webp"
                alt="티타늄 드라이버 클로즈업"
                fill
                className="object-cover opacity-60"
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
          <div className="relative z-10 container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-4 md:mb-6 leading-[1.2] tracking-tight px-2">
                22년 전,<br className="sm:hidden" />
                하나의 꿈이<br className="hidden sm:block md:hidden" />
                시작되었습니다
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-200 mb-6 md:mb-8 leading-relaxed px-2">
                정직함과 정확성으로<br className="sm:hidden" />
                골프의 미래를 새롭게 정의하는 여정
              </p>
              <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed px-2">
                2003년, 일본 장인 정신과 혁신 기술력이 만나<br className="sm:hidden" />
                MASSGOO가 탄생했습니다.<br />
                지금까지 골퍼들과 함께한 22년의 여정을 소개합니다.
              </p>
            </div>
          </div>
        </section>

        {/* 브랜드 철학 */}
        <section className="py-12 md:py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12 md:mb-16">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight px-4">
                  브랜드 철학
                </h2>
                <div className="w-16 md:w-24 h-0.5 md:h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent mx-auto mb-6 md:mb-8"></div>
              </div>
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-3xl font-bold text-gray-900">정직함</h3>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      우리는 정직함을 가장 중요한 가치로 여깁니다. 과장된 마케팅이나 허위의 약속 대신, 실제로 검증된 성능과 품질을 솔직하게 전달합니다. 고객이 경험할 수 있는 진실만을 이야기합니다.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-3xl font-bold text-gray-900">정확성</h3>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      정확한 제조 공정, 정확한 피팅, 정확한 성능 데이터. 모든 것이 정확해야 합니다. 이는 우리가 22년간 지켜온 신념입니다.
                    </p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 shadow-lg">
                  <blockquote className="text-2xl font-light text-gray-700 italic leading-relaxed">
                    &quot;골프의 미래를 새롭게 정의하는 우리의 약속&quot;
                  </blockquote>
                  <p className="mt-6 text-gray-600">
                    일본 장인 정신과 혁신 기술력의 만남으로 만들어낸 프리미엄 드라이버.<br/>
                    모든 골퍼에게 특별한 퍼포먼스를 제공하는 것이 우리의 목표입니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 혁신의 시작 */}
        <section className="py-12 md:py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12 md:mb-16">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight px-4">
                  혁신의 시작
                </h2>
                <div className="w-16 md:w-24 h-0.5 md:h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent mx-auto mb-4 md:mb-8"></div>
                <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
                  2003년, 드라이버와 우드 생산의 시작
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl">
                  <Image
                    src="/main/brand/initial-product-secret-weapon.webp"
                    alt="2003년 초기 제품 - 시크리트웨폰"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-6">
                  <h3 className="text-3xl font-bold text-gray-900">일본 장인 정신과 혁신 기술력의 만남</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    2003년, 마쓰구골프는 드라이버와 우드 생산을 시작했습니다. 일본의 장인 정신과 혁신적인 기술력을 결합하여 전 세계 골퍼에게 최고의 경험을 제공하고자 했습니다.
                  </p>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    기술적 설명보다는 스토리 중심으로, 고객과 함께 성장해온 22년의 여정을 이야기합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 차별화된 기술력 */}
        <section className="py-12 md:py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12 md:mb-16">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight px-4">
                  차별화된 기술력
                </h2>
                <div className="w-16 md:w-24 h-0.5 md:h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent mx-auto mb-6 md:mb-8"></div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-md">
                    <span className="text-2xl md:text-3xl">⚡</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">DAT55G+ Titanium</h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                    최고급 항공우주용 티타늄. 뛰어난 내구성과 강도로 2.2mm 초박형 페이스를 구현할 수 있는 혁신적인 소재입니다.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-md">
                    <span className="text-2xl md:text-3xl">💎</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">SP700+ Titanium</h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                    특수 가공 티타늄. 최적의 경량성과 성능을 제공하며, 블랙 PVD 코팅과 결합하여 프리미엄 비주얼과 성능을 완성합니다.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-md">
                    <span className="text-2xl md:text-3xl">🎯</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">2.2mm 초박형 페이스</h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                    경쟁사 대비 33.33% 얇은 페이스. 실제 측정 검증된 2.2mm 초박형 페이스로 최대 비거리를 실현합니다. (경쟁사 2.7~3.3mm)
                  </p>
                </div>
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-md">
                    <span className="text-2xl md:text-3xl">🚀</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">풀티타늄 샤프트</h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                    샤프트 전장에 티타늄 파이버를 사용한 혁신적인 기술. 초고속 반발력과 헤드 안정성을 실현하며, 오프센터 시 헤드 흔들림을 억제합니다.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-md">
                    <span className="text-2xl md:text-3xl">✨</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">오토플렉스 (원플렉스)</h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                    헤드 스피드에 관계없이 다양한 골퍼에게 적합한 자동적인 플렉스 타입. 백스윙 탑부터 임팩트까지 헤드 움직임을 안정화하여 타이밍을 잡기 쉽게 합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 프리미엄 샤프트 콜라보 */}
        <section className="py-12 md:py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12 md:mb-16">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight px-4">
                  프리미엄 샤프트 콜라보
                </h2>
                <div className="w-16 md:w-24 h-0.5 md:h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent mx-auto mb-4 md:mb-8"></div>
                <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
                  세계 최고 수준의 샤프트 제조사들과의 전략적 파트너십
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-shadow">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl">🏆</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">미야자와에티모</h3>
                    <p className="text-sm text-gray-500">50년 업력 (현재 중단)</p>
                  </div>
                  <p className="text-gray-600 text-center leading-relaxed">
                    장기간의 협업을 통해 프리미엄 샤프트 기술을 축적했습니다.
                  </p>
                </div>
                <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-shadow">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl">⭐</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">NGS 골프스튜디오</h3>
                    <p className="text-sm text-gray-500">40년 이상 업력 (현재 장착모델 있음)</p>
                  </div>
                  <p className="text-gray-600 text-center leading-relaxed">
                    지속적인 파트너십으로 최고 품질의 샤프트를 제공합니다.
                  </p>
                </div>
                <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-shadow border-2 border-red-200">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl">🚀</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">MUZIIK</h3>
                    <p className="text-sm text-gray-500">2008년 설립, 17년 경력 (최신 협업)</p>
                  </div>
                  <p className="text-gray-600 text-center leading-relaxed">
                    최신 기술과 혁신적인 디자인으로 프리미엄 샤프트의 새로운 기준을 제시합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 글로벌 여정 */}
        <section className="py-12 md:py-20 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12 md:mb-16">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight px-4">
                  글로벌 여정
                </h2>
                <div className="w-16 md:w-24 h-0.5 md:h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent mx-auto mb-4 md:mb-8"></div>
                <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
                  세계 골프업계에서의 입지 확대
                </p>
                <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto mt-4 leading-relaxed px-4">
                  일본, 미국, 중국을 포함한 주요 글로벌 시장에서 인정받으며, 혁신적인 기술과 신뢰를 바탕으로 세계 골프업계에서 그 입지를 넓혀가고 있습니다.
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-12 items-start mb-12">
                <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/main/brand/awards-bookshelf-04.webp"
                    alt="2011년 중소기업 브랜드 대상 및 2012년 대한민국 골프산업 대상"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/main/brand/call_center.webp"
                    alt="고객 상담 센터"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6 mb-12">
                <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🏅</span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">2011년 중소기업 브랜드 대상</h4>
                  <p className="text-gray-600">정직함과 정확성의 가치가 인정받았습니다.</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🏆</span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">2012년 대한민국 골프산업 대상</h4>
                  <p className="text-gray-600">국내 골프산업에서의 기여가 인정받았습니다.</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 text-white">
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-4xl font-bold mb-2">22</div>
                    <div className="text-sm text-gray-300">년 제조 경력</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold mb-2">3</div>
                    <div className="text-sm text-gray-300">개 대륙 진출</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold mb-2">2</div>
                    <div className="text-sm text-gray-300">회 수상 경력</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 22년간 함께한 골퍼들의 이야기 */}
        <section className="py-12 md:py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12 md:mb-16">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight px-4">
                  22년간 함께한<br className="sm:hidden" />
                  골퍼들의 이야기
                </h2>
                <div className="w-16 md:w-24 h-0.5 md:h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent mx-auto mb-4 md:mb-8"></div>
                <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
                  실제 고객 후기와 성공 사례
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white rounded-xl p-8 shadow-md">
                  <div className="text-4xl mb-4">📈</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">비거리 증가</h3>
                  <p className="text-gray-600 leading-relaxed">
                    평균 15-25m 비거리 증가를 경험한 골퍼들의 생생한 후기와 데이터를 확인하세요.
                  </p>
                </div>
                <div className="bg-white rounded-xl p-8 shadow-md">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">정확도 향상</h3>
                  <p className="text-gray-600 leading-relaxed">
                    방향성과 정확도가 향상되어 더욱 안정적인 샷을 실현한 고객들의 이야기입니다.
                  </p>
                </div>
                <div className="bg-white rounded-xl p-8 shadow-md">
                  <div className="text-4xl mb-4">😊</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">만족도 향상</h3>
                  <p className="text-gray-600 leading-relaxed">
                    22년간 쌓아온 신뢰와 만족도. 고객 중심의 성공 사례를 확인해보세요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 프리미엄 드라이버 시리즈 */}
        <section className="py-12 md:py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12 md:mb-16">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight px-4">
                  프리미엄 드라이버 시리즈
                </h2>
                <div className="w-16 md:w-24 h-0.5 md:h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent mx-auto mb-6 md:mb-8"></div>
              </div>
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl mb-12">
                <Image
                  src="/main/brand/products-lineup.webp"
                  alt="프리미엄 드라이버 시리즈"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-gray-50 rounded-xl p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">시크리트포스 골드 2 MUZIIK</h3>
                  <p className="text-gray-600 leading-relaxed">
                    MUZIIK 오토플렉스 티타늄 샤프트와 결합한 프리미엄 드라이버. 비거리 회복의 확실함을 제공합니다.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">시크리트웨폰 블랙 MUZIIK</h3>
                  <p className="text-gray-600 leading-relaxed">
                    풀 티타늄 4X 샤프트와 블랙 PVD 코팅의 완벽한 조합. 나노레벨 카본 기술의 궁극의 콤보.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">시크리트웨폰 골드 4.1</h3>
                  <p className="text-gray-600 leading-relaxed">
                    정확한 티샷을 위한 최적의 반발력을 제공하는 프리미엄 드라이버. 우아한 골드 컬러의 세련된 디자인.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">시크리트포스 PRO 3</h3>
                  <p className="text-gray-600 leading-relaxed">
                    정밀한 반발력으로 완벽한 샷을 구현하는 고반발 드라이버. 가성비와 성능의 균형.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">시크리트포스 V3</h3>
                  <p className="text-gray-600 leading-relaxed">
                    투어 드라이버의 기본기를 갖춘 접근 가능한 프리미엄 드라이버. 입문자부터 중급자까지.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 서비스 보증 */}
        <section className="py-12 md:py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12 md:mb-16">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight px-4">
                  서비스 보증
                </h2>
                <div className="w-16 md:w-24 h-0.5 md:h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent mx-auto mb-4 md:mb-8"></div>
                <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
                  고객 만족을 최우선으로 하는 우리의 약속
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl">
                  <Image
                    src="/main/brand/service-warranty.webp"
                    alt="서비스 보증"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-6">
                  <div className="bg-white rounded-xl p-6 shadow-md">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">3년 무제한 A/S</h3>
                    <p className="text-gray-600 leading-relaxed">
                      구매 후 3년간 무제한 A/S 서비스를 제공합니다.
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-md">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">10년 샤프트 교환 보증</h3>
                    <p className="text-gray-600 leading-relaxed">
                      샤프트 강도가 마음에 들지 않으면 10년간 다른 샤프트로 교환할 수 있습니다.
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-md">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">90일 전액 환불</h3>
                    <p className="text-gray-600 leading-relaxed">
                      구매일로부터 90일 이내 전액 환불이 가능합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA 섹션 */}
        <section className="py-12 md:py-20 bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center px-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 leading-tight">
                골프의 미래를<br className="sm:hidden" />
                함께 만들어갑니다
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-8 md:mb-12 leading-relaxed">
                당신의 골프 여정에 함께하겠습니다.<br />
                22년 전통의 기술력으로 특별한 퍼포먼스를 제공합니다.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/try-a-massgoo"
                  className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 md:px-10 md:py-4 rounded-xl font-semibold text-base md:text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
                >
                  <span>무료 시타 체험하기</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                </Link>
                <Link
                  href="/"
                  className="group inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-8 py-4 md:px-10 md:py-4 rounded-xl font-semibold text-base md:text-lg transition-all duration-300 border-2 border-white/30 hover:border-white/50"
                >
                  <span>제품 둘러보기</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                </Link>
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
                        <p className="text-sm text-gray-400 mb-4">MASGOLF® 프리미엄 드라이버 브랜드</p>
                        <p className="text-gray-300 mb-4 leading-relaxed">
                          MASGOLF는 2003년부터 당신의 골프 여정에 함께해 왔습니다. MASSGOO는 MASGOLF의 프리미엄 드라이버 브랜드입니다. 20년 전통의 기술력으로 만든 혁신적인 드라이버 브랜드로, 나노레벨 카본 기술을 추구하는 골퍼부터 비거리 회복을 원하는 골퍼까지, 모든 골퍼에게 특별한 퍼포먼스를 제공합니다.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p>사업자명: MASGOLF® | 대표자명: 김탁수</p>
                        <p>사업자등록번호: 877-07-00641</p>
                        <p>통신판매업신고번호: 제 2017-수원영통-0623호</p>
                        <p>상표권 등록일: 2003-07-31</p>
                      </div>
                    </div>
                    
                    {/* 시타 센터 정보 */}
                    <div>
                      <h4 className="font-bold mb-4 text-white">시타 센터</h4>
                      <div className="space-y-4">
                        <div>
                          <p className="font-medium mb-2">주소</p>
                          <p className="text-sm">수원시 영통구 법조로 149번길 200</p>
                          <p className="text-sm text-yellow-400">(광교 갤러리아에서 차량 5분)</p>
                        </div>
                        <div>
                          <p className="font-medium mb-2">연락처</p>
                          <p className="text-sm">방문 상담 예약: 031-215-0013</p>
                          <p className="text-sm">비거리 상담: 080-028-8888 (무료)</p>
                        </div>
                        <div>
                          <p className="font-medium mb-2">영업시간</p>
                          <p className="text-sm">월-금 09:00 - 18:00</p>
                          <p className="text-sm text-yellow-400">주말은 예약제로 운영합니다</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* 연락처 정보 */}
                    <div>
                      <h4 className="font-bold mb-4 text-white">연락처</h4>
                      <div className="space-y-2">
                        <div>
                          <p className="font-medium mb-2">이메일</p>
                          <p className="text-sm">hello@masgolf.co.kr</p>
                        </div>
                        <div>
                          <p className="font-medium mb-2">웹사이트</p>
                          <p className="text-sm">www.mas9golf.com</p>
                          <p className="text-sm">www.masgolf.co.kr</p>
                        </div>
                        <div className="mt-4">
                          <Link
                            href="/about"
                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            브랜드 스토리 →
                          </Link>
                        </div>
                        <div className="mt-2">
                          <Link
                            href="/try-a-massgoo"
                            className="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors"
                          >
                            무료 시타 신청 +30m 비거리
                          </Link>
                        </div>
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

