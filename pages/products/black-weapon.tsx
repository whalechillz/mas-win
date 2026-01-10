import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useProductData } from '../../lib/use-product-data';
import { getProductImageUrl } from '../../lib/product-image-url';

const REVIEW_CATEGORIES = ['고객 후기', '리얼 체험, 비거리 성공 후기'];

export default function BlackWeaponProduct() {
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);

  // 기본 이미지 (fallback)
  const defaultImages = [
    'originals/products/secret-weapon-black/detail/secret-weapon-black-gallery-00-01.webp',
    'originals/products/secret-weapon-black/detail/secret-weapon-black-gallery-01.webp',
    'originals/products/secret-weapon-black/detail/secret-weapon-black-gallery-02.webp',
    'originals/products/secret-weapon-black/detail/secret-weapon-black-gallery-03.webp',
    'originals/products/secret-weapon-black/detail/secret-weapon-black-gallery-04.webp',
    'originals/products/secret-weapon-black/detail/secret-weapon-black-gallery-05.webp',
    'originals/products/secret-weapon-black/detail/secret-weapon-black-gallery-06.webp',
    'originals/products/secret-weapon-black/detail/secret-weapon-black-gallery-07.webp',
    'originals/products/secret-weapon-black/detail/secret-weapon-black-gallery-08-01.webp',
  ];

  // 제품 데이터 로드
  const { productImages, galleryImages, isLoadingProduct } = useProductData('secret-weapon-black', defaultImages);

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
            if (!acc.find((p) => p.id === post.id)) {
              acc.push(post);
            }
            return acc;
          }, []);

        if (isMounted) {
          setReviews(combinedPosts);
          setIsLoadingReviews(false);
        }
      } catch (error) {
        console.error('후기 로드 오류:', error);
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

  const nextReview = () => {
    setCurrentReviewIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrentReviewIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const goToReview = (index: number) => {
    setCurrentReviewIndex(index);
  };

  if (isLoadingProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">제품을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const images = productImages.length > 0 ? productImages : defaultImages.map(img => getProductImageUrl(img));

  return (
    <>
      <Head>
        <title>시크리트웨폰 블랙 | MASGOLF</title>
        <meta name="description" content="SP700 Grade 5 티타늄, 2.2mm 초박형 페이스, COR 0.87" />
      </Head>

      <main className="min-h-screen bg-white">
        {/* 제품 이미지 섹션 */}
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* 메인 이미지 */}
              <div className="space-y-4">
                <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {images[selectedImage] && (
                    <Image
                      src={images[selectedImage]}
                      alt="시크리트웨폰 블랙"
                      fill
                      className="object-cover"
                      priority
                    />
                  )}
                </div>
                {/* 썸네일 이미지 */}
                <div className="grid grid-cols-5 gap-2">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                        selectedImage === index ? 'border-blue-600' : 'border-transparent'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`시크리트웨폰 블랙 ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* 제품 정보 */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-4xl font-bold mb-2">시크리트웨폰 블랙</h1>
                  <p className="text-xl text-gray-600 mb-4">프리미엄 리미티드</p>
                  <p className="text-3xl font-bold text-red-600 mb-6">1,700,000원</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">주요 특징</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li>• SP700 Grade 5 티타늄</li>
                      <li>• 2.2mm 초박형 페이스</li>
                      <li>• COR 0.87</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Link
                    href="tel:080-028-8888"
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg text-center font-semibold hover:bg-blue-700 transition-colors"
                  >
                    080-028-8888 무료 상담하기
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 고객 후기 섹션 */}
        {reviews.length > 0 && (
          <section className="py-12 px-4 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center">실제 고객 후기</h2>
              <div className="relative">
                <div className="bg-white rounded-lg shadow-lg p-6">
                  {reviews[currentReviewIndex] && (
                    <div>
                      <h3 className="text-xl font-semibold mb-4">
                        {reviews[currentReviewIndex].title}
                      </h3>
                      <p className="text-gray-700 mb-4">
                        {reviews[currentReviewIndex].excerpt || reviews[currentReviewIndex].content?.substring(0, 200)}
                      </p>
                      <Link
                        href={`/blog/${reviews[currentReviewIndex].slug}`}
                        className="text-blue-600 hover:underline"
                      >
                        자세히 보기 →
                      </Link>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={prevReview}
                    className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
                  >
                    ← 이전
                  </button>
                  <div className="flex gap-2">
                    {reviews.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToReview(index)}
                        className={`w-3 h-3 rounded-full ${
                          currentReviewIndex === index ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={nextReview}
                    className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
                  >
                    다음 →
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
