import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const REVIEW_CATEGORIES = ['고객 후기', '리얼 체험, 비거리 성공 후기'];

export default function Pro3MuziikProduct() {
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);

  // 기존 PRO3 이미지 + MUZIIK 샤프트 이미지
  const productImages = [
    '/main/products/pro3/secret-force-pro-3-gallery-00.webp',
    '/main/products/pro3/secret-force-pro-3-gallery-01.webp',
    '/main/products/pro3/secret-force-pro-3-gallery-02.webp',
    '/main/products/pro3/secret-force-pro-3-gallery-03.webp',
    '/main/products/pro3/secret-force-pro-3-gallery-04.webp',
    '/main/products/pro3/secret-force-pro-3-gallery-05.webp',
    '/main/products/pro3/secret-force-pro-3-gallery-06.webp',
    '/main/products/pro3/secret-force-pro-3-gallery-07.webp',
    '/main/products/pro3/secret-force-pro-3-gallery-08.webp',
    // MUZIIK 샤프트 이미지 (추가 필요)
    '/main/products/pro3-muziik/shaft-sapphire.webp',
    '/main/products/pro3-muziik/shaft-beryl.webp',
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
        <title>시크리트포스 PRO3 MUZIIK | 업그레이드된 고반발 드라이버</title>
        <meta name="description" content="MUZIIK 협업 제품. 더 강하고 더 가벼운 티타늄 샤프트를 사용하는 업그레이드된 고반발 드라이버. 1,700,000원." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        {/* 헤더 */}
        <header className="bg-white shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 sm:py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
                <span className="text-lg sm:text-2xl font-bold text-gray-800">MASSGOO</span>
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
                      alt="시크리트포스 PRO3 MUZIIK" 
                      fill
                      className="object-contain rounded-2xl"
                      onError={(e) => {
                        console.error('제품 이미지 로드 실패:', productImages[selectedImage]);
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
                
                {/* 썸네일 이미지들 */}
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
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold">MUZIIK 협업</span>
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">NEW</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                    시크리트포스 PRO3 MUZIIK
                  </h1>
                  <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-4 sm:mb-6">
                    업그레이드된 고반발 드라이버
                  </p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                    <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600 whitespace-nowrap">1,700,000원</span>
                    <span className="text-sm text-gray-500 line-through">1,150,000원</span>
                  </div>
                </div>

                {/* 핵심 특징 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-300">
                    <h3 className="font-bold text-gray-900 mb-2">MUZIIK 샤프트</h3>
                    <p className="text-sm text-gray-600">사파이어, 베릴 샤프트 추가</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-900 mb-2">더 강하고 가벼운</h3>
                    <p className="text-sm text-gray-600">티타늄 샤프트 기술</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-900 mb-2">40g대 X 대응</h3>
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
                  <a href="https://smartstore.naver.com/mas9golf" target="_blank" rel="noopener noreferrer" className="w-full bg-blue-600 text-white text-base sm:text-lg lg:text-xl font-bold py-3 sm:py-4 px-4 sm:px-8 rounded-lg hover:bg-blue-700 transition-colors text-center block whitespace-nowrap overflow-hidden text-ellipsis">
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
                  40g대 X 대응
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

        {/* 고객 후기 섹션 */}
        {reviews.length > 0 && (
          <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
            <div className="container mx-auto px-4 max-w-7xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  고객 후기
                </h2>
                <p className="text-lg sm:text-xl text-gray-600">
                  실제 사용자들의 솔직한 후기
                </p>
              </div>

              <div className="relative">
                <div className="overflow-hidden rounded-2xl bg-white shadow-xl p-6 sm:p-8">
                  {isLoadingReviews ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">후기를 불러오는 중...</p>
                    </div>
                  ) : reviews.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                        {reviews[currentReviewIndex]?.title}
                      </h3>
                      <p className="text-gray-600 text-sm sm:text-base line-clamp-4">
                        {reviews[currentReviewIndex]?.excerpt || reviews[currentReviewIndex]?.content?.substring(0, 200)}
                      </p>
                      {reviews.length > 1 && (
                        <div className="flex justify-center space-x-2 mt-6">
                          {reviews.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentReviewIndex(index)}
                              className={`w-2 h-2 rounded-full ${
                                currentReviewIndex === index ? 'bg-red-600' : 'bg-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">아직 후기가 없습니다.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CTA 섹션 */}
        <section className="py-16 bg-gradient-to-br from-red-600 to-red-700">
          <div className="container mx-auto px-4 max-w-7xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              지금 바로 상담받으세요
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
      </main>
    </>
  );
}

