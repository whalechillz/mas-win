'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Copy, RefreshCw, Settings, Send, Loader } from 'lucide-react';

interface AIContentAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  context?: {
    title?: string;
    topic?: string;
    keywords?: string[];
    platform?: string;
  };
  onContentGenerated?: (content: string) => void;
}

export const AIContentAssistant: React.FC<AIContentAssistantProps> = ({
  isOpen,
  onClose,
  context,
  onContentGenerated
}) => {
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo');
  const [contentType, setContentType] = useState('blog');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');

  useEffect(() => {
    if (context && isOpen) {
      // 컨텍스트 기반 프롬프트 자동 생성
      const autoPrompt = generateAutoPrompt();
      setPrompt(autoPrompt);
    }
  }, [context, isOpen]);

  const generateAutoPrompt = () => {
    if (!context) return '';
    
    let prompt = '';
    if (context.title) prompt += `제목: ${context.title}\n`;
    if (context.topic) prompt += `주제: ${context.topic}\n`;
    if (context.keywords && context.keywords.length > 0) {
      prompt += `키워드: ${context.keywords.join(', ')}\n`;
    }
    if (context.platform) prompt += `플랫폼: ${context.platform}\n`;
    
    return prompt;
  };

  const generateContent = async () => {
    setIsGenerating(true);
    try {
      // 실제 API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 샘플 콘텐츠 생성 (실제로는 API 응답)
      const sampleContent = `
# ${context?.title || '제목'}

## 서론
${context?.topic || '주제'}에 대한 흥미로운 이야기를 시작해보겠습니다.

## 본문
### 1. 첫 번째 포인트
상세한 설명과 함께 독자의 관심을 끌 수 있는 내용...

### 2. 두 번째 포인트
추가적인 정보와 인사이트...

### 3. 세 번째 포인트
실용적인 팁과 조언...

## 결론
오늘 다룬 내용을 정리하며, 독자들에게 행동을 유도하는 마무리...

${context?.keywords ? `\n태그: ${context.keywords.map(k => `#${k}`).join(' ')}` : ''}
      `.trim();
      
      setGeneratedContent(sampleContent);
    } catch (error) {
      console.error('Content generation failed:', error);
      alert('콘텐츠 생성에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    alert('클립보드에 복사되었습니다!');
  };

  const applyContent = () => {
    if (onContentGenerated && generatedContent) {
      onContentGenerated(generatedContent);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold">AI 콘텐츠 어시스턴트</h2>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                {selectedModel}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* 왼쪽: 설정 및 프롬프트 */}
          <div className="w-1/3 p-6 border-r border-gray-200 overflow-y-auto">
            <div className="space-y-4">
              {/* AI 모델 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI 모델
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="gpt-4">GPT-4 (고급)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo (빠름)</option>
                  <option value="claude-3">Claude 3 (창의적)</option>
                </select>
              </div>

              {/* 콘텐츠 유형 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  콘텐츠 유형
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="blog">블로그 포스트</option>
                  <option value="social">소셜 미디어</option>
                  <option value="email">이메일</option>
                  <option value="product">상품 설명</option>
                </select>
              </div>

              {/* 톤 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  문체/톤
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="professional">전문적</option>
                  <option value="casual">캐주얼</option>
                  <option value="friendly">친근한</option>
                  <option value="persuasive">설득적</option>
                </select>
              </div>

              {/* 길이 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  콘텐츠 길이
                </label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="short">짧게 (500자)</option>
                  <option value="medium">보통 (1000자)</option>
                  <option value="long">길게 (2000자)</option>
                </select>
              </div>

              {/* 프롬프트 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  추가 요청사항
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                  placeholder="AI에게 원하는 내용을 자세히 설명해주세요..."
                />
              </div>

              {/* 생성 버튼 */}
              <button
                onClick={generateContent}
                disabled={isGenerating}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    콘텐츠 생성
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 오른쪽: 생성된 콘텐츠 */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">생성된 콘텐츠</h3>
              {generatedContent && (
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    복사
                  </button>
                  <button
                    onClick={generateContent}
                    disabled={isGenerating}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1"
                  >
                    <RefreshCw className="w-4 h-4" />
                    재생성
                  </button>
                </div>
              )}
            </div>

            {generatedContent ? (
              <div className="prose max-w-none">
                <div className="bg-gray-50 rounded-lg p-6 whitespace-pre-wrap">
                  {generatedContent}
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={applyContent}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    이 콘텐츠 사용하기
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    닫기
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>AI가 생성한 콘텐츠가 여기에 표시됩니다</p>
                  <p className="text-sm mt-2">왼쪽에서 설정을 선택하고 생성 버튼을 클릭하세요</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIContentAssistant;