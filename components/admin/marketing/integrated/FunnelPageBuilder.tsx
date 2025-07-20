import React, { useState, useEffect } from 'react';
import { FileImage, Upload, Plus, X, Save, Eye, Palette, Type, FileCode, GitBranch, FolderOpen } from 'lucide-react';

interface FunnelPage {
  id: string;
  funnelPlanId: string;
  mainImage: {
    path: string;
    prompt: string;
    generatedBy: 'claude' | 'manual';
  };
  subImages: Array<{
    path: string;
    position: string;
    purpose: string;
  }>;
  content: {
    headline: string;
    subheadline: string;
    cta: string;
    benefits: string[];
  };
}

interface Props {
  year: number;
  month: number;
}

export default function FunnelPageBuilder({ year, month }: Props) {
  const [funnelPage, setFunnelPage] = useState<FunnelPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  // 편집 데이터
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string>('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [cta, setCta] = useState('');
  const [benefits, setBenefits] = useState<string[]>(['', '', '']);
  const [subImages, setSubImages] = useState<Array<{file: File | null, preview: string, purpose: string}>>([]);
  const [generatingPage, setGeneratingPage] = useState(false);
  const [mcpMessage, setMcpMessage] = useState('');
  const [campaignImages, setCampaignImages] = useState<string[]>([]);

  useEffect(() => {
    loadFunnelPage();
    loadCampaignImages();
  }, [year, month]);

  const loadCampaignImages = async () => {
    try {
      // 캠페인 폴더에서 이미지 목록 가져오기
      const response = await fetch(`/api/campaigns/images?year=${year}&month=${month}`);
      if (response.ok) {
        const data = await response.json();
        setCampaignImages(data.images || []);
      }
    } catch (error) {
      console.error('Failed to load campaign images:', error);
    }
  };

  const loadFunnelPage = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/funnel-pages?year=${year}&month=${month}`);
      if (response.ok) {
        const data = await response.json();
        setFunnelPage(data);
        // 기존 데이터로 폼 채우기
        setHeadline(data.content.headline);
        setSubheadline(data.content.subheadline);
        setCta(data.content.cta);
        setBenefits(data.content.benefits);
        setMainImagePreview(data.mainImage.path);
      }
    } catch (error) {
      console.error('Failed to load funnel page:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMainImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateImageWithAI = async () => {
    if (!imagePrompt) {
      alert('이미지 생성 프롬프트를 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/mcp/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${imagePrompt}. 고품질의 골프장 마케팅 이미지를 생성해주세요. 스타일: 모던하고 깔끔한, 프로페셔널한`,
          year,
          month,
          purpose: 'funnel_main'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.imagePath) {
          setMainImagePreview(data.imagePath);
          // 생성된 이미지 정보 저장
          setImagePrompt('');
          alert('AI 이미지가 성공적으로 생성되었습니다.');
        }
      } else {
        throw new Error('이미지 생성 실패');
      }
    } catch (error) {
      console.error('Failed to generate image:', error);
      alert('이미지 생성 중 오류가 발생했습니다.');
    }
  };

  const addSubImage = () => {
    setSubImages([...subImages, { file: null, preview: '', purpose: '' }]);
  };

  const removeSubImage = (index: number) => {
    setSubImages(subImages.filter((_, i) => i !== index));
  };

  const handleSubImageUpload = (index: number, file: File) => {
    const newSubImages = [...subImages];
    newSubImages[index].file = file;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      newSubImages[index].preview = reader.result as string;
      setSubImages(newSubImages);
    };
    reader.readAsDataURL(file);
  };

  const updateBenefit = (index: number, value: string) => {
    const newBenefits = [...benefits];
    newBenefits[index] = value;
    setBenefits(newBenefits);
  };

  const generateHTMLPageWithMCP = async () => {
    setGeneratingPage(true);
    setMcpMessage('🤖 Claude MCP로 랜딩 페이지를 생성하고 있습니다...');
    
    try {
      // 먼저 데이터 저장
      await handleSave();
      
      // MCP 시뮬레이션 메시지
      setMcpMessage('📝 페이지 템플릿 생성 중...');
      
      // 생성할 HTML 파일 경로
      const fileName = `funnel-${year}-${String(month).padStart(2, '0')}.html`;
      const filePath = `/public/funnel-pages/${fileName}`;
      const publicUrl = `/funnel-pages/${fileName}`; // 실제 접근 URL
      
      // HTML 템플릿 생성
      const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${headline} - 마스골프</title>
    <meta name="description" content="${subheadline}">
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50">
    <!-- Hero Section -->
    <section class="relative bg-white overflow-hidden">
        <div class="max-w-7xl mx-auto">
            <div class="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
                ${mainImagePreview ? `<img class="w-full h-96 object-cover" src="${mainImagePreview}" alt="${headline}">` : ''}
                <main class="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                    <div class="sm:text-center lg:text-left">
                        <h1 class="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                            <span class="block">${headline}</span>
                        </h1>
                        <p class="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                            ${subheadline}
                        </p>
                        <div class="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                            <div class="rounded-md shadow">
                                <a href="#" class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 md:py-4 md:text-lg md:px-10">
                                    ${cta}
                                </a>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    </section>

    <!-- Benefits Section -->
    <section class="py-12 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="lg:text-center">
                <h2 class="text-base text-green-600 font-semibold tracking-wide uppercase">혼택</h2>
                <p class="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                    특별한 혼택을 만나보세요
                </p>
            </div>
            <div class="mt-10">
                <dl class="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
                    ${benefits.filter(b => b).map((benefit, index) => `
                    <div class="relative">
                        <dt>
                            <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p class="ml-16 text-lg leading-6 font-medium text-gray-900">${benefit}</p>
                        </dt>
                    </div>
                    `).join('')}
                </dl>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="bg-green-700">
        <div class="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
            <h2 class="text-3xl font-extrabold text-white sm:text-4xl">
                <span class="block">지금 바로 시작하세요</span>
            </h2>
            <p class="mt-4 text-lg leading-6 text-green-200">
                ${subheadline}
            </p>
            <a href="#" class="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-green-600 bg-white hover:bg-green-50 sm:w-auto">
                ${cta}
            </a>
        </div>
    </section>
</body>
</html>`;
      
      setMcpMessage('💾 파일 저장 중...');
      
      // 파일 정보를 DB에 저장
      await fetch('/api/integrated/funnel-pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          month,
          generatedFile: {
            path: filePath,
            fileName,
            content: htmlContent,
            generatedAt: new Date().toISOString()
          }
        })
      });
      
      setMcpMessage('✅ 랜딩 페이지가 성공적으로 생성되었습니다!');
      
      // 생성된 파일 경로 복사
      navigator.clipboard.writeText(filePath);
      
      setTimeout(() => {
        alert(`퍼널 페이지가 생성되었습니다!\n\n파일 경로: ${filePath}\n접근 URL: https://win.masgolf.co.kr${publicUrl}\n(클립보드에 복사됨)\n\n이제 Claude MCP를 통해 실제 파일로 저장하고 Git에 커밋할 수 있습니다.`);
        setMcpMessage('');
      }, 2000);
      
    } catch (error) {
      console.error('Failed to generate HTML page:', error);
      setMcpMessage('❌ 페이지 생성 중 오류가 발생했습니다.');
    } finally {
      setTimeout(() => {
        setGeneratingPage(false);
        setMcpMessage('');
      }, 3000);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('year', year.toString());
      formData.append('month', month.toString());
      formData.append('headline', headline);
      formData.append('subheadline', subheadline);
      formData.append('cta', cta);
      formData.append('benefits', JSON.stringify(benefits));
      
      if (mainImageFile) {
        formData.append('mainImage', mainImageFile);
      }
      
      subImages.forEach((img, index) => {
        if (img.file) {
          formData.append(`subImage_${index}`, img.file);
          formData.append(`subImagePurpose_${index}`, img.purpose);
        }
      });

      const response = await fetch('/api/funnel-pages', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        alert('퍼널 페이지가 저장되었습니다.');
        loadFunnelPage();
      }
    } catch (error) {
      console.error('Failed to save funnel page:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {year}년 {month}월 퍼널 페이지 구성
        </h3>
        <div className="flex gap-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Eye className="w-4 h-4" />
            {previewMode ? '편집 모드' : '미리보기'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? '저장 중...' : '저장'}
          </button>
          <button
            onClick={generateHTMLPageWithMCP}
            disabled={generatingPage || !headline || !cta}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
          >
            <FileCode className="w-4 h-4" />
            {generatingPage ? 'MCP 생성 중...' : 'MCP로 HTML 생성'}
          </button>
        </div>
      </div>

      {/* MCP 상태 메시지 */}
      {mcpMessage && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
            <p className="text-purple-700 dark:text-purple-300 font-medium">{mcpMessage}</p>
          </div>
        </div>
      )}

      {previewMode ? (
        /* 미리보기 모드 */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="max-w-4xl mx-auto">
            {mainImagePreview && (
              <img 
                src={mainImagePreview} 
                alt="메인 이미지" 
                className="w-full h-96 object-cover rounded-lg mb-8"
              />
            )}
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {headline || '헤드라인을 입력하세요'}
            </h1>
            <h2 className="text-2xl text-gray-600 dark:text-gray-300 mb-8">
              {subheadline || '서브 헤드라인을 입력하세요'}
            </h2>
            <div className="space-y-4 mb-8">
              {benefits.filter(b => b).map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white">
                    ✓
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{benefit}</p>
                </div>
              ))}
            </div>
            <button className="w-full md:w-auto px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700">
              {cta || 'CTA 버튼 텍스트'}
            </button>
          </div>
        </div>
      ) : (
        /* 편집 모드 */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 이미지 섹션 */}
          <div className="space-y-6">
            {/* 메인 이미지 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileImage className="w-5 h-5" />
                메인 이미지
              </h4>
              
              {mainImagePreview ? (
                <div className="relative">
                  <img 
                    src={mainImagePreview} 
                    alt="메인 이미지 미리보기" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => {
                      setMainImageFile(null);
                      setMainImagePreview('');
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMainImageUpload}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center h-full">
                      <Upload className="w-12 h-12 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">이미지를 업로드하세요</p>
                    </div>
                  </label>
                  
                  {/* 캠페인 이미지 선택 */}
                  {campaignImages.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <FolderOpen className="w-4 h-4 inline mr-1" />
                        캠페인 이미지에서 선택
                      </p>
                      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                        {campaignImages.map((img, index) => (
                          <button
                            key={index}
                            onClick={() => setMainImagePreview(`/campaigns/${year}-${String(month).padStart(2, '0')}-${img}`)}
                            className="relative group"
                          >
                            <img 
                              src={`/campaigns/${year}-${String(month).padStart(2, '0')}-${img}`} 
                              alt="" 
                              className="w-full h-20 object-cover rounded border-2 border-transparent hover:border-blue-500"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded transition-all"></div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 space-y-3">
                    <input
                      type="text"
                      placeholder="AI 이미지 생성 프롬프트"
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                    <button
                      onClick={generateImageWithAI}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                    >
                      <Palette className="w-4 h-4" />
                      AI로 이미지 생성
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 서브 이미지 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  서브 이미지
                </h4>
                <button
                  onClick={addSubImage}
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  추가
                </button>
              </div>
              
              <div className="space-y-3">
                {subImages.map((img, index) => (
                  <div key={index} className="flex items-center gap-3">
                    {img.preview ? (
                      <img src={img.preview} alt="" className="w-20 h-20 object-cover rounded" />
                    ) : (
                      <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-blue-500 flex items-center justify-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleSubImageUpload(index, file);
                          }}
                          className="hidden"
                        />
                        <Upload className="w-6 h-6 text-gray-400" />
                      </label>
                    )}
                    <input
                      type="text"
                      placeholder="용도 설명"
                      value={img.purpose}
                      onChange={(e) => {
                        const newSubImages = [...subImages];
                        newSubImages[index].purpose = e.target.value;
                        setSubImages(newSubImages);
                      }}
                      className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                    <button
                      onClick={() => removeSubImage(index)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 콘텐츠 섹션 */}
          <div className="space-y-6">
            {/* 헤드라인 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Type className="w-5 h-5" />
                콘텐츠
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    헤드라인
                  </label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="고객을 사로잡을 헤드라인"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    서브 헤드라인
                  </label>
                  <input
                    type="text"
                    value={subheadline}
                    onChange={(e) => setSubheadline(e.target.value)}
                    placeholder="부가 설명 문구"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CTA 버튼 텍스트
                  </label>
                  <input
                    type="text"
                    value={cta}
                    onChange={(e) => setCta(e.target.value)}
                    placeholder="지금 예약하기"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* 혜택 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                주요 혜택
              </h4>
              
              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <input
                      type="text"
                      value={benefit}
                      onChange={(e) => updateBenefit(index, e.target.value)}
                      placeholder={`혜택 ${index + 1}`}
                      className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                ))}
                <button
                  onClick={() => setBenefits([...benefits, ''])}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  혜택 추가
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}