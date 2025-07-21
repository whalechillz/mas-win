import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function DebugPage() {
  const [pageViews, setPageViews] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [testResult, setTestResult] = useState('');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 데이터 조회
  const fetchData = async () => {
    try {
      const { data: views, error: viewsError } = await supabase
        .from('page_views')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (viewsError) throw viewsError;
      setPageViews(views || []);

      const { data: metricsData, error: metricsError } = await supabase
        .from('campaign_metrics')
        .select('*');

      if (metricsError) throw metricsError;
      setMetrics(metricsData);

    } catch (error) {
      console.error('Error:', error);
      setTestResult(`에러: ${error.message}`);
    }
  };

  // 테스트 데이터 추가
  const testTrackView = async () => {
    try {
      const res = await fetch('/api/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: '2025-07',
          page: '/test'
        })
      });

      const data = await res.json();
      setTestResult(`API 응답: ${JSON.stringify(data)}`);
      
      // 데이터 다시 조회
      setTimeout(fetchData, 1000);
    } catch (error) {
      setTestResult(`에러: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">🔍 추적 시스템 디버그</h1>

      <div className="mb-8 bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">테스트</h2>
        <button
          onClick={testTrackView}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          테스트 조회수 추가
        </button>
        {testResult && (
          <div className="mt-4 p-4 bg-white rounded">
            <pre>{testResult}</pre>
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
        <div className="space-y-2 text-sm">
          <div>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 설정됨' : '❌ 없음'}</div>
          <div>Supabase Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 없음'}</div>
        </div>
      </div>

      <button
        onClick={fetchData}
        className="mt-4 bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
      >
        데이터 새로고침
      </button>
    </div>
  );
}
