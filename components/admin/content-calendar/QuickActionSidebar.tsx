import { useState } from 'react';

interface QuickActionSidebarProps {
  onQuickAdd: (title: string, date: string) => Promise<void>;
  onBlogSync: () => Promise<void>;
  onTemplateGenerate: (template: string, date: string) => Promise<void>;
  isLoading?: boolean;
}

export const QuickActionSidebar = ({ 
  onQuickAdd, 
  onBlogSync, 
  onTemplateGenerate, 
  isLoading 
}: QuickActionSidebarProps) => {
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDate, setQuickDate] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templateDate, setTemplateDate] = useState('');

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle || !quickDate) {
      alert('제목과 날짜를 입력해주세요.');
      return;
    }
    await onQuickAdd(quickTitle, quickDate);
    setQuickTitle('');
    setQuickDate('');
  };

  const handleTemplateGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !templateDate) {
      alert('템플릿과 날짜를 선택해주세요.');
      return;
    }
    await onTemplateGenerate(selectedTemplate, templateDate);
    setSelectedTemplate('');
    setTemplateDate('');
  };

  return (
    <div className="w-80 bg-gray-50 p-4 border-r border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ 빠른 액션</h3>
      
      {/* 빠른 추가 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">빠른 추가</h4>
        <form onSubmit={handleQuickAdd} className="space-y-3">
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <input
            type="date"
            value={quickDate}
            onChange={(e) => setQuickDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={new Date().toISOString().split('T')[0]}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !quickTitle || !quickDate}
            className="w-full bg-blue-600 text-white px-3 py-2 text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? '추가 중...' : '추가'}
          </button>
        </form>
      </div>

      {/* 블로그 동기화 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">블로그 동기화</h4>
        <button
          onClick={onBlogSync}
          disabled={isLoading}
          className="w-full bg-green-600 text-white px-3 py-2 text-sm rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoading ? '동기화 중...' : '🔄 동기화'}
        </button>
      </div>

      {/* 템플릿 생성 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">템플릿 생성</h4>
        <form onSubmit={handleTemplateGenerate} className="space-y-3">
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="">템플릿 선택</option>
            <option value="product_review">제품 리뷰</option>
            <option value="golf_tip">골프 팁</option>
            <option value="travel_guide">여행 가이드</option>
            <option value="event_announcement">이벤트 공지</option>
          </select>
          <input
            type="date"
            value={templateDate}
            onChange={(e) => setTemplateDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={new Date().toISOString().split('T')[0]}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !selectedTemplate || !templateDate}
            className="w-full bg-purple-600 text-white px-3 py-2 text-sm rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? '생성 중...' : '생성'}
          </button>
        </form>
      </div>

      {/* 통계 요약 */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">📊 오늘의 통계</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">오늘 추가</span>
            <span className="font-medium">3개</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">이번 주</span>
            <span className="font-medium">12개</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">발행 예정</span>
            <span className="font-medium">5개</span>
          </div>
        </div>
      </div>
    </div>
  );
};
