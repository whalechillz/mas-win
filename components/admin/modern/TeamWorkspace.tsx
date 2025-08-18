import React, { useState, useEffect } from 'react';

interface TeamWorkspaceProps {
  theme: string;
  notifications: any[];
  setNotifications: (notifications: any[]) => void;
  setLoading: (loading: boolean) => void;
}

const TeamWorkspace: React.FC<TeamWorkspaceProps> = ({
  theme,
  notifications,
  setNotifications,
  setLoading
}) => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      // 실제 API 호출로 대체
      const mockMembers = [
        { id: 1, name: '김팀장', role: '팀장', status: 'online', tasks: 5 },
        { id: 2, name: '이사원', role: '사원', status: 'offline', tasks: 3 }
      ];
      setTeamMembers(mockMembers);
    } catch (error) {
      console.error('팀원 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            팀 워크스페이스
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            팀 협업 및 작업 관리
          </p>
        </div>
        <button
          onClick={fetchTeamMembers}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          새로고침
        </button>
      </div>

      {/* 팀원 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          팀원 목록
        </h3>
        <div className="space-y-4">
          {teamMembers.map((member: any) => (
            <div
              key={member.id}
              className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() => setSelectedMember(member)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    member.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {member.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {member.role} • 작업: {member.tasks}개
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  member.status === 'online' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}>
                  {member.status === 'online' ? '온라인' : '오프라인'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 선택된 팀원 상세 정보 */}
      {selectedMember && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            팀원 상세 정보
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">기본 정보</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">이름:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedMember.name}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">역할:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedMember.role}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">상태:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedMember.status}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">작업 수:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedMember.tasks}개</p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">작업</h4>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  메시지 보내기
                </button>
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  작업 할당
                </button>
                <button className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                  프로필 보기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamWorkspace;
