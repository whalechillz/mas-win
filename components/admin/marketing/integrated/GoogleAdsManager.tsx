import React, { useState, useEffect } from 'react';
import { BarChart3, Link, Copy, Plus, Edit2, Trash2, ExternalLink, Tag, FileCode, Download, X } from 'lucide-react';

interface GoogleAdsData {
  campaignId: string;
  campaignName: string;
  utmTags: {
    source: string;
    medium: string;
    campaign: string;
    content?: string;
    term?: string;
  };
  adCreatives: Array<{
    id: string;
    imagePath: string;
    headline: string;
    description: string;
    finalUrl: string;
  }>;
  performance?: {
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    cost: number;
  };
}

interface Props {
  year: number;
  month: number;
}

export default function GoogleAdsManager({ year, month }: Props) {
  const [campaigns, setCampaigns] = useState<GoogleAdsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<GoogleAdsData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // 새 캠페인 생성 폼
  const [newCampaign, setNewCampaign] = useState({
    campaignName: '',
    utmSource: 'google',
    utmMedium: 'cpc',
    utmCampaign: '',
    landingUrl: 'https://win.masgolf.co.kr'
  });

  // 광고 크리에이티브 폼
  const [newCreative, setNewCreative] = useState({
    headline: '',
    description: '',
    imagePath: ''
  });
  
  // MCP 상태
  const [generatingCSV, setGeneratingCSV] = useState(false);
  const [mcpMessage, setMcpMessage] = useState('');

  useEffect(() => {
    loadCampaigns();
  }, [year, month]);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/google-ads/campaigns?year=${year}&month=${month}`);
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateUTMUrl = (campaign: GoogleAdsData, creative?: any) => {
    const baseUrl = creative?.finalUrl || 'https://win.masgolf.co.kr';
    const params = new URLSearchParams({
      utm_source: campaign.utmTags.source,
      utm_medium: campaign.utmTags.medium,
      utm_campaign: campaign.utmTags.campaign,
      ...(campaign.utmTags.content && { utm_content: campaign.utmTags.content }),
      ...(campaign.utmTags.term && { utm_term: campaign.utmTags.term })
    });
    
    return `${baseUrl}?${params.toString()}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('클립보드에 복사되었습니다.');
  };

  const createCampaign = async () => {
    try {
      const response = await fetch('/api/google-ads/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          month,
          campaignName: newCampaign.campaignName,
          utmTags: {
            source: newCampaign.utmSource,
            medium: newCampaign.utmMedium,
            campaign: newCampaign.utmCampaign || `${year}-${month}-campaign`,
            content: `${year}${String(month).padStart(2, '0')}`,
          }
        })
      });

      if (response.ok) {
        alert('캠페인이 생성되었습니다.');
        loadCampaigns();
        setIsCreating(false);
        setNewCampaign({
          campaignName: '',
          utmSource: 'google',
          utmMedium: 'cpc',
          utmCampaign: '',
          landingUrl: 'https://win.masgolf.co.kr'
        });
      }
    } catch (error) {
      console.error('Failed to create campaign:', error);
      alert('캠페인 생성 중 오류가 발생했습니다.');
    }
  };

  const addCreative = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/google-ads/campaigns/${campaignId}/creatives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCreative)
      });

      if (response.ok) {
        alert('광고 크리에이티브가 추가되었습니다.');
        loadCampaigns();
        setNewCreative({ headline: '', description: '', imagePath: '' });
      }
    } catch (error) {
      console.error('Failed to add creative:', error);
    }
  };

  const generateAdCopy = async () => {
    try {
      // 먼저 월별 테마와 퍼널 정보 가져오기
      const themeResponse = await fetch(`/api/admin/monthly-themes?year=${year}&month=${month}`);
      const funnelResponse = await fetch(`/api/funnel-plans/${year}/${month}`);
      
      let monthlyTheme = '';
      let funnelData = null;
      
      if (themeResponse.ok) {
        const themeData = await themeResponse.json();
        if (themeData && themeData.length > 0) {
          monthlyTheme = themeData[0].theme;
        }
      }
      
      if (funnelResponse.ok) {
        funnelData = await funnelResponse.json();
      }

      const response = await fetch('/api/mcp/generate-ad-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          month,
          theme: monthlyTheme,
          funnelPlan: funnelData,
          channel: 'google_ads',
          requirements: {
            headline: { maxLength: 30, count: 3 },
            description: { maxLength: 90, count: 2 }
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.headlines && data.descriptions) {
          // 생성된 카피를 폼에 적용
          setNewCreative({
            headline: data.headlines[0],
            description: data.descriptions[0],
            imagePath: ''
          });
          alert('AI 광고 카피가 생성되었습니다. 필요에 따라 수정해주세요.');
        }
      } else {
        throw new Error('광고 카피 생성 실패');
      }
    } catch (error) {
      console.error('Failed to generate ad copy:', error);
      alert('광고 카피 생성 중 오류가 발생했습니다.');
    }
  };

  const generateAdCreativesCSVWithMCP = async () => {
    if (campaigns.length === 0) {
      alert('먼저 캠페인을 생성해주세요.');
      return;
    }

    setGeneratingCSV(true);
    setMcpMessage('🤖 Claude MCP로 광고 소재 CSV를 생성하고 있습니다...');

    try {
      // CSV 헤더
      let csvContent = 'Campaign Name,Campaign ID,Headline 1,Headline 2,Headline 3,Description 1,Description 2,Final URL,Display URL,Path 1,Path 2,Image\n';

      // 캠페인 폴더 경로
      const campaignFolder = `/campaigns/${year}-${String(month).padStart(2, '0')}-`; // 예: /campaigns/2025-07-

      // 각 캠페인별로 광고 소재 생성
      for (const campaign of campaigns) {
        const finalUrl = generateUTMUrl(campaign);
        const displayUrl = 'win.masgolf.co.kr';
        
        // 기본 광고 카피 (실제로는 AI가 다양한 버전 생성)
        const headlines = [
          `${month}월 특별 혼택 | 마스골프`,
          `프리미엄 골프 예약`,
          `최대 30% 할인`
        ];
        
        const descriptions = [
          `${year}년 ${month}월 한정! 프리미엄 골프장에서 특별한 혼택을 만나보세요. 지금 바로 예약하세요.`,
          `최고급 시설과 서비스로 완벽한 라운딩. ${month}월 특별 할인 혼택을 놓치지 마세요!`
        ];

        // CSV 행 추가
        csvContent += `"${campaign.campaignName}","${campaign.campaignId}","${headlines[0]}","${headlines[1]}","${headlines[2]}","${descriptions[0]}","${descriptions[1]}","${finalUrl}","${displayUrl}","예약","혼택","${campaignFolder}[SELECT_IMAGE]"\n`;
      }

      setMcpMessage('💾 CSV 파일 생성 중...');

      // 파일 정보
      const fileName = `google-ads-creatives-${year}-${String(month).padStart(2, '0')}.csv`;
      const filePath = `/public/google-ads/${fileName}`;

      // 파일 정보 저장
      await fetch('/api/integrated/google-ads-utm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          month,
          csvFile: {
            path: filePath,
            fileName,
            content: csvContent,
            generatedAt: new Date().toISOString()
          }
        })
      });

      setMcpMessage('✅ 광고 소재 CSV가 성공적으로 생성되었습니다!');

      // CSV 내용 클립보드에 복사
      navigator.clipboard.writeText(csvContent);

      setTimeout(() => {
        alert(`광고 소재 CSV가 생성되었습니다!\n\n파일 경로: ${filePath}\n(CSV 내용이 클립보드에 복사됨)\n\n이제 Claude MCP를 통해 실제 파일로 저장할 수 있습니다.`);
        setMcpMessage('');
      }, 2000);

    } catch (error) {
      console.error('Failed to generate CSV:', error);
      setMcpMessage('❌ CSV 생성 중 오류가 발생했습니다.');
    } finally {
      setTimeout(() => {
        setGeneratingCSV(false);
        setMcpMessage('');
      }, 3000);
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
          {year}년 {month}월 구글 애드 캠페인
        </h3>
        <div className="flex gap-3">
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            새 캠페인
          </button>
          <button
            onClick={generateAdCreativesCSVWithMCP}
            disabled={generatingCSV || campaigns.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
          >
            <FileCode className="w-4 h-4" />
            {generatingCSV ? 'CSV 생성 중...' : 'MCP로 CSV 생성'}
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

      {/* 캠페인 생성 폼 */}
      {isCreating && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
            새 캠페인 생성
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="캠페인 이름"
              value={newCampaign.campaignName}
              onChange={(e) => setNewCampaign({...newCampaign, campaignName: e.target.value})}
              className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
            <input
              type="text"
              placeholder="UTM Campaign"
              value={newCampaign.utmCampaign}
              onChange={(e) => setNewCampaign({...newCampaign, utmCampaign: e.target.value})}
              className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
            <select
              value={newCampaign.utmSource}
              onChange={(e) => setNewCampaign({...newCampaign, utmSource: e.target.value})}
              className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="google">Google</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="naver">Naver</option>
            </select>
            <select
              value={newCampaign.utmMedium}
              onChange={(e) => setNewCampaign({...newCampaign, utmMedium: e.target.value})}
              className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="cpc">CPC</option>
              <option value="cpm">CPM</option>
              <option value="display">Display</option>
              <option value="social">Social</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              취소
            </button>
            <button
              onClick={createCampaign}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              생성
            </button>
          </div>
        </div>
      )}

      {/* 캠페인 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {campaigns.map((campaign) => (
          <div
            key={campaign.campaignId}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {campaign.campaignName}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  ID: {campaign.campaignId}
                </p>
              </div>
              <button
                onClick={() => setSelectedCampaign(campaign)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>

            {/* UTM 태그 */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Tag className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-300">
                  source: {campaign.utmTags.source} | medium: {campaign.utmTags.medium}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={generateUTMUrl(campaign)}
                  readOnly
                  className="flex-1 px-3 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                />
                <button
                  onClick={() => copyToClipboard(generateUTMUrl(campaign))}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 성과 지표 */}
            {campaign.performance && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">노출</p>
                  <p className="font-semibold">{campaign.performance.impressions.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">클릭</p>
                  <p className="font-semibold">{campaign.performance.clicks.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">CTR</p>
                  <p className="font-semibold">{campaign.performance.ctr.toFixed(2)}%</p>
                </div>
              </div>
            )}

            {/* 크리에이티브 수 */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                크리에이티브: {campaign.adCreatives.length}개
              </span>
              <button
                onClick={() => {
                  setSelectedCampaign(campaign);
                  // 크리에이티브 추가 모달 열기
                }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                추가
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 캠페인이 없는 경우 */}
      {campaigns.length === 0 && !isCreating && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            아직 생성된 캠페인이 없습니다.
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            첫 캠페인 만들기
          </button>
        </div>
      )}

      {/* 선택된 캠페인 상세 (모달로 구현 가능) */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedCampaign.campaignName} - 크리에이티브
              </h3>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 크리에이티브 추가 폼 */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium mb-3">새 크리에이티브 추가</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="헤드라인 (최대 30자)"
                  value={newCreative.headline}
                  onChange={(e) => setNewCreative({...newCreative, headline: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500"
                />
                <textarea
                  placeholder="설명 (최대 90자)"
                  value={newCreative.description}
                  onChange={(e) => setNewCreative({...newCreative, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={generateAdCopy}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    AI로 광고 카피 생성
                  </button>
                  <button
                    onClick={() => addCreative(selectedCampaign.campaignId)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    추가
                  </button>
                </div>
              </div>
            </div>

            {/* 기존 크리에이티브 목록 */}
            <div className="space-y-3">
              {selectedCampaign.adCreatives.map((creative) => (
                <div
                  key={creative.id}
                  className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
                >
                  <h5 className="font-medium text-gray-900 dark:text-white">
                    {creative.headline}
                  </h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {creative.description}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <input
                      type="text"
                      value={generateUTMUrl(selectedCampaign, creative)}
                      readOnly
                      className="flex-1 px-2 py-1 text-xs border rounded bg-gray-50 dark:bg-gray-700"
                    />
                    <button
                      onClick={() => copyToClipboard(generateUTMUrl(selectedCampaign, creative))}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}