import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useProductData } from '../../lib/use-product-data';
import { getProductImageUrl } from '../../lib/product-image-url';

const REVIEW_CATEGORIES = ['고객 후기', '리얼 체험, 비거리 성공 후기'];

// 기본 이미지 (fallback) - 관리자 제품 수정과 동일한 originals 경로
const defaultImages = [
  'originals/products/secret-force-pro-3-muziik/detail/massgoo-secret-force-pro-3-muziik-20260126-01.webp',
  'originals/products/secret-force-pro-3-muziik/detail/massgoo_pro3_beryl_230.webp',
  'originals/products/secret-force-pro-3-muziik/detail/massgoo_pro3_beryl_240.webp',
  'originals/products/secret-force-pro-3-muziik/detail/massgoo_pro3_beryl_250.webp',
  'originals/products/secret-force-pro-3-muziik/detail/massgoo_pro3_sapphire_200.webp',
  'originals/products/secret-force-pro-3-muziik/detail/massgoo_pro3_sapphire_215.webp',
  'originals/products/secret-force-pro-3-muziik/detail/secret-force-pro-3-muziik-03.webp',
];

export default function Pro3MuziikProduct() {
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);

  // 제품 데이터 로드 (hero, hook, detail_content 포함 - 시크리트웨폰 블랙과 동일 구조)
  const {
    productImages,
    heroImages,
    hookContent,
    detailContent,
    galleryImages,
    performanceImages,
    isLoadingProduct,
  } = useProductData('secret-force-pro-3-muziik', defaultImages);

  // DB 이미지 없을 때 fallback (getProductImageUrl로 Supabase URL 생성)
  const resolvedProductImages = productImages.length > 0 ? productImages : defaultImages.map((p) => getProductImageUrl(p));
  const displayImages = heroImages.length > 0 ? heroImages : resolvedProductImages;

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
        <title>시크리트포스 PRO3 MUZIIK | 업그레이드된 비거리 드라이버</title>
        <meta name="description" content="MUZIIK 협업 제품. 더 강하고 더 가벼운 티타늄 샤프트를 사용하는 업그레이드된 비거리 드라이버. 1,700,000원." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-green-50">
        {/* 헤더 - 시크리트웨폰 블랙과 동일 (다크) */}
        <header className="bg-black shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 sm:py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
                <span className="text-lg sm:text-2xl font-bold text-white">MASSGOO X MUZIIK</span>
              </Link>
              <a href="tel:080-028-8888" className="bg-red-600 text-white px-3 py-2 sm:px-6 sm:py-3 rounded-lg hover:bg-red-700 transition-colors font-bold text-sm sm:text-base whitespace-nowrap">
                <span className="hidden sm:inline">080-028-8888 (무료 상담)</span>
                <span className="sm:hidden">전화</span>
              </a>
            </div>
          </div>
        </header>

        {/* 2컷 후킹 이미지 섹션 - DB hook_content 있으면 표시 */}
        {hookContent.length > 0 && (
          <section className="py-12 sm:py-16 bg-black">
            <div className="container mx-auto px-4 max-w-7xl">
              {hookContent.map((item, index) => (
                <div
                  key={index}
                  className={`flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-8 items-center ${index < hookContent.length - 1 ? 'mb-12 md:mb-16' : ''}`}
                >
                  <div className={`relative w-full rounded-lg overflow-hidden ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                    <div className="relative w-full h-[400px] sm:h-[450px] md:h-[500px]">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover md:object-contain"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority={index < 2}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                  <div className={`text-center md:text-left w-full ${index % 2 === 1 ? 'md:order-1' : ''}`}>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4 leading-tight">{item.title}</h2>
                    <p className="text-base sm:text-lg text-gray-300 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 첫 번째 CTA 버튼 섹션 */}
        <section className="py-12 sm:py-16 bg-gradient-to-br from-gray-900 via-black to-gray-900">
          <div className="container mx-auto px-4 max-w-7xl text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              프리미엄 마쓰구 드라이버
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8">
              지금 상담 받고 특별 혜택을 경험하세요!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <a href="tel:080-028-8888" className="bg-red-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg hover:bg-red-700 transition-colors font-bold text-base sm:text-lg">
                080-028-8888 무료 상담하기
              </a>
              <a href="https://smartstore.naver.com/mas9golf/products/13022193504" target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg hover:bg-blue-700 transition-colors font-bold text-base sm:text-lg">
                네이버 스마트스토어에서 구매하기
              </a>
            </div>
          </div>
        </section>

        {/* 제품 히어로 섹션 */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-start">
              {/* 제품 이미지 */}
              <div className="space-y-4 w-full max-w-full overflow-hidden">
                {isLoadingProduct ? (
                  <div className="relative aspect-square w-full bg-gray-200 rounded-2xl flex items-center justify-center">
                    <p className="text-gray-500">이미지 로딩 중...</p>
                  </div>
                ) : displayImages.length > 0 ? (
                  <>
                    <div className="relative aspect-square w-full max-w-full">
                      <div className="relative w-full h-full rounded-2xl shadow-2xl overflow-hidden">
                        <Image
                          src={displayImages[selectedImage]}
                          alt="시크리트포스 PRO3 MUZIIK"
                          fill
                          className="object-contain rounded-2xl"
                          unoptimized
                          onError={(e) => {
                            console.error('제품 이미지 로드 실패:', displayImages[selectedImage]);
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold z-10">
                        NEW
                      </div>
                    </div>

                    {/* 썸네일 이미지들 */}
                    <div className="flex space-x-4 overflow-x-auto pb-2 product-scrollbar-light w-full">
                      {displayImages.map((image, index) => (
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
                            unoptimized
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="relative aspect-square w-full bg-gray-200 rounded-2xl flex items-center justify-center">
                    <p className="text-gray-500">이미지를 불러올 수 없습니다.</p>
                  </div>
                )}
              </div>

              {/* 제품 정보 */}
              <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold">MUZIIK 협업</span>
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">NEW</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                    시크리트포스 PRO3 MUZIIK
                  </h1>
                  <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-4 sm:mb-6">
                    업그레이드된 비거리 드라이버
                  </p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                    <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600 whitespace-nowrap">1,700,000원</span>
                  </div>
                </div>

                {/* 핵심 특징 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-black text-white p-4 rounded-lg">
                    <h3 className="font-bold mb-2">MUZIIK 샤프트</h3>
                    <p className="text-sm text-gray-300">사파이어, 베릴 샤프트 추가</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h3 className="font-bold text-gray-900 mb-2">더 강하고 가벼운</h3>
                    <p className="text-sm text-gray-600">티타늄 샤프트 기술</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-900 mb-2">40g대 X/S 대응</h3>
                    <p className="text-sm text-gray-600">30g대 R 대응 기술력</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-900 mb-2">업그레이드</h3>
                    <p className="text-sm text-gray-600">PRO3의 한계를 넘어서</p>
                  </div>
                </div>

                {/* 구매 버튼 */}
                <div className="space-y-3 sm:space-y-4 w-full">
                  <a href="tel:080-028-8888" className="w-full bg-red-600 text-white text-base sm:text-lg lg:text-xl font-bold py-3 sm:py-4 px-4 sm:px-8 rounded-lg hover:bg-red-700 transition-colors text-center block whitespace-nowrap overflow-hidden text-ellipsis">
                    080-028-8888 무료 상담하기
                  </a>
                  <a href="https://smartstore.naver.com/mas9golf/products/13022193504" target="_blank" rel="noopener noreferrer" className="w-full bg-blue-600 text-white text-base sm:text-lg lg:text-xl font-bold py-3 sm:py-4 px-4 sm:px-8 rounded-lg hover:bg-blue-700 transition-colors text-center block whitespace-nowrap overflow-hidden text-ellipsis">
                    네이버 스마트스토어에서 구매하기
                  </a>
                  <p className="text-center text-xs sm:text-sm text-gray-500">
                    장비 전문가가 직접 상담
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8컷 상세 이미지 섹션 - DB detail_content 있으면 표시 */}
        {detailContent.length > 0 && (
          <section className="py-12 sm:py-16 bg-black">
            <div className="container mx-auto px-4 max-w-7xl">
              <div className="space-y-12 md:space-y-16">
                {detailContent.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-8 items-center"
                  >
                    <div className={`relative w-full rounded-lg overflow-hidden ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                      <div className="relative w-full h-[350px] sm:h-[380px] md:h-[400px]">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover md:object-contain"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          priority={index < 2}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                    <div className={`text-center md:text-left w-full ${index % 2 === 1 ? 'md:order-1' : ''}`}>
                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 leading-tight">{item.title}</h3>
                      <p className="text-sm sm:text-base text-gray-300 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 제품 상세 정보 섹션 */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                업그레이드된 제품 특징
              </h2>
              <p className="text-lg sm:text-xl text-gray-600">
                시크리트포스 PRO3 MUZIIK의 핵심 특징
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
              <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 shadow-lg">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  MUZIIK 샤프트
                </h3>
                <p className="text-gray-600 mb-4 text-sm sm:text-base">
                  사파이어, 베릴 샤프트를 추가하여 더 강하고 가벼운 성능을 실현합니다.
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 shadow-lg">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  40g대 X/S 대응
                </h3>
                <p className="text-gray-600 mb-4 text-sm sm:text-base">
                  30g대 R 대응 기술력을 자랑하는 가벼우면서도 강한 샤프트입니다.
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 shadow-lg">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  업그레이드된 성능
                </h3>
                <p className="text-gray-600 mb-4 text-sm sm:text-base">
                  시크리트포스 PRO3의 한계를 넘어서 더 강하고 더 가벼운 티타늄 샤프트를 사용합니다.
                </p>
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
              <h2 className="text-3xl font-bold text-gray-900 mb-4">프리미엄 디자인의 완벽한 조합</h2>
              <p className="text-lg text-gray-600">나노레벨 카본 기술의 최고급 성능</p>
            </div>

            <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl p-4 sm:p-8 shadow-2xl border border-gray-800">
              {/* 타이틀 영역 */}
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8 text-center">시크리트포스 PRO3 MUZIIK</h3>
              <p className="text-center text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base">상품 스펙 안내</p>
              
              {/* 구분선 */}
              <div className="border-t border-gray-800 mb-6 sm:mb-8"></div>
              
              {/* 스크롤 가능한 영역 */}
              <div className="overflow-x-auto product-scrollbar">
                <div className="grid grid-cols-[120px_1fr_1fr_1fr] sm:grid-cols-[180px_1fr_1fr_1fr] gap-2 sm:gap-4 mb-6 sm:mb-8 min-w-[700px] sm:min-w-0">
                  <div></div>
                  <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                    <div className="text-2xl font-black text-white mb-1">230</div>
                    <div className="text-xs text-gray-400">부드러움</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                    <div className="text-2xl font-black text-white mb-1">240</div>
                    <div className="text-xs text-gray-400">표준</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                    <div className="text-2xl font-black text-white mb-1">250</div>
                    <div className="text-xs text-gray-400">강함</div>
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8 min-w-[700px] sm:min-w-0">
                  <div className="grid grid-cols-[120px_1fr_1fr_1fr] sm:grid-cols-[180px_1fr_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4 border-b border-gray-800">
                    <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">헤드 각도</div>
                    <div className="col-span-3 text-center">
                      <div className="text-white font-bold text-xl">9° 10°</div>
                      <div className="text-gray-400 text-sm mt-1">스트레이트 페이스 [실제 각도]</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr_1fr_1fr] sm:grid-cols-[180px_1fr_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4 border-b border-gray-800">
                    <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">최적 무게</div>
                    <div className="text-center">
                      <div className="text-white font-bold text-lg">280</div>
                      <div className="text-gray-400 text-xs">276g~284g</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-bold text-lg">287</div>
                      <div className="text-gray-400 text-xs">283g~290g</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-bold text-lg">290</div>
                      <div className="text-gray-400 text-xs">286g~294g</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr_1fr_1fr] sm:grid-cols-[180px_1fr_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4 border-b border-gray-800">
                    <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">탄성 샤프트</div>
                    <div className="text-center">
                      <div className="text-white font-bold text-lg">42</div>
                      <div className="text-gray-400 text-xs">gram</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-bold text-lg">47</div>
                      <div className="text-gray-400 text-xs">gram</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-bold text-lg">49</div>
                      <div className="text-gray-400 text-xs">gram</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr_1fr_1fr] sm:grid-cols-[180px_1fr_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4 border-b border-gray-800">
                    <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">토크</div>
                    <div className="text-center">
                      <div className="text-white font-bold text-lg">4.8</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-bold text-lg">3.8</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-bold text-lg">3.8</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr_1fr_1fr] sm:grid-cols-[180px_1fr_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4 border-b border-gray-800">
                    <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">탄성 그립</div>
                    <div className="col-span-3 text-center">
                      <div className="text-white font-bold text-xl">45</div>
                      <div className="text-gray-400 text-xs">gram</div>
                      <div className="text-gray-400 text-sm mt-1">600 스탠다드 [장갑 23호 ±1 적합]</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr_1fr_1fr] sm:grid-cols-[180px_1fr_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4 border-b border-gray-800">
                    <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">고반발 헤드</div>
                    <div className="col-span-3 text-center">
                      <div className="text-white font-bold text-xl">193</div>
                      <div className="text-gray-400 text-xs">±4g</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr_1fr_1fr] sm:grid-cols-[180px_1fr_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4 border-b border-gray-800">
                    <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">헤드 라이각</div>
                    <div className="col-span-3 text-center">
                      <div className="text-white font-bold text-xl">59°</div>
                      <div className="text-gray-400 text-sm mt-1">표준 [키 165cm-175cm 적합]</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr_1fr_1fr] sm:grid-cols-[180px_1fr_1fr_1fr] gap-2 sm:gap-4 py-3 sm:py-4 border-b border-gray-800">
                    <div className="text-gray-300 font-semibold text-xs sm:text-sm whitespace-nowrap">킥 포인트</div>
                    <div className="col-span-3 text-center">
                      <div className="text-white font-bold text-xl">Mid Low</div>
                      <div className="text-gray-400 text-sm mt-1">중하단</div>
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
                    <div className="col-span-3 text-center">
                      <div className="text-white font-bold text-xl">D2</div>
                    </div>
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
              </div>

              <div className="mt-8 pt-8 border-t border-gray-800">
                <h4 className="text-xl font-bold text-white mb-6 text-center">DOGATTI GENERATION BERYL</h4>
                <div className="overflow-x-auto product-scrollbar">
                  <table className="w-full min-w-[700px] sm:min-w-0">
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
                        <td className="py-4 px-4 font-semibold text-white">230(부드러움) R2</td>
                        <td className="text-center py-4 px-4 text-gray-300">1136</td>
                        <td className="text-center py-4 px-4 text-gray-300">43</td>
                        <td className="text-center py-4 px-4 text-gray-300">8.55</td>
                        <td className="text-center py-4 px-4 text-gray-300">14.95</td>
                        <td className="text-center py-4 px-4 text-gray-300">4.8</td>
                        <td className="text-center py-4 px-4 text-white font-bold">230</td>
                        <td className="text-center py-4 px-4 text-gray-300">先中調子</td>
                      </tr>
                      <tr className="border-b border-gray-800">
                        <td className="py-4 px-4 font-semibold text-white">240(표준) R</td>
                        <td className="text-center py-4 px-4 text-gray-300">1136</td>
                        <td className="text-center py-4 px-4 text-gray-300">47</td>
                        <td className="text-center py-4 px-4 text-gray-300">8.55</td>
                        <td className="text-center py-4 px-4 text-gray-300">15.1</td>
                        <td className="text-center py-4 px-4 text-gray-300">3.8</td>
                        <td className="text-center py-4 px-4 text-white font-bold">240</td>
                        <td className="text-center py-4 px-4 text-gray-300">先中調子</td>
                      </tr>
                      <tr>
                        <td className="py-4 px-4 font-semibold text-white">250(강함) SR</td>
                        <td className="text-center py-4 px-4 text-gray-300">1136</td>
                        <td className="text-center py-4 px-4 text-gray-300">49</td>
                        <td className="text-center py-4 px-4 text-gray-300">8.55</td>
                        <td className="text-center py-4 px-4 text-gray-300">15.15</td>
                        <td className="text-center py-4 px-4 text-gray-300">3.8</td>
                        <td className="text-center py-4 px-4 text-white font-bold">250</td>
                        <td className="text-center py-4 px-4 text-gray-300">先中調子</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-sm text-gray-500 mt-4 text-center">※ BERYL 50 (SR: 55g) 中調子</p>
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

        {/* 다른 브랜드와의 비교 섹션 */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">다른 브랜드와의 비교</h2>
              <p className="text-lg text-gray-600">업그레이드된 비거리 드라이버의 차별화된 성능</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="overflow-x-auto product-scrollbar-light">
                <table className="w-full min-w-[600px] sm:min-w-0">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-4 px-4 font-bold">구분</th>
                      <th className="text-center py-4 px-4 font-bold">경쟁사 제품</th>
                      <th className="text-center py-4 px-4 font-bold">시크리트포스 PRO 3</th>
                      <th className="text-center py-4 px-4 font-bold text-red-600">시크리트포스 PRO 3 MUZIIK</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-4 px-4 font-semibold">가격</td>
                      <td className="text-center py-4 px-4">1,500,000원~</td>
                      <td className="text-center py-4 px-4">1,150,000원</td>
                      <td className="text-center py-4 px-4 text-red-600 font-bold">1,700,000원</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-4 px-4 font-semibold">샤프트</td>
                      <td className="text-center py-4 px-4">카본 샤프트</td>
                      <td className="text-center py-4 px-4">NGS 카본 샤프트</td>
                      <td className="text-center py-4 px-4 text-red-600 font-bold">MUZIIK 티타늄 샤프트</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-4 px-4 font-semibold">성능</td>
                      <td className="text-center py-4 px-4">우수</td>
                      <td className="text-center py-4 px-4">우수</td>
                      <td className="text-center py-4 px-4 text-red-600 font-bold">탁월</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-4 px-4 font-semibold">비거리</td>
                      <td className="text-center py-4 px-4">표준</td>
                      <td className="text-center py-4 px-4">+10m</td>
                      <td className="text-center py-4 px-4 text-red-600 font-bold">+15m~+25m</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-4 font-semibold">가성비</td>
                      <td className="text-center py-4 px-4">보통</td>
                      <td className="text-center py-4 px-4">탁월</td>
                      <td className="text-center py-4 px-4 text-red-600 font-bold">매우 탁월</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* 실제 성능 데이터 섹션 */}
        <section id="performance-data" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">실제 성능 데이터</h2>
              <p className="text-lg text-gray-600">실제 사용자가 인정하는 성능</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-8">
              {/* 대표 이미지 카드 (첫 번째 이미지 또는 기본 이미지) */}
              <div className="group relative bg-gradient-to-br from-gray-50 to-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-200 hover:border-red-400">
                <div className="relative min-h-80 md:h-96 overflow-hidden">
                  <div className="absolute inset-0">
                    <Image 
                      src={performanceImages.length > 0 ? performanceImages[0] : '/main/testimonials/hero-faces/review-face-05.webp'}
                      alt="비거리 회복 후기"
                      fill
                      className="object-contain md:object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/main/testimonials/hero-faces/review-face-05.webp';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/50 to-transparent"></div>
                  </div>
                  <div className="absolute top-4 left-4 z-10">
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">시크리트포스 PRO3 MUZIIK</span>
                  </div>
                  <div className="absolute bottom-4 right-4 z-10 text-right">
                    <div className="text-3xl font-black text-red-600 mb-1">+22m</div>
                    <div className="text-xs text-gray-600 font-semibold">비거리 증가</div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">비거리 향상의 선택</h3>
                  <p className="text-sm text-gray-500 mb-4">58세, 비거리 향상</p>
                  <p className="text-gray-700 text-sm leading-relaxed italic">
                    &quot;PRO3에 MUZIIK 샤프트를 추가한 버전을 사용하면서 정말 놀랐습니다. 기존 PRO3보다 확실히 비거리가 늘었고, 무엇보다 샤프트의 반응이 훨씬 좋습니다.&quot;
                  </p>
                </div>
              </div>
              {/* 통계 박스들 */}
              <div className="space-y-4">
                <div className="text-center bg-red-50 rounded-2xl p-6 border border-red-200">
                  <div className="text-3xl font-bold text-red-600 mb-2">+15m ~ +25m</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">비거리 증가</h3>
                  <p className="text-sm text-gray-600">실제 측정 데이터 기반</p>
                </div>
                <div className="text-center bg-blue-50 rounded-2xl p-6 border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600 mb-2">+15% ~ +20%</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">정확도 향상</h3>
                  <p className="text-sm text-gray-600">프로 골퍼 테스트 결과</p>
                </div>
                <div className="text-center bg-purple-50 rounded-2xl p-6 border border-purple-200">
                  <div className="text-3xl font-bold text-purple-600 mb-2">95%</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">만족도</h3>
                  <p className="text-sm text-gray-600">실제 사용자 조사</p>
                </div>
              </div>
            </div>

            {/* 갤러리 이미지 그리드 (2개 이상일 때만 표시) */}
            {performanceImages.length > 1 && (
              <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {performanceImages.slice(1, 7).map((image, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden shadow-lg group cursor-pointer hover:shadow-xl transition-shadow">
                      <Image
                        src={image}
                        alt={`성능 데이터 이미지 ${index + 2}`}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
                {performanceImages.length > 7 && (
                  <div className="text-center mt-4">
                    <p className="text-sm text-gray-500">
                      총 {performanceImages.length}개의 성능 데이터 이미지
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* 제품 착용 이미지 섹션 */}
        {galleryImages.length > 0 && (
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4 max-w-7xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">제품 착용 이미지</h2>
                <p className="text-lg text-gray-600">실제 사용 모습을 확인하세요</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {galleryImages.map((image, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden shadow-lg">
                    <Image
                      src={image}
                      alt={`제품 착용 이미지 ${index + 1}`}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        console.error('착용 이미지 로드 실패:', image);
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 실제 고객 후기 섹션 */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">실제 고객 후기</h2>
              <p className="text-lg text-gray-600">시크리트포스 PRO3 MUZIIK를 경험한 고객들의 생생한 후기</p>
            </div>

            {isLoadingReviews ? (
              <div className="text-center py-12">
                <p className="text-gray-500">후기를 불러오는 중...</p>
              </div>
            ) : reviews.length > 0 ? (
              <div className="relative">
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

                {reviews.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="이전 후기"
                      onClick={() =>
                        setCurrentReviewIndex((prev) =>
                          prev === 0 ? reviews.length - 1 : prev - 1
                        )
                      }
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white shadow-lg rounded-full p-2 hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-lg font-bold text-gray-600">{'<'}</span>
                    </button>
                    <button
                      type="button"
                      aria-label="다음 후기"
                      onClick={() =>
                        setCurrentReviewIndex((prev) => (prev + 1) % reviews.length)
                      }
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-white shadow-lg rounded-full p-2 hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-lg font-bold text-gray-600">{'>'}</span>
                    </button>
                  </>
                )}

                {reviews.length > 1 && (
                  <div className="flex justify-center mt-6 space-x-2">
                    {reviews.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        aria-label={`후기 ${index + 1} 보기`}
                        onClick={() => setCurrentReviewIndex(index)}
                        className={`w-2.5 h-2.5 rounded-full ${
                          index === currentReviewIndex ? 'bg-red-600' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">표시할 후기가 없습니다.</p>
              </div>
            )}
          </div>
        </section>

        {/* 리미티드 에디션 섹션 */}
        <section className="py-16 bg-red-50">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">리미티드 에디션</h2>
              <p className="text-lg text-gray-600 mb-8">MUZIIK 협업으로 탄생한 특별한 제품</p>
              
              <div className="grid md:grid-cols-3 gap-8 mb-8">
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">MUZIIK 협업</h3>
                  <p className="text-gray-600">일본 프리미엄 샤프트 기술</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">업그레이드된 성능</h3>
                  <p className="text-gray-600">PRO3의 한계를 넘어서</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">특별한 가격</h3>
                  <p className="text-gray-600">1,700,000원</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA 섹션 */}
        <section className="py-16 bg-gradient-to-br from-red-600 to-red-700">
          <div className="container mx-auto px-4 max-w-7xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              080-028-8888 지금 바로 상담하기
            </h2>
            <p className="text-lg sm:text-xl text-red-100 mb-8">
              KGFA 1급 전문 피터가 직접 상담해드립니다
            </p>
            <a
              href="tel:080-028-8888"
              className="inline-block bg-white text-red-600 text-lg sm:text-xl font-bold py-4 px-8 rounded-lg hover:bg-gray-100 transition-colors"
            >
              080-028-8888 무료 상담하기
            </a>
          </div>
        </section>

        {/* 푸터 */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <span className="text-2xl font-bold">MASSGOO X MUZIIK</span>
              </div>
              <p className="text-gray-400 mb-4">© 2026 MASSGOO X MUZIIK. All rights reserved.</p>
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

