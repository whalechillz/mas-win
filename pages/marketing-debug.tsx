import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// 컴포넌트별 로딩 상태 추적
const ComponentLoader = ({ name, children }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      setLoaded(true);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return (
    <div className="border rounded-lg p-4 mb-4">
      <h3 className="font-medium mb-2">{name}</h3>
      {error ? (
        <div className="text-red-600 text-sm">❌ 에러: {error}</div>
      ) : loaded ? (
        <div>
          <div className="text-green-600 text-sm mb-2">✅ 로드 완료</div>
          {children}
        </div>
      ) : (
        <div className="text-gray-500 text-sm">⏳ 로딩 중...</div>
      )}
    </div>
  );
};

// 동적 컴포넌트 로더들
const DynamicBlogCalendar = dynamic(
  () => import('../components/admin/marketing/BlogCalendar').catch(err => {
    console.error('BlogCalendar 로드 실패:', err);
    return () => <div className="text-red-600">BlogCalendar 로드 실패</div>;
  }),
  { 
    ssr: false,
    loading: () => <div>BlogCalendar 로딩 중...</div>
  }
);

const DynamicMarketingFunnelPlan = dynamic(
  () => import('../components/admin/marketing/MarketingFunnelPlan').catch(err => {
    console.error('MarketingFunnelPlan 로드 실패:', err);
    return () => <div className="text-red-600">MarketingFunnelPlan 로드 실패</div>;
  }),
  { 
    ssr: false,
    loading: () => <div>MarketingFunnelPlan 로딩 중...</div>
  }
);

const DynamicAIGenerationSettingsNew = dynamic(
  () => import('../components/admin/marketing/AIGenerationSettingsNew').catch(err => {
    console.error('AIGenerationSettingsNew 로드 실패:', err);
    return () => <div className="text-red-600">AIGenerationSettingsNew 로드 실패</div>;
  }),
  { 
    ssr: false,
    loading: () => <div>AIGenerationSettingsNew 로딩 중...</div>
  }
);

const DynamicNaverSEOValidator = dynamic(
  () => import('../components/admin/marketing/NaverSEOValidator').catch(err => {
    console.error('NaverSEOValidator 로드 실패:', err);
    return () => <div className="text-red-600">NaverSEOValidator 로드 실패</div>;
  }),
  { 
    ssr: false,
    loading: () => <div>NaverSEOValidator 로딩 중...</div>
  }
);

export default function MarketingDebugPage() {
  const [testComponent, setTestComponent] = useState('none');
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    setPageLoaded(true);
    console.log('마케팅 디버그 페이지 로드 완료');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">마케팅 대시보드 디버그 페이지</h1>
        
        {/* 페이지 상태 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">페이지 상태</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {pageLoaded ? '✅' : '⏳'} 페이지 로드 상태: {pageLoaded ? '완료' : '로딩 중'}
            </div>
            <div className="flex items-center gap-2">
              ✅ React 버전: {React.version}
            </div>
            <div className="flex items-center gap-2">
              ✅ 브라우저: {typeof window !== 'undefined' ? '클라이언트' : '서버'}
            </div>
          </div>
        </div>

        {/* 컴포넌트 테스트 선택 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">컴포넌트 테스트</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">테스트할 컴포넌트 선택:</label>
              <select 
                value={testComponent}
                onChange={(e) => setTestComponent(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="none">선택하세요</option>
                <option value="calendar">BlogCalendar</option>
                <option value="funnel">MarketingFunnelPlan</option>
                <option value="ai">AIGenerationSettingsNew</option>
                <option value="seo">NaverSEOValidator</option>
                <option value="all">모든 컴포넌트</option>
              </select>
            </div>

            {/* 개별 컴포넌트 테스트 */}
            {testComponent === 'calendar' && (
              <ComponentLoader name="BlogCalendar">
                <DynamicBlogCalendar />
              </ComponentLoader>
            )}
            
            {testComponent === 'funnel' && (
              <ComponentLoader name="MarketingFunnelPlan">
                <DynamicMarketingFunnelPlan />
              </ComponentLoader>
            )}
            
            {testComponent === 'ai' && (
              <ComponentLoader name="AIGenerationSettingsNew">
                <DynamicAIGenerationSettingsNew />
              </ComponentLoader>
            )}
            
            {testComponent === 'seo' && (
              <ComponentLoader name="NaverSEOValidator">
                <DynamicNaverSEOValidator />
              </ComponentLoader>
            )}

            {testComponent === 'all' && (
              <div>
                <ComponentLoader name="BlogCalendar">
                  <DynamicBlogCalendar />
                </ComponentLoader>
                <ComponentLoader name="MarketingFunnelPlan">
                  <DynamicMarketingFunnelPlan />
                </ComponentLoader>
                <ComponentLoader name="AIGenerationSettingsNew">
                  <DynamicAIGenerationSettingsNew />
                </ComponentLoader>
                <ComponentLoader name="NaverSEOValidator">
                  <DynamicNaverSEOValidator />
                </ComponentLoader>
              </div>
            )}
          </div>
        </div>

        {/* 콘솔 로그 모니터 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">디버그 로그</h2>
          <div className="bg-gray-100 rounded p-4 font-mono text-sm">
            <p>콘솔을 확인하여 에러 메시지를 확인하세요.</p>
            <p className="mt-2">개발자 도구: F12 → Console 탭</p>
          </div>
        </div>

        {/* 빠른 링크 */}
        <div className="mt-6 flex gap-4">
          <a 
            href="/marketing-test" 
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            간단한 테스트 페이지
          </a>
          <a 
            href="/admin" 
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            어드민 대시보드
          </a>
          <a 
            href="/marketing-enhanced" 
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            원본 마케팅 페이지
          </a>
        </div>
      </div>
    </div>
  );
}