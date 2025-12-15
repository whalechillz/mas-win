import React, { useState, useEffect } from 'react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  excel_code?: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  must_change_password?: boolean;
}

interface TeamMemberManagementProps {
  supabase: any;
}

export const TeamMemberManagement: React.FC<TeamMemberManagementProps> = ({ supabase }) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'writer',
    excel_code: '',
    password: '',
    is_active: true
  });

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTeamMembers(data || []);
    } catch (err) {
      console.error('팀 멤버 로드 오류:', err);
      setError('팀 멤버를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    setError('');
    setSuccess('');
    
    try {
      // 유효성 검사
      if (!formData.name || !formData.email) {
        setError('이름과 이메일은 필수입니다.');
        return;
      }

      const { error } = await supabase
        .from('team_members')
        .insert({
          ...formData,
          must_change_password: true,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setSuccess('팀 멤버가 추가되었습니다.');
      setShowAddModal(false);
      setFormData({
        name: '',
        email: '',
        role: 'writer',
        excel_code: '',
        password: '',
        is_active: true
      });
      loadTeamMembers();
    } catch (err: any) {
      setError(err.message || '팀 멤버 추가 실패');
    }
  };

  const handleEdit = async () => {
    if (!selectedMember) return;
    
    setError('');
    setSuccess('');
    
    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        excel_code: formData.excel_code,
        is_active: formData.is_active
      };

      // 비밀번호가 변경된 경우만 업데이트
      if (formData.password && formData.password !== '****') {
        updateData.password = formData.password;
        updateData.must_change_password = true;
        updateData.password_changed_at = null;
      }

      const { error } = await supabase
        .from('team_members')
        .update(updateData)
        .eq('id', selectedMember.id);

      if (error) throw error;
      
      setSuccess('팀 멤버 정보가 수정되었습니다.');
      setShowEditModal(false);
      setSelectedMember(null);
      loadTeamMembers();
    } catch (err: any) {
      setError(err.message || '팀 멤버 수정 실패');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 팀 멤버를 삭제하시겠습니까?')) return;
    
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSuccess('팀 멤버가 삭제되었습니다.');
      loadTeamMembers();
    } catch (err: any) {
      setError(err.message || '팀 멤버 삭제 실패');
    }
  };

  const resetPassword = async (member: TeamMember) => {
    if (!confirm(`${member.name}님의 비밀번호를 1234로 초기화하시겠습니까?`)) return;
    
    try {
      const { error } = await supabase
        .from('team_members')
        .update({
          password: '',
          must_change_password: true,
          password_changed_at: null
        })
        .eq('id', member.id);

      if (error) throw error;
      
      setSuccess(`${member.name}님의 비밀번호가 초기화되었습니다.`);
    } catch (err: any) {
      setError(err.message || '비밀번호 초기화 실패');
    }
  };

  const openEditModal = (member: TeamMember) => {
    setSelectedMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role,
      excel_code: member.excel_code || '',
      password: '****', // 마스킹
      is_active: member.is_active
    });
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">팀 멤버 관리</h2>
            <p className="text-gray-600 mt-1">팀 멤버들의 계정을 관리합니다</p>
          </div>
          <button
            onClick={() => {
              setFormData({
                name: '',
                email: '',
                role: 'writer',
                excel_code: '',
                password: '',
                is_active: true
              });
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            새 멤버 추가
          </button>
        </div>
      </div>

      {/* 알림 메시지 */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {/* 팀 멤버 테이블 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 font-medium text-gray-700">이름</th>
                <th className="text-left p-4 font-medium text-gray-700">이메일</th>
                <th className="text-left p-4 font-medium text-gray-700">역할</th>
                <th className="text-left p-4 font-medium text-gray-700">엑셀 코드</th>
                <th className="text-left p-4 font-medium text-gray-700">상태</th>
                <th className="text-left p-4 font-medium text-gray-700">마지막 로그인</th>
                <th className="text-left p-4 font-medium text-gray-700">가입일</th>
                <th className="text-left p-4 font-medium text-gray-700">작업</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => (
                <tr key={member.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">{member.name}</td>
                  <td className="p-4">{member.email}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {member.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {member.excel_code && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-mono">
                        {member.excel_code}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      member.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {member.is_active ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600 text-sm">
                    {member.last_login
                      ? new Date(member.last_login).toLocaleString()
                      : '-'}
                  </td>
                  <td className="p-4 text-gray-600 text-sm">
                    {new Date(member.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(member)}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => resetPassword(member)}
                        className="text-yellow-600 hover:text-yellow-700 text-sm"
                      >
                        비밀번호 초기화
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {teamMembers.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    등록된 팀 멤버가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 추가/수정 모달 */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {showAddModal ? '새 팀 멤버 추가' : '팀 멤버 수정'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  역할
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="writer">작성자</option>
                  <option value="editor">편집자</option>
                  <option value="admin">관리자</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  엑셀 코드
                </label>
                <input
                  type="text"
                  value={formData.excel_code}
                  onChange={(e) => setFormData({ ...formData, excel_code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="예: J, S, H"
                  maxLength={5}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {showAddModal ? '초기 비밀번호' : '비밀번호 (변경 시만 입력)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder={showAddModal ? '초기 비밀번호를 입력하세요' : '변경하지 않으려면 비워두세요'}
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">활성 상태</span>
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={showAddModal ? handleAdd : handleEdit}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
              >
                {showAddModal ? '추가' : '수정'}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setSelectedMember(null);
                  setError('');
                }}
                className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
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