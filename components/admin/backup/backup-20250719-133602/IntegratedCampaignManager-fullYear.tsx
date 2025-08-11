import React, { useState, useEffect } from 'react';
import { Calendar, MessageSquare, FileText, BarChart3, Target, Send, Eye, Edit2, Trash2, Link2, AlertCircle } from 'lucide-react';

// 통합 마케팅 캠페인 매니저 - 전체 12개월 표시 버전
export const IntegratedCampaignManager = ({ supabase }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [monthlyTheme, setMonthlyTheme] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [loading, setLoading] = useState(false);
  const [multiChannelContents, setMultiChannelContents] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  
  // 새 캠페인 폼
  const [newCampaign, setNewCampaign] = useState({
    date: '',
    channel: 'kakao',
    topic: '',
    content: '',
    target_count: 0,
    assignee: '제이'
  });

  // 월별 마케팅 테마
  const [monthlyThemes, setMonthlyThemes] = useState({});
  const [currentTheme, setCurrentTheme] = useState(null);

  // 월별 테마 로드
  const loadMonthlyThemes = async () => {
    try {
      const { data, error } = await supabase
        .from('monthly_themes')
        .select('*')
        .eq('year', selectedYear)
        .order('month');
      
      if (!error && data) {
        const themesMap = {};
        data.forEach(theme => {
          themesMap[theme.month] = {
            id: theme.id,
            theme: theme.theme,
            objective: theme.objective || theme.description,
            promotion: theme.promotion_detail || theme.promotion_details,
            focus_keywords: theme.focus_keywords || []
          };
        });
        setMonthlyThemes(themesMap);
        
        // 현재 월 테마 설정
        const current = data.find(t => t.month === selectedMonth);
        setCurrentTheme(current);
      }
    } catch (error) {
      console.error('Error loading themes:', error);
    }
  };

  // 대시보드 통계 로드
  const loadDashboardStats = async () => {
    try {
      const { data, error } = await supabase
        .from('integrated_campaign_dashboard')
        .select('*')
        .eq('year', selectedYear)
        .eq('month', selectedMonth)
        .single();
      
      if (!error && data) {
        setDashboardStats(data);
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  // 멀티채널 콘텐츠 로드
  const loadMultiChannelContents = async () => {
    try {
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('content_ideas')
        .select('*')
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .order('scheduled_date', { ascending: true });
      
      if (!error && data) {
        setMultiChannelContents(data);
      }
    } catch (error) {
      console.error('Error loading multichannel contents:', error);
    }
  };

  // 채널 정의
  const channels = [
    { id: 'kakao', name: '카카오톡', icon: '💬', color: 'yellow' },
    { id: 'sms', name: '문자', icon: '📱', color: 'blue' },
    { id: 'blog', name: '네이버 블로그', icon: '📝', color: 'green' }
  ];

  // 담당자 목록
  const assignees = ['제이', '스테피', '나과장', '허상원'];

  useEffect(() => {
    loadMonthlyThemes();
    loadCampaigns();
    loadMultiChannelContents();
    loadDashboardStats();
  }, [selectedMonth, selectedYear]);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  // 캠페인 추가 및 멀티채널 콘텐츠 자동 생성
  const addCampaign = async () => {
    try {
      setLoading(true);
      
      const campaignData = {
        ...newCampaign,
        month: selectedMonth,
        year: selectedYear,
        status: 'planned'
      };

      const { data: newCampaignData, error } = await supabase
        .from('marketing_campaigns')
        .insert([campaignData])
        .select()
        .single();

      if (error) throw error;

      // 월별 콘텐츠 자동 생성 (트리거가 실행되지만 확인차)
      await supabase.rpc('generate_monthly_content', { 
        p_year: selectedYear, 
        p_month: selectedMonth 
      });

      await loadCampaigns();
      await loadMultiChannelContents();
      await loadDashboardStats();
      
      setShowAddForm(false);
      resetForm();
      alert('캠페인이 추가되고 멀티채널 콘텐츠가 자동 생성되었습니다!');
    } catch (error) {
      console.error('Error adding campaign:', error);
      alert('추가 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 캠페인 수정
  const updateCampaign = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('marketing_campaigns')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      await loadCampaigns();
      setEditingCampaign(null);
      alert('캠페인이 수정되었습니다!');
    } catch (error) {
      console.error('Error updating campaign:', error);
      alert('수정 실패: ' + error.message);
    }
  };

  // 캠페인 삭제
  const deleteCampaign = async (id) => {
    if (!confirm('정말 삭제하시겠습니까? 연결된 멀티채널 콘텐츠도 함께 삭제됩니다.')) return;
    
    try {
      const { error } = await supabase
        .from('marketing_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await loadCampaigns();
      await loadMultiChannelContents();
      alert('캠페인이 삭제되었습니다!');
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('삭제 실패: ' + error.message);
    }
  };

  // 폼 리셋
  const resetForm = () => {
    setNewCampaign({
      date: '',
      channel: 'kakao',
      topic: '',
      content: '',
      target_count: 0,
      assignee: '제이'
    });
  };

  // 멀티채널 콘텐츠 자동 생성
  const generateMultiChannelContent = async () => {
    if (!currentTheme) {
      alert('먼저 이번 달 테마를 설정해주세요.');
      return;
    }
    
    if (!confirm(`${selectedYear}년 ${selectedMonth}월의 모든 멀티채널 콘텐츠를 자동 생성하시겠습니까?`)) return;
    
    try {
      setLoading(true);
      
      await supabase.rpc('generate_monthly_content', { 
        p_year: selectedYear, 
        p_month: selectedMonth 
      });
      
      await loadMultiChannelContents();
      await loadDashboardStats();
      
      alert('멀티채널 콘텐츠가 자동 생성되었습니다!');
    } catch (error) {
      console.error('Error generating content:', error);
      alert('콘텐츠 생성 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">통합 마케팅 캠페인 관리</h2>
        <p className="text-gray-600">카카오톡, 문자, 네이버 블로그를 한 곳에서 관리하고 멀티채널 콘텐츠를 자동 생성합니다</p>
      </div>

      {/* 월 선택 및 테마 */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 border rounded-lg bg-white"
              >
                {[2025, 2026, 2027].map(year => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-3 py-2 border rounded-lg bg-white"
              >
                {/* 전체 12개월 표시 */}
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(month => (
                  <option key={month} value={month}>{month}월</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{selectedMonth}월 마케팅 컨셉</h3>
              {currentTheme ? (
                <div>
                  <p className="text-gray-700">{currentTheme.theme}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    목표: {currentTheme.objective || currentTheme.description || '미설정'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    프로모션: {currentTheme.promotion_detail || currentTheme.promotion_details || '미설정'}
                  </p>
                  {currentTheme.focus_keywords && currentTheme.focus_keywords.length > 0 && (
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {currentTheme.focus_keywords.map((keyword, idx) => (
                        <span key={idx} className="px-2 py-1 bg-white rounded text-xs">
                          #{keyword}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">테마가 설정되지 않았습니다.</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={generateMultiChannelContent}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              disabled={loading}
            >
              <Link2 className="w-4 h-4" />
              멀티채널 자동생성
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={loading}
            >
              + 캠페인 추가
            </button>
          </div>
        </div>

        {/* 대시보드 통계 */}
        {dashboardStats && (
          <div className="mt-4 grid grid-cols-6 gap-2">
            <div className="bg-white/70 rounded p-2 text-center">
              <div className="text-xs text-gray-600">캠페인</div>
              <div className="text-lg font-bold">{dashboardStats.campaign_count || 0}</div>
            </div>
            <div className="bg-white/70 rounded p-2 text-center">
              <div className="text-xs text-gray-600">총 콘텐츠</div>
              <div className="text-lg font-bold">{dashboardStats.content_count || 0}</div>
            </div>
            <div className="bg-yellow-100/70 rounded p-2 text-center">
              <div className="text-xs text-gray-600">카카오톡</div>
              <div className="text-lg font-bold">{dashboardStats.kakao_count || 0}</div>
            </div>
            <div className="bg-blue-100/70 rounded p-2 text-center">
              <div className="text-xs text-gray-600">문자</div>
              <div className="text-lg font-bold">{dashboardStats.sms_count || 0}</div>
            </div>
            <div className="bg-green-100/70 rounded p-2 text-center">
              <div className="text-xs text-gray-600">블로그</div>
              <div className="text-lg font-bold">{dashboardStats.blog_count || 0}</div>
            </div>
            <div className="bg-purple-100/70 rounded p-2 text-center">
              <div className="text-xs text-gray-600">기타</div>
              <div className="text-lg font-bold">{dashboardStats.other_platform_count || 0}</div>
            </div>
          </div>
        )}
      </div>

      {/* 탭 메뉴 */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'overview' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          전체 현황
        </button>
        <button
          onClick={() => setActiveTab('multichannel')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'multichannel' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Link2 className="w-4 h-4 inline mr-2" />
          멀티채널 콘텐츠
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'calendar' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          캘린더 뷰
        </button>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-blue-700">처리 중...</span>
        </div>
      )}

      {/* 전체 현황 탭 */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 캠페인 목록 */}
          <div className="bg-white rounded-lg shadow-sm border">
            <h3 className="p-4 font-semibold border-b">{selectedMonth}월 캠페인 목록</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">날짜</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">채널</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">주제</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">내용</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">담당자</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">대상</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">상태</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        {selectedMonth}월 캠페인이 없습니다. 캠페인을 추가해주세요.
                      </td>
                    </tr>
                  ) : (
                    campaigns.map((campaign) => (
                      <tr key={campaign.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          {new Date(campaign.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded ${
                            campaign.channel === 'kakao' ? 'bg-yellow-100 text-yellow-700' :
                            campaign.channel === 'sms' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {channels.find(c => c.id === campaign.channel)?.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{campaign.topic}</td>
                        <td className="px-4 py-3 text-sm max-w-xs truncate">{campaign.content}</td>
                        <td className="px-4 py-3 text-sm">{campaign.assignee}</td>
                        <td className="px-4 py-3 text-sm">{campaign.target_count}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded ${
                            campaign.status === 'completed' ? 'bg-green-100 text-green-700' :
                            campaign.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {campaign.status === 'completed' ? '완료' :
                             campaign.status === 'in_progress' ? '진행중' : '예정'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingCampaign(campaign)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteCampaign(campaign.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 멀티채널 콘텐츠 탭 */}
      {activeTab === 'multichannel' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">멀티채널 콘텐츠 현황</h3>
            <div className="text-sm text-gray-600">
              총 {multiChannelContents.length}개 콘텐츠
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">날짜</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">플랫폼</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">제목</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">담당자</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">상태</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">태그</th>
                </tr>
              </thead>
              <tbody>
                {multiChannelContents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      멀티채널 콘텐츠가 없습니다. 
                      <button 
                        onClick={generateMultiChannelContent}
                        className="ml-2 text-blue-600 hover:underline"
                      >
                        자동 생성하기
                      </button>
                    </td>
                  </tr>
                ) : (
                  multiChannelContents.map((content) => (
                    <tr key={content.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(content.scheduled_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded ${
                          content.platform === '카카오톡' ? 'bg-yellow-100 text-yellow-700' :
                          content.platform === '문자' ? 'bg-blue-100 text-blue-700' :
                          content.platform === '네이버블로그' ? 'bg-green-100 text-green-700' :
                          content.platform === '자사블로그' ? 'bg-purple-100 text-purple-700' :
                          content.platform === '인스타그램' ? 'bg-pink-100 text-pink-700' :
                          content.platform === '유튜브' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {content.platform}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{content.title}</td>
                      <td className="px-4 py-3 text-sm">{content.assignee}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded ${
                          content.status === 'published' ? 'bg-green-100 text-green-700' :
                          content.status === 'ready' ? 'bg-blue-100 text-blue-700' :
                          content.status === 'writing' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {content.status === 'published' ? '발행완료' :
                           content.status === 'ready' ? '발행준비' :
                           content.status === 'writing' ? '작성중' : '대기'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {content.tags && content.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {content.tags.slice(0, 3).map((tag, idx) => (
                              <span key={idx} className="text-xs text-gray-600">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 캘린더 뷰 탭 */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="mb-4">
            <h3 className="font-semibold mb-2">월별 발행 캘린더</h3>
            <p className="text-sm text-gray-600">
              {selectedYear}년 {selectedMonth}월 콘텐츠 발행 일정
            </p>
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-700 py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* 여기에 실제 캘린더 구현 */}
          <div className="mt-4 p-8 bg-gray-50 rounded text-center text-gray-500">
            캘린더 뷰는 개발 중입니다...
          </div>
        </div>
      )}

      {/* 캠페인 추가/수정 폼 */}
      {(showAddForm || editingCampaign) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {editingCampaign ? '캠페인 수정' : '새 캠페인 추가'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">날짜</label>
                <input
                  type="date"
                  value={editingCampaign ? editingCampaign.date : newCampaign.date}
                  onChange={(e) => {
                    if (editingCampaign) {
                      setEditingCampaign({...editingCampaign, date: e.target.value});
                    } else {
                      setNewCampaign({...newCampaign, date: e.target.value});
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">채널</label>
                <select
                  value={editingCampaign ? editingCampaign.channel : newCampaign.channel}
                  onChange={(e) => {
                    if (editingCampaign) {
                      setEditingCampaign({...editingCampaign, channel: e.target.value});
                    } else {
                      setNewCampaign({...newCampaign, channel: e.target.value});
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {channels.map(channel => (
                    <option key={channel.id} value={channel.id}>{channel.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">주제</label>
                <input
                  type="text"
                  value={editingCampaign ? editingCampaign.topic : newCampaign.topic}
                  onChange={(e) => {
                    if (editingCampaign) {
                      setEditingCampaign({...editingCampaign, topic: e.target.value});
                    } else {
                      setNewCampaign({...newCampaign, topic: e.target.value});
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder={currentTheme ? currentTheme.theme : "캠페인 주제 입력"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">내용</label>
                <textarea
                  value={editingCampaign ? editingCampaign.content : newCampaign.content}
                  onChange={(e) => {
                    if (editingCampaign) {
                      setEditingCampaign({...editingCampaign, content: e.target.value});
                    } else {
                      setNewCampaign({...newCampaign, content: e.target.value});
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="캠페인 내용 입력"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">담당자</label>
                <select
                  value={editingCampaign ? editingCampaign.assignee : newCampaign.assignee}
                  onChange={(e) => {
                    if (editingCampaign) {
                      setEditingCampaign({...editingCampaign, assignee: e.target.value});
                    } else {
                      setNewCampaign({...newCampaign, assignee: e.target.value});
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {assignees.map(assignee => (
                    <option key={assignee} value={assignee}>{assignee}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">대상 수</label>
                <input
                  type="number"
                  value={editingCampaign ? editingCampaign.target_count : newCampaign.target_count}
                  onChange={(e) => {
                    if (editingCampaign) {
                      setEditingCampaign({...editingCampaign, target_count: parseInt(e.target.value)});
                    } else {
                      setNewCampaign({...newCampaign, target_count: parseInt(e.target.value)});
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="0"
                />
              </div>
            </div>

            {/* 알림 메시지 */}
            {!editingCampaign && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">자동 생성 안내</p>
                    <p>캠페인 추가 시 해당 월의 멀티채널 콘텐츠가 자동으로 생성됩니다:</p>
                    <ul className="mt-1 ml-4 list-disc text-xs">
                      <li>카카오톡/문자: 월 2회</li>
                      <li>네이버 블로그 (3개 계정): 주 3회</li>
                      <li>자사 블로그: 주 3회</li>
                      <li>인스타그램/유튜브: 주 2회</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  if (editingCampaign) {
                    updateCampaign(editingCampaign.id, editingCampaign);
                  } else {
                    addCampaign();
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={loading}
              >
                {editingCampaign ? '수정' : '추가'}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingCampaign(null);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};