import React from 'react';

export default function MarketingSimplePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              마케팅 대시보드 (심플 버전)
            </h1>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 캘린더 섹션 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">콘텐츠 캘린더</h2>
            <div className="bg-gray-100 rounded-lg p-4 h-64 flex items-center justify-center">
              <p className="text-gray-500">캘린더 컴포넌트 영역</p>
            </div>
          </div>

          {/* 퍼널 섹션 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">마케팅 퍼널</h2>
            <div className="bg-gray-100 rounded-lg p-4 h-64 flex items-center justify-center">
              <p className="text-gray-500">퍼널 컴포넌트 영역</p>
            </div>
          </div>

          {/* AI 생성 섹션 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">AI 콘텐츠 생성</h2>
            <div className="bg-gray-100 rounded-lg p-4 h-64 flex items-center justify-center">
              <p className="text-gray-500">AI 생성 컴포넌트 영역</p>
            </div>
          </div>

          {/* SEO 검증 섹션 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">SEO 검증</h2>
            <div className="bg-gray-100 rounded-lg p-4 h-64 flex items-center justify-center">
              <p className="text-gray-500">SEO 검증 컴포넌트 영역</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}