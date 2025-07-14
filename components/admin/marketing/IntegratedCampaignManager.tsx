import React, { useState, useEffect } from 'react';
import { Calendar, MessageSquare, FileText, BarChart3, Target, Send, Eye, Edit2, Trash2 } from 'lucide-react';

// 통합 마케팅 캠페인 매니저 (수정 버전)
export const IntegratedCampaignManager = ({ supabase }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [monthlyTheme, setMonthlyTheme] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  
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
            theme: theme.theme,
            objective: theme.objective || theme.description,
            promotion: theme.promotion_detail || theme.promotion_details
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
  }, [selectedMonth, selectedYear]);

  const loadCampaigns = async () => {
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
    }
  };

  // 캠페인 추가
  const addCampaign = async () => {
    try {
      const campaignData = {
        ...newCampaign,
        month: selectedMonth,
        year: selectedYear,
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
            account: 'mas9golf',
            topic: newCampaign.topic,
            assignee: '제이',
            status: 'planned'
          },
          {
            date: newCampaign.date,
            account: 'massgoogolf',
            topic: newCampaign.topic,
            assignee: '스테피',
            status: 'planned'
          },
          {
            date: newCampaign.date,
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
      resetForm();
      alert('캠페인이 추가되었습니다!');
    } catch (error) {
      console.error('Error adding campaign:', error);
      alert('추가 실패: ' + error.message);
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
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      const { error } = await supabase
        .from('marketing_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await loadCampaigns();
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
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(month => (
                  <option key={month} value={month}>{month}월</option>
                ))}
              </select>
            </div>
            <div>
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
                </div>
              ) : (
                <p className="text-gray-500">테마가 설정되지 않았습니다.</p>
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

      {/* 캠페인 추가/수정 폼 */}
      {(showAddForm || editingCampaign) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
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
                  placeholder="캠페인 주제 입력"
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