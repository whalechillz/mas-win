// Campaign Manager Component
// /components/admin/content-calendar/CampaignManager.tsx

import React, { useState, useEffect } from 'react';
import { MASGOLF_CAMPAIGNS, convertCampaignToCalendarItems } from '@/data/masgolf-campaigns';
import { ContentCalendarItem } from '@/types';
import { format, addDays } from 'date-fns';

interface CampaignManagerProps {
  onCampaignActivate: (items: ContentCalendarItem[]) => void;
}

const CampaignManager: React.FC<CampaignManagerProps> = ({ onCampaignActivate }) => {
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [activeCampaigns, setActiveCampaigns] = useState<any[]>([]);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);

  // =====================================================
  // 캠페인 활성화
  // =====================================================
  const handleActivateCampaign = async () => {
    if (!selectedCampaign) {
      alert('캠페인을 선택해주세요');
      return;
    }

    const campaign = MASGOLF_CAMPAIGNS.campaigns.find(c => c.id === selectedCampaign);
    if (!campaign) return;

    // 캠페인을 캘린더 아이템으로 변환
    const calendarItems = convertCampaignToCalendarItems(
      selectedCampaign,
      new Date(startDate)
    );

    // 각 아이템에 캠페인 특화 정보 추가
    const enrichedItems = calendarItems.map(item => ({
      ...item,
      description: campaign.objectives.join(', '),
      toneAndManner: {
        tone: 'professional',
        voice: 'encouraging',
        style: campaign.psychologyPrinciples || []
      },
      seoMeta: {
        title: campaign.hook,
        description: campaign.objectives[0]
      }
    }));

    // API 호출로 저장
    try {
      const response = await fetch('/api/content-calendar/campaign/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          campaignId: selectedCampaign,
          items: enrichedItems,
          startDate
        })
      });

      if (response.ok) {
        alert(`"${campaign.name}" 캠페인이 활성화되었습니다.`);
        onCampaignActivate(enrichedItems);
        setActiveCampaigns([...activeCampaigns, campaign]);
      }
    } catch (error) {
      console.error('캠페인 활성화 실패:', error);
    }
  };

  // =====================================================
  // 캠페인 자동 생성
  // =====================================================
  const handleAutoGenerate = async (campaignId: string) => {
    const campaign = MASGOLF_CAMPAIGNS.campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    try {
      const response = await fetch('/api/content-calendar/campaign/auto-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          campaign,
          targetAudience: MASGOLF_CAMPAIGNS.metadata.targetAudience
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`${data.generated.length}개 콘텐츠가 자동 생성되었습니다.`);
      }
    } catch (error) {
      console.error('자동 생성 실패:', error);
    }
  };

  // =====================================================
  // 렌더링
  // =====================================================
  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold mb-2">MASGOLF 캠페인 매니저</h2>
        <p className="text-gray-600">10대 스토리텔링 캠페인 관리 및 실행</p>
      </div>

      {/* Campaign Activation */}
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold mb-4">캠페인 활성화</h3>
        <div className="flex gap-4">
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">캠페인 선택...</option>
            {MASGOLF_CAMPAIGNS.campaigns.map(campaign => (
              <option key={campaign.id} value={campaign.id}>
                [{campaign.stage}] {campaign.name}
              </option>
            ))}
          </select>
          
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          
          <button
            onClick={handleActivateCampaign}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            활성화
          </button>
        </div>
      </div>

      {/* Campaign List */}
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">캠페인 라이브러리</h3>
        <div className="space-y-4">
          {MASGOLF_CAMPAIGNS.campaigns.map(campaign => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              isExpanded={expandedCampaign === campaign.id}
              onToggle={() => setExpandedCampaign(
                expandedCampaign === campaign.id ? null : campaign.id
              )}
              onAutoGenerate={() => handleAutoGenerate(campaign.id)}
            />
          ))}
        </div>
      </div>

      {/* Quarterly Calendar */}
      <div className="p-6 border-t">
        <h3 className="text-lg font-semibold mb-4">분기별 캠페인 일정</h3>
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(MASGOLF_CAMPAIGNS.calendar).map(([quarter, campaigns]) => (
            <div key={quarter} className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{quarter}</h4>
              <ul className="space-y-1">
                {campaigns.map(campaignId => {
                  const campaign = MASGOLF_CAMPAIGNS.campaigns.find(c => c.id === campaignId);
                  return (
                    <li key={campaignId} className="text-sm text-gray-600">
                      • {campaign?.name}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// =====================================================
// Campaign Card Component
// =====================================================
interface CampaignCardProps {
  campaign: any;
  isExpanded: boolean;
  onToggle: () => void;
  onAutoGenerate: () => void;
}

const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  isExpanded,
  onToggle,
  onAutoGenerate
}) => {
  const stageColors = {
    awareness: 'bg-blue-100 text-blue-700',
    interest: 'bg-green-100 text-green-700',
    trust: 'bg-purple-100 text-purple-700',
    conversion: 'bg-red-100 text-red-700',
    retention: 'bg-yellow-100 text-yellow-700'
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div 
        className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 text-xs rounded ${stageColors[campaign.stage as keyof typeof stageColors]}`}>
                {campaign.stage}
              </span>
              <h4 className="font-semibold text-gray-900">{campaign.name}</h4>
            </div>
            <p className="text-sm text-gray-600 italic">"{campaign.hook}"</p>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 bg-white border-t">
          {/* Objectives */}
          <div className="mb-4">
            <h5 className="font-medium text-gray-900 mb-2">목표</h5>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {campaign.objectives.map((obj: string, i: number) => (
                <li key={i}>{obj}</li>
              ))}
            </ul>
          </div>

          {/* Story Structure */}
          {campaign.story && (
            <div className="mb-4">
              <h5 className="font-medium text-gray-900 mb-2">스토리 구조</h5>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <p><strong>주인공:</strong> {campaign.story.hero}</p>
                <p><strong>문제:</strong> {campaign.story.problem}</p>
                <p><strong>해결책:</strong> {campaign.story.solution}</p>
                <p><strong>성공:</strong> {campaign.story.success}</p>
              </div>
            </div>
          )}

          {/* Channels */}
          <div className="mb-4">
            <h5 className="font-medium text-gray-900 mb-2">배포 채널</h5>
            <div className="flex gap-2">
              {campaign.channels.map((channel: string) => (
                <span key={channel} className="px-2 py-1 bg-gray-100 text-xs rounded">
                  {channel}
                </span>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mb-4">
            <h5 className="font-medium text-gray-900 mb-2">CTA</h5>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Primary</span>
                <span className="text-sm">{campaign.cta.primary}</span>
              </div>
              {campaign.cta.secondary && (
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Secondary</span>
                  <span className="text-sm">{campaign.cta.secondary}</span>
                </div>
              )}
            </div>
          </div>

          {/* Psychology Principles */}
          <div className="mb-4">
            <h5 className="font-medium text-gray-900 mb-2">설득 심리학 원칙</h5>
            <div className="flex flex-wrap gap-2">
              {campaign.psychologyPrinciples.map((principle: string) => (
                <span key={principle} className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded">
                  {principle.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onAutoGenerate}
              className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition"
            >
              🤖 AI 콘텐츠 생성
            </button>
            <button
              className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition"
            >
              📊 템플릿 보기
            </button>
            <button
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition"
            >
              📈 성과 분석
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignManager;
