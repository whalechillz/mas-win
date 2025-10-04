// Annual Marketing Scheduler Component
// /components/admin/content-calendar/AnnualScheduler.tsx

import React, { useState, useEffect } from 'react';
import { 
  ANNUAL_MARKETING_CALENDAR,
  getCurrentSeason,
  generatePublishingSchedule 
} from '@/data/annual-marketing-calendar';
import { MASGOLF_CAMPAIGNS } from '@/data/masgolf-campaigns';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ko } from 'date-fns/locale';

interface AnnualSchedulerProps {
  onScheduleGenerate: (schedule: any[]) => void;
}

const AnnualScheduler: React.FC<AnnualSchedulerProps> = ({ onScheduleGenerate }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q1');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'automation'>('overview');
  const [automationEnabled, setAutomationEnabled] = useState(false);
  const [generatedSchedule, setGeneratedSchedule] = useState<any[]>([]);

  const currentSeason = getCurrentSeason();

  // =====================================================
  // 연간 일정 자동 생성
  // =====================================================
  const generateAnnualSchedule = async () => {
    const schedule: any[] = [];
    
    // 각 월별로 캠페인과 콘텐츠 일정 생성
    for (let month = 1; month <= 12; month++) {
      const monthData = ANNUAL_MARKETING_CALENDAR.monthlySchedule[month as keyof typeof ANNUAL_MARKETING_CALENDAR.monthlySchedule];
      
      // 캠페인 일정 추가
      monthData.campaigns.forEach(campaignId => {
        const campaign = MASGOLF_CAMPAIGNS.campaigns.find(c => c.id === campaignId);
        if (campaign) {
          schedule.push({
            type: 'campaign',
            campaignId,
            name: campaign.name,
            month,
            startDate: new Date(selectedYear, month - 1, 1),
            endDate: new Date(selectedYear, month - 1, campaign.duration || 30),
            stage: campaign.stage,
            channels: campaign.channels
          });
        }
      });
      
      // 콘텐츠 발행 일정 추가
      ['blog', 'email', 'kakao', 'social'].forEach(channel => {
        const dates = generatePublishingSchedule(selectedYear, month, channel as any);
        dates.forEach(date => {
          schedule.push({
            type: 'content',
            channel,
            date,
            month,
            theme: monthData.contentThemes[0],
            frequency: monthData.channels[channel as keyof typeof monthData.channels]?.frequency
          });
        });
      });
    }
    
    setGeneratedSchedule(schedule);
    
    // API 호출로 저장
    try {
      const response = await fetch('/api/content-calendar/schedule/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: selectedYear,
          schedule,
          autoActivate: automationEnabled
        })
      });
      
      if (response.ok) {
        alert(`${selectedYear}년 연간 일정이 생성되었습니다.`);
        onScheduleGenerate(schedule);
      }
    } catch (error) {
      console.error('일정 생성 실패:', error);
    }
  };

  // =====================================================
  // 자동화 규칙 활성화
  // =====================================================
  const activateAutomation = async () => {
    try {
      const response = await fetch('/api/content-calendar/automation/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rules: ANNUAL_MARKETING_CALENDAR.automationRules,
          year: selectedYear
        })
      });
      
      if (response.ok) {
        setAutomationEnabled(true);
        alert('자동화 규칙이 활성화되었습니다.');
      }
    } catch (error) {
      console.error('자동화 활성화 실패:', error);
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
            <h2 className="text-2xl font-bold">연간 마케팅 스케줄러</h2>
            <p className="text-gray-600 mt-1">시즌별 테마와 캠페인 일정 관리</p>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border rounded-lg"
            >
              <option value={2024}>2024년</option>
              <option value={2025}>2025년</option>
              <option value={2026}>2026년</option>
            </select>
            <button
              onClick={generateAnnualSchedule}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              연간 일정 생성
            </button>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="border-b px-6">
        <div className="flex gap-4">
          <button
            onClick={() => setViewMode('overview')}
            className={`py-2 px-1 border-b-2 ${
              viewMode === 'overview' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500'
            }`}
          >
            연간 개요
          </button>
          <button
            onClick={() => setViewMode('detailed')}
            className={`py-2 px-1 border-b-2 ${
              viewMode === 'detailed' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500'
            }`}
          >
            상세 일정
          </button>
          <button
            onClick={() => setViewMode('automation')}
            className={`py-2 px-1 border-b-2 ${
              viewMode === 'automation' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500'
            }`}
          >
            자동화 설정
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Overview Mode */}
        {viewMode === 'overview' && (
          <div className="space-y-6">
            {/* Season Overview */}
            <div>
              <h3 className="text-lg font-semibold mb-4">시즌별 마케팅 테마</h3>
              <div className="grid grid-cols-4 gap-4">
                {Object.entries(ANNUAL_MARKETING_CALENDAR.seasons).map(([season, data]) => (
                  <SeasonCard
                    key={season}
                    season={season}
                    data={data}
                    isCurrent={season === currentSeason}
                  />
                ))}
              </div>
            </div>

            {/* Quarterly Strategy */}
            <div>
              <h3 className="text-lg font-semibold mb-4">분기별 전략</h3>
              <div className="grid grid-cols-4 gap-4">
                {Object.entries(ANNUAL_MARKETING_CALENDAR.yearlyStrategy.framework).map(([quarter, data]) => (
                  <QuarterCard
                    key={quarter}
                    quarter={quarter}
                    data={data}
                    isActive={quarter === selectedQuarter}
                    onClick={() => setSelectedQuarter(quarter as any)}
                  />
                ))}
              </div>
            </div>

            {/* Publishing Cadence */}
            <div>
              <h3 className="text-lg font-semibold mb-4">채널별 발행 주기</h3>
              <PublishingCadenceTable cadence={ANNUAL_MARKETING_CALENDAR.publishingCadence} />
            </div>
          </div>
        )}

        {/* Detailed Mode */}
        {viewMode === 'detailed' && (
          <MonthlyDetailView
            year={selectedYear}
            quarter={selectedQuarter}
            schedule={generatedSchedule}
          />
        )}

        {/* Automation Mode */}
        {viewMode === 'automation' && (
          <AutomationSettings
            rules={ANNUAL_MARKETING_CALENDAR.automationRules}
            enabled={automationEnabled}
            onActivate={activateAutomation}
            onUpdate={(rules) => console.log('Updated rules:', rules)}
          />
        )}
      </div>
    </div>
  );
};

// =====================================================
// Season Card Component
// =====================================================
interface SeasonCardProps {
  season: string;
  data: any;
  isCurrent: boolean;
}

const SeasonCard: React.FC<SeasonCardProps> = ({ season, data, isCurrent }) => {
  const seasonColors = {
    spring: 'bg-green-50 border-green-200',
    summer: 'bg-yellow-50 border-yellow-200',
    autumn: 'bg-orange-50 border-orange-200',
    winter: 'bg-blue-50 border-blue-200'
  };

  const seasonIcons = {
    spring: '🌸',
    summer: '☀️',
    autumn: '🍂',
    winter: '❄️'
  };

  return (
    <div className={`
      p-4 rounded-lg border-2 
      ${seasonColors[season as keyof typeof seasonColors]}
      ${isCurrent ? 'ring-2 ring-blue-500' : ''}
    `}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{seasonIcons[season as keyof typeof seasonIcons]}</span>
        <span className="text-xs font-medium text-gray-600">{data.period}</span>
      </div>
      <h4 className="font-semibold text-gray-900 mb-2">{data.theme}</h4>
      <p className="text-sm text-gray-600 mb-3">{data.description}</p>
      <div className="space-y-2">
        <div className="text-xs">
          <span className="font-medium">포커스:</span> {data.focus}
        </div>
        <div className="text-xs">
          <span className="font-medium">캠페인:</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {data.campaigns.slice(0, 3).map((id: string) => (
              <span key={id} className="px-2 py-1 bg-white rounded text-xs">
                {id.replace('campaign-', '#')}
              </span>
            ))}
          </div>
        </div>
      </div>
      {isCurrent && (
        <div className="mt-3 text-xs font-medium text-blue-600">
          ✓ 현재 시즌
        </div>
      )}
    </div>
  );
};

// =====================================================
// Quarter Card Component
// =====================================================
interface QuarterCardProps {
  quarter: string;
  data: any;
  isActive: boolean;
  onClick: () => void;
}

const QuarterCard: React.FC<QuarterCardProps> = ({ quarter, data, isActive, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-lg border cursor-pointer transition
        ${isActive ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 hover:bg-gray-100'}
      `}
    >
      <h4 className="font-semibold text-gray-900 mb-2">{quarter}: {data.theme}</h4>
      <p className="text-sm text-gray-600 mb-3">{data.focus}</p>
      <div className="space-y-2 text-xs">
        <div>
          <span className="font-medium">주요 캠페인:</span>
          <ul className="mt-1 space-y-1">
            {data.campaigns.slice(0, 3).map((campaign: string) => (
              <li key={campaign} className="text-gray-600">• {campaign}</li>
            ))}
          </ul>
        </div>
        <div>
          <span className="font-medium">KPI:</span>
          <ul className="mt-1 space-y-1">
            {data.kpi.slice(0, 2).map((kpi: string) => (
              <li key={kpi} className="text-gray-600">• {kpi}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// Publishing Cadence Table
// =====================================================
interface PublishingCadenceTableProps {
  cadence: any;
}

const PublishingCadenceTable: React.FC<PublishingCadenceTableProps> = ({ cadence }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">채널</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">연간 목표</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">주기</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">최적 시간</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">최적 요일</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          <tr>
            <td className="px-4 py-2 text-sm font-medium text-gray-900">블로그</td>
            <td className="px-4 py-2 text-sm text-gray-500">{cadence.blog.annual}회</td>
            <td className="px-4 py-2 text-sm text-gray-500">
              성수기: {cadence.blog.peak.spring}, 비수기: {cadence.blog.normal.summer}
            </td>
            <td className="px-4 py-2 text-sm text-gray-500">{cadence.blog.bestTime}</td>
            <td className="px-4 py-2 text-sm text-gray-500">{cadence.blog.bestDays.join(', ')}</td>
          </tr>
          <tr>
            <td className="px-4 py-2 text-sm font-medium text-gray-900">이메일</td>
            <td className="px-4 py-2 text-sm text-gray-500">{cadence.email.annual}회</td>
            <td className="px-4 py-2 text-sm text-gray-500">{cadence.email.regular}</td>
            <td className="px-4 py-2 text-sm text-gray-500">{cadence.email.bestTime}</td>
            <td className="px-4 py-2 text-sm text-gray-500">{cadence.email.bestDays.join(', ')}</td>
          </tr>
          <tr>
            <td className="px-4 py-2 text-sm font-medium text-gray-900">카카오톡</td>
            <td className="px-4 py-2 text-sm text-gray-500">{cadence.kakao.annual}회</td>
            <td className="px-4 py-2 text-sm text-gray-500">{cadence.kakao.regular}</td>
            <td className="px-4 py-2 text-sm text-gray-500">{cadence.kakao.bestTime}</td>
            <td className="px-4 py-2 text-sm text-gray-500">{cadence.kakao.bestDays.join(', ')}</td>
          </tr>
          <tr>
            <td className="px-4 py-2 text-sm font-medium text-gray-900">페이스북</td>
            <td className="px-4 py-2 text-sm text-gray-500">{cadence.social.facebook.annual}회</td>
            <td className="px-4 py-2 text-sm text-gray-500">{cadence.social.facebook.regular}</td>
            <td className="px-4 py-2 text-sm text-gray-500">{cadence.social.facebook.bestTime}</td>
            <td className="px-4 py-2 text-sm text-gray-500">{cadence.social.facebook.bestDays.join(', ')}</td>
          </tr>
          <tr>
            <td className="px-4 py-2 text-sm font-medium text-gray-900">인스타그램</td>
            <td className="px-4 py-2 text-sm text-gray-500">{cadence.social.instagram.annual}회</td>
            <td className="px-4 py-2 text-sm text-gray-500">{cadence.social.instagram.regular}</td>
            <td className="px-4 py-2 text-sm text-gray-500">{cadence.social.instagram.bestTime}</td>
            <td className="px-4 py-2 text-sm text-gray-500">{cadence.social.instagram.bestDays.join(', ')}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// =====================================================
// Monthly Detail View Component
// =====================================================
interface MonthlyDetailViewProps {
  year: number;
  quarter: string;
  schedule: any[];
}

const MonthlyDetailView: React.FC<MonthlyDetailViewProps> = ({ year, quarter, schedule }) => {
  const quarterMonths = {
    Q1: [1, 2, 3],
    Q2: [4, 5, 6],
    Q3: [7, 8, 9],
    Q4: [10, 11, 12]
  };

  const months = quarterMonths[quarter as keyof typeof quarterMonths];

  return (
    <div className="space-y-6">
      {months.map(month => {
        const monthData = ANNUAL_MARKETING_CALENDAR.monthlySchedule[month as keyof typeof ANNUAL_MARKETING_CALENDAR.monthlySchedule];
        const monthSchedule = schedule.filter(s => s.month === month);

        return (
          <div key={month} className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">
              {format(new Date(year, month - 1), 'MMMM', { locale: ko })}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Campaigns */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">캠페인</h4>
                <div className="space-y-2">
                  {monthData.campaigns.map(campaignId => {
                    const campaign = MASGOLF_CAMPAIGNS.campaigns.find(c => c.id === campaignId);
                    return campaign ? (
                      <div key={campaignId} className="p-2 bg-blue-50 rounded">
                        <div className="font-medium text-sm">{campaign.name}</div>
                        <div className="text-xs text-gray-600">{campaign.stage}</div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Content Themes */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">콘텐츠 테마</h4>
                <div className="space-y-2">
                  {monthData.contentThemes.map((theme: string) => (
                    <div key={theme} className="p-2 bg-green-50 rounded">
                      <div className="text-sm">{theme}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Publishing Schedule */}
            <div className="mt-4">
              <h4 className="font-medium text-gray-700 mb-2">발행 일정</h4>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {Object.entries(monthData.channels).map(([channel, data]) => (
                  <div key={channel} className="p-2 bg-gray-50 rounded">
                    <div className="font-medium capitalize">{channel}</div>
                    <div className="text-gray-600">{(data as any).frequency}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// =====================================================
// Automation Settings Component
// =====================================================
interface AutomationSettingsProps {
  rules: any;
  enabled: boolean;
  onActivate: () => void;
  onUpdate: (rules: any) => void;
}

const AutomationSettings: React.FC<AutomationSettingsProps> = ({
  rules,
  enabled,
  onActivate,
  onUpdate
}) => {
  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">자동화 상태</h3>
            <p className="text-sm text-gray-600 mt-1">
              캠페인과 콘텐츠를 자동으로 활성화합니다
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm ${
              enabled 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              {enabled ? '활성화됨' : '비활성화'}
            </span>
            {!enabled && (
              <button
                onClick={onActivate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                활성화
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Seasonal Triggers */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">시즌별 자동 실행</h3>
        <div className="space-y-2">
          {rules.triggers.seasonal.map((trigger: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
              <div className="text-sm">
                <span className="font-medium">조건:</span> {trigger.condition}
              </div>
              <div className="text-sm">
                <span className="font-medium">액션:</span> {trigger.action}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Triggers */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">성과 기반 자동 실행</h3>
        <div className="space-y-2">
          {rules.triggers.performance.map((trigger: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
              <div className="text-sm">
                <span className="font-medium">조건:</span> {trigger.condition}
              </div>
              <div className="text-sm">
                <span className="font-medium">액션:</span> {trigger.action}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workflows */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">자동화 워크플로우</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">콘텐츠 시리즈</h4>
            <ul className="space-y-1 text-sm">
              {Object.entries(rules.workflows.contentSeries).map(([series, config]: [string, any]) => (
                <li key={series} className="text-purple-700">
                  • {series}: {config.months.join(', ')}월 ({config.frequency})
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">캠페인 순서</h4>
            <ul className="space-y-1 text-sm">
              {Object.entries(rules.workflows.campaignSequence).map(([stage, campaigns]: [string, any]) => (
                <li key={stage} className="text-blue-700">
                  • {stage}: {campaigns.length}개 캠페인
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnualScheduler;
