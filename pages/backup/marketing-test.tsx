import React, { useState } from 'react';
import { Calendar, Target, Brain, Search } from 'lucide-react';

export default function MarketingTestPage() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tabs = [
    { id: 'calendar', label: '콘텐츠 캘린더', icon: Calendar },
    { id: 'funnel', label: '마케팅 퍼널', icon: Target },
    { id: 'ai', label: 'AI 생성', icon: Brain },
    { id: 'seo', label: 'SEO 검증', icon: Search }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            마케팅 대시보드 (테스트 버전)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            버그 패치 중 - 기본 기능만 작동합니다
          </p>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <div className="bg-white border-b">
        <div className="px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* 에러 표시 */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* 탭 콘텐츠 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            {activeTab === 'calendar' && (
              <div>
                <h2 className="text-lg font-semibold mb-4">콘텐츠 캘린더</h2>
                <div className="grid grid-cols-7 gap-1">
                  {[...Array(31)].map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square border border-gray-200 rounded p-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="text-xs text-gray-500">{i + 1}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'funnel' && (
              <div>
                <h2 className="text-lg font-semibold mb-4">마케팅 퍼널</h2>
                <div className="space-y-4">
                  {['인지', '관심', '고려', '구매', '충성'].map((stage, index) => (
                    <div key={stage} className="flex items-center gap-4">
                      <div className="w-32 text-right font-medium">{stage}</div>
                      <div className="flex-1">
                        <div className="bg-gray-200 rounded-full h-8">
                          <div
                            className="bg-blue-500 h-full rounded-full"
                            style={{ width: `${100 - index * 20}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-20 text-sm text-gray-500">
                        {100 - index * 20}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div>
                <h2 className="text-lg font-semibold mb-4">AI 콘텐츠 생성</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      콘텐츠 유형
                    </label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                      <option>블로그 포스트</option>
                      <option>소셜 미디어</option>
                      <option>이메일 캠페인</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      주제
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="콘텐츠 주제 입력"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setLoading(true);
                      setTimeout(() => {
                        setLoading(false);
                        alert('AI 생성 기능은 준비 중입니다.');
                      }, 1000);
                    }}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    {loading ? '생성 중...' : 'AI 콘텐츠 생성'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'seo' && (
              <div>
                <h2 className="text-lg font-semibold mb-4">SEO 검증</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL 입력
                    </label>
                    <input
                      type="url"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="https://example.com"
                    />
                  </div>
                  <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                    SEO 검사 시작
                  </button>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-2">검사 항목</h3>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>✓ 메타 태그 검사</li>
                      <li>✓ 헤딩 구조 분석</li>
                      <li>✓ 키워드 밀도 확인</li>
                      <li>✓ 이미지 alt 텍스트</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 디버그 정보 */}
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2">디버그 정보</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ 페이지 로드 완료</li>
              <li>✅ React 컴포넌트 정상 작동</li>
              <li>✅ 탭 전환 기능 정상</li>
              <li>❌ 동적 컴포넌트 로드 비활성화</li>
              <li>❌ Supabase 연동 비활성화</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}