import React, { useEffect, useMemo, useState } from 'react';

type ImageItem = { 
  name: string; 
  url: string; 
  folder_path?: string;
  usage_count?: number;
  is_liked?: boolean;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, options?: { alt?: string; title?: string }) => void;
  onSelectMultiple?: (urls: string[], options?: { alt?: string; title?: string }) => void;
  featuredUrl?: string;
  keepOpenAfterSelect?: boolean; // 선택 후 모달 유지 여부
  autoFilterFolder?: string; // 자동 필터링할 폴더 경로 (예: "originals/daily-branding/kakao/2025-11-15/account1/background")
  showCompareMode?: boolean; // 비교 모드 활성화
  maxCompareCount?: number; // 최대 비교 개수 (기본 3)
};

const GalleryPicker: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  onSelectMultiple,
  featuredUrl,
  keepOpenAfterSelect = true, // 기본값: 선택 후 모달 유지
  autoFilterFolder,
  showCompareMode = true,
  maxCompareCount = 3
}) => {
  const [allImages, setAllImages] = useState<ImageItem[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'webp' | 'medium' | 'thumb'>('all');
  const [folderFilter, setFolderFilter] = useState<string>(autoFilterFolder || '');
  const [selectedDate, setSelectedDate] = useState<string>('');
  // originals/daily-branding/kakao 루트 폴더인 경우 기본값으로 미사용 필터 활성화
  const [showUnusedOnly, setShowUnusedOnly] = useState(() => {
    if (autoFilterFolder?.includes('originals/daily-branding/kakao') && 
        !autoFilterFolder.match(/\/\d{4}-\d{2}-\d{2}\//)) {
      return true; // 날짜별 폴더가 아닌 루트 kakao 폴더인 경우
    }
    return false;
  });
  const [showLikedOnly, setShowLikedOnly] = useState(false);
  const [altText, setAltText] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentFeatured, setCurrentFeatured] = useState<string | undefined>(featuredUrl);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set());
  const [showCompareView, setShowCompareView] = useState(false);
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set()); // 좋아요한 이미지 URL 저장
  const pageSize = 24;

  // 이미지 로드 함수
  const fetchImages = async (resetPage = false) => {
    try {
      setIsLoading(true);
      const currentPage = resetPage ? 1 : page;
      const offset = (currentPage - 1) * pageSize;
      
      // 폴더 필터가 있으면 prefix 파라미터로 전달
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: offset.toString(),
      });
      
      if (folderFilter) {
        params.append('prefix', folderFilter);
        // originals/daily-branding/kakao 루트 폴더인 경우 하위 폴더 포함
        const includeChildren = folderFilter === 'originals/daily-branding/kakao' ? 'true' : 'false';
        params.append('includeChildren', includeChildren);
      }
      
      const res = await fetch(`/api/admin/all-images?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setAllImages(data.images || []);
        setTotal(data.total || 0);
        if (resetPage) setPage(1);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    // 모달이 열릴 때 autoFilterFolder가 있으면 폴더 필터 설정
    if (autoFilterFolder) {
      // originals/daily-branding/kakao 루트 폴더인 경우 미사용 필터 활성화 및 폴더 필터 조정
      if (autoFilterFolder.includes('originals/daily-branding/kakao') && 
          !autoFilterFolder.match(/\/\d{4}-\d{2}-\d{2}\//)) {
        // 날짜별 폴더가 아닌 루트 kakao 폴더인 경우
        setShowUnusedOnly(true);
        // 하위 폴더 포함하도록 폴더 필터 설정
        setFolderFilter('originals/daily-branding/kakao');
      } else {
        setFolderFilter(autoFilterFolder);
      }
    }
    // 모달이 닫힐 때 상태 초기화
    return () => {
      setSelected(new Set());
      setSelectedForCompare(new Set());
      setShowCompareView(false);
    };
  }, [isOpen, autoFilterFolder]);

  // 폴더 필터나 페이지 변경 시 이미지 로드
  useEffect(() => {
    if (!isOpen) return;
    fetchImages();
  }, [isOpen, page, folderFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let filteredImages = (allImages || [])
      .filter((img) => {
        // 폴더 필터는 서버에서 처리되므로 클라이언트 사이드 필터링 제거
        
        // 타입 필터 적용
        const n = (img.name || '').toLowerCase();
        const u = (img.url || '').toLowerCase();
        if (filter === 'webp') return /\.webp$/i.test(n) || /\.webp$/i.test(u);
        if (filter === 'medium') return /_medium\./i.test(n) || /_medium\./i.test(u);
        if (filter === 'thumb') return /_thumb\./i.test(n) || /_thumb\.webp$/i.test(n) || /_thumb\./i.test(u) || /_thumb\.webp$/i.test(u);
        return true;
      })
      .filter((img) => {
        // 검색 필터
        if (q && !img.name.toLowerCase().includes(q) && !img.url.toLowerCase().includes(q)) {
          return false;
        }
        
        // 미사용 이미지 필터 (usage_count가 0이거나 없음)
        if (showUnusedOnly) {
          const usageCount = (img as any).usage_count;
          // 디버깅: 첫 번째 이미지만 로그
          if (allImages.indexOf(img) === 0) {
            console.log('🔍 미사용 필터 체크:', {
              name: img.name,
              usage_count: usageCount,
              type: typeof usageCount,
              isUndefined: usageCount === undefined,
              isNull: usageCount === null,
              willPass: (usageCount === undefined || usageCount === null || usageCount === 0)
            });
          }
          // usage_count가 undefined이거나 null이면 0으로 간주 (미사용)
          // usage_count가 명시적으로 0보다 크면 사용 중인 이미지이므로 제외
          if (usageCount !== undefined && usageCount !== null && usageCount > 0) {
            return false;
          }
          // usage_count가 0이거나 없으면 통과 (미사용 이미지)
        }
        
        // 좋아요한 이미지 필터
        if (showLikedOnly) {
          const isLiked = (img as any).is_liked ?? false;
          if (!isLiked) {
            return false;
          }
        }
        
        return true;
      });
    
    // 디버깅: 필터 결과 로그
    if (showUnusedOnly && filteredImages.length === 0 && allImages.length > 0) {
      console.warn('⚠️ 미사용 필터: 이미지가 없습니다.', {
        totalImages: allImages.length,
        firstImageUsageCount: (allImages[0] as any).usage_count,
        allUsageCounts: allImages.map((img, idx) => ({
          idx,
          name: img.name,
          usage_count: (img as any).usage_count
        }))
      });
    }
    
    // 정렬: 최근 생성된 이미지 우선 (URL에 타임스탬프가 포함된 경우)
    return filteredImages.sort((a, b) => {
      const aMatch = a.url.match(/(\d{13})/);
      const bMatch = b.url.match(/(\d{13})/);
      if (aMatch && bMatch) {
        return parseInt(bMatch[1]) - parseInt(aMatch[1]);
      }
      return 0;
    });
  }, [allImages, query, filter, showUnusedOnly, showLikedOnly]);

  useEffect(() => {
    setCurrentFeatured(featuredUrl);
  }, [featuredUrl]);

  // 좋아요 상태 초기화 (이미지 로드 시)
  useEffect(() => {
    const liked = new Set<string>();
    allImages.forEach(img => {
      if ((img as any).is_liked) {
        liked.add(img.url);
      }
    });
    setLikedImages(liked);
  }, [allImages]);

  // 좋아요 토글 함수
  const handleToggleLike = async (img: ImageItem, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const currentLiked = likedImages.has(img.url);
    const newLikedState = !currentLiked;
    
    // 즉시 UI 업데이트 (낙관적 업데이트)
    setLikedImages(prev => {
      const newSet = new Set(prev);
      if (newLikedState) {
        newSet.add(img.url);
      } else {
        newSet.delete(img.url);
      }
      return newSet;
    });

    // API 호출
    try {
      const response = await fetch('/api/admin/toggle-image-like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: img.url,
          isLiked: newLikedState
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '좋아요 토글 실패');
      }

      // 이미지 목록 업데이트
      setAllImages(prev => prev.map(i => 
        i.url === img.url 
          ? { ...i, is_liked: newLikedState } as ImageItem
          : i
      ));
    } catch (error: any) {
      console.error('좋아요 토글 오류:', error);
      // 실패 시 롤백
      setLikedImages(prev => {
        const newSet = new Set(prev);
        if (currentLiked) {
          newSet.add(img.url);
        } else {
          newSet.delete(img.url);
        }
        return newSet;
      });
      alert(`좋아요 토글 실패: ${error.message}`);
    }
  };

  const isFeatured = (img: ImageItem) => {
    if (!currentFeatured) return false;
    const normalizeUrl = (u: string) => u.replace(/^http:\/\//, 'https://');
    const getFile = (u: string) => {
      try { return new URL(u).pathname.split('/').pop() || u; } catch { return u; }
    };
    const stripVariant = (name: string) => {
      // remove known variants like _thumb, _thumb.webp, _medium before extension
      const lower = name.toLowerCase();
      const match = lower.match(/^(.*?)(?:_(thumb|medium))(\.[a-z0-9]+)$/i);
      if (match) return match[1] + match[3];
      return name;
    };
    const aUrl = normalizeUrl(currentFeatured);
    const bUrl = normalizeUrl(img.url);
    if (aUrl === bUrl) return true;
    const aFile = stripVariant(getFile(aUrl));
    const bFile = stripVariant(getFile(bUrl));
    if (aFile === bFile) return true;
    // also compare basename without extension
    const base = (n: string) => n.replace(/\.[^.]+$/, '');
    return base(aFile) === base(bFile);
  };

  const toggleSelect = (name: string) => {
    setSelected(prev => {
      const s = new Set(prev);
      if (s.has(name)) s.delete(name); else s.add(name);
      return s;
    });
  };

  // 비교 모드용 선택 토글
  const toggleCompareSelect = (name: string) => {
    setSelectedForCompare(prev => {
      const s = new Set(prev);
      if (s.has(name)) {
        s.delete(name);
      } else {
        if (s.size >= maxCompareCount) {
          // 최대 개수 초과 시 가장 오래된 것 제거
          const first = Array.from(s)[0];
          s.delete(first);
        }
        s.add(name);
      }
      return s;
    });
  };

  // 비교 모드 활성화 (2개 이상 선택 시 자동 전환)
  useEffect(() => {
    if (showCompareMode && selectedForCompare.size >= 2) {
      // 자동으로 비교 뷰로 전환
      setShowCompareView(true);
    } else if (selectedForCompare.size < 2) {
      // 2개 미만이면 비교 뷰 닫기
      setShowCompareView(false);
    }
  }, [selectedForCompare.size, showCompareMode]);

  // 단일 이미지 선택 처리
  const handleSingleSelect = (img: ImageItem) => {
    onSelect(img.url, { alt: altText || img.name });
    if (!keepOpenAfterSelect) {
      onClose();
    }
  };


  // 일괄 삭제 처리 (POST 메서드 사용)
  const handleBulkDelete = async () => {
    const names = Array.from(selected);
    if (names.length === 0) return;
    
    const confirmMessage = `선택한 ${names.length}개의 이미지를 정말 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`;
    if (!confirm(confirmMessage)) return;
    
    try {
      setIsLoading(true);
      
      // 선택된 이미지들의 전체 경로 구성 (folder_path + name)
      const imagePaths = names.map(name => {
        const img = allImages.find(i => i.name === name);
        if (!img) return name; // 폴더 경로가 없으면 이름만 사용
        
        // folder_path가 있으면 조합, 없으면 name만 사용
        if (img.folder_path) {
          return `${img.folder_path}/${img.name}`;
        }
        
        // URL에서 경로 추출 시도
        try {
          const urlObj = new URL(img.url);
          const pathMatch = urlObj.pathname.match(/\/blog-images\/(.+)$/);
          if (pathMatch) {
            return pathMatch[1];
          }
        } catch (e) {
          // URL 파싱 실패 시 name만 사용
        }
        
        return img.name;
      });
      
      console.log('🗑️ 삭제할 이미지 경로:', imagePaths);
      
      // POST 메서드로 imageNames 배열 전송
      const response = await fetch('/api/admin/delete-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageNames: imagePaths })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '삭제 실패');
      }
      
      alert(`✅ ${names.length}개의 이미지가 성공적으로 삭제되었습니다.`);
      
      // 선택 해제 및 이미지 목록 새로고침
      setSelected(new Set());
      await fetchImages(true);
    } catch (error: any) {
      console.error('일괄 삭제 오류:', error);
      alert(`❌ 이미지 삭제에 실패했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 날짜 변경 핸들러
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (date && autoFilterFolder) {
      // autoFilterFolder에서 날짜 부분만 교체
      const parts = autoFilterFolder.split('/');
      const dateIndex = parts.findIndex(p => /^\d{4}-\d{2}-\d{2}$/.test(p));
      if (dateIndex !== -1) {
        parts[dateIndex] = date;
        setFolderFilter(parts.join('/'));
      } else {
        // 날짜가 없으면 추가
        const kakaoIndex = parts.findIndex(p => p === 'kakao');
        if (kakaoIndex !== -1 && parts.length > kakaoIndex) {
          parts.splice(kakaoIndex + 1, 0, date);
          setFolderFilter(parts.join('/'));
        }
      }
    }
  };

  // autoFilterFolder에서 날짜 추출
  useEffect(() => {
    if (autoFilterFolder) {
      const dateMatch = autoFilterFolder.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        setSelectedDate(dateMatch[1]);
      }
    }
  }, [autoFilterFolder]);


  if (!isOpen) return null;

  // 비교 뷰가 활성화된 경우
  if (showCompareView && selectedForCompare.size >= 2) {
    const compareImages = Array.from(selectedForCompare)
      .map(name => filtered.find(img => img.name === name))
      .filter(Boolean) as ImageItem[];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
          {/* 비교 뷰 헤더 */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-gray-800">🔍 이미지 비교</h3>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {compareImages.length}개 선택됨
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCompareView(false);
                  setSelectedForCompare(new Set());
                }}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                목록으로
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl font-light"
              >
                ×
              </button>
            </div>
          </div>

          {/* 비교 이미지 그리드 */}
          <div className="flex-1 overflow-auto p-6 bg-gray-50">
            <div className={`grid gap-6 ${compareImages.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {compareImages.map((img, idx) => (
                <div
                  key={img.name}
                  className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-transparent hover:border-blue-400 transition-all"
                >
                  <div className="relative aspect-square bg-gray-100">
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white rounded text-xs font-semibold">
                      {idx + 1}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(img.url, { alt: altText || img.name });
                        if (!keepOpenAfterSelect) {
                          onClose();
                        }
                      }}
                      className="absolute bottom-2 right-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-lg transition-colors"
                    >
                      선택
                    </button>
                  </div>
                  <div className="p-3 border-t">
                    <p className="text-xs text-gray-600 truncate" title={img.name}>
                      {img.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-gray-800">🖼️ 갤러리에서 이미지 선택</h3>
            {folderFilter && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                📁 {folderFilter.split('/').pop()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              type="button" 
              onClick={() => fetchImages(true)} 
              className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2 transition-colors shadow-sm"
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
        {/* 필터 및 검색 바 */}
        <div className="p-4 border-b bg-white">
          <div className="flex items-center gap-3 flex-wrap">
            {/* 날짜 선택 (kakao 폴더인 경우) */}
            {autoFilterFolder && autoFilterFolder.includes('kakao') && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">날짜:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* 폴더 필터 - 항상 표시 */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <span className="text-xs text-gray-500 font-medium">폴더:</span>
              <input
                value={folderFilter}
                onChange={(e) => setFolderFilter(e.target.value)}
                placeholder="폴더 경로 (예: originals/daily-branding/kakao/2025-11-15/account1/background)"
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {folderFilter && (
                <button
                  type="button"
                  onClick={() => {
                    setFolderFilter('');
                    setSelectedDate('');
                  }}
                  className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                  title="필터 초기화"
                >
                  ✕
                </button>
              )}
            </div>

            {/* 핫키 필터 버튼 */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowUnusedOnly(!showUnusedOnly);
                  setShowLikedOnly(false);
                }}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  showUnusedOnly
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="미사용 이미지만 표시"
              >
                📭 미사용
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLikedOnly(!showLikedOnly);
                  setShowUnusedOnly(false);
                }}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  showLikedOnly
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="좋아요한 이미지만 표시"
              >
                ❤️ 좋아요
              </button>
            </div>

            {/* 검색 */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="검색 (파일명/확장자)"
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* ALT 입력 */}
            <div className="flex items-center gap-2">
              <input
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="ALT 텍스트"
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm min-w-[160px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        {/* 선택 액션 바 */}
        {(selected.size > 0 || (showCompareMode && selectedForCompare.size > 0)) && (
          <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                {selected.size > 0 && (
                  <span className="text-blue-700 font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    {selected.size}개 선택됨
                  </span>
                )}
                {showCompareMode && selectedForCompare.size > 0 && (
                  <span className="text-indigo-700 font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                    비교 {selectedForCompare.size}/{maxCompareCount}개
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selected.size > 0 && (
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm font-medium transition-colors"
                    onClick={() => setSelected(new Set())}
                  >
                    선택 해제
                  </button>
                )}
                {showCompareMode && selectedForCompare.size > 0 && (
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm font-medium transition-colors"
                    onClick={() => setSelectedForCompare(new Set())}
                  >
                    비교 해제
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {selected.size > 0 && (
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center gap-2 shadow-sm transition-colors font-medium"
                  onClick={handleBulkDelete}
                  disabled={isLoading}
                >
                  🗑️ 일괄 삭제 ({selected.size}개)
                </button>
              )}
            </div>
          </div>
        )}
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <div className="text-gray-600 font-medium">이미지 로딩 중...</div>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-4">📭</div>
                <div className="text-lg font-medium mb-2">이미지가 없습니다</div>
                <div className="text-sm">
                  {folderFilter ? `"${folderFilter}" 폴더에 이미지가 없습니다.` : '검색 결과가 없습니다.'}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* 전체 선택 체크박스 */}
              <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3 text-sm font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected.size > 0 && selected.size === filtered.length}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate = selected.size > 0 && selected.size < filtered.length;
                        }
                      }}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const allNames = new Set(filtered.map(img => img.name));
                          setSelected(allNames);
                        } else {
                          setSelected(new Set());
                        }
                      }}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span>
                      전체 선택 ({selected.size}/{filtered.length}개 표시)
                    </span>
                  </label>
                  {showCompareMode && (
                    <div className="text-xs text-gray-500">
                      💡 비교 모드: 이미지를 클릭하여 최대 {maxCompareCount}개까지 선택 가능 (2개 이상 선택 시 자동 비교)
                    </div>
                  )}
                </div>
              </div>
              {/* 이미지 개수에 따른 그리드 레이아웃 */}
              <div className={`grid gap-4 ${
                filtered.length === 1
                  ? 'grid-cols-1 max-w-md mx-auto' // 1개일 때 최대한 크게 (중앙 정렬)
                  : filtered.length >= 2 && filtered.length <= 3
                  ? 'grid-cols-2 md:grid-cols-2' // 2-3개일 때 2열로 크게
                  : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' // 4개 이상일 때 기본 그리드
              }`}>
              {filtered.map((img) => {
                const isCompareSelected = selectedForCompare.has(img.name);
                const shouldHighlightCompare = showCompareMode && filtered.length >= 2 && filtered.length <= 3;
                return (
                  <div
                    key={img.name}
                    data-featured={isFeatured(img) ? 'true' : 'false'}
                    className={`bg-white border-2 rounded-xl overflow-hidden text-left group relative transition-all hover:shadow-lg ${
                      isFeatured(img)
                        ? 'border-yellow-400 shadow-yellow-200'
                        : isCompareSelected
                        ? 'border-indigo-500 shadow-indigo-200'
                        : selected.has(img.name)
                        ? 'border-blue-400 shadow-blue-200'
                        : shouldHighlightCompare
                        ? 'border-indigo-300 hover:border-indigo-400'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* 대표 이미지 배지 */}
                    {isFeatured(img) && (
                      <span className="absolute top-2 left-2 z-20 px-2 py-1 text-[10px] font-bold rounded-md bg-yellow-500 text-white shadow-lg">
                        ⭐ 대표
                      </span>
                    )}
                    
                    {/* 비교 모드 배지 */}
                    {showCompareMode && isCompareSelected && (
                      <span className="absolute top-2 right-2 z-20 px-2 py-1 text-[10px] font-bold rounded-md bg-indigo-600 text-white shadow-lg">
                        비교 {Array.from(selectedForCompare).indexOf(img.name) + 1}
                      </span>
                    )}

                    {/* 선택 체크박스 */}
                    <label className="absolute top-2 left-2 z-20 bg-white/95 backdrop-blur-sm rounded-md px-1.5 py-1 shadow-md border border-gray-200">
                      <input
                        type="checkbox"
                        checked={selected.has(img.name)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelect(img.name);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>

                    {/* 이미지 */}
                    <button
                      type="button"
                      className="w-full"
                      onClick={() => {
                        // 비교 모드가 활성화되어 있으면 자동으로 비교에 추가
                        if (showCompareMode) {
                          toggleCompareSelect(img.name);
                        } else {
                          handleSingleSelect(img);
                        }
                      }}
                    >
                      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
                        <img
                          src={img.url}
                          alt={img.name}
                          className="w-full h-full object-contain p-2"
                        />
                        {isFeatured(img) && (
                          <div className="absolute inset-0 rounded-lg border-2 border-yellow-400 shadow-[0_0_0_2px_rgba(255,193,7,0.3)_inset] pointer-events-none"></div>
                        )}
                      </div>
                      
                      {/* 파일명 및 배지 */}
                      <div className="p-3 bg-white border-t border-gray-100">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs text-gray-700 truncate font-medium" title={img.name}>
                            {img.name}
                          </span>
                          {/* 버전 배지 */}
                          {/(_thumb\.|_thumb\.webp$)/i.test(img.name) ? (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-medium flex-shrink-0">
                              thumb
                            </span>
                          ) : /_medium\./i.test(img.name) ? (
                            <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-medium flex-shrink-0">
                              medium
                            </span>
                          ) : /\.webp$/i.test(img.name) ? (
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-medium flex-shrink-0">
                              webp
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium flex-shrink-0">
                              original
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* 퀵액션 (호버 시 노출 또는 2-3개일 때 항상 표시) */}
                    <div className={`absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center gap-2 rounded-xl ${
                      shouldHighlightCompare ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}>
                      <button
                        type="button"
                        title="빠른 삽입"
                        className="px-4 py-2 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-lg font-medium transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSingleSelect(img);
                        }}
                      >
                        ➕ 삽입
                      </button>
                      <button
                        type="button"
                        title="이미지 확대 보기"
                        className="px-4 py-2 text-xs rounded-lg bg-white text-gray-800 hover:bg-gray-100 shadow-lg font-medium transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewUrl(img.url);
                        }}
                      >
                        🔍 확대
                      </button>
                      <button
                        type="button"
                        title={likedImages.has(img.url) ? "좋아요 취소" : "좋아요"}
                        className={`px-4 py-2 text-xs rounded-lg shadow-lg font-medium transition-colors ${
                          likedImages.has(img.url)
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        onClick={(e) => handleToggleLike(img, e)}
                      >
                        {likedImages.has(img.url) ? '❤️ 좋아요' : '🤍 좋아요'}
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>
            </>
          )}
        </div>
        {/* 푸터 */}
        <div className="flex items-center justify-between p-4 border-t bg-white">
          <div className="flex items-center gap-4 text-sm">
            <span className="font-semibold text-gray-700">
              📊 총 <span className="text-blue-600">{total}</span>개 이미지
            </span>
            <span className="text-gray-500">
              페이지 <span className="font-medium text-gray-700">{page}</span>
            </span>
            {filtered.length > 0 && (
              <span className="text-gray-500">
                표시: <span className="font-medium text-gray-700">{filtered.length}</span>개
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              ← 이전
            </button>
            <span className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg font-medium">
              {page}
            </span>
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              onClick={() => setPage(page + 1)}
              disabled={page * pageSize >= total}
            >
              다음 →
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
              onClick={onClose}
            >
              닫기
            </button>
          </div>
        </div>
        {/* 미리보기 모달 */}
        {previewUrl && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[80] p-4"
            onClick={() => setPreviewUrl(null)}
          >
            <div className="relative max-w-[95vw] max-h-[90vh]">
              <button
                type="button"
                onClick={() => setPreviewUrl(null)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 text-3xl font-light"
              >
                ×
              </button>
              <img
                src={previewUrl}
                alt="preview"
                className="max-w-full max-h-[90vh] object-contain bg-white rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default GalleryPicker;


