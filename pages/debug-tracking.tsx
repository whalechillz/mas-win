import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function DebugPage() {
  const [pageViews, setPageViews] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [testResult, setTestResult] = useState('');
  const [error, setError] = useState('');
  const [supabaseStatus, setSupabaseStatus] = useState({});

  // Supabase 클라이언트 생성
  const createSupabaseClient = () => {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!url || !key) {
        throw new Error('Supabase 환경변수가 설정되지 않았습니다');
      }
      
      return createClient(url, key);
    } catch (error) {
      setError(`Supabase 초기화 실패: ${error.message}`);
      return null;
    }
  };

  const supabase = createSupabaseClient();

  // Supabase 연결 테스트
  const testConnection = async () => {
    if (!supabase) return;
    
    try {
      // 간단한 쿼리로 연결 테스트
      const { data, error } = await supabase
        .from('page_views')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        setSupabaseStatus({
          connected: false,
          error: `연결 실패: ${error.message} (${error.code})`
        });
      } else {
        setSupabaseStatus({
          connected: true,
          message: '✅ Supabase 연결 성공'
        });
      }
    } catch (error) {
      setSupabaseStatus({
        connected: false,
        error: `연결 테스트 실패: ${error.message}`
      });
    }
  };

  // 데이터 조회
  const fetchData = async () => {
    if (!supabase) return;
    
    setError('');
    
    try {
      // page_views 조회
      const { data: views, error: viewsError } = await supabase
        .from('page_views')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (viewsError) {
        console.error('page_views 조회 에러:', viewsError);
        setError(`page_views 조회 실패: ${viewsError.message}`);
      } else {
        setPageViews(views || []);
      }

      // campaign_metrics 조회
      const { data: metricsData, error: metricsError } = await supabase
        .from('campaign_metrics')
        .select('*');

      if (metricsError) {
        console.error('campaign_metrics 조회 에러:', metricsError);
        setError(prev => prev + `\ncampaign_metrics 조회 실패: ${metricsError.message}`);
      } else {
        setMetrics(metricsData);
      }

    } catch (error) {
      console.error('데이터 조회 에러:', error);
      setError(`데이터 조회 중 에러: ${error.message}`);
    }
  };

  // 테스트 데이터 추가
  const testTrackView = async () => {
    setTestResult('API 호출 중...');
    
    try {
      const res = await fetch('/api/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: '2025-07',
          page: '/test-' + Date.now()
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        setTestResult(`API 에러 (${res.status}): ${JSON.stringify(data)}`);
      } else {
        setTestResult(`✅ API 성공: ${JSON.stringify(data)}`);
        // 데이터 다시 조회
        setTimeout(fetchData, 1000);
      }
    } catch (error) {
      setTestResult(`❌ API 호출 실패: ${error.message}`);
    }
  };

  useEffect(() => {
    testConnection();
    fetchData();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">🔍 추적 시스템 디버그</h1>

      {/* 에러 표시 */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <h3 className="font-bold mb-2">⚠️ 에러:</h3>
          <pre className="whitespace-pre-wrap">{error}</pre>
        </div>
      )}

      {/* Supabase 상태 */}
      <div className="mb-6 bg-gray-100 p-4 rounded-lg">
        <h3 className="font-bold mb-2">🔌 Supabase 연결 상태:</h3>
        {supabaseStatus.connected ? (
          <p className="text-green-600">{supabaseStatus.message}</p>
        ) : (
          <p className="text-red-600">{supabaseStatus.error || '연결 테스트 중...'}</p>
        )}
      </div>

      {/* 테스트 섹션 */}
      <div className="mb-8 bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">테스트</h2>
        <div className="space-x-4">
          <button
            onClick={testTrackView}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            테스트 조회수 추가
          </button>
          <button
            onClick={() => {
              testConnection();
              fetchData();
            }}
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
          >
            데이터 새로고침
          </button>
        </div>
        {testResult && (
          <div className="mt-4 p-4 bg-white rounded">
            <pre className="text-sm">{testResult}</pre>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">📊 최근 페이지 뷰 (총 {pageViews.length}개)</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {pageViews.length === 0 ? (
              <p className="text-gray-500">데이터가 없습니다</p>
            ) : (
              pageViews.map((view, idx) => (
                <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                  <div>캠페인: {view.campaign_id}</div>
                  <div>페이지: {view.page_url}</div>
                  <div>시간: {new Date(view.created_at).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">📈 캠페인 메트릭스</h2>
          <div className="space-y-2">
            {!metrics || metrics.length === 0 ? (
              <p className="text-gray-500">데이터가 없습니다</p>
            ) : (
              metrics.map((metric, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded">
                  <div className="font-bold">{metric.campaign_id}</div>
                  <div>조회수: {metric.views || 0}</div>
                  <div>전화 클릭: {metric.phone_clicks || 0}</div>
                  <div>폼 제출: {metric.form_submissions || 0}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-gray-100 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">🔧 환경 설정</h2>
        <div className="space-y-2 text-sm font-mono">
          <div>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 설정됨' : '❌ 없음'}</div>
          <div>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 없음'}</div>
          <div>SUPABASE_SERVICE_ROLE_KEY: {process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ 설정됨' : '❌ 없음'}</div>
        </div>
      </div>

      <div className="mt-8 bg-yellow-50 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">📝 문제 해결 방법</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Supabase 대시보드에서 SQL Editor 열기</li>
          <li><code className="bg-gray-200 px-2 py-1 rounded">database/fix-rls-permissions.sql</code> 내용 실행</li>
          <li>테이블이 없다면 <code className="bg-gray-200 px-2 py-1 rounded">database/campaign-tracking-schema.sql</code> 먼저 실행</li>
          <li>이 페이지 새로고침</li>
        </ol>
      </div>
    </div>
  );
}
