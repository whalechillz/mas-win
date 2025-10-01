import { useState } from 'react';
import Head from 'next/head';

interface AnalysisResult {
  category: string;
  confidence: number;
  keywords: string[];
  reasoning: string;
  suggestions: string[];
}

interface PromptResult {
  prompt: string;
  contentType: string;
  brandStrategy: string;
}

export default function AIContentAnalyzer() {
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [promptResult, setPromptResult] = useState<PromptResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyzeContent = async () => {
    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysisResult(null);
    setPromptResult(null);

    try {
      // 1. AI 콘텐츠 분석
      console.log('🤖 AI 콘텐츠 분석 시작...');
      const analysisResponse = await fetch('/api/ai-content-analyzer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          excerpt,
          content
        })
      });

      if (analysisResponse.ok) {
        const analysis = await analysisResponse.json();
        setAnalysisResult(analysis);
        console.log('✅ AI 콘텐츠 분석 완료:', analysis);
      } else {
        throw new Error('AI 콘텐츠 분석 실패');
      }

      // 2. 스마트 프롬프트 생성
      console.log('🎨 스마트 프롬프트 생성 시작...');
      const promptResponse = await fetch('/api/generate-smart-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          excerpt,
          contentType: analysisResult?.category || 'general',
          brandStrategy: '마쓰구 골프 드라이버 전문 브랜드'
        })
      });

      if (promptResponse.ok) {
        const prompt = await promptResponse.json();
        setPromptResult(prompt);
        console.log('✅ 스마트 프롬프트 생성 완료:', prompt);
      } else {
        throw new Error('스마트 프롬프트 생성 실패');
      }

    } catch (error) {
      console.error('❌ 분석 중 오류:', error);
      setError('분석 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>고급 콘텐츠 분석 시스템 - MAS Golf</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">🤖 고급 콘텐츠 분석 시스템</h1>
            <p className="text-gray-600 mt-2">AI를 사용하여 콘텐츠를 정확하게 분석하고 최적화된 프롬프트를 생성합니다</p>
          </div>

          {/* 입력 폼 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">📝 콘텐츠 입력</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목 *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="블로그 제목을 입력하세요"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  요약
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="블로그 요약을 입력하세요"
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  내용
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="블로그 내용을 입력하세요"
                  rows={6}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={analyzeContent}
                disabled={loading || !title.trim()}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? '🤖 분석 중...' : '🚀 AI 콘텐츠 분석 시작'}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
              </div>
            )}
          </div>

          {/* 분석 결과 */}
          {analysisResult && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">📊 AI 콘텐츠 분석 결과</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">분류 정보</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">카테고리:</span>
                      <span className="font-medium text-blue-600">{analysisResult.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">신뢰도:</span>
                      <span className="font-medium text-green-600">{(analysisResult.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">추출된 키워드</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">분석 추론</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {analysisResult.reasoning}
                </p>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">개선 제안</h3>
                <ul className="space-y-2">
                  {analysisResult.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      <span className="text-gray-700">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* 프롬프트 결과 */}
          {promptResult && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">🎨 생성된 스마트 프롬프트</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">AI 이미지 생성 프롬프트</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-800 font-mono text-sm leading-relaxed">
                      {promptResult.prompt}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">콘텐츠 타입</h3>
                    <p className="text-gray-700">{promptResult.contentType}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">브랜드 전략</h3>
                    <p className="text-gray-700">{promptResult.brandStrategy}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
