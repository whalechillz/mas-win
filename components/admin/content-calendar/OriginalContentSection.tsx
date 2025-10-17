import { useState } from 'react';

interface OriginalContentData {
  title: string;
  content: string;
  content_date: string;
  target_audience: string;
  conversion_goal: string;
  autoDerive: boolean;
}

interface OriginalContentSectionProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onCreate: (data: OriginalContentData) => Promise<void>;
  isLoading?: boolean;
}

export const OriginalContentSection = ({ isCollapsed, onToggle, onCreate, isLoading }: OriginalContentSectionProps) => {
  const [formData, setFormData] = useState<OriginalContentData>({
    title: '',
    content: '',
    content_date: '',
    target_audience: 'new_customer',
    conversion_goal: '홈페이지 방문',
    autoDerive: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      alert('제목과 내용은 필수입니다.');
      return;
    }
    
    try {
      await onCreate(formData);
      setFormData({
        title: '',
        content: '',
        content_date: '',
        target_audience: 'new_customer',
        conversion_goal: '홈페이지 방문',
        autoDerive: true
      });
    } catch (error) {
      console.error('원본 콘텐츠 생성 오류:', error);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg mb-6 p-6">
      <div 
        className="flex items-center justify-between mb-4 cursor-pointer"
        onClick={onToggle}
      >
        <h3 className="text-lg font-medium text-gray-900">🎯 원본 콘텐츠 생성 (허브)</h3>
        <button className="text-gray-500 hover:text-gray-700">
          {isCollapsed ? '펼치기 ▼' : '접기 ▲'}
        </button>
      </div>
      
      {!isCollapsed && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">제목 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="원본 콘텐츠 제목을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">내용 *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              placeholder="원본 콘텐츠 내용을 입력하세요"
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">발행 날짜</label>
              <input
                type="date"
                value={formData.content_date}
                onChange={(e) => setFormData({...formData, content_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">타겟 오디언스</label>
              <select
                value={formData.target_audience}
                onChange={(e) => setFormData({...formData, target_audience: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="new_customer">신규고객</option>
                <option value="existing_customer">기존고객</option>
                <option value="all">전체</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">전환 목표</label>
              <select
                value={formData.conversion_goal}
                onChange={(e) => setFormData({...formData, conversion_goal: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="홈페이지 방문">홈페이지 방문</option>
                <option value="상담 신청">상담 신청</option>
                <option value="제품 구매">제품 구매</option>
                <option value="브랜드 인지">브랜드 인지</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.autoDerive}
                onChange={(e) => setFormData({...formData, autoDerive: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <span className="ml-2 text-sm text-gray-700">자동으로 모든 채널에 파생 생성</span>
            </label>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onToggle}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              disabled={isLoading}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.title || !formData.content}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '생성 중...' : '🎯 원본 콘텐츠 생성'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
