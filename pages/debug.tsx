import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트
const supabaseUrl = 'https://yyytjudftvpmcnppaymw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHZwbWNucHBheW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDcxMTksImV4cCI6MjA2NzAyMzExOX0.TxT-vnDjFip_CCL7Ag8mR7G59dMdQAKfPLY1S3TJqRE';

const supabase = createClient(supabaseUrl, supabaseKey);

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState({
    supabaseConnection: 'testing...',
    tables: {},
    contentCount: {},
    apiTest: null,
    errors: [],
    logs: []
  });
  
  const [loading, setLoading] = useState(true);
  const [testYear] = useState(2025);
  const [testMonth] = useState(7);

  // 로그 추가 함수
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => ({
      ...prev,
      logs: [...prev.logs, { timestamp, message, type }]
    }));
  };

  // 1. Supabase 연결 테스트
  const testSupabaseConnection = async () => {
    try {
      addLog('Supabase 연결 테스트 시작...');
      const { data, error } = await supabase.from('content_ideas').select('count', { count: 'exact', head: true });
      
      if (error) throw error;
      
      setDebugInfo(prev => ({ ...prev, supabaseConnection: '✅ 연결됨' }));
      addLog('Supabase 연결 성공', 'success');
    } catch (error) {
      setDebugInfo(prev => ({ 
        ...prev, 
        supabaseConnection: '❌ 연결 실패',
        errors: [...prev.errors, { test: 'supabase', error: error.message }]
      }));
      addLog(`Supabase 연결 실패: ${error.message}`, 'error');
    }
  };

  // 2. 테이블 존재 확인
  const checkTables = async () => {
    const tablesToCheck = [
      'content_ideas',
      'monthly_themes',
      'marketing_campaigns',
      'contacts',
      'blog_contents',
      'blog_platforms',
      'content_categories',
      'team_members',
      'bookings'
    ];

    const tableStatus = {};
    
    for (const table of tablesToCheck) {
      try {
        addLog(`테이블 확인: ${table}`);
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          tableStatus[table] = '❌ 없음';
          addLog(`${table} 테이블 없음`, 'error');
        } else {
          tableStatus[table] = `✅ 존재 (${count || 0}개 레코드)`;
          addLog(`${table} 테이블 확인 완료 (${count || 0}개)`, 'success');
        }
      } catch (error) {
        tableStatus[table] = '❌ 에러';
        addLog(`${table} 테이블 에러: ${error.message}`, 'error');
      }
    }
    
    setDebugInfo(prev => ({ ...prev, tables: tableStatus }));
  };

  // 3. 콘텐츠 카운트
  const countContents = async () => {
    try {
      addLog('콘텐츠 카운트 시작...');
      const startDate = `${testYear}-${String(testMonth).padStart(2, '0')}-01`;
      const endDate = `${testYear}-${String(testMonth).padStart(2, '0')}-31`;
      
      const { data, error } = await supabase
        .from('content_ideas')
        .select('platform')
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .neq('status', 'deleted');
      
      if (error) throw error;
      
      const counts = {
        total: data?.length || 0,
        blog: data?.filter(d => d.platform === 'blog').length || 0,
        kakao: data?.filter(d => d.platform === 'kakao').length || 0,
        sms: data?.filter(d => d.platform === 'sms').length || 0,
        instagram: data?.filter(d => d.platform === 'instagram').length || 0,
        youtube: data?.filter(d => d.platform === 'youtube').length || 0
      };
      
      setDebugInfo(prev => ({ ...prev, contentCount: counts }));
      addLog(`${testYear}년 ${testMonth}월 콘텐츠: 총 ${counts.total}개`, 'success');
    } catch (error) {
      addLog(`콘텐츠 카운트 실패: ${error.message}`, 'error');
    }
  };

  // 4. API 테스트
  const testAPI = async () => {
    try {
      addLog('API 테스트 시작...');
      const response = await fetch('/api/generate-multichannel-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: testYear,
          month: testMonth,
          selectedChannels: {
            blog: true,
            kakao: true,
            sms: true,
            instagram: true,
            youtube: true
          }
        })
      });
      
      const result = await response.json();
      
      setDebugInfo(prev => ({ ...prev, apiTest: result }));
      
      if (result.success) {
        addLog(`API 테스트 성공: ${result.message}`, 'success');
      } else {
        addLog(`API 테스트 실패: ${result.error}`, 'error');
      }
    } catch (error) {
      setDebugInfo(prev => ({ 
        ...prev, 
        apiTest: { error: error.message },
        errors: [...prev.errors, { test: 'api', error: error.message }]
      }));
      addLog(`API 테스트 에러: ${error.message}`, 'error');
    }
  };

  // 5. 콘텐츠 삭제 (테스트용)
  const deleteTestContents = async () => {
    if (!confirm('정말로 7월 테스트 콘텐츠를 모두 삭제하시겠습니까?')) return;
    
    try {
      addLog('테스트 콘텐츠 삭제 시작...');
      const startDate = `${testYear}-${String(testMonth).padStart(2, '0')}-01`;
      const endDate = `${testYear}-${String(testMonth).padStart(2, '0')}-31`;
      
      const { error } = await supabase
        .from('content_ideas')
        .delete()
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate);
      
      if (error) throw error;
      
      addLog('테스트 콘텐츠 삭제 완료', 'success');
      await countContents(); // 카운트 다시 확인
    } catch (error) {
      addLog(`삭제 실패: ${error.message}`, 'error');
    }
  };

  // 페이지 로드시 실행
  useEffect(() => {
    const runTests = async () => {
      setLoading(true);
      await testSupabaseConnection();
      await checkTables();
      await countContents();
      setLoading(false);
    };
    
    runTests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔧 마케팅 시스템 디버그 페이지</h1>
        
        {/* 연결 상태 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">1. 연결 상태</h2>
          <div className="space-y-2">
            <div>Supabase 연결: {debugInfo.supabaseConnection}</div>
            <div>환경: {process.env.NODE_ENV}</div>
            <div>테스트 날짜: {testYear}년 {testMonth}월</div>
          </div>
        </div>

        {/* 테이블 상태 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">2. 테이블 상태</h2>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(debugInfo.tables).map(([table, status]) => (
              <div key={table} className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="font-mono">{table}</span>
                <span>{status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 콘텐츠 현황 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">3. {testYear}년 {testMonth}월 콘텐츠 현황</h2>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(debugInfo.contentCount).map(([platform, count]) => (
              <div key={platform} className="text-center p-4 bg-blue-50 rounded">
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-gray-600">{platform}</div>
              </div>
            ))}
          </div>
        </div>

        {/* API 테스트 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">4. API 테스트</h2>
          <div className="space-y-4">
            <button
              onClick={testAPI}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={loading}
            >
              API 테스트 실행
            </button>
            
            {debugInfo.apiTest && (
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                {JSON.stringify(debugInfo.apiTest, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">5. 테스트 액션</h2>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              🔄 페이지 새로고침
            </button>
            
            <button
              onClick={countContents}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              📊 콘텐츠 다시 카운트
            </button>
            
            <button
              onClick={deleteTestContents}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              🗑️ 7월 콘텐츠 모두 삭제
            </button>
          </div>
        </div>

        {/* 로그 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">6. 실행 로그</h2>
          <div className="bg-black text-white p-4 rounded font-mono text-sm max-h-96 overflow-auto">
            {debugInfo.logs.map((log, idx) => (
              <div key={idx} className={`mb-1 ${
                log.type === 'error' ? 'text-red-400' : 
                log.type === 'success' ? 'text-green-400' : 
                'text-gray-300'
              }`}>
                [{log.timestamp}] {log.message}
              </div>
            ))}
          </div>
        </div>

        {/* 에러 목록 */}
        {debugInfo.errors.length > 0 && (
          <div className="bg-red-50 rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4 text-red-700">❌ 에러 목록</h2>
            <div className="space-y-2">
              {debugInfo.errors.map((err, idx) => (
                <div key={idx} className="p-3 bg-red-100 rounded">
                  <strong>{err.test}:</strong> {err.error}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}