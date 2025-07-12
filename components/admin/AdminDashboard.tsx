import React from 'react';
import { useAuth } from '../lib/auth-context';
import { canAccess, canPerform } from '../lib/permissions';

export default function AdminDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">
          {isAdmin ? '관리자 대시보드' : '팀 대시보드'}
        </h1>

        {/* 주요 지표 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* 모든 사용자가 볼 수 있는 지표 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">오늘의 예약</h3>
            <p className="text-2xl font-bold mt-2">12건</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">신규 문의</h3>
            <p className="text-2xl font-bold mt-2">8건</p>
          </div>

          {/* 관리자만 볼 수 있는 지표 */}
          {isAdmin && (
            <>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">오늘 매출</h3>
                <p className="text-2xl font-bold mt-2">₩12,500,000</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">순이익률</h3>
                <p className="text-2xl font-bold mt-2">32.5%</p>
              </div>
            </>
          )}

          {/* 직원은 개인 성과만 표시 */}
          {!isAdmin && (
            <>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">내 처리 건수</h3>
                <p className="text-2xl font-bold mt-2">5건</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">목표 달성률</h3>
                <p className="text-2xl font-bold mt-2">85%</p>
              </div>
            </>
          )}
        </div>

        {/* 캠페인 섹션 */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">캠페인 관리</h2>
              {isAdmin && (
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                  새 캠페인 생성
                </button>
              )}
            </div>
          </div>
          <div className="p-6">
            {isAdmin ? (
              <p>모든 캠페인 목록 (전체 접근 권한)</p>
            ) : (
              <p>담당 캠페인만 표시됩니다</p>
            )}
          </div>
        </div>

        {/* 팀 성과 - 관리자만 */}
        {isAdmin && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">팀원별 성과</h2>
            </div>
            <div className="p-6">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 text-sm">
                    <th className="pb-3">팀원</th>
                    <th className="pb-3">처리 건수</th>
                    <th className="pb-3">매출 기여</th>
                    <th className="pb-3">전환율</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="py-3">제이</td>
                    <td className="py-3">24건</td>
                    <td className="py-3">₩45,000,000</td>
                    <td className="py-3">15.2%</td>
                  </tr>
                  <tr className="border-t">
                    <td className="py-3">스테피</td>
                    <td className="py-3">18건</td>
                    <td className="py-3">₩32,000,000</td>
                    <td className="py-3">12.8%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 시스템 설정 - 관리자만 */}
        {isAdmin && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">시스템 설정</h2>
            </div>
            <div className="p-6 space-y-4">
              <button className="w-full text-left p-4 hover:bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span>사용자 관리</span>
                  <span className="text-gray-400">→</span>
                </div>
              </button>
              <button className="w-full text-left p-4 hover:bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span>가격 설정</span>
                  <span className="text-gray-400">→</span>
                </div>
              </button>
              <button className="w-full text-left p-4 hover:bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span>데이터 내보내기</span>
                  <span className="text-gray-400">→</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}