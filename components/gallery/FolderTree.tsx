'use client';

import { useState, useMemo, useEffect, useRef } from 'react';

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
  onImageDrop?: (imageData: { name: string; url: string; folder_path?: string }, targetFolder: string, event?: DragEvent) => void;
  onFoldersChanged?: () => void;
}

export default function FolderTree({
  folders,
  selectedFolder,
  onFolderSelect,
  includeChildren,
  onIncludeChildrenChange,
  onImageDrop,
  onFoldersChanged,
}: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['originals']));
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; path: string } | null>(null);
  const selectedFolderRef = useRef<HTMLDivElement | null>(null);

  // 선택된 폴더의 모든 부모 폴더를 자동으로 펼침
  useEffect(() => {
    if (selectedFolder && selectedFolder !== 'all' && selectedFolder !== 'root') {
      const parts = selectedFolder.split('/').filter(Boolean);
      const parentPaths: string[] = [];
      let currentPath = '';
      
      // 모든 부모 경로 추출
      parts.forEach(part => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        parentPaths.push(currentPath);
      });
      
      // 부모 폴더들을 expandedFolders에 추가
      setExpandedFolders(prev => {
        const newExpanded = new Set(prev);
        parentPaths.forEach(path => newExpanded.add(path));
        return newExpanded;
      });
      
      // 선택된 폴더로 자동 스크롤 (DOM 업데이트 후)
      setTimeout(() => {
        if (selectedFolderRef.current) {
          selectedFolderRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 150);
    }
  }, [selectedFolder]);

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

    // 🔧 디버깅: 폴더 구조 확인
    const originalsNode = root.children.get('originals');
    const scrapedNode = root.children.get('scraped-images');
    console.log('📁 폴더 트리 구조:', {
      totalFolders: folders.length,
      rootChildren: root.children.size,
      rootChildrenNames: Array.from(root.children.keys()),
      originals: {
        exists: !!originalsNode,
        path: originalsNode?.path,
        childrenCount: originalsNode?.children.size || 0,
        childrenNames: originalsNode ? Array.from(originalsNode.children.keys()) : [],
      },
      scrapedImages: {
        exists: !!scrapedNode,
        path: scrapedNode?.path,
        childrenCount: scrapedNode?.children.size || 0,
        childrenNames: scrapedNode ? Array.from(scrapedNode.children.keys()) : [],
      },
      sampleFolders: folders.slice(0, 10), // 처음 10개만 표시
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

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent, folderPath: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(folderPath);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(null);
  };

  const handleDrop = (e: React.DragEvent, folderPath: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(null);

    try {
      const imageDataStr = e.dataTransfer.getData('image');
      if (imageDataStr && onImageDrop) {
        const imageData = JSON.parse(imageDataStr);
        // 원본 이벤트도 전달 (키보드 상태 확인용)
        onImageDrop(imageData, folderPath, e.nativeEvent as DragEvent);
      }
    } catch (error) {
      console.error('❌ 드롭 처리 오류:', error);
    }
  };

  // 트리 노드 렌더링 (재귀)
  const renderNode = (node: FolderNode, level: number = 0): JSX.Element | null => {
    if (node.path === '' && node.children.size === 0) {
      return null;
    }

    const isExpanded = expandedFolders.has(node.path);
    const hasChildren = node.children.size > 0;
    
    // 🔧 디버깅: 특정 노드의 children 확인
    if (node.name === 'originals' || node.name === 'scraped-images') {
      console.log(`🔍 ${node.name} 폴더 렌더링:`, {
        path: node.path,
        hasChildren,
        childrenCount: node.children.size,
        children: Array.from(node.children.keys()),
        isExpanded,
        expandedFolders: Array.from(expandedFolders),
      });
    }
    
    const isSelected = selectedFolder === node.path || 
                       (selectedFolder !== 'all' && node.path.startsWith(selectedFolder));
    const isDragOver = dragOverFolder === node.path;

    return (
      <div key={node.path || 'root'}>
        {node.path !== '' && (
          <div
            ref={isSelected ? selectedFolderRef : null}
            className={`flex items-center py-1 px-2 rounded cursor-pointer text-sm transition-all ${
              isDragOver
                ? 'bg-blue-200 border-2 border-blue-500 border-dashed'
                : isSelected
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            style={{ paddingLeft: `${level * 20 + 8}px` }}
            onClick={() => onFolderSelect(node.path)}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenu({ x: e.clientX, y: e.clientY, path: node.path });
            }}
            onDragOver={(e) => handleDragOver(e, node.path)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, node.path)}
          >
            {/* 폴더 아이콘 및 확장/축소 버튼 */}
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log(`🔄 토글 클릭: ${node.path}, 현재 확장 상태: ${isExpanded}`);
                  toggleFolder(node.path);
                }}
                className="mr-1 w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-700"
                title={`${isExpanded ? '축소' : '확장'} (하위 폴더 ${node.children.size}개)`}
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            ) : (
              <span className="mr-1 w-4 h-4 flex items-center justify-center text-gray-400" title="하위 폴더 없음">•</span>
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
          className={`flex items-center py-2 px-2 rounded cursor-pointer text-sm mb-2 transition-all ${
            dragOverFolder === 'all'
              ? 'bg-blue-200 border-2 border-blue-500 border-dashed'
              : selectedFolder === 'all'
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          onClick={() => onFolderSelect('all')}
          onDragOver={(e) => handleDragOver(e, 'all')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'all')}
        >
          <span className="flex-1">📁 전체 폴더</span>
        </div>

        {/* 루트 폴더 선택 */}
        <div
          className={`flex items-center py-2 px-2 rounded cursor-pointer text-sm mb-2 transition-all ${
            dragOverFolder === 'root'
              ? 'bg-blue-200 border-2 border-blue-500 border-dashed'
              : selectedFolder === 'root'
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          onClick={() => onFolderSelect('root')}
          onDragOver={(e) => handleDragOver(e, 'root')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'root')}
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

      {/* 컨텍스트 메뉴 */}
      {menu && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded shadow-lg text-sm"
          style={{ top: menu.y, left: menu.x }}
          onMouseLeave={() => setMenu(null)}
        >
          <button
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            onClick={async () => {
              const base = menu.path;
              const name = prompt('새 하위 폴더명을 입력하세요', 'new-folder');
              if (!name) return setMenu(null);
              const newPath = base ? `${base}/${name}` : name;
              try {
                const res = await fetch('/api/admin/create-folder', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ folderPath: newPath })
                });
                const data = await res.json();
                if (!res.ok || !data.success) throw new Error(data.error || '폴더 생성 실패');
                onFoldersChanged && onFoldersChanged();
              } catch (e:any) {
                alert(`폴더 생성 실패: ${e.message}`);
              } finally {
                setMenu(null);
              }
            }}
          >
            ➕ 새 폴더
          </button>
          <button
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            onClick={async () => {
              const oldFolderPath = menu.path;
              const newFolderPath = prompt('새 폴더 경로를 입력하세요', oldFolderPath) || '';
              if (!newFolderPath || newFolderPath === oldFolderPath) return setMenu(null);
              try {
                const res = await fetch('/api/admin/rename-folder', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ oldFolderPath, newFolderPath })
                });
                const data = await res.json();
                if (!res.ok || !data.success) throw new Error(data.error || '폴더명 변경 실패');
                onFoldersChanged && onFoldersChanged();
                if (selectedFolder === oldFolderPath) {
                  onFolderSelect(newFolderPath);
                }
              } catch (e:any) {
                alert(`폴더명 변경 실패: ${e.message}`);
              } finally {
                setMenu(null);
              }
            }}
          >
            ✏️ 이름 변경
          </button>
          <button
            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
            onClick={async () => {
              if (!confirm('폴더를 삭제하시겠습니까? (내부 파일 삭제)')) return setMenu(null);
              try {
                const res = await fetch('/api/admin/delete-folder', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ folderPath: menu.path })
                });
                const data = await res.json();
                if (!res.ok || !data.success) throw new Error(data.error || '폴더 삭제 실패');
                onFoldersChanged && onFoldersChanged();
                if (selectedFolder.startsWith(menu.path)) onFolderSelect('all');
              } catch (e:any) {
                alert(`폴더 삭제 실패: ${e.message}`);
              } finally {
                setMenu(null);
              }
            }}
          >
            🗑️ 삭제
          </button>
        </div>
      )}
    </div>
  );
}

