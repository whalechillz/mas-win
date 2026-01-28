/**
 * OCR 문서 뷰어 컴포넌트
 * 원본 이미지와 OCR 텍스트를 나란히 보여주고 편집 가능
 */

import React, { useState, useMemo } from 'react';

interface DocumentOCRViewerProps {
  imageUrl: string;
  ocrText: string;
  originalText?: string; // 원본 OCR 텍스트 (교정 전)
  fullTextAnnotation?: any; // Google Vision API의 fullTextAnnotation 구조
  onTextChange?: (text: string) => void;
  onSave?: (text: string) => Promise<void>;
}

export const DocumentOCRViewer: React.FC<DocumentOCRViewerProps> = ({
  imageUrl,
  ocrText,
  originalText,
  fullTextAnnotation,
  onTextChange,
  onSave
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'image' | 'text'>('split');
  const [editingText, setEditingText] = useState(ocrText);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // fullTextAnnotation을 마크다운으로 변환 (구조화된 텍스트)
  const structuredText = useMemo(() => {
    if (!fullTextAnnotation || !fullTextAnnotation.blocks) {
      return ocrText; // 구조 정보가 없으면 원본 텍스트 반환
    }

    try {
      // blocks를 순회하며 구조화된 텍스트 생성
      return fullTextAnnotation.blocks
        .map((block: any, blockIndex: number) => {
          const paragraphs = block.paragraphs || [];
          const blockText = paragraphs
            .map((paragraph: any) => {
              const words = paragraph.words || [];
              return words
                .map((word: any) => {
                  const symbols = word.symbols || [];
                  return symbols.map((symbol: any) => symbol.text).join('');
                })
                .join(' ');
            })
            .join('\n');
          
          // 블록 타입에 따라 마크다운 형식 적용
          const blockType = block.blockType || 'UNKNOWN';
          if (blockType === 'TABLE') {
            return `\n### 표 ${blockIndex + 1}\n${blockText}\n`;
          } else if (blockType === 'LIST') {
            return `\n- ${blockText}\n`;
          } else {
            return `\n${blockText}\n`;
          }
        })
        .join('\n');
    } catch (error) {
      console.error('구조화된 텍스트 변환 오류:', error);
      return ocrText;
    }
  }, [fullTextAnnotation, ocrText]);

  const handleTextChange = (newText: string) => {
    setEditingText(newText);
    setHasChanges(newText !== ocrText);
    if (onTextChange) {
      onTextChange(newText);
    }
  };

  const handleSave = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave(editingText);
      setHasChanges(false);
      alert('텍스트가 저장되었습니다.');
    } catch (error: any) {
      console.error('텍스트 저장 오류:', error);
      alert(`저장 실패: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('변경사항을 취소하시겠습니까?')) {
      setEditingText(ocrText);
      setHasChanges(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-800">OCR 문서 편집</h3>
          {hasChanges && (
            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
              변경사항 있음
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* 보기 모드 선택 */}
          <div className="flex gap-1 bg-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                viewMode === 'split' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-700 hover:bg-gray-300'
              }`}
            >
              나란히
            </button>
            <button
              onClick={() => setViewMode('image')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                viewMode === 'image' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-700 hover:bg-gray-300'
              }`}
            >
              이미지만
            </button>
            <button
              onClick={() => setViewMode('text')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                viewMode === 'text' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-700 hover:bg-gray-300'
              }`}
            >
              텍스트만
            </button>
          </div>

          {/* 액션 버튼 */}
          {hasChanges && (
            <>
              <button
                onClick={handleReset}
                className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {isSaving ? '저장 중...' : '저장'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 원본 이미지 */}
        {(viewMode === 'split' || viewMode === 'image') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} border-r overflow-auto bg-gray-100 p-4`}>
            <div className="sticky top-0 bg-white rounded-lg shadow-sm p-2 mb-2">
              <h4 className="text-sm font-medium text-gray-700">원본 문서</h4>
            </div>
            <div className="flex items-center justify-center min-h-full">
              <img
                src={imageUrl}
                alt="원본 문서"
                className="max-w-full max-h-full object-contain rounded-lg shadow-md"
              />
            </div>
          </div>
        )}

        {/* OCR 텍스트 편집 영역 */}
        {(viewMode === 'split' || viewMode === 'text') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col overflow-hidden`}>
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">OCR 추출 텍스트</h4>
                {originalText && originalText !== editingText && (
                  <button
                    onClick={() => {
                      if (confirm('원본 OCR 텍스트로 되돌리시겠습니까?')) {
                        setEditingText(originalText);
                        setHasChanges(true);
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    원본으로 복원
                  </button>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {editingText.length}자 {hasChanges && '(수정됨)'}
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              <textarea
                value={editingText}
                onChange={(e) => handleTextChange(e.target.value)}
                className="w-full h-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm leading-relaxed"
                placeholder="OCR로 추출된 텍스트가 여기에 표시됩니다..."
                style={{ minHeight: '400px' }}
              />
            </div>

            {/* 구조화된 텍스트 미리보기 (선택사항) */}
            {fullTextAnnotation && structuredText !== ocrText && (
              <div className="border-t p-4 bg-gray-50">
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                    📋 구조화된 텍스트 보기 (마크다운)
                  </summary>
                  <div className="mt-2 p-3 bg-white rounded border border-gray-200 max-h-40 overflow-auto">
                    <pre className="whitespace-pre-wrap text-xs">{structuredText}</pre>
                  </div>
                </details>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentOCRViewer;
