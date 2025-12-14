import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { formatBrandYears } from '../../lib/brand-utils';

const REVIEW_CATEGORIES = ['고객 후기', '리얼 체험, 비거리 성공 후기'];

export default function Gold2SapphireProduct() {
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);

  const productImages = [
    '/main/products/gold2-sapphire/massgoo_sf_gold2_muz_11.webp',
    '/main/products/gold2-sapphire/massgoo_sf_gold2_muz_01.webp',
    '/main/products/gold2-sapphire/massgoo_sf_gold2_muz_12.webp',
    '/main/products/gold2-sapphire/massgoo_sf_gold2_muz_13.webp',
    '/main/products/gold2-sapphire/massgoo_sf_gold2_muz_14.webp',
    '/main/products/gold2-sapphire/massgoo_sf_gold2_muz_16.webp',
    '/main/products/gold2-sapphire/massgoo_sf_gold2_muz_17.webp',
    '/main/products/gold2-sapphire/massgoo_sf_gold2_muz_18.webp',
    '/main/products/gold2-sapphire/massgoo_sf_gold2_muz_22.webp',
    '/main/products/gold2-sapphire/massgoo_sf_gold2_muz_23.webp',
  ];

  // 블로그 후기 가져오기
  useEffect(() => {
    let isMounted = true;

    const fetchReviews = async () => {
      try {
        const responses = await Promise.all(
          REVIEW_CATEGORIES.map((category) =>
            fetch(`/api/blog/posts?category=${encodeURIComponent(category)}&limit=6`)
              .then((res) => res.json())
              .catch((error) => {
                console.error('후기 로드 실패:', category, error);
                return { posts: [] };
              })
          )
        );

        const combinedPosts = responses
          .flatMap((data) => data.posts || [])
          .reduce((acc, post) => {
            if (!acc.find((item) => item.id === post.id)) {
              acc.push(post);
            }
            return acc;
          }, []);

        if (isMounted) {
          setReviews(combinedPosts);
        }
      } catch (error) {
        console.error('후기 로드 실패:', error);
      } finally {
        if (isMounted) {
          setIsLoadingReviews(false);
        }
      }
    };

    fetchReviews();

    return () => {
      isMounted = false;
    };
  }, []);

  // 자동 슬라이드 (5초마다)
  useEffect(() => {
    if (reviews.length > 1) {
      const interval = setInterval(() => {
        setCurrentReviewIndex((prev) => (prev + 1) % reviews.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [reviews.length]);

  return (
    <>
      <Head>
        <title>시크리트포스 GOLD 2 + MUZIIK 사파이어 | 일본 장인정신의 완벽한 조합</title>
        <meta name="description" content="실제 측정 검증된 2.2mm 초박형 페이스 + 오토플렉스 기술. 경쟁사 제품(2.7~3.3mm) 대비 최대 40% 얇은 두께로 비거리 극대화. 혼마, 마제스티 대비 50-60% 저렴한 가격으로 동일한 성능을 경험하세요." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-yellow-50 via-yellow-100 to-blue-50">
        {/* 헤더 */}
        <header className="bg-white shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 sm:py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
                <span className="text-lg sm:text-2xl font-bold text-gray-800">MASSGOO X MUZIIK</span>
              </Link>
              <a href="tel:080-028-8888" className="bg-red-600 text-white px-3 py-2 sm:px-6 sm:py-3 rounded-lg hover:bg-red-700 transition-colors font-bold text-sm sm:text-base whitespace-nowrap">
                <span className="hidden sm:inline">080-028-8888 (무료 상담)</span>
                <span className="sm:hidden">전화</span>
              </a>
            </div>
          </div>
        </header>

        {/* 제품 히어로 섹션 */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-start">
              {/* 제품 이미지 */}
              <div className="space-y-4 w-full max-w-full overflow-hidden">
                <div className="relative aspect-square w-full max-w-full">
                  <div className="relative w-full h-full rounded-2xl shadow-2xl overflow-hidden">
                    <Image 
                      src={productImages[selectedImage]} 
                      alt="GOLD 2 + 사파이어 콤보" 
                      fill
                      className="object-contain rounded-2xl"
                      onError={(e) => {
                        console.error('제품 이미지 로드 실패:', productImages[selectedImage]);
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold z-10">
                    NEW
                  </div>
                </div>
                
                {/* 썸네일 이미지들 - 모바일에서 가로 스크롤 */}
                <div className="flex space-x-4 overflow-x-auto pb-2 product-scrollbar-light w-full">
                  {productImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                        selectedImage === index ? 'border-red-600' : 'border-gray-300'
                      }`}
                    >
                      <Image 
                        src={image} 
                        alt={`제품 이미지 ${index + 1}`} 
                        width={80} 
                        height={80}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('썸네일 이미지 로드 실패:', image);
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* 제품 정보 */}
              <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                    시크리트포스 GOLD 2 + MUZIIK 사파이어
                  </h1>
                  <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-4 sm:mb-6">
                    일본 장인정신 + 혁신 기술의 완벽한 조합
                  </p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                    <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600 whitespace-nowrap">2,200,000원</span>
                    <span className="text-sm sm:text-base lg:text-lg text-gray-500 line-through whitespace-nowrap">4,500,000원</span>
                    <span className="bg-red-100 text-red-600 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap">
                      51% 할인
                    </span>
                  </div>
                </div>

                {/* 핵심 특징 - 모바일에서 1열 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-400">
                    <h3 className="font-bold text-gray-900 mb-2">2.2mm 초박형 페이스</h3>
                    <p className="text-sm text-gray-600">실제 측정 검증 (경쟁사 2.7~3.3mm)</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-900 mb-2">비거리 증가</h3>
                    <p className="text-sm text-gray-600">+15-25m 보장</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-900 mb-2">일본 제조</h3>
                    <p className="text-sm text-gray-600">드라이버 {formatBrandYears()} 제조 경력</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-900 mb-2">한정 제작</h3>
                    <p className="text-sm text-gray-600">월 15개</p>
                  </div>
                </div>

                {/* 구매 버튼 - 모바일 최적화 */}
                <div className="space-y-3 sm:space-y-4 w-full">
                  <a href="tel:080-028-8888" className="w-full bg-red-600 text-white text-base sm:text-lg lg:text-xl font-bold py-3 sm:py-4 px-4 sm:px-8 rounded-lg hover:bg-red-700 transition-colors text-center block whitespace-nowrap overflow-hidden text-ellipsis">
                    080-028-8888 무료 상담하기
                  </a>
                  <a href="https://smartstore.naver.com/mas9golf/products/12581045696" target="_blank" rel="noopener noreferrer" className="w-full bg-blue-600 text-white text-base sm:text-lg lg:text-xl font-bold py-3 sm:py-4 px-4 sm:px-8 rounded-lg hover:bg-blue-700 transition-colors text-center block whitespace-nowrap overflow-hidden text-ellipsis">
                    네이버 스마트스토어에서 구매하기
                  </a>
                  <p className="text-center text-xs sm:text-sm text-gray-500">
                    KGFA 1급 전문 피터가 직접 상담
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 혁신적인 테크놀로지 섹션 */}
        <section className="py-16 bg-gradient-to-br from-gray-900 via-black to-gray-900">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                혁신적인 테크놀로지
              </h2>
              <p className="text-lg sm:text-xl text-gray-300">
                MUZIIK 독자 기술이 실현하는, 골프 샤프트의 새로운 가능성.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
              {/* 1. 나노레벨 수지 채택 */}
              <div className="bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-700 hover:border-gray-600 transition-colors">
                <div className="relative w-full h-48 sm:h-64 mb-6 rounded-lg overflow-hidden bg-gray-700">
                  <Image
                    src="/main/technology/nano-resin-structure.webp"
                    alt="나노레벨 수지 채택"
                    fill
                    className="object-cover"
                    onError={(e) => {
                      console.error('이미지 로드 실패:', '/main/technology/nano-resin-structure.webp');
                    }}
                  />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                  나노레벨 수지 채택
                </h3>
                <p className="text-gray-300 mb-4 text-sm sm:text-base">
                  수지 함유율을 감소시키고 카본 밀도를 높여 반발성과 타감의 향상을 실현합니다.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-400 text-sm">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    수지 함유율 감소
                  </li>
                  <li className="flex items-center text-gray-400 text-sm">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    카본 밀도 향상
                  </li>
                  <li className="flex items-center text-gray-400 text-sm">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    반발성 향상
                  </li>
                </ul>
              </div>

              {/* 2. 임팩트시 역토크 방지 */}
              <div className="bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-700 hover:border-gray-600 transition-colors">
                <div className="relative w-full h-48 sm:h-64 mb-6 rounded-lg overflow-hidden bg-gray-700">
                  <Image
                    src="/main/technology/reverse-torque-prevention.webp"
                    alt="임팩트시 역토크 방지"
                    fill
                    className="object-cover"
                    onError={(e) => {
                      console.error('이미지 로드 실패:', '/main/technology/reverse-torque-prevention.webp');
                    }}
                  />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                  임팩트시 역토크 방지
                </h3>
                <p className="text-gray-300 mb-4 text-sm sm:text-base">
                  경량 샤프트 특유의 역토크를 억제하여 헤드의 직진성과 방향성을 향상시킵니다.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-400 text-sm">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    역토크 발생 감소
                  </li>
                  <li className="flex items-center text-gray-400 text-sm">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    헤드 스피드 향상
                  </li>
                  <li className="flex items-center text-gray-400 text-sm">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    방향성 안정
                  </li>
                </ul>
              </div>

              {/* 3. 티타늄 그라파이트 사용 */}
              <div className="bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-700 hover:border-gray-600 transition-colors">
                <div className="relative w-full h-48 sm:h-64 mb-6 rounded-lg overflow-hidden bg-gray-700">
                  <Image
                    src="/main/technology/titanium-graphite-structure.webp"
                    alt="티타늄 그라파이트 사용"
                    fill
                    className="object-cover"
                    onError={(e) => {
                      console.error('이미지 로드 실패:', '/main/technology/titanium-graphite-structure.webp');
                    }}
                  />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                  티타늄 그라파이트 사용
                </h3>
                <p className="text-gray-300 mb-4 text-sm sm:text-base">
                  경량이면서도 전장 제작으로 초고탄성을 실현. 휨 복원과 임팩트시 안정감을 양립합니다.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-400 text-sm">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    전장 티타늄 파이버 사용
                  </li>
                  <li className="flex items-center text-gray-400 text-sm">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    경량성 유지
                  </li>
                  <li className="flex items-center text-gray-400 text-sm">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    초고탄성 실현
                  </li>
                  <li className="flex items-center text-gray-400 text-sm">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    임팩트시 안정감
                  </li>
                </ul>
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
                <h3 className="text-xl font-bold text-gray-900 mb-2">2.2mm 초박형 페이스 기술</h3>
                <p className="text-gray-600">실제 측정 검증된 2.2mm 페이스 두께. 경쟁사 제품(2.7~3.3mm) 대비 최대 40% 얇은 두께로 비거리 극대화</p>
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
                <p className="text-gray-600">드라이버 {formatBrandYears()} 제조 경력의 수제 공정과 최고급 소재</p>
              </div>
            </div>

            {/* 상세 스펙 테이블 */}
            <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl p-4 sm:p-8 shadow-2xl border border-gray-800">
              {/* 타이틀 영역 - 스크롤 밖에 배치 */}
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8 text-center">시크리트포스 골드 2 MUZIIK</h3>
              <p className="text-center text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base">상품 스펙 안내</p>
              
              {/* 구분선 */}
              <div className="border-t border-gray-800 mb-6 sm:mb-8"></div>
              
              {/* 스크롤 가능한 영역 - 카드와 테이블만 */}
              <div className="overflow-x-auto product-scrollbar">
                <div className="grid grid-cols-[120px_1fr_1fr] sm:grid-cols-[180px_1fr_1fr] gap-2 sm:gap-4 mb-6 sm:mb-8 min-w-[600px] sm:min-w-0">
                <div></div>
                <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                  <div className="text-2xl font-black text-white mb-1">A200</div>
                  <div className="text-xs text-gray-400">ONE FLEX (초경량)</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                  <div className="text-2xl font-black text-white mb-1">A215</div>
                  <div className="text-xs text-gray-400">ONE FLEX (경량)</div>
                </div>
              </div>

                <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8 min-w-[600px] sm:min-w-0">
                  <div className="grid grid-cols-[120px_1fr_1fr] sm:grid-cols-[180px_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4 border-b border-gray-800">
                    <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">헤드 각도</div>
                    <div className="col-span-2 text-center">
                      <div className="text-white font-bold text-xl">10°</div>
                      <div className="text-gray-400 text-sm mt-1">드로우 페이스 0.5° [10.5°®]</div>
                    </div>
                  </div>
                <div className="grid grid-cols-[120px_1fr_1fr] sm:grid-cols-[180px_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4 border-b border-gray-800">
                  <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">최적 무게</div>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg">272</div>
                    <div className="text-gray-400 text-xs">gram</div>
                    <div className="text-gray-400 text-xs">268g-276g</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg">283</div>
                    <div className="text-gray-400 text-xs">gram</div>
                    <div className="text-gray-400 text-xs">279g-287g</div>
                  </div>
                </div>
                <div className="grid grid-cols-[120px_1fr_1fr] sm:grid-cols-[180px_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4 border-b border-gray-800">
                  <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">탄성 샤프트</div>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg">44</div>
                    <div className="text-gray-400 text-xs">gram</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg">53</div>
                    <div className="text-gray-400 text-xs">gram</div>
                  </div>
                </div>
                <div className="grid grid-cols-[120px_1fr_1fr] sm:grid-cols-[180px_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4 border-b border-gray-800">
                  <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">토크</div>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg">4.8</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg">4.0</div>
                  </div>
                </div>
                <div className="grid grid-cols-[120px_1fr_1fr] sm:grid-cols-[180px_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4 border-b border-gray-800">
                  <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">탄성 그립</div>
                  <div className="col-span-2 text-center">
                    <div className="text-white font-bold text-xl">35</div>
                    <div className="text-gray-400 text-xs">gram</div>
                    <div className="text-gray-400 text-sm mt-1">600 스탠다드 [장갑 23호 ±1 적합]</div>
                  </div>
                </div>
                <div className="grid grid-cols-[120px_1fr_1fr] sm:grid-cols-[180px_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4 border-b border-gray-800">
                  <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">고반발 헤드</div>
                  <div className="col-span-2 text-center">
                    <div className="text-white font-bold text-xl">188</div>
                    <div className="text-gray-400 text-xs">gram</div>
                  </div>
                </div>
                <div className="grid grid-cols-[120px_1fr_1fr] sm:grid-cols-[180px_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4 border-b border-gray-800">
                  <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">헤드 라이각</div>
                  <div className="col-span-2 text-center">
                    <div className="text-white font-bold text-xl">59°</div>
                    <div className="text-gray-400 text-sm mt-1">표준 [키 165cm-175cm 적합]</div>
                  </div>
                </div>
                <div className="grid grid-cols-[120px_1fr_1fr] sm:grid-cols-[180px_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4 border-b border-gray-800">
                  <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">킥 포인트</div>
                  <div className="col-span-2 text-center">
                    <div className="text-white font-bold text-xl">Double Kick</div>
                    <div className="text-gray-400 text-sm mt-1">더블 킥</div>
                  </div>
                </div>
                <div className="grid grid-cols-[120px_1fr_1fr] sm:grid-cols-[180px_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4 border-b border-gray-800">
                  <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">최적의 길이 & 헤드 부피</div>
                  <div className="col-span-2">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center">
                        <div className="text-gray-400 text-sm mb-2">최적의 길이</div>
                        <div className="text-white font-bold text-2xl">45.75&quot;</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400 text-sm mb-2">헤드 부피</div>
                        <div className="text-white font-bold text-2xl">460 cc</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-[120px_1fr_1fr] sm:grid-cols-[180px_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4 border-b border-gray-800">
                  <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">가변형 밸런스</div>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg">C8</div>
                    <div className="text-gray-400 text-xs">C7-C9</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg">C9</div>
                    <div className="text-gray-400 text-xs">C8-D0</div>
                  </div>
                </div>
                <div className="grid grid-cols-[120px_1fr_1fr] sm:grid-cols-[180px_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4 border-b border-gray-800">
                  <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">샤프트 진동수</div>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg">200</div>
                    <div className="text-gray-400 text-xs">cpm</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg">215</div>
                    <div className="text-gray-400 text-xs">cpm</div>
                  </div>
                </div>
                <div className="grid grid-cols-[120px_1fr_1fr] sm:grid-cols-[180px_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4">
                  <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">맞춤 볼스피드</div>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg">54</div>
                    <div className="text-gray-400 text-xs">m/s</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg">58</div>
                    <div className="text-gray-400 text-xs">m/s</div>
                  </div>
                </div>
              </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-800">
                <h4 className="text-xl font-bold text-white mb-6 text-center">DOGATTI GENERATION SAPPHIRE</h4>
                <div className="overflow-x-auto product-scrollbar">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-4 px-4 font-bold text-gray-300">Model</th>
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
                        <td className="py-4 px-4 font-semibold text-white">A200(ONE FLEX 40)</td>
                        <td className="text-center py-4 px-4 text-gray-300">1130</td>
                        <td className="text-center py-4 px-4 text-gray-300">44</td>
                        <td className="text-center py-4 px-4 text-gray-300">8.55</td>
                        <td className="text-center py-4 px-4 text-gray-300">15.05</td>
                        <td className="text-center py-4 px-4 text-gray-300">4.8</td>
                        <td className="text-center py-4 px-4 text-white font-bold">200</td>
                        <td className="text-center py-4 px-4 text-gray-300">더블킥</td>
                      </tr>
                      <tr>
                        <td className="py-4 px-4 font-semibold text-white">A215(ONE FLEX 50)</td>
                        <td className="text-center py-4 px-4 text-gray-300">1130</td>
                        <td className="text-center py-4 px-4 text-gray-300">53</td>
                        <td className="text-center py-4 px-4 text-gray-300">8.55</td>
                        <td className="text-center py-4 px-4 text-gray-300">15.4</td>
                        <td className="text-center py-4 px-4 text-gray-300">4.0</td>
                        <td className="text-center py-4 px-4 text-white font-bold">215</td>
                        <td className="text-center py-4 px-4 text-gray-300">더블킥</td>
                      </tr>
                    </tbody>
                  </table>
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
              <p className="text-lg text-gray-600">비거리 회복을 원하는 골퍼가 인정하는 성능</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="overflow-x-auto product-scrollbar-light">
                <table className="w-full min-w-[600px] sm:min-w-0">
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
              <p className="text-lg text-gray-600">비거리 회복을 원하는 골퍼가 인정하는 성능</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="group relative bg-gradient-to-br from-yellow-50 to-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border border-yellow-200 hover:border-yellow-400">
                <div className="relative min-h-80 md:h-96 overflow-hidden">
                  <div className="absolute inset-0">
                    <Image 
                      src="/main/testimonials/hero-faces/review-face-01.jpg"
                      alt="비거리 회복 추구 후기"
                      fill
                      className="object-contain md:object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/50 to-transparent"></div>
                  </div>
                  <div className="absolute top-4 left-4 z-10">
                    <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg">시크리트포스 골드 2 MUZIIK</span>
                  </div>
                  <div className="absolute bottom-4 right-4 z-10 text-right">
                    <div className="text-3xl font-black text-yellow-600 mb-1">+25m</div>
                    <div className="text-xs text-gray-600 font-semibold">비거리 증가</div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">비거리 회복 추구</h3>
                  <p className="text-sm text-gray-500 mb-4">62세, 비거리 회복 추구</p>
                  <p className="text-gray-700 text-sm leading-relaxed italic">
                    &quot;오토플렉스 사파이어 샤프트와 결합한 골드 2를 처음 사용했을 때 놀랐습니다. 첫 시타부터 체감되는 비거리 증가가 있었고, 이제 젊은 후배들과 비거리 차이가 거의 없습니다.&quot;
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="text-center bg-yellow-50 rounded-2xl p-6 border border-yellow-200">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">+15m ~ +25m</div>
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

        {/* 고객 후기 슬라이드 섹션 */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">실제 고객 후기</h2>
              <p className="text-lg text-gray-600">마쓰구 드라이버를 경험한 고객들의 생생한 후기</p>
            </div>

            {isLoadingReviews ? (
              <div className="text-center py-12">
                <p className="text-gray-500">후기를 불러오는 중...</p>
              </div>
            ) : reviews.length > 0 ? (
              <div className="relative">
                {/* 후기 카드 */}
                <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 overflow-hidden">
                  <div className="relative min-h-[200px]">
                    {reviews.map((review, index) => (
                      <div
                        key={review.id}
                        className={`absolute inset-0 transition-opacity duration-500 ${
                          index === currentReviewIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                          {/* 후기 이미지 */}
                          {review.featured_image && (
                            <div className="flex-shrink-0 w-full aspect-[4/3] sm:w-32 sm:aspect-square rounded-lg overflow-hidden bg-gray-200">
                              <Image
                                src={review.featured_image}
                                alt={review.title}
                                width={128}
                                height={128}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          {/* 후기 내용 */}
                          <div className="flex-1">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                              {review.title}
                            </h3>
                            <p className="text-sm sm:text-base text-gray-600 mb-3 line-clamp-3">
                              {review.excerpt || review.content?.substring(0, 150) + '...'}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {new Date(review.published_at).toLocaleDateString('ko-KR')}
                              </span>
                              <a
                                href={`/blog/${review.slug}`}
                                className="text-sm text-red-600 hover:text-red-700 font-semibold"
                              >
                                자세히 보기 →
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 슬라이드 네비게이션 */}
                {reviews.length > 1 && (
                  <>
                    {/* 이전 버튼 */}
                    <button
                      onClick={() =>
                        setCurrentReviewIndex((prev) => (prev === 0 ? reviews.length - 1 : prev - 1))
                      }
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-12 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
                      aria-label="이전 후기"
                    >
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    {/* 다음 버튼 */}
                    <button
                      onClick={() => setCurrentReviewIndex((prev) => (prev + 1) % reviews.length)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-12 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
                      aria-label="다음 후기"
                    >
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* 인디케이터 */}
                    <div className="flex justify-center gap-2 mt-6">
                      {reviews.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentReviewIndex(index)}
                          className={`h-2 rounded-full transition-all ${
                            index === currentReviewIndex ? 'w-8 bg-red-600' : 'w-2 bg-gray-300 hover:bg-gray-400'
                          }`}
                          aria-label={`후기 ${index + 1}로 이동`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl">
                <p className="text-gray-500">후기가 아직 없습니다.</p>
              </div>
            )}
          </div>
        </section>

        {/* 한정성 섹션 */}
        <section className="py-16 bg-red-50">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">월 15개 한정 제작</h2>
              <p className="text-lg text-gray-600 mb-8">일본 장인정신의 수제 제작으로 인한 희소성</p>
              
              <div className="grid md:grid-cols-3 gap-8 mb-8">
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">혼마 수준의 수제 제작</h3>
                  <p className="text-gray-600">드라이버 {formatBrandYears()} 제조 경력의 수제 공정</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">마제스티 수준의 품질 관리</h3>
                  <p className="text-gray-600">엄격한 품질 관리 시스템</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">젝시오 수준의 신뢰성</h3>
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
              <div className="flex items-center justify-center mb-6">
                <span className="text-2xl font-bold">MASSGOO X MUZIIK</span>
              </div>
              <p className="text-gray-400 mb-4">© 2025 MASSGOO X MUZIIK. All rights reserved.</p>
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

