// Killer Content Series Manager Component
// /components/admin/content-calendar/KillerContentManager.tsx

import React, { useState, useEffect } from 'react';
import { KILLER_CONTENT_SERIES, getContentTemplate, generateLeadMagnet } from '@/data/killer-content-series';
import { ContentCalendarItem } from '@/types';

interface KillerContentManagerProps {
  onContentGenerate: (items: ContentCalendarItem[]) => void;
  onLeadCapture?: (lead: any) => void;
}

const KillerContentManager: React.FC<KillerContentManagerProps> = ({
  onContentGenerate,
  onLeadCapture
}) => {
  const [selectedSeries, setSelectedSeries] = useState<string>('');
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<{ [key: string]: string }>({});
  const [leadStats, setLeadStats] = useState<any>(null);

  // 시리즈 데이터 가져오기
  const seriesList = [
    {
      id: 'series-distance',
      ...KILLER_CONTENT_SERIES.distanceImprovement,
      icon: '🎯',
      color: 'blue'
    },
    {
      id: 'series-health',
      ...KILLER_CONTENT_SERIES.healthAndFitness,
      icon: '💪',
      color: 'green'
    },
    {
      id: 'series-insurance',
      ...KILLER_CONTENT_SERIES.lossAversion,
      icon: '🛡️',
      color: 'purple'
    },
    {
      id: 'series-prestige',
      ...KILLER_CONTENT_SERIES.socialStatus,
      icon: '👑',
      color: 'yellow'
    }
  ];

  // =====================================================
  // 시리즈 활성화
  // =====================================================
  const handleActivateSeries = async (seriesId: string) => {
    setGenerationStatus({ ...generationStatus, [seriesId]: 'generating' });
    
    try {
      const response = await fetch('/api/content-calendar/killer-series/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seriesId,
          autoGenerate: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGenerationStatus({ ...generationStatus, [seriesId]: 'completed' });
        onContentGenerate(data.contents);
        alert(`"${data.seriesName}" 시리즈가 활성화되었습니다.`);
      }
    } catch (error) {
      console.error('시리즈 활성화 실패:', error);
      setGenerationStatus({ ...generationStatus, [seriesId]: 'failed' });
    }
  };

  // =====================================================
  // 단일 에피소드 생성
  // =====================================================
  const handleGenerateEpisode = async (seriesId: string, episodeNumber: number) => {
    try {
      const template = getContentTemplate(seriesId, episodeNumber);
      if (!template) return;

      const response = await fetch('/api/content-calendar/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template,
          seriesId,
          episodeNumber,
          useAI: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`에피소드 ${episodeNumber} 생성 완료`);
        onContentGenerate([data.content]);
      }
    } catch (error) {
      console.error('에피소드 생성 실패:', error);
    }
  };

  // =====================================================
  // 리드 매그넷 생성
  // =====================================================
  const handleCreateLeadMagnet = async (seriesId: string) => {
    const leadMagnet = generateLeadMagnet(seriesId);
    if (!leadMagnet) {
      alert('이 시리즈는 리드 매그넷이 없습니다.');
      return;
    }

    try {
      const response = await fetch('/api/content-calendar/lead-magnet/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seriesId,
          leadMagnet
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`리드 매그넷 "${leadMagnet.title}" 생성 완료\n다운로드 URL: ${data.downloadUrl}`);
      }
    } catch (error) {
      console.error('리드 매그넷 생성 실패:', error);
    }
  };

  // =====================================================
  // 리드 통계 로드
  // =====================================================
  useEffect(() => {
    loadLeadStats();
  }, []);

  const loadLeadStats = async () => {
    try {
      const response = await fetch('/api/content-calendar/killer-series/stats');
      if (response.ok) {
        const data = await response.json();
        setLeadStats(data);
      }
    } catch (error) {
      console.error('통계 로드 실패:', error);
    }
  };

  // =====================================================
  // 렌더링
  // =====================================================
  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">킬러 콘텐츠 시리즈 관리</h2>
            <p className="text-gray-600 mt-1">시니어 골퍼 대상 4대 핵심 콘텐츠 시리즈</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">콘텐츠 전략</div>
            <div className="text-lg font-semibold">교육 80% + 소프트셀 20%</div>
          </div>
        </div>
      </div>

      {/* Strategy Overview */}
      <div className="p-6 bg-gray-50 border-b">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-sm font-medium">타겟</div>
            <div className="text-xs text-gray-600">50-70대 남성</div>
          </div>
          <div>
            <div className="text-3xl mb-2">📊</div>
            <div className="text-sm font-medium">신뢰 구축</div>
            <div className="text-xs text-gray-600">데이터 기반</div>
          </div>
          <div>
            <div className="text-3xl mb-2">🎓</div>
            <div className="text-sm font-medium">톤앤매너</div>
            <div className="text-xs text-gray-600">전문가의 친근함</div>
          </div>
          <div>
            <div className="text-3xl mb-2">💎</div>
            <div className="text-sm font-medium">리드 수집</div>
            <div className="text-xs text-gray-600">15-30% 전환율</div>
          </div>
        </div>
      </div>

      {/* Series List */}
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">4대 킬러 콘텐츠 시리즈</h3>
        <div className="space-y-4">
          {seriesList.map(series => (
            <SeriesCard
              key={series.id}
              series={series}
              isExpanded={expandedSeries === series.id}
              onToggle={() => setExpandedSeries(
                expandedSeries === series.id ? null : series.id
              )}
              onActivate={() => handleActivateSeries(series.id)}
              onGenerateEpisode={(episodeNum) => handleGenerateEpisode(series.id, episodeNum)}
              onCreateLeadMagnet={() => handleCreateLeadMagnet(series.id)}
              status={generationStatus[series.id]}
            />
          ))}
        </div>
      </div>

      {/* Lead Statistics */}
      {leadStats && (
        <div className="p-6 border-t bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">리드 수집 현황</h3>
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              label="총 리드"
              value={leadStats.totalLeads}
              change="+12%"
              icon="📧"
            />
            <StatCard
              label="PDF 다운로드"
              value={leadStats.pdfDownloads}
              change="+25%"
              icon="📄"
            />
            <StatCard
              label="이메일 구독"
              value={leadStats.emailSubscribers}
              change="+8%"
              icon="✉️"
            />
            <StatCard
              label="전환율"
              value={`${leadStats.conversionRate}%`}
              change="+3%"
              icon="🎯"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// =====================================================
// Series Card Component
// =====================================================
interface SeriesCardProps {
  series: any;
  isExpanded: boolean;
  onToggle: () => void;
  onActivate: () => void;
  onGenerateEpisode: (episodeNumber: number) => void;
  onCreateLeadMagnet: () => void;
  status?: string;
}

const SeriesCard: React.FC<SeriesCardProps> = ({
  series,
  isExpanded,
  onToggle,
  onActivate,
  onGenerateEpisode,
  onCreateLeadMagnet,
  status
}) => {
  const colorMap: { [key: string]: string } = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    yellow: 'bg-yellow-50 border-yellow-200'
  };

  const statusMap: { [key: string]: { color: string; text: string } } = {
    generating: { color: 'text-blue-600', text: '생성 중...' },
    completed: { color: 'text-green-600', text: '✓ 완료' },
    failed: { color: 'text-red-600', text: '✗ 실패' }
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${colorMap[series.color]}`}>
      <div 
        className="p-4 cursor-pointer hover:bg-opacity-70 transition"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <span className="text-3xl">{series.icon}</span>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{series.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{series.subtitle}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span>{series.totalEpisodes}개 에피소드</span>
                <span>{series.publishingSchedule}</span>
                <span>{series.channels.join(', ')}</span>
                {status && (
                  <span className={statusMap[status]?.color}>
                    {statusMap[status]?.text}
                  </span>
                )}
              </div>
            </div>
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
          {/* Description */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">{series.description}</p>
          </div>

          {/* Episodes */}
          <div className="mb-4">
            <h5 className="font-medium text-gray-900 mb-2">에피소드</h5>
            <div className="space-y-2">
              {series.episodes.map((episode: any) => (
                <div key={episode.number} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <span className="font-medium text-sm">
                      EP{episode.number}. {episode.title}
                    </span>
                    {episode.subtitle && (
                      <span className="text-xs text-gray-500 ml-2">{episode.subtitle}</span>
                    )}
                  </div>
                  <button
                    onClick={() => onGenerateEpisode(episode.number)}
                    className="px-3 py-1 text-xs bg-white border rounded hover:bg-gray-50"
                  >
                    생성
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Info */}
          {series.cta && (
            <div className="mb-4 p-3 bg-blue-50 rounded">
              <h5 className="font-medium text-gray-900 mb-1">CTA 전략</h5>
              <div className="text-sm text-gray-600">
                <p>Primary: {series.cta.primary || series.cta.message}</p>
                {series.cta.secondary && <p>Secondary: {series.cta.secondary}</p>}
                <p className="text-xs mt-1">Tone: {series.cta.tone || 'professional'}</p>
              </div>
            </div>
          )}

          {/* Lead Magnet */}
          {series.leadMagnet && (
            <div className="mb-4 p-3 bg-purple-50 rounded">
              <h5 className="font-medium text-gray-900 mb-1">리드 매그넷</h5>
              <div className="text-sm text-gray-600">
                <p>{series.leadMagnet.title}</p>
                <p className="text-xs">{series.leadMagnet.value} / {series.leadMagnet.pages}페이지</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onActivate}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              전체 시리즈 활성화
            </button>
            {series.leadMagnet && (
              <button
                onClick={onCreateLeadMagnet}
                className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
              >
                리드 매그넷 생성
              </button>
            )}
            <button
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
            >
              성과 분석
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// =====================================================
// Stat Card Component
// =====================================================
interface StatCardProps {
  label: string;
  value: string | number;
  change: string;
  icon: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, change, icon }) => {
  const isPositive = change.startsWith('+');
  
  return (
    <div className="bg-white p-4 rounded-lg border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {change}
        </span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
};

export default KillerContentManager;
