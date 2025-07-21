import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, Users, Phone, FileText, Target, ChevronDown, Activity } from 'lucide-react';

// 캠페인 데이터 타입
interface CampaignKPI {
  campaign_id: string;
  campaign_name: string;
  views: number;
  unique_visitors: number;
  phone_clicks: number;
  form_submissions: number;
  quiz_completions: number;
  conversion_rate: number;
  status: 'active' | 'scheduled' | 'ended';
  start_date: string;
  end_date: string;
}

// 메트릭 카드 컴포넌트
const MetricCard = ({ title, value, change, icon, color }) => (
  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        {change !== undefined && (
          <p className={`text-sm mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

// 캠페인 선택 드롭다운
const CampaignSelector = ({ campaigns, selected, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <Calendar className="w-4 h-4" />
        <span>{selected?.campaign_name || '캠페인 선택'}</span>
        <ChevronDown className="w-4 h-4" />
      </button>
      
      {isOpen && (
        <div className="absolute top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          {campaigns.map(campaign => (
            <button
              key={campaign.campaign_id}
              onClick={() => {
                onSelect(campaign);
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{campaign.campaign_name}</p>
                  <p className="text-sm text-gray-500">{campaign.campaign_id}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                  campaign.status === 'scheduled' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {campaign.status === 'active' ? '진행중' :
                   campaign.status === 'scheduled' ? '예정' : '종료'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// 메인 대시보드 컴포넌트
export const CampaignKPIDashboard = ({ supabase = null }) => {
  const [campaigns, setCampaigns] = useState<CampaignKPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 기본 더미 데이터
  const defaultCampaigns: CampaignKPI[] = [
    {
      campaign_id: '2025-07',
      campaign_name: '7월 썸머 스페셜',
      views: 1234,
      unique_visitors: 892,
      phone_clicks: 45,
      form_submissions: 23,
      quiz_completions: 67,
      conversion_rate: 3.7,
      status: 'active',
      start_date: '2025-07-01',
      end_date: '2025-07-31'
    },
    {
      campaign_id: '2025-06',
      campaign_name: '6월 프라임타임',
      views: 2456,
      unique_visitors: 1823,
      phone_clicks: 89,
      form_submissions: 45,
      quiz_completions: 123,
      conversion_rate: 4.2,
      status: 'ended',
      start_date: '2025-06-01',
      end_date: '2025-06-30'
    },
    {
      campaign_id: '2025-08',
      campaign_name: '8월 가을맞이',
      views: 0,
      unique_visitors: 0,
      phone_clicks: 0,
      form_submissions: 0,
      quiz_completions: 0,
      conversion_rate: 0,
      status: 'scheduled',
      start_date: '2025-08-01',
      end_date: '2025-08-31'
    }
  ];

  const [selectedCampaign, setSelectedCampaign] = useState<CampaignKPI | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [compareCampaign, setCompareCampaign] = useState(null);

  // 데이터 로드
  useEffect(() => {
    loadCampaignData();
  }, [supabase]);

  const loadCampaignData = async () => {
    // 먼저 GA4 API에서 실시간 데이터 가져오기 시도
    try {
      const ga4Response = await fetch('/api/ga4-campaign-metrics');
      if (ga4Response.ok) {
        const ga4Data = await ga4Response.json();
        console.log('GA4 실시간 데이터:', ga4Data);
      }
    } catch (error) {
      console.error('GA4 API 호출 실패:', error);
    }

    if (!supabase) {
      // Supabase가 없으면 더미 데이터 사용
      setCampaigns(defaultCampaigns);
      setSelectedCampaign(defaultCampaigns[0]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // campaign_metrics 테이블에서 데이터 가져오기
      const { data: metricsData, error: metricsError } = await supabase
        .from('campaign_metrics')
        .select('*')
        .order('campaign_id', { ascending: false });

      if (metricsError) {
        console.error('Campaign metrics error:', metricsError);
        setError('칼페인 데이터 로드 실패');
        setCampaigns(defaultCampaigns);
        setSelectedCampaign(defaultCampaigns[0]);
      } else if (metricsData && metricsData.length > 0) {
        // 데이터 형식 변환
        const formattedCampaigns = metricsData.map((metric, index) => ({
          campaign_id: metric.campaign_id,
          campaign_name: `${metric.campaign_id.replace('-', '년 ').replace('-', '월')} 칼페인`,
          views: metric.views || 0,
          unique_visitors: metric.unique_visitors || 0,
          phone_clicks: metric.phone_clicks || 0,
          form_submissions: metric.form_submissions || 0,
          quiz_completions: metric.quiz_completions || 0,
          conversion_rate: parseFloat(metric.conversion_rate) || 0,
          status: index === 0 ? 'active' : 'ended' as const,
          start_date: `${metric.campaign_id}-01`,
          end_date: `${metric.campaign_id}-${new Date(2025, parseInt(metric.campaign_id.split('-')[1]), 0).getDate()}`
        }));

        setCampaigns(formattedCampaigns);
        setSelectedCampaign(formattedCampaigns[0]);
      } else {
        // 데이터가 없으면 더미 데이터 사용
        setCampaigns(defaultCampaigns);
        setSelectedCampaign(defaultCampaigns[0]);
      }
    } catch (err) {
      console.error('Load error:', err);
      setError('데이터 로드 중 오류 발생');
      setCampaigns(defaultCampaigns);
      setSelectedCampaign(defaultCampaigns[0]);
    } finally {
      setLoading(false);
    }
  };

  // 로딩 상태 체크
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">칼페인 데이터 로듩 중...</p>
        </div>
      </div>
    );
  }

  // 선택된 칼페인이 없는 경우
  if (!selectedCampaign) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <p className="text-gray-600">칼페인 데이터가 없습니다.</p>
        </div>
      </div>
    );
  }

  // 전환 퍼널 데이터
  const funnelData = [
    { stage: '페이지 방문', value: selectedCampaign.views, percentage: 100 },
    { stage: '퀴즈 참여', value: selectedCampaign.quiz_completions, percentage: selectedCampaign.views > 0 ? (selectedCampaign.quiz_completions / selectedCampaign.views * 100).toFixed(1) : '0' },
    { stage: '전화 문의', value: selectedCampaign.phone_clicks, percentage: selectedCampaign.views > 0 ? (selectedCampaign.phone_clicks / selectedCampaign.views * 100).toFixed(1) : '0' },
    { stage: '예약 완료', value: selectedCampaign.form_submissions, percentage: selectedCampaign.views > 0 ? (selectedCampaign.form_submissions / selectedCampaign.views * 100).toFixed(1) : '0' }
  ];

  // 시간대별 데이터 (더미)
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}시`,
    views: Math.floor(Math.random() * 100) + 10,
    clicks: Math.floor(Math.random() * 20) + 2
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">캠페인별 KPI 대시보드</h1>
          {error && (
            <div className="text-red-600 text-sm bg-red-50 px-3 py-1 rounded">
              {error}
            </div>
          )}
          <div className="flex items-center gap-4">
            <CampaignSelector
              campaigns={campaigns}
              selected={selectedCampaign}
              onSelect={setSelectedCampaign}
            />
            <button
              onClick={() => setComparisonMode(!comparisonMode)}
              className={`px-4 py-2 rounded-lg ${
                comparisonMode ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              비교 모드
            </button>
          </div>
        </div>

        {/* 캠페인 정보 */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-blue-900">{selectedCampaign.campaign_name}</h2>
              <p className="text-blue-700">
                {selectedCampaign.start_date} ~ {selectedCampaign.end_date}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-full text-white font-medium ${
              selectedCampaign.status === 'active' ? 'bg-green-500' :
              selectedCampaign.status === 'scheduled' ? 'bg-yellow-500' :
              'bg-gray-500'
            }`}>
              {selectedCampaign.status === 'active' ? '진행중' :
               selectedCampaign.status === 'scheduled' ? '예정' : '종료'}
            </span>
          </div>
        </div>
      </div>

      {/* KPI 메트릭 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="총 조회수"
          value={selectedCampaign.views}
          change={12}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          color="bg-blue-100"
        />
        <MetricCard
          title="고유 방문자"
          value={selectedCampaign.unique_visitors}
          change={8}
          icon={<Activity className="w-6 h-6 text-green-600" />}
          color="bg-green-100"
        />
        <MetricCard
          title="전화 클릭"
          value={selectedCampaign.phone_clicks}
          change={-5}
          icon={<Phone className="w-6 h-6 text-purple-600" />}
          color="bg-purple-100"
        />
        <MetricCard
          title="전환율"
          value={`${selectedCampaign.conversion_rate}%`}
          change={15}
          icon={<Target className="w-6 h-6 text-orange-600" />}
          color="bg-orange-100"
        />
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 전환 퍼널 */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">전환 퍼널</h3>
          <div className="space-y-4">
            {funnelData.map((stage, index) => (
              <div key={index}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">{stage.stage}</span>
                  <span className="text-sm text-gray-600">{stage.value} ({stage.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-8">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-8 rounded-full flex items-center justify-end pr-3"
                    style={{ width: `${stage.percentage}%` }}
                  >
                    <span className="text-white text-xs font-medium">{stage.percentage}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 시간대별 활동 */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">시간대별 활동</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="views" stroke="#3B82F6" name="조회수" />
              <Line type="monotone" dataKey="clicks" stroke="#10B981" name="클릭수" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 비교 모드 */}
      {comparisonMode && (
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">캠페인 비교</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {campaigns.map(campaign => (
              <div
                key={campaign.campaign_id}
                className={`p-4 rounded-lg border-2 ${
                  campaign.campaign_id === selectedCampaign.campaign_id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <h4 className="font-medium mb-3">{campaign.campaign_name}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>조회수:</span>
                    <span className="font-medium">{campaign.views.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>전환율:</span>
                    <span className="font-medium">{campaign.conversion_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>예약:</span>
                    <span className="font-medium">{campaign.form_submissions}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 상세 테이블 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">상세 데이터</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-white">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  항목
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  현재값
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  목표값
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  달성률
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  페이지 조회수
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {selectedCampaign.views.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  10,000
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <span className="mr-2">{(selectedCampaign.views / 100).toFixed(1)}%</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min(selectedCampaign.views / 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  예약 완료
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {selectedCampaign.form_submissions}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  100
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <span className="mr-2">{(selectedCampaign.form_submissions / 100 * 100).toFixed(1)}%</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${Math.min(selectedCampaign.form_submissions / 100 * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};