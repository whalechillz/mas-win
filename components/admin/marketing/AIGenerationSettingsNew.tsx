'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Brain, Image, Search } from 'lucide-react';

interface AISettings {
  useAI: boolean;
  model: string;
  settings: {
    contentModel: string;
    usePerplexity: boolean;
    useImageGen: boolean;
    imageCount: number;
  };
}

interface AIGenerationSettingsProps {
  onSettingsChange: (settings: AISettings) => void;
  initialSettings?: AISettings;
}

// AI 모델 목록 (실제 사용 가능한 모델만 표시)
const AI_MODELS = {
  'gpt-4': {
    name: 'GPT-4',
    description: '가장 강력한 AI 모델',
    badge: '최신',
    color: 'purple'
  },
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    description: '빠르고 효율적인 모델',
    badge: '추천',
    color: 'blue'
  },
  'claude-3': {
    name: 'Claude 3',
    description: '창의적 콘텐츠에 최적화',
    badge: '창의성',
    color: 'green'
  }
};

export const AIGenerationSettingsNew: React.FC<AIGenerationSettingsProps> = ({
  onSettingsChange,
  initialSettings
}) => {
  const [settings, setSettings] = useState<AISettings>(initialSettings || {
    useAI: false,
    model: 'gpt-3.5-turbo',
    settings: {
      contentModel: 'gpt-3.5-turbo',
      usePerplexity: false,
      useImageGen: true,
      imageCount: 3
    }
  });

  useEffect(() => {
    onSettingsChange(settings);
  }, [settings]);

  const updateSettings = (updates: Partial<AISettings>) => {
    setSettings(prev => ({
      ...prev,
      ...updates
    }));
  };

  const updateNestedSettings = (updates: Partial<AISettings['settings']>) => {
    setSettings(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...updates
      }
    }));
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-600" />
          AI 생성 설정
        </h3>
        
        {/* AI 토글 스위치 */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.useAI}
            onChange={(e) => updateSettings({ useAI: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          <span className="ml-3 text-sm font-medium text-gray-900">
            AI {settings.useAI ? 'ON' : 'OFF'}
          </span>
        </label>
      </div>

      {settings.useAI && (
        <div className="space-y-4">
          {/* AI 모델 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI 모델 선택
            </label>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(AI_MODELS).map(([key, model]) => (
                <button
                  key={key}
                  onClick={() => {
                    updateSettings({ model: key });
                    updateNestedSettings({ contentModel: key });
                  }}
                  className={`relative p-3 rounded-lg border-2 transition-all ${
                    settings.model === key
                      ? 'border-purple-500 bg-white shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <Brain className={`w-5 h-5 ${
                      settings.model === key ? 'text-purple-600' : 'text-gray-400'
                    }`} />
                    {model.badge && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        model.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                        model.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {model.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">{model.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{model.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 추가 기능 설정 */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={settings.settings.usePerplexity}
                onChange={(e) => updateNestedSettings({ usePerplexity: e.target.checked })}
                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
              />
              <Search className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <div className="font-medium text-sm">Perplexity 검색 강화</div>
                <div className="text-xs text-gray-500">실시간 정보 검색 및 팩트 체크</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={settings.settings.useImageGen}
                onChange={(e) => updateNestedSettings({ useImageGen: e.target.checked })}
                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
              />
              <Image className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <div className="font-medium text-sm">이미지 자동 생성</div>
                <div className="text-xs text-gray-500">AI가 콘텐츠에 맞는 이미지 생성</div>
              </div>
            </label>

            {settings.settings.useImageGen && (
              <div className="ml-11 p-3 bg-gray-50 rounded-lg">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  생성할 이미지 개수
                </label>
                <select
                  value={settings.settings.imageCount}
                  onChange={(e) => updateNestedSettings({ imageCount: parseInt(e.target.value) })}
                  className="w-full px-3 py-1 text-sm border border-gray-300 rounded-lg"
                >
                  <option value={1}>1개</option>
                  <option value={3}>3개</option>
                  <option value={5}>5개</option>
                  <option value={7}>7개</option>
                </select>
              </div>
            )}
          </div>

          {/* 현재 설정 요약 */}
          <div className="mt-4 p-3 bg-white/70 rounded-lg">
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">현재 설정:</span>
                <span className="text-purple-700 font-medium">{AI_MODELS[settings.model]?.name}</span>
                {settings.settings.usePerplexity && (
                  <span className="text-blue-600">+ 검색 강화</span>
                )}
                {settings.settings.useImageGen && (
                  <span className="text-green-600">+ 이미지 {settings.settings.imageCount}개</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIGenerationSettingsNew;