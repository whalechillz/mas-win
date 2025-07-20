import React, { useState, useEffect } from 'react';
import { Target, Plus, Edit2, Trash2, Save, X, Calendar, TrendingUp, Users, DollarSign, Sparkles } from 'lucide-react';

interface FunnelStage {
  awareness: {
    goal: string;
    channels: string[];
    expectedReach: number;
  };
  interest: {
    goal: string;
    channels: string[];
    expectedCTR: number;
  };
  consideration: {
    goal: string;
    landingPageUrl: string;
    expectedConversion: number;
  };
  purchase: {
    goal: string;
    promotions: string[];
    expectedRevenue: number;
  };
}

interface MonthlyFunnelPlan {
  id: string;
  year: number;
  month: number;
  theme: string;
  funnelStages: FunnelStage;
  status: 'planning' | 'active' | 'completed';
  createdAt?: string;
  updatedAt?: string;
}

interface MonthlyTheme {
  id: string;
  year: number;
  month: number;
  theme: string;
  target_audience: string;
  main_keywords: string[];
  sub_keywords: string[];
  content_ideas: string[];
  promotions: string[];
}

interface ThemeRecommendation {
  stage: string;
  strategies: string[];
  channels: string[];
  keywords: string[];
  targetMetrics: {
    reach?: number;
    ctr?: number;
    conversion?: number;
    revenue?: number;
  };
}

interface Props {
  year: number;
  month: number;
}

// 월 이름 한글 변환
const getMonthName = (month: number): string => {
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  return monthNames[month - 1];
};

// 테마별 추천 전략 생성
const generateThemeRecommendations = (theme: MonthlyTheme): ThemeRecommendation[] => {
  const recommendations: ThemeRecommendation[] = [];
  
  // Awareness 단계 추천
  recommendations.push({
    stage: 'awareness',
    strategies: [
      `${theme.theme} 관련 정보성 콘텐츠 제작`,
      '시즌별 트렌드 콘텐츠 발행',
      'SNS 해시태그 캠페인 진행'
    ],
    channels: ['blog', 'instagram', 'youtube', 'facebook'],
    keywords: theme.main_keywords,
    targetMetrics: { reach: 50000 }
  });
  
  // Interest 단계 추천
  recommendations.push({
    stage: 'interest',
    strategies: [
      '제품/서비스 체험 콘텐츠 제작',
      '고객 후기 및 사례 공유',
      `${theme.target_audience} 맞춤 콘텐츠 제작`
    ],
    channels: ['email', 'kakao', 'blog'],
    keywords: theme.sub_keywords,
    targetMetrics: { ctr: 5.5 }
  });
  
  // Consideration 단계 추천
  recommendations.push({
    stage: 'consideration',
    strategies: [
      '상세 제품 정보 페이지 제작',
      '비교 콘텐츠 제공',
      '무료 상담/체험 제공'
    ],
    channels: ['landing_page', 'email'],
    keywords: [...theme.main_keywords, ...theme.sub_keywords],
    targetMetrics: { conversion: 3.5 }
  });
  
  // Purchase 단계 추천
  recommendations.push({
    stage: 'purchase',
    strategies: theme.promotions,
    channels: ['sms', 'kakao', 'email'],
    keywords: ['할인', '이벤트', '특가'],
    targetMetrics: { revenue: 50000000 }
  });
  
  return recommendations;
};

export default function FunnelPlanManager({ year, month }: Props) {
  const [funnelPlan, setFunnelPlan] = useState<MonthlyFunnelPlan | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [monthlyTheme, setMonthlyTheme] = useState<MonthlyTheme | null>(null);
  const [recommendations, setRecommendations] = useState<ThemeRecommendation[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recentPlans, setRecentPlans] = useState<MonthlyFunnelPlan[]>([]);

  // 편집 중인 데이터
  const [editData, setEditData] = useState<MonthlyFunnelPlan>({
    id: '',
    year,
    month,
    theme: '',
    funnelStages: {
      awareness: { goal: '', channels: [], expectedReach: 0 },
      interest: { goal: '', channels: [], expectedCTR: 0 },
      consideration: { goal: '', landingPageUrl: '', expectedConversion: 0 },
      purchase: { goal: '', promotions: [], expectedRevenue: 0 }
    },
    status: 'planning'
  });

  useEffect(() => {
    fetchFunnelPlan();
    fetchMonthlyTheme();
    fetchRecentPlans();
  }, [year, month]);

  // 월별 테마 데이터 가져오기
  const fetchMonthlyTheme = async () => {
    try {
      const response = await fetch(`/api/integrated/monthly-themes?year=${year}&month=${month}`);
      if (response.ok) {
        const theme = await response.json();
        setMonthlyTheme(theme);
        
        // 테마 기반 추천 생성
        if (theme) {
          const recs = generateThemeRecommendations(theme);
          setRecommendations(recs);
        }
      }
    } catch (error) {
      console.error('Failed to fetch monthly theme:', error);
    }
  };

  // 최근 퍼널 계획 가져오기 (템플릿으로 활용)
  const fetchRecentPlans = async () => {
    try {
      const response = await fetch('/api/integrated/funnel-plans/recent');
      if (response.ok) {
        const plans = await response.json();
        setRecentPlans(plans);
      }
    } catch (error) {
      console.error('Failed to fetch recent plans:', error);
    }
  };

  const fetchFunnelPlan = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/integrated/funnel-plans?year=${year}&month=${month}`);
      if (response.ok) {
        const data = await response.json();
        setFunnelPlan(data);
        setEditData(data);
      } else if (response.status === 404) {
        // 계획이 없으면 테마 기반으로 초기값 설정
        if (monthlyTheme) {
          setEditData(prev => ({
            ...prev,
            theme: monthlyTheme.theme
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch funnel plan:', error);
    } finally {
      setLoading(false);
    }
  };

  // 테마 기반 자동 채우기
  const applyThemeRecommendations = () => {
    if (!monthlyTheme || !recommendations.length) return;
    
    const newData = { ...editData };
    
    // 테마 설정
    newData.theme = monthlyTheme.theme;
    
    // 각 단계별 추천 적용
    recommendations.forEach(rec => {
      switch (rec.stage) {
        case 'awareness':
          newData.funnelStages.awareness = {
            goal: rec.strategies[0],
            channels: rec.channels,
            expectedReach: rec.targetMetrics.reach || 0
          };
          break;
        case 'interest':
          newData.funnelStages.interest = {
            goal: rec.strategies[0],
            channels: rec.channels,
            expectedCTR: rec.targetMetrics.ctr || 0
          };
          break;
        case 'consideration':
          newData.funnelStages.consideration = {
            goal: rec.strategies[0],
            landingPageUrl: `/funnel-${year}-${String(month).padStart(2, '0')}`,
            expectedConversion: rec.targetMetrics.conversion || 0
          };
          break;
        case 'purchase':
          newData.funnelStages.purchase = {
            goal: rec.strategies[0],
            promotions: rec.strategies,
            expectedRevenue: rec.targetMetrics.revenue || 0
          };
          break;
      }
    });
    
    setEditData(newData);
    setShowRecommendations(false);
  };

  // 기존 계획 복사
  const copyFromPlan = (plan: MonthlyFunnelPlan) => {
    setEditData({
      ...plan,
      id: '',
      year,
      month,
      status: 'planning',
      createdAt: undefined,
      updatedAt: undefined
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const method = funnelPlan ? 'PUT' : 'POST';
      const url = funnelPlan 
        ? `/api/integrated/funnel-plans/${funnelPlan.id}`
        : '/api/integrated/funnel-plans';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });

      if (response.ok) {
        const saved = await response.json();
        setFunnelPlan(saved);
        setIsEditing(false);
        alert('퍼널 계획이 저장되었습니다.');
      }
    } catch (error) {
      console.error('Failed to save funnel plan:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleChannelToggle = (stage: keyof FunnelStage, channel: string) => {
    setEditData(prev => {
      const stageData = prev.funnelStages[stage] as any;
      const channels = stageData.channels || [];
      const updated = channels.includes(channel)
        ? channels.filter((c: string) => c !== channel)
        : [...channels, channel];
      
      return {
        ...prev,
        funnelStages: {
          ...prev.funnelStages,
          [stage]: { ...stageData, channels: updated }
        }
      };
    });
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              월별 퍼널 계획 관리
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {year}년 {getMonthName(month)} 마케팅 퍼널 전략
            </p>
          </div>
          <div className="flex gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                {funnelPlan ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {funnelPlan ? '수정' : '계획 생성'}
              </button>
            )}
          </div>
        </div>

        {/* 월별 테마 정보 */}
        {monthlyTheme && (
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {monthlyTheme.theme}
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  타겟: {monthlyTheme.target_audience}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {monthlyTheme.main_keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 text-xs rounded-full"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
              {isEditing && (
                <button
                  onClick={() => setShowRecommendations(!showRecommendations)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1"
                >
                  <Sparkles className="w-4 h-4" />
                  추천 전략
                </button>
              )}
            </div>
          </div>
        )}

        {/* 추천 전략 표시 */}
        {showRecommendations && recommendations.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">AI 추천 전략</h4>
              <button
                onClick={applyThemeRecommendations}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                전체 적용
              </button>
            </div>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded p-3">
                  <h5 className="font-medium text-sm mb-2 capitalize">{rec.stage} 단계</h5>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {rec.strategies.slice(0, 3).map((strategy, idx) => (
                      <li key={idx}>• {strategy}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 퍼널 단계별 설정 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Awareness 단계 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">인지 (Awareness)</h3>
          </div>
          
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">목표</label>
                <input
                  type="text"
                  value={editData.funnelStages.awareness.goal}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    funnelStages: {
                      ...prev.funnelStages,
                      awareness: { ...prev.funnelStages.awareness, goal: e.target.value }
                    }
                  }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="예: 브랜드 인지도 향상"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">채널 선택</label>
                <div className="flex flex-wrap gap-2">
                  {['blog', 'instagram', 'youtube', 'facebook', 'naver'].map(channel => (
                    <button
                      key={channel}
                      onClick={() => handleChannelToggle('awareness', channel)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        editData.funnelStages.awareness.channels.includes(channel)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {channel}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">예상 도달수</label>
                <input
                  type="number"
                  value={editData.funnelStages.awareness.expectedReach}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    funnelStages: {
                      ...prev.funnelStages,
                      awareness: { ...prev.funnelStages.awareness, expectedReach: parseInt(e.target.value) || 0 }
                    }
                  }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">목표</p>
                <p className="font-medium">{funnelPlan?.funnelStages.awareness.goal || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">채널</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {funnelPlan?.funnelStages.awareness.channels.map((channel, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                      {channel}
                    </span>
                  )) || '-'}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">예상 도달수</p>
                <p className="font-medium">{funnelPlan?.funnelStages.awareness.expectedReach?.toLocaleString() || '-'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Interest 단계 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold">관심 (Interest)</h3>
          </div>
          
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">목표</label>
                <input
                  type="text"
                  value={editData.funnelStages.interest.goal}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    funnelStages: {
                      ...prev.funnelStages,
                      interest: { ...prev.funnelStages.interest, goal: e.target.value }
                    }
                  }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="예: 콘텐츠 참여율 향상"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">채널 선택</label>
                <div className="flex flex-wrap gap-2">
                  {['email', 'kakao', 'blog', 'sms'].map(channel => (
                    <button
                      key={channel}
                      onClick={() => handleChannelToggle('interest', channel)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        editData.funnelStages.interest.channels.includes(channel)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {channel}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">예상 CTR (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editData.funnelStages.interest.expectedCTR}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    funnelStages: {
                      ...prev.funnelStages,
                      interest: { ...prev.funnelStages.interest, expectedCTR: parseFloat(e.target.value) || 0 }
                    }
                  }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">목표</p>
                <p className="font-medium">{funnelPlan?.funnelStages.interest.goal || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">채널</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {funnelPlan?.funnelStages.interest.channels.map((channel, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                      {channel}
                    </span>
                  )) || '-'}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">예상 CTR</p>
                <p className="font-medium">{funnelPlan?.funnelStages.interest.expectedCTR}% || '-'</p>
              </div>
            </div>
          )}
        </div>

        {/* Consideration 단계 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold">고려 (Consideration)</h3>
          </div>
          
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">목표</label>
                <input
                  type="text"
                  value={editData.funnelStages.consideration.goal}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    funnelStages: {
                      ...prev.funnelStages,
                      consideration: { ...prev.funnelStages.consideration, goal: e.target.value }
                    }
                  }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="예: 상담 신청 유도"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">랜딩 페이지 URL</label>
                <input
                  type="text"
                  value={editData.funnelStages.consideration.landingPageUrl}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    funnelStages: {
                      ...prev.funnelStages,
                      consideration: { ...prev.funnelStages.consideration, landingPageUrl: e.target.value }
                    }
                  }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="/funnel-2025-07"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">예상 전환율 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editData.funnelStages.consideration.expectedConversion}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    funnelStages: {
                      ...prev.funnelStages,
                      consideration: { ...prev.funnelStages.consideration, expectedConversion: parseFloat(e.target.value) || 0 }
                    }
                  }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">목표</p>
                <p className="font-medium">{funnelPlan?.funnelStages.consideration.goal || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">랜딩 페이지</p>
                <p className="font-medium text-blue-600">{funnelPlan?.funnelStages.consideration.landingPageUrl || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">예상 전환율</p>
                <p className="font-medium">{funnelPlan?.funnelStages.consideration.expectedConversion}% || '-'</p>
              </div>
            </div>
          )}
        </div>

        {/* Purchase 단계 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold">구매 (Purchase)</h3>
          </div>
          
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">목표</label>
                <input
                  type="text"
                  value={editData.funnelStages.purchase.goal}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    funnelStages: {
                      ...prev.funnelStages,
                      purchase: { ...prev.funnelStages.purchase, goal: e.target.value }
                    }
                  }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="예: 매출 목표 달성"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">프로모션</label>
                <textarea
                  value={editData.funnelStages.purchase.promotions.join('\n')}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    funnelStages: {
                      ...prev.funnelStages,
                      purchase: { ...prev.funnelStages.purchase, promotions: e.target.value.split('\n').filter(p => p.trim()) }
                    }
                  }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  rows={3}
                  placeholder="한 줄에 하나씩 입력"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">예상 매출 (원)</label>
                <input
                  type="number"
                  value={editData.funnelStages.purchase.expectedRevenue}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    funnelStages: {
                      ...prev.funnelStages,
                      purchase: { ...prev.funnelStages.purchase, expectedRevenue: parseInt(e.target.value) || 0 }
                    }
                  }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">목표</p>
                <p className="font-medium">{funnelPlan?.funnelStages.purchase.goal || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">프로모션</p>
                <ul className="mt-1 space-y-1">
                  {funnelPlan?.funnelStages.purchase.promotions.map((promo, index) => (
                    <li key={index} className="text-sm">• {promo}</li>
                  )) || '-'}
                </ul>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">예상 매출</p>
                <p className="font-medium">₩{funnelPlan?.funnelStages.purchase.expectedRevenue?.toLocaleString() || '-'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 액션 버튼 */}
      {isEditing && (
        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setIsEditing(false);
              setEditData(funnelPlan || editData);
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
            저장
          </button>
        </div>
      )}

      {/* 최근 계획 템플릿 */}
      {isEditing && recentPlans.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">최근 계획에서 복사</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentPlans.map((plan) => (
              <div
                key={plan.id}
                className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => copyFromPlan(plan)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{plan.theme}</h4>
                  <span className="text-sm text-gray-500">
                    {plan.year}년 {plan.month}월
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  클릭하여 이 계획을 템플릿으로 사용
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}