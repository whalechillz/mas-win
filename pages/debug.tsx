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
    logs: [],
    additionalInfo: {}
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
      // 핵심 테이블
      'content_ideas',
      'monthly_themes',
      'marketing_campaigns',
      'contacts',
      // 블로그 관련
      'blog_contents',
      'blog_platforms',
      'content_categories',
      'team_members',
      // 예약 관련
      'bookings',
      'quiz_results',
      // 추가 가능한 테이블들
      'marketing_funnel_stages',
      'annual_marketing_plans',
      'integrated_campaign_dashboard',
      'campaign_summary',
      'contacts_with_quiz',
      'bookings_with_quiz'
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
          addLog(`${table} 테이블 없음: ${error.message}`, 'error');
        } else {
          tableStatus[table] = `✅ 존재 (${count || 0}개)`;
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
        .select('*')
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate);
      
      if (error) throw error;
      
      // 상태별 카운트도 추가
      const counts = {
        total: data?.length || 0,
        blog: data?.filter(d => d.platform === 'blog').length || 0,
        kakao: data?.filter(d => d.platform === 'kakao').length || 0,
        sms: data?.filter(d => d.platform === 'sms').length || 0,
        instagram: data?.filter(d => d.platform === 'instagram').length || 0,
        youtube: data?.filter(d => d.platform === 'youtube').length || 0,
        // 상태별
        byStatus: {
          idea: data?.filter(d => d.status === 'idea').length || 0,
          writing: data?.filter(d => d.status === 'writing').length || 0,
          ready: data?.filter(d => d.status === 'ready').length || 0,
          published: data?.filter(d => d.status === 'published').length || 0,
          deleted: data?.filter(d => d.status === 'deleted').length || 0
        }
      };
      
      setDebugInfo(prev => ({ ...prev, contentCount: counts }));
      addLog(`${testYear}년 ${testMonth}월 콘텐츠: 총 ${counts.total}개`, 'success');
      
      // 상세 정보 저장
      setDebugInfo(prev => ({ 
        ...prev, 
        additionalInfo: { 
          ...prev.additionalInfo, 
          contentDetails: data 
        } 
      }));
    } catch (error) {
      addLog(`콘텐츠 카운트 실패: ${error.message}`, 'error');
    }
  };

  // 4. 권한 테스트 (직접 INSERT)
  const testPermissions = async () => {
    try {
      addLog('Supabase 권한 테스트 시작...');
      
      const testData = {
        title: `권한 테스트 ${new Date().getTime()}`,
        content: 'INSERT 권한 테스트용 콘텐츠',
        platform: 'blog',
        status: 'idea',
        assignee: '테스트',
        scheduled_date: `${testYear}-${String(testMonth).padStart(2, '0')}-15`,
        tags: '테스트,권한'
      };
      
      const { data, error } = await supabase
        .from('content_ideas')
        .insert([testData])
        .select();
      
      if (error) {
        addLog(`❌ INSERT 실패: ${error.message}`, 'error');
        addLog(`에러 코드: ${error.code}`, 'error');
        addLog(`에러 힌트: ${error.hint || '없음'}`, 'error');
        setDebugInfo(prev => ({ 
          ...prev, 
          errors: [...prev.errors, { test: 'permissions', error: error.message }]
        }));
      } else {
        addLog(`✅ INSERT 성공! ID: ${data[0].id}`, 'success');
        
        // 삽입된 데이터 삭제
        const { error: deleteError } = await supabase
          .from('content_ideas')
          .delete()
          .eq('id', data[0].id);
          
        if (deleteError) {
          addLog(`삭제 실패: ${deleteError.message}`, 'error');
        } else {
          addLog('테스트 데이터 삭제 완료', 'info');
        }
      }
    } catch (error) {
      addLog(`권한 테스트 에러: ${error.message}`, 'error');
    }
  };

  // 5. API 테스트
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
      
      const responseText = await response.text();
      let result;
      
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        result = { error: 'JSON 파싱 실패', response: responseText };
      }
      
      setDebugInfo(prev => ({ ...prev, apiTest: result }));
      
      if (result.success) {
        addLog(`API 테스트 성공: ${result.message}`, 'success');
        // 성공 후 카운트 다시 확인
        setTimeout(countContents, 1000);
      } else {
        addLog(`API 테스트 실패: ${result.error || '알 수 없는 오류'}`, 'error');
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

  // 6. 콘텐츠 삭제 (테스트용)
  const deleteTestContents = async () => {
    if (!confirm('정말로 7월 테스트 콘텐츠를 모두 삭제하시겠습니까?')) return;
    
    try {
      addLog('테스트 콘텐츠 삭제 시작...');
      const startDate = `${testYear}-${String(testMonth).padStart(2, '0')}-01`;
      const endDate = `${testYear}-${String(testMonth).padStart(2, '0')}-31`;
      
      const { data, error } = await supabase
        .from('content_ideas')
        .delete()
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .select();
      
      if (error) throw error;
      
      addLog(`테스트 콘텐츠 ${data?.length || 0}개 삭제 완료`, 'success');
      await countContents(); // 카운트 다시 확인
    } catch (error) {
      addLog(`삭제 실패: ${error.message}`, 'error');
    }
  };

  // 추가 정보 확인
  const checkAdditionalInfo = async () => {
    try {
      // 월별 테마 확인
      const { data: theme } = await supabase
        .from('monthly_themes')
        .select('*')
        .eq('year', testYear)
        .eq('month', testMonth)
        .single();
      
      setDebugInfo(prev => ({ 
        ...prev, 
        additionalInfo: { 
          ...prev.additionalInfo, 
          currentTheme: theme 
        } 
      }));
      
      if (theme) {
        addLog(`${testMonth}월 테마: ${theme.theme}`, 'info');
      }
    } catch (error) {
      addLog(`추가 정보 확인 실패: ${error.message}`, 'error');
    }
  };

  // 페이지 로드시 실행
  useEffect(() => {
    const runTests = async () => {
      setLoading(true);
      await testSupabaseConnection();
      await checkTables();
      await countContents();
      await checkAdditionalInfo();
      setLoading(false);
    };
    
    runTests();
  }, []);

  // 간단한 스타일 객체
  const styles = {
    container: { 
      minHeight: '100vh', 
      backgroundColor: '#f3f4f6', 
      padding: '16px',
      overflowX: 'auto'
    },
    wrapper: { 
      maxWidth: '1400px', 
      margin: '0 auto' 
    },
    card: { 
      backgroundColor: 'white', 
      borderRadius: '8px', 
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
      padding: '24px', 
      marginBottom: '24px' 
    },
    button: {
      padding: '8px 16px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '500'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>
          🔧 마케팅 시스템 디버그 페이지
        </h1>
        
        {/* 연결 상태 */}
        <div style={styles.card}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>1. 연결 상태</h2>
          <div style={{ lineHeight: '1.8' }}>
            <div>Supabase 연결: {debugInfo.supabaseConnection}</div>
            <div>환경: {process.env.NODE_ENV || 'production'}</div>
            <div>테스트 날짜: {testYear}년 {testMonth}월</div>
            <div>API URL: {typeof window !== 'undefined' ? window.location.origin : ''}/api/generate-multichannel-content</div>
          </div>
        </div>

        {/* 테이블 상태 */}
        <div style={styles.card}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
            2. 테이블 상태 (총 {Object.keys(debugInfo.tables).length}개 확인)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '8px' }}>
            {Object.entries(debugInfo.tables).map(([table, status]) => (
              <div key={table} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '8px 12px', 
                backgroundColor: status.includes('❌') ? '#fee2e2' : '#f0fdf4', 
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                <span style={{ fontFamily: 'monospace' }}>{table}</span>
                <span>{status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 콘텐츠 현황 */}
        <div style={styles.card}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
            3. {testYear}년 {testMonth}월 콘텐츠 현황
          </h2>
          
          {/* 플랫폼별 */}
          <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '12px' }}>플랫폼별</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {Object.entries(debugInfo.contentCount).filter(([key]) => key !== 'byStatus').map(([platform, count]) => (
              <div key={platform} style={{ 
                textAlign: 'center', 
                padding: '16px', 
                backgroundColor: count > 0 ? '#dbeafe' : '#f3f4f6', 
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{count}</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>{platform}</div>
              </div>
            ))}
          </div>
          
          {/* 상태별 */}
          {debugInfo.contentCount.byStatus && (
            <>
              <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '12px' }}>상태별</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
                {Object.entries(debugInfo.contentCount.byStatus).map(([status, count]) => (
                  <div key={status} style={{ 
                    textAlign: 'center', 
                    padding: '12px', 
                    backgroundColor: '#f9fafb', 
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}>
                    <div style={{ fontWeight: 'bold' }}>{count}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{status}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 월별 테마 정보 */}
        {debugInfo.additionalInfo.currentTheme && (
          <div style={styles.card}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
              📅 {testMonth}월 테마 정보
            </h2>
            <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '6px' }}>
              <div><strong>테마:</strong> {debugInfo.additionalInfo.currentTheme.theme}</div>
              <div><strong>설명:</strong> {debugInfo.additionalInfo.currentTheme.description || '-'}</div>
              <div><strong>목표:</strong> {debugInfo.additionalInfo.currentTheme.objective || '-'}</div>
              <div><strong>프로모션:</strong> {debugInfo.additionalInfo.currentTheme.promotion_details || '-'}</div>
            </div>
          </div>
        )}

        {/* 권한 및 API 테스트 */}
        <div style={styles.card}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>4. 권한 및 API 테스트</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={testPermissions}
              style={{ 
                ...styles.button,
                backgroundColor: '#f59e0b', 
                color: 'white'
              }}
            >
              🔓 권한 테스트 (INSERT)
            </button>
            
            <button
              onClick={testAPI}
              style={{ 
                ...styles.button,
                backgroundColor: '#2563eb', 
                color: 'white',
                opacity: loading ? 0.5 : 1
              }}
              disabled={loading}
            >
              📮 API 테스트 (콘텐츠 생성)
            </button>
          </div>
            
            {debugInfo.apiTest && (
              <pre style={{ 
                backgroundColor: '#f3f4f6', 
                padding: '16px', 
                borderRadius: '4px', 
                overflow: 'auto', 
                fontSize: '12px',
                marginTop: '16px',
                maxHeight: '300px'
              }}>
                {JSON.stringify(debugInfo.apiTest, null, 2)}
              </pre>
            )}
        </div>

        {/* 액션 버튼 */}
        <div style={styles.card}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>5. 테스트 액션</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => window.location.reload()}
              style={{ 
                ...styles.button,
                backgroundColor: '#6b7280', 
                color: 'white'
              }}
            >
              🔄 페이지 새로고침
            </button>
            
            <button
              onClick={countContents}
              style={{ 
                ...styles.button,
                backgroundColor: '#10b981', 
                color: 'white'
              }}
            >
              📊 콘텐츠 다시 카운트
            </button>
            
            <button
              onClick={deleteTestContents}
              style={{ 
                ...styles.button,
                backgroundColor: '#ef4444', 
                color: 'white'
              }}
            >
              🗑️ 7월 콘텐츠 모두 삭제
            </button>
            
            <button
              onClick={() => window.location.href = '/admin'}
              style={{ 
                ...styles.button,
                backgroundColor: '#8b5cf6', 
                color: 'white'
              }}
            >
              👤 Admin 페이지로 이동
            </button>
          </div>
        </div>

        {/* 로그 */}
        <div style={styles.card}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
            6. 실행 로그 ({debugInfo.logs.length}개)
          </h2>
          <div style={{ 
            backgroundColor: 'black', 
            color: 'white', 
            padding: '16px', 
            borderRadius: '4px', 
            fontFamily: 'monospace', 
            fontSize: '12px', 
            maxHeight: '400px', 
            overflow: 'auto' 
          }}>
            {debugInfo.logs.length === 0 ? (
              <div style={{ color: '#9ca3af' }}>로그가 비어있습니다...</div>
            ) : (
              debugInfo.logs.map((log, idx) => (
                <div key={idx} style={{ 
                  marginBottom: '4px',
                  color: log.type === 'error' ? '#f87171' : 
                        log.type === 'success' ? '#34d399' : 
                        '#d1d5db'
                }}>
                  [{log.timestamp}] {log.message}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 에러 목록 */}
        {debugInfo.errors.length > 0 && (
          <div style={{ ...styles.card, backgroundColor: '#fef2f2' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#dc2626' }}>
              ❌ 에러 목록 ({debugInfo.errors.length}개)
            </h2>
            <div>
              {debugInfo.errors.map((err, idx) => (
                <div key={idx} style={{ 
                  padding: '12px', 
                  backgroundColor: '#fee2e2', 
                  borderRadius: '4px', 
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>
                  <strong>{err.test}:</strong> {err.error}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 현재 콘텐츠 상세 */}
        {debugInfo.additionalInfo.contentDetails && debugInfo.additionalInfo.contentDetails.length > 0 && (
          <div style={styles.card}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
              📝 현재 7월 콘텐츠 상세 ({debugInfo.additionalInfo.contentDetails.length}개)
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>제목</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>플랫폼</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>상태</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>담당자</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>예정일</th>
                  </tr>
                </thead>
                <tbody>
                  {debugInfo.additionalInfo.contentDetails.map((content, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>{content.title}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>{content.platform}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>{content.status}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>{content.assignee}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                        {new Date(content.scheduled_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 추가 정보 */}
        <div style={{ ...styles.card, backgroundColor: '#f0f9ff' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>💡 디버그 요약</h3>
          <ul style={{ marginLeft: '20px', lineHeight: '1.8', fontSize: '14px' }}>
            <li>Supabase 연결 상태: {debugInfo.supabaseConnection}</li>
            <li>확인된 테이블 수: {Object.keys(debugInfo.tables).length}개</li>
            <li>누락된 테이블: {Object.entries(debugInfo.tables).filter(([_, status]) => status.includes('❌')).length}개</li>
            <li>7월 총 콘텐츠: {debugInfo.contentCount.total || 0}개</li>
            <li>
              플랫폼별 부족한 콘텐츠: 
              {debugInfo.contentCount.blog === 0 && ' blog(0)'}
              {debugInfo.contentCount.sms === 0 && ' sms(0)'}
            </li>
            <li>권장 작업: API 테스트 실행으로 부족한 콘텐츠 생성</li>
          </ul>
        </div>
      </div>
    </div>
  );
}