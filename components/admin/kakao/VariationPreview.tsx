/**
 * 베리에이션 미리보기 컴포넌트
 * Phase 4.2: 선택한 날짜의 basePrompt 미리보기, 요일별 템플릿 선택 미리보기, 생성될 이미지 스타일 예상
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Sparkles, Eye } from 'lucide-react';

interface VariationPreviewProps {
  selectedDate?: string;
  accountType?: 'account1' | 'account2';
  onDateChange?: (date: string) => void;
}

interface PreviewData {
  date: string;
  accountType: 'account1' | 'account2';
  dayOfWeek: string;
  weekNumber: number;
  templateIndex: number;
  basePrompts: {
    background: string;
    profile: string;
    feed: string;
  };
  seasonalMood: string;
  monthPhaseMood: string;
}

export default function VariationPreview({
  selectedDate,
  accountType = 'account1',
  onDateChange
}: VariationPreviewProps) {
  const [previewDate, setPreviewDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);
  const [previewAccount, setPreviewAccount] = useState<'account1' | 'account2'>(accountType);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 날짜 변경 핸들러
  const handleDateChange = (date: string) => {
    setPreviewDate(date);
    if (onDateChange) {
      onDateChange(date);
    }
  };

  // 미리보기 데이터 로드
  useEffect(() => {
    const loadPreview = async () => {
      if (!previewDate) return;

      setIsLoading(true);
      try {
        // basePrompt 생성 API 호출
        const types = ['background', 'profile', 'feed'];
        const basePrompts: { background: string; profile: string; feed: string } = {
          background: '',
          profile: '',
          feed: ''
        };

        for (const type of types) {
          try {
            const response = await fetch('/api/kakao-content/generate-base-prompt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                date: previewDate,
                accountType: previewAccount,
                type
              })
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success && data.basePrompt) {
                basePrompts[type as keyof typeof basePrompts] = data.basePrompt;
              }
            }
          } catch (error) {
            console.error(`${type} basePrompt 로드 실패:`, error);
          }
        }

        // 날짜 정보 계산
        const dateObj = new Date(previewDate);
        const dayOfWeekIndex = dateObj.getDay();
        const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        const dayOfWeek = dayNames[dayOfWeekIndex];
        const dayOfMonth = dateObj.getDate();
        const weekNumber = Math.ceil(dayOfMonth / 7);
        const templateIndex = (weekNumber - 1) % 3;

        // 계절별 분위기
        const month = dateObj.getMonth() + 1;
        let seasonalMood = '';
        if (month >= 3 && month <= 5) {
          seasonalMood = '봄: 리듬과 부드러움';
        } else if (month >= 6 && month <= 8) {
          seasonalMood = '여름: 에너지와 거리';
        } else if (month >= 9 && month <= 11) {
          seasonalMood = '가을: 정확도와 균형';
        } else {
          seasonalMood = '겨울: 준비와 유지';
        }

        // 월 초/중/말 분위기
        let monthPhaseMood = '';
        if (dayOfMonth <= 10) {
          monthPhaseMood = '월 초: 새로운 시작, 활기찬 분위기';
        } else if (dayOfMonth <= 20) {
          monthPhaseMood = '월 중: 안정적, 균형잡힌 분위기';
        } else {
          monthPhaseMood = '월 말: 마무리, 성취감, 감사';
        }

        setPreviewData({
          date: previewDate,
          accountType: previewAccount,
          dayOfWeek,
          weekNumber,
          templateIndex: templateIndex + 1,
          basePrompts,
          seasonalMood,
          monthPhaseMood
        });
      } catch (error: any) {
        console.error('미리보기 데이터 로드 실패:', error);
        setPreviewData({
          date: previewDate,
          accountType: previewAccount,
          dayOfWeek: '오류',
          weekNumber: 0,
          templateIndex: 0,
          basePrompts: {
            background: `오류: ${error.message || '데이터 로드 실패'}`,
            profile: '',
            feed: ''
          },
          seasonalMood: '오류 발생',
          monthPhaseMood: '데이터를 불러올 수 없습니다'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPreview();
  }, [previewDate, previewAccount]);

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">베리에이션 미리보기</h3>
      </div>

      {/* 날짜 및 계정 선택 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            날짜
          </label>
          <input
            type="date"
            value={previewDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            계정
          </label>
          <select
            value={previewAccount}
            onChange={(e) => setPreviewAccount(e.target.value as 'account1' | 'account2')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="account1">Account 1 (시니어, 골드톤)</option>
            <option value="account2">Account 2 (하이테크, 블루톤)</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <Sparkles className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">미리보기 로딩 중...</p>
        </div>
      ) : previewData ? (
        <div className="space-y-4">
          {/* 날짜 정보 */}
          <div className="bg-white p-3 rounded border">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">요일:</span>{' '}
                <span className="text-gray-900">{previewData.dayOfWeek}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">주차:</span>{' '}
                <span className="text-gray-900">{previewData.weekNumber}주차</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">템플릿 인덱스:</span>{' '}
                <span className="text-gray-900">{previewData.templateIndex}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">계정:</span>{' '}
                <span className="text-gray-900">
                  {previewData.accountType === 'account1' ? 'Account 1 (골드톤)' : 'Account 2 (블루톤)'}
                </span>
              </div>
            </div>
          </div>

          {/* 분위기 정보 */}
          <div className="bg-white p-3 rounded border">
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">계절 분위기:</span>{' '}
                <span className="text-gray-900">{previewData.seasonalMood}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">월별 분위기:</span>{' '}
                <span className="text-gray-900">{previewData.monthPhaseMood}</span>
              </div>
            </div>
          </div>

          {/* Base Prompts */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">생성될 Base Prompts:</h4>
            
            <div className="bg-white p-3 rounded border">
              <div className="text-xs font-medium text-gray-600 mb-1">배경 이미지</div>
              <div className="text-sm text-gray-900">{previewData.basePrompts.background || '로딩 중...'}</div>
            </div>

            <div className="bg-white p-3 rounded border">
              <div className="text-xs font-medium text-gray-600 mb-1">프로필 이미지</div>
              <div className="text-sm text-gray-900">{previewData.basePrompts.profile || '로딩 중...'}</div>
            </div>

            <div className="bg-white p-3 rounded border">
              <div className="text-xs font-medium text-gray-600 mb-1">피드 이미지</div>
              <div className="text-sm text-gray-900">{previewData.basePrompts.feed || '로딩 중...'}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          날짜를 선택하면 미리보기가 표시됩니다.
        </div>
      )}
    </div>
  );
}

