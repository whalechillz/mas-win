import Head from 'next/head';
import Link from 'next/link';

export default function SurveySuccess() {
  return (
    <>
      <Head>
        <title>설문 완료 - MASSGOO X MUZIIK | 마쓰구골프</title>
        <meta name="description" content="설문 조사가 완료되었습니다." />
      </Head>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8 md:p-12 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              설문이 완료되었습니다!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              참여해주셔서 감사합니다.
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">다음 단계</h2>
            <ul className="text-left space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>시타 예약 전화를 해주시면 모자 증정 대상이 됩니다.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>전화번호: <a href="tel:031-215-0013" className="text-blue-600 hover:underline">031-215-0013</a></span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>입력하신 주소로 모자를 배송해드립니다.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>선착순 30명에게 증정됩니다.</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/booking"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              시타 예약하기
            </Link>
            <a
              href="tel:031-215-0013"
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              전화하기
            </a>
            <Link
              href="/"
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              홈으로 가기
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

