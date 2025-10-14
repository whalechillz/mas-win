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
  category?: string;
  is_featured?: boolean;
  usage_count?: number;
  used_in_posts?: string[];
  // 선택적 상세 정보 (있을 수도 있음)
  file_size?: number;
  width?: number;
  height?: number;
  optimized_versions?: any;
}

export default function GalleryAdmin() {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [imagesPerPage] = useState(30); // 관리하기 쉬운 페이지당 글수
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
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'created_at' | 'name' | 'size' | 'usage_count' | 'folder_path'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // 동적 카테고리 상태 (useMemo보다 먼저 정의)
  const [dynamicCategories, setDynamicCategories] = useState<any[]>([]);
  
  // 폴더 목록 계산
  const availableFolders = useMemo(() => {
    const folders = new Set<string>();
    images.forEach(img => {
      if (img.folder_path && img.folder_path !== '') {
        folders.add(img.folder_path);
      }
    });
    return Array.from(folders).sort();
  }, [images]);
  
  // 필터링된 이미지 계산 (useMemo로 최적화)
  const filteredImages = useMemo(() => {
    let filtered = images;
    
    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(img => 
        img.name.toLowerCase().includes(query) ||
        img.alt_text?.toLowerCase().includes(query) ||
        img.keywords?.some((k: string) => k.toLowerCase().includes(query)) ||
        img.title?.toLowerCase().includes(query)
      );
    }
    
    // 폴더 필터
    if (folderFilter !== 'all') {
      if (folderFilter === 'root') {
        // 루트 폴더 (폴더 경로가 없는 이미지들)
        filtered = filtered.filter(img => !img.folder_path || img.folder_path === '');
      } else {
        // 특정 폴더
        filtered = filtered.filter(img => img.folder_path === folderFilter);
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
        const nameCounts = filtered.reduce((acc, img) => {
          acc[img.name] = (acc[img.name] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        filtered = filtered.filter(img => nameCounts[img.name] > 1);
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
  }, [images, searchQuery, filterType, selectedCategoryFilter, dynamicCategories, sortBy, sortOrder]);
  
  // 카테고리 관리 UI 상태
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryMoveModalOpen, setCategoryMoveModalOpen] = useState(false);
  
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
  const [editForm, setEditForm] = useState({
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
      const response = await fetch(`/api/admin/all-images?limit=${imagesPerPage}&offset=${offset}`);
      const data = await response.json();
      
      if (response.ok) {
        const list = data.images || [];
        
        // 🔍 중복 이미지 디버깅 로그 추가
        // 이미지 로드 완료
        
        // 파일명별 그룹화하여 중복 확인
        const nameGroups: { [key: string]: any[] } = {};
        list.forEach((img: any) => {
          if (!nameGroups[img.name]) {
            nameGroups[img.name] = [];
          }
          nameGroups[img.name].push(img);
        });
        
        // 중복 파일명 찾기
        const duplicateNames = Object.entries(nameGroups).filter(([name, files]) => files.length > 1);
        // 중복 파일명 체크 (로그 제거)
        
        // URL별 그룹화하여 중복 확인
        const urlGroups: { [key: string]: any[] } = {};
        list.forEach((img: any) => {
          if (!urlGroups[img.url]) {
            urlGroups[img.url] = [];
          }
          urlGroups[img.url].push(img);
        });
        
        const duplicateUrls = Object.entries(urlGroups).filter(([url, files]) => files.length > 1);
        // 중복 URL 체크 (로그 제거)
        
        // 🔍 전체 images 배열 중복 체크 (setImages 후)
        setTimeout(() => {
          setImages(currentImages => {
            const allNameGroups: { [key: string]: any[] } = {};
            currentImages.forEach((img: any) => {
              if (!allNameGroups[img.name]) {
                allNameGroups[img.name] = [];
              }
              allNameGroups[img.name].push(img);
            });
            
            const allDuplicateNames = Object.entries(allNameGroups).filter(([name, files]) => files.length > 1);
            // 전체 배열 중복 체크 (로그 제거)
            
            return currentImages;
          });
        }, 100);
        
        // 더 이상 로드할 이미지가 없는지 확인
        if (list.length < imagesPerPage) {
          setHasMoreImages(false);
        } else {
          setHasMoreImages(true);
        }
        
        const metaRes = await fetch('/api/admin/image-metadata-batch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageUrls: list.map((i: any)=> i.url) }) });
        const metaJson = metaRes.ok ? await metaRes.json() : { metadata: {} };
        const metaMap = metaJson.metadata || {};
        const imagesWithMetadata = list.map((img: any) => ({
          ...img,
          alt_text: metaMap[img.url]?.alt_text || '',
          keywords: metaMap[img.url]?.tags || [],
          title: metaMap[img.url]?.title || '',
          description: metaMap[img.url]?.description || '',
          category: metaMap[img.url]?.category_id || '',
          is_featured: false,
          usage_count: metaMap[img.url]?.usage_count || 0,
          used_in_posts: []
        }));
        
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

  // 무한 스크롤 로드 (의존성 배열 최적화)
  useEffect(() => {
    const onScroll = () => {
      if (isLoading || isLoadingMore || !hasMoreImages) return;
      
      const remaining = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
      if (remaining < 200) {
        setCurrentPage(prev => prev + 1);
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [isLoading, isLoadingMore, hasMoreImages]); // 불필요한 의존성 제거

  // currentPage 변경 시 이미지 로드
  useEffect(() => {
    if (currentPage > 1) {
      fetchImages(currentPage);
    }
  }, [currentPage]);

  // 초기 로드
  useEffect(() => {
    fetchImages(1, true);
    loadDynamicCategories(); // 동적 카테고리 로드
    // 카테고리/태그 로드
    (async()=>{
      try { const c = await (await fetch('/api/admin/image-categories')).json(); setCategories(c.categories||[]); } catch {}
      try { const t = await (await fetch('/api/admin/image-tags')).json(); setTags(t.tags||[]); } catch {}
    })();
  }, []);

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
    
    // 🔍 저장 전 유효성 검사 (SEO 최적화 강제)
    const categoryStr = String(editForm.category || '');
    if (!categoryStr || categoryStr.trim() === '') {
      alert('카테고리를 선택해주세요.');
      return;
    }
    
    // 글자 수 제한 검사
    const validationErrors = [];
    if (editForm.alt_text && editForm.alt_text.length > 50) {
      validationErrors.push(`ALT 텍스트가 너무 깁니다 (${editForm.alt_text.length}자, 50자 이하 강제)`);
    }
    if (editForm.keywords && editForm.keywords.length > 20) {
      validationErrors.push(`키워드가 너무 깁니다 (${editForm.keywords.length}자, 20자 이하 강제)`);
    }
    if (editForm.title && editForm.title.length > 30) {
      validationErrors.push(`제목이 너무 깁니다 (${editForm.title.length}자, 30자 이하 강제)`);
    }
    if (editForm.description && editForm.description.length > 100) {
      validationErrors.push(`설명이 너무 깁니다 (${editForm.description.length}자, 100자 이하 강제)`);
    }
    
    if (validationErrors.length > 0) {
      alert(`SEO 최적화 글자 수 제한을 초과했습니다:\n\n${validationErrors.join('\n')}`);
      return;
    }
    
    try {
      // 메타데이터 저장 시작
      // 🔧 keywords 안전하게 처리
      const keywords = editForm.keywords && typeof editForm.keywords === 'string' 
        ? editForm.keywords.split(',').map(k => k.trim()).filter(k => k)
        : [];
      
      const image = images.find(img => img.name === editingImage);
      if (!image) {
        alert('이미지 정보를 찾을 수 없습니다.');
        return;
      }
      
      // 편집 중인 이미지 정보 확인

      // 파일명이 변경된 경우 먼저 파일명 변경 처리
      if (editForm.filename && editForm.filename !== image.name) {
        // 파일명 변경 처리
        
        
        const renameResponse = await fetch('/api/admin/rename-image/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oldName: image.name,  // 실제 데이터베이스의 파일명 사용
            newName: editForm.filename
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
        const finalFileName = renameResult.newName || editForm.filename;
        const newUrl = renameResult.newUrl;
        
        console.log('✅ 파일명 변경 완료:', {
          oldName: image.name,
          newName: finalFileName,
          newUrl: newUrl
        });
        
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

      const requestData = {
        imageName: editForm.filename || image.name,  // 실제 데이터베이스의 파일명 사용
        imageUrl: image.url,  // URL은 파일명 변경 시 이미 업데이트됨
        alt_text: editForm.alt_text,
        keywords: keywords,
        title: editForm.title,
        description: editForm.description,
        category: editForm.category
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
        setImages(prev => prev.map(img => 
          img.name === image.name 
            ? { 
                ...img, 
                ...editForm, 
                keywords, 
                name: editForm.filename || image.name,
                url: editForm.filename && editForm.filename !== image.name ? 
                  `https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/${editForm.filename}` : img.url
              }
            : img
        ));
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
      const keywordList = bulkEditForm.keywords
        .split(',')
        .map(k => k.trim())
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
      const response = await fetch('/api/admin/delete-image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageName: imageName })
      });

      if (response.ok) {
        const result = await response.json();
        // 삭제된 이미지를 상태에서 제거
        setImages(prev => prev.filter(img => img.name !== imageName));
        alert('이미지가 삭제되었습니다.');
      } else {
        const errorData = await response.json();
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
      
      // 선택된 ID에서 실제 파일명 추출
      const names = selectedIds.map(id => {
        const image = images.find(img => getImageUniqueId(img) === id);
        if (image) {
          console.log('📝 ID 매칭:', { id, actualName: image.name });
          return image.name;
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
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.details || '일괄 삭제에 실패했습니다.';
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('✅ 일괄 삭제 성공:', result);
      
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
      
      alert(`일괄 삭제 완료: ${names.length}개 이미지가 삭제되었습니다.`);
      
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
              <div className="flex items-center space-x-4">
                <Link 
                  href="/admin/blog"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                >
                  📝 블로그 관리로 돌아가기
                </Link>
              <button onClick={()=>{
                setCategoryModalOpen(true);
                loadDynamicCategories(); // 카테고리 새로고침
              }} className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm">📂 카테고리 관리</button>
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
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                  onChange={(e) => setFolderFilter(e.target.value)}
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
                        <img
                          src={image.url}
                          alt={image.alt_text || image.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                          }}
                        />
                      </div>
                      
                      {/* 이미지 정보 */}
                      <div className="p-3">
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
        image={editingImage ? images.find(img => img.name === editingImage) || null : null}
        onClose={() => setEditingImage(null)}
        onSave={async (metadata) => {
          // 기존 saveEdit 로직 사용
          const keywords = metadata.keywords && typeof metadata.keywords === 'string' 
            ? metadata.keywords.split(',').map(k => k.trim()).filter(k => k)
            : [];
          
          const image = images.find(img => img.name === editingImage);
          if (!image) {
            alert('이미지 정보를 찾을 수 없습니다.');
            return;
          }

          try {
            // 메타데이터 저장 시작
            
            const requestData = {
              imageName: metadata.filename || image.name,
              imageUrl: image.url,
              alt_text: metadata.alt_text,
              keywords: keywords,
              title: metadata.title,
              description: metadata.description,
              category: metadata.category
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
            
            const response = await fetch('/api/admin/rename-image/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                oldName: image.name,
                newName: newFilename,
                imageUrl: image.url
              })
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log('✅ 파일명 변경 성공:', result);
              
              // 로컬 상태 업데이트
              setImages(prev => prev.map(img => 
                img.name === editingImage 
                  ? { ...img, name: result.newName, url: result.newUrl }
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
                    setEditingImage(selectedImageForZoom);
                    setShowEditModal(true);
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
                    if (confirm(`"${selectedImageForZoom.name}" 이미지를 삭제하시겠습니까?`)) {
                      // 개별 이미지 삭제
                      handleDeleteImage(selectedImageForZoom.name);
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
    </div>
  );
}
