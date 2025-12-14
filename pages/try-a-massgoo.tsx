import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { formatBrandDistanceResearch, formatBrandYears } from '../lib/brand-utils';

export default function TryAMassgoo() {
  const [footerExpanded, setFooterExpanded] = useState(false);
  // 전문 피터 작업 이미지 URL (맞춤형 추천 섹션용)
  // 밝고 긍정적인 분위기, 웃는 표정, MASSGOO 로고가 명확한 이미지 사용
  // 2번 이미지: ai-generated-high-tech-innovative-feed-1763901175209-1-1.jpg (웃는 여성, 밝은 조명, MASSGOO 로고 명확)
  const [fitterImageUrl] = useState<string | null>(
    'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/originals/ai-generated/2025-11-23/ai-generated-high-tech-innovative-feed-1763901175209-1-1.jpg' // 밝고 긍정적인 분위기, 웃는 표정, MASSGOO 로고 명확
  );

  return (
    <>
      <Head>
        <title>마쓰구 드라이버 시타서비스 - {formatBrandDistanceResearch()} | 무료 시타 예약 | 마쓰구골프</title>
        <meta name="description" content={`${formatBrandDistanceResearch()}. KGFA 1급 전문 피터가 직접 진행하는 마쓰구 드라이버 시타서비스. 무료 시타 체험으로 최적의 드라이버를 찾아보세요.`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content={`마쓰구 드라이버 시타서비스 - ${formatBrandDistanceResearch()}`} />
        <meta property="og:description" content={`${formatBrandDistanceResearch()}. KGFA 1급 전문 피터가 직접 진행하는 무료 시타 체험으로 최적의 드라이버를 찾아보세요.`} />
        <meta property="og:url" content="https://www.masgolf.co.kr/try-a-massgoo" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.masgolf.co.kr/try-a-massgoo" />
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
                <Link href="/contact" className="text-gray-700 hover:text-gray-900">시타매장</Link>
                <Link href="/try-a-massgoo" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold">
                  무료 시타
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* 히어로 섹션 - 초심플 버전 */}
        <section className="relative min-h-[70vh] md:min-h-[85vh] flex items-center justify-center overflow-hidden bg-black py-12 md:py-20">
          <div className="absolute inset-0 z-0">
            {/* 매장 실제 사진 배경 */}
            <Image
              src="/main/store/fitting-experience.png"
              alt="시타 체험 장면"
              fill
              className="object-cover opacity-60"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/80"></div>
          </div>
          
          <div className="relative z-10 container mx-auto px-4 text-center">
            {/* 배지 - 그라데이션 및 그림자 효과 */}
            <div className="mb-4 md:mb-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <span className="inline-block bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 text-black px-4 py-1.5 md:px-5 md:py-2 rounded-full text-xs md:text-sm font-bold shadow-lg">
                KGFA 1급 전문 피터
              </span>
              <span className="inline-block bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 text-white px-4 py-1.5 md:px-5 md:py-2 rounded-full text-xs md:text-sm font-bold shadow-lg">
                {formatBrandDistanceResearch()}
              </span>
            </div>
            
            {/* 메인 타이틀 - 모바일 최적화 */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 text-white leading-[1.2] tracking-tight">
              마쓰구 드라이버<br />
              <span className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 bg-clip-text text-transparent">
                시타서비스
              </span>
            </h1>
            
            {/* 서브텍스트 - 모바일에서 행바꿈 */}
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-8 md:mb-10 text-gray-200 max-w-xl mx-auto leading-relaxed px-2">
              무료 시타 체험으로<br className="sm:hidden" />
              최적의 드라이버를 찾아보세요
            </p>
            
            {/* CTA - 최신 디자인 트렌드 적용 */}
            <div className="flex justify-center">
              <Link
                href="/booking"
                className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 md:px-12 md:py-5 rounded-xl font-bold text-base md:text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 w-full max-w-xs md:w-auto"
              >
                <span>무료 시타 예약하기</span>
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 서비스 소개 */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12 text-gray-900 leading-tight px-4">
                왜 마쓰구 시타를<br className="sm:hidden" />
                선택해야 할까요?
              </h2>
              
              <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                {/* KGFA 1급 전문 피터 - 상담 장면 */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src="/main/store/fitting-consultation.jpeg"
                      alt="시타 상담 장면"
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                  <div className="p-6 md:p-8">
                    <div className="text-4xl mb-4">🏌️</div>
                    <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-gray-900">KGFA 1급 전문 피터</h3>
                    <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                      골프 피팅 전문가가 직접 진행하는 정확한 스윙 분석과 클럽 추천
                    </p>
                  </div>
                </div>

                {/* 정밀 스윙 분석 - 체험 장면 */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src="/main/store/fitting-experience.png"
                      alt="시타 체험 장면"
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                  <div className="p-6 md:p-8">
                    <div className="text-4xl mb-4">📊</div>
                    <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-gray-900">정밀 스윙 분석</h3>
                    <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                      최신 장비를 활용한 스윙 속도, 볼 스피드, 비거리 등 정확한 데이터 측정
                    </p>
                  </div>
                </div>

                {/* 맞춤형 추천 - 전문 피터 작업 (AI 생성 이미지) */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                  <div className="relative h-48 overflow-hidden">
                    {fitterImageUrl ? (
                      <Image
                        src={fitterImageUrl}
                        alt="전문 피터 작업 장면"
                        fill
                        className="object-cover transition-transform duration-500 hover:scale-110"
                      />
                    ) : (
                      <div className="h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <div className="text-center p-4">
                          <div className="text-4xl mb-2">🎯</div>
                          <p className="text-sm text-gray-600">전문 피터 작업 이미지</p>
                          <p className="text-xs text-gray-500 mt-1">
                            <Link href="/admin/ai-image-generator" className="text-blue-600 hover:underline">
                              AI 이미지 생성 메뉴에서 생성
                            </Link>
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                  <div className="p-6 md:p-8">
                    <div className="text-4xl mb-4">🎯</div>
                    <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-gray-900">맞춤형 추천</h3>
                    <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                      개인의 스윙 스타일과 목표에 맞는 최적의 드라이버 추천
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 예약 프로세스 */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12 text-gray-900 leading-tight px-4">
                간편한 예약 프로세스
              </h2>
              
              <div className="space-y-8">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    1
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2 text-gray-900">온라인 예약</h3>
                    <p className="text-gray-600">
                      원하시는 날짜와 시간을 선택하여 간편하게 예약하세요
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    2
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2 text-gray-900">매장 방문</h3>
                    <p className="text-gray-600">
                      예약하신 시간에 마쓰구 수원본점을 방문해주세요
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    3
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2 text-gray-900">시타 체험</h3>
                    <p className="text-gray-600">
                      전문 피터와 함께 스윙 분석 및 최적의 드라이버를 찾아보세요
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    4
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2 text-gray-900">결과 확인</h3>
                    <p className="text-gray-600">
                      측정된 데이터와 추천 클럽 정보를 확인하세요
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-12 text-center">
                <Link
                  href="/booking"
                  className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
                >
                  <span>예약하기</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 매장 정보 - 최신 디자인 */}
        <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-gray-900">시타 매장 정보</h2>
              <div className="space-y-4 md:space-y-5 text-gray-700">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">📍</span>
                  <div>
                    <strong className="text-gray-900 block mb-1">위치</strong>
                    <span className="text-gray-700">경기도 수원시 영통구 법조로149번길 200</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">📞</span>
                  <div>
                    <strong className="text-gray-900 block mb-1">전화</strong>
                    <a href="tel:031-215-0013" className="text-blue-600 hover:text-blue-700 font-medium">
                      031-215-0013
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">🕘</span>
                  <div>
                    <strong className="text-gray-900 block mb-1">운영시간</strong>
                    <span className="text-gray-700">평일 09:00 - 18:00, 주말 예약제 운영</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 pt-2 border-t border-gray-200">
                  <span className="text-xl mt-0.5">☎️</span>
                  <div>
                    <strong className="text-gray-900 block mb-1 text-base md:text-lg">비거리 상담</strong>
                    <a href="tel:080-028-8888" className="text-blue-600 hover:text-blue-700 font-semibold text-base md:text-lg">
                      080-028-8888
                    </a>
                    <span className="text-gray-600 text-sm md:text-base ml-2">(무료)</span>
                  </div>
                </div>
                <div className="pt-4">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                  >
                    <span>매장 위치 자세히 보기</span>
                    <span className="transition-transform hover:translate-x-1">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 푸터 */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-bold text-lg mb-4">마쓰구골프</h3>
                <p className="text-gray-400 text-sm">
                  정직함과 정확성을 바탕으로 골프의 미래를 새롭게 정의합니다.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-4">빠른 링크</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link href="/" className="hover:text-white">홈</Link></li>
                  <li><Link href="/about" className="hover:text-white">브랜드 스토리</Link></li>
                  <li><Link href="/contact" className="hover:text-white">시타매장</Link></li>
                  <li><Link href="/try-a-massgoo" className="hover:text-white">무료 시타</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-4">연락처</h3>
                <p className="text-gray-400 text-sm">
                  경기도 수원시 영통구 법조로149번길 200<br />
                  전화: 031-215-0013
                </p>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
              <p>&copy; 2025 마쓰구골프. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

