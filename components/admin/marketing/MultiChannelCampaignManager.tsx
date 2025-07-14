import React, { useState, useEffect } from 'react';
import { Calendar, Users, Target, TrendingUp, MessageSquare, Phone, Mail, Share2, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface Channel {
  id: number;
  code: string;
  name: string;
  category: string;
  icon: string;
}

interface CampaignChannelPlan {
  id: number;
  campaign_id: string;
  channel_id: number;
  channel_name: string;
  channel_category: string;
  start_date: string;
  end_date: string;
  budget: number;
  target_reach: number;
  target_conversions: number;
  content_count: number;
  actual_budget: number;
  actual_reach: number;
  actual_conversions: number;
  actual_content_count: number;
  status: string;
  priority: number;
  assigned_to?: string;
  notes?: string;
}

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  start_date: string;
  end_date: string;
  budget: number;
  target_audience: number;
  funnel_stage: string;
  is_multichannel: boolean;
}

interface MultiChannelCampaignManagerProps {
  supabase: any;
}

const funnelStages = [
  { value: '1', label: '인지 (Awareness)', color: 'bg-blue-500' },
  { value: '2', label: '관심 (Interest)', color: 'bg-yellow-500' },
  { value: '3', label: '구매고려 (Consideration)', color: 'bg-orange-500' },
  { value: '4', label: '구매 (Purchase)', color: 'bg-green-500' },
  { value: '5', label: '충성도 (Loyalty)', color: 'bg-purple-500' }
];

const channelCategories = {
  blog: { label: '블로그', color: 'bg-green-100 text-green-800' },
  social: { label: '소셜미디어', color: 'bg-blue-100 text-blue-800' },
  message: { label: '메시지', color: 'bg-yellow-100 text-yellow-800' },
  ads: { label: '광고', color: 'bg-red-100 text-red-800' },
  email: { label: '이메일', color: 'bg-purple-100 text-purple-800' }
};

export const MultiChannelCampaignManager: React.FC<MultiChannelCampaignManagerProps> = ({ supabase }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [channelPlans, setChannelPlans] = useState<CampaignChannelPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'planning' | 'execution'>('overview');
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);

  // 데이터 로드
  useEffect(() => {
    if (supabase) {
      loadData();
    }
  }, [supabase]);

  const loadData = async () => {
    try {
      setLoading(true);

      // 캠페인 로드
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('is_multichannel', true)
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;
      setCampaigns(campaignsData || []);

      // 채널 로드
      const { data: channelsData, error: channelsError } = await supabase
        .from('marketing_channels')
        .select('*')
        .eq('is_active', true)
        .order('category, name');

      if (channelsError) throw channelsError;
      setChannels(channelsData || []);

    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChannelPlans = async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from('campaign_channel_plans')
        .select(`
          *,
          marketing_channels (
            name,
            category,
            icon
          )
        `)
        .eq('campaign_id', campaignId)
        .order('priority', { ascending: false });

      if (error) throw error;
      
      const formattedData = data?.map((plan: any) => ({
        ...plan,
        channel_name: plan.marketing_channels.name,
        channel_category: plan.marketing_channels.category,
        channel_icon: plan.marketing_channels.icon
      })) || [];
      
      setChannelPlans(formattedData);
    } catch (error) {
      console.error('채널 계획 로드 실패:', error);
    }
  };

  const createNewCampaign = async (campaignData: any) => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert([{
          ...campaignData,
          is_multichannel: true
        }])
        .select()
        .single();

      if (error) throw error;

      // 캠페인 생성 시 트리거가 자동으로 채널 계획을 생성함
      await loadData();
      setSelectedCampaign(data);
      setShowNewCampaignModal(false);
    } catch (error) {
      console.error('캠페인 생성 실패:', error);
      alert('캠페인 생성에 실패했습니다.');
    }
  };

  const updateChannelPlan = async (planId: number, updates: Partial<CampaignChannelPlan>) => {
    try {
      const { error } = await supabase
        .from('campaign_channel_plans')
        .update(updates)
        .eq('id', planId);

      if (error) throw error;

      if (selectedCampaign) {
        await loadChannelPlans(selectedCampaign.id);
      }
    } catch (error) {
      console.error('채널 계획 업데이트 실패:', error);
    }
  };

  const addChannelToCampaign = async (campaignId: string, channelId: number) => {
    try {
      const campaign = campaigns.find(c => c.id === campaignId);
      if (!campaign) return;

      const { error } = await supabase
        .from('campaign_channel_plans')
        .insert([{
          campaign_id: campaignId,
          channel_id: channelId,
          start_date: campaign.start_date,
          end_date: campaign.end_date,
          budget: 0,
          target_reach: 0,
          target_conversions: 0,
          content_count: 1,
          status: 'planned'
        }]);

      if (error) throw error;

      await loadChannelPlans(campaignId);
    } catch (error) {
      console.error('채널 추가 실패:', error);
    }
  };

  const getChannelIcon = (category: string, icon: string) => {
    const iconComponents: { [key: string]: any } = {
      'message': MessageSquare,
      'email': Mail,
      'social': Share2,
      'blog': Calendar,
      'ads': TrendingUp
    };

    const IconComponent = iconComponents[category] || Calendar;
    return <IconComponent className="w-4 h-4" />;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { color: string; label: string } } = {
      'planned': { color: 'bg-gray-100 text-gray-800', label: '계획됨' },
      'active': { color: 'bg-blue-100 text-blue-800', label: '진행중' },
      'completed': { color: 'bg-green-100 text-green-800', label: '완료' },
      'cancelled': { color: 'bg-red-100 text-red-800', label: '취소됨' }
    };

    const config = statusConfig[status] || statusConfig.planned;
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">멀티채널 캠페인 관리</h2>
          <p className="text-gray-600 mt-1">퍼널 기반 통합 마케팅 캠페인 관리</p>
        </div>
        <button
          onClick={() => setShowNewCampaignModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Calendar className="w-5 h-5" />
          새 캠페인 만들기
        </button>
      </div>

      {/* 캠페인 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns.map(campaign => {
          const stage = funnelStages.find(s => s.value === campaign.funnel_stage);
          return (
            <div
              key={campaign.id}
              onClick={() => {
                setSelectedCampaign(campaign);
                loadChannelPlans(campaign.id);
              }}
              className={`p-4 rounded-lg border cursor-pointer transition ${
                selectedCampaign?.id === campaign.id
                  ? 'border-blue-500 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                {getStatusBadge(campaign.status)}
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(campaign.start_date).toLocaleDateString('ko-KR')} ~ {new Date(campaign.end_date).toLocaleDateString('ko-KR')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span>예산: {campaign.budget?.toLocaleString('ko-KR')}원</span>
                </div>
                {stage && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 text-xs rounded ${stage.color} text-white`}>
                      {stage.label}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 선택된 캠페인 상세 */}
      {selectedCampaign && (
        <div className="bg-white rounded-lg shadow">
          {/* 탭 */}
          <div className="border-b px-6 pt-4">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-4 px-2 font-medium border-b-2 transition ${
                  activeTab === 'overview'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                전체 현황
              </button>
              <button
                onClick={() => setActiveTab('planning')}
                className={`pb-4 px-2 font-medium border-b-2 transition ${
                  activeTab === 'planning'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                채널별 계획
              </button>
              <button
                onClick={() => setActiveTab('execution')}
                className={`pb-4 px-2 font-medium border-b-2 transition ${
                  activeTab === 'execution'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                실행 현황
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* 캠페인 요약 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">총 예산</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedCampaign.budget?.toLocaleString('ko-KR')}원
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">목표 도달</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedCampaign.target_audience?.toLocaleString('ko-KR')}명
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">활성 채널</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {channelPlans.filter(p => p.status === 'active').length}개
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">진행률</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {Math.round(
                        (channelPlans.reduce((sum, p) => sum + p.actual_reach, 0) /
                          channelPlans.reduce((sum, p) => sum + p.target_reach, 0)) * 100
                      ) || 0}%
                    </div>
                  </div>
                </div>

                {/* 채널별 현황 */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">채널별 현황</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(
                      channelPlans.reduce((acc, plan) => {
                        const category = plan.channel_category;
                        if (!acc[category]) {
                          acc[category] = {
                            plans: [],
                            totalBudget: 0,
                            totalReach: 0,
                            actualReach: 0
                          };
                        }
                        acc[category].plans.push(plan);
                        acc[category].totalBudget += plan.budget;
                        acc[category].totalReach += plan.target_reach;
                        acc[category].actualReach += plan.actual_reach;
                        return acc;
                      }, {} as any)
                    ).map(([category, data]: [string, any]) => (
                      <div key={category} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getChannelIcon(category, '')}
                            <span className="font-medium">
                              {channelCategories[category as keyof typeof channelCategories]?.label || category}
                            </span>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            channelCategories[category as keyof typeof channelCategories]?.color || 'bg-gray-100'
                          }`}>
                            {data.plans.length}개 채널
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">예산</span>
                            <span className="font-medium">
                              {data.totalBudget.toLocaleString('ko-KR')}원
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">목표 도달</span>
                            <span className="font-medium">
                              {data.totalReach.toLocaleString('ko-KR')}명
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">실제 도달</span>
                            <span className="font-medium text-green-600">
                              {data.actualReach.toLocaleString('ko-KR')}명
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'planning' && (
              <div className="space-y-4">
                {/* 채널 추가 버튼 */}
                <div className="flex justify-end">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addChannelToCampaign(selectedCampaign.id, parseInt(e.target.value));
                        e.target.value = '';
                      }
                    }}
                    className="border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">채널 추가...</option>
                    {channels
                      .filter(ch => !channelPlans.find(p => p.channel_id === ch.id))
                      .map(channel => (
                        <option key={channel.id} value={channel.id}>
                          [{channelCategories[channel.category as keyof typeof channelCategories]?.label}] {channel.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* 채널 계획 테이블 */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">채널</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">기간</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">예산</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">목표 도달</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">콘텐츠 수</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">상태</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">담당자</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {channelPlans.map(plan => (
                        <tr key={plan.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {getChannelIcon(plan.channel_category, plan.channel_icon)}
                              <span className="font-medium">{plan.channel_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(plan.start_date).toLocaleDateString('ko-KR')} ~
                            {new Date(plan.end_date).toLocaleDateString('ko-KR')}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={plan.budget}
                              onChange={(e) => updateChannelPlan(plan.id, { budget: parseFloat(e.target.value) || 0 })}
                              className="w-24 px-2 py-1 border rounded"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={plan.target_reach}
                              onChange={(e) => updateChannelPlan(plan.id, { target_reach: parseInt(e.target.value) || 0 })}
                              className="w-20 px-2 py-1 border rounded"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={plan.content_count}
                              onChange={(e) => updateChannelPlan(plan.id, { content_count: parseInt(e.target.value) || 1 })}
                              className="w-16 px-2 py-1 border rounded"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={plan.status}
                              onChange={(e) => updateChannelPlan(plan.id, { status: e.target.value })}
                              className="px-2 py-1 border rounded text-sm"
                            >
                              <option value="planned">계획됨</option>
                              <option value="active">진행중</option>
                              <option value="completed">완료</option>
                              <option value="cancelled">취소</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={plan.assigned_to || ''}
                              onChange={(e) => updateChannelPlan(plan.id, { assigned_to: e.target.value })}
                              placeholder="담당자"
                              className="w-24 px-2 py-1 border rounded text-sm"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'execution' && (
              <div className="space-y-6">
                {/* 실행 현황 카드 */}
                {channelPlans
                  .filter(plan => plan.status === 'active' || plan.status === 'completed')
                  .map(plan => {
                    const reachRate = plan.target_reach > 0 
                      ? Math.round((plan.actual_reach / plan.target_reach) * 100)
                      : 0;
                    const budgetRate = plan.budget > 0
                      ? Math.round((plan.actual_budget / plan.budget) * 100)
                      : 0;

                    return (
                      <div key={plan.id} className="border rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            {getChannelIcon(plan.channel_category, plan.channel_icon)}
                            <div>
                              <h4 className="font-semibold text-gray-900">{plan.channel_name}</h4>
                              <p className="text-sm text-gray-600">
                                {plan.assigned_to || '담당자 미정'}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(plan.status)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* 도달률 */}
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">도달</span>
                              <span className="font-medium">{reachRate}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  reachRate >= 80 ? 'bg-green-500' : reachRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${reachRate}%` }}
                              />
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {plan.actual_reach.toLocaleString()} / {plan.target_reach.toLocaleString()}명
                            </div>
                          </div>

                          {/* 예산 집행률 */}
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">예산</span>
                              <span className="font-medium">{budgetRate}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${budgetRate}%` }}
                              />
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {plan.actual_budget.toLocaleString()} / {plan.budget.toLocaleString()}원
                            </div>
                          </div>

                          {/* 콘텐츠 진행률 */}
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">콘텐츠</span>
                              <span className="font-medium">
                                {plan.actual_content_count} / {plan.content_count}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              {Array.from({ length: plan.content_count }).map((_, idx) => (
                                <div
                                  key={idx}
                                  className={`flex-1 h-2 rounded ${
                                    idx < plan.actual_content_count
                                      ? 'bg-green-500'
                                      : 'bg-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* 노트 */}
                        {plan.notes && (
                          <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-700">
                            {plan.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 새 캠페인 모달 */}
      {showNewCampaignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold">새 멀티채널 캠페인 만들기</h3>
            </div>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                createNewCampaign({
                  name: formData.get('name'),
                  type: formData.get('type'),
                  funnel_stage: formData.get('funnel_stage'),
                  start_date: formData.get('start_date'),
                  end_date: formData.get('end_date'),
                  budget: parseFloat(formData.get('budget') as string) || 0,
                  target_audience: parseInt(formData.get('target_audience') as string) || 0,
                  status: 'planned'
                });
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  캠페인명 *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 2025년 8월 신제품 출시 캠페인"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    캠페인 유형 *
                  </label>
                  <select
                    name="type"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택하세요</option>
                    <option value="product_launch">신제품 출시</option>
                    <option value="seasonal">시즌 프로모션</option>
                    <option value="brand_awareness">브랜드 인지도</option>
                    <option value="retention">고객 유지</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    퍼널 단계 *
                  </label>
                  <select
                    name="funnel_stage"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택하세요</option>
                    {funnelStages.map(stage => (
                      <option key={stage.value} value={stage.value}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    시작일 *
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    종료일 *
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    총 예산
                  </label>
                  <input
                    type="number"
                    name="budget"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="5000000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    목표 도달 수
                  </label>
                  <input
                    type="number"
                    name="target_audience"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10000"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>안내:</strong> 캠페인 생성 시 선택한 퍼널 단계에 맞는 채널들이 자동으로 추가됩니다.
                  이후 채널별 상세 계획을 수정할 수 있습니다.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewCampaignModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  캠페인 만들기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};