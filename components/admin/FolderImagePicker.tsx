import React, { useEffect, useState } from 'react';

type ImageItem = {
  name: string;
  url: string;
  size: number;
  created_at: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  folderPath: string; // 필수: 현재 폴더 경로
  title?: string;
};

const FolderImagePicker: React.FC<Props> = ({
  isOpen,
  onClose,
  folderPath,
  onSelect,
  title = "폴더에서 이미지 선택"
}) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Storage에서 직접 조회 (빠름)
  const fetchFolderImages = async () => {
    if (!folderPath) {
      setImages([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/folder-images?folder=${encodeURIComponent(folderPath)}`
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

  useEffect(() => {
    if (isOpen && folderPath) {
      fetchFolderImages();
    } else {
      setImages([]);
      setError(null);
    }
  }, [isOpen, folderPath]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            <div className="text-sm text-gray-500 mt-1">{folderPath}</div>
          </div>
          <div className="flex items-center gap-2">
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

        {/* 본문 */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <div className="text-gray-600 font-medium">이미지 로딩 중...</div>
                <div className="text-sm text-gray-400 mt-2">
                  폴더: {folderPath}
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
                  "{folderPath}" 폴더에 이미지가 없습니다.
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
                  onClick={() => onSelect(img.url)}
                >
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all">
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
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

