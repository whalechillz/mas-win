'use client';

import React, { useState } from 'react';
import { FileText, Sparkles, Image as ImageIcon, MessageSquare, Edit2, Save, X, RotateCcw, Loader } from 'lucide-react';

interface PromptInspectorProps {
  calendarData?: any;
  selectedDate?: string;
  accountType: 'account1' | 'account2';
  type: 'background' | 'profile' | 'feed';
  onUpdate?: (updates: any) => void;
  onSave?: () => Promise<void>;
}

export default function PromptInspector({
  calendarData,
  selectedDate,
  accountType,
  type,
  onUpdate,
  onSave
}: PromptInspectorProps) {
  const todayStr = selectedDate || new Date().toISOString().split('T')[0];
  const [isEditingBasePrompt, setIsEditingBasePrompt] = useState(false);
  const [isEditingFinalPrompt, setIsEditingFinalPrompt] = useState(false);
  const [editedBasePrompt, setEditedBasePrompt] = useState('');
  const [editedFinalPrompt, setEditedFinalPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // 데이터 추출
  const accountData = calendarData?.profileContent?.[accountType];
  const schedule = accountData?.dailySchedule?.find((s: any) => s.date === todayStr);
  
  const getBasePrompt = () => {
    if (type === 'background') {
      return schedule?.background?.basePrompt || schedule?.background?.image || '없음';
    } else if (type === 'profile') {
      return schedule?.profile?.basePrompt || schedule?.profile?.image || '없음';
    } else {
      const feedData = calendarData?.kakaoFeed?.dailySchedule?.find((d: any) => d.date === todayStr);
      return feedData?.[accountType]?.basePrompt || feedData?.[accountType]?.imageCategory || '없음';
    }
  };

  const getFinalPrompt = () => {
    if (type === 'background') {
      return schedule?.background?.prompt || '없음';
    } else if (type === 'profile') {
      return schedule?.profile?.prompt || '없음';
    } else {
      const feedData = calendarData?.kakaoFeed?.dailySchedule?.find((d: any) => d.date === todayStr);
      return feedData?.[accountType]?.imagePrompt || '없음';
    }
  };

  const basePrompt = getBasePrompt();
  const finalPrompt = getFinalPrompt();

  const handleEditBasePrompt = () => {
    setEditedBasePrompt(basePrompt);
    setIsEditingBasePrompt(true);
  };

  const handleSaveBasePrompt = async () => {
    if (!onUpdate) return;
    
    setIsSaving(true);
    try {
      // calendarData 업데이트
      const updates: any = {
        date: todayStr,
        account: accountType,
        type: type
      };

      if (type === 'background' || type === 'profile') {
        updates[`${type}_base_prompt`] = editedBasePrompt;
      } else {
        updates.base_prompt = editedBasePrompt;
      }

      onUpdate(updates);
      
      if (onSave) {
        await onSave();
      }
      
      setIsEditingBasePrompt(false);
    } catch (error) {
      console.error('BasePrompt 저장 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegeneratePrompt = async () => {
    setIsRegenerating(true);
    try {
      const weeklyTheme = schedule?.weeklyTheme || calendarData?.profileContent?.[accountType]?.weeklyThemes?.week1 || '비거리의 감성 – 스윙과 마음의 연결';
      
      const response = await fetch('/api/kakao-content/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: editedBasePrompt || basePrompt,
          accountType: accountType,
          type: type,
          brandStrategy: {
            customerpersona: accountType === 'account1' ? 'senior_fitting' : 'tech_enthusiast',
            customerChannel: 'local_customers',
            brandWeight: accountType === 'account1' ? '높음' : '중간',
            audienceTemperature: 'warm'
          },
          weeklyTheme,
          date: todayStr
        })
      });

      const data = await response.json();
      if (data.success) {
        setEditedFinalPrompt(data.prompt);
        setIsEditingFinalPrompt(true);
        
        // 자동으로 저장
        if (onUpdate) {
          const updates: any = {
            date: todayStr,
            account: accountType,
            type: type
          };

          if (type === 'background' || type === 'profile') {
            updates[`${type}_prompt`] = data.prompt;
          } else {
            updates.image_prompt = data.prompt;
          }

          onUpdate(updates);
          
          if (onSave) {
            await onSave();
          }
        }
      }
    } catch (error) {
      console.error('프롬프트 재생성 오류:', error);
      alert('프롬프트 재생성 중 오류가 발생했습니다.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const getImageUrl = () => {
    if (type === 'background') {
      return schedule?.background?.imageUrl || null;
    } else if (type === 'profile') {
      return schedule?.profile?.imageUrl || null;
    } else {
      const feedData = calendarData?.kakaoFeed?.dailySchedule?.find((d: any) => d.date === todayStr);
      return feedData?.[accountType]?.imageUrl || null;
    }
  };

  const imageUrl = getImageUrl();

  const typeLabels = {
    background: '배경 이미지',
    profile: '프로필 이미지',
    feed: '피드 이미지'
  };

  const accountLabels = {
    account1: 'MAS GOLF ProWhale',
    account2: 'MASGOLF Tech'
  };

  return (
    <div className="mt-4 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-blue-600" />
        <h4 className="text-lg font-semibold text-gray-900">
          프롬프트 생성 과정: {accountLabels[accountType]} - {typeLabels[type]}
        </h4>
      </div>

      <div className="space-y-4">
        {/* 1단계: BasePrompt */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                1
              </div>
              <span className="font-medium text-gray-900">BasePrompt (기본 프롬프트)</span>
            </div>
            {!isEditingBasePrompt ? (
              <button
                onClick={handleEditBasePrompt}
                className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
                title="편집"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-1">
                <button
                  onClick={handleSaveBasePrompt}
                  disabled={isSaving}
                  className="p-1.5 hover:bg-green-100 rounded text-green-600 disabled:opacity-50"
                  title="저장"
                >
                  {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    setIsEditingBasePrompt(false);
                    setEditedBasePrompt('');
                  }}
                  className="p-1.5 hover:bg-red-100 rounded text-red-600"
                  title="취소"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          {isEditingBasePrompt ? (
            <textarea
              value={editedBasePrompt}
              onChange={(e) => setEditedBasePrompt(e.target.value)}
              className="w-full text-sm text-gray-900 mt-2 p-3 border border-blue-300 rounded bg-white resize-y min-h-[100px]"
              placeholder="BasePrompt를 입력하세요..."
            />
          ) : (
            <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{basePrompt}</p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            📍 출처: 요일별 템플릿 또는 수동 입력
          </p>
        </div>

        {/* 2단계: Modifiers */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm">
              2
            </div>
            <span className="font-medium text-gray-900">Modifiers (수정자)</span>
          </div>
          <div className="text-sm text-gray-700 mt-2 space-y-1">
            <p>• 계정 타입: {accountType === 'account1' ? '시니어 중심 감성형' : '하이테크 중심 혁신형'}</p>
            <p>• 이미지 타입: {typeLabels[type]}</p>
            <p>• 주별 테마: {schedule?.weeklyTheme || calendarData?.profileContent?.[accountType]?.weeklyThemes?.week1 || '비거리의 감성 – 스윙과 마음의 연결'}</p>
            {type === 'background' && (
              <p>• 사람 최소화: 배경 이미지에는 사람을 최소화하여 생성</p>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            📍 출처: 브랜드 전략 및 계정 설정
          </p>
        </div>

        {/* 3단계: AI Prompt Generation */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold text-sm">
              3
            </div>
            <span className="font-medium text-gray-900">AI 프롬프트 생성</span>
          </div>
          <p className="text-sm text-gray-700 mt-2">
            GPT-4o-mini가 BasePrompt와 Modifiers를 조합하여 최종 영어 프롬프트를 생성합니다.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            📍 API: <code className="bg-gray-200 px-1 rounded">/api/kakao-content/generate-prompt</code>
          </p>
        </div>

        {/* 4단계: Final Prompt */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">최종 프롬프트 (Final Prompt)</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRegeneratePrompt}
                disabled={isRegenerating}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                title="BasePrompt 기반으로 재생성"
              >
                {isRegenerating ? (
                  <>
                    <Loader className="w-3 h-3 animate-spin" />
                    <span>재생성 중...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3 h-3" />
                    <span>재생성</span>
                  </>
                )}
              </button>
              {!isEditingFinalPrompt ? (
                <button
                  onClick={() => {
                    setEditedFinalPrompt(finalPrompt);
                    setIsEditingFinalPrompt(true);
                  }}
                  className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
                  title="편집"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex gap-1">
                  <button
                    onClick={async () => {
                      if (onUpdate) {
                        const updates: any = {
                          date: todayStr,
                          account: accountType,
                          type: type
                        };

                        if (type === 'background' || type === 'profile') {
                          updates[`${type}_prompt`] = editedFinalPrompt;
                        } else {
                          updates.image_prompt = editedFinalPrompt;
                        }

                        onUpdate(updates);
                        
                        if (onSave) {
                          await onSave();
                        }
                      }
                      setIsEditingFinalPrompt(false);
                    }}
                    disabled={isSaving}
                    className="p-1.5 hover:bg-green-100 rounded text-green-600 disabled:opacity-50"
                    title="저장"
                  >
                    {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingFinalPrompt(false);
                      setEditedFinalPrompt('');
                    }}
                    className="p-1.5 hover:bg-red-100 rounded text-red-600"
                    title="취소"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
          {isEditingFinalPrompt ? (
            <textarea
              value={editedFinalPrompt}
              onChange={(e) => setEditedFinalPrompt(e.target.value)}
              className="w-full text-sm text-gray-900 mt-2 p-3 border border-blue-300 rounded bg-white font-mono resize-y min-h-[150px]"
              placeholder="최종 프롬프트를 입력하세요..."
            />
          ) : (
            <p className="text-sm text-gray-900 mt-2 whitespace-pre-wrap font-mono bg-white p-3 rounded border border-blue-200">
              {finalPrompt}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            📍 이 프롬프트가 FAL AI로 전달되어 이미지가 생성됩니다
          </p>
        </div>

        {/* 5단계: Image Generation */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-sm">
              4
            </div>
            <span className="font-medium text-gray-900">이미지 생성</span>
          </div>
          {imageUrl ? (
            <div className="mt-2">
              <img 
                src={imageUrl} 
                alt={`${typeLabels[type]} 생성 결과`}
                className="max-w-full h-auto rounded border border-gray-300"
              />
              <p className="text-xs text-gray-500 mt-2">
                📍 생성 완료: <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{imageUrl}</a>
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-600 mt-2">이미지가 아직 생성되지 않았습니다.</p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            📍 API: <code className="bg-gray-200 px-1 rounded">/api/generate-paragraph-images-with-prompts</code> (FAL AI)
          </p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
        <p className="text-xs text-gray-700">
          💡 <strong>프롬프트 개선 팁:</strong> BasePrompt를 수정하거나 요일별 템플릿을 변경하면 새로운 최종 프롬프트가 생성됩니다.
        </p>
      </div>
    </div>
  );
}









