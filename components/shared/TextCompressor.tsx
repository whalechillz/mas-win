import React, { useState } from 'react';

interface TextCompressorProps {
  originalText: string;
  targetLength: number;
  onCompressed: (compressedText: string) => void;
  onCancel: () => void;
}

export const TextCompressor: React.FC<TextCompressorProps> = ({
  originalText,
  targetLength,
  onCompressed,
  onCancel
}) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressedText, setCompressedText] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const compressText = async () => {
    setIsCompressing(true);
    try {
      const response = await fetch('/api/ai/compress-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: originalText,
          targetLength: targetLength,
          preserveKeywords: true // 핵심 키워드 보존
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCompressedText(data.compressedText);
        setShowPreview(true);
      } else {
        alert('텍스트 압축에 실패했습니다.');
      }
    } catch (error) {
      console.error('텍스트 압축 오류:', error);
      alert('텍스트 압축 중 오류가 발생했습니다.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleApply = () => {
    onCompressed(compressedText);
    setShowPreview(false);
  };

  const getTargetType = () => {
    if (targetLength <= 90) return 'SMS';
    if (targetLength <= 300) return 'SMS (300자)';
    if (targetLength <= 2000) return 'LMS';
    return 'MMS';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">AI 텍스트 압축</h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-3">
        <div className="text-sm text-gray-600 mb-2">
          <strong>원본 텍스트:</strong> {originalText.length}자
        </div>
        <div className="text-sm text-gray-600 mb-2">
          <strong>목표 길이:</strong> {targetLength}자 ({getTargetType()})
        </div>
        <div className="text-sm text-gray-600">
          <strong>압축률:</strong> {Math.round((1 - targetLength / originalText.length) * 100)}% 축약
        </div>
      </div>

      {!showPreview ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            AI가 핵심 내용을 보존하면서 텍스트를 {targetLength}자로 압축합니다.
          </p>
          <button
            onClick={compressText}
            disabled={isCompressing}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isCompressing ? '압축 중...' : `AI로 ${targetLength}자로 압축하기`}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm font-medium text-blue-800 mb-2">
              압축된 텍스트 ({compressedText.length}자):
            </div>
            <div className="text-sm text-blue-700 whitespace-pre-wrap">
              {compressedText}
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              적용하기
            </button>
            <button
              onClick={() => setShowPreview(false)}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              다시 압축
            </button>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500">
        💡 AI는 핵심 키워드와 행동 유도 문구를 보존하면서 불필요한 내용을 제거합니다.
      </div>
    </div>
  );
};
