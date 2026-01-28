import React, { useState } from 'react';
import { MetadataForm, FieldConfig } from '../types/metadata.types';
import { getScoreColor, getScoreBgColor } from '../utils/validation';

interface FieldGroupProps {
  field: keyof MetadataForm;
  config: FieldConfig;
  value: string | string[];  // 체크박스는 배열
  onChange: (value: string | string[]) => void;
  onAIGenerate?: (field: keyof MetadataForm, language: 'korean' | 'english') => Promise<void>;
  onCorrectOCR?: () => Promise<void>;
  error?: string;
  seoScore?: number;
  isGenerating?: boolean;
  isCorrectingOCR?: boolean;
  hasOCRText?: boolean;
  categories?: Array<{ id: number; name: string }>;
}

export const FieldGroup: React.FC<FieldGroupProps> = ({
  field,
  config,
  value,
  onChange,
  onAIGenerate,
  onCorrectOCR,
  error,
  seoScore,
  isGenerating = false,
  isCorrectingOCR = false,
  hasOCRText = false,
  categories = []
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
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className={baseClasses}
        >
          <option value="">카테고리 선택</option>
          {categories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>
      );
    }

    if (config.type === 'checkbox' && config.options) {
      const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {config.options.map((option) => {
              const isChecked = selectedValues.includes(option.value);
              return (
                <label
                  key={option.value}
                  className={`flex items-center space-x-2 px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      const newValues = e.target.checked
                        ? [...selectedValues, option.value]
                        : selectedValues.filter((v) => v !== option.value);
                      onChange(newValues);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">{option.label}</span>
                </label>
              );
            })}
          </div>
          {selectedValues.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              선택됨: {selectedValues.join(', ')}
            </p>
          )}
        </div>
      );
    }

    return (
      <input
        type="text"
        value={typeof value === 'string' ? value : ''}
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
        
        {/* OCR 교정 버튼 (description 필드에 OCR 텍스트가 있을 때만 표시) */}
        {field === 'description' && hasOCRText && onCorrectOCR && (
          <button
            onClick={onCorrectOCR}
            disabled={isCorrectingOCR || isGenerating}
            className="px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            title="GPT-4로 OCR 텍스트 교정"
          >
            {isCorrectingOCR ? (
              <>
                <span className="animate-spin">⏳</span>
                <span className="text-xs">교정 중...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span className="text-xs">OCR 교정</span>
              </>
            )}
          </button>
        )}
        
        {config.aiEnabled && onAIGenerate && (
          <div className="relative">
            <button
              onClick={() => setShowAIOptions(!showAIOptions)}
              disabled={isGenerating || isCorrectingOCR}
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
      {config.maxLength && value.length > config.maxLength * 0.9 && (
        <div className="text-xs text-red-600">
          ⚠️ 내용이 너무 깁니다
        </div>
      )}
    </div>
  );
};
