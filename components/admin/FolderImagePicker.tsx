import React, { useEffect, useState } from 'react';

type ImageItem = {
  name: string;
  url: string;
  size: number;
  created_at: string;
};

type AlternativeFolder = {
  label: string;
  path: string;
  icon?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  folderPath: string; // 필수: 현재 폴더 경로
  title?: string;
  // ✅ 추가: 대체 폴더 목록 (예: secret-force-common)
  alternativeFolders?: AlternativeFolder[];
  // ✅ 추가: 폴더 변경 콜백
  onFolderChange?: (path: string) => void;
  // ✅ 추가: 삭제 기능 활성화
  enableDelete?: boolean;
  // ✅ 추가: 업로드 기능 활성화
  enableUpload?: boolean;
  // ✅ 추가: 삭제 콜백
  onDelete?: (imageUrl: string) => Promise<void>;
  // ✅ 추가: 업로드 콜백
  onUpload?: (file: File, folderPath: string, uploadMode?: 'optimize-filename' | 'preserve-filename') => Promise<void>;
  // ✅ 추가: 업로드 모드 (기본값: optimize-filename)
  uploadMode?: 'optimize-filename' | 'preserve-filename';
  // ✅ 추가: 업로드 모드 변경 콜백
  onUploadModeChange?: (mode: 'optimize-filename' | 'preserve-filename') => void;
};

const FolderImagePicker: React.FC<Props> = ({
  isOpen,
  onClose,
  folderPath,
  onSelect,
  title = "폴더에서 이미지 선택",
  alternativeFolders = [],
  onFolderChange,
  enableDelete = false,
  enableUpload = false,
  onDelete,
  onUpload,
  uploadMode: externalUploadMode,
  onUploadModeChange,
}) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // ✅ 현재 선택된 폴더 경로 (내부 상태로 관리)
  const [currentFolderPath, setCurrentFolderPath] = useState(folderPath);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  // ✅ 업로드 모드 (외부에서 전달되면 사용, 없으면 내부 state 사용)
  const [internalUploadMode, setInternalUploadMode] = useState<'optimize-filename' | 'preserve-filename'>('optimize-filename');
  const uploadMode = externalUploadMode ?? internalUploadMode;

  // Storage에서 직접 조회 (빠름)
  const fetchFolderImages = async () => {
    if (!currentFolderPath) {
      setImages([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/folder-images?folder=${encodeURIComponent(currentFolderPath)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setImages(data.images || []);
    } catch (err: any) {
      console.error('이미지 로드 오류:', err);
      setError(err.message || '이미지를 불러오는 중 오류가 발생했습니다.');
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ folderPath prop이 변경되면 내부 상태도 업데이트
  useEffect(() => {
    if (folderPath) {
      setCurrentFolderPath(folderPath);
    }
  }, [folderPath]);

  useEffect(() => {
    if (isOpen && currentFolderPath) {
      fetchFolderImages();
    } else {
      setImages([]);
      setError(null);
    }
  }, [isOpen, currentFolderPath]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b flex flex-col gap-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            </div>
            <div className="flex items-center gap-2">
              {/* ✅ 업로드 버튼 (enableUpload가 true일 때만) */}
              {enableUpload && onUpload && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      setIsUploading(true);
                      try {
                        await onUpload(file, currentFolderPath, uploadMode);
                        // 업로드 후 이미지 목록 새로고침
                        await fetchFolderImages();
                      } catch (error) {
                        console.error('이미지 업로드 오류:', error);
                        alert('이미지 업로드 중 오류가 발생했습니다.');
                      } finally {
                        setIsUploading(false);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-4 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center gap-2 transition-colors disabled:bg-gray-400"
                  >
                    {isUploading ? (
                      <>
                        <span className="animate-spin">⏳</span> 업로드 중...
                      </>
                    ) : (
                      <>
                        <span>📤</span> 업로드
                      </>
                    )}
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={fetchFolderImages}
                className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin">⏳</span> 로딩 중...
                  </>
                ) : (
                  <>
                    <span>🔄</span> 새로고침
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl font-light w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          {/* ✅ 폴더 전환 탭 */}
          {alternativeFolders.length > 0 && (
            <div className="flex items-center gap-2 border-t pt-3">
              <span className="text-xs text-gray-500 font-medium">폴더:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentFolderPath(folderPath);
                    onFolderChange?.(folderPath);
                  }}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    currentFolderPath === folderPath
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  제품 이미지
                </button>
                {alternativeFolders.map((altFolder, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setCurrentFolderPath(altFolder.path);
                      onFolderChange?.(altFolder.path);
                    }}
                    className={`px-3 py-1 text-xs rounded-lg transition-colors flex items-center gap-1 ${
                      currentFolderPath === altFolder.path
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {altFolder.icon && <span>{altFolder.icon}</span>}
                    {altFolder.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ✅ 브레드크럼 네비게이션 */}
          {currentFolderPath && (
            <nav className="flex flex-wrap items-center gap-1 text-xs" aria-label="폴더 경로">
              {currentFolderPath.split('/').map((segment, index, array) => {
                const path = array.slice(0, index + 1).join('/');
                const isLast = index === array.length - 1;
                return (
                  <div key={index} className="flex items-center gap-1">
                    {index > 0 && <span className="text-gray-400">/</span>}
                    {isLast ? (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {segment}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentFolderPath(path);
                          onFolderChange?.(path);
                        }}
                        className="px-2 py-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded text-xs font-medium transition-colors"
                        title={`${path}로 이동`}
                      >
                        {segment}
                      </button>
                    )}
                  </div>
                );
              })}
            </nav>
          )}

          {/* ✅ 업로드 모드 선택 UI (간소화, enableUpload가 true일 때만) */}
          {enableUpload && onUpload && (
            <div className="mt-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                업로드 모드
              </label>
              
              {/* 라디오 버튼을 좌우로 작게 배치 */}
              <div className="flex items-center gap-4">
                {/* 파일명 최적화 (기본) */}
                <label 
                  className="flex items-center cursor-pointer group"
                  title="파일명: 폴더 기반 최적화 + 타임스탬프 + 중복방지&#10;확장자: 원본 유지&#10;최적화: 없음 (원본 그대로)"
                >
                  <input
                    type="radio"
                    name="uploadMode"
                    value="optimize-filename"
                    checked={uploadMode === 'optimize-filename'}
                    onChange={(e) => {
                      const newMode = 'optimize-filename';
                      if (onUploadModeChange) {
                        onUploadModeChange(newMode);
                      } else {
                        setInternalUploadMode(newMode);
                      }
                    }}
                    className="mr-1.5 w-3.5 h-3.5 text-blue-600"
                  />
                  <span className="text-xs text-gray-700">파일명 최적화</span>
                </label>
                
                {/* 파일명 유지 */}
                <label 
                  className="flex items-center cursor-pointer group"
                  title="파일명: 원본 그대로&#10;확장자: 원본 유지&#10;최적화: 없음 (원본 그대로)"
                >
                  <input
                    type="radio"
                    name="uploadMode"
                    value="preserve-filename"
                    checked={uploadMode === 'preserve-filename'}
                    onChange={(e) => {
                      const newMode = 'preserve-filename';
                      if (onUploadModeChange) {
                        onUploadModeChange(newMode);
                      } else {
                        setInternalUploadMode(newMode);
                      }
                    }}
                    className="mr-1.5 w-3.5 h-3.5 text-blue-600"
                  />
                  <span className="text-xs text-gray-700">파일명 유지</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <div className="text-gray-600 font-medium">이미지 로딩 중...</div>
                <div className="text-sm text-gray-400 mt-2">
                  폴더: {currentFolderPath}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Supabase Storage에서 이미지를 불러오는 중입니다...
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-red-600">
                <div className="text-lg font-medium mb-2">❌ 오류 발생</div>
                <div className="text-sm">{error}</div>
                <button
                  onClick={fetchFolderImages}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  다시 시도
                </button>
              </div>
            </div>
          ) : images.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <div className="text-lg font-medium mb-2">이미지가 없습니다</div>
                <div className="text-sm mb-4">
                  "{currentFolderPath}" 폴더에 이미지가 없습니다.
                </div>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  닫기
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {images.map((img) => (
                <div
                  key={img.url}
                  className="relative group cursor-pointer"
                  onClick={(e) => {
                    // 삭제 버튼 클릭 시 선택 동작 방지
                    if ((e.target as HTMLElement).closest('.delete-button')) {
                      return;
                    }
                    onSelect(img.url);
                  }}
                >
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all">
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  
                  {/* ✅ 삭제 버튼 추가 (enableDelete가 true일 때만) */}
                  {enableDelete && onDelete && (
                    <button
                      type="button"
                      className="delete-button absolute top-1 right-1 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10 shadow-lg"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm(`정말 "${img.name}" 이미지를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
                          return;
                        }
                        
                        if (isDeleting === img.url) return;
                        setIsDeleting(img.url);
                        
                        try {
                          await onDelete(img.url);
                          // 삭제 후 이미지 목록 새로고침
                          await fetchFolderImages();
                        } catch (error: any) {
                          console.error('이미지 삭제 오류:', error);
                          alert(error.message || '이미지 삭제 중 오류가 발생했습니다.');
                        } finally {
                          setIsDeleting(null);
                        }
                      }}
                      disabled={isDeleting === img.url}
                      title="이미지 삭제"
                    >
                      {isDeleting === img.url ? (
                        <span className="animate-spin text-xs">⏳</span>
                      ) : (
                        <span className="text-lg font-bold leading-none">×</span>
                      )}
                    </button>
                  )}
                  
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="text-white text-xs font-medium bg-black bg-opacity-50 px-2 py-1 rounded">
                      선택
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-gray-600 truncate" title={img.name}>
                    {img.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t flex items-center justify-between flex-shrink-0 bg-white">
          <div className="text-sm text-gray-600">
            📊 총 {images.length}개 이미지
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderImagePicker;

