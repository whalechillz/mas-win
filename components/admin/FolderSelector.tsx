// 폴더 선택 컴포넌트 (업로드 모달용)
'use client';

import { useState, useEffect } from 'react';
import FolderTree from '../gallery/FolderTree';

interface FolderSelectorProps {
  selectedPath: string;
  onSelectPath: (path: string) => void;
  onCreateFolder?: (parentPath: string, folderName: string) => Promise<void>;
  defaultPath?: string; // 기본값: uploaded/YYYY-MM/YYYY-MM-DD/
  showLabel?: boolean; // 라벨 표시 여부
  // 🔧 최적화: 부모에서 이미 가져온 폴더 목록 전달
  folders?: string[]; // 외부에서 전달받은 폴더 목록
  isLoadingFolders?: boolean; // 로딩 상태
}

export default function FolderSelector({
  selectedPath,
  onSelectPath,
  onCreateFolder,
  defaultPath,
  showLabel = true,
  folders: externalFolders, // 외부 폴더 목록
  isLoadingFolders: externalLoading, // 외부 로딩 상태
}: FolderSelectorProps) {
  const [folders, setFolders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔧 외부에서 폴더 목록이 전달되면 사용, 없으면 자체 조회
    if (externalFolders && externalFolders.length > 0) {
      setFolders(externalFolders);
      setLoading(false);
    } else if (externalLoading === false) {
      // 외부 로딩이 완료되었지만 폴더가 없으면 자체 조회
      fetchFolders();
    } else if (externalLoading === undefined) {
      // 외부 props가 없으면 자체 조회
      fetchFolders();
    } else {
      // 외부 로딩 중이면 로딩 상태만 반영
      setLoading(externalLoading);
    }
    
    // 기본값 설정
    if (!selectedPath && defaultPath) {
      onSelectPath(defaultPath);
    }
  }, [externalFolders, externalLoading]);

  const fetchFolders = async () => {
    try {
      // 🔧 최적화: 동일한 폴더 목록 API 사용 (캐시 활용)
      const res = await fetch('/api/admin/folders-list');
      const data = await res.json();
      if (data.folders) {
        setFolders(data.folders);
      }
    } catch (error) {
      console.error('폴더 목록 가져오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔧 외부 로딩 상태 우선 사용
  const isLoading = externalLoading !== undefined ? externalLoading : loading;

  if (isLoading) {
    return (
      <div className="p-4 text-gray-500 text-sm">
        <div className="animate-pulse">폴더 목록 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      {showLabel && (
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📁 업로드 폴더 선택
          </label>
          <div className="text-xs text-gray-500 mb-2">
            선택된 폴더: <span className="font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
              {selectedPath || '기본값 사용'}
            </span>
          </div>
        </div>
      )}
      <div className="max-h-64 overflow-y-auto bg-white rounded border border-gray-200">
        <FolderTree
          folders={folders}
          selectedFolder={selectedPath}
          onFolderSelect={onSelectPath}
          includeChildren={false}
          onIncludeChildrenChange={() => {}}
          onFoldersChanged={fetchFolders}
        />
      </div>
    </div>
  );
}

