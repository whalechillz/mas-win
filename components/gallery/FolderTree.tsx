'use client';

import { useState, useMemo } from 'react';

interface FolderNode {
  name: string;
  path: string;
  children: Map<string, FolderNode>;
  imageCount?: number;
  isExpanded?: boolean;
}

interface FolderTreeProps {
  folders: string[];
  selectedFolder: string;
  onFolderSelect: (folderPath: string) => void;
  includeChildren: boolean;
  onIncludeChildrenChange: (include: boolean) => void;
}

export default function FolderTree({
  folders,
  selectedFolder,
  onFolderSelect,
  includeChildren,
  onIncludeChildrenChange,
}: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['originals']));

  // 폴더 목록을 트리 구조로 변환
  const folderTree = useMemo(() => {
    const root: FolderNode = {
      name: 'root',
      path: '',
      children: new Map(),
    };

    // 각 폴더 경로를 파싱하여 트리 구조 생성
    folders.forEach((folderPath) => {
      const parts = folderPath.split('/').filter(Boolean);
      let current = root;

      parts.forEach((part, index) => {
        if (!current.children.has(part)) {
          current.children.set(part, {
            name: part,
            path: parts.slice(0, index + 1).join('/'),
            children: new Map(),
          });
        }
        current = current.children.get(part)!;
      });
    });

    return root;
  }, [folders]);

  // 폴더 토글 (확장/축소)
  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  // 트리 노드 렌더링 (재귀)
  const renderNode = (node: FolderNode, level: number = 0): JSX.Element | null => {
    if (node.path === '' && node.children.size === 0) {
      return null;
    }

    const isExpanded = expandedFolders.has(node.path);
    const hasChildren = node.children.size > 0;
    const isSelected = selectedFolder === node.path || 
                       (selectedFolder !== 'all' && node.path.startsWith(selectedFolder));

    return (
      <div key={node.path || 'root'}>
        {node.path !== '' && (
          <div
            className={`flex items-center py-1 px-2 rounded cursor-pointer text-sm ${
              isSelected
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            style={{ paddingLeft: `${level * 20 + 8}px` }}
            onClick={() => onFolderSelect(node.path)}
          >
            {/* 폴더 아이콘 및 확장/축소 버튼 */}
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(node.path);
                }}
                className="mr-1 w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-700"
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            ) : (
              <span className="mr-1 w-4 h-4 flex items-center justify-center text-gray-400">•</span>
            )}
            
            {/* 폴더 이름 */}
            <span className="flex-1 truncate">📁 {node.name}</span>
            
            {/* 이미지 개수 (향후 추가 가능) */}
            {node.imageCount !== undefined && node.imageCount > 0 && (
              <span className="ml-2 text-xs text-gray-500">({node.imageCount})</span>
            )}
          </div>
        )}

        {/* 하위 폴더 표시 (확장된 경우) */}
        {hasChildren && isExpanded && (
          <div>
            {Array.from(node.children.values())
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-white rounded-lg border border-gray-200 p-4 overflow-y-auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">📂 폴더 구조</h3>
        
        {/* 전체 폴더 선택 */}
        <div
          className={`flex items-center py-2 px-2 rounded cursor-pointer text-sm mb-2 ${
            selectedFolder === 'all'
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          onClick={() => onFolderSelect('all')}
        >
          <span className="flex-1">📁 전체 폴더</span>
        </div>

        {/* 루트 폴더 선택 */}
        <div
          className={`flex items-center py-2 px-2 rounded cursor-pointer text-sm mb-2 ${
            selectedFolder === 'root'
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          onClick={() => onFolderSelect('root')}
        >
          <span className="flex-1">📁 루트 폴더</span>
        </div>

        {/* 하위 폴더 포함 체크박스 */}
        <label className="flex items-center space-x-2 text-sm text-gray-700 mt-4 mb-4 p-2 hover:bg-gray-50 rounded">
          <input
            type="checkbox"
            checked={includeChildren}
            onChange={(e) => onIncludeChildrenChange(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>하위 폴더 포함</span>
        </label>

        {/* 구분선 */}
        <hr className="my-4 border-gray-200" />
      </div>

      {/* 트리 구조 */}
      <div className="space-y-1">
        {Array.from(folderTree.children.values())
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((child) => renderNode(child, 0))}
      </div>
    </div>
  );
}

