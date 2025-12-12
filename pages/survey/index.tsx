import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// 버킷햇 이미지 (12개)
const bucketHatImages = [
  { src: '/main/products/goods/good-reviews/bucket-hat-muziik-1.webp', alt: 'MASSGOO X MUZIIK 버킷햇 1' },
  { src: '/main/products/goods/good-reviews/bucket-hat-muziik-2.webp', alt: 'MASSGOO X MUZIIK 버킷햇 2' },
  { src: '/main/products/goods/good-reviews/bucket-hat-muziik-3.webp', alt: 'MASSGOO X MUZIIK 버킷햇 3' },
  { src: '/main/products/goods/good-reviews/bucket-hat-muziik-4.webp', alt: 'MASSGOO X MUZIIK 버킷햇 4' },
  { src: '/main/products/goods/good-reviews/bucket-hat-muziik-5.webp', alt: 'MASSGOO X MUZIIK 버킷햇 5' },
  { src: '/main/products/goods/good-reviews/bucket-hat-muziik-6.webp', alt: 'MASSGOO X MUZIIK 버킷햇 6' },
  { src: '/main/products/goods/good-reviews/bucket-hat-muziik-7.webp', alt: 'MASSGOO X MUZIIK 버킷햇 7' },
  { src: '/main/products/goods/good-reviews/bucket-hat-muziik-8.webp', alt: 'MASSGOO X MUZIIK 버킷햇 8' },
  { src: '/main/products/goods/good-reviews/bucket-hat-muziik-9.webp', alt: 'MASSGOO X MUZIIK 버킷햇 9' },
  { src: '/main/products/goods/good-reviews/bucket-hat-muziik-10.webp', alt: 'MASSGOO X MUZIIK 버킷햇 10' },
  { src: '/main/products/goods/good-reviews/bucket-hat-muziik-11.webp', alt: 'MASSGOO X MUZIIK 버킷햇 11' },
  { src: '/main/products/goods/good-reviews/bucket-hat-muziik-12.webp', alt: 'MASSGOO X MUZIIK 버킷햇 12' },
];

// 골프모자 이미지 (7개)
const golfCapImages = [
  { src: '/main/products/goods/good-reviews/golf-hat-muziik-1.webp', alt: 'MASSGOO X MUZIIK 골프모자 1' },
  { src: '/main/products/goods/good-reviews/golf-hat-muziik-2.webp', alt: 'MASSGOO X MUZIIK 골프모자 2' },
  { src: '/main/products/goods/good-reviews/golf-hat-muziik-3.webp', alt: 'MASSGOO X MUZIIK 골프모자 3' },
  { src: '/main/products/goods/good-reviews/golf-hat-muziik-4.webp', alt: 'MASSGOO X MUZIIK 골프모자 4' },
  { src: '/main/products/goods/good-reviews/golf-hat-muziik-5.webp', alt: 'MASSGOO X MUZIIK 골프모자 5' },
  { src: '/main/products/goods/good-reviews/golf-hat-muziik-6.webp', alt: 'MASSGOO X MUZIIK 골프모자 6' },
  { src: '/main/products/goods/good-reviews/golf-hat-muziik-7.webp', alt: 'MASSGOO X MUZIIK 골프모자 7' },
];

export default function SurveyLanding() {
  const router = useRouter();
  const [bucketHatIndex, setBucketHatIndex] = useState(0);
  const [golfCapIndex, setGolfCapIndex] = useState(0);
  const [isHovering, setIsHovering] = useState({ bucket: false, golf: false });

  // 자동 롤링 (3초 간격)
  useEffect(() => {
    const bucketInterval = setInterval(() => {
      if (!isHovering.bucket) {
        setBucketHatIndex((prev) => (prev + 1) % bucketHatImages.length);
      }
    }, 3000);

    const golfInterval = setInterval(() => {
      if (!isHovering.golf) {
        setGolfCapIndex((prev) => (prev + 1) % golfCapImages.length);
      }
    }, 3000);

    return () => {
      clearInterval(bucketInterval);
      clearInterval(golfInterval);
    };
  }, [isHovering]);

  const handleStartSurvey = () => {
    router.push('/survey/form');
  };

  return (
    <>
      <Head>
        <title>MASSGOO X MUZIIK 설문 조사 - 모자 증정 이벤트 | 마쓰구골프</title>
        <meta name="description" content="설문 조사만 해도 MASSGOO X MUZIIK 콜라보 모자 20명에게 증정! 마쓰구 신모델 샤프트 선호도 조사에 참여하세요." />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* 히어로 섹션 */}
        <section className="relative py-20 px-4">
          <div className="max-w-6xl mx-auto">
            {/* PRO3 MUZIIK 제품 이미지 */}
            <div className="mb-8 flex justify-center">
              <div className="relative w-full max-w-md aspect-square rounded-xl overflow-hidden shadow-2xl">
                <Image
                  src="/main/products/pro3-muziik/secret-force-pro-3-muziik-03.webp"
                  alt="시크리트포스 PRO3 MUZIIK"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                MASSGOO X MUZIIK
              </h1>
              <h2 className="text-2xl md:text-3xl font-semibold text-yellow-600 mb-4">
                샤프트 선호도 조사
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                어떤 샤프트가 당신에게 맞을까요?
              </p>
              
              {/* 이벤트 문구 */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 max-w-2xl mx-auto mb-8">
                <p className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                  설문 조사만 해도
                </p>
                <p className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">
                  MASSGOO X MUZIIK 콜라보 모자 증정
                </p>
                <p className="text-lg md:text-xl font-semibold text-gray-700">
                  버킷햇 10명 · 골프모자 10명 (선착순 20명)
                </p>
              </div>
            </div>

            {/* 모자 이미지 롤링 갤러리 (2개 영역 분리) */}
            <div className="mb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {/* 버킷햇 롤링 영역 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 text-center">버킷햇</h3>
                  <div
                    className="relative aspect-square rounded-lg overflow-hidden shadow-lg border-2 border-blue-200"
                    onMouseEnter={() => setIsHovering(prev => ({ ...prev, bucket: true }))}
                    onMouseLeave={() => setIsHovering(prev => ({ ...prev, bucket: false }))}
                  >
                    <Image
                      src={bucketHatImages[bucketHatIndex]?.src || '/main/products/goods/good-reviews/bucket-hat-muziik-1.webp'}
                      alt={bucketHatImages[bucketHatIndex]?.alt || '버킷햇'}
                      fill
                      className="object-contain transition-opacity duration-500"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    {/* 썸네일 인디케이터 */}
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
                      {bucketHatImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setBucketHatIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            bucketHatIndex === index ? 'bg-blue-600 w-6' : 'bg-gray-400'
                          }`}
                          aria-label={`버킷햇 ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* 골프모자 롤링 영역 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 text-center">골프모자</h3>
                  <div
                    className="relative aspect-square rounded-lg overflow-hidden shadow-lg border-2 border-blue-200"
                    onMouseEnter={() => setIsHovering(prev => ({ ...prev, golf: true }))}
                    onMouseLeave={() => setIsHovering(prev => ({ ...prev, golf: false }))}
                  >
                    <Image
                      src={golfCapImages[golfCapIndex]?.src || '/main/products/goods/good-reviews/golf-hat-muziik-1.webp'}
                      alt={golfCapImages[golfCapIndex]?.alt || '골프모자'}
                      fill
                      className="object-contain transition-opacity duration-500"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    {/* 썸네일 인디케이터 */}
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
                      {golfCapImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setGolfCapIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            golfCapIndex === index ? 'bg-blue-600 w-6' : 'bg-gray-400'
                          }`}
                          aria-label={`골프모자 ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-center text-sm text-gray-500 mt-4">
                버킷햇, 골프모자 중 선택 가능
              </p>
            </div>

            {/* CTA 버튼 */}
            <div className="flex flex-col gap-4 justify-center items-center mb-12">
              {/* 메인 CTA */}
              <button
                onClick={handleStartSurvey}
                className="w-full sm:w-auto px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-lg transition-colors shadow-lg hover:shadow-xl"
              >
                설문 조사 시작하기
              </button>
              
              {/* 보조 CTA */}
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link
                  href="/products/pro3-muziik"
                  className="w-full sm:w-auto px-8 py-3 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl text-center"
                >
                  제품 보기 (PRO3)
                </Link>
                <a
                  href="tel:080-028-8888"
                  className="w-full sm:w-auto px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl text-center"
                >
                  전화 상담 (080-028-8888)
                </a>
              </div>
            </div>

            {/* 이벤트 안내 */}
            <div className="bg-blue-50 rounded-lg p-6 max-w-3xl mx-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">이벤트 안내</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>설문 조사만 해도 모자 증정 (선착순 20명: 버킷햇 10명, 골프모자 10명)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>마쓰구 신모델에 장착할 샤프트 선호도 조사에 참여해주세요</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>설문 완료 후 주소를 입력하시면 모자를 배송해드립니다</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>모자 종류: 버킷햇 (화이트, 블랙), 골프모자 (화이트, 베이지, 네이비, 블랙)</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

