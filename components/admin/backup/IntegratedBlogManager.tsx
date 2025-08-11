import React, { useState } from 'react';

// 아이콘 컴포넌트들
const Layers = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3L3 9l9 6 9-6-9-6z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13l9 6 9-6M3 17l9 6 9-6" />
  </svg>
);

const Send = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const Globe = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

export const IntegratedBlogManager = ({ supabase }) => {
  const [activeTab, setActiveTab] = useState('pool'); // pool, naver, website
  const [selectedContent, setSelectedContent] = useState(null);
  const [contentPool, setContentPool] = useState([
    // 샘플 데이터
    {
      id: 1,
      title: "시니어 골퍼를 위한 드라이버 선택 가이드",
      status: "ready",
      keywords: ["시니어골프", "드라이버추천", "MASGOLF"],
      platforms: {
        naver: { status: "pending", accounts: ["mas9golf", "massgoogolf"] },
        website: { status: "scheduled", date: "2025-01-20" }
      }
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">통합 블로그 관리 시스템</h1>
          <p className="text-gray-600 mt-1">네이버 블로그와 자사몰 블로그를 한 곳에서 관리하세요</p>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('pool')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === 'pool' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Layers className="w-5 h-5" />
              글감 풀
            </button>
            <button
              onClick={() => setActiveTab('naver')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === 'naver' 
                  ? 'text-green-600 border-b-2 border-green-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="text-lg font-bold">N</span>
              네이버 발행
            </button>
            <button
              onClick={() => setActiveTab('website')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === 'website' 
                  ? 'text-purple-600 border-b-2 border-purple-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Globe className="w-5 h-5" />
              자사몰 발행
            </button>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="p-6">
            {activeTab === 'pool' && <ContentPoolView contentPool={contentPool} />}
            {activeTab === 'naver' && <NaverPublishView contentPool={contentPool} />}
            {activeTab === 'website' && <WebsitePublishView contentPool={contentPool} />}
          </div>
        </div>
      </div>
    </div>
  );
};

// 글감 풀 뷰
const ContentPoolView = ({ contentPool }) => (
  <div>
    <div className="mb-6 flex justify-between items-center">
      <h2 className="text-xl font-semibold">전체 글감 관리</h2>
      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        + 새 글감 추가
      </button>
    </div>

    <div className="space-y-4">
      {contentPool.map(content => (
        <div key={content.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-medium text-lg">{content.title}</h3>
              <div className="flex gap-2 mt-2">
                {content.keywords.map(keyword => (
                  <span key={keyword} className="px-2 py-1 bg-gray-100 text-sm rounded">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            <div className="ml-4 text-right">
              <div className="text-sm text-gray-600">발행 상태</div>
              <div className="flex gap-2 mt-1">
                {content.platforms.naver.status === 'pending' && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                    네이버 대기
                  </span>
                )}
                {content.platforms.website.status === 'scheduled' && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    자사몰 예약
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50">
              편집
            </button>
            <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
              네이버 발행
            </button>
            <button className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700">
              자사몰 발행
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// 네이버 발행 뷰 (수동 중심)
const NaverPublishView = ({ contentPool }) => (
  <div>
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-2">네이버 블로그 발행 가이드</h2>
      <p className="text-gray-600">네이버 정책에 따라 수동으로 발행해주세요</p>
    </div>

    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="font-medium">mas9golf (조)</h3>
        <p className="text-2xl font-bold mt-1">5개 대기</p>
      </div>
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium">massgoogolf (미)</h3>
        <p className="text-2xl font-bold mt-1">3개 대기</p>
      </div>
      <div className="bg-purple-50 p-4 rounded-lg">
        <h3 className="font-medium">massgoogolfkorea (싸)</h3>
        <p className="text-2xl font-bold mt-1">2개 대기</p>
      </div>
    </div>

    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <h4 className="font-medium mb-2">💡 네이버 발행 팁</h4>
      <ul className="text-sm space-y-1 text-gray-700">
        <li>• 오전 9-11시, 오후 2-4시 발행 권장</li>
        <li>• 이미지는 3-5장, 텍스트는 1500자 이상</li>
        <li>• 태그는 5-10개 사용</li>
        <li>• 발행 후 URL을 꼭 저장해주세요</li>
      </ul>
    </div>

    <div className="space-y-4">
      {contentPool.filter(c => c.platforms.naver.status === 'pending').map(content => (
        <div key={content.id} className="border rounded-lg p-4">
          <h3 className="font-medium">{content.title}</h3>
          <div className="mt-3 flex gap-2">
            <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
              발행 가이드 보기
            </button>
            <button className="px-3 py-1 border rounded text-sm hover:bg-gray-50">
              이미지 다운로드
            </button>
            <button className="px-3 py-1 border rounded text-sm hover:bg-gray-50">
              텍스트 복사
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// 자사몰 발행 뷰 (자동화 중심)
const WebsitePublishView = ({ contentPool }) => (
  <div>
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-2">자사몰 블로그 자동 발행</h2>
      <p className="text-gray-600">SEO 최적화된 콘텐츠를 자동으로 발행합니다</p>
    </div>

    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium">오늘 발행</h3>
        <p className="text-2xl font-bold mt-1">2개</p>
      </div>
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="font-medium">이번 주 예약</h3>
        <p className="text-2xl font-bold mt-1">5개</p>
      </div>
      <div className="bg-purple-50 p-4 rounded-lg">
        <h3 className="font-medium">총 발행</h3>
        <p className="text-2xl font-bold mt-1">127개</p>
      </div>
    </div>

    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <h4 className="font-medium mb-2">🚀 자동화 설정</h4>
      <div className="space-y-2 text-sm">
        <label className="flex items-center">
          <input type="checkbox" className="mr-2" defaultChecked />
          구글 SEO 메타태그 자동 생성
        </label>
        <label className="flex items-center">
          <input type="checkbox" className="mr-2" defaultChecked />
          이미지 자동 최적화 (WebP 변환)
        </label>
        <label className="flex items-center">
          <input type="checkbox" className="mr-2" defaultChecked />
          내부 링크 자동 생성
        </label>
        <label className="flex items-center">
          <input type="checkbox" className="mr-2" defaultChecked />
          XML 사이트맵 자동 업데이트
        </label>
      </div>
    </div>

    <div className="space-y-4">
      {contentPool.filter(c => c.platforms.website.status === 'scheduled').map(content => (
        <div key={content.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{content.title}</h3>
              <p className="text-sm text-gray-600 mt-1">
                예약: {content.platforms.website.date}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">
                즉시 발행
              </button>
              <button className="px-3 py-1 border rounded text-sm hover:bg-gray-50">
                일정 변경
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
