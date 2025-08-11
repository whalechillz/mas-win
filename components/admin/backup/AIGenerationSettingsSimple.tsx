'use client';

import React, { useState } from 'react';
import { Brain, Sparkles, Settings, Copy, RefreshCw } from 'lucide-react';

const AIGenerationSettingsSimple: React.FC = () => {
  const [contentType, setContentType] = useState('blog');
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');

  const handleGenerate = () => {
    setGenerating(true);
    // 시뮬레이션
    setTimeout(() => {
      setGeneratedContent(`AI로 생성된 ${contentType} 콘텐츠입니다.\n\n주제: ${topic}\n톤: ${tone}\n길이: ${length}\n\n[실제 AI 생성 콘텐츠가 여기에 표시됩니다]`);
      setGenerating(false);
    }, 2000);
  };

  return (
    <div className="bg-white rounded-lg">
      <div className="mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Brain className="w-5 h-5" />
          AI 콘텐츠 생성
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          AI를 활용하여 마케팅 콘텐츠를 자동으로 생성합니다.
        </p>
      </div>

      <div className="space-y-4">
        {/* 콘텐츠 타입 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            콘텐츠 유형
          </label>
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="blog">블로그 포스트</option>
            <option value="social">소셜 미디어</option>
            <option value="email">이메일 캠페인</option>
            <option value="ad">광고 카피</option>
          </select>
        </div>

        {/* 주제 입력 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            주제 또는 키워드
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="예: 골프 클럽 선택 가이드"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 톤 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            문체/톤
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['professional', 'casual', 'friendly'].map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`px-3 py-2 rounded-lg border transition-colors ${
                  tone === t
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t === 'professional' ? '전문적' : t === 'casual' ? '캐주얼' : '친근한'}
              </button>
            ))}
          </div>
        </div>

        {/* 길이 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            콘텐츠 길이
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['short', 'medium', 'long'].map((l) => (
              <button
                key={l}
                onClick={() => setLength(l)}
                className={`px-3 py-2 rounded-lg border transition-colors ${
                  length === l
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {l === 'short' ? '짧게' : l === 'medium' ? '보통' : '길게'}
              </button>
            ))}
          </div>
        </div>

        {/* 생성 버튼 */}
        <button
          onClick={handleGenerate}
          disabled={!topic || generating}
          className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            generating || !topic
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg'
          }`}
        >
          {generating ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              AI 콘텐츠 생성
            </>
          )}
        </button>

        {/* 생성된 콘텐츠 */}
        {generatedContent && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">생성된 콘텐츠</h3>
              <button
                onClick={() => navigator.clipboard.writeText(generatedContent)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Copy className="w-4 h-4" />
                복사
              </button>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm text-gray-700">{generatedContent}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIGenerationSettingsSimple;