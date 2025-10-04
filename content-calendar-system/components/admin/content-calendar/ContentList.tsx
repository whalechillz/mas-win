// Content List Component
// /components/admin/content-calendar/ContentList.tsx

import React, { useState, useMemo } from 'react';
import { 
  ContentCalendarItem,
  ContentType,
  ContentStatus,
  FilterParams,
  PaginationParams 
} from '@/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ContentListProps {
  contents: ContentCalendarItem[];
  filters: FilterParams;
  onFiltersChange: (filters: FilterParams) => void;
  pagination: PaginationParams;
  onPaginationChange: (pagination: PaginationParams) => void;
  onEdit: (content: ContentCalendarItem) => void;
  onDelete: (contentId: string) => void;
  onPublish: (content: ContentCalendarItem) => void;
}

const ContentList: React.FC<ContentListProps> = ({
  contents,
  filters,
  onFiltersChange,
  pagination,
  onPaginationChange,
  onEdit,
  onDelete,
  onPublish
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // =====================================================
  // 필터링된 콘텐츠
  // =====================================================
  const filteredContents = useMemo(() => {
    return contents.filter(content => {
      // 검색어 필터
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch = 
          content.title.toLowerCase().includes(search) ||
          (content.subtitle?.toLowerCase().includes(search)) ||
          (content.keywords?.some(k => k.toLowerCase().includes(search)));
        
        if (!matchesSearch) return false;
      }

      // 콘텐츠 타입 필터
      if (filters.contentType && filters.contentType.length > 0) {
        if (!filters.contentType.includes(content.contentType)) return false;
      }

      // 상태 필터
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(content.status)) return false;
      }

      // 날짜 범위 필터
      if (filters.dateRange) {
        const contentDate = new Date(content.contentDate);
        if (filters.dateRange.start && contentDate < filters.dateRange.start) return false;
        if (filters.dateRange.end && contentDate > filters.dateRange.end) return false;
      }

      return true;
    });
  }, [contents, searchTerm, filters]);

  // =====================================================
  // 이벤트 핸들러
  // =====================================================
  const handleSelectAll = () => {
    if (selectedItems.length === filteredContents.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredContents.map(c => c.id!).filter(Boolean));
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleBulkAction = (action: string) => {
    if (selectedItems.length === 0) {
      alert('선택된 항목이 없습니다.');
      return;
    }

    switch (action) {
      case 'delete':
        if (confirm(`${selectedItems.length}개 항목을 삭제하시겠습니까?`)) {
          selectedItems.forEach(id => onDelete(id));
          setSelectedItems([]);
        }
        break;
      case 'publish':
        if (confirm(`${selectedItems.length}개 항목을 발행하시겠습니까?`)) {
          const itemsToPublish = contents.filter(c => selectedItems.includes(c.id!));
          itemsToPublish.forEach(content => onPublish(content));
          setSelectedItems([]);
        }
        break;
      default:
        break;
    }
  };

  const handleSort = (field: string) => {
    if (pagination.sortBy === field) {
      onPaginationChange({
        ...pagination,
        sortOrder: pagination.sortOrder === 'asc' ? 'desc' : 'asc'
      });
    } else {
      onPaginationChange({
        ...pagination,
        sortBy: field,
        sortOrder: 'desc'
      });
    }
  };

  // =====================================================
  // 렌더링
  // =====================================================
  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Filters Bar */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="제목, 키워드로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg
                className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            {/* Content Type Filter */}
            <ContentTypeFilter
              selected={filters.contentType || []}
              onChange={(types) => onFiltersChange({ ...filters, contentType: types })}
            />

            {/* Status Filter */}
            <StatusFilter
              selected={filters.status || []}
              onChange={(statuses) => onFiltersChange({ ...filters, status: statuses })}
            />

            {/* Date Range Filter */}
            <DateRangeFilter
              dateRange={filters.dateRange}
              onChange={(dateRange) => onFiltersChange({ ...filters, dateRange })}
            />

            {/* Reset Filters */}
            <button
              onClick={() => {
                onFiltersChange({});
                setSearchTerm('');
              }}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition"
            >
              필터 초기화
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedItems.length}개 선택됨
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('publish')}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                일괄 발행
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                일괄 삭제
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedItems.length === filteredContents.length && filteredContents.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('content_date')}
              >
                <div className="flex items-center">
                  날짜
                  <SortIcon field="content_date" current={pagination.sortBy} order={pagination.sortOrder} />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center">
                  제목
                  <SortIcon field="title" current={pagination.sortBy} order={pagination.sortOrder} />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                타입
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                채널
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                성과
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredContents.map((content) => (
              <ContentRow
                key={content.id}
                content={content}
                isSelected={selectedItems.includes(content.id!)}
                onSelect={() => handleSelectItem(content.id!)}
                onEdit={() => onEdit(content)}
                onDelete={() => onDelete(content.id!)}
                onPublish={() => onPublish(content)}
              />
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {filteredContents.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">콘텐츠가 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">필터를 조정하거나 새 콘텐츠를 추가해보세요.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredContents.length > 0 && (
        <div className="px-4 py-3 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              총 <span className="font-medium">{filteredContents.length}</span>개 콘텐츠
            </div>
            <div className="flex items-center gap-2">
              <select
                value={pagination.limit}
                onChange={(e) => onPaginationChange({ ...pagination, limit: parseInt(e.target.value) })}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="10">10개씩</option>
                <option value="20">20개씩</option>
                <option value="50">50개씩</option>
                <option value="100">100개씩</option>
              </select>
              <button
                onClick={() => onPaginationChange({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                이전
              </button>
              <span className="px-3 py-1 text-sm">
                {pagination.page} 페이지
              </span>
              <button
                onClick={() => onPaginationChange({ ...pagination, page: pagination.page + 1 })}
                disabled={filteredContents.length < pagination.limit}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                다음
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =====================================================
// Sub Components
// =====================================================

interface ContentRowProps {
  content: ContentCalendarItem;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPublish: () => void;
}

const ContentRow: React.FC<ContentRowProps> = ({
  content,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onPublish
}) => {
  const typeLabels = {
    blog: '블로그',
    social: '소셜',
    email: '이메일',
    funnel: '퍼널',
    video: '비디오'
  };

  const typeColors = {
    blog: 'bg-blue-100 text-blue-700',
    social: 'bg-purple-100 text-purple-700',
    email: 'bg-green-100 text-green-700',
    funnel: 'bg-orange-100 text-orange-700',
    video: 'bg-red-100 text-red-700'
  };

  const statusLabels = {
    planned: '계획됨',
    draft: '초안',
    review: '검토 중',
    approved: '승인됨',
    published: '발행됨',
    archived: '보관됨'
  };

  const statusColors = {
    planned: 'bg-gray-100 text-gray-700',
    draft: 'bg-yellow-100 text-yellow-700',
    review: 'bg-purple-100 text-purple-700',
    approved: 'bg-green-100 text-green-700',
    published: 'bg-blue-100 text-blue-700',
    archived: 'bg-gray-100 text-gray-500'
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="rounded border-gray-300"
        />
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
        {format(new Date(content.contentDate), 'MM/dd')}
      </td>
      <td className="px-4 py-4">
        <div className="max-w-xs">
          <div className="text-sm font-medium text-gray-900 truncate">{content.title}</div>
          {content.subtitle && (
            <div className="text-sm text-gray-500 truncate">{content.subtitle}</div>
          )}
        </div>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${typeColors[content.contentType]}`}>
          {typeLabels[content.contentType]}
        </span>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${statusColors[content.status]}`}>
          {statusLabels[content.status]}
        </span>
      </td>
      <td className="px-4 py-4">
        <div className="flex gap-1">
          {content.publishedChannels?.map((channel, i) => (
            <span key={i} className="inline-flex px-1.5 py-0.5 text-xs bg-gray-100 rounded">
              {channel.channel}
            </span>
          ))}
        </div>
      </td>
      <td className="px-4 py-4">
        {content.performanceMetrics?.views && (
          <div className="text-sm">
            <div className="text-gray-900">👁 {content.performanceMetrics.views}</div>
            {content.performanceMetrics.engagementRate && (
              <div className="text-gray-500">💬 {content.performanceMetrics.engagementRate}%</div>
            )}
          </div>
        )}
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end gap-1">
          <button
            onClick={onEdit}
            className="p-1 hover:bg-gray-100 rounded transition"
            title="편집"
          >
            ✏️
          </button>
          {content.status === 'approved' && (
            <button
              onClick={onPublish}
              className="p-1 hover:bg-gray-100 rounded transition"
              title="발행"
            >
              🚀
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-1 hover:bg-gray-100 rounded transition"
            title="삭제"
          >
            🗑️
          </button>
        </div>
      </td>
    </tr>
  );
};

// Filter Components
const ContentTypeFilter: React.FC<{
  selected: ContentType[];
  onChange: (types: ContentType[]) => void;
}> = ({ selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const types: ContentType[] = ['blog', 'social', 'email', 'funnel', 'video'];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 border rounded-lg text-sm flex items-center gap-1 hover:bg-gray-50"
      >
        콘텐츠 타입
        {selected.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
            {selected.length}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute top-full mt-1 bg-white border rounded-lg shadow-lg p-2 z-10">
          {types.map(type => (
            <label key={type} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(type)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...selected, type]);
                  } else {
                    onChange(selected.filter(t => t !== type));
                  }
                }}
                className="mr-2"
              />
              <span className="text-sm">{type}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const StatusFilter: React.FC<{
  selected: ContentStatus[];
  onChange: (statuses: ContentStatus[]) => void;
}> = ({ selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const statuses: ContentStatus[] = ['planned', 'draft', 'review', 'approved', 'published', 'archived'];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 border rounded-lg text-sm flex items-center gap-1 hover:bg-gray-50"
      >
        상태
        {selected.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
            {selected.length}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute top-full mt-1 bg-white border rounded-lg shadow-lg p-2 z-10">
          {statuses.map(status => (
            <label key={status} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(status)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...selected, status]);
                  } else {
                    onChange(selected.filter(s => s !== status));
                  }
                }}
                className="mr-2"
              />
              <span className="text-sm">{status}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const DateRangeFilter: React.FC<{
  dateRange?: { start: Date; end: Date };
  onChange: (range?: { start: Date; end: Date }) => void;
}> = ({ dateRange, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={dateRange?.start ? format(dateRange.start, 'yyyy-MM-dd') : ''}
        onChange={(e) => {
          const date = e.target.value ? new Date(e.target.value) : undefined;
          onChange(date ? { start: date, end: dateRange?.end || date } : undefined);
        }}
        className="px-3 py-2 border rounded-lg text-sm"
        placeholder="시작일"
      />
      <span className="text-gray-500">~</span>
      <input
        type="date"
        value={dateRange?.end ? format(dateRange.end, 'yyyy-MM-dd') : ''}
        onChange={(e) => {
          const date = e.target.value ? new Date(e.target.value) : undefined;
          onChange(date ? { start: dateRange?.start || date, end: date } : undefined);
        }}
        className="px-3 py-2 border rounded-lg text-sm"
        placeholder="종료일"
      />
    </div>
  );
};

const SortIcon: React.FC<{
  field: string;
  current?: string;
  order?: 'asc' | 'desc';
}> = ({ field, current, order }) => {
  if (current !== field) {
    return (
      <svg className="ml-1 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
  }

  return (
    <svg className="ml-1 w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {order === 'asc' ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      )}
    </svg>
  );
};

export default ContentList;
