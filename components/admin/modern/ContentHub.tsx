import React, { useState, useEffect } from 'react';

interface ContentHubProps {
  theme: string;
  notifications: any[];
  setNotifications: (notifications: any[]) => void;
  setLoading: (loading: boolean) => void;
}

const ContentHub: React.FC<ContentHubProps> = ({
  theme,
  notifications,
  setNotifications,
  setLoading
}) => {
  const [contents, setContents] = useState([]);
  const [selectedContent, setSelectedContent] = useState(null);

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      setLoading(true);
      // 실제 API 호출로 대체
      const mockContents = [
        { id: 1, title: 'MASGOLF 8월 특별 캠페인', type: 'campaign', status: 'published', views: 1250 },
        { id: 2, title: '골프 클럽 피팅 가이드', type: 'guide', status: 'draft', views: 0 }
      ];
      setContents(mockContents);
    } catch (error) {
      console.error('콘텐츠 로드 실패:', error);
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
            콘텐츠 허브
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            콘텐츠 제작 및 관리 허브
          </p>
        </div>
        <button
          onClick={fetchContents}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          새로고침
        </button>
      </div>

      {/* 콘텐츠 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          콘텐츠 목록
        </h3>
        <div className="space-y-4">
          {contents.map((content: any) => (
            <div
              key={content.id}
              className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() => setSelectedContent(content)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {content.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {content.type} • 조회수: {content.views}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  content.status === 'published' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {content.status === 'published' ? '발행됨' : '임시저장'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 선택된 콘텐츠 상세 정보 */}
      {selectedContent && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            콘텐츠 상세 정보
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">기본 정보</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">제목:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedContent.title}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">유형:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedContent.type}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">상태:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedContent.status}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">조회수:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedContent.views}</p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">작업</h4>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  편집하기
                </button>
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  발행하기
                </button>
                <button className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                  복사하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentHub;
