import React, { useEffect, useMemo, useState, useRef } from 'react';
import { uploadImageToSupabase } from '../../lib/image-upload-utils';

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
  sourceFilter?: 'mms' | 'blog' | 'campaign' | 'kakao'; // source 필터 (image_metadata 테이블의 source 필드)
  channelFilter?: 'sms' | 'kakao' | 'naver' | 'blog'; // channel 필터 (image_metadata 테이블의 channel 필드)
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
  maxCompareCount = 3,
  sourceFilter,
  channelFilter
}) => {
  const [allImages, setAllImages] = useState<ImageItem[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'webp' | 'medium' | 'thumb'>('all');
  const [folderFilter, setFolderFilter] = useState<string>(autoFilterFolder || '');
  const [selectedDate, setSelectedDate] = useState<string>('');
  // ⚠️ 미사용 필터 제거됨
  const [showLikedOnly, setShowLikedOnly] = useState(false);
  const [altText, setAltText] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [imageSource, setImageSource] = useState<'supabase' | 'solapi'>('supabase'); // 이미지 소스 탭
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentFeatured, setCurrentFeatured] = useState<string | undefined>(featuredUrl);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set());
  const [showCompareView, setShowCompareView] = useState(false);
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set()); // 좋아요한 이미지 URL 저장
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageSize = 24;
  const [recentFolders, setRecentFolders] = useState<string[]>([]); // 최근 사용 폴더 목록
  
  // 이미지 복사/링크 모달 관련 상태
  const [showCopyLinkModal, setShowCopyLinkModal] = useState(false);
  const [pendingImageDrop, setPendingImageDrop] = useState<{ imageData: any; targetFolder: string } | null>(null);

  // Solapi 이미지 로드 함수
  const fetchSolapiImages = async (resetPage = false) => {
    try {
      setIsLoading(true);
      const currentPage = resetPage ? 1 : page;
      const offset = (currentPage - 1) * pageSize;
      
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: offset.toString(),
      });
      
      if (query) {
        params.append('search', query);
      }
      
      const apiUrl = `/api/admin/solapi-images?${params.toString()}`;
      console.log('🔍 GalleryPicker Solapi 이미지 로드 요청:', apiUrl);
      
      const res = await fetch(apiUrl);
      
      if (!res.ok) {
        console.error('❌ Solapi 이미지 로드 실패:', res.status, res.statusText);
        const errorText = await res.text().catch(() => 'Unknown error');
        console.error('에러 상세:', errorText);
        setAllImages([]);
        setTotal(0);
        return;
      }
      
      const data = await res.json();
      console.log('✅ Solapi 이미지 로드 성공:', {
        count: data.images?.length || 0,
        total: data.total || 0
      });
      
      // ImageItem 형식으로 변환
      const images = (data.images || []).map((img: any) => ({
        name: img.name,
        url: img.url,
        folder_path: 'solapi',
        usage_count: 0,
        is_liked: false,
        imageId: img.imageId, // Solapi imageId 저장
        is_solapi: true
      }));
      
      setAllImages(images);
      setTotal(data.total || 0);
      if (resetPage) setPage(1);
    } catch (error) {
      console.error('❌ Solapi 이미지 로드 중 오류:', error);
      setAllImages([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  // 이미지 로드 함수
  const fetchImages = async (resetPage = false, retryCount = 0) => {
    // Solapi 탭이면 Solapi 이미지 로드
    if (imageSource === 'solapi') {
      return fetchSolapiImages(resetPage);
    }
    
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
        
        // ✅ 제품 합성 관리에서 사용할 때는 현재 폴더만 조회 (빠른 응답)
        // "이미지 갤러리 관리"처럼 현재 폴더만 빠르게 조회하여 타임아웃 방지
        const isFromProductComposition = typeof window !== 'undefined' && 
                                         window.location.pathname.includes('/product-composition');
        
        if (isFromProductComposition) {
          // 제품 합성 관리에서는 현재 폴더만 조회 (includeChildren=false)
          // 사용자가 필요한 하위 폴더(composition, detail, gallery)를 직접 선택할 수 있음
          params.append('includeChildren', 'false');
          console.log(`📁 [GalleryPicker] 제품 합성 관리: 현재 폴더만 조회 (빠른 응답)`);
        } else {
          // 기존 로직 (카카오 콘텐츠 등에서는 하위 폴더 포함)
          const isKakaoFolder = folderFilter.startsWith('originals/daily-branding/kakao');
          const isMmsFolder = folderFilter.startsWith('originals/mms');
          const isBlogFolder = folderFilter.startsWith('originals/blog/');
          const isProductsFolder = folderFilter.startsWith('originals/products/');
          const includeChildren = (isKakaoFolder || isMmsFolder || isBlogFolder || isProductsFolder) ? 'true' : 'false';
          params.append('includeChildren', includeChildren);
        }
      }
      
      // source 필터 추가
      if (sourceFilter) {
        params.append('source', sourceFilter);
      }
      
      // channel 필터 추가
      if (channelFilter) {
        params.append('channel', channelFilter);
      }
      
      // ✅ 캐시 무효화: folderFilter가 변경되거나 재로딩 시 forceRefresh 추가
      // 재시도가 아닌 첫 요청이고 폴더 필터가 있을 때만 캐시 무효화
      if (retryCount === 0 && folderFilter) {
        params.append('forceRefresh', 'true');
      }
      
      const apiUrl = `/api/admin/all-images?${params.toString()}`;
      const requestStartTime = Date.now();
      console.log('🔍 GalleryPicker 이미지 로드 요청:', apiUrl, retryCount > 0 ? `(재시도 ${retryCount})` : folderFilter ? '(캐시 무효화)' : '');
      
      const res = await fetch(apiUrl);
      
      const requestDuration = Date.now() - requestStartTime;
      console.log(`⏱️ API 응답 시간: ${requestDuration}ms`);
      
      if (!res.ok) {
        // ✅ 504 타임아웃 시 자동 재시도 (최대 2회)
        if (res.status === 504 && retryCount < 2) {
          const retryDelay = (retryCount + 1) * 2000; // 2초, 4초
          console.log(`⚠️ 타임아웃 발생 (${res.status}), ${retryDelay}ms 후 재시도... (${retryCount + 1}/2)`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return fetchImages(resetPage, retryCount + 1);
        }
        
        console.error('❌ 이미지 로드 실패:', res.status, res.statusText);
        const errorText = await res.text().catch(() => 'Unknown error');
        console.error('에러 상세:', errorText);
        setAllImages([]);
        setTotal(0);
        return;
      }
      
      const data = await res.json();
      console.log('✅ 이미지 로드 성공:', {
        count: data.images?.length || 0,
        total: data.total || 0,
        folderFilter: folderFilter || '전체',
        retryCount: retryCount > 0 ? `(재시도 ${retryCount}회 후 성공)` : ''
      });
      
      setAllImages(data.images || []);
      setTotal(data.total || 0);
      if (resetPage) setPage(1);
    } catch (error: any) {
      // ✅ 네트워크 에러 시 재시도
      if (retryCount < 2 && (error.message?.includes('timeout') || error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError'))) {
        const retryDelay = (retryCount + 1) * 2000; // 2초, 4초
        console.log(`⚠️ 네트워크 에러, ${retryDelay}ms 후 재시도... (${retryCount + 1}/2):`, error.message);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return fetchImages(resetPage, retryCount + 1);
      }
      
      console.error('❌ 이미지 로드 중 오류:', error);
      setAllImages([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  // 이미지 소스 변경 시 이미지 다시 로드
  // 폴더 경로 추출 함수
  const extractFolderPathFromUrl = (url: string): string | null => {
    try {
      // Supabase Storage URL에서 경로 추출
      // 예: https://.../storage/v1/object/public/blog-images/originals/blog/2025-12/487/image.jpg
      const match = url.match(/blog-images\/([^?]+)/);
      if (match) {
        const fullPath = decodeURIComponent(match[1]);
        const pathParts = fullPath.split('/');
        // 파일명 제외하고 폴더 경로만 반환
        if (pathParts.length > 1) {
          return pathParts.slice(0, -1).join('/');
        }
      }
      return null;
    } catch (error) {
      console.error('폴더 경로 추출 실패:', error);
      return null;
    }
  };

  // 최근 폴더 목록 로드 및 현재 폴더 자동 추가
  useEffect(() => {
    if (!isOpen) return;
    
    // localStorage에서 최근 폴더 로드
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gallery-picker-recent-folders');
      if (saved) {
        try {
          const folders = JSON.parse(saved);
          setRecentFolders(folders);
        } catch (e) {
          console.error('최근 폴더 로드 실패:', e);
        }
      }
    }
    
    // autoFilterFolder나 folderFilter가 있으면 최근 폴더에 추가
    const currentFolder = autoFilterFolder || folderFilter;
    if (currentFolder && currentFolder.trim() !== '') {
      // 이미 최근 폴더에 있으면 추가하지 않음 (중복 방지)
      setRecentFolders(prev => {
        if (prev.includes(currentFolder)) {
          return prev;
        }
        const updated = [currentFolder, ...prev].slice(0, 6);
        if (typeof window !== 'undefined') {
          localStorage.setItem('gallery-picker-recent-folders', JSON.stringify(updated));
        }
        return updated;
      });
    }
  }, [isOpen, autoFilterFolder, folderFilter]);

  // 최근 폴더에 추가
  const addRecentFolder = (folderPath: string) => {
    if (!folderPath) return;
    const updated = [folderPath, ...recentFolders.filter(f => f !== folderPath)].slice(0, 6);
    setRecentFolders(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('gallery-picker-recent-folders', JSON.stringify(updated));
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchImages(true);
  }, [imageSource]);

  useEffect(() => {
    if (!isOpen) return;
    // 모달이 열릴 때 autoFilterFolder가 있으면 폴더 필터 설정
    if (autoFilterFolder) {
      console.log('📁 GalleryPicker autoFilterFolder:', autoFilterFolder);
      
      // ⚠️ 중요: originals/mms/YYYY-MM-DD/메시지ID 형식인 경우 상위 폴더로 자동 이동
      const isMessageIdFolder = autoFilterFolder.match(/^originals\/mms\/\d{4}-\d{2}-\d{2}\/\d+$/);
      let targetFolder = '';
      
      if (isMessageIdFolder) {
        // 메시지 ID 폴더인 경우 상위 폴더(날짜 폴더)로 자동 이동
        const parts = autoFilterFolder.split('/');
        targetFolder = parts.slice(0, -1).join('/'); // 마지막 메시지 ID 제거
        console.log(`📁 메시지 ID 폴더 감지, 상위 폴더로 자동 이동: ${targetFolder}`);
      } else if (autoFilterFolder.includes('originals/daily-branding/kakao') && 
          !autoFilterFolder.match(/\/\d{4}-\d{2}-\d{2}\//)) {
        // 날짜별 폴더가 아닌 루트 kakao 폴더인 경우
        // 하위 폴더 포함하도록 폴더 필터 설정
        targetFolder = 'originals/daily-branding/kakao';
      } else if (autoFilterFolder.includes('originals/mms')) {
        // originals/mms 폴더인 경우 (날짜 폴더 또는 루트)
        targetFolder = autoFilterFolder;
      } else {
        // 기타 폴더
        targetFolder = autoFilterFolder;
      }
      
      setFolderFilter(targetFolder);
      // 🔧 수정: 폴더 필터 설정 후 즉시 이미지 로드 (상태 업데이트를 기다리기 위해 setTimeout 사용)
      setTimeout(() => {
        fetchImages(true);
      }, 0);
    } else {
      // autoFilterFolder가 없으면 폴더 필터 초기화
      setFolderFilter('');
      // 🔧 수정: 폴더 필터 초기화 후에도 이미지 로드
      setTimeout(() => {
        fetchImages(true);
      }, 0);
    }
    // 모달이 닫힐 때 상태 초기화
    return () => {
      setSelected(new Set());
      setSelectedForCompare(new Set());
      setShowCompareView(false);
    };
  }, [isOpen, autoFilterFolder]);

  // 폴더 필터나 페이지 변경 시 이미지 로드 (캐시 무효화 포함)
  useEffect(() => {
    if (!isOpen) return;
    // folderFilter가 변경될 때는 캐시 무효화를 위해 resetPage=true
    const shouldResetPage = folderFilter !== undefined;
    console.log('📁 folderFilter 또는 page 변경 감지, 이미지 다시 로드:', { folderFilter, page, shouldResetPage });
    fetchImages(shouldResetPage);
  }, [isOpen, page, folderFilter]);

  // 이미지 업로드 핸들러
  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    try {
      setIsUploading(true);
      
      // 현재 폴더 필터를 targetFolder로 사용
      const targetFolder = folderFilter || autoFilterFolder || undefined;
      
      console.log('📤 이미지 업로드 시작:', {
        fileName: file.name,
        targetFolder: targetFolder || '루트'
      });
      
      // 공통 업로드 함수 사용
      const { url } = await uploadImageToSupabase(file, {
        targetFolder: targetFolder,
        enableHEICConversion: true,
        enableEXIFBackfill: true,
      });
      
      console.log('✅ 이미지 업로드 완료:', url);
      
      // 업로드한 폴더를 최근 폴더에 추가
      if (targetFolder) {
        addRecentFolder(targetFolder);
      } else {
        // targetFolder가 없으면 업로드된 이미지 URL에서 폴더 경로 추출
        const folderPath = extractFolderPathFromUrl(url);
        if (folderPath) {
          addRecentFolder(folderPath);
        }
      }
      
      // 업로드 후 갤러리 새로고침
      await fetchImages(true);
      
      alert('이미지 업로드 완료!');
    } catch (error: any) {
      console.error('❌ 이미지 업로드 오류:', error);
      alert(`업로드 실패: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setIsUploading(false);
    }
  };

  // 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    // 같은 파일을 다시 선택할 수 있도록 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
        
        // ⚠️ 미사용 필터 제거됨
        
        // 좋아요한 이미지 필터
        if (showLikedOnly) {
          const isLiked = (img as any).is_liked ?? false;
          if (!isLiked) {
            return false;
          }
        }
        
        return true;
      });
    
    // ⚠️ 미사용 필터 디버깅 로그 제거됨
    
    // 정렬: 최근 생성된 이미지 우선 (URL에 타임스탬프가 포함된 경우)
    return filteredImages.sort((a, b) => {
      const aMatch = a.url.match(/(\d{13})/);
      const bMatch = b.url.match(/(\d{13})/);
      if (aMatch && bMatch) {
        return parseInt(bMatch[1]) - parseInt(aMatch[1]);
      }
      return 0;
    });
  }, [allImages, query, filter, showLikedOnly]);

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
    // Solapi 이미지인 경우 imageId를 직접 전달 (업로드 불필요)
    const solapiImageId = (img as any).imageId;
    if (solapiImageId && solapiImageId.startsWith('ST01FZ')) {
      // Solapi imageId를 직접 전달 (업로드 없이 즉시 사용)
      onSelect(solapiImageId, { alt: altText || img.name });
    } else {
      // Supabase 이미지는 기존대로 URL 전달
      // 이미지 선택 시 폴더 경로 추출 및 최근 폴더에 추가
      const folderPath = extractFolderPathFromUrl(img.url);
      if (folderPath) {
        addRecentFolder(folderPath);
      }
      onSelect(img.url, { alt: altText || img.name });
    }
    if (!keepOpenAfterSelect) {
      onClose();
    }
  };

  // 이미지 복사/링크 핸들러
  const handleImageCopyOrLink = async (imageData: any, targetFolder: string, action: 'copy' | 'link') => {
    try {
      setIsLoading(true);
      
      // 메시지 ID 추출 (targetFolder에서)
      const messageIdMatch = targetFolder.match(/\/(\d+)$/);
      const messageId = messageIdMatch ? parseInt(messageIdMatch[1]) : null;
      
      console.log('📋 이미지 복사/링크 작업:', { 
        imageUrl: imageData.url, 
        targetFolder, 
        action,
        messageId 
      });
      
      const response = await fetch('/api/admin/copy-or-link-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: imageData.url,
          targetFolder: targetFolder,
          action: action,
          messageId: messageId
        })
      });

      const result = await response.json();

      if (result.success) {
        const actionText = action === 'copy' ? '복사' : '링크 생성';
        alert(`✅ 이미지 ${actionText} 완료!\n\n${result.message}`);
        
        // 이미지 목록 새로고침
        fetchImages(true);
      } else {
        alert(`❌ 이미지 ${action === 'copy' ? '복사' : '링크 생성'} 실패: ${result.error || result.details}`);
      }
    } catch (error: any) {
      console.error('❌ 이미지 복사/링크 오류:', error);
      alert(`❌ 이미지 ${action === 'copy' ? '복사' : '링크 생성'} 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
      setShowCopyLinkModal(false);
      setPendingImageDrop(null);
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
                        // 이미지 선택 시 폴더 경로 추출 및 최근 폴더에 추가
                        const folderPath = extractFolderPathFromUrl(img.url);
                        if (folderPath) {
                          addRecentFolder(folderPath);
                        }
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
          <div className="flex items-center gap-3 flex-1">
            <h3 className="text-xl font-bold text-gray-800">🖼️ 갤러리에서 이미지 선택</h3>
            {/* 이미지 소스 탭 */}
            <div className="flex items-center gap-2 ml-4">
              <button
                type="button"
                onClick={() => {
                  setImageSource('supabase');
                  setPage(1);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  imageSource === 'supabase'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ☁️ Supabase
              </button>
              <button
                type="button"
                onClick={() => {
                  setImageSource('solapi');
                  setPage(1);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  imageSource === 'solapi'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📦 Solapi
              </button>
            </div>
            {/* 브레드크럼 네비게이션 */}
            {folderFilter && (
              <nav className="flex items-center gap-1 text-sm" aria-label="폴더 경로">
                {folderFilter.split('/').map((segment, index, array) => {
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
                            setFolderFilter(path);
                            console.log('📁 브레드크럼 클릭:', path);
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
          {/* 최근 사용 폴더 섹션 */}
          {(recentFolders.length > 0 || folderFilter) && (
            <div className="mb-3">
              <label className="block text-xs text-gray-500 font-medium mb-2">
                📁 최근 사용 폴더
              </label>
              <div className="flex flex-wrap gap-2">
                {/* 현재 폴더가 최근 폴더 목록에 없으면 먼저 표시 */}
                {folderFilter && !recentFolders.includes(folderFilter) && (
                  <button
                    type="button"
                    onClick={() => {
                      addRecentFolder(folderFilter);
                      setPage(1);
                      fetchImages(true);
                    }}
                    className="px-3 py-1.5 text-xs border border-blue-500 bg-blue-50 text-blue-700 rounded-lg transition-all hover:bg-blue-100"
                    title={folderFilter}
                  >
                    {folderFilter.replace(/^originals\//, '')}
                  </button>
                )}
                {/* 기존 최근 폴더들 */}
                {recentFolders.map((folder, index) => {
                  const displayPath = folder.replace(/^originals\//, '');
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setFolderFilter(folder);
                        setPage(1);
                        fetchImages(true);
                      }}
                      className={`px-3 py-1.5 text-xs border rounded-lg transition-all ${
                        folderFilter === folder
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                      title={folder}
                    >
                      {displayPath}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
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
              {/* ⚠️ 미사용 버튼 제거됨 */}
              <button
                type="button"
                onClick={() => {
                  setShowLikedOnly(!showLikedOnly);
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

            {/* 이미지 업로드 버튼 */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors shadow-sm"
              >
                {isUploading ? (
                  <>
                    <span className="animate-spin">⏳</span> 업로드 중...
                  </>
                ) : (
                  <>
                    <span>📤</span> 이미지 업로드
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.heic,.heif"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>
        </div>

        {/* 드래그 앤 드롭 업로드 영역 */}
        <div
          className={`mx-4 mb-4 border-2 border-dashed rounded-lg p-6 text-center transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400 bg-gray-50'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isDragging) setIsDragging(true);
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // 드래그가 영역을 벗어났는지 확인
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const x = e.clientX;
            const y = e.clientY;
            if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
              setIsDragging(false);
            }
          }}
          onDrop={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
              const file = files[0];
              if (file && file.type.startsWith('image/')) {
                await handleImageUpload(file);
              } else {
                alert('이미지 파일만 업로드할 수 있습니다.');
              }
            }
          }}
        >
          <div className="space-y-2">
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <label htmlFor="gallery-picker-file-upload" className="cursor-pointer">
                <span className="block text-sm font-medium text-gray-900">
                  {isDragging ? '여기에 이미지를 놓으세요' : '이미지 파일을 드래그하거나 클릭하여 업로드'}
                </span>
                <span className="mt-1 block text-sm text-gray-500">
                  PNG, JPG, GIF, HEIC 파일 지원
                  {folderFilter && (
                    <span className="block mt-1 text-xs text-blue-600">
                      📁 업로드 위치: {folderFilter}
                    </span>
                  )}
                </span>
              </label>
              <input
                id="gallery-picker-file-upload"
                type="file"
                accept="image/*,.heic,.heif"
                className="hidden"
                onChange={handleFileSelect}
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
                <div className="text-sm text-gray-400 mt-2">
                  {folderFilter ? `폴더: ${folderFilter}` : '전체 이미지 조회 중'}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Supabase에서 이미지를 불러오는 중입니다. 잠시만 기다려주세요...
                </div>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div 
                className="text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition-colors"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  try {
                    const imageDataStr = e.dataTransfer.getData('image');
                    if (imageDataStr) {
                      const imageData = JSON.parse(imageDataStr);
                      const targetFolder = folderFilter || 'originals/mms';
                      
                      const isShiftPressed = e.shiftKey;
                      const isCtrlPressed = e.ctrlKey || e.metaKey;
                      
                      if (isShiftPressed) {
                        await handleImageCopyOrLink(imageData, targetFolder, 'link');
                      } else if (isCtrlPressed) {
                        await handleImageCopyOrLink(imageData, targetFolder, 'copy');
                      } else {
                        setPendingImageDrop({ imageData, targetFolder });
                        setShowCopyLinkModal(true);
                      }
                    }
                  } catch (error) {
                    console.error('❌ 드롭 처리 오류:', error);
                  }
                }}
              >
                <div className="text-4xl mb-4">📭</div>
                <div className="text-lg font-medium mb-2">이미지가 없습니다</div>
                <div className="text-sm mb-4">
                  {folderFilter ? (
                    <>
                      <div className="mb-2">"{folderFilter}" 폴더에 이미지가 없습니다.</div>
                      {folderFilter.includes('originals/daily-branding/kakao') && (
                        <div className="text-xs text-gray-400 mt-2">
                          💡 팁: 날짜 필터를 변경하거나 상위 폴더에서 이미지를 찾아보세요.
                        </div>
                      )}
                    </>
                  ) : (
                    '검색 결과가 없습니다.'
                  )}
                </div>
                {folderFilter && (
                  <>
                    <button
                      onClick={() => {
                        // 상위 폴더로 이동
                        const parts = folderFilter.split('/');
                        if (parts.length > 1) {
                          const parentFolder = parts.slice(0, -1).join('/');
                          setFolderFilter(parentFolder);
                          console.log('📁 상위 폴더로 이동:', parentFolder);
                        } else {
                          setFolderFilter('');
                          console.log('📁 전체 폴더로 이동');
                        }
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm mb-2"
                    >
                      {folderFilter.split('/').length > 1 ? '상위 폴더 보기' : '전체 폴더 보기'}
                    </button>
                    <div className="text-xs text-gray-400 mt-2">
                      💡 이미지를 여기에 드래그하여 복사/링크할 수 있습니다<br />
                      Shift + 드롭 = 링크 | Ctrl/Cmd + 드롭 = 복사
                    </div>
                  </>
                )}
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
                    
                    {/* 🔗 링크된 이미지 배지 */}
                    {(img as any).is_linked && (
                      <span className="absolute top-2 right-2 z-20 px-2 py-1 text-[10px] font-bold rounded-md bg-purple-500 text-white shadow-lg flex items-center gap-1">
                        🔗 링크
                      </span>
                    )}
                    
                    {/* 비교 모드 배지 */}
                    {showCompareMode && isCompareSelected && (
                      <span className={`absolute ${(img as any).is_linked ? 'top-10' : 'top-2'} right-2 z-20 px-2 py-1 text-[10px] font-bold rounded-md bg-indigo-600 text-white shadow-lg`}>
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
                      className={`w-full ${(img as any).is_linked ? 'opacity-60' : ''}`}
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
                          {/* 🔗 링크된 이미지 원본 폴더 표시 */}
                          {(img as any).is_linked && (img as any).original_folder && (
                            <span className="text-[10px] text-purple-600 truncate" title={`원본: ${(img as any).original_folder}`}>
                              🔗 {(img as any).original_folder.split('/').pop()}
                            </span>
                          )}
                          {/* 버전 배지 - 링크 이미지가 아닐 때만 표시 (original 배지 제외) */}
                          {!(img as any).is_linked && (
                            <>
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
                              ) : null}
                            </>
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
                        title="cleanup.pictures에서 편집"
                        className="px-4 py-2 text-xs rounded-lg bg-purple-600 text-white hover:bg-purple-700 shadow-lg font-medium transition-colors"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            // 1. 이미지 다운로드
                            const response = await fetch(img.url);
                            if (!response.ok) {
                              throw new Error(`이미지 다운로드 실패: ${response.status}`);
                            }
                            const blob = await response.blob();
                            
                            // 2. cleanup.pictures 열기
                            const cleanupWindow = window.open('https://cleanup.pictures/', '_blank');
                            
                            // 3. 이미지를 다운로드 폴더에 저장 (사용자가 cleanup.pictures에 드래그 앤 드롭 가능)
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = img.name || `image-${Date.now()}.${img.name?.split('.').pop() || 'png'}`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            
                            // 4. 안내 메시지
                            setTimeout(() => {
                              if (cleanupWindow) {
                                cleanupWindow.focus();
                                alert(
                                  '✅ 이미지가 다운로드되었습니다.\n\n' +
                                  '📋 다음 단계:\n' +
                                  '1. cleanup.pictures에 다운로드된 이미지를 드래그 앤 드롭하세요\n' +
                                  '2. 편집 후 "Continue with SD" 버튼을 클릭하세요\n' +
                                  '3. 편집된 이미지를 다운로드하세요'
                                );
                              }
                              window.URL.revokeObjectURL(url);
                            }, 500);
                            
                          } catch (error) {
                            console.error('이미지 처리 오류:', error);
                            alert('이미지 처리에 실패했습니다: ' + (error instanceof Error ? error.message : String(error)));
                          }
                        }}
                      >
                        ✏️ 수정
                      </button>
                      <button
                        type="button"
                        title="이미지 다운로드"
                        className="px-4 py-2 text-xs rounded-lg bg-green-600 text-white hover:bg-green-700 shadow-lg font-medium transition-colors"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            // 이미지 다운로드
                            const response = await fetch(img.url);
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = img.name || `image-${Date.now()}.jpg`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(url);
                          } catch (error) {
                            console.error('다운로드 오류:', error);
                            alert('이미지 다운로드에 실패했습니다.');
                          }
                        }}
                      >
                        ⬇️ 다운로드
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

      {/* 이미지 복사/링크 선택 모달 */}
      {showCopyLinkModal && pendingImageDrop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">이미지 작업 선택</h3>
            <p className="text-sm text-gray-600 mb-4">
              <strong>{pendingImageDrop.imageData.name}</strong> 이미지를<br />
              <strong>{pendingImageDrop.targetFolder}</strong> 폴더에 어떻게 처리하시겠습니까?
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => handleImageCopyOrLink(pendingImageDrop.imageData, pendingImageDrop.targetFolder, 'copy')}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                📋 복사 (파일 복사)
              </button>
              
              <button
                onClick={() => handleImageCopyOrLink(pendingImageDrop.imageData, pendingImageDrop.targetFolder, 'link')}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                🔗 링크 (태그만 추가)
              </button>
              
              <button
                onClick={() => {
                  setShowCopyLinkModal(false);
                  setPendingImageDrop(null);
                }}
                className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
              <p>💡 팁:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li><strong>Shift + 드롭</strong>: 바로 링크 생성</li>
                <li><strong>Ctrl/Cmd + 드롭</strong>: 바로 복사</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPicker;


