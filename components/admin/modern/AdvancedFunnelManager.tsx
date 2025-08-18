import React, { useState, useEffect } from 'react';

interface AdvancedFunnelManagerProps {
  theme: string;
  notifications: any[];
  setNotifications: (notifications: any[]) => void;
  setLoading: (loading: boolean) => void;
}

const AdvancedFunnelManager: React.FC<AdvancedFunnelManagerProps> = ({
  theme,
  notifications,
  setNotifications,
  setLoading
}) => {
  const [funnels, setFunnels] = useState([]);
  const [abTests, setAbTests] = useState([]);
  const [selectedFunnel, setSelectedFunnel] = useState(null);

  useEffect(() => {
    fetchFunnels();
    fetchABTests();
  }, []);

  const fetchFunnels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/funnel-management');
      const data = await response.json();
      setFunnels(data.funnels || []);
    } catch (error) {
      console.error('퍼널 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchABTests = async () => {
    try {
      const response = await fetch('/api/analytics/ab-test-results');
      const data = await response.json();
      setAbTests(data.abTests || []);
    } catch (error) {
      console.error('A/B 테스트 데이터 로드 실패:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            고급 퍼널 관리
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            퍼널 최적화 및 A/B 테스트 관리
          </p>
        </div>
        <button
          onClick={fetchFunnels}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          새로고침
        </button>
      </div>

      {/* 퍼널 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            퍼널 목록
          </h3>
          <div className="space-y-3">
            {funnels.map((funnel: any, index: number) => (
              <div
                key={index}
                className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => setSelectedFunnel(funnel)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {funnel.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {funnel.version} • {funnel.status}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {funnel.modifiedDate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* A/B 테스트 결과 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            A/B 테스트 결과
          </h3>
          <div className="space-y-4">
            {abTests.map((test: any, index: number) => (
              <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {test.testName}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    test.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {test.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">버전 A:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {test.versionA?.conversionRate || 0}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">버전 B:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {test.versionB?.conversionRate || 0}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 선택된 퍼널 상세 정보 */}
      {selectedFunnel && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            퍼널 상세 정보
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">이름:</span>
              <p className="font-medium text-gray-900 dark:text-white">{selectedFunnel.name}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">버전:</span>
              <p className="font-medium text-gray-900 dark:text-white">{selectedFunnel.version}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">상태:</span>
              <p className="font-medium text-gray-900 dark:text-white">{selectedFunnel.status}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFunnelManager;
