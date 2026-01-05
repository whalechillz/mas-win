import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getProductImageUrl } from '../../lib/product-image-url';

// Fallback 이미지 (데이터베이스에 없을 때 사용)
const defaultBucketHatImages = [
  '/main/products/goods/good-reviews/bucket-hat-muziik-1.webp',
  '/main/products/goods/good-reviews/bucket-hat-muziik-2.webp',
  '/main/products/goods/good-reviews/bucket-hat-muziik-3.webp',
  '/main/products/goods/good-reviews/bucket-hat-muziik-4.webp',
  '/main/products/goods/good-reviews/bucket-hat-muziik-5.webp',
  '/main/products/goods/good-reviews/bucket-hat-muziik-6.webp',
  '/main/products/goods/good-reviews/bucket-hat-muziik-7.webp',
  '/main/products/goods/good-reviews/bucket-hat-muziik-8.webp',
  '/main/products/goods/good-reviews/bucket-hat-muziik-9.webp',
  '/main/products/goods/good-reviews/bucket-hat-muziik-10.webp',
  '/main/products/goods/good-reviews/bucket-hat-muziik-11.webp',
  '/main/products/goods/good-reviews/bucket-hat-muziik-12.webp',
];

const defaultGolfCapImages = [
  '/main/products/goods/good-reviews/golf-hat-muziik-1.webp',
  '/main/products/goods/good-reviews/golf-hat-muziik-2.webp',
  '/main/products/goods/good-reviews/golf-hat-muziik-3.webp',
  '/main/products/goods/good-reviews/golf-hat-muziik-4.webp',
  '/main/products/goods/good-reviews/golf-hat-muziik-5.webp',
  '/main/products/goods/good-reviews/golf-hat-muziik-6.webp',
  '/main/products/goods/good-reviews/golf-hat-muziik-7.webp',
];

export default function SurveyLanding() {
  const router = useRouter();
  const [bucketHatIndex, setBucketHatIndex] = useState(0);
  const [golfCapIndex, setGolfCapIndex] = useState(0);
  const [isHovering, setIsHovering] = useState({ bucket: false, golf: false });
  const [bucketHatImages, setBucketHatImages] = useState<Array<{ src: string; originalUrl?: string; alt: string }>>([]);
  const [golfCapImages, setGolfCapImages] = useState<Array<{ src: string; originalUrl?: string; alt: string }>>([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [pro3MuziikImage, setPro3MuziikImage] = useState<string>(getProductImageUrl('originals/products/pro3-muziik/detail/secret-force-pro-3-muziik-00.webp')); // Fallback

  // 파일 타입 감지 함수 (이미지/동영상)
  const getFileType = (url: string): 'image' | 'video' => {
    if (!url) return 'image';
    const videoExtensions = ['.mp4', '.avi', '.mov', '.webm', '.mkv', '.m4v', '.3gp', '.wmv'];
    const urlLower = url.toLowerCase();
    
    // URL에서 파일명 추출 (마지막 경로 세그먼트)
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const fileName = pathname.split('/').pop() || '';
      
      // 파일명에서 확장자 확인
      const isVideo = videoExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
      if (isVideo) return 'video';
    } catch (e) {
      // URL 파싱 실패 시 기존 방식 사용
      if (videoExtensions.some(ext => urlLower.includes(ext))) {
        return 'video';
      }
    }
    
    return 'image';
  };

  // 설문 이미지 로드 (데이터베이스에서)
  useEffect(() => {
    loadSurveyImages();
    loadPro3MuziikImage();
  }, []);

  // PRO3 MUZIIK 제품 이미지 로드
  const loadPro3MuziikImage = async () => {
    try {
      const res = await fetch('/api/products/pro3-muziik');
      const data = await res.json();
      
      if (data.success && data.product?.detail_images && data.product.detail_images.length > 0) {
        // 첫 번째 이미지 사용
        const firstImage = getProductImageUrl(data.product.detail_images[0]);
        setPro3MuziikImage(firstImage);
      } else {
        // Fallback: 기본 이미지 사용 (Supabase Storage 경로)
        setPro3MuziikImage(getProductImageUrl('originals/products/pro3-muziik/detail/secret-force-pro-3-muziik-00.webp'));
      }
    } catch (error) {
      console.error('PRO3 MUZIIK 이미지 로드 오류:', error);
      // Fallback 사용 (Supabase Storage 경로)
      setPro3MuziikImage(getProductImageUrl('originals/products/pro3-muziik/detail/secret-force-pro-3-muziik-00.webp'));
    }
  };

  const loadSurveyImages = async () => {
    try {
      setImagesLoading(true);
      
      // 버킷햇 이미지 로드 (여러 색상 제품 합치기)
      const bucketRes = await fetch('/api/products/survey-hats?type=bucket');
      const bucketData = await bucketRes.json();
      
      if (bucketData.success && bucketData.product?.gallery_images && bucketData.product.gallery_images.length > 0) {
        // 디버깅: 동영상 파일 확인
        const videoCount = bucketData.product.gallery_images.filter((url: string) => 
          getFileType(url) === 'video'
        ).length;
        console.log(`[survey] 버킷햇 미디어: 총 ${bucketData.product.gallery_images.length}개 (동영상: ${videoCount}개)`);
        
        const bucketImages = bucketData.product.gallery_images.map((img: string, index: number) => ({
          src: getProductImageUrl(img),
          originalUrl: img, // 원본 URL 저장 (동영상 타입 감지용)
          alt: `MASSGOO X MUZIIK 버킷햇 ${index + 1}`
        }));
        setBucketHatImages(bucketImages);
      } else {
        // Fallback: 기본 이미지 사용
        const fallbackImages = defaultBucketHatImages.map((img, index) => ({
          src: getProductImageUrl(img),
          originalUrl: img,
          alt: `MASSGOO X MUZIIK 버킷햇 ${index + 1}`
        }));
        setBucketHatImages(fallbackImages);
      }
      
      // 골프모자 이미지 로드 (여러 색상 제품 합치기)
      const golfRes = await fetch('/api/products/survey-hats?type=golf');
      const golfData = await golfRes.json();
      
      if (golfData.success && golfData.product?.gallery_images && golfData.product.gallery_images.length > 0) {
        // 디버깅: 동영상 파일 확인
        const videoCount = golfData.product.gallery_images.filter((url: string) => 
          getFileType(url) === 'video'
        ).length;
        console.log(`[survey] 골프모자 미디어: 총 ${golfData.product.gallery_images.length}개 (동영상: ${videoCount}개)`);
        
        const golfImages = golfData.product.gallery_images.map((img: string, index: number) => ({
          src: getProductImageUrl(img),
          originalUrl: img, // 원본 URL 저장 (동영상 타입 감지용)
          alt: `MASSGOO X MUZIIK 골프모자 ${index + 1}`
        }));
        setGolfCapImages(golfImages);
      } else {
        // Fallback: 기본 이미지 사용
        const fallbackImages = defaultGolfCapImages.map((img, index) => ({
          src: getProductImageUrl(img),
          originalUrl: img,
          alt: `MASSGOO X MUZIIK 골프모자 ${index + 1}`
        }));
        setGolfCapImages(fallbackImages);
      }
    } catch (error) {
      console.error('설문 이미지 로드 오류:', error);
      // Fallback: 기본 이미지 사용
      setBucketHatImages(defaultBucketHatImages.map((img, index) => ({
        src: getProductImageUrl(img),
        originalUrl: img,
        alt: `MASSGOO X MUZIIK 버킷햇 ${index + 1}`
      })));
      setGolfCapImages(defaultGolfCapImages.map((img, index) => ({
        src: getProductImageUrl(img),
        originalUrl: img,
        alt: `MASSGOO X MUZIIK 골프모자 ${index + 1}`
      })));
    } finally {
      setImagesLoading(false);
    }
  };

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

      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        {/* 히어로 섹션 */}
        <section className="relative py-12 md:py-20 px-4 overflow-hidden">
          {/* 배경 장식 요소 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-yellow-600/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-red-500/20 to-red-700/10 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-yellow-400/10 to-red-500/10 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 max-w-6xl mx-auto">
            {/* PRO3 MUZIIK 제품 이미지 */}
            <div className="mb-8 md:mb-12 flex justify-center">
              <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 group hover:scale-105 transition-transform duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-transparent to-red-500/20 pointer-events-none"></div>
                <Image
                  src={pro3MuziikImage}
                  alt="시크리트포스 PRO3 MUZIIK"
                  fill
                  className="object-contain p-4"
                  priority
                  onError={(e) => {
                    console.error('PRO3 MUZIIK 이미지 로드 실패:', pro3MuziikImage);
                    const target = e.target as HTMLImageElement;
                    if (target) {
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><span class="text-gray-400 text-sm">이미지 없음</span></div>';
                      }
                    }
                  }}
                />
                {/* 골드 글로우 효과 */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/0 via-yellow-400/10 to-yellow-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            </div>

            <div className="text-center mb-8 md:mb-12">
              {/* 배지 */}
              <div className="mb-4 md:mb-6">
                <span className="inline-block bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 text-gray-900 px-4 py-1.5 md:px-6 md:py-2 rounded-full text-xs md:text-sm font-bold shadow-lg animate-pulse">
                  🎁 연말 특별 이벤트
                </span>
              </div>

              {/* 로고 이미지 - MASSGOO X MUZIIK (위아래 배치) */}
              <div className="flex flex-col items-center justify-center mb-4 md:mb-6">
                {/* MASSGOO 로고 */}
                <div className="relative w-48 sm:w-56 md:w-64 lg:w-72 h-auto mb-2 md:mb-3">
                  <Image
                    src="/main/logo/massgoo_logo_white.png"
                    alt="MASSGOO"
                    width={280}
                    height={80}
                    className="w-full h-auto object-contain"
                    priority
                    onError={(e) => {
                      // Fallback: 텍스트로 대체
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.fallback-text')) {
                        const fallback = document.createElement('span');
                        fallback.className = 'fallback-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 bg-clip-text text-transparent text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold';
                        fallback.textContent = 'MASSGOO';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>
                
                {/* X 기호 - 개선 */}
                <div className="my-2 md:my-3">
                  <span className="text-yellow-400 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold drop-shadow-lg">
                    ×
                  </span>
                </div>
                
                {/* MUZIIK 로고 - 75% 크기 */}
                <div className="relative w-36 sm:w-40 md:w-48 lg:w-56 h-auto mt-2 md:mt-3">
                  <Image
                    src="/muziik/brand/muziik-logo2.webp"
                    alt="MUZIIK"
                    width={224}
                    height={64}
                    className="w-full h-auto object-contain"
                    priority
                    onError={(e) => {
                      // Fallback: 텍스트로 대체
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.fallback-text')) {
                        const fallback = document.createElement('span');
                        fallback.className = 'fallback-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 bg-clip-text text-transparent text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold';
                        fallback.textContent = 'MUZIIK';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold mb-4 md:mb-6">
                <span className="bg-gradient-to-r from-red-500 via-red-400 to-red-500 bg-clip-text text-transparent">
                  샤프트 선호도 조사
                </span>
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 md:mb-8 max-w-2xl mx-auto">
                어떤 샤프트가 당신에게 맞을까요?
              </p>
              
              {/* 이벤트 문구 - 골드/레드 그라데이션 + 펄스 애니메이션 */}
              <div className="relative bg-gradient-to-br from-yellow-500/20 via-yellow-400/30 to-red-500/20 border-2 border-yellow-400/50 rounded-2xl p-6 md:p-8 max-w-2xl mx-auto mb-8 md:mb-12 shadow-2xl overflow-hidden animate-pulse">
                {/* 배경 패턴 */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-yellow-400 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-red-500 rounded-full blur-3xl"></div>
                </div>
                
                <div className="relative z-10">
                  <p className="text-lg md:text-xl font-bold text-gray-100 mb-2">
                    설문 조사만 해도
                  </p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
                    <span className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 bg-clip-text text-transparent">
                      MASSGOO X MUZIIK
                    </span>
                    <br />
                    <span className="bg-gradient-to-r from-red-400 via-red-300 to-red-400 bg-clip-text text-transparent">
                      콜라보 모자 증정
                    </span>
                  </p>
                  <div className="inline-block bg-gradient-to-r from-yellow-500 to-red-500 text-white px-4 py-2 rounded-full text-sm md:text-base font-bold shadow-lg">
                    버킷햇 10명 · 골프모자 10명 (선착순 20명)
                  </div>
                </div>
              </div>
            </div>

            {/* 모자 이미지 롤링 갤러리 (2개 영역 분리) */}
            <div className="mb-12 md:mb-16">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
                {/* 버킷햇 롤링 영역 */}
                <div className="space-y-4">
                  <h3 className="text-lg md:text-xl font-semibold text-center">
                    <span className="bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent">
                      버킷햇
                    </span>
                  </h3>
                  <div
                    className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl border-2 border-yellow-400/30 bg-gradient-to-br from-gray-800 to-gray-900 group hover:border-yellow-400 hover:-translate-y-2 transition-all duration-500"
                    onMouseEnter={() => setIsHovering(prev => ({ ...prev, bucket: true }))}
                    onMouseLeave={() => setIsHovering(prev => ({ ...prev, bucket: false }))}
                  >
                    {/* 골드 글로우 효과 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/0 via-yellow-400/10 to-yellow-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    {imagesLoading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 text-sm">이미지 로딩 중...</span>
                      </div>
                    ) : bucketHatImages.length > 0 ? (
                      getFileType(bucketHatImages[bucketHatIndex]?.originalUrl || bucketHatImages[bucketHatIndex]?.src || bucketHatImages[0]?.originalUrl || bucketHatImages[0]?.src) === 'video' ? (
                        <video
                          src={bucketHatImages[bucketHatIndex]?.src || bucketHatImages[0]?.src}
                          className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
                          controls
                          autoPlay
                          loop
                          muted
                          playsInline
                          onError={(e) => {
                            console.error('버킷햇 동영상 로드 실패:', bucketHatImages[bucketHatIndex]?.src);
                            const target = e.target as HTMLVideoElement;
                            if (target) {
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><span class="text-gray-400 text-sm">동영상 없음</span></div>';
                              }
                            }
                          }}
                        />
                      ) : (
                        <Image
                          src={bucketHatImages[bucketHatIndex]?.src || bucketHatImages[0]?.src}
                          alt={bucketHatImages[bucketHatIndex]?.alt || '버킷햇'}
                          fill
                          className="object-contain p-4 transition-transform duration-500 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          onError={(e) => {
                            console.error('버킷햇 이미지 로드 실패:', bucketHatImages[bucketHatIndex]?.src);
                            const target = e.target as HTMLImageElement;
                            if (target) {
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><span class="text-gray-400 text-sm">이미지 없음</span></div>';
                              }
                            }
                          }}
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 text-sm">이미지 없음</span>
                      </div>
                    )}
                    {/* 썸네일 인디케이터 */}
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-10">
                      {bucketHatImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setBucketHatIndex(index)}
                          className={`h-2 rounded-full transition-all ${
                            bucketHatIndex === index 
                              ? 'bg-gradient-to-r from-yellow-400 to-yellow-300 w-8 shadow-lg' 
                              : 'bg-gray-500/50 w-2 hover:bg-gray-400'
                          }`}
                          aria-label={`버킷햇 ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* 골프모자 롤링 영역 */}
                <div className="space-y-4">
                  <h3 className="text-lg md:text-xl font-semibold text-center">
                    <span className="bg-gradient-to-r from-red-400 to-red-300 bg-clip-text text-transparent">
                      골프모자
                    </span>
                  </h3>
                  <div
                    className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl border-2 border-red-400/30 bg-gradient-to-br from-gray-800 to-gray-900 group hover:border-red-400 hover:-translate-y-2 transition-all duration-500"
                    onMouseEnter={() => setIsHovering(prev => ({ ...prev, golf: true }))}
                    onMouseLeave={() => setIsHovering(prev => ({ ...prev, golf: false }))}
                  >
                    {/* 레드 글로우 효과 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-400/0 via-red-400/10 to-red-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    {imagesLoading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 text-sm">이미지 로딩 중...</span>
                      </div>
                    ) : golfCapImages.length > 0 ? (
                      getFileType(golfCapImages[golfCapIndex]?.originalUrl || golfCapImages[golfCapIndex]?.src || golfCapImages[0]?.originalUrl || golfCapImages[0]?.src) === 'video' ? (
                        <video
                          src={golfCapImages[golfCapIndex]?.src || golfCapImages[0]?.src}
                          className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
                          controls
                          autoPlay
                          loop
                          muted
                          playsInline
                          onError={(e) => {
                            console.error('골프모자 동영상 로드 실패:', golfCapImages[golfCapIndex]?.src);
                            const target = e.target as HTMLVideoElement;
                            if (target) {
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><span class="text-gray-400 text-sm">동영상 없음</span></div>';
                              }
                            }
                          }}
                        />
                      ) : (
                        <Image
                          src={golfCapImages[golfCapIndex]?.src || golfCapImages[0]?.src}
                          alt={golfCapImages[golfCapIndex]?.alt || '골프모자'}
                          fill
                          className="object-contain p-4 transition-transform duration-500 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          onError={(e) => {
                            console.error('골프모자 이미지 로드 실패:', golfCapImages[golfCapIndex]?.src);
                            const target = e.target as HTMLImageElement;
                            if (target) {
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><span class="text-gray-400 text-sm">이미지 없음</span></div>';
                              }
                            }
                          }}
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 text-sm">이미지 없음</span>
                      </div>
                    )}
                    {/* 썸네일 인디케이터 */}
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-10">
                      {golfCapImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setGolfCapIndex(index)}
                          className={`h-2 rounded-full transition-all ${
                            golfCapIndex === index 
                              ? 'bg-gradient-to-r from-red-400 to-red-300 w-8 shadow-lg' 
                              : 'bg-gray-500/50 w-2 hover:bg-gray-400'
                          }`}
                          aria-label={`골프모자 ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-center text-sm md:text-base text-gray-400 mt-4 md:mt-6">
                버킷햇, 골프모자 중 선택 가능
              </p>
            </div>

            {/* CTA 버튼 */}
            <div className="flex flex-col gap-4 md:gap-6 justify-center items-center mb-12 md:mb-16">
              {/* 메인 CTA - 골드/레드 그라데이션 */}
              <button
                onClick={handleStartSurvey}
                className="group relative w-full sm:w-auto px-8 md:px-12 py-4 md:py-5 bg-gradient-to-r from-yellow-500 via-yellow-400 to-red-500 hover:from-yellow-400 hover:via-yellow-300 hover:to-red-400 text-gray-900 font-bold text-base md:text-lg rounded-xl transition-all duration-300 shadow-2xl hover:shadow-yellow-500/50 hover:scale-105 overflow-hidden"
              >
                {/* 배경 애니메이션 */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-yellow-300 to-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  설문 조사 시작하기
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
              
              {/* 보조 CTA */}
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto">
                <Link
                  href="/products/pro3-muziik"
                  className="group w-full sm:w-auto px-6 md:px-8 py-3 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 text-center flex items-center justify-center gap-2"
                >
                  제품보기
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <a
                  href="tel:080-028-8888"
                  className="group w-full sm:w-auto px-6 md:px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 text-center flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  전화 상담
                </a>
              </div>
            </div>

            {/* 이벤트 안내 */}
            <div className="relative bg-gradient-to-br from-gray-800/80 via-gray-800/60 to-gray-900/80 backdrop-blur-sm border border-yellow-400/30 rounded-2xl p-6 md:p-8 max-w-3xl mx-auto shadow-2xl">
              {/* 배경 장식 */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <h3 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">
                  <span className="bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent">
                    이벤트 안내
                  </span>
                </h3>
                <ul className="space-y-3 md:space-y-4 text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-400 text-xl font-bold mt-0.5">•</span>
                    <span className="text-sm md:text-base">설문 조사만 해도 모자 증정 (선착순 20명: 버킷햇 10명, 골프모자 10명)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-400 text-xl font-bold mt-0.5">•</span>
                    <span className="text-sm md:text-base">마쓰구 신모델에 장착할 샤프트 선호도 조사에 참여해주세요</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-400 text-xl font-bold mt-0.5">•</span>
                    <span className="text-sm md:text-base">설문 완료 후 주소를 입력하시면 모자를 배송해드립니다</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-400 text-xl font-bold mt-0.5">•</span>
                    <span className="text-sm md:text-base">모자 종류: 버킷햇 (화이트, 블랙), 골프모자 (화이트, 베이지, 네이비, 블랙)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

