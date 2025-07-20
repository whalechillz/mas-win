import React, { useState, useEffect } from 'react';
import { Brain, FileText, MessageCircle, Mail, Instagram, Calendar, Sparkles, Save, FileCode, FolderOpen } from 'lucide-react';

interface ContentGenerationRequest {
  funnelPlanId: string;
  mainImagePath: string;
  channels: Array<'blog' | 'kakao' | 'sms' | 'email' | 'instagram'>;
  tone: string;
  keywords: string[];
}

interface GeneratedContent {
  channel: string;
  title?: string;
  content: string;
  hashtags?: string[];
  scheduledDate?: string;
  status: 'draft' | 'scheduled' | 'published';
}

interface Props {
  year: number;
  month: number;
}

const channelIcons = {
  blog: <FileText className="w-4 h-4" />,
  kakao: <MessageCircle className="w-4 h-4" />,
  sms: <MessageCircle className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  instagram: <Instagram className="w-4 h-4" />
};

const channelNames = {
  blog: '블로그',
  kakao: '카카오톡',
  sms: 'SMS',
  email: '이메일',
  instagram: '인스타그램'
};

export default function ContentGenerator({ year, month }: Props) {
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [tone, setTone] = useState('professional');
  const [keywords, setKeywords] = useState<string[]>(['']);
  const [mainImagePath, setMainImagePath] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedContents, setGeneratedContents] = useState<GeneratedContent[]>([]);
  const [monthlyTheme, setMonthlyTheme] = useState('');
  const [funnelPlan, setFunnelPlan] = useState<any>(null);
  
  // MCP 상태
  const [generatingFiles, setGeneratingFiles] = useState(false);
  const [mcpMessage, setMcpMessage] = useState('');
  
  // 퍼널 페이지 및 캠페인 자료
  const [funnelPageData, setFunnelPageData] = useState<any>(null);
  const [campaignImages, setCampaignImages] = useState<string[]>([]);

  useEffect(() => {
    loadMonthlyData();
  }, [year, month]);

  const loadMonthlyData = async () => {
    try {
      // 월별 테마 로드
      const themeResponse = await fetch(`/api/admin/monthly-themes?year=${year}&month=${month}`);
      if (themeResponse.ok) {
        const themeData = await themeResponse.json();
        if (themeData && themeData.length > 0) {
          setMonthlyTheme(themeData[0].theme);
        }
      }

      // 퍼널 계획 로드
      const funnelResponse = await fetch(`/api/funnel-plans/${year}/${month}`);
      if (funnelResponse.ok) {
        const funnelData = await funnelResponse.json();
        setFunnelPlan(funnelData);
      }
      
      // 퍼널 페이지 데이터 로드
      const pageResponse = await fetch(`/api/funnel-pages?year=${year}&month=${month}`);
      if (pageResponse.ok) {
        const pageData = await pageResponse.json();
        setFunnelPageData(pageData);
        // 메인 이미지 경로 자동 설정
        if (pageData?.mainImage?.path) {
          setMainImagePath(pageData.mainImage.path);
        }
      }
      
      // 캠페인 이미지 로드
      const imagesResponse = await fetch(`/api/campaigns/images?year=${year}&month=${month}`);
      if (imagesResponse.ok) {
        const imagesData = await imagesResponse.json();
        setCampaignImages(imagesData.images || []);
      }
    } catch (error) {
      console.error('Failed to load monthly data:', error);
    }
  };

  const toggleChannel = (channel: string) => {
    setSelectedChannels(prev => 
      prev.includes(channel) 
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const updateKeyword = (index: number, value: string) => {
    const newKeywords = [...keywords];
    newKeywords[index] = value;
    setKeywords(newKeywords);
  };

  const addKeyword = () => {
    setKeywords([...keywords, '']);
  };

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const generateContent = async () => {
    if (selectedChannels.length === 0) {
      alert('최소 하나의 채널을 선택해주세요.');
      return;
    }

    setGenerating(true);
    try {
      // Claude MCP를 사용하여 멀티채널 콘텐츠 생성
      const response = await fetch('/api/mcp/generate-multichannel-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          month,
          theme: monthlyTheme,
          funnelPlan,
          funnelPageData, // 퍼널 페이지 초안 데이터 추가
          mainImagePath,
          channels: selectedChannels,
          tone,
          keywords: keywords.filter(k => k.trim()),
          channelRequirements: {
            blog: { minLength: 800, maxLength: 1200, includeSEO: true },
            kakao: { maxLength: 1000, includeEmojis: true, includeCTA: true },
            sms: { maxLength: 90, directAndConcise: true, includeCTA: true },
            email: { includeSubject: true, includePreheader: true },
            instagram: { maxCaptionLength: 2200, hashtagCount: 15 }
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.contents && Array.isArray(data.contents)) {
          setGeneratedContents(data.contents);
          alert(`${data.contents.length}개 채널의 콘텐츠가 성공적으로 생성되었습니다.`);
        }
      } else {
        throw new Error('콘텐츠 생성 실패');
      }
    } catch (error) {
      console.error('Failed to generate content:', error);
      alert('콘텐츠 생성 중 오류가 발생했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  const saveContent = async (content: GeneratedContent) => {
    try {
      const response = await fetch('/api/contents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...content,
          year,
          month,
          funnelPlanId: funnelPlan?.id
        })
      });

      if (response.ok) {
        alert('콘텐츠가 저장되었습니다.');
      }
    } catch (error) {
      console.error('Failed to save content:', error);
    }
  };

  const scheduleContent = async (content: GeneratedContent, date: string) => {
    try {
      const response = await fetch('/api/contents/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...content,
          scheduledDate: date,
          status: 'scheduled'
        })
      });

      if (response.ok) {
        alert('콘텐츠가 예약되었습니다.');
        // 목록 업데이트
        const updatedContents = generatedContents.map(c => 
          c === content ? { ...c, scheduledDate: date, status: 'scheduled' as const } : c
        );
        setGeneratedContents(updatedContents);
      }
    } catch (error) {
      console.error('Failed to schedule content:', error);
    }
  };

  const generateContentFilesWithMCP = async () => {
    if (generatedContents.length === 0) {
      alert('먼저 AI 콘텐츠를 생성해주세요.');
      return;
    }

    setGeneratingFiles(true);
    setMcpMessage('🤖 Claude MCP로 콘텐츠 파일을 생성하고 있습니다...');

    try {
      const fileInfos = [];

      for (const content of generatedContents) {
        setMcpMessage(`📝 ${channelNames[content.channel as keyof typeof channelNames]} 콘텐츠 파일 생성 중...`);

        let fileName = '';
        let filePath = '';
        let fileContent = '';

        switch (content.channel) {
          case 'blog':
            fileName = `blog-${year}-${String(month).padStart(2, '0')}-${Date.now()}.md`;
            filePath = `/contents/blog/${fileName}`;
            fileContent = `---
title: ${content.title || '제목'}
date: ${new Date().toISOString()}
tags: ${content.hashtags?.join(', ') || ''}
---

${content.content}`;
            break;

          case 'email':
            fileName = `email-${year}-${String(month).padStart(2, '0')}-${Date.now()}.html`;
            filePath = `/contents/email/${fileName}`;
            fileContent = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>${content.content.split('\n')[0] || '이메일 제목'}</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    ${content.content.replace(/\n/g, '<br>')}
</body>
</html>`;
            break;

          case 'kakao':
          case 'sms':
            fileName = `${content.channel}-${year}-${String(month).padStart(2, '0')}-${Date.now()}.txt`;
            filePath = `/contents/${content.channel}/${fileName}`;
            fileContent = content.content;
            break;

          case 'instagram':
            fileName = `instagram-${year}-${String(month).padStart(2, '0')}-${Date.now()}.json`;
            filePath = `/contents/social/${fileName}`;
            fileContent = JSON.stringify({
              caption: content.content,
              hashtags: content.hashtags || [],
              scheduledDate: content.scheduledDate,
              imageUrl: mainImagePath
            }, null, 2);
            break;
        }

        fileInfos.push({
          channel: content.channel,
          fileName,
          filePath,
          content: fileContent
        });
      }

      setMcpMessage('💾 파일 정보 저장 중...');

      // 파일 정보를 DB에 저장
      await fetch('/api/integrated/contents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          month,
          generatedFiles: fileInfos,
          generatedAt: new Date().toISOString()
        })
      });

      setMcpMessage('✅ 모든 콘텐츠 파일이 성공적으로 생성되었습니다!');

      // 파일 경로 목록 클립보드에 복사
      const filePathList = fileInfos.map(f => f.filePath).join('\n');
      navigator.clipboard.writeText(filePathList);

      setTimeout(() => {
        alert(`${fileInfos.length}개의 콘텐츠 파일이 생성되었습니다!\n\n파일 경로들:\n${filePathList}\n\n(파일 경로 목록이 클립보드에 복사됨)\n\n이제 Claude MCP를 통해 실제 파일로 저장할 수 있습니다.`);
        setMcpMessage('');
      }, 2000);

    } catch (error) {
      console.error('Failed to generate content files:', error);
      setMcpMessage('❌ 파일 생성 중 오류가 발생했습니다.');
    } finally {
      setTimeout(() => {
        setGeneratingFiles(false);
        setMcpMessage('');
      }, 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {year}년 {month}월 AI 콘텐츠 생성
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          테마: {monthlyTheme || '미설정'} | 퍼널 계획: {funnelPlan ? '설정됨' : '미설정'} | 퍼널 페이지: {funnelPageData ? '생성됨' : '미생성'}
        </p>
      </div>

      {/* 채널 선택 */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
          채널 선택
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(channelNames).map(([key, name]) => (
            <button
              key={key}
              onClick={() => toggleChannel(key)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                selectedChannels.includes(key)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              {channelIcons[key as keyof typeof channelIcons]}
              <span>{name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 퍼널 페이지 초안 미리보기 */}
      {funnelPageData && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            📝 퍼널 페이지 초안 정보
          </h4>
          <div className="text-sm space-y-1 text-blue-800 dark:text-blue-200">
            <p><strong>헤드라인:</strong> {funnelPageData.content?.headline}</p>
            <p><strong>서브 헤드라인:</strong> {funnelPageData.content?.subheadline}</p>
            <p><strong>CTA:</strong> {funnelPageData.content?.cta}</p>
            {funnelPageData.content?.benefits && (
              <p><strong>혼택:</strong> {funnelPageData.content.benefits.filter((b: string) => b).join(', ')}</p>
            )}
            <p><strong>페이지 URL:</strong> <a href={`/funnel-${year}-${String(month).padStart(2, '0')}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">/funnel-{year}-{String(month).padStart(2, '0')}</a></p>
          </div>
        </div>
      )}

      {/* 생성 설정 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 톤 설정 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
            톤 & 매너
          </h4>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="professional">전문적</option>
            <option value="friendly">친근한</option>
            <option value="casual">캐주얼</option>
            <option value="enthusiastic">열정적</option>
            <option value="informative">정보 제공</option>
          </select>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              메인 이미지 경로
            </label>
            <input
              type="text"
              value={mainImagePath}
              onChange={(e) => setMainImagePath(e.target.value)}
              placeholder="/images/campaign/main.jpg"
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
            
            {/* 캠페인 이미지에서 선택 */}
            {campaignImages.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">캠페인 이미지 선택:</p>
                <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                  {campaignImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setMainImagePath(`/campaigns/${year}-${String(month).padStart(2, '0')}-${img}`)}
                      className="relative group"
                    >
                      <img 
                        src={`/campaigns/${year}-${String(month).padStart(2, '0')}-${img}`} 
                        alt="" 
                        className="w-full h-16 object-cover rounded border-2 border-transparent hover:border-blue-500"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 키워드 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
            핵심 키워드
          </h4>
          <div className="space-y-2">
            {keywords.map((keyword, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => updateKeyword(index, e.target.value)}
                  placeholder="키워드 입력"
                  className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                {keywords.length > 1 && (
                  <button
                    onClick={() => removeKeyword(index)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addKeyword}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              + 키워드 추가
            </button>
          </div>
        </div>
      </div>

      {/* 생성 버튼 */}
      <div className="flex justify-center gap-4">
        <button
          onClick={generateContent}
          disabled={generating || selectedChannels.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-5 h-5" />
          {generating ? '생성 중...' : 'AI 콘텐츠 생성'}
        </button>
        {generatedContents.length > 0 && (
          <button
            onClick={generateContentFilesWithMCP}
            disabled={generatingFiles}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 disabled:opacity-50"
          >
            <FileCode className="w-5 h-5" />
            {generatingFiles ? '파일 생성 중...' : 'MCP로 파일 생성'}
          </button>
        )}
      </div>

      {/* MCP 상태 메시지 */}
      {mcpMessage && (
        <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
            <p className="text-green-700 dark:text-green-300 font-medium">{mcpMessage}</p>
          </div>
        </div>
      )}

      {/* 생성된 콘텐츠 */}
      {generatedContents.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            생성된 콘텐츠
          </h4>
          {generatedContents.map((content, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  {channelIcons[content.channel as keyof typeof channelIcons]}
                  <h5 className="font-medium text-gray-900 dark:text-white">
                    {channelNames[content.channel as keyof typeof channelNames]}
                  </h5>
                  {content.status === 'scheduled' && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                      예약됨
                    </span>
                  )}
                </div>
                <button
                  onClick={() => saveContent(content)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>

              {content.title && (
                <h6 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                  {content.title}
                </h6>
              )}
              
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap mb-4">
                {content.content}
              </p>

              {content.hashtags && content.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {content.hashtags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 예약 설정 */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input
                  type="datetime-local"
                  defaultValue={content.scheduledDate}
                  onChange={(e) => scheduleContent(content, e.target.value)}
                  className="px-3 py-1 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-sm text-gray-500">
                  {content.scheduledDate ? '예약 변경' : '게시 예약'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}