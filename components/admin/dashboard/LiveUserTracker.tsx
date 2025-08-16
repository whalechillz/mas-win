import { useState, useEffect } from 'react';

interface LiveUser {
  id: string;
  sessionId: string;
  currentPage: string;
  timeOnPage: number;
  scrollDepth: number;
  lastActivity: Date;
  device: string;
  location: string;
}

export function LiveUserTracker() {
  const [liveUsers, setLiveUsers] = useState<LiveUser[]>([]);

  useEffect(() => {
    // 실시간 사용자 데이터 시뮬레이션
    const mockLiveUsers: LiveUser[] = [
      {
        id: '1',
        sessionId: 'sess_001',
        currentPage: '/25-08',
        timeOnPage: 145,
        scrollDepth: 75,
        lastActivity: new Date(),
        device: 'mobile',
        location: '서울'
      },
      {
        id: '2',
        sessionId: 'sess_002',
        currentPage: '/25-08',
        timeOnPage: 89,
        scrollDepth: 25,
        lastActivity: new Date(Date.now() - 30000),
        device: 'desktop',
        location: '부산'
      }
    ];

    setLiveUsers(mockLiveUsers);

    // 실시간 업데이트 시뮬레이션
    const interval = setInterval(() => {
      setLiveUsers(prev => prev.map(user => ({
        ...user,
        timeOnPage: user.timeOnPage + 1,
        lastActivity: new Date()
      })));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">실시간 사용자 활동</h3>
      <div className="space-y-3">
        {liveUsers.map(user => (
          <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  세션 {user.sessionId.slice(-4)}
                </div>
                <div className="text-xs text-gray-500">
                  {user.device} • {user.location}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-900">
                {Math.floor(user.timeOnPage / 60)}:{(user.timeOnPage % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-gray-500">
                스크롤 {user.scrollDepth}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
