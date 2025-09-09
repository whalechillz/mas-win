// 블로그 마이그레이션 전용 UI
import { useState } from 'react';
import Head from 'next/head';

export default function BlogMigration() {
  const [url, setUrl] = useState('');
  const [scrapedData, setScrapedData] = useState(null);
  const [isScraping, setIsScraping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState(null);
  const [isRecreating, setIsRecreating] = useState(false);
  const [recreatedImages, setRecreatedImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState({});
  const [isCreating, setIsCreating] = useState(false);

  // URL 스크래핑
  const handleScrape = async () => {
    if (!url) {
      alert('URL을 입력해주세요.');
      return;
    }

    setIsScraping(true);
    try {
      const response = await fetch('/api/scrape-blog-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const result = await response.json();
      
      if (result.success) {
        setScrapedData(result.data);
        // 이미지가 있으면 자동으로 분석 시작
        if (result.data.images && result.data.images.length > 0) {
          handleAnalyzeImages(result.data.images);
        }
      } else {
        alert(`스크래핑 실패: ${result.error}`);
      }
    } catch (error) {
      alert(`스크래핑 오류: ${error.message}`);
    } finally {
      setIsScraping(false);
    }
  };

  // 이미지 분석
  const handleAnalyzeImages = async (images) => {
    if (!images || images.length === 0) return;

    setIsAnalyzing(true);
    const analyses = [];

    try {
      for (const imageUrl of images) {
        const response = await fetch('/api/analyze-image-google-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl })
        });

        const result = await response.json();
        
        if (result.success) {
          analyses.push({
            originalUrl: imageUrl,
            analysis: result.data
          });
        }
      }

      setImageAnalysis(analyses);
    } catch (error) {
      alert(`이미지 분석 오류: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 이미지 재생성
  const handleRecreateImage = async (originalUrl, analysis) => {
    setIsRecreating(true);
    try {
      const response = await fetch('/api/recreate-image-google-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          analysisData: analysis,
          originalImageUrl: originalUrl
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setRecreatedImages(prev => [...prev, result.data]);
      } else {
        alert(`이미지 재생성 실패: ${result.error}`);
      }
    } catch (error) {
      alert(`이미지 재생성 오류: ${error.message}`);
    } finally {
      setIsRecreating(false);
    }
  };

  // 이미지 선택
  const handleImageSelection = (originalUrl, useOriginal) => {
    setSelectedImages(prev => ({
      ...prev,
      [originalUrl]: useOriginal ? 'original' : 'recreated'
    }));
  };

  // 블로그 포스트 생성
  const handleCreateBlogPost = async () => {
    if (!scrapedData) {
      alert('스크래핑된 데이터가 없습니다.');
      return;
    }

    setIsCreating(true);
    try {
      // 선택된 이미지들로 최종 이미지 URL 배열 생성
      const finalImages = scrapedData.images.map(originalUrl => {
        const selection = selectedImages[originalUrl];
        if (selection === 'original') {
          return originalUrl;
        } else if (selection === 'recreated') {
          const recreated = recreatedImages.find(img => img.originalImageUrl === originalUrl);
          return recreated ? recreated.recreatedImageUrl : originalUrl;
        }
        return originalUrl; // 기본값
      });

      // 블로그 포스트 데이터 구성
      const blogPostData = {
        title: scrapedData.title,
        content: scrapedData.content,
        images: finalImages,
        description: scrapedData.description,
        originalUrl: scrapedData.originalUrl,
        platform: scrapedData.platform,
        scrapedAt: scrapedData.scrapedAt
      };

      // Supabase에 저장
      const response = await fetch('/api/blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blogPostData)
      });

      const result = await response.json();
      
      if (result.success) {
        alert('블로그 포스트가 성공적으로 생성되었습니다!');
        // 폼 초기화
        setUrl('');
        setScrapedData(null);
        setImageAnalysis(null);
        setRecreatedImages([]);
        setSelectedImages({});
      } else {
        alert(`블로그 포스트 생성 실패: ${result.error}`);
      }
    } catch (error) {
      alert(`블로그 포스트 생성 오류: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Head>
        <title>블로그 마이그레이션 - MAS Golf</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              🔄 블로그 마이그레이션 & 업그레이드
            </h1>

            {/* URL 입력 섹션 */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                📝 기존 블로그 URL 입력
              </h2>
              <div className="flex gap-4">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.mas9golf.com/post/..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleScrape}
                  disabled={isScraping}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isScraping ? '스크래핑 중...' : '스크래핑 시작'}
                </button>
              </div>
            </div>

            {/* 스크래핑 결과 */}
            {scrapedData && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  ✅ 스크래핑 결과
                </h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {scrapedData.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    플랫폼: {scrapedData.platform} | 
                    이미지 개수: {scrapedData.images?.length || 0}개
                  </p>
                  <div className="text-sm text-gray-500">
                    원본 URL: {scrapedData.originalUrl}
                  </div>
                </div>
              </div>
            )}

            {/* 이미지 분석 결과 */}
            {imageAnalysis && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  🔍 이미지 분석 결과
                </h2>
                <div className="space-y-6">
                  {imageAnalysis.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 원본 이미지 */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">원본 이미지</h4>
                          <img
                            src={item.originalUrl}
                            alt="원본 이미지"
                            className="w-full h-48 object-cover rounded-lg border"
                          />
                        </div>

                        {/* 분석 결과 */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">AI 분석 결과</h4>
                          <div className="text-sm text-gray-600 space-y-2">
                            <div>
                              <strong>주요 내용:</strong> {item.analysis.structuredAnalysis.mainContent}
                            </div>
                            <div>
                              <strong>색상/분위기:</strong> {item.analysis.structuredAnalysis.colors}
                            </div>
                            <div>
                              <strong>스타일:</strong> {item.analysis.structuredAnalysis.style}
                            </div>
                            <div>
                              <strong>골프 요소:</strong> {item.analysis.structuredAnalysis.golfElements}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 이미지 재생성 버튼 */}
                      <div className="mt-4 flex gap-4">
                        <button
                          onClick={() => handleRecreateImage(item.originalUrl, item.analysis)}
                          disabled={isRecreating}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          {isRecreating ? '재생성 중...' : '🔄 이미지 재생성'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 재생성된 이미지들 */}
            {recreatedImages.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  🎨 재생성된 이미지들
                </h2>
                <div className="space-y-6">
                  {recreatedImages.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 원본 이미지 */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">원본 이미지</h4>
                          <img
                            src={item.originalImageUrl}
                            alt="원본 이미지"
                            className="w-full h-48 object-cover rounded-lg border"
                          />
                          <button
                            onClick={() => handleImageSelection(item.originalImageUrl, true)}
                            className={`mt-2 w-full px-4 py-2 rounded-lg ${
                              selectedImages[item.originalImageUrl] === 'original'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            원본 이미지 사용
                          </button>
                        </div>

                        {/* 재생성된 이미지 */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">재생성된 이미지</h4>
                          <img
                            src={item.recreatedImageUrl}
                            alt="재생성된 이미지"
                            className="w-full h-48 object-cover rounded-lg border"
                          />
                          <button
                            onClick={() => handleImageSelection(item.originalImageUrl, false)}
                            className={`mt-2 w-full px-4 py-2 rounded-lg ${
                              selectedImages[item.originalImageUrl] === 'recreated'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            재생성된 이미지 사용
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 최종 생성 버튼 */}
            {scrapedData && (
              <div className="flex justify-center">
                <button
                  onClick={handleCreateBlogPost}
                  disabled={isCreating}
                  className="px-8 py-4 bg-purple-600 text-white text-lg font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? '블로그 포스트 생성 중...' : '🚀 블로그 포스트 생성'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
