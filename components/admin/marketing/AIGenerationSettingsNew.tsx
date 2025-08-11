'use client';

import React, { useState, useEffect } from 'react';
// import { Zap, Brain, Image, Search } from 'lucide-react'; // 주석 처리

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
  }, [settings, onSettingsChange]);

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
          <i data-feather="zap" className="w-5 h-5 text-purple-600"></i>
          AI 생성 설정
        </h3>
        
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.useAI}
            onChange={(e) => updateSettings({ useAI: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          <span className="ml-3 text-sm font-medium text-gray-900">
            AI 토글 {settings.useAI ? 'ON' : 'OFF'}
          </span>
        </label>
      </div>

      {settings.useAI && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center gap-2 mb-3">
                <i data-feather="brain" className="w-5 h-5 text-blue-600"></i>
                <h4 className="font-medium">AI 모델 선택</h4>
              </div>
              <select
                value={settings.model}
                onChange={(e) => updateSettings({ model: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {Object.entries(AI_MODELS).map(([key, model]) => (
                  <option key={key} value={key}>
                    {model.name} - {model.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center gap-2 mb-3">
                <i data-feather="image" className="w-5 h-5 text-green-600"></i>
                <h4 className="font-medium">이미지 생성</h4>
              </div>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.settings.useImageGen}
                    onChange={(e) => updateNestedSettings({ useImageGen: e.target.checked })}
                    className="mr-2"
                  />
                  이미지 자동 생성
                </label>
                {settings.settings.useImageGen && (
                  <div>
                    <label className="block text-sm text-gray-600">생성할 이미지 수</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={settings.settings.imageCount}
                      onChange={(e) => updateNestedSettings({ imageCount: parseInt(e.target.value) })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-2 mb-3">
              <i data-feather="search" className="w-5 h-5 text-purple-600"></i>
              <h4 className="font-medium">추가 설정</h4>
            </div>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.settings.usePerplexity}
                  onChange={(e) => updateNestedSettings({ usePerplexity: e.target.checked })}
                  className="mr-2"
                />
                Perplexity 트렌드 분석 사용
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
