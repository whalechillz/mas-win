import React, { useState } from 'react';

interface ShortLinkGeneratorProps {
  originalUrl: string;
  onLinkGenerated?: (shortLink: string) => void;
  className?: string;
}

export const ShortLinkGenerator: React.FC<ShortLinkGeneratorProps> = ({
  originalUrl,
  onLinkGenerated,
  className = ''
}) => {
  const [shortLink, setShortLink] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // 짧은 링크 생성
  const generateShortLink = async () => {
    if (!originalUrl.trim()) {
      alert('원본 URL을 입력해주세요.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/short-links/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalUrl: originalUrl.trim(),
          description: 'MMS 링크'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setShortLink(data.shortLink);
          onLinkGenerated?.(data.shortLink);
        } else {
          alert('짧은 링크 생성에 실패했습니다.');
        }
      } else {
        alert('짧은 링크 생성 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('짧은 링크 생성 오류:', error);
      alert('짧은 링크 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 링크 복사
  const copyToClipboard = async () => {
    if (!shortLink) return;

    try {
      await navigator.clipboard.writeText(shortLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('복사 오류:', error);
      // 폴백: 텍스트 선택
      const textArea = document.createElement('textarea');
      textArea.value = shortLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">짧은 링크 생성</h3>
        <button
          onClick={generateShortLink}
          disabled={isGenerating || !originalUrl.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? '생성 중...' : '링크 생성'}
        </button>
      </div>

      {/* 원본 URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          원본 URL
        </label>
        <input
          type="url"
          value={originalUrl}
          readOnly
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
          placeholder="https://example.com"
        />
      </div>

      {/* 생성된 짧은 링크 */}
      {shortLink && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            짧은 링크
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={shortLink}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"
            >
              {copied ? (
                <>
                  <span>✓</span>
                  <span>복사됨</span>
                </>
              ) : (
                <>
                  <span>📋</span>
                  <span>복사</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 사용 안내 */}
      <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
        💡 MMS나 SMS에서 긴 URL을 짧게 만들어 전송할 수 있습니다.
      </div>
    </div>
  );
};
