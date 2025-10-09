import React, { useState } from 'react';
import { MetadataForm, FieldConfig } from '../types/metadata.types';
import { getScoreColor, getScoreBgColor } from '../utils/validation';

interface FieldGroupProps {
  field: keyof MetadataForm;
  config: FieldConfig;
  value: string;
  onChange: (value: string) => void;
  onAIGenerate?: (field: keyof MetadataForm, language: 'korean' | 'english') => Promise<void>;
  error?: string;
  seoScore?: number;
  isGenerating?: boolean;
}

export const FieldGroup: React.FC<FieldGroupProps> = ({
  field,
  config,
  value,
  onChange,
  onAIGenerate,
  error,
  seoScore,
  isGenerating = false
}) => {
  const [showAIOptions, setShowAIOptions] = useState(false);

  const handleAIGenerate = async (language: 'korean' | 'english') => {
    if (onAIGenerate) {
      await onAIGenerate(field, language);
      setShowAIOptions(false);
    }
  };

  const getCharacterCountColor = () => {
    if (config.maxLength) {
      const percentage = (value.length / config.maxLength) * 100;
      if (percentage >= 90) return 'text-red-500';
      if (percentage >= 75) return 'text-yellow-500';
      return 'text-gray-500';
    }
    return 'text-gray-500';
  };

  const getInputBorderColor = () => {
    if (error) return 'border-red-300 bg-red-50';
    if (config.maxLength && value.length > config.maxLength * 0.9) return 'border-yellow-300 bg-yellow-50';
    return 'border-gray-300 focus:border-blue-500';
  };

  const renderInput = () => {
    const baseClasses = `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${getInputBorderColor()}`;
    
    if (config.type === 'textarea') {
      return (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={config.placeholder}
          className={`${baseClasses} resize-none`}
          rows={3}
        />
      );
    }

    if (config.type === 'select') {
      return (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClasses}
        >
          <option value="">카테고리 선택</option>
          <option value="골프">골프</option>
          <option value="장비">장비</option>
          <option value="코스">코스</option>
          <option value="이벤트">이벤트</option>
          <option value="기타">기타</option>
        </select>
      );
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={config.placeholder}
        className={baseClasses}
      />
    );
  };

  return (
    <div className="space-y-2">
      {/* 라벨과 카운터 */}
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          {config.label}
          {config.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="flex items-center gap-2">
          {config.maxLength && (
            <span className={`text-xs ${getCharacterCountColor()}`}>
              {value.length}/{config.maxLength}
            </span>
          )}
          {seoScore !== undefined && (
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreBgColor(seoScore)} ${getScoreColor(seoScore)}`}>
              SEO {seoScore}
            </div>
          )}
        </div>
      </div>

      {/* 입력 필드와 AI 버튼 */}
      <div className="flex gap-2">
        {renderInput()}
        
        {config.aiEnabled && onAIGenerate && (
          <div className="relative">
            <button
              onClick={() => setShowAIOptions(!showAIOptions)}
              disabled={isGenerating}
              className="px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="AI 생성"
            >
              {isGenerating ? '⏳' : '🤖'}
            </button>
            
            {showAIOptions && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                <button
                  onClick={() => handleAIGenerate('korean')}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  🇰🇷 한글
                </button>
                <button
                  onClick={() => handleAIGenerate('english')}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  🇺🇸 영어
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <span>⚠️</span>
          {error}
        </p>
      )}

      {/* SEO 권장사항 */}
      {config.seoOptimized && config.maxLength && (
        <div className="text-xs text-gray-500">
          {value.length < config.maxLength * 0.5 && (
            <span className="text-yellow-600">💡 더 자세한 내용을 추가하면 SEO에 도움이 됩니다</span>
          )}
          {value.length > config.maxLength * 0.9 && (
            <span className="text-red-600">⚠️ 내용이 너무 깁니다. 간결하게 정리해보세요</span>
          )}
        </div>
      )}
    </div>
  );
};
