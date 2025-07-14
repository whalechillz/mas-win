import React from 'react';
import { Calendar, Target, Users, TrendingUp, Eye } from 'lucide-react';

// 통합 마케팅 캠페인 관리 UI 개선안
export const ImprovedCampaignUI = () => {
  return (
    <div className="space-y-6">
      {/* 1. 월별 테마 카드 - 더 시각적으로 강조 */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">🎄 연말 고객 감사</h2>
            <p className="text-gray-600 italic mb-4">"한 해의 감사를 전하는 특별한 선물"</p>
            
            {/* 핵심 정보를 아이콘과 함께 표시 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-xs text-gray-500">목표</p>
                  <p className="text-sm font-medium">충성 고객 유지</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500">타겟</p>
                  <p className="text-sm font-medium">VIP/단골 고객</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xs text-gray-500">캠페인 수</p>
                  <p className="text-sm font-medium">5개 진행중</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-xs text-gray-500">총 도달</p>
                  <p className="text-sm font-medium">4,800명</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow">
              테마 편집
            </button>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              캠페인 추가
            </button>
          </div>
        </div>
      </div>

      {/* 2. 캠페인 목록 - 현재 테이블 유지하되 시각적 개선 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="font-semibold">12월 캠페인 목록</h3>
        </div>
        
        {/* 필터/정렬 옵션 추가 */}
        <div className="px-6 py-3 border-b flex gap-4">
          <select className="px-3 py-1 border rounded-lg text-sm">
            <option>전체 채널</option>
            <option>카카오톡</option>
            <option>문자</option>
            <option>네이버 블로그</option>
          </select>
          <select className="px-3 py-1 border rounded-lg text-sm">
            <option>날짜순</option>
            <option>담당자순</option>
            <option>상태순</option>
          </select>
        </div>
        
        {/* 기존 테이블 */}
        <table className="w-full">
          {/* 테이블 내용 */}
        </table>
      </div>

      {/* 3. 빠른 통계 (선택사항) */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">12</p>
          <p className="text-sm text-gray-600">총 캠페인</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-green-600">8</p>
          <p className="text-sm text-gray-600">완료</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-yellow-600">4</p>
          <p className="text-sm text-gray-600">진행중</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">96%</p>
          <p className="text-sm text-gray-600">달성률</p>
        </div>
      </div>
    </div>
  );
};
