import React, { useState, useEffect } from 'react';
import { Calendar, MessageSquare, FileText, BarChart3, Target, Send, Eye } from 'lucide-react';

// 통합 마케팅 캠페인 매니저
export const IntegratedCampaignManager = ({ supabase }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [monthlyTheme, setMonthlyTheme] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // 새 캠페인 폼
  const [newCampaign, setNewCampaign] = useState({
    date: '',
    channel: 'kakao', // kakao, sms, blog
    topic: '',
    content: '',
    target_count: 0,
    assignee: '제이'
  });

  // 월별 마케팅 테마 (DB에서 로드)
  const [monthlyThemes, setMonthlyThemes] = useState({});
  const [currentTheme, setCurrentTheme] = useState(null);

  // 월별 테마 로드
  const loadMonthlyThemes = async () => {
    try {
      const { data, error } = await supabase
        .from('monthly_themes')
        .select('*')
        .order('month');
      
      if (!error && data) {
        const themesMap = {};
        data.forEach(theme => {
          themesMap[theme.month] = {
            theme: theme.theme,
            objective: theme.objective,
            promotion: theme.promotion_detail
          };
        });
        setMonthlyThemes(themesMap);
        
        // 현재 월 테마 설정
        const current = data.find(t => t.month === selectedMonth && t.year === 2025);
        setCurrentTheme(current);
      }
    } catch (error) {
      console.error('Error loading themes:', error);
    }
  };

  // 채널 정의
  const channels = [
    { id: 'kakao', name: '카카오톡', icon: '💬', color: 'yellow' },
    { id: 'sms', name: '문자', icon: '📱', color: 'blue' },
    { id: 'blog', name: '네이버 블로그', icon: '📝', color: 'green' }
  ];

  useEffect(() => {
    loadMonthlyThemes();
    loadCampaigns();
  }, [selectedMonth]);

  const loadCampaigns = async () => {
    try {
      // 선택된 월의 캠페인 로드
      const startDate = `2025-${String(selectedMonth).padStart(2, '0')}-01`;
      const endDate = `2025-${String(selectedMonth).padStart(2, '0')}-31`;
      
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
    }
  };

  // 캠페인 추가
  const addCampaign = async () => {
    try {
      const campaignData = {
        ...newCampaign,
        month: selectedMonth,
        year: 2025,
        status: 'planned'
      };

      const { error } = await supabase
        .from('marketing_campaigns')
        .insert([campaignData]);

      if (error) throw error;

      // 블로그인 경우 3개 계정 자동 생성
      if (newCampaign.channel === 'blog') {
        const blogPosts = [
          {
            date: newCampaign.date,
            channel: 'blog',
            account: 'mas9golf',
            topic: newCampaign.topic,
            assignee: '제이',
            status: 'planned'
          },
          {
            date: newCampaign.date,
            channel: 'blog',
            account: 'massgoogolf',
            topic: newCampaign.topic,
            assignee: '스테피',
            status: 'planned'
          },
          {
            date: newCampaign.date,
            channel: 'blog',
            account: 'massgoogolfkorea',
            topic: newCampaign.topic,
            assignee: '허상원',
            status: 'planned'
          }
        ];

        const { error: blogError } = await supabase
          .from('blog_schedule')
          .insert(blogPosts);

        if (blogError) throw blogError;
      }

      await loadCampaigns();
      setShowAddForm(false);
      setNewCampaign({
        date: '',
        channel: 'kakao',
        topic: '',
        content: '',
        target_count: 0,
        assignee: '제이'
      });
    } catch (error) {
      console.error('Error adding campaign:', error);
      alert('추가 실패: ' + error.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">통합 마케팅 캠페인 관리</h2>
        <p className="text-gray-600">카카오톡, 문자, 네이버 블로그를 한 곳에서 관리</p>
      </div>

      {/* 월 선택 및 테마 */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-4 py-2 border rounded-lg bg-white"
            >
              {[7, 8, 9, 10, 11, 12].map(month => (
                <option key={month} value={month}>{month}월</option>
              ))}
            </select>
            <div>
              <h3 className="font-semibold text-lg">{selectedMonth}월 마케팅 컨셉</h3>
              {currentTheme ? (
                <div>
                  <p className="text-gray-700">{currentTheme.theme}</p>
                  <p className="text-sm text-gray-600 mt-1">목표: {currentTheme.objective}</p>
                  <p className="text-sm text-gray-500 mt-1">프로모션: {currentTheme.promotion_detail}</p>
                </div>
              ) : (
                <p className="text-gray-700">테마 로딩 중...</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + 캠페인 추가
          </button>
        </div>
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
        <button
          onClick={() => setActiveTab('performance')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'performance' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Target className="w-4 h-4 inline mr-2" />
          성과 분석
        </button>
      </div>

      {/* 전체 현황 탭 */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 채널별 통계 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">💬</span>
                <span className="text-sm text-yellow-700">카카오톡</span>
              </div>
              <div className="text-2xl font-bold text-yellow-900">
                {campaigns.filter(c => c.channel === 'kakao').length}
              </div>
              <div className="text-sm text-yellow-700">캠페인</div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">📱</span>
                <span className="text-sm text-blue-700">문자</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {campaigns.filter(c => c.channel === 'sms').length}
              </div>
              <div className="text-sm text-blue-700">캠페인</div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">📝</span>
                <span className="text-sm text-green-700">블로그</span>
              </div>
              <div className="text-2xl font-bold text-green-900">
                {campaigns.filter(c => c.channel === 'blog').length * 3}
              </div>
              <div className="text-sm text-green-700">포스트</div>
            </div>
          </div>

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
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">담당자</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">대상</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">클릭수</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">클릭율</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
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
                      <td className="px-4 py-3 text-sm">{campaign.assignee}</td>
                      <td className="px-4 py-3 text-sm">{campaign.target_count || '-'}</td>
                      <td className="px-4 py-3 text-sm">{campaign.click_count || 0}</td>
                      <td className="px-4 py-3 text-sm">
                        {campaign.target_count ? 
                          `${((campaign.click_count || 0) / campaign.target_count * 100).toFixed(1)}%` 
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={campaign.status || 'planned'}
                          onChange={async (e) => {
                            try {
                              const { error } = await supabase
                                .from('marketing_campaigns')
                                .update({ status: e.target.value })
                                .eq('id', campaign.id);
                              if (error) throw error;
                              await loadCampaigns();
                            } catch (error) {
                              console.error('Error updating status:', error);
                            }
                          }}
                          className={`px-2 py-1 text-xs border rounded ${
                            campaign.status === 'completed' ? 'bg-green-50' :
                            campaign.status === 'in_progress' ? 'bg-yellow-50' :
                            'bg-gray-50'
                          }`}
                        >
                          <option value="planned">예정</option>
                          <option value="in_progress">진행중</option>
                          <option value="completed">완료</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 캘린더 뷰 탭 */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="grid grid-cols-7 gap-2">
            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
              <div key={day} className="text-center font-semibold text-sm py-2">
                {day}
              </div>
            ))}
            {/* 캘린더 날짜 및 캠페인 표시 로직 */}
            {Array.from({length: 31}, (_, i) => i + 1).map(day => {
              const daysCampaigns = campaigns.filter(c => 
                new Date(c.date).getDate() === day
              );
              
              return (
                <div key={day} className="border rounded-lg p-2 h-24 overflow-y-auto">
                  <div className="font-semibold text-sm mb-1">{day}</div>
                  {daysCampaigns.map((campaign, idx) => (
                    <div key={idx} className={`text-xs mb-1 p-1 rounded ${
                      campaign.channel === 'kakao' ? 'bg-yellow-100' :
                      campaign.channel === 'sms' ? 'bg-blue-100' :
                      'bg-green-100'
                    }`}>
                      {channels.find(c => c.id === campaign.channel)?.icon}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 새 캠페인 추가 폼 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">새 캠페인 추가</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">날짜</label>
                  <input
                    type="date"
                    value={newCampaign.date}
                    onChange={(e) => setNewCampaign({...newCampaign, date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">채널</label>
                  <select
                    value={newCampaign.channel}
                    onChange={(e) => setNewCampaign({...newCampaign, channel: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {channels.map(channel => (
                      <option key={channel.id} value={channel.id}>
                        {channel.icon} {channel.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">주제/마케팅 포인트</label>
                <input
                  type="text"
                  value={newCampaign.topic}
                  onChange={(e) => setNewCampaign({...newCampaign, topic: e.target.value})}
                  placeholder="예: 7월 여름 행사"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              {newCampaign.channel !== 'blog' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">발송 내용</label>
                    <textarea
                      value={newCampaign.content}
                      onChange={(e) => setNewCampaign({...newCampaign, content: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="발송할 메시지 내용을 입력하세요"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">발송 대상 수</label>
                      <input
                        type="number"
                        value={newCampaign.target_count}
                        onChange={(e) => setNewCampaign({...newCampaign, target_count: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">담당자</label>
                      <select
                        value={newCampaign.assignee}
                        onChange={(e) => setNewCampaign({...newCampaign, assignee: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="제이">제이</option>
                        <option value="스테피">스테피</option>
                        <option value="나과장">나과장</option>
                        <option value="허상원">허상원</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
              
              {newCampaign.channel === 'blog' && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    블로그 캠페인은 3개 계정(mas9golf, massgoogolf, massgoogolfkorea)에 
                    자동으로 배정됩니다.
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex gap-2">
              <button
                onClick={addCampaign}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                추가
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
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