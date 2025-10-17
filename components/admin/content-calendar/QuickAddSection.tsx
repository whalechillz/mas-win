import { useState } from 'react';

interface QuickAddSectionProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onAdd: (title: string, date: string) => Promise<void>;
  isLoading?: boolean;
}

export const QuickAddSection = ({ isCollapsed, onToggle, onAdd, isLoading }: QuickAddSectionProps) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) {
      alert('제목과 날짜를 모두 입력해주세요.');
      return;
    }
    
    try {
      await onAdd(title, date);
      setTitle('');
      setDate('');
    } catch (error) {
      console.error('빠른 추가 오류:', error);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg mb-4">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-2">
          <span className="text-xl">⚡</span>
          <h3 className="text-lg font-medium text-gray-900">빠른 추가</h3>
        </div>
        <button className="text-gray-500 hover:text-gray-700">
          {isCollapsed ? '펼치기 ▼' : '접기 ▲'}
        </button>
      </div>
      
      {!isCollapsed && (
        <div className="px-4 pb-4 border-t border-gray-200">
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={new Date().toISOString().split('T')[0]}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !title || !date}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isLoading ? '추가 중...' : '추가'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
