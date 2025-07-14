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
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '16px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>
          🔧 마케팅 시스템 디버그 페이지
        </h1>
        
        {/* 연결 상태 */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>1. 연결 상태</h2>
          <div style={{ lineHeight: '1.8' }}>
            <div>Supabase 연결: {debugInfo.supabaseConnection}</div>
            <div>환경: {process.env.NODE_ENV}</div>
            <div>테스트 날짜: {testYear}년 {testMonth}월</div>
          </div>
        </div>

        {/* 테이블 상태 */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>2. 테이블 상태</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {Object.entries(debugInfo.tables).map(([table, status]) => (
              <div key={table} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                <span style={{ fontFamily: 'monospace' }}>{table}</span>
                <span>{status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 콘텐츠 현황 */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
            3. {testYear}년 {testMonth}월 콘텐츠 현황
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {Object.entries(debugInfo.contentCount).map(([platform, count]) => (
              <div key={platform} style={{ textAlign: 'center', padding: '16px', backgroundColor: '#dbeafe', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{count}</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>{platform}</div>
              </div>
            ))}
          </div>
        </div>

        {/* API 테스트 */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>4. API 테스트</h2>
          <div>
            <button
              onClick={testAPI}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#2563eb', 
                color: 'white', 
                borderRadius: '6px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
              disabled={loading}
            >
              API 테스트 실행
            </button>
            
            {debugInfo.apiTest && (
              <pre style={{ 
                backgroundColor: '#f3f4f6', 
                padding: '16px', 
                borderRadius: '4px', 
                overflow: 'auto', 
                fontSize: '14px',
                marginTop: '16px'
              }}>
                {JSON.stringify(debugInfo.apiTest, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>5. 테스트 액션</h2>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => window.location.reload()}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#6b7280', 
                color: 'white', 
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              🔄 페이지 새로고침
            </button>
            
            <button
              onClick={countContents}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#10b981', 
                color: 'white', 
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              📊 콘텐츠 다시 카운트
            </button>
            
            <button
              onClick={deleteTestContents}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#ef4444', 
                color: 'white', 
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              🗑️ 7월 콘텐츠 모두 삭제
            </button>
          </div>
        </div>

        {/* 로그 */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>6. 실행 로그</h2>
          <div style={{ 
            backgroundColor: 'black', 
            color: 'white', 
            padding: '16px', 
            borderRadius: '4px', 
            fontFamily: 'monospace', 
            fontSize: '14px', 
            maxHeight: '400px', 
            overflow: 'auto' 
          }}>
            {debugInfo.logs.map((log, idx) => (
              <div key={idx} style={{ 
                marginBottom: '4px',
                color: log.type === 'error' ? '#f87171' : 
                      log.type === 'success' ? '#34d399' : 
                      '#d1d5db'
              }}>
                [{log.timestamp}] {log.message}
              </div>
            ))}
          </div>
        </div>

        {/* 에러 목록 */}
        {debugInfo.errors.length > 0 && (
          <div style={{ backgroundColor: '#fef2f2', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#dc2626' }}>
              ❌ 에러 목록
            </h2>
            <div>
              {debugInfo.errors.map((err, idx) => (
                <div key={idx} style={{ padding: '12px', backgroundColor: '#fee2e2', borderRadius: '4px', marginBottom: '8px' }}>
                  <strong>{err.test}:</strong> {err.error}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 추가 정보 */}
        <div style={{ backgroundColor: '#f0f9ff', borderRadius: '8px', padding: '24px', marginTop: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>💡 디버그 정보</h3>
          <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
            <li>현재 7월에 총 4개의 콘텐츠가 있습니다 (kakao 1, instagram 1, youtube 1)</li>
            <li>blog와 sms 콘텐츠가 없습니다</li>
            <li>API 테스트를 실행하면 더 많은 콘텐츠가 생성됩니다</li>
            <li>모든 필요한 테이블이 존재합니다 ✅</li>
          </ul>
        </div>
      </div>
    </div>
  );
}