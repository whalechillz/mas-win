import React, { useState, useEffect, useCallback } from 'react';
import { ImageMetadata, MetadataForm, FieldConfig } from './types/metadata.types';
import { FieldGroup } from './components/FieldGroup';
import { SEOScore } from './components/SEOScore';
import { useAIGeneration } from './hooks/useAIGeneration';
import { validateForm, calculateSEOScore, getSEORecommendations } from './utils/validation';

interface ImageMetadataModalProps {
  isOpen: boolean;
  image: ImageMetadata | null;
  onClose: () => void;
  onSave: (metadata: MetadataForm) => Promise<void>;
  onRename?: (newFilename: string) => Promise<void>;
}

// 필드 설정
const FIELD_CONFIGS: Record<keyof MetadataForm, FieldConfig> = {
  alt_text: {
    label: 'ALT 텍스트',
    placeholder: '이미지를 설명하는 대체 텍스트를 입력하세요',
    type: 'text',
    maxLength: 200,
    aiEnabled: true,
    seoOptimized: true
  },
  keywords: {
    label: '키워드',
    placeholder: '쉼표로 구분하여 관련 키워드를 입력하세요',
    type: 'text',
    maxLength: 50,
    aiEnabled: true,
    seoOptimized: true
  },
  title: {
    label: '제목',
    placeholder: '이미지의 제목을 입력하세요',
    type: 'text',
    maxLength: 100,
    aiEnabled: true,
    seoOptimized: true
  },
  description: {
    label: '설명',
    placeholder: '이미지에 대한 자세한 설명을 입력하세요',
    type: 'textarea',
    maxLength: 300,
    aiEnabled: true,
    seoOptimized: true
  },
  category: {
    label: '카테고리',
    placeholder: '카테고리 선택',
    type: 'select',
    required: true,
    aiEnabled: true
  },
  filename: {
    label: '파일명 (SEO 최적화)',
    placeholder: 'SEO 최적화된 파일명',
    type: 'text',
    maxLength: 100
  }
};

export const ImageMetadataModal: React.FC<ImageMetadataModalProps> = ({
  isOpen,
  image,
  onClose,
  onSave,
  onRename
}) => {
  const [form, setForm] = useState<MetadataForm>({
    alt_text: '',
    keywords: '',
    title: '',
    description: '',
    category: '',
    filename: ''
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { isGenerating, generateAllMetadata, generateField } = useAIGeneration();

  // 이미지 변경 시 폼 초기화
  useEffect(() => {
    if (image) {
      const newForm: MetadataForm = {
        alt_text: image.alt_text || '',
        keywords: image.keywords?.join(', ') || '',
        title: image.title || '',
        description: image.description || '',
        category: image.category || '',
        filename: image.name || ''
      };
      setForm(newForm);
      setHasChanges(false);
      setValidationErrors({});
    }
  }, [image]);

  // 폼 변경 감지
  const handleFormChange = useCallback((field: keyof MetadataForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    
    // 실시간 유효성 검사
    const newForm = { ...form, [field]: value };
    const errors = validateForm(newForm);
    setValidationErrors(errors);
  }, [form]);

  // 전체 AI 생성
  const handleGenerateAll = useCallback(async (language: 'korean' | 'english') => {
    if (!image) return;

    const result = await generateAllMetadata(image.url, {
      language,
      fields: ['alt_text', 'keywords', 'title', 'description', 'category']
    });

    if (result.success && result.data) {
      setForm(prev => ({ ...prev, ...result.data }));
      setHasChanges(true);
    } else {
      alert(`AI 생성에 실패했습니다: ${result.error}`);
    }
  }, [image, generateAllMetadata]);

  // 개별 필드 AI 생성
  const handleGenerateField = useCallback(async (field: keyof MetadataForm, language: 'korean' | 'english') => {
    if (!image) return;

    const result = await generateField(image.url, field, language);
    
    if (result.success && result.data) {
      setForm(prev => ({ ...prev, ...result.data }));
      setHasChanges(true);
    } else {
      alert(`AI 생성에 실패했습니다: ${result.error}`);
    }
  }, [image, generateField]);

  // 저장
  const handleSave = useCallback(async () => {
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(form);
      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  }, [form, onSave, onClose]);

  // 파일명 변경
  const handleRename = useCallback(async () => {
    if (!onRename || !form.filename) return;
    
    try {
      await onRename(form.filename);
      alert('파일명이 변경되었습니다.');
    } catch (error) {
      console.error('파일명 변경 오류:', error);
      alert('파일명 변경에 실패했습니다.');
    }
  }, [form.filename, onRename]);

  // SEO 점수 및 권장사항 계산
  const seoScore = calculateSEOScore(form);
  const seoRecommendations = getSEORecommendations(form);

  if (!isOpen || !image) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">이미지 메타데이터 편집</h2>
            <p className="text-sm text-gray-500 mt-1">{image.name}</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* 전체 AI 생성 버튼들 */}
            <div className="flex gap-2">
              <button
                onClick={() => handleGenerateAll('korean')}
                disabled={isGenerating}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGenerating ? '⏳' : '🇰🇷'} 한글 AI 생성
              </button>
              <button
                onClick={() => handleGenerateAll('english')}
                disabled={isGenerating}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGenerating ? '⏳' : '🇺🇸'} 영어 AI 생성
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="flex h-[calc(90vh-140px)]">
          {/* 메인 폼 */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {Object.entries(FIELD_CONFIGS).map(([field, config]) => (
                <FieldGroup
                  key={field}
                  field={field as keyof MetadataForm}
                  config={config}
                  value={form[field as keyof MetadataForm]}
                  onChange={(value) => handleFormChange(field as keyof MetadataForm, value)}
                  onAIGenerate={config.aiEnabled ? handleGenerateField : undefined}
                  error={validationErrors[field]}
                  seoScore={config.seoOptimized ? seoScore : undefined}
                  isGenerating={isGenerating}
                />
              ))}
            </div>
          </div>

          {/* SEO 사이드바 */}
          <div className="w-80 border-l border-gray-200 p-6 overflow-y-auto">
            <SEOScore
              score={seoScore}
              recommendations={seoRecommendations}
              onRecommendationClick={(field) => {
                // 해당 필드로 스크롤
                const element = document.querySelector(`[data-field="${field}"]`);
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            {hasChanges && (
              <span className="text-sm text-orange-600 flex items-center gap-1">
                <span>⚠️</span>
                저장되지 않은 변경사항이 있습니다
              </span>
            )}
            {seoScore < 60 && (
              <span className="text-sm text-red-600 flex items-center gap-1">
                <span>📈</span>
                SEO 최적화를 개선해보세요
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              취소
            </button>
            
            {onRename && (
              <button
                onClick={handleRename}
                disabled={!form.filename || isSaving}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                파일명 변경
              </button>
            )}
            
            <button
              onClick={handleSave}
              disabled={isSaving || Object.keys(validationErrors).length > 0}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? '⏳' : '💾'} 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
