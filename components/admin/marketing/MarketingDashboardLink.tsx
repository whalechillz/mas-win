// 어드민 페이지를 원래대로 되돌리고 링크만 추가하는 버전
import React from 'react';
import { ExternalLink } from 'lucide-react';

const MarketingDashboardLink = () => {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">마케팅 대시보드</h2>
          <p className="text-gray-600 mb-6">
            새로운 마케팅 대시보드는 별도 페이지에서 이용하실 수 있습니다.
          </p>
          <div className="space-y-4">
            <a
              href="/marketing-enhanced"
              target="_blank"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-shadow"
            >
              마케팅 대시보드 열기
              <ExternalLink className="w-4 h-4" />
            </a>
            <p className="text-sm text-gray-500 mt-4">
              다크모드 지원 • AI 콘텐츠 생성 • SEO 검증 도구
            </p>
          </div>
        </div>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">콘텐츠 캘린더</h3>
            <p className="text-blue-700 text-sm">월별 콘텐츠 계획 관리</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-6">
            <h3 className="font-semibold text-purple-900 mb-2">마케팅 퍼널</h3>
            <p className="text-purple-700 text-sm">고객 여정 분석 및 최적화</p>
          </div>
          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="font-semibold text-green-900 mb-2">AI 콘텐츠 생성</h3>
            <p className="text-green-700 text-sm">AI 기반 콘텐츠 자동 생성</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-6">
            <h3 className="font-semibold text-orange-900 mb-2">SEO 검증</h3>
            <p className="text-orange-700 text-sm">네이버 SEO 최적화 도구</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingDashboardLink;