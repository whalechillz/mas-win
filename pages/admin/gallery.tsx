import { useState, useEffect, useRef, useMemo } from 'react';
import Head from 'next/head';
import AdminNav from '../../components/admin/AdminNav';
import Link from 'next/link';
import { ImageMetadataModal } from '../../components/ImageMetadataModal';
import { CategoryManagementModal } from '../../components/CategoryManagementModal';

interface ImageMetadata {
  id?: string;
  name: string;
  url: string;
  size: number;
  created_at: string;
  updated_at: string;
  folder_path?: string; // 폴더 경로 추가
  alt_text?: string;
  keywords?: string[];
  title?: string;
  description?: string;
  category?: string | number; // 숫자 ID 또는 이름
  is_featured?: boolean;
  usage_count?: number;
  used_in_posts?: string[];
  // 선택적 상세 정보 (있을 수도 있음)
  file_size?: number;
  width?: number;
  height?: number;
  optimized_versions?: any;
  // 메타데이터 존재 여부 (API에서 제공)
  has_metadata?: boolean;
  // ✅ 메타데이터 품질 정보 (1단계 추가)
  has_quality_metadata?: boolean;
  metadata_quality?: {
    score: number;  // 0-100점
    has_alt_text: boolean;
    has_title: boolean;
    has_description: boolean;
    has_keywords: boolean;
    issues: string[];  // 품질 이슈 목록
  };
}

export default function GalleryAdmin() {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [imagesPerPage] = useState(20); // 성능 최적화를 위해 페이지당 이미지 수 감소
  const [hasMoreImages, setHasMoreImages] = useState(true);
  
  // SEO 최적화된 파일명 생성 함수 (한글 자동 영문 변환)
  const generateSEOFileName = (title, keywords, index = 1) => {
    // 한글-영문 변환 라이브러리 사용
    const { generateSEOFileName: generateSEO } = require('../../lib/korean-to-english-translator');
    return generateSEO(title, keywords, index);
  };

  // 한국어 텍스트에서 키워드 추출 함수
  const extractKoreanKeywords = (text) => {
    const golfKeywords = [
      '골프', '드라이버', '아이언', '퍼터', '웨지', '우드', '골프장', '골프공', '골프백', '골프장갑', '골프화',
      '그린', '페어웨이', '벙커', '러프', '티', '스윙', '그립', '스탠스', '샷', '라운드',
      '남성', '여성', '성인', '젊은', '나이든', '미소', '행복한', '웃음',
      '야외', '스포츠', '자연', '하늘', '구름', '일몰', '일출', '잔디', '나무', '호수', '산', '언덕',
      '흰색', '검은색', '파란색', '초록색', '빨간색', '노란색', '갈색', '회색',
      '폴로셔츠', '바지', '모자', '캡', '바이저', '장갑', '신발',
      '아디다스', '나이키', '푸마', '타이틀리스트', '캘러웨이', '테일러메이드', '핑', '미즈노'
    ];
    
    const foundKeywords = [];
    const words = text.split(/[\s,.\-!?]+/);
    
    words.forEach(word => {
      const cleanWord = word.trim();
      if (cleanWord.length > 1 && golfKeywords.includes(cleanWord)) {
        if (!foundKeywords.includes(cleanWord)) {
          foundKeywords.push(cleanWord);
        }
      }
    });
    
    return foundKeywords.slice(0, 8); // 최대 8개 키워드
  };
  
  // 검색 및 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'featured' | 'unused' | 'duplicates' | 'category'>('all');
  const [folderFilter, setFolderFilter] = useState<string>('all'); // 폴더 필터 추가
  const [includeChildren, setIncludeChildren] = useState<boolean>(true); // 하위 폴더 포함
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'created_at' | 'name' | 'size' | 'usage_count' | 'folder_path'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // 동적 카테고리 상태 (useMemo보다 먼저 정의)
  const [dynamicCategories, setDynamicCategories] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  
  // 메타데이터 동기화 상태
  const [isSyncingMetadata, setIsSyncingMetadata] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ total: number; missing: number; processed: number } | null>(null);
  const [syncStatus, setSyncStatus] = useState<string>('');
  
  // 블로그 이미지 분석 상태
  const [isAnalyzingBlogImages, setIsAnalyzingBlogImages] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');
  
  // 폴더 목록 상태 (Storage에서 직접 가져오기)
  const [availableFolders, setAvailableFolders] = useState<string[]>([]);
  
  // Storage에서 실제 폴더 목록 가져오기
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const response = await fetch('/api/admin/folders-list');
        const data = await response.json();
        
        if (response.ok && data.folders) {
          console.log(`✅ 폴더 목록 로드 성공: ${data.folders.length}개`);
          setAvailableFolders(data.folders);
        } else {
          console.error('❌ 폴더 목록 로드 실패:', data.error);
          // 실패 시 현재 이미지에서 폴더 경로 추출 (대안)
          const folders = new Set<string>();
          images.forEach(img => {
            if (img.folder_path && img.folder_path !== '') {
              folders.add(img.folder_path);
            }
          });
          setAvailableFolders(Array.from(folders).sort());
        }
      } catch (error) {
        console.error('❌ 폴더 목록 로드 오류:', error);
        // 오류 시 현재 이미지에서 폴더 경로 추출 (대안)
        const folders = new Set<string>();
        images.forEach(img => {
          if (img.folder_path && img.folder_path !== '') {
            folders.add(img.folder_path);
          }
        });
        setAvailableFolders(Array.from(folders).sort());
      }
    };
    
    fetchFolders();
  }, []); // 컴포넌트 마운트 시 한 번만 실행
  
  // 가상화를 위한 상태
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);

  // 필터링된 이미지 계산 (성능 최적화)
  const filteredImages = useMemo(() => {
    let filtered = images;
    
    // 검색 필터 (성능 최적화)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const searchTerms = query.split(' ').filter(term => term.length > 0);
      
      filtered = filtered.filter(img => {
        const searchableText = [
          img.name,
          img.alt_text || '',
          img.title || '',
          img.description || '',
          img.keywords?.join(' ') || ''
        ].join(' ').toLowerCase();
        
        return searchTerms.every(term => searchableText.includes(term));
      });
    }
    
    // 폴더 필터
    if (folderFilter !== 'all') {
      console.log('🔍 폴더 필터 적용:', folderFilter);
      console.log('🔍 필터링 전 이미지 수:', filtered.length);
      
      if (folderFilter === 'root') {
        // 루트 폴더 (폴더 경로가 없는 이미지들)
        filtered = filtered.filter(img => !img.folder_path || img.folder_path === '');
        console.log('🔍 루트 폴더 필터링 후:', filtered.length);
      } else {
        // 특정 폴더
        const beforeCount = filtered.length;
        filtered = filtered.filter(img => {
          // folder_path가 문자열인지 확인하고, 정확히 일치하는지 또는 하위 경로인지 확인
          const imgFolderPath = String(img.folder_path || '').trim();
          const filterPath = String(folderFilter || '').trim();
          
          // 빈 값 처리
          if (!imgFolderPath || !filterPath) {
            return false;
          }
          
          let matches = false;
          if (includeChildren) {
            // 하위 폴더 포함: 정확히 일치하거나 하위 경로로 시작하는 경우
            // 예: filterPath='originals/blog/2025-09'
            // - 'originals/blog/2025-09' → 정확히 일치 ✓
            // - 'originals/blog/2025-09/subfolder' → 하위 경로로 시작 ✓
            matches = imgFolderPath === filterPath || 
                     (imgFolderPath.startsWith(filterPath + '/') && imgFolderPath.length > filterPath.length);
          } else {
            // 하위 폴더 제외: 정확히 일치하는 경우만
            matches = imgFolderPath === filterPath;
          }
          
          // 디버깅: 불일치 시 상세 로그 (처음 5개만)
          if (!matches && imgFolderPath && filterPath) {
            const logKey = `${imgFolderPath}::${filterPath}::${includeChildren}`;
            const filterDebugLog = (window as any)._filterDebugLog as Set<string> | undefined;
            if (!filterDebugLog || !filterDebugLog.has(logKey)) {
              if (!filterDebugLog) (window as any)._filterDebugLog = new Set<string>();
              const logSet = (window as any)._filterDebugLog as Set<string>;
              if (logSet.size < 5) {
                logSet.add(logKey);
                console.log('🔍 폴더 불일치:', {
                  imgFolderPath,
                  filterPath,
                  includeChildren,
                  imgName: img.name
                });
              }
            }
          }
          return matches;
        });
        console.log('🔍 특정 폴더 필터링 후:', filtered.length, '(이전:', beforeCount, ')');
      }
    }
    
    // 타입 필터
    switch (filterType) {
      case 'featured':
        filtered = filtered.filter(img => img.is_featured);
        break;
      case 'unused':
        filtered = filtered.filter(img => !img.usage_count || img.usage_count === 0);
        break;
      case 'duplicates':
        // 중복 이미지 필터링 (같은 이름을 가진 이미지들)
        // ✅ 개선: 파일명 기준으로 정확하게 중복 감지 (폴더 경로 무시)
        const nameCounts = filtered.reduce((acc, img) => {
          // 파일명만 추출 (폴더 경로 제외)
          const fileName = img.name || img.url?.split('/').pop() || '';
          acc[fileName] = (acc[fileName] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        // ✅ 개선: 로그 추가로 디버깅 용이
        console.log('🔍 중복 이미지 필터링:', Object.keys(nameCounts).filter(name => nameCounts[name] > 1).length, '개 중복 그룹');
        
        filtered = filtered.filter(img => {
          const fileName = img.name || img.url?.split('/').pop() || '';
          return nameCounts[fileName] > 1;
        });
        break;
      case 'category':
        if (selectedCategoryFilter !== null) {
          filtered = filtered.filter(img => {
            // 카테고리가 숫자 ID인 경우
            if (typeof img.category === 'number') {
              return img.category === selectedCategoryFilter;
            }
            // 카테고리가 문자열인 경우 (하위 호환성)
            const category = dynamicCategories.find(cat => cat.id === selectedCategoryFilter);
            return category && img.category === category.name;
          });
        }
        break;
      case 'all':
      default:
        // 전체 이미지 표시
        break;
    }
    
    // 정렬
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'size':
          aValue = a.size || 0;
          bValue = b.size || 0;
          break;
        case 'usage_count':
          aValue = a.usage_count || 0;
          bValue = b.usage_count || 0;
          break;
        case 'folder_path':
          // 폴더 경로 정렬 (루트 폴더가 먼저, 그 다음 알파벳 순)
          aValue = a.folder_path || '';
          bValue = b.folder_path || '';
          // 루트 폴더(빈 문자열)를 가장 앞에 배치
          if (aValue === '' && bValue !== '') return sortOrder === 'asc' ? -1 : 1;
          if (aValue !== '' && bValue === '') return sortOrder === 'asc' ? 1 : -1;
          if (aValue === '' && bValue === '') return 0;
          const comparison = aValue.localeCompare(bValue);
          return sortOrder === 'asc' ? comparison : -comparison;
        case 'created_at':
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return filtered;
  }, [images, searchQuery, filterType, folderFilter, selectedCategoryFilter, dynamicCategories, sortBy, sortOrder]);
  
  // 카테고리 관리 UI 상태
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryMoveModalOpen, setCategoryMoveModalOpen] = useState(false);
  
  // 폴더 관리 UI 상태
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  // 이미지 추가 모달
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeAddTab, setActiveAddTab] = useState<'upload' | 'url'>('upload');
  const [pending, setPending] = useState(false);
  const [addUrl, setAddUrl] = useState('');
  
  // 동적 카테고리 로드 함수
  const loadDynamicCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      const data = await response.json();
      
      if (response.ok) {
        setDynamicCategories(data.categories || []);
      } else {
        console.error('❌ 카테고리 로드 실패:', data.error);
        // 실패 시 기본 카테고리 사용
        setDynamicCategories([
          { id: 1, name: '골프' },
          { id: 2, name: '장비' },
          { id: 3, name: '코스' },
          { id: 4, name: '이벤트' },
          { id: 5, name: '기타' }
        ]);
      }
    } catch (error) {
      console.error('❌ 카테고리 로드 오류:', error);
      // 오류 시 기본 카테고리 사용
      setDynamicCategories([
        { id: 1, name: '골프' },
        { id: 2, name: '장비' },
        { id: 3, name: '코스' },
        { id: 4, name: '이벤트' },
        { id: 5, name: '기타' }
      ]);
    }
  };
  
  // 편집 상태
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    alt_text: string;
    keywords: string | string[];
    title: string;
    description: string;
    category: string | number | undefined | null;
    filename: string;
  }>({
    alt_text: '',
    keywords: '',
    title: '',
    description: '',
    category: '',
    filename: ''
  });

  // 확대 모달 상태
  const [selectedImageForZoom, setSelectedImageForZoom] = useState<ImageMetadata | null>(null);
  const [navigateSelectedOnly, setNavigateSelectedOnly] = useState(false);
  const [metadataAnimation, setMetadataAnimation] = useState(false);
  const [thumbnailSelectMode, setThumbnailSelectMode] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const thumbnailStripRef = useRef<HTMLDivElement>(null);

  // 이미지의 고유 식별자 생성 (id가 있으면 사용, 없으면 name만 사용)
  const getImageUniqueId = (image: ImageMetadata) => {
    return image.id || image.name;
  };

  // 썸네일을 가운데로 스크롤하는 함수
  const scrollThumbnailToCenter = (imageName: string) => {
    if (!thumbnailStripRef.current) return;
    
    const imagesToShow = navigateSelectedOnly 
      ? filteredImages.filter(img => selectedImages.has(img.name))
      : filteredImages;
    
    const targetIndex = imagesToShow.findIndex(img => img.name === imageName);
    if (targetIndex === -1) return;
    
    const thumbnailWidth = 64; // w-16 = 64px
    const gap = 8; // gap-2 = 8px
    const containerWidth = thumbnailStripRef.current.clientWidth;
    const thumbnailWithGap = thumbnailWidth + gap;
    
    // 가운데 위치 계산
    const centerPosition = (targetIndex * thumbnailWithGap) - (containerWidth / 2) + (thumbnailWidth / 2);
    
    thumbnailStripRef.current.scrollTo({
      left: Math.max(0, centerPosition),
      behavior: 'smooth'
    });
  };

  // 이미지 preloading 함수
  const preloadImage = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
  };

  // 지연 로딩을 위한 Intersection Observer
  const [imageObserver, setImageObserver] = useState<IntersectionObserver | null>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
              observer.unobserve(img);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );
    
    setImageObserver(observer);
    
    return () => observer.disconnect();
  }, []);

  // 이미지 지연 로딩 컴포넌트
  const LazyImage = ({ src, alt, className, ...props }: any) => {
    const imgRef = useRef<HTMLImageElement>(null);
    
    useEffect(() => {
      if (imgRef.current && imageObserver) {
        imageObserver.observe(imgRef.current);
      }
    }, [imageObserver]);
    
    return (
      <img
        ref={imgRef}
        data-src={src}
        alt={alt}
        className={className}
        {...props}
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
        }}
      />
    );
  };

  // 확대보기 내 좌우 탐색 핸들러
  const showAdjacentImage = async (direction: 'prev' | 'next') => {
    if (!selectedImageForZoom || isNavigating) return;
    
    setIsNavigating(true);
    
    // 탐색할 이미지 배열 결정
    const imagesToNavigate = navigateSelectedOnly 
      ? filteredImages.filter(img => selectedImages.has(getImageUniqueId(img)))
      : filteredImages;
    
    if (imagesToNavigate.length === 0) {
      setIsNavigating(false);
      return;
    }
    
    const currentIndex = imagesToNavigate.findIndex(img => img.name === selectedImageForZoom.name);
    if (currentIndex === -1) {
      setIsNavigating(false);
      return;
    }
    
    const nextIndex = direction === 'next'
      ? (currentIndex + 1) % imagesToNavigate.length
      : (currentIndex - 1 + imagesToNavigate.length) % imagesToNavigate.length;
    
    const nextImage = imagesToNavigate[nextIndex];
    
    try {
      // 다음 이미지를 미리 로드
      await preloadImage(nextImage.url);
      
      // 즉시 이미지 변경
      setSelectedImageForZoom(nextImage);
      scrollThumbnailToCenter(nextImage.name);
    } catch (error) {
      console.error('이미지 preload 실패:', error);
      // preload 실패해도 이미지 변경은 진행
      setSelectedImageForZoom(nextImage);
      scrollThumbnailToCenter(nextImage.name);
    } finally {
      setIsNavigating(false);
    }
  };

  // 키보드 단축키 (←/→/Esc)
  useEffect(() => {
    if (!selectedImageForZoom) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        showAdjacentImage('prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        showAdjacentImage('next');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedImageForZoom(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedImageForZoom, filteredImages]);

  // 모달이 열릴 때 현재 이미지의 썸네일을 가운데로 스크롤
  useEffect(() => {
    if (selectedImageForZoom && thumbnailStripRef.current) {
      // 모달이 완전히 렌더링된 후 스크롤
      setTimeout(() => {
        scrollThumbnailToCenter(selectedImageForZoom.name);
      }, 100);
    }
  }, [selectedImageForZoom]);

  // 일괄 편집/삭제 상태
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkEditForm, setBulkEditForm] = useState({
    alt_text: '',
    keywords: '', // 쉼표 구분, 추가 모드
    replaceAlt: false,
    appendKeywords: true,
    removeKeywordsOnly: false,
    category: '',
  });
  const [isBulkWorking, setIsBulkWorking] = useState(false);
  const [seoPreview, setSeoPreview] = useState<any[] | null>(null);

  // 이미지 로드
  const fetchImages = async (page = 1, reset = false) => {
    try {
      if (reset || page === 1) {
        setIsLoading(true);
        // 새로고침 시 필터를 "전체"로 초기화
        if (reset) {
          setFilterType('all');
          setSearchQuery('');
        }
      } else {
        setIsLoadingMore(true);
      }
      
      const offset = (page - 1) * imagesPerPage;
      const prefix = folderFilter === 'all' ? '' : (folderFilter === 'root' ? '' : encodeURIComponent(folderFilter));
      const response = await fetch(`/api/admin/all-images?limit=${imagesPerPage}&offset=${offset}&prefix=${prefix}&includeChildren=${includeChildren}`);
      const data = await response.json();
      
      if (response.ok) {
        const list = data.images || [];
        
        // 더 이상 로드할 이미지가 없는지 확인
        if (list.length < imagesPerPage) {
          setHasMoreImages(false);
        } else {
          setHasMoreImages(true);
        }
        
        // 메타데이터는 이미 API에서 포함되어 있으므로 별도 호출 불필요
        const imagesWithMetadata = list.map((img: any) => {
          // folder_path는 API에서 제공되므로 그대로 사용
          // name에 '/'가 포함된 경우에만 추론 (API가 제공하지 않은 경우만)
          const inferredFolder = img.folder_path 
            ? img.folder_path
            : (typeof img.name === 'string' && img.name.includes('/')
              ? img.name.substring(0, img.name.lastIndexOf('/'))
              : '');
          return {
            ...img,
            id: img.id || `temp-${Date.now()}-${Math.random()}`,
            alt_text: img.alt_text || '',
            keywords: img.keywords || [],
            title: img.title || '',
            description: img.description || '',
            category: img.category || '',
            folder_path: inferredFolder, // API에서 제공된 folder_path 우선 사용
            is_featured: img.is_featured || false,
            usage_count: img.usage_count || 0,
            used_in_posts: img.used_in_posts || [],
            // 메타데이터 존재 여부 (API에서 제공되는 경우)
            has_metadata: img.has_metadata !== false
          };
        });
        
        // 메타데이터가 비어 있는 파일(예: derived/2025-10-14/image_...)을 발견하면 즉시 서버에 upsert 요청
        try {
          const missingMetaPaths = imagesWithMetadata
            .filter((img: any) => !img.folder_path || img.folder_path === '')
            .map((img: any) => img.name)
            .filter(Boolean);
          if (missingMetaPaths.length > 0) {
            await fetch('/api/admin/image-metadata-batch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paths: missingMetaPaths })
            });
          }
        } catch (e) {
          console.warn('메타데이터 보정 실패:', e);
        }

        if (reset || page === 1) {
          setImages(imagesWithMetadata);
          setCurrentPage(1);
        } else {
          setImages(prev => {
            // 🔧 중복 제거 로직 추가: 같은 name과 url을 가진 이미지는 하나만 유지
            const existingIds = new Set(prev.map(img => `${img.name}-${img.url}`));
            const newImages = imagesWithMetadata.filter(img => 
              !existingIds.has(`${img.name}-${img.url}`)
            );
            
            // 🔍 중복 제거 디버깅 로그
            if (newImages.length !== imagesWithMetadata.length) {
              const removedCount = imagesWithMetadata.length - newImages.length;
              // 중복 제거 완료
            }
            
            return [...prev, ...newImages];
          });
          setCurrentPage(page);
        }
        setTotalCount(data.total || 0);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('❌ 이미지 로드 에러:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // 무한 스크롤 로드 (성능 최적화)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const onScroll = () => {
      if (isLoading || isLoadingMore || !hasMoreImages) return;
      
      // 스크롤 이벤트 디바운싱
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const remaining = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
        if (remaining < 300) { // 더 일찍 로드하도록 조정
          setCurrentPage(prev => prev + 1);
        }
      }, 100);
    };
    
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timeoutId);
    };
  }, [isLoading, isLoadingMore, hasMoreImages]);

  // currentPage 변경 시 이미지 로드
  useEffect(() => {
    if (currentPage > 1) {
      fetchImages(currentPage);
    }
  }, [currentPage]);

  // 성능 모니터링
  const [performanceMetrics, setPerformanceMetrics] = useState({
    loadTime: 0,
    imageCount: 0,
    cacheHitRate: 0
  });

  // 초기 로드 (성능 최적화)
  useEffect(() => {
    const startTime = performance.now();
    
    const initializeGallery = async () => {
      try {
        // 병렬로 데이터 로드
        await Promise.all([
          fetchImages(1, true),
          loadDynamicCategories(),
          fetch('/api/admin/image-categories').then(res => res.json()).then(data => setCategories(data.categories || [])).catch(() => {}),
          fetch('/api/admin/image-tags').then(res => res.json()).then(data => setTags(data.tags || [])).catch(() => {})
        ]);
        
        const endTime = performance.now();
        setPerformanceMetrics(prev => ({
          ...prev,
          loadTime: Math.round(endTime - startTime),
          imageCount: images.length
        }));
        
        console.log(`🚀 갤러리 초기화 완료: ${Math.round(endTime - startTime)}ms`);
      } catch (error) {
        console.error('❌ 갤러리 초기화 오류:', error);
      }
    };
    
    initializeGallery();
  }, []);
  
  // 폴더 필터 또는 includeChildren 변경 시 이미지 재로드
  // 주의: 드롭다운과 체크박스의 onChange에서 이미 fetchImages를 호출하므로,
  // useEffect에서는 제거 (중복 호출 방지)
  // 필요 시 프로그래밍 방식으로 변경할 때만 여기서 처리

  // 이미지 선택/해제
  const toggleImageSelection = (image: ImageMetadata) => {
    const uniqueId = getImageUniqueId(image);
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(uniqueId)) {
        newSet.delete(uniqueId);
      } else {
        newSet.add(uniqueId);
      }
      return newSet;
    });
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedImages.size === filteredImages.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(filteredImages.map(img => getImageUniqueId(img))));
    }
  };

  // 편집 시작
  const startEditing = (image: ImageMetadata) => {
    setEditingImage(image.name);
    
    // 🔧 category 안전하게 처리
    let categoryValue = '';
    if (image.category !== null && image.category !== undefined) {
      if (typeof image.category === 'number') {
        // 동적 카테고리에서 ID로 이름 찾기
        const category = dynamicCategories.find(cat => cat.id === image.category);
        categoryValue = category ? category.name : '';
      } else {
        categoryValue = String(image.category);
      }
    }
    
    setEditForm({
      alt_text: image.alt_text || '',
      keywords: image.keywords?.join(', ') || '',
      title: image.title || '',
      description: image.description || '',
      category: categoryValue,
      filename: image.name || ''
    });
  };

  // 편집 저장
  const saveEdit = async () => {
    if (!editingImage) return;
    
    // ✅ 카테고리 필수 검사 제거 (카테고리 체크박스 제거됨)
    // 카테고리 정보는 키워드에 포함되어 있음
    
    // ✅ 글자 수 제한 검사 완화 (이미 모달에서 검증하므로 여기서는 경고만)
    const validationErrors = [];
    if (editForm.alt_text && editForm.alt_text.length > 200) {
      validationErrors.push(`ALT 텍스트가 너무 깁니다 (${editForm.alt_text.length}자, 200자 이하 권장)`);
    }
    if (editForm.keywords && editForm.keywords.length > 200) {
      validationErrors.push(`키워드가 너무 깁니다 (${editForm.keywords.length}자, 200자 이하 권장)`);
    }
    if (editForm.title && editForm.title.length > 100) {
      validationErrors.push(`제목이 너무 깁니다 (${editForm.title.length}자, 100자 이하 권장)`);
    }
    if (editForm.description && editForm.description.length > 200) {
      validationErrors.push(`설명이 너무 깁니다 (${editForm.description.length}자, 200자 이하 권장)`);
    }
    
    // 경고만 표시하고 저장은 계속 진행
    if (validationErrors.length > 0) {
      const shouldContinue = confirm(`글자 수 제한 경고:\n\n${validationErrors.join('\n')}\n\n계속 저장하시겠습니까?`);
      if (!shouldContinue) {
        return;
      }
    }
    
    try {
      // 메타데이터 저장 시작
      // 🔧 keywords 안전하게 처리
      const keywords: string[] = (editForm.keywords as any) 
        ? (typeof editForm.keywords === 'string' 
            ? editForm.keywords.split(',').map(k => String(k || '').trim()).filter(k => k)
            : Array.isArray(editForm.keywords) 
              ? editForm.keywords.map(k => String(k || '').trim()).filter(k => k)
              : [])
        : [];
      
      const image = images.find(img => img.name === editingImage);
      if (!image) {
        alert('이미지 정보를 찾을 수 없습니다.');
        return;
      }
      
      console.log('🔍 편집할 이미지 정보:', {
        editingImage,
        foundImage: image,
        imageId: image.id,
        imageName: image.name
      });
      
      // 편집 중인 이미지 정보 확인

      // 파일명이 변경된 경우 먼저 파일명 변경 처리
      let updatedImageUrl = image.url;  // 기본값은 원본 URL
      let updatedImageName = image.name;  // 기본값은 원본 파일명
      let currentImage = image;  // 현재 이미지 객체 (파일명 변경 시 업데이트됨)
      
      if (editForm.filename && editForm.filename !== image.name) {
        // 파일명 변경 처리
        
        // imageId 검증
        if (!image.id || image.id.startsWith('temp-')) {
          alert('이미지 ID가 유효하지 않습니다. 페이지를 새로고침 후 다시 시도해주세요.');
          console.error('❌ 유효하지 않은 imageId:', image.id);
          return;
        }
        
        console.log('📝 파일명 변경 요청:', {
          imageId: image.id,
          newFileName: editForm.filename,
          currentFileName: image.name
        });
        
        const renameResponse = await fetch('/api/admin/rename-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageId: image.id,  // API가 기대하는 파라미터 (있으면 사용)
            newFileName: editForm.filename,
            currentFileName: image.name,
            imageUrl: image.url  // imageId가 없을 경우 대체 조회용
          })
        });
        
        if (!renameResponse.ok) {
          const errorData = await renameResponse.json();
          const shouldRefresh = confirm(`파일명 변경에 실패했습니다.\n오류: ${errorData.error || '알 수 없는 오류'}\n\n갤러리를 새로고침하시겠습니까?`);
          if (shouldRefresh) {
            window.location.reload();
          }
          return;
        }
        
        const renameResult = await renameResponse.json();
        // API 응답 형식: { success: true, data: { newFileName, newUrl } }
        const finalFileName = renameResult.data?.newFileName || renameResult.newName || editForm.filename;
        const newUrl = renameResult.data?.newUrl || renameResult.newUrl;
        
        console.log('✅ 파일명 변경 완료:', {
          oldName: image.name,
          newName: finalFileName,
          newUrl: newUrl
        });
        
        // 파일명 변경 후 메타데이터 저장에 사용할 변수 업데이트
        updatedImageUrl = newUrl || image.url;
        updatedImageName = finalFileName;
        
        // 이미지 객체도 즉시 업데이트 (저장 시 참조용)
        currentImage = {
          ...image,
          name: finalFileName,
          url: newUrl || image.url
        };
        
        // 파일명 변경 후 로컬 상태 즉시 업데이트
        setImages(prev => prev.map(img => 
          img.name === image.name 
            ? { 
                ...img, 
                name: finalFileName,
                url: newUrl || img.url
              }
            : img
        ));
        
        // 편집 중인 이미지 정보도 업데이트
        setEditingImage(finalFileName);
      }

      // 카테고리 처리: categories 배열이 있으면 사용, 없으면 category 문자열 사용
      const categoryValue = typeof editForm.category === 'string' ? editForm.category : String(editForm.category || '');
      const categoriesArray = (editForm as any).categories || 
        (categoryValue ? categoryValue.split(',').map((c: string) => c.trim()).filter((c: string) => c) : []);
      const categoryString = categoriesArray.length > 0 ? categoriesArray.join(',') : categoryValue;
      
      // ✅ 카테고리를 키워드에 포함 (중복 제거)
      const currentKeywordsList = keywords;
      const allKeywordsList = Array.from(new Set([...currentKeywordsList, ...categoriesArray]));
      const finalKeywords = allKeywordsList;
      
      console.log('💾 저장 시 키워드 업데이트 (saveEdit):', {
        categories: categoriesArray,
        previousKeywords: currentKeywordsList,
        updatedKeywords: allKeywordsList,
        finalKeywords: finalKeywords
      });
      
      // ✅ 제목이 파일명과 같은 경우 빈 문자열로 처리 (파일명이 제목으로 잘못 저장되는 것 방지)
      let titleValue = editForm.title || '';
      const filenameWithoutExt = updatedImageName?.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
      const titleWithoutExt = titleValue.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
      
      if (titleValue === updatedImageName || titleValue === image.name || 
          titleWithoutExt === filenameWithoutExt) {
        console.warn('⚠️ 제목이 파일명과 동일하여 빈 문자열로 처리:', titleValue);
        titleValue = '';
      }
      
      // ✅ 메타데이터가 비어있는지 확인 (파일명 변경 후 메타데이터가 사라지는 문제 방지)
      if (!editForm.alt_text && finalKeywords.length === 0 && !titleValue && !editForm.description) {
        console.warn('⚠️ 메타데이터가 모두 비어있습니다. 저장을 취소합니다.');
        alert('메타데이터가 비어있습니다. ALT 텍스트, 키워드, 제목, 설명 중 최소 하나는 입력해주세요.');
        return;
      }
      
      // 파일명 정규화 함수 (중복 확장자 제거)
      const normalizeFileName = (fileName: string) => {
        if (!fileName) return '';
        return fileName.replace(/(\.(png|jpg|jpeg|gif|webp))\1+$/i, '$1');
      };
      
      // 저장 시 파일명 정규화 (중복 확장자 제거)
      const normalizedFileName = normalizeFileName(updatedImageName);
      
      const requestData = {
        imageName: updatedImageName,  // 파일명 변경 시 업데이트된 파일명 사용
        imageUrl: updatedImageUrl,  // 파일명 변경 시 업데이트된 URL 사용
        file_name: normalizedFileName,  // ✅ 정규화된 파일명 사용 (중복 확장자 제거)
        alt_text: editForm.alt_text || '',
        keywords: finalKeywords.length > 0 ? finalKeywords : [],
        title: titleValue,  // 파일명과 같으면 빈 문자열
        description: editForm.description || '',
        category: categoryString,  // 하위 호환성: 문자열로 전송
        categories: categoriesArray  // 다중 선택: 배열로 전송
      };
      
      console.log('📤 저장 요청 데이터:', requestData);
      
      const response = await fetch('/api/admin/image-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      
      console.log('📡 저장 API 응답 상태:', response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ 저장 API 응답 데이터:', responseData);
        // 로컬 상태 업데이트 (파일명 변경 시 URL도 함께 업데이트)
        setImages(prev => prev.map(img => {
          // 파일명 변경 후에는 currentImage를 기준으로 비교
          const matchKey = currentImage.id ? img.id : (currentImage.url ? img.url : img.name);
          const currentKey = currentImage.id ? currentImage.id : (currentImage.url ? currentImage.url : currentImage.name);
          
          if (matchKey !== currentKey) return img as ImageMetadata;
          
          const updated: ImageMetadata = {
            ...img,
            alt_text: editForm.alt_text,
            title: editForm.title,
            description: editForm.description,
            category: editForm.category as any,
            keywords,
            name: updatedImageName,  // 업데이트된 파일명 사용
            url: updatedImageUrl  // 업데이트된 URL 사용
          };
          return updated;
        }));
        setEditingImage(null);
        alert('메타데이터가 저장되었습니다!');
        console.log('✅ 메타데이터 저장 완료');
        
        // 갤러리 자동 새로고침
        console.log('🔄 갤러리 새로고침 시작...');
        setTimeout(() => {
          fetchImages(1, true);
        }, 500);
        
        // 저장된 데이터 확인을 위한 추가 로그
        setTimeout(() => {
          console.log('🔍 저장 후 데이터 확인:', {
            editingImage: editingImage,
            savedData: {
              alt_text: editForm.alt_text,
              title: editForm.title,
              description: editForm.description,
              category: editForm.category
            }
          });
        }, 1000);
      } else {
        const errorData = await response.json();
        console.error('❌ 저장 API 오류 응답:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData
        });
        // 더 구체적인 오류 메시지 표시
        let errorMessage = `저장에 실패했습니다.\n상태: ${response.status}\n`;
        
        if (errorData.details && Array.isArray(errorData.details)) {
          errorMessage += `오류 내용:\n${errorData.details.join('\n')}`;
        } else if (errorData.error) {
          errorMessage += `오류: ${errorData.error}`;
        } else if (errorData.message) {
          errorMessage += `오류: ${errorData.message}`;
        } else {
          errorMessage += '알 수 없는 오류가 발생했습니다.';
        }
        
        alert(errorMessage);
      }
    } catch (error) {
      console.error('❌ 메타데이터 저장 에러:', error);
      alert(`저장에 실패했습니다.\n오류: ${error.message}`);
    }
  };

  // 편집 취소
  const cancelEdit = () => {
    setEditingImage(null);
    setEditForm({
      alt_text: '',
      keywords: '',
      title: '',
      description: '',
      category: '',
      filename: ''
    });
  };

  // 일괄 편집 실행
  const handleBulkEdit = async () => {
    if (selectedImages.size === 0) return;
    setIsBulkWorking(true);
    try {
      const names = Array.from(selectedImages);
      const keywordList = String(bulkEditForm.keywords || '')
        .split(',')
        .map(k => String(k).trim())
        .filter(Boolean);

      for (const name of names) {
        const target = images.find(i => i.name === name);
        const updatedAlt = bulkEditForm.replaceAlt
          ? bulkEditForm.alt_text
          : (bulkEditForm.alt_text ? (target?.alt_text ? `${target?.alt_text} ${bulkEditForm.alt_text}` : bulkEditForm.alt_text) : (target?.alt_text || ''));

        const updatedKeywords = (() => {
          const current = target?.keywords || [];
          if (bulkEditForm.removeKeywordsOnly) {
            if (keywordList.length === 0) return current;
            return current.filter(k => !keywordList.includes(k));
          }
          if (keywordList.length === 0) return current;
          if (bulkEditForm.appendKeywords) {
            const merged = Array.from(new Set([...current, ...keywordList]));
            return merged;
          }
          return keywordList;
        })();

        await fetch('/api/admin/image-metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageName: name,
            alt_text: updatedAlt,
            keywords: updatedKeywords,
            category: bulkEditForm.category || (target?.category ?? ''),
          })
        });
      }

      // 로컬 상태 업데이트
      setImages(prev => prev.map(img => {
        if (!selectedImages.has(getImageUniqueId(img))) return img;
        const newAlt = bulkEditForm.replaceAlt
          ? bulkEditForm.alt_text || img.alt_text || ''
          : (bulkEditForm.alt_text ? `${img.alt_text ? img.alt_text + ' ' : ''}${bulkEditForm.alt_text}` : (img.alt_text || ''));

        const newKeywords = (() => {
          const current = img.keywords || [];
          if (bulkEditForm.removeKeywordsOnly) {
            if (keywordList.length === 0) return current;
            return current.filter(k => !keywordList.includes(k));
          }
          if (keywordList.length === 0) return current;
          if (bulkEditForm.appendKeywords) return Array.from(new Set([...(current), ...keywordList]));
          return keywordList;
        })();

        const newCategory = bulkEditForm.category ? bulkEditForm.category : (img.category || '');

        return { ...img, alt_text: newAlt, keywords: newKeywords, category: newCategory };
      }));

      setShowBulkEdit(false);
      setBulkEditForm({ alt_text: '', keywords: '', replaceAlt: false, appendKeywords: true, removeKeywordsOnly: false, category: '' });
      alert('일괄 편집이 완료되었습니다!');
    } catch (e) {
      console.error('❌ 일괄 편집 오류:', e);
      alert('일괄 편집에 실패했습니다.');
    } finally {
      setIsBulkWorking(false);
    }
  };

  // 일괄 복제 실행
  const handleBulkDuplicate = async () => {
    if (selectedImages.size === 0) {
      alert('복제할 이미지를 선택해주세요.');
      return;
    }
    
    setIsBulkWorking(true);
    
    try {
      const selectedIds = Array.from(selectedImages);
      console.log('📋 일괄 복제 시작:', selectedIds.length, '개');
      
      // 선택된 이미지들의 정보 수집
      const imagesToDuplicate = selectedIds.map(id => {
        const image = images.find(img => getImageUniqueId(img) === id);
        return image;
      }).filter(Boolean);
      
      console.log('📋 복제할 이미지들:', imagesToDuplicate);
      
      // 일괄 복제 API 호출
      const response = await fetch('/api/admin/duplicate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          images: imagesToDuplicate.map(img => ({
            name: img.name,
            url: img.url,
            alt_text: img.alt_text || '',
            title: img.title || '',
            description: img.description || '',
            keywords: img.keywords || [],
            category: img.category || ''
          }))
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.details || '일괄 복제에 실패했습니다.';
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('✅ 일괄 복제 성공:', result);
      
      // 선택 해제
      setSelectedImages(new Set());
      
      // 갤러리 새로고침
      setTimeout(() => {
        fetchImages(1, true);
      }, 500);
      
      alert(`일괄 복제 완료: ${result.duplicatedCount}개 이미지가 복제되었습니다.`);
      
    } catch (error) {
      console.error('❌ 일괄 복제 오류:', error);
      alert(`일괄 복제에 실패했습니다: ${error.message}`);
    } finally {
      setIsBulkWorking(false);
    }
  };

  // 일괄 삭제 실행
  // 개별 이미지 삭제 핸들러
  const handleDeleteImage = async (imageName: string) => {
    try {
      console.log('🗑️ 삭제 시도:', imageName);
      
      const response = await fetch('/api/admin/delete-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageName: imageName })
      });

      if (response.ok) {
        let result;
        try {
          result = await response.json();
        } catch (parseError) {
          console.warn('⚠️ JSON 파싱 실패, 텍스트로 처리:', parseError);
          result = { success: true, message: '이미지가 삭제되었습니다.' };
        }
        
        // 삭제된 이미지를 상태에서 제거
        setImages(prev => prev.filter(img => img.name !== imageName));
        alert('이미지가 삭제되었습니다.');
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.error('❌ 에러 응답 JSON 파싱 실패:', parseError);
          errorData = { error: `서버 오류 (${response.status})` };
        }
        const errorMessage = errorData.error || errorData.details || '알 수 없는 오류';
        alert(`삭제 실패: ${errorMessage}`);
      }
    } catch (error) {
      console.error('이미지 삭제 오류:', error);
      alert('이미지 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedImages.size === 0) return;
    setIsBulkWorking(true);
    
    try {
      const selectedIds = Array.from(selectedImages);
      console.log('🗑️ 일괄 삭제 시작:', selectedIds.length, '개');
      console.log('🔍 선택된 ID들:', selectedIds);
      
      // 선택된 ID에서 실제 파일명 추출 (폴더 경로 포함)
      const names = selectedIds.map(id => {
        const image = images.find(img => getImageUniqueId(img) === id);
        if (image) {
          // 폴더 경로가 있는 경우 전체 경로 사용, 없는 경우 파일명만 사용
          const fullPath = image.folder_path && image.folder_path !== '' 
            ? `${image.folder_path}/${image.name}` 
            : image.name;
          
          console.log('📝 ID 매칭:', { 
            id, 
            actualName: image.name, 
            folderPath: image.folder_path,
            fullPath: fullPath
          });
          return fullPath;
        }
        console.warn('⚠️ 매칭되지 않은 ID:', id);
        return id; // 매칭되지 않으면 ID 그대로 사용
      });
      
      console.log('🗑️ 실제 삭제할 파일명들:', names);
      
      // 일괄 삭제 API 호출 (더 효율적)
      const response = await fetch('/api/admin/delete-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageNames: names })
      });
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.error('❌ 에러 응답 JSON 파싱 실패:', parseError);
          errorData = { error: `서버 오류 (${response.status})` };
        }
        const errorMessage = errorData.error || errorData.details || '일괄 삭제에 실패했습니다.';
        throw new Error(errorMessage);
      }
      
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.warn('⚠️ JSON 파싱 실패, 기본값 사용:', parseError);
        result = { success: true, deletedImages: names };
      }
      console.log('✅ 일괄 삭제 성공:', result);
      
      // 삭제 검증 결과 확인
      const verification = result.deletionVerification;
      if (verification) {
        console.log('🔍 삭제 검증 결과:', verification);
        
        if (!verification.deletionSuccess) {
          console.warn('⚠️ 일부 파일이 삭제되지 않음:', verification.stillExisting);
          alert(`삭제 완료: ${verification.actuallyDeleted}개 삭제됨\n\n⚠️ 삭제되지 않은 파일: ${verification.stillExisting.length}개\n${verification.stillExisting.join(', ')}`);
        } else {
          alert(`일괄 삭제 완료: ${verification.actuallyDeleted}개 이미지가 삭제되었습니다.`);
        }
      } else {
        alert(`일괄 삭제 완료: ${result.deletedImages.length}개 이미지가 삭제되었습니다.`);
      }
      
      // 삭제된 이미지들을 상태에서 제거
      setImages(prev => prev.filter(img => !selectedImages.has(getImageUniqueId(img))));
      
      // 현재 확대된 이미지가 삭제된 경우 모달 닫기
      if (selectedImageForZoom && names.includes(selectedImageForZoom.name)) {
        setSelectedImageForZoom(null);
      }
      
      // 선택 상태 초기화
      setSelectedImages(new Set());
      setShowBulkDeleteConfirm(false);
      
      // 갤러리 새로고침
      setTimeout(() => {
        fetchImages(1, true);
      }, 500);
      
    } catch (error) {
      console.error('❌ 일괄 삭제 오류:', error);
      alert(`일괄 삭제에 실패했습니다: ${error.message}`);
    } finally {
      setIsBulkWorking(false);
    }
  };

  return (
    <div>
      <AdminNav />
      <Head>
        <title>이미지 갤러리 관리 - MAS Golf</title>
      </Head>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">🖼️ 이미지 갤러리 관리</h1>
                <p className="text-sm text-gray-600 mt-1">이미지 메타데이터 관리 및 최적화</p>
              </div>
              <div className="flex items-center space-x-4 relative">
                <Link 
                  href="/admin/blog"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                >
                  📝 블로그 관리로 돌아가기
                </Link>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
                >
                  ➕ 이미지 추가
                </button>
              <button onClick={()=>{
                setCategoryModalOpen(true);
                loadDynamicCategories(); // 카테고리 새로고침
              }} className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm">📂 카테고리 관리</button>
              <button onClick={()=>{
                setFolderModalOpen(true);
              }} className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm">📁 폴더 관리</button>
              <div className="relative">
              <button
                onClick={async () => {
                  if (isSyncingMetadata) return;
                  
                  setIsSyncingMetadata(true);
                  setSyncStatus('누락된 메타데이터 확인 중...');
                  setSyncProgress(null);
                  
                  try {
                    // 1단계: 누락된 메타데이터 확인 (배치 모드)
                    // ✅ 개선: limit을 충분히 크게 설정하여 모든 누락 메타데이터 확인
                    const checkResponse = await fetch('/api/admin/sync-missing-metadata', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ batch: true, limit: 1000 })  // ✅ limit 증가
                    });
                    
                    if (!checkResponse.ok) {
                      throw new Error('메타데이터 확인 실패');
                    }
                    
                    const checkData = await checkResponse.json();
                    const missingCount = checkData.missing || checkData.missing_count || 0;
                    
                    setSyncProgress({
                      total: checkData.total || 0,
                      missing: missingCount,
                      processed: 0
                    });
                    
                    if (missingCount === 0) {
                      setSyncStatus('누락된 메타데이터가 없습니다.');
                      setIsSyncingMetadata(false);
                      alert('모든 이미지에 메타데이터가 있습니다.');
                      return;
                    }
                    
                    // ✅ 개선: 모든 누락 메타데이터 개수 표시
                    const displayMessage = checkData.has_more 
                      ? `누락된 메타데이터 ${missingCount}개가 발견되었습니다.\n\n(현재 ${checkData.display_limit || checkData.images?.length || 0}개 표시, 나머지는 처리 중 표시)\n\nAI를 사용하여 메타데이터를 생성하시겠습니까?\n\n처리 시간이 소요될 수 있습니다.`
                      : `누락된 메타데이터 ${missingCount}개가 발견되었습니다.\n\nAI를 사용하여 메타데이터를 생성하시겠습니까?\n\n처리 시간이 소요될 수 있습니다.`;
                    
                    // 2단계: 사용자 확인
                    const shouldProceed = confirm(displayMessage);
                    
                    if (!shouldProceed) {
                      setIsSyncingMetadata(false);
                      setSyncStatus('');
                      setSyncProgress(null);
                      return;
                    }
                    
                    // 3단계: 메타데이터 생성 및 저장 (한 번에 처리)
                    setSyncStatus(`메타데이터 생성 중... (0/${checkData.missing})`);
                    
                    // 한 번에 처리할 개수 제한 (API 호출 제한 방지)
                    const processLimit = Math.min(50, checkData.missing);
                    
                    const syncResponse = await fetch('/api/admin/sync-missing-metadata', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        batch: false, 
                        limit: processLimit 
                      })
                    });
                    
                    if (!syncResponse.ok) {
                      const errorData = await syncResponse.json();
                      throw new Error(errorData.error || '메타데이터 생성 실패');
                    }
                    
                    const syncData = await syncResponse.json();
                    const processedCount = syncData.processed || 0;
                    
                    setSyncStatus(`동기화 완료: ${processedCount}개 처리`);
                    setSyncProgress(prev => prev ? {
                      ...prev,
                      processed: processedCount
                    } : null);
                    
                    // 갤러리 새로고침
                    await fetchImages(1, true);
                    
                    const remaining = checkData.missing - processedCount;
                    if (remaining > 0) {
                      alert(`메타데이터 동기화 진행!\n\n처리된 이미지: ${processedCount}개\n남은 이미지: ${remaining}개\n\n남은 이미지는 다시 동기화 버튼을 눌러 처리하세요.`);
                    } else {
                      alert(`메타데이터 동기화 완료!\n\n처리된 이미지: ${processedCount}개`);
                    }
                    
                  } catch (error) {
                    console.error('메타데이터 동기화 오류:', error);
                    setSyncStatus('동기화 실패');
                    alert(`메타데이터 동기화 중 오류가 발생했습니다: ${error.message}`);
                  } finally {
                    setIsSyncingMetadata(false);
                    setTimeout(() => {
                      setSyncStatus('');
                      setSyncProgress(null);
                    }, 5000);
                  }
                }}
                disabled={isSyncingMetadata}
                className={`px-4 py-2 rounded-lg text-sm ${
                  isSyncingMetadata
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
                title="Storage에 있는 이미지 중 메타데이터가 없는 이미지에 대해 AI로 메타데이터를 자동 생성합니다."
              >
                {isSyncingMetadata ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    {syncStatus || '동기화 중...'}
                  </span>
                ) : (
                  '🔄 메타데이터 동기화'
                )}
              </button>
              {syncProgress && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
                  <div className="text-sm text-gray-700 mb-2">
                    {syncStatus}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${syncProgress.missing > 0 ? (syncProgress.processed / syncProgress.missing) * 100 : 0}%`
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    전체: {syncProgress.total}개 | 누락: {syncProgress.missing}개 | 처리됨: {syncProgress.processed}개
                  </div>
                </div>
              )}
              </div>
              
              {/* 블로그 이미지 분석 버튼 */}
              <div className="relative">
              <button
                onClick={async () => {
                  if (isAnalyzingBlogImages) return;
                  
                  if (!confirm('모든 블로그 이미지를 분석하시겠습니까?\n\n이 작업은 시간이 소요될 수 있습니다.')) {
                    return;
                  }
                  
                  setIsAnalyzingBlogImages(true);
                  setAnalysisStatus('블로그 이미지 분석 중...');
                  setAnalysisResult(null);
                  
                  try {
                    const response = await fetch('/api/admin/analyze-all-blog-images', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ dryRun: true })
                    });
                    
                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(errorData.error || errorData.details || '분석 실패');
                    }
                    
                    const data = await response.json();
                    setAnalysisResult(data);
                    setAnalysisStatus('분석 완료');
                    
                    // 결과 요약 표시
                    const summary = data.summary || {};
                    const message = `블로그 이미지 분석 완료!\n\n` +
                      `📊 총 블로그 글: ${summary.totalBlogPosts || 0}개\n` +
                      `🖼️ 고유 이미지 URL: ${summary.totalUniqueImageUrls || 0}개\n` +
                      `📦 처리된 이미지: ${summary.totalImagesProcessed || 0}개\n` +
                      `✅ Storage에서 찾음: ${summary.totalImagesFoundInStorage || 0}개\n` +
                      `❌ Storage에서 못 찾음: ${summary.totalImagesNotFoundInStorage || 0}개\n` +
                      `${summary.totalExternalUrls ? `🌐 외부 URL (다른 도메인): ${summary.totalExternalUrls}개\n` : ''}` +
                      `${summary.totalExtractionFailed ? `⚠️ 경로 추출 실패: ${summary.totalExtractionFailed}개\n` : ''}` +
                      `🔄 중복 이미지 그룹: ${summary.duplicateGroupsCount || 0}개\n` +
                      `🔗 연결되지 않은 이미지: ${summary.unlinkedImagesCount || 0}개\n` +
                      `${data.notFoundInStorage && data.notFoundInStorage.length > 0 ? `\n⚠️ Storage에서 못 찾은 이미지: ${data.notFoundInStorage.length}개\n상세 목록은 개발자 콘솔을 확인하세요.` : ''}\n\n` +
                      `상세 결과는 개발자 콘솔을 확인하세요.`;
                    
                    alert(message);
                    console.log('📊 블로그 이미지 분석 결과:', data);
                    
                    // Storage에서 못 찾은 이미지 상세 목록 콘솔 출력
                    if (data.notFoundInStorage && data.notFoundInStorage.length > 0) {
                      console.log('\n❌ Storage에서 못 찾은 이미지 상세 목록:');
                      data.notFoundInStorage.slice(0, 20).forEach((img, index) => {
                        console.log(`\n${index + 1}. ${img.fileName || img.url}`);
                        console.log(`   URL: ${img.url}`);
                        console.log(`   경로: ${img.path || 'N/A'}`);
                        console.log(`   블로그 글: ${img.blogPostTitles?.join(', ') || 'N/A'}`);
                        console.log(`   블로그 ID: ${img.blogPostIds?.join(', ') || 'N/A'}`);
                      });
                      if (data.notFoundInStorage.length > 20) {
                        console.log(`\n... 외 ${data.notFoundInStorage.length - 20}개 더 있음`);
                      }
                    }
                    
                  } catch (error: any) {
                    console.error('블로그 이미지 분석 오류:', error);
                    setAnalysisStatus('분석 실패');
                    alert(`블로그 이미지 분석 중 오류가 발생했습니다: ${error.message}`);
                  } finally {
                    setIsAnalyzingBlogImages(false);
                    setTimeout(() => {
                      setAnalysisStatus('');
                    }, 5000);
                  }
                }}
                disabled={isAnalyzingBlogImages}
                className={`px-4 py-2 rounded-lg text-sm ${
                  isAnalyzingBlogImages
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
                title="모든 블로그 글에서 이미지 URL을 추출하고, Storage에서 실제 파일을 찾으며, 중복 이미지를 감지합니다."
              >
                {isAnalyzingBlogImages ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    {analysisStatus || '분석 중...'}
                  </span>
                ) : (
                  '📊 블로그 이미지 분석'
                )}
              </button>
              {analysisResult && (
                <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 max-h-96 overflow-y-auto">
                  <div className="text-sm text-gray-700 mb-2 font-semibold">
                    분석 결과
                  </div>
                  {analysisResult.summary && (
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>블로그 글: {analysisResult.summary.totalBlogPosts}개</div>
                      <div>고유 이미지: {analysisResult.summary.totalUniqueImageUrls}개</div>
                      <div>처리된 이미지: {analysisResult.summary.totalImagesProcessed}개</div>
                      <div>Storage에서 찾음: {analysisResult.summary.totalImagesFoundInStorage}개</div>
                      <div>Storage에서 못 찾음: {analysisResult.summary.totalImagesNotFoundInStorage}개</div>
                      {analysisResult.summary.totalExternalUrls > 0 && (
                        <div className="text-orange-600">외부 URL: {analysisResult.summary.totalExternalUrls}개</div>
                      )}
                      {analysisResult.summary.totalExtractionFailed > 0 && (
                        <div className="text-red-600">경로 추출 실패: {analysisResult.summary.totalExtractionFailed}개</div>
                      )}
                      {analysisResult.notFoundInStorage && analysisResult.notFoundInStorage.length > 0 && (
                        <div className="text-orange-600 font-semibold">
                          ⚠️ Storage에서 못 찾은 이미지: {analysisResult.notFoundInStorage.length}개
                        </div>
                      )}
                      <div>중복 그룹: {analysisResult.summary.duplicateGroupsCount}개</div>
                      <div>연결 안 된 이미지: {analysisResult.summary.unlinkedImagesCount}개</div>
                    </div>
                  )}
                  {analysisResult.notFoundInStorage && analysisResult.notFoundInStorage.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs font-semibold text-orange-600 mb-2">
                        Storage에서 못 찾은 이미지 목록 (상위 10개):
                      </div>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {analysisResult.notFoundInStorage.slice(0, 10).map((img, index) => (
                          <div key={index} className="text-xs text-gray-600 p-1 bg-orange-50 rounded">
                            <div className="font-medium">{img.fileName || img.url}</div>
                            <div className="text-xs text-gray-500 truncate">
                              블로그: {img.blogPostTitles?.slice(0, 1).join(', ') || 'N/A'}
                            </div>
                          </div>
                        ))}
                        {analysisResult.notFoundInStorage.length > 10 && (
                          <div className="text-xs text-gray-500 italic">
                            ... 외 {analysisResult.notFoundInStorage.length - 10}개 더 있음 (콘솔 확인)
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              </div>
              
              {/* 🔄 버전 관리 버튼 비활성화 (다중 버전 기능 임시 중단) */}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 검색 및 필터 */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* 검색 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      // 검색어 변경 시 페이지 초기화 (필터링은 filteredImages에서 처리)
                      setCurrentPage(1);
                    }}
                    placeholder="파일명, ALT 텍스트, 키워드로 검색..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* 필터 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">필터</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">전체</option>
                  <option value="featured">⭐ 대표 이미지</option>
                  <option value="unused">사용되지 않음</option>
                  <option value="duplicates">중복 이미지</option>
                  <option value="category">📂 카테고리별</option>
                </select>
              </div>

              {/* 카테고리 선택 (카테고리별 필터가 선택된 경우에만 표시) */}
              {filterType === 'category' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">카테고리 선택</label>
                  <select
                    value={selectedCategoryFilter || ''}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">카테고리 선택</option>
                    {dynamicCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
              )}
              
              {/* 폴더 필터 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">폴더</label>
                <select
                  value={folderFilter}
                  onChange={(e) => {
                    setFolderFilter(e.target.value);
                    setCurrentPage(1); // 페이지 초기화
                    fetchImages(1, true); // 폴더 변경 시 이미지 다시 로드
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">전체 폴더</option>
                  <option value="root">📁 루트 폴더</option>
                  {availableFolders.map((folder) => (
                    <option key={folder} value={folder}>
                      📁 {folder}
                    </option>
                  ))}
                </select>
                <label className="mt-2 inline-flex items-center space-x-2 text-sm text-gray-700">
                  <input type="checkbox" checked={includeChildren} onChange={(e)=>{ setIncludeChildren(e.target.checked); setCurrentPage(1); fetchImages(1, true); }} />
                  <span>하위 폴더 포함</span>
                </label>
              </div>
              
              {/* 정렬 기준 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">정렬 기준</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="created_at">생성일</option>
                  <option value="name">파일명</option>
                  <option value="size">파일 크기</option>
                  <option value="usage_count">사용 횟수</option>
                  <option value="folder_path">📁 폴더 경로</option>
                </select>
              </div>
              
              {/* 정렬 순서 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">정렬 순서</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="desc">내림차순</option>
                  <option value="asc">오름차순</option>
                </select>
              </div>
            </div>
          </div>

          {/* 선택된 이미지 액션 */}
          {selectedImages.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  {selectedImages.size}개 이미지 선택됨
                </span>
              <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkEdit(true)}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                  >
                    📝 일괄 편집
                  </button>
                {seoPreview && (
                  <button
                    type="button"
                    onClick={async()=>{
                      const names = Array.from(selectedImages);
                      const payload = names.map(n=> images.find(i=>i.name===n)).filter(Boolean);
                      const res = await fetch('/api/admin/generate-alt-batch',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ items: payload, mode:'apply' })});
                      if (res.ok){
                        // 로컬 반영
                        const data = await res.json();
                        setImages(prev=> prev.map((img)=>{
                          const idx = names.indexOf(img.name);
                          if (idx>=0){ const s = (seoPreview||[])[idx]||{}; return { ...img, alt_text: s.alt||img.alt_text, title: s.title||img.title, description: s.description||img.description } }
                          return img;
                        }));
                        setSeoPreview(null);
                        alert('SEO/ALT 적용 완료');
                      } else { alert('적용 실패'); }
                    }}
                    className="px-3 py-1 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700"
                  >
                    ✅ 적용
                  </button>
                )}

                <button
                  type="button"
                  onClick={async () => {
                    const names = Array.from(selectedImages);
                    for (const n of names) {
                      const img = images.find(i=>i.name===n);
                      if (!img) continue;
                      const a = document.createElement('a');
                      a.href = img.url;
                      a.download = img.name;
                      a.target = '_blank';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }
                  }}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  ⬇️ 일괄 다운로드
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryMoveModalOpen(true)}
                  className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                >
                  📁 카테고리 이동
                </button>
                <button
                  type="button"
                  onClick={handleBulkDuplicate}
                  className="px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600"
                >
                  📋 일괄 복제
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                >
                  🗑️ 일괄 삭제
                </button>
                </div>
                <button
                  onClick={async()=>{
                    if (selectedImages.size === 0){ alert('메타를 채울 이미지를 선택하세요.'); return; }
                    const names = Array.from(selectedImages).map(id=>{
                      const image = images.find(img=> (img.id||img.name)===id || img.name===id);
                      if (!image) return null;
                      return image.folder_path && image.folder_path !== '' ? `${image.folder_path}/${image.name}` : image.name;
                    }).filter(Boolean) as string[];
                    if (names.length===0){ alert('선택된 이미지 경로를 찾을 수 없습니다.'); return; }
                    try{
                      const res = await fetch('/api/admin/backfill-exif',{
                        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ paths: names })
                      });
                      const json = await res.json();
                      if (!res.ok){ throw new Error(json.error||'백필 실패'); }
                      alert(`메타 다시 채우기 완료: ${json.successCount}/${names.length}`);
                      fetchImages(1, true);
                    }catch(e:any){ alert(`메타 다시 채우기 실패: ${e.message}`); }
                  }}
                  className="px-3 py-1 bg-amber-600 text-white text-sm rounded hover:bg-amber-700"
                >
                  🔄 메타 다시 채우기
                </button>
              </div>
            </div>
          )}

          {/* 이미지 그리드 */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filteredImages.length > 0 && selectedImages.size === filteredImages.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">전체 선택</span>
                  </label>
                  {selectedImages.size > 0 && (
                    <button
                      onClick={() => setSelectedImages(new Set())}
                      className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                    >
                      전체 취소
                    </button>
                  )}
                  <span className="text-sm text-gray-600">
                    {filteredImages.length}개 표시 (총 {totalCount}개)
                  </span>
                  {performanceMetrics.loadTime > 0 && (
                    <span className="text-xs text-green-600 ml-2">
                      ⚡ {performanceMetrics.loadTime}ms
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span className="text-gray-600">이미지 로딩 중...</span>
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    최적화된 로딩으로 더 빠른 속도를 경험하세요
                  </div>
                </div>
              ) : filteredImages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">🖼️</div>
                  <p className="text-lg mb-2">이미지가 없습니다</p>
                  <p className="text-sm">검색 조건을 변경해보세요</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredImages.map((image, index) => {
                    // 렌더링 중
                    
                    return (
                    <div 
                      key={image.name} 
                      className={`relative group border-2 rounded-lg overflow-hidden hover:shadow-md transition-all cursor-pointer ${
                        selectedImages.has(getImageUniqueId(image)) 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleImageSelection(image)}
                    >
                      {/* 선택 표시 */}
                      {selectedImages.has(getImageUniqueId(image)) && (
                        <div className="absolute top-2 left-2 z-10">
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        </div>
                      )}
                      
                      {/* 이미지 */}
                      <div className="aspect-square bg-gray-100">
                        <LazyImage
                          src={image.url}
                          alt={image.alt_text || image.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* 이미지 정보 */}
                      <div className="p-3">
                        {/* ✅ 메타데이터 품질 표시 (1단계 추가) */}
                        {image.has_metadata === false && (
                          <div className="mb-2 px-2 py-1 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800">
                            ⚠️ 메타데이터 없음
                          </div>
                        )}
                        {/* 메타데이터는 있지만 품질이 낮은 경우 */}
                        {image.has_metadata === true && image.has_quality_metadata === false && image.metadata_quality && (
                          <div className="mb-2 px-2 py-1 bg-orange-100 border border-orange-300 rounded text-xs text-orange-800">
                            ⚠️ 메타데이터 불완전 ({image.metadata_quality.score}점)
                            {image.metadata_quality.issues.length > 0 && (
                              <div className="mt-1 text-xs">
                                {image.metadata_quality.issues.slice(0, 2).join(', ')}
                                {image.metadata_quality.issues.length > 2 && ` +${image.metadata_quality.issues.length - 2}개`}
                              </div>
                            )}
                          </div>
                        )}
                        {/* 메타데이터 품질이 양호한 경우 (선택적 표시) */}
                        {image.has_quality_metadata === true && image.metadata_quality && image.metadata_quality.score >= 75 && (
                          <div className="mb-2 px-2 py-1 bg-green-100 border border-green-300 rounded text-xs text-green-800">
                            ✅ 메타데이터 양호 ({image.metadata_quality.score}점)
                          </div>
                        )}
                        {/* 폴더 경로 표시 */}
                        {image.folder_path && (
                          <div className="text-xs text-blue-600 mb-1 truncate" title={`폴더: ${image.folder_path}`}>
                            📁 {image.folder_path}
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-600 mb-2 truncate" title={image.name}>
                          {image.name}
                        </div>
                        
                        {/* 메타데이터 미리보기 */}
                        {image.alt_text && (
                          <div className="text-xs text-gray-500 mb-1 truncate" title={image.alt_text}>
                            {image.alt_text}
                          </div>
                        )}
                        
                        {image.keywords && image.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {image.keywords.slice(0, 2).map((keyword, idx) => (
                              <span key={idx} className="px-1 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">
                                {keyword}
                              </span>
                            ))}
                            {image.keywords.length > 2 && (
                              <span className="text-xs text-gray-500">+{image.keywords.length - 2}</span>
                            )}
                          </div>
                        )}
                        
                        {/* 사용 현황 및 파일 정보 */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex flex-col">
                            <span>{image.usage_count || 0}회 사용</span>
                            {image.file_size && (
                              <span>{(image.file_size / 1024).toFixed(1)}KB</span>
                            )}
                            {image.width && image.height && (
                              <span>{image.width}×{image.height}</span>
                            )}
                          </div>
                          <div className="flex flex-col items-end">
                            {image.is_featured && (
                              <span className="px-1 py-0.5 bg-yellow-200 text-yellow-800 rounded text-xs mb-1">
                                ⭐ 대표
                              </span>
                            )}
                            {image.optimized_versions && (
                              <span className="px-1 py-0.5 bg-green-200 text-green-800 rounded text-xs">
                                📱 최적화됨
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* 퀵 액션 버튼들 */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col space-y-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImageForZoom(image);
                          }}
                          className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
                          title="확대"
                        >
                          🔍
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(image);
                          }}
                          className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
                          title="편집"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(image.url);
                            alert('URL이 클립보드에 복사되었습니다.');
                          }}
                          className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
                          title="URL 복사"
                        >
                          📋
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const link = document.createElement('a');
                            link.href = image.url;
                            link.download = image.name;
                            link.click();
                          }}
                          className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
                          title="다운로드"
                        >
                          💾
                        </button>
                        {image.folder_path && image.folder_path !== '' && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm(`"${image.name}" 이미지를 루트 폴더로 이동하시겠습니까?`)) {
                                try {
                                  console.log('🔍 이미지 이동 요청 데이터:', {
                                    imageId: image.id,
                                    currentPath: image.name,
                                    imageUrl: image.url
                                  });
                                  
                                  if (!image.id || image.id.startsWith('temp-')) {
                                    alert('이미지 ID가 유효하지 않습니다. 페이지를 새로고침 후 다시 시도해주세요.');
                                    return;
                                  }
                                  
                                  const response = await fetch('/api/admin/move-image-to-root', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ 
                                      imageId: image.id,
                                      currentPath: image.name
                                    })
                                  });

                                  const result = await response.json();

                                  if (result.success) {
                                    alert(`이미지가 루트로 이동되었습니다!\n\n"${result.data.oldPath}" → "${result.data.newPath}"`);
                                    // 갤러리 새로고침
                                    fetchImages(1, true);
                                  } else {
                                    alert(`이미지 이동 실패: ${result.error}`);
                                  }
                                } catch (error) {
                                  console.error('❌ 이미지 이동 오류:', error);
                                  alert('이미지 이동 중 오류가 발생했습니다.');
                                }
                              }
                            }}
                            className="p-1 bg-yellow-100 rounded shadow-sm hover:bg-yellow-200"
                            title="루트로 이동"
                          >
                            📁
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const fullPath = image.folder_path && image.folder_path !== '' 
                              ? `${image.folder_path}/${image.name}` 
                              : image.name;
                            if (confirm(`"${image.name}" 이미지를 삭제하시겠습니까?`)) {
                              handleDeleteImage(fullPath);
                            }
                          }}
                          className="p-1 bg-red-100 rounded shadow-sm hover:bg-red-200"
                          title="삭제"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
              
              {/* 무한 스크롤 로딩 인디케이터 */}
              {isLoadingMore && (
                <div className="col-span-full flex justify-center items-center py-8">
                  <div className="flex items-center space-x-2 text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span>더 많은 이미지를 불러오는 중...</span>
                  </div>
                </div>
              )}
              
              {/* 더 이상 로드할 이미지가 없을 때 */}
              {!hasMoreImages && images.length > 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <p>모든 이미지를 불러왔습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 새로운 이미지 메타데이터 편집 모달 */}
      <ImageMetadataModal
        isOpen={!!editingImage}
        image={(() => {
          if (!editingImage) return null;
          const found = images.find(img => img.name === editingImage) || null;
          return found ? { ...found, category: String(found.category ?? '') } as any : null;
        })()}
        onClose={() => setEditingImage(null)}
        onSave={async (metadata) => {
          // 기존 saveEdit 로직 사용
          const rawKw: any = metadata.keywords as any;
          const keywords: string[] = Array.isArray(rawKw)
            ? rawKw.map((k:any)=> String(k || '').trim()).filter((k:string)=>k)
            : typeof rawKw === 'string'
              ? rawKw.split(',').map(k=> String(k||'').trim()).filter(k=>k)
              : [];
          
          const image = images.find(img => img.name === editingImage);
          if (!image) {
            alert('이미지 정보를 찾을 수 없습니다.');
            return;
          }

          try {
            // 메타데이터 저장 시작
            
            // 카테고리 처리: categories 배열이 있으면 사용, 없으면 category 문자열 사용
            const categoriesArray = (metadata as any).categories || 
              (metadata.category ? metadata.category.split(',').map((c: string) => c.trim()).filter((c: string) => c) : []);
            const categoryString = categoriesArray.length > 0 ? categoriesArray.join(',') : metadata.category || '';
            
            // ✅ 카테고리를 키워드에 포함 (중복 제거)
            const currentKeywordsList = keywords;
            const allKeywordsList = Array.from(new Set([...currentKeywordsList, ...categoriesArray]));
            const finalKeywords = allKeywordsList;
            
            console.log('💾 저장 시 키워드 업데이트 (onSave):', {
              categories: categoriesArray,
              previousKeywords: currentKeywordsList,
              updatedKeywords: allKeywordsList,
              finalKeywords: finalKeywords
            });
            
            // ✅ 제목이 파일명과 같은 경우 빈 문자열로 처리 (파일명이 제목으로 잘못 저장되는 것 방지)
            const finalFileName = metadata.filename || image.name;
            let titleValue = metadata.title || '';
            const filenameWithoutExt = finalFileName?.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
            const titleWithoutExt = titleValue.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
            
            if (titleValue === finalFileName || titleValue === image.name || 
                titleWithoutExt === filenameWithoutExt) {
              console.warn('⚠️ 제목이 파일명과 동일하여 빈 문자열로 처리:', titleValue);
              titleValue = '';
            }
            
            // ✅ 메타데이터가 비어있는지 확인 (파일명 변경 후 메타데이터가 사라지는 문제 방지)
            if (!metadata.alt_text && finalKeywords.length === 0 && !titleValue && !metadata.description) {
              console.warn('⚠️ 메타데이터가 모두 비어있습니다. 저장을 취소합니다.');
              alert('메타데이터가 비어있습니다. ALT 텍스트, 키워드, 제목, 설명 중 최소 하나는 입력해주세요.');
              return;
            }
            
            const requestData = {
              imageName: finalFileName,
              imageUrl: image.url,
              alt_text: metadata.alt_text || '',
              keywords: finalKeywords.length > 0 ? finalKeywords : [],
              title: titleValue,  // 파일명과 같으면 빈 문자열
              description: metadata.description || '',
              category: categoryString,  // 하위 호환성: 문자열로 전송
              categories: categoriesArray  // 다중 선택: 배열로 전송
            };
            
            console.log('📤 저장 요청 데이터:', requestData);
            
            const response = await fetch('/api/admin/image-metadata', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestData)
            });
            
            console.log('📡 저장 API 응답 상태:', response.status);
            
            if (response.ok) {
              const responseData = await response.json();
              console.log('✅ 저장 API 응답 데이터:', responseData);
              
              // 로컬 상태 업데이트
              setImages(prev => prev.map(img => 
                img.name === editingImage 
                  ? { 
                      ...img, 
                      alt_text: metadata.alt_text,
                      keywords: keywords,
                      title: metadata.title,
                      description: metadata.description,
                      category: metadata.category,
                      name: metadata.filename || img.name
                    }
                  : img
              ));
              
              // 편집 모달 닫기
              setEditingImage(null);
              
              // 갤러리 새로고침 (약간의 지연 후)
              setTimeout(() => {
                fetchImages(1, true);
              }, 1000);
              
              alert('메타데이터가 성공적으로 저장되었습니다!');
            } else {
              const errorData = await response.json();
              console.error('❌ 저장 API 오류 응답:', {
                status: response.status,
                statusText: response.statusText,
                errorData: errorData
              });
              let errorMessage = `저장에 실패했습니다.\n상태: ${response.status}\n`;
              
              if (errorData.details && Array.isArray(errorData.details)) {
                errorMessage += `오류 내용:\n${errorData.details.join('\n')}`;
              } else if (errorData.error) {
                errorMessage += `오류: ${errorData.error}`;
              } else if (errorData.message) {
                errorMessage += `오류: ${errorData.message}`;
              } else {
                errorMessage += '알 수 없는 오류가 발생했습니다.';
              }
              
              alert(errorMessage);
            }
          } catch (error) {
            console.error('❌ 저장 중 오류:', error);
            alert(`저장 중 오류가 발생했습니다: ${error.message}`);
          }
        }}
        onRename={async (newFilename) => {
          if (!editingImage) return;
          
          try {
            const image = images.find(img => img.name === editingImage);
            if (!image) return;
            
            const response = await fetch('/api/admin/rename-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageId: image.id,
                newFileName: newFilename,
                currentFileName: image.name,
                imageUrl: image.url  // imageId가 없을 경우 대체 조회용
              })
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log('✅ 파일명 변경 성공:', result);
              
              // API 응답 형식: { success: true, data: { newFileName, newUrl } }
              const newFileName = result.data?.newFileName || result.newName || newFilename;
              const newUrl = result.data?.newUrl || result.newUrl;
              
              // 로컬 상태 업데이트
              setImages(prev => prev.map(img => 
                img.name === editingImage 
                  ? { ...img, name: newFileName, url: newUrl }
                  : img
              ));
              
              return result;
            } else {
              const errorData = await response.json();
              throw new Error(errorData.error || '파일명 변경에 실패했습니다.');
            }
          } catch (error) {
            console.error('❌ 파일명 변경 오류:', error);
            throw error;
          }
        }}
        categories={dynamicCategories}
      />

      {/* 확대 모달 */}
      {selectedImageForZoom && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex flex-col">
            {/* 헤더 */}
            <div className="flex justify-between items-center p-4 bg-white bg-opacity-90 rounded-t-lg">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {selectedImageForZoom.name}
                </h3>
                <span className="text-sm text-gray-500">
                  {selectedImageForZoom.size ? `${(selectedImageForZoom.size / 1024 / 1024).toFixed(1)}MB` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* 액션 버튼들 */}
                <button
                  onClick={() => {
                    // 편집 기능 - 메타데이터 편집 모달 열기
                    setEditingImage(selectedImageForZoom.name);
                  }}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                  title="메타데이터 편집"
                >
                  📝 편집
                </button>
                <button
                  onClick={() => {
                    // URL 복사
                    navigator.clipboard.writeText(selectedImageForZoom.url);
                    alert('이미지 URL이 클립보드에 복사되었습니다.');
                  }}
                  className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                  title="URL 복사"
                >
                  🔗 복사
                </button>
                <button
                  onClick={() => {
                    // 다운로드
                    const link = document.createElement('a');
                    link.href = selectedImageForZoom.url;
                    link.download = selectedImageForZoom.name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 transition-colors"
                  title="다운로드"
                >
                  ⬇️ 저장
                </button>
                <button
                  onClick={() => {
                    const fullPath = selectedImageForZoom.folder_path && selectedImageForZoom.folder_path !== '' 
                      ? `${selectedImageForZoom.folder_path}/${selectedImageForZoom.name}` 
                      : selectedImageForZoom.name;
                    if (confirm(`"${selectedImageForZoom.name}" 이미지를 삭제하시겠습니까?`)) {
                      // 개별 이미지 삭제 (폴더 경로 포함)
                      handleDeleteImage(fullPath);
                      setSelectedImageForZoom(null);
                    }
                  }}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                  title="삭제"
                >
                  🗑️ 삭제
                </button>
                <button
                  onClick={() => setSelectedImageForZoom(null)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                  title="닫기 (Esc)"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 메인 이미지 영역 */}
            <div className="flex-1 flex items-center justify-center bg-gray-100 relative overflow-hidden">
              <img
                src={selectedImageForZoom.url}
                alt={selectedImageForZoom.alt_text || selectedImageForZoom.name}
                className="max-w-full max-h-full object-contain"
                style={{ 
                  transition: 'opacity 0.1s ease-in-out'
                }}
              />
              
              {/* 좌우 네비게이션 버튼 */}
              <button
                onClick={() => showAdjacentImage('prev')}
                disabled={isNavigating}
                className={`absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full shadow-lg transition-all ${
                  isNavigating 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-white bg-opacity-80 hover:bg-opacity-100'
                }`}
                title="이전 이미지 (←)"
              >
                {isNavigating ? '⏳' : '←'}
              </button>
              <button
                onClick={() => showAdjacentImage('next')}
                disabled={isNavigating}
                className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full shadow-lg transition-all ${
                  isNavigating 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-white bg-opacity-80 hover:bg-opacity-100'
                }`}
                title="다음 이미지 (→)"
              >
                {isNavigating ? '⏳' : '→'}
              </button>
            </div>

            {/* 썸네일 스트립 */}
            <div className="bg-white bg-opacity-90 p-4 rounded-b-lg">
              <div 
                ref={thumbnailStripRef}
                className="flex gap-2 overflow-x-auto pb-2"
                style={{ scrollbarWidth: 'thin' }}
              >
                {filteredImages.map((img) => (
                  <div
                    key={getImageUniqueId(img)}
                    className={`flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      img.name === selectedImageForZoom.name 
                        ? 'border-blue-500 shadow-lg' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedImageForZoom(img)}
                  >
                    <img
                      src={img.url}
                      alt={img.alt_text || img.name}
                      className="w-16 h-16 object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 일괄 삭제 확인 모달 */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-xl">⚠️</span>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  일괄 삭제 확인
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  선택된 <span className="font-semibold text-red-600">{selectedImages.size}개</span>의 이미지를 삭제하시겠습니까?
                  <br />
                  <span className="text-red-600">이 작업은 되돌릴 수 없습니다.</span>
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowBulkDeleteConfirm(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={isBulkWorking}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBulkWorking ? '삭제 중...' : '삭제'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 일괄 편집 모달 */}
      {showBulkEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">일괄 편집 ({selectedImages.size}개)</h3>
              <button onClick={() => setShowBulkEdit(false)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-auto space-y-4">
              {/* 일괄 편집 폼 내용 */}
              <p>일괄 편집 기능이 구현될 예정입니다.</p>
            </div>
          </div>
        </div>
      )}

      {/* 카테고리 관리 모달 */}
      <CategoryManagementModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
      />

      {/* 카테고리 이동 모달 */}
      {categoryMoveModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">📁 카테고리 이동</h3>
              <button 
                onClick={() => setCategoryMoveModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                {selectedImages.size}개 이미지를 이동할 카테고리를 선택하세요.
              </p>
              <select
                id="categorySelect"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                defaultValue=""
              >
                <option value="">카테고리 선택</option>
                {dynamicCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setCategoryMoveModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  const selectElement = document.getElementById('categorySelect') as HTMLSelectElement;
                  const selectedCategoryId = selectElement.value;
                  
                  if (!selectedCategoryId) {
                    alert('카테고리를 선택해주세요.');
                    return;
                  }
                  
                  const targetCategory = dynamicCategories.find(cat => cat.id === parseInt(selectedCategoryId));
                  if (!targetCategory) {
                    alert('선택된 카테고리를 찾을 수 없습니다.');
                    return;
                  }
                  
                  try {
                    const selectedIds = Array.from(selectedImages);
                    const names = selectedIds.map(id => {
                      const image = images.find(img => getImageUniqueId(img) === id);
                      return image ? image.name : id;
                    });
                    
                    console.log('📁 카테고리 이동 시작:', names.length, '개 이미지');
                    console.log('📁 대상 카테고리:', targetCategory.name, '(ID:', targetCategory.id, ')');
                    
                    // 각 이미지의 카테고리 업데이트
                    for (const imageName of names) {
                      const response = await fetch('/api/admin/image-metadata', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          imageName: imageName,
                          category: targetCategory.id
                        })
                      });
                      
                      if (!response.ok) {
                        const error = await response.json();
                        console.error('❌ 카테고리 업데이트 실패:', imageName, error);
                      }
                    }
                    
                    // 로컬 상태 업데이트
                    setImages(prev => prev.map(img => 
                      selectedImages.has(getImageUniqueId(img)) 
                        ? { ...img, category: targetCategory.id }
                        : img
                    ));
                    
                    setCategoryMoveModalOpen(false);
                    alert(`카테고리 이동 완료!\n\n${names.length}개 이미지가 "${targetCategory.name}" 카테고리로 이동되었습니다.`);
                    
                  } catch (error) {
                    console.error('❌ 카테고리 이동 오류:', error);
                    alert('카테고리 이동 중 오류가 발생했습니다.');
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                이동
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 폴더 관리 모달 */}
      {folderModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">📁 폴더 관리</h3>
              <button
                onClick={() => setFolderModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold mb-3">현재 폴더 목록</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableFolders.map((folder) => (
                    <div key={folder} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">📁</span>
                        <span className="font-medium">{folder}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingFolder(folder);
                            setNewFolderName(folder);
                          }}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          이름 변경
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`"${folder}" 폴더를 삭제하시겠습니까? 폴더 내 모든 이미지가 삭제됩니다.`)) {
                              try {
                                const response = await fetch('/api/admin/delete-folder', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ folderPath: folder })
                                });

                                const result = await response.json();

                                if (result.success) {
                                  alert(`폴더 삭제 완료!\n\n${result.deletedFiles}개 파일과 ${result.metadataDeleted}개 메타데이터가 삭제되었습니다.`);
                                  setFolderModalOpen(false);
                                  // 갤러리 새로고침
                                  fetchImages(1, true);
                                } else {
                                  alert(`폴더 삭제 실패: ${result.error}`);
                                }
                              } catch (error) {
                                console.error('❌ 폴더 삭제 오류:', error);
                                alert('폴더 삭제 중 오류가 발생했습니다.');
                              }
                            }
                          }}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {editingFolder && (
                <div className="border-t pt-4">
                  <h4 className="text-lg font-semibold mb-3">폴더명 변경</h4>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="새 폴더명 입력"
                    />
                    <button
                      onClick={async () => {
                        if (newFolderName.trim() && newFolderName !== editingFolder) {
                          try {
                            const response = await fetch('/api/admin/rename-folder', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ 
                                oldFolderPath: editingFolder,
                                newFolderPath: newFolderName.trim()
                              })
                            });

                            const result = await response.json();

                            if (result.success) {
                              alert(`폴더명 변경 완료!\n\n"${editingFolder}" → "${newFolderName}"\n\n${result.movedFiles}개 파일 이동, ${result.metadataUpdated}개 메타데이터 업데이트`);
                              setEditingFolder(null);
                              setNewFolderName('');
                              setFolderModalOpen(false);
                              // 갤러리 새로고침
                              fetchImages(1, true);
                            } else {
                              alert(`폴더명 변경 실패: ${result.error}`);
                            }
                          } catch (error) {
                            console.error('❌ 폴더명 변경 오류:', error);
                            alert('폴더명 변경 중 오류가 발생했습니다.');
                          }
                        }
                      }}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                    >
                      변경
                    </button>
                    <button
                      onClick={() => {
                        setEditingFolder(null);
                        setNewFolderName('');
                      }}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="text-lg font-semibold mb-3">새 폴더 생성</h4>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="새 폴더명 입력 (예: scraped-images/2025-01-15)"
                  />
                  <button
                    onClick={() => {
                      if (newFolderName.trim()) {
                        // 새 폴더 생성 로직 (향후 구현)
                        alert(`새 폴더 생성 기능은 향후 구현 예정입니다.\n폴더명: "${newFolderName}"`);
                        setNewFolderName('');
                      }
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    생성
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setFolderModalOpen(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">이미지 추가</h3>
              <button onClick={()=>setShowAddModal(false)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
            </div>
            <div className="px-4 pt-4">
              <div className="flex space-x-6 border-b">
                <button
                  className={`px-2 pb-2 text-sm ${activeAddTab==='upload' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                  onClick={()=>setActiveAddTab('upload')}
                >📁 파일 업로드</button>
                <button
                  className={`px-2 pb-2 text-sm ${activeAddTab==='url' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                  onClick={()=>setActiveAddTab('url')}
                >🔗 URL 입력</button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {activeAddTab==='upload' && (
                <div className="space-y-3">
                  <input
                    id="gallery-file-upload"
                    type="file"
                    accept="image/*,.heic,.heif"
                    onChange={async (e)=>{
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        setPending(true);
                        // 1) 서명 URL 발급
                        const dateStr = new Date().toISOString().slice(0,10);
                        const res = await fetch('/api/admin/storage-signed-upload',{
                          method:'POST', headers:{'Content-Type':'application/json'},
                          body: JSON.stringify({
                            fileName: file.name,
                            folder: `originals/${dateStr}`,
                            contentType: file.type || 'application/octet-stream'
                          })
                        });
                        const json = await res.json();
                        if(!res.ok) throw new Error(json.error||'서명 URL 발급 실패');
                        const { signedUrl, objectPath, publicUrl } = json;
                        // 2) 업로드
                        const put = await fetch(signedUrl,{ method:'PUT', headers:{'Content-Type': file.type||'application/octet-stream'}, body:file });
                        if(!put.ok) throw new Error('업로드 실패');
                        // 3) 메타 업서트
                        await fetch('/api/admin/upsert-image-metadata',{
                          method:'POST', headers:{'Content-Type':'application/json'},
                          body: JSON.stringify({
                            file_name: file.name,
                            image_url: publicUrl,
                            date_folder: dateStr,
                            width: null, height: null, file_size: file.size
                          })
                        });
                        // 4) EXIF 백필 비동기
                        fetch('/api/admin/backfill-exif',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ paths:[objectPath] })});
                        setShowAddModal(false);
                        fetchImages(1, true);
                        alert('이미지 업로드 완료');
                      } catch(e:any){
                        alert(`업로드 실패: ${e.message}`);
                      } finally { setPending(false); }
                    }}
                  />
                  <p className="text-xs text-gray-500">HEIC/JPG/PNG 지원. 업로드 후 자동으로 메타데이터가 보강됩니다.</p>
                </div>
              )}

              {activeAddTab==='url' && (
                <div className="space-y-3">
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border rounded"
                    value={addUrl}
                    onChange={(e)=>setAddUrl(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <button
                      disabled={!addUrl || pending}
                      onClick={async()=>{
                        if(!addUrl) return;
                        try{
                          setPending(true);
                          const dateStr = new Date().toISOString().slice(0,10);
                          const resp = await fetch('/api/admin/duplicate-images',{
                            method:'POST', headers:{'Content-Type':'application/json'},
                            body: JSON.stringify({ images:[{ url: addUrl }], targetFolder: `duplicated/${dateStr}` })
                          });
                          const j = await resp.json();
                          if(!resp.ok) throw new Error(j.error||'URL 가져오기 실패');
                          setShowAddModal(false);
                          fetchImages(1, true);
                          alert('URL 이미지가 갤러리에 추가되었습니다.');
                        }catch(e:any){ alert(`실패: ${e.message}`); } finally{ setPending(false);} 
                      }}
                      className={`px-4 py-2 rounded text-white ${pending? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                    >가져오기</button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-end">
              <button onClick={()=>setShowAddModal(false)} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
