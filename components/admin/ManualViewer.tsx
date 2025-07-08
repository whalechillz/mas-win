import React, { useState } from 'react';
import { formatPhoneNumber } from '../../lib/formatters';

// 매뉴얼 섹션 컴포넌트
const ManualSection = ({ title, icon, children, isExpanded, onToggle }) => (
  <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <svg
        className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    {isExpanded && (
      <div className="px-6 pb-4 border-t">
        {children}
      </div>
    )}
  </div>
);

export default function ManualViewer() {
  const [expandedSections, setExpandedSections] = useState(['overview']);
  const [currentVersion] = useState('2025-07');
  
  const toggleSection = (sectionId) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">7월 썸머 스페셜 캠페인 매뉴얼</h1>
              <p className="text-sm text-gray-500 mt-1">버전 {currentVersion} · 최종 업데이트: 2025.07.08</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 text-gray-700 hover:text-gray-900">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              <button className="px-4 py-2 text-gray-700 hover:text-gray-900">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {/* 빠른 요약 */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">🔥 이번 달 핵심 포인트</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="font-semibold">상담만 해도</p>
              <p className="text-sm opacity-90">쿨링세트 무료 증정</p>
            </div>
            <div>
              <p className="font-semibold">구매 시</p>
              <p className="text-sm opacity-90">최대 로얄살루트 21년</p>
            </div>
            <div>
              <p className="font-semibold">선착순</p>
              <p className="text-sm opacity-90">7/31까지 20→0명</p>
            </div>
          </div>
        </div>

        {/* 섹션별 내용 */}
        <ManualSection
          title="캠페인 개요"
          icon="📋"
          isExpanded={expandedSections.includes('overview')}
          onToggle={() => toggleSection('overview')}
        >
          <div className="prose max-w-none pt-4">
            <h4 className="font-semibold mb-2">캠페인명</h4>
            <p className="text-gray-700 mb-4">7월 한정 썸머 스페셜 - 뜨거운 여름, 품격 있는 완벽한 스윙을 위한 준비</p>
            
            <h4 className="font-semibold mb-2">기간</h4>
            <p className="text-gray-700 mb-4">2025년 7월 1일 ~ 7월 31일 (선착순 20명)</p>
            
            <h4 className="font-semibold mb-2">핵심 메시지</h4>
            <ul className="list-disc pl-5 text-gray-700">
              <li>평균 25m 비거리 증가</li>
              <li>50-60대 골퍼 맞춤 설계</li>
              <li>일본산 프리미엄 티타늄 사용</li>
            </ul>
          </div>
        </ManualSection>

        <ManualSection
          title="사은품 정책"
          icon="🎁"
          isExpanded={expandedSections.includes('gifts')}
          onToggle={() => toggleSection('gifts')}
        >
          <div className="pt-4">
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-900 mb-2">기본 사은품 (전원)</h4>
              <p className="text-blue-800">고급 스포츠 쿨링 세트 (쿨링 타올 + 쿨토시)</p>
            </div>
            
            <h4 className="font-semibold mb-3">구매 사은품</h4>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-3 text-left">제품</th>
                  <th className="border p-3 text-left">가격</th>
                  <th className="border p-3 text-left">사은품</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-3">시크리트포스 V3</td>
                  <td className="border p-3">95만원</td>
                  <td className="border p-3">쿨링세트 + 발베니 12년</td>
                </tr>
                <tr>
                  <td className="border p-3">시크리트포스 PRO 3</td>
                  <td className="border p-3">115만원</td>
                  <td className="border p-3">쿨링세트 + 발렌타인 21년</td>
                </tr>
                <tr>
                  <td className="border p-3">시크리트웨폰 블랙</td>
                  <td className="border p-3">170만원</td>
                  <td className="border p-3">쿨링세트 + 로얄 살루트 21년</td>
                </tr>
              </tbody>
            </table>
          </div>
        </ManualSection>

        <ManualSection
          title="상담 스크립트"
          icon="📞"
          isExpanded={expandedSections.includes('scripts')}
          onToggle={() => toggleSection('scripts')}
        >
          <div className="space-y-4 pt-4">
            <div className="bg-gray-100 rounded-lg p-4">
              <h4 className="font-semibold mb-2">인바운드 응대</h4>
              <p className="text-gray-700 italic">
                "안녕하세요, MAS GOLF입니다.<br/>
                7월 썸머 스페셜 프로모션 진행 중입니다.<br/>
                지금 상담만 받으셔도 고급 쿨링 세트를 무료로 드리고 있습니다.<br/>
                어떤 도움을 드릴까요?"
              </p>
            </div>
            
            <div className="bg-gray-100 rounded-lg p-4">
              <h4 className="font-semibold mb-2">쿨링 세트 안내</h4>
              <p className="text-gray-700 italic">
                "전화 주신 것만으로도 여름 라운딩 필수품인<br/>
                쿨링 타올과 쿨토시 세트를 무료로 보내드립니다.<br/>
                주소 확인해 드릴까요?"
              </p>
            </div>
          </div>
        </ManualSection>

        {/* 더 많은 섹션들... */}
      </main>
    </div>
  );
}