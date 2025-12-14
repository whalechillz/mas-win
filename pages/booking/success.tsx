import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function BookingSuccess() {
  const router = useRouter();
  const { id, date, time } = router.query;

  return (
    <>
      <Head>
        <title>예약 완료 | 마쓰구골프</title>
        <meta name="description" content="시타 예약이 완료되었습니다." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            {/* 진행 단계 표시 */}
            <div className="mb-8 flex items-center justify-center gap-0.5 sm:gap-1 flex-nowrap overflow-x-auto">
              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold text-sm">1</div>
                <span className="text-[9px] sm:text-[10px] text-gray-500 whitespace-nowrap">날짜/시간</span>
              </div>
              <div className="w-4 sm:w-8 h-0.5 bg-gray-300 shrink-0"></div>
              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold text-sm">2</div>
                <span className="text-[9px] sm:text-[10px] text-gray-500 whitespace-nowrap">정보</span>
              </div>
              <div className="w-4 sm:w-8 h-0.5 bg-gray-300 shrink-0"></div>
              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">3</div>
                <span className="text-[9px] sm:text-[10px] font-medium text-gray-700 whitespace-nowrap">완료</span>
              </div>
            </div>

            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">예약이 완료되었습니다!</h1>
            </div>

            {date && time && (
              <div className="mb-8 p-6 bg-gray-50 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">예약 정보</h2>
                <div className="space-y-2 text-gray-700">
                  <p><strong>예약 날짜:</strong> {date}</p>
                  <p><strong>예약 시간:</strong> {time}</p>
                  <p><strong>서비스:</strong> 마쓰구 드라이버 시타서비스</p>
                  <p><strong>위치:</strong> 마쓰구 수원본점 (경기도 수원시 영통구 법조로149번길 200)</p>
                </div>
              </div>
            )}

            <div className="mb-8 p-6 bg-blue-50 rounded-lg text-left">
              <h3 className="font-semibold text-gray-900 mb-2">안내사항</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• 예약하신 시간에 매장을 방문해주세요.</li>
                <li>• 예약 변경이나 취소는<br />전화 (031-215-0013)로 문의해주세요.</li>
                <li>• 예약 확인 문자는 곧 발송됩니다.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/try-a-massgoo"
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                홈으로
              </Link>
              <Link
                href="/contact"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                매장 위치 보기
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

