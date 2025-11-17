/**
 * 베리에이션 테스트 패널 컴포넌트
 * Phase 3.3: 베리에이션 테스트 실행 및 결과 시각화
 */

'use client';

import React, { useState } from 'react';
import { TestTube, Play, CheckCircle, XCircle, AlertTriangle, BarChart3, Calendar } from 'lucide-react';

interface VariationTestPanelProps {
  onTestComplete?: (results: any) => void;
}

interface TestResult {
  success: boolean;
  testType: string;
  dateRange?: { start: string; end: string };
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  variationScore: number;
  statistics: {
    uniqueBasePrompts: number;
    totalGenerated: number;
    dayVariations: Record<string, number>;
    weekVariations: Record<string, number>;
    templateRotation: {
      correct: number;
      incorrect: number;
      missing: number;
    };
  };
  details: Array<{
    date: string;
    accountType: string;
    type: string;
    dayOfWeek?: string;
    weekNumber?: number;
    status: 'pass' | 'fail' | 'warning' | 'error';
    actualBasePrompt?: string;
    expectedBasePrompt?: string;
    reason?: string;
    error?: string;
  }>;
  fullDetailsCount: number;
}

export default function VariationTestPanel({ onTestComplete }: VariationTestPanelProps) {
  const [testType, setTestType] = useState<'date_range' | 'weekly' | 'template_rotation' | 'full'>('full');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [accountType, setAccountType] = useState<'account1' | 'account2' | 'both'>('both');
  const [type, setType] = useState<'background' | 'profile' | 'feed' | 'all'>('all');
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunTest = async () => {
    setIsRunning(true);
    setError(null);
    setTestResult(null);

    try {
      const response = await fetch('/api/kakao-content/variation-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testType,
          startDate: testType === 'date_range' ? startDate : undefined,
          endDate: testType === 'date_range' ? endDate : undefined,
          accountType,
          type
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setTestResult(data);
      
      if (onTestComplete) {
        onTestComplete(data);
      }
    } catch (err: any) {
      setError(err.message || '테스트 실행 중 오류가 발생했습니다.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-white">
      <div className="flex items-center gap-2 mb-6">
        <TestTube className="w-6 h-6 text-purple-600" />
        <h3 className="text-xl font-semibold text-gray-800">베리에이션 테스트</h3>
      </div>

      {/* 테스트 설정 */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            테스트 유형
          </label>
          <select
            value={testType}
            onChange={(e) => setTestType(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isRunning}
          >
            <option value="full">전체 (이번 달 전체)</option>
            <option value="weekly">주간 (최근 4주)</option>
            <option value="date_range">날짜 범위</option>
            <option value="template_rotation">템플릿 로테이션만</option>
          </select>
        </div>

        {testType === 'date_range' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                시작 날짜
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isRunning}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                종료 날짜
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isRunning}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              계정
            </label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isRunning}
            >
              <option value="account1">Account 1 (시니어)</option>
              <option value="account2">Account 2 (하이테크)</option>
              <option value="both">Both (둘 다)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              타입
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isRunning}
            >
              <option value="all">All (모두)</option>
              <option value="background">Background</option>
              <option value="profile">Profile</option>
              <option value="feed">Feed</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleRunTest}
          disabled={isRunning || (testType === 'date_range' && (!startDate || !endDate))}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRunning ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>테스트 실행 중...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              <span>테스트 실행</span>
            </>
          )}
        </button>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">오류</span>
          </div>
          <p className="mt-1 text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* 테스트 결과 */}
      {testResult && (
        <div className="space-y-6">
          {/* 요약 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              테스트 요약
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{testResult.summary.totalTests}</div>
                <div className="text-xs text-gray-600">전체 테스트</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{testResult.summary.passed}</div>
                <div className="text-xs text-gray-600">통과</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{testResult.summary.warnings}</div>
                <div className="text-xs text-gray-600">경고</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{testResult.summary.failed}</div>
                <div className="text-xs text-gray-600">실패</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{testResult.variationScore}%</div>
                <div className="text-xs text-gray-600">베리에이션 점수</div>
              </div>
            </div>
          </div>

          {/* 통계 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">베리에이션 통계</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600">고유 BasePrompt</div>
                <div className="text-lg font-semibold text-gray-900">
                  {testResult.statistics.uniqueBasePrompts}개
                </div>
              </div>
              <div>
                <div className="text-gray-600">생성된 항목</div>
                <div className="text-lg font-semibold text-gray-900">
                  {testResult.statistics.totalGenerated}개
                </div>
              </div>
              <div>
                <div className="text-gray-600">템플릿 로테이션 정확</div>
                <div className="text-lg font-semibold text-green-600">
                  {testResult.statistics.templateRotation.correct}개
                </div>
              </div>
              <div>
                <div className="text-gray-600">템플릿 로테이션 누락</div>
                <div className="text-lg font-semibold text-red-600">
                  {testResult.statistics.templateRotation.missing}개
                </div>
              </div>
            </div>
          </div>

          {/* 요일별 변형 */}
          {Object.keys(testResult.statistics.dayVariations).length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                요일별 변형 수
              </h4>
              <div className="grid grid-cols-7 gap-2 text-sm">
                {['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'].map((day) => (
                  <div key={day} className="text-center">
                    <div className="text-xs text-gray-600">{day}</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {testResult.statistics.dayVariations[day] || 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 상세 결과 (처음 20개만 표시) */}
          {testResult.details.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">상세 결과 (최대 20개)</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {testResult.details.slice(0, 20).map((detail, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded border ${
                      detail.status === 'pass'
                        ? 'bg-green-50 border-green-200'
                        : detail.status === 'warning'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {detail.status === 'pass' ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : detail.status === 'warning' ? (
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            {detail.date} - {detail.accountType} - {detail.type}
                          </span>
                        </div>
                        {detail.dayOfWeek && (
                          <div className="text-xs text-gray-600">
                            {detail.dayOfWeek} ({detail.weekNumber}주차, 템플릿 {detail.expectedTemplateIndex})
                          </div>
                        )}
                        {detail.actualBasePrompt && (
                          <div className="text-xs text-gray-700 mt-1">
                            <strong>실제:</strong> {detail.actualBasePrompt.substring(0, 60)}...
                          </div>
                        )}
                        {detail.reason && (
                          <div className="text-xs text-yellow-700 mt-1">{detail.reason}</div>
                        )}
                        {detail.error && (
                          <div className="text-xs text-red-700 mt-1">{detail.error}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {testResult.fullDetailsCount > 20 && (
                <div className="mt-2 text-sm text-gray-600 text-center">
                  ... 외 {testResult.fullDetailsCount - 20}개 항목 (API 응답에서 확인 가능)
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}





