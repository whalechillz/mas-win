import { useState, useEffect } from 'react';

export default function GA4DebugPage() {
  const [ga4Status, setGA4Status] = useState({});
  const [ga4Data, setGA4Data] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [realTimeData, setRealTimeData] = useState(null);

  // GA4 설정 확인
  const checkGA4Setup = async () => {
    try {
      const res = await fetch('/api/test-ga4');
      const data = await res.json();
      setGA4Status(data);
    } catch (err) {
      setError('GA4 설정 확인 실패');
    }
  };

  // GA4 데이터 가져오기
  const fetchGA4Data = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/ga4-campaign-metrics');
      const data = await res.json();
      
      if (res.ok) {
        setGA4Data(data);
      } else {
        setError(data.error || 'GA4 데이터 가져오기 실패');
      }
    } catch (err) {
      setError(`API 호출 실패: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 실시간 데이터 테스트
  const testRealTimeData = async () => {
    setLoading(true);
    try {
      // 실시간 API 테스트 (별도 엔드포인트 필요)
      const res = await fetch('/api/ga4-realtime');
      if (res.ok) {
        const data = await res.json();
        setRealTimeData(data);
      }
    } catch (err) {
      console.error('실시간 데이터 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkGA4Setup();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">📊 Google Analytics 4 디버그</h1>

      {/* GA4 설정 상태 */}
      <div className="mb-8 bg-gray-100 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">⚙️ GA4 설정 상태</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">서비스 계정 이메일:</span>
            <span className={ga4Status.serviceAccountEmail === '✅ 설정됨' ? 'text-green-600' : 'text-red-600'}>
              {ga4Status.serviceAccountEmail || '❌ 없음'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">서비스 계정 키:</span>
            <span className={ga4Status.serviceAccountKey === '✅ 설정됨' ? 'text-green-600' : 'text-red-600'}>
              {ga4Status.serviceAccountKey || '❌ 없음'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">GA4 속성 ID:</span>
            <span className={ga4Status.propertyId ? 'text-green-600' : 'text-red-600'}>
              {ga4Status.propertyId || '❌ 없음'}
            </span>
          </div>
        </div>
      </div>

      {/* 테스트 버튼 */}
      <div className="mb-8 flex gap-4">
        <button
          onClick={fetchGA4Data}
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? '로딩 중...' : 'GA4 데이터 가져오기'}
        </button>
        <button
          onClick={testRealTimeData}
          disabled={loading}
          className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          실시간 데이터 테스트
        </button>
        <button
          onClick={checkGA4Setup}
          className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
        >
          설정 다시 확인
        </button>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <h3 className="font-bold mb-2">❌ 오류:</h3>
          <pre className="whitespace-pre-wrap">{error}</pre>
        </div>
      )}

      {/* GA4 데이터 표시 */}
      {ga4Data && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">📈 GA4 캠페인 데이터</h2>
          
          {ga4Data.success ? (
            <div className="space-y-4">
              {Object.entries(ga4Data.data || {}).map(([campaignId, metrics]) => (
                <div key={campaignId} className="bg-gray-50 p-4 rounded">
                  <h3 className="font-bold mb-2">캠페인: {campaignId}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">페이지뷰</span>
                      <p className="text-xl font-bold">{metrics.views || 0}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">고유 방문자</span>
                      <p className="text-xl font-bold">{metrics.unique_visitors || 0}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">신규 사용자</span>
                      <p className="text-xl font-bold">{metrics.new_users || 0}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">전화 클릭</span>
                      <p className="text-xl font-bold">{metrics.phone_clicks || 0}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-red-600">데이터 가져오기 실패</div>
          )}
        </div>
      )}

      {/* 실시간 데이터 */}
      {realTimeData && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">⚡ 실시간 데이터 (최근 30분)</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(realTimeData, null, 2)}
          </pre>
        </div>
      )}

      {/* 사용 가능한 데이터 목록 */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">📋 GA4에서 추출 가능한 데이터</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold mb-2">📊 메트릭 (Metrics)</h3>
            <ul className="space-y-1 text-sm">
              <li>✓ screenPageViews - 페이지 조회수</li>
              <li>✓ activeUsers - 활성 사용자</li>
              <li>✓ newUsers - 신규 사용자</li>
              <li>✓ sessions - 세션 수</li>
              <li>✓ bounceRate - 이탈률</li>
              <li>✓ averageSessionDuration - 평균 세션 시간</li>
              <li>✓ eventCount - 이벤트 수</li>
              <li>✓ conversions - 전환 수</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-2">📏 디멘션 (Dimensions)</h3>
            <ul className="space-y-1 text-sm">
              <li>✓ date - 날짜</li>
              <li>✓ pagePath - 페이지 경로</li>
              <li>✓ pageTitle - 페이지 제목</li>
              <li>✓ eventName - 이벤트 이름</li>
              <li>✓ country - 국가</li>
              <li>✓ city - 도시</li>
              <li>✓ deviceCategory - 기기 카테고리</li>
              <li>✓ sourceMedium - 소스/매체</li>
              <li>✓ campaign - 캠페인</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-white rounded">
          <h3 className="font-bold mb-2">🎯 커스텀 이벤트 (추적 중)</h3>
          <ul className="space-y-1 text-sm">
            <li>✓ phone_click - 전화 버튼 클릭</li>
            <li>✓ quiz_complete - 퀴즈 완료</li>
            <li>✓ booking_submit - 시타 예약</li>
            <li>✓ contact_submit - 문의 접수</li>
            <li>✓ floating_button_click - 플로팅 버튼 클릭</li>
            <li>✓ scroll_depth - 스크롤 깊이 (25%, 50%, 75%, 100%)</li>
          </ul>
        </div>
      </div>

      {/* API 테스트 코드 */}
      <div className="mt-8 bg-gray-100 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">🧪 직접 테스트하기</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-bold mb-2">브라우저 콘솔에서 실행:</h3>
            <pre className="bg-white p-4 rounded text-sm overflow-auto">
{`// GA4 데이터 가져오기
fetch('/api/ga4-campaign-metrics')
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);

// 설정 확인
fetch('/api/test-ga4')
  .then(res => res.json())
  .then(console.log);`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}