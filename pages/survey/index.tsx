import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/router';

// 모자 이미지 경로 (6개)
const hatImages = [
  { src: '/survey/gifts/bucket-hat-white.webp', alt: 'MASSGOO X MUZIIK 버킷햇 화이트' },
  { src: '/survey/gifts/bucket-hat-black.webp', alt: 'MASSGOO X MUZIIK 버킷햇 블랙' },
  { src: '/survey/gifts/golf-cap-white.webp', alt: 'MASSGOO X MUZIIK 골프모자 화이트' },
  { src: '/survey/gifts/golf-cap-beige.webp', alt: 'MASSGOO X MUZIIK 골프모자 베이지' },
  { src: '/survey/gifts/golf-cap-navy.webp', alt: 'MASSGOO X MUZIIK 골프모자 네이비' },
  { src: '/survey/gifts/golf-cap-black.webp', alt: 'MASSGOO X MUZIIK 골프모자 블랙' },
];

export default function SurveyLanding() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);

  const handleStartSurvey = () => {
    router.push('/survey/form');
  };

  return (
    <>
      <Head>
        <title>MASSGOO X MUZIIK 설문 조사 - 모자 증정 이벤트 | 마쓰구골프</title>
        <meta name="description" content="시타 참여자 전화만 해도 MASSGOO X MUZIIK 콜라보 모자 30명에게 증정! 마쓰구 신모델 샤프트 선호도 조사에 참여하세요." />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* 히어로 섹션 */}
        <section className="relative py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                MASSGOO X MUZIIK
              </h1>
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-6">
                콜라보 모자 증정 이벤트
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                시타 참여자 전화만 해도<br />
                <span className="text-2xl font-bold text-blue-600">MASSGOO X MUZIIK 콜라보 모자</span><br />
                <span className="text-xl font-semibold">30명에게 증정!</span>
              </p>
            </div>

            {/* 모자 이미지 갤러리 */}
            <div className="mb-12">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {hatImages.map((hat, index) => (
                  <div
                    key={index}
                    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all ${
                      selectedImage === index
                        ? 'ring-4 ring-blue-500 scale-105'
                        : 'ring-2 ring-gray-200 hover:ring-blue-300'
                    }`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <Image
                      src={hat.src}
                      alt={hat.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  </div>
                ))}
              </div>
              <p className="text-center text-sm text-gray-500 mt-4">
                버킷햇, 골프모자 중 선택 가능
              </p>
            </div>

            {/* CTA 버튼 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button
                onClick={handleStartSurvey}
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
              >
                설문 조사 시작하기
              </button>
              <Link
                href="/booking"
                className="w-full sm:w-auto px-8 py-4 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl text-center"
              >
                시타 예약하기
              </Link>
              <a
                href="tel:031-215-0013"
                className="w-full sm:w-auto px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl text-center"
              >
                전화하기 (031-215-0013)
              </a>
            </div>

            {/* 이벤트 안내 */}
            <div className="bg-blue-50 rounded-lg p-6 max-w-3xl mx-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">이벤트 안내</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>시타 참여자 전화만 해도 모자 증정 (선착순 30명)</span>
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

