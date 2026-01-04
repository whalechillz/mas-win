'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Head from 'next/head';
import AdminNav from '../../components/admin/AdminNav';
import Link from 'next/link';
import { ImageMetadataModal } from '../../components/ImageMetadataModal';
import FolderTree from '../../components/gallery/FolderTree';
import { createClient } from '@supabase/supabase-js';
import { uploadImageToSupabase } from '../../lib/image-upload-utils';
import FolderSelector from '../../components/admin/FolderSelector';
import { rotateImageWithCanvas, convertImageWithCanvas, getImageMetadata } from '../../lib/client/image-processor';
import JSZip from 'jszip';

// 디바운스 훅 (PerformanceUtils에서 분리하여 직접 구현)
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

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
  used_in_posts?: string[];  // 기존 (하위 호환성)
  used_in?: Array<{          // ✅ 사용 위치 상세 정보
    type: 'blog' | 'funnel' | 'homepage' | 'muziik' | 'static_page';
    title: string;
    url: string;
    isFeatured?: boolean;
    isInContent?: boolean;
    created_at?: string;
    // 🔧 배포 상태 정보 추가
    status?: string;
    published_at?: string;
    isPublished?: boolean;
  }>;
  last_used_at?: string;     // ✅ 최근 사용 날짜
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
  // 로고 관련 필드
  is_logo?: boolean;
  logo_brand?: string;
  logo_type?: string;
  logo_color_variant?: string;
}

export default function GalleryAdmin() {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  
  // Phase 5-7: 이미지 비교 기능 관련 상태
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set());
  const [compareResult, setCompareResult] = useState<any>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  
  // Phase 8-9-7: 확장자 기반 중복 확인 관련 상태
  const [isCheckingExtensionDuplicates, setIsCheckingExtensionDuplicates] = useState(false);
  const [extensionDuplicateResult, setExtensionDuplicateResult] = useState<any>(null);
  const [showExtensionDuplicateModal, setShowExtensionDuplicateModal] = useState(false);
  
  // 블로그 중복 이미지 관리 관련 상태
  const [isAnalyzingBlogDuplicates, setIsAnalyzingBlogDuplicates] = useState(false);
  const [blogDuplicateAnalysis, setBlogDuplicateAnalysis] = useState<any>(null);
  const [showBlogDuplicateModal, setShowBlogDuplicateModal] = useState(false);
  const [selectedDuplicateHashes, setSelectedDuplicateHashes] = useState<Set<string>>(new Set());
  const [isRemovingDuplicates, setIsRemovingDuplicates] = useState(false);
  
  // 이미지 복사/링크 모달 관련 상태
  const [showCopyLinkModal, setShowCopyLinkModal] = useState(false);
  const [pendingImageDrop, setPendingImageDrop] = useState<{ imageData: any; targetFolder: string } | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [imagesPerPage] = useState(12); // 성능 최적화를 위해 페이지당 이미지 수 감소
  const [hasMoreImages, setHasMoreImages] = useState(true);
  
  // 초기 로드 추적을 위한 ref
  const initialLoadRef = useRef(true);
  
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
  
  // 블로그 이미지 정리 관련 상태
  const [blogIdForOrganization, setBlogIdForOrganization] = useState<number | null>(309); // 기본값: 309
  const [isOrganizingImages, setIsOrganizingImages] = useState(false);
  const [isSyncingBlogMetadata, setIsSyncingBlogMetadata] = useState(false);
  // 레거시 상단 "메타데이터 동기화" 버튼 표시 여부 (중복 UI 방지 위해 기본 비표시)
  const SHOW_LEGACY_META_SYNC_BUTTON = false;

  // 폴더별 중복 제거 관련 상태
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [duplicateCheckResult, setDuplicateCheckResult] = useState<any>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // 블로그 이미지 정렬 핸들러
  const handleOrganizeBlogImages = async () => {
    if (!blogIdForOrganization) {
      alert('블로그 ID를 입력해주세요.');
      return;
    }

    if (!confirm(`블로그 ID ${blogIdForOrganization}의 이미지를 정렬하시겠습니까?`)) {
      return;
    }

    setIsOrganizingImages(true);

    try {
      // 1. 이미지 정렬 정보 조회
      const checkResponse = await fetch(`/api/admin/organize-images-by-blog?blogPostId=${blogIdForOrganization}`);
      if (!checkResponse.ok) {
        throw new Error('이미지 정렬 정보 조회 실패');
      }

      const checkData = await checkResponse.json();
      const result = checkData.results?.[0];
      const imageCount = result?.totalImages || 0;
      const extractedCount = result?.totalExtractedImages || imageCount;

      if (extractedCount === 0) {
        alert('이 블로그 글에 연결된 이미지가 없습니다.');
        setIsOrganizingImages(false);
        return;
      }

      // 2. 실제로 이미지 이동
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      let moveResponse;
      try {
        moveResponse = await fetch('/api/admin/organize-images-by-blog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blogPostId: blogIdForOrganization, moveImages: true }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('요청 시간 초과: 이미지 이동이 60초 이상 걸렸습니다.');
        }
        throw error;
      }

      if (!moveResponse.ok) {
        throw new Error('이미지 이동 실패');
      }

      const moveData = await moveResponse.json();
      const movedCount = moveData.summary?.moved || 0;
      const skippedCount = moveData.summary?.skipped || 0;
      const errorCount = moveData.summary?.errors || 0;

      if (errorCount > 0) {
        alert(`⚠️ 이미지 정렬 완료 (일부 오류 발생)\n\n이동: ${movedCount}개\n스킵: ${skippedCount}개\n오류: ${errorCount}개`);
      } else {
        alert(`✅ 이미지 정렬 완료!\n\n이동: ${movedCount}개\n스킵: ${skippedCount}개`);
      }

      // 이미지 목록 새로고침
      fetchImages(1, true, folderFilter, includeChildren, searchQuery);

    } catch (error: any) {
      console.error('❌ 이미지 정렬 오류:', error);
      alert(`이미지 정렬 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsOrganizingImages(false);
    }
  };

  // Phase 8: 폴더별 중복 제거 확인 핸들러
  const handleCheckAndRemoveDuplicates = async () => {
    // 현재 선택된 폴더 확인
    const currentFolder = folderFilter !== 'all' && folderFilter !== 'root' ? folderFilter : null;
    
    if (!currentFolder) {
      alert('중복 제거를 확인할 폴더를 선택해주세요.\n\n왼쪽 폴더 트리에서 폴더를 선택한 후 다시 시도해주세요.');
      return;
    }

    setIsCheckingDuplicates(true);
    setDuplicateCheckResult(null);

    try {
      // 1단계: 중복 감지
      const checkResponse = await fetch('/api/admin/check-and-remove-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderPath: currentFolder,
          action: 'check',
        }),
      });

      if (!checkResponse.ok) {
        throw new Error('중복 감지 실패');
      }

      const checkData = await checkResponse.json();

      if (checkData.summary.duplicateGroups === 0) {
        alert(`✅ 중복 이미지가 없습니다.\n\n폴더: ${currentFolder}\n전체 파일: ${checkData.summary.totalFiles}개`);
        setIsCheckingDuplicates(false);
        return;
      }

      if (checkData.summary.safeToRemove === 0) {
        alert(`⚠️ 중복 이미지가 있지만 안전하게 제거할 수 있는 파일이 없습니다.\n\n중복 그룹: ${checkData.summary.duplicateGroups}개\n모든 중복 이미지가 사용 중입니다.`);
        setIsCheckingDuplicates(false);
        return;
      }

      // 중복 그룹 및 제거 가능한 파일 표시
      setDuplicateCheckResult(checkData);
      setShowDuplicateModal(true);

    } catch (error: any) {
      console.error('❌ 중복 감지 오류:', error);
      alert(`중복 감지 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  // 블로그 중복 이미지 분석 핸들러
  const handleAnalyzeBlogDuplicates = async (blogPostIds?: number[]) => {
    setIsAnalyzingBlogDuplicates(true);
    setBlogDuplicateAnalysis(null);
    setSelectedDuplicateHashes(new Set());

    try {
      const response = await fetch('/api/admin/analyze-blog-duplicates-by-hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogPostIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || '분석 실패');
      }

      const data = await response.json();

      if (data.summary.duplicateGroupsCount === 0) {
        alert(`[완료] 중복 이미지가 없습니다.\n\n분석한 글: ${data.summary.totalBlogPosts}개\n이미지 URL: ${data.summary.totalUniqueImageUrls}개`);
        setIsAnalyzingBlogDuplicates(false);
        return;
      }

      setBlogDuplicateAnalysis(data);
      setShowBlogDuplicateModal(true);

    } catch (error: any) {
      console.error('[오류] 블로그 중복 이미지 분석 오류:', error);
      alert(`블로그 중복 이미지 분석 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsAnalyzingBlogDuplicates(false);
    }
  };

  // 블로그 중복 이미지 삭제 핸들러
  const handleRemoveBlogDuplicates = async () => {
    if (!blogDuplicateAnalysis || selectedDuplicateHashes.size === 0) {
      alert('삭제할 그룹을 선택해주세요.');
      return;
    }

    const selectedGroups = blogDuplicateAnalysis.deletionCandidates.filter((group: any) =>
      selectedDuplicateHashes.has(group.hash_md5)
    );
    const totalImagesToRemove = selectedGroups.reduce((sum: number, group: any) => sum + group.removeCount, 0);
    const totalSpaceToSave = selectedGroups.reduce((sum: number, group: any) => {
      return sum + group.imagesToRemove.reduce((groupSum: number, img: any) => groupSum + (img.size || 0), 0);
    }, 0);

    if (!confirm(`⚠️ 선택한 ${selectedDuplicateHashes.size}개 그룹의 ${totalImagesToRemove}개 중복 이미지를 삭제하시겠습니까?\n\n예상 절약 공간: ${(totalSpaceToSave / 1024 / 1024).toFixed(2)} MB\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    setIsRemovingDuplicates(true);

    try {
      const response = await fetch('/api/admin/remove-blog-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deletionCandidates: blogDuplicateAnalysis.deletionCandidates,
          selectedHashes: Array.from(selectedDuplicateHashes),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || '삭제 실패');
      }

      const result = await response.json();

      if (result.results.failed.length === 0) {
        alert(`[완료] ${result.summary.totalDeleted}개 이미지 삭제 완료!\n\n절약된 공간: ${(result.summary.totalSpaceSaved / 1024 / 1024).toFixed(2)} MB`);
      } else {
        alert(`[경고] ${result.summary.totalDeleted}개 삭제 완료, ${result.summary.totalFailed}개 실패\n\n${result.results.failed.map((f: any) => `${f.fileName}: ${f.error}`).join('\n')}`);
      }

      // 모달 닫기 및 목록 새로고침
      setShowBlogDuplicateModal(false);
      setBlogDuplicateAnalysis(null);
      setSelectedDuplicateHashes(new Set());
      setTimeout(() => {
        fetchImages(1, true, folderFilter, includeChildren, searchQuery, true);
      }, 500);

    } catch (error: any) {
      console.error('[오류] 블로그 중복 이미지 삭제 오류:', error);
      alert(`블로그 중복 이미지 삭제 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsRemovingDuplicates(false);
    }
  };

  // Phase 8-9-7: 확장자 기반 중복 확인 핸들러
  const handleCheckExtensionDuplicates = async () => {
    const currentFolder = folderFilter !== 'all' && folderFilter !== 'root' ? folderFilter : null;
    
    if (!currentFolder) {
      alert('확장자 중복을 확인할 폴더를 선택해주세요.\n\n왼쪽 폴더 트리에서 폴더를 선택한 후 다시 시도해주세요.');
      return;
    }

    setIsCheckingExtensionDuplicates(true);
    setExtensionDuplicateResult(null);

    try {
      const response = await fetch('/api/admin/detect-extension-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderPath: currentFolder,
          action: 'check',
        }),
      });

      if (!response.ok) {
        throw new Error('확장자 중복 감지 실패');
      }

      const data = await response.json();

      if (data.duplicateGroups.length === 0) {
        alert('[완료] 확장자 중복 이미지가 없습니다.\n\n폴더: ' + currentFolder + '\n전체 파일: ' + data.totalFiles + '개');
        setIsCheckingExtensionDuplicates(false);
        return;
      }

      setExtensionDuplicateResult(data);
      setShowExtensionDuplicateModal(true);

    } catch (error: any) {
      console.error('[오류] 확장자 중복 감지 오류:', error);
      alert(`확장자 중복 감지 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsCheckingExtensionDuplicates(false);
    }
  };

  // 확장자 중복 파일 삭제 핸들러 (JPG/PNG 지원)
  const handleRemoveExtensionDuplicates = async (fileIds: string[], format: 'jpg' | 'png' | 'both' = 'jpg') => {
    if (!extensionDuplicateResult) return;

    const removeCount = fileIds.length;
    const folderPath = extensionDuplicateResult.folderPath;
    const formatText = format === 'both' ? 'JPG/PNG' : format.toUpperCase();

    if (!confirm(`⚠️ ${removeCount}개 ${formatText} 파일을 삭제하시겠습니까?\n\n폴더: ${folderPath}\n\nWebP 우선 정책에 따라 사용하지 않는 ${formatText}만 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    setIsCheckingExtensionDuplicates(true);

    try {
      // JPG와 PNG 분리
      const jpgIds: string[] = [];
      const pngIds: string[] = [];
      
      // 중복 그룹에서 파일 형식 확인
      for (const group of extensionDuplicateResult.duplicateGroups || []) {
        for (const jpg of group.jpgFiles || []) {
          if (fileIds.includes(jpg.dbId)) {
            jpgIds.push(jpg.dbId);
          }
        }
        for (const png of group.pngFiles || []) {
          if (fileIds.includes(png.dbId)) {
            pngIds.push(png.dbId);
          }
        }
      }

      const response = await fetch('/api/admin/detect-extension-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderPath,
          action: 'remove',
          removeJpgIds: jpgIds.length > 0 ? jpgIds : undefined,
          removePngIds: pngIds.length > 0 ? pngIds : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('파일 삭제 실패');
      }

      const data = await response.json();

      if (data.errors.length === 0) {
        alert(`✅ 파일 삭제 완료!\n\n${data.message}`);
      } else {
        alert(`⚠️ 파일 삭제 완료 (일부 실패)\n\n삭제된 파일: ${data.removedFiles.length}개\n실패: ${data.errors.length}개`);
      }

      setShowExtensionDuplicateModal(false);
      setExtensionDuplicateResult(null);

      // 이미지 목록 새로고침
      setTimeout(() => {
        fetchImages(1, true, folderFilter, includeChildren, searchQuery);
      }, 100);

    } catch (error: any) {
      console.error('❌ 파일 삭제 오류:', error);
      alert(`파일 삭제 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsCheckingExtensionDuplicates(false);
    }
  };

  // Phase 5-7: 이미지 비교 핸들러 (통합: 1개는 확대, 2-3개는 비교)
  const handleCompareImages = async () => {
    if (selectedForCompare.size < 1 || selectedForCompare.size > 3) {
      alert('1-3개의 이미지를 선택해주세요.');
      return;
    }

    // 1개 선택 시: 확대 모달 열기
    if (selectedForCompare.size === 1) {
      const imageId = Array.from(selectedForCompare)[0];
      const image = images.find(img => img.id === imageId);
      if (image) {
        setSelectedImageForZoom(image);
        setSelectedForCompare(new Set()); // 선택 초기화
        return;
      }
    }

    // 2-3개 선택 시: 비교 모달 열기
    try {
      const imageIds = Array.from(selectedForCompare);
      
      // 🔧 임시 ID 필터링: temp-로 시작하는 ID는 제외
      const validImageIds = imageIds.filter(id => id && !id.startsWith('temp-'));
      const tempIds = imageIds.filter(id => id && id.startsWith('temp-'));
      
      if (tempIds.length > 0) {
        console.warn('⚠️ 임시 ID가 포함되어 있습니다:', tempIds);
        if (validImageIds.length === 0) {
          alert('선택한 이미지가 아직 데이터베이스에 저장되지 않았습니다.\n페이지를 새로고침 후 다시 시도해주세요.');
          return;
        }
        alert(`일부 이미지(${tempIds.length}개)는 아직 저장되지 않아 제외되었습니다.\n저장된 이미지(${validImageIds.length}개)만 비교합니다.`);
      }
      
      if (validImageIds.length === 0) {
        alert('비교할 수 있는 유효한 이미지가 없습니다.');
        return;
      }
      
      // 디버깅: 선택된 이미지 ID 확인
      console.log('🔍 비교할 이미지 ID (유효한 것만):', validImageIds);
      const selectedImagesData = images.filter(img => img.id && validImageIds.includes(img.id) && !img.id.startsWith('temp-'));
      console.log('🔍 선택된 이미지 데이터:', selectedImagesData.map(img => ({
        id: img.id,
        filename: img.name,
        url: img.url
      })));

      if (selectedImagesData.length !== validImageIds.length) {
        console.warn('⚠️ 일부 이미지를 찾을 수 없습니다:', {
          requested: validImageIds.length,
          found: selectedImagesData.length
        });
      }

      // 🔧 유효한 ID만 API로 전송
      const response = await fetch('/api/admin/compare-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds: validImageIds }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ 이미지 비교 API 오류:', errorData);
        throw new Error(errorData.error || errorData.details || '이미지 비교 실패');
      }

      const data = await response.json();
      
      if (!data.success || !data.comparison) {
        console.error('❌ 이미지 비교 응답 오류:', data);
        throw new Error(data.error || '이미지 비교 결과를 받을 수 없습니다');
      }

      console.log('✅ 이미지 비교 성공:', data.comparison);
      console.log('📊 비교 결과 이미지 데이터:');
      data.comparison.images.forEach((img: any, idx: number) => {
        console.log(`  이미지 ${idx + 1}:`, {
          id: img.id,
          filename: img.filename,
          usage: img.usage,
          usageCount: img.usageCount,
          usedInCount: img.usedIn?.length || 0,
          usedIn: img.usedIn
        });
      });
      
      setCompareResult(data.comparison);
      setShowCompareModal(true);
      setSelectedForCompare(new Set()); // 선택 초기화

    } catch (error: any) {
      console.error('❌ 이미지 비교 오류:', error);
      alert(`이미지 비교 중 오류가 발생했습니다:\n\n${error.message}\n\n콘솔을 확인해주세요.`);
    }
  };

  // 이미지 비교 선택 토글
  const toggleImageForCompare = (imageId: string) => {
    const newSelected = new Set(selectedForCompare);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      if (newSelected.size >= 3) {
        alert('최대 3개까지만 선택할 수 있습니다.');
        return;
      }
      newSelected.add(imageId);
    }
    setSelectedForCompare(newSelected);
  };

  // 중복 제거 실행 핸들러
  const handleRemoveDuplicates = async () => {
    if (!duplicateCheckResult || !duplicateCheckResult.safeToRemove || duplicateCheckResult.safeToRemove.length === 0) {
      return;
    }

    const removeCount = duplicateCheckResult.safeToRemove.length;
    const folderPath = duplicateCheckResult.folderPath;

    if (!confirm(`⚠️ ${removeCount}개 중복 파일을 삭제하시겠습니까?\n\n폴더: ${folderPath}\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    setIsCheckingDuplicates(true);

    try {
      const removeResponse = await fetch('/api/admin/check-and-remove-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderPath,
          action: 'remove',
        }),
      });

      if (!removeResponse.ok) {
        throw new Error('중복 제거 실패');
      }

      const removeData = await removeResponse.json();

      if (removeData.removeResults) {
        const { deleted, failed } = removeData.removeResults;
        if (failed === 0) {
          alert(`✅ 중복 이미지 제거 완료!\n\n삭제된 파일: ${deleted}개\n실패: ${failed}개`);
        } else {
          alert(`⚠️ 중복 이미지 제거 완료 (일부 실패)\n\n삭제된 파일: ${deleted}개\n실패: ${failed}개`);
        }
      }

      // 이미지 목록 새로고침 (무한 루핑 방지를 위해 setTimeout 사용)
      setTimeout(() => {
        fetchImages(1, true, folderFilter, includeChildren, searchQuery);
      }, 100);
      setShowDuplicateModal(false);
      setDuplicateCheckResult(null);

    } catch (error: any) {
      console.error('❌ 중복 제거 오류:', error);
      alert(`중복 제거 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  // Phase 8: 퍼널 이미지 마이그레이션 핸들러
  const handleCampaignImageMigration = async () => {
    if (!confirm('월별 퍼널 이미지를 Supabase Storage로 마이그레이션하시겠습니까?\n\n이 작업은 다음을 수행합니다:\n1. Storage 폴더 구조 생성\n2. 이미지 업로드 및 메타데이터 생성\n3. HTML 파일 URL 업데이트\n4. 블로그 본문 URL 업데이트\n\n시간이 소요될 수 있습니다.')) {
      return;
    }

    setIsMigratingCampaigns(true);
    setCampaignMigrationProgress({ step: 'init', message: '마이그레이션 시작...' });
    setCampaignMigrationResult(null);

    try {
      const months = ['2025-05', '2025-06', '2025-07', '2025-08', '2025-09'];
      const results: any[] = [];

      // 1단계: 폴더 구조 생성
      setCampaignMigrationProgress({ step: 'folders', message: 'Storage 폴더 구조 생성 중...' });
      const folderResponse = await fetch('/api/admin/create-campaign-folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!folderResponse.ok) {
        throw new Error('폴더 구조 생성 실패');
      }

      const folderData = await folderResponse.json();
      results.push({ step: 'folders', ...folderData });

      // 2단계: 각 월별 이미지 마이그레이션
      for (let i = 0; i < months.length; i++) {
        const month = months[i];
        setCampaignMigrationProgress({
          step: 'migrate',
          month,
          current: i + 1,
          total: months.length,
          message: `${month} 이미지 마이그레이션 중...`,
        });

        const migrateResponse = await fetch('/api/admin/migrate-campaign-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ month }),
        });

        if (!migrateResponse.ok) {
          console.error(`⚠️ ${month} 마이그레이션 실패`);
          results.push({ step: 'migrate', month, error: '마이그레이션 실패' });
          continue;
        }

        const migrateData = await migrateResponse.json();
        results.push({ step: 'migrate', month, ...migrateData });
      }

      // 3단계: HTML 파일 URL 업데이트
      setCampaignMigrationProgress({ step: 'html', message: 'HTML 파일 URL 업데이트 중...' });
      for (const month of months) {
        const htmlResponse = await fetch('/api/admin/update-funnel-image-urls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ month }),
        });

        if (htmlResponse.ok) {
          const htmlData = await htmlResponse.json();
          results.push({ step: 'html', month, ...htmlData });
        }
      }

      // 4단계: 블로그 본문 URL 업데이트
      setCampaignMigrationProgress({ step: 'blog', message: '블로그 본문 URL 업데이트 중...' });
      for (const month of months) {
        const blogResponse = await fetch('/api/admin/update-blog-campaign-urls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ month }),
        });

        if (blogResponse.ok) {
          const blogData = await blogResponse.json();
          results.push({ step: 'blog', month, ...blogData });
        }
      }

      // 결과 요약
      const summary = {
        folders: folderData.summary,
        migrated: results.filter((r) => r.step === 'migrate').reduce((sum, r) => {
          return {
            total: (sum.total || 0) + (r.summary?.total || 0),
            uploaded: (sum.uploaded || 0) + (r.summary?.uploaded || 0),
            skipped: (sum.skipped || 0) + (r.summary?.skipped || 0),
            errors: (sum.errors || 0) + (r.summary?.errors || 0),
          };
        }, { total: 0, uploaded: 0, skipped: 0, errors: 0 }),
        html: results.filter((r) => r.step === 'html').length,
        blog: results.filter((r) => r.step === 'blog').reduce((sum, r) => sum + (r.summary?.totalUpdates || 0), 0),
      };

      setCampaignMigrationResult({ success: true, summary, results });
      setCampaignMigrationProgress({ step: 'complete', message: '마이그레이션 완료!' });

      alert(`✅ 퍼널 이미지 마이그레이션 완료!\n\n폴더 생성: ${summary.folders.created}개\n이미지 업로드: ${summary.migrated.uploaded}개\n스킵: ${summary.migrated.skipped}개\n오류: ${summary.migrated.errors}개\nHTML 업데이트: ${summary.html}개 파일\n블로그 업데이트: ${summary.blog}개 URL`);

      // 이미지 목록 새로고침
      fetchImages(1, true, folderFilter, includeChildren, searchQuery);

    } catch (error: any) {
      console.error('❌ 퍼널 이미지 마이그레이션 오류:', error);
      setCampaignMigrationResult({ success: false, error: error.message });
      setCampaignMigrationProgress({ step: 'error', message: `오류: ${error.message}` });
      alert(`퍼널 이미지 마이그레이션 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsMigratingCampaigns(false);
    }
  };

  // 블로그 메타데이터 동기화 핸들러
  const handleSyncBlogMetadata = async () => {
    if (!blogIdForOrganization) {
      alert('블로그 ID를 입력해주세요.');
      return;
    }

    if (!confirm(`블로그 ID ${blogIdForOrganization}의 이미지 메타데이터를 동기화하시겠습니까?`)) {
      return;
    }

    setIsSyncingBlogMetadata(true);

    try {
      const response = await fetch('/api/admin/sync-metadata-by-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogPostId: blogIdForOrganization })
      });

      if (!response.ok) {
        throw new Error('메타데이터 동기화 실패');
      }

      const data = await response.json();
      const syncedCount = data.summary?.synced || 0;
      const skippedCount = data.summary?.skipped || 0;
      const errorCount = data.summary?.errors || 0;

      if (errorCount > 0) {
        alert(`⚠️ 메타데이터 동기화 완료 (일부 오류 발생)\n\n동기화: ${syncedCount}개\n스킵: ${skippedCount}개\n오류: ${errorCount}개`);
      } else {
        alert(`✅ 메타데이터 동기화 완료!\n\n동기화: ${syncedCount}개\n스킵: ${skippedCount}개`);
      }

      // 이미지 목록 새로고침
      fetchImages(1, true, folderFilter, includeChildren, searchQuery);

    } catch (error: any) {
      console.error('❌ 메타데이터 동기화 오류:', error);
      alert(`메타데이터 동기화 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsSyncingBlogMetadata(false);
    }
  };

  // 검색 및 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  // 검색어 디바운싱 (500ms 지연)
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [filterType, setFilterType] = useState<'all' | 'featured' | 'unused' | 'duplicates' | 'category' | 'logos'>('all');
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
  
  // Phase 8: 퍼널 이미지 마이그레이션 상태
  const [isMigratingCampaigns, setIsMigratingCampaigns] = useState(false);
  const [campaignMigrationProgress, setCampaignMigrationProgress] = useState<{
    step: string;
    month?: string;
    current?: number;
    total?: number;
    message?: string;
  } | null>(null);
  const [campaignMigrationResult, setCampaignMigrationResult] = useState<any>(null);
  
  // 블로그 이미지 분석 상태
  const [isAnalyzingBlogImages, setIsAnalyzingBlogImages] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');
  
  // 폴더 목록 상태 (Storage에서 직접 가져오기)
  const [availableFolders, setAvailableFolders] = useState<string[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(true);
  const [folderLoadError, setFolderLoadError] = useState<string | null>(null);
  const [folderLoadProgress, setFolderLoadProgress] = useState<string>('');
  
  // Storage에서 실제 폴더 목록 가져오기 (최적화: 메타데이터 기반 + 캐싱)
  useEffect(() => {
    const fetchFolders = async (retryCount = 0) => {
      setIsLoadingFolders(true);
      setFolderLoadError(null);
      setFolderLoadProgress('폴더 목록 조회 중...');
      const startTime = Date.now();
      
      try {
        // 타임아웃 설정 (60초)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);
        
        setFolderLoadProgress('서버에서 폴더 정보를 가져오는 중...');
        const response = await fetch('/api/admin/folders-list', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        if (response.ok && data.folders && Array.isArray(data.folders)) {
          setFolderLoadProgress('폴더 트리 구성 중...');
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`✅ 폴더 목록 로드 성공: ${data.folders.length}개 (${elapsed}초, 캐시: ${data.cached ? '사용' : '신규'})`);
          setAvailableFolders(data.folders);
          setIsLoadingFolders(false);
          setFolderLoadError(null);
          setFolderLoadProgress('');
          return;
        }
        
        // 에러 처리 (명확히 표시)
        if (data.timeout) {
          setFolderLoadError('폴더 목록 조회 시간 초과');
          setFolderLoadProgress('시간 초과 - 재시도 중...');
          
          // 재시도 (최대 3회)
          if (retryCount < 3) {
            setTimeout(() => {
              fetchFolders(retryCount + 1);
            }, 3000);
            return;
          }
        } else {
          setFolderLoadError(data.error || '폴더 목록을 불러올 수 없습니다');
          setFolderLoadProgress('');
        }
        
        setIsLoadingFolders(false);
      } catch (error: any) {
        console.error('❌ 폴더 목록 로드 오류:', error);
        
        if (error.name === 'AbortError') {
          setFolderLoadError('요청 시간 초과');
          setFolderLoadProgress('시간 초과 - 재시도 중...');
          
          // 재시도 (최대 3회)
          if (retryCount < 3) {
            setTimeout(() => {
              fetchFolders(retryCount + 1);
            }, 3000);
            return;
          }
        } else {
          setFolderLoadError('폴더 목록을 불러올 수 없습니다');
          setFolderLoadProgress('');
        }
        
        setIsLoadingFolders(false);
      }
    };
    
    fetchFolders();
  }, []); // 컴포넌트 마운트 시 한 번만 실행
  
  // 초기 로드 (컴포넌트 마운트 시 한 번만 실행)
  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      // 초기 로드: 검색어 없이 전체 이미지 로드
      fetchImages(1, true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // 디바운스된 검색어가 변경될 때만 검색 실행
  useEffect(() => {
    // 초기 로드가 완료된 후에만 검색 실행 (초기 로드 시에는 실행하지 않음)
    if (initialLoadRef.current) {
      return; // 초기 로드는 위의 useEffect에서 처리
    }
    // 디바운스된 검색어가 변경되었을 때만 검색 실행
    if (debouncedSearchQuery.trim() !== '') {
      fetchImages(1, true, folderFilter, includeChildren, debouncedSearchQuery);
    } else {
      // 검색어가 비어있으면 전체 이미지 로드
      fetchImages(1, true, folderFilter, includeChildren, '');
    }
  }, [debouncedSearchQuery]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // 폴더 필터 또는 하위 폴더 포함 옵션이 변경될 때 검색어를 유지하면서 재검색
  useEffect(() => {
    // 초기 로드가 완료된 후에만 실행
    if (initialLoadRef.current) {
      return; // 초기 로드는 위의 useEffect에서 처리
    }
    fetchImages(1, true, folderFilter, includeChildren, searchQuery);
  }, [folderFilter, includeChildren]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // 가상화를 위한 상태
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);

  // 필터링된 이미지 계산 (성능 최적화)
  const filteredImages = useMemo(() => {
    let filtered = images;
    
    // 검색 필터는 서버 사이드에서 처리하므로 클라이언트 사이드 검색 제거
    // (검색어가 있을 때는 서버에서 이미 필터링된 결과만 받음)
    
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
          // 🔗 링크된 이미지는 folder_path 필터를 우회 (항상 표시)
          const isLinked = (img as any).is_linked === true;
          if (isLinked) {
            // 링크된 이미지는 항상 표시 (원본 폴더는 original_folder에 있음)
            return true;
          }
          
          // 일반 이미지는 folder_path로 필터링
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
      case 'logos':
        // 로고만 필터링 (is_logo = true 또는 folder_path가 originals/logos로 시작)
        filtered = filtered.filter(img => {
          // image_metadata의 is_logo 필드 확인
          if (img.is_logo === true) {
            return true;
          }
          // folder_path로 확인 (originals/logos로 시작)
          if (img.folder_path && img.folder_path.startsWith('originals/logos')) {
            return true;
          }
          return false;
        });
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
  }, [images, filterType, folderFilter, selectedCategoryFilter, dynamicCategories, sortBy, sortOrder]);
  // searchQuery는 의존성에서 제거 (서버 사이드 검색 사용)
  
  // 복사/붙여넣기 상태
  const [copiedImages, setCopiedImages] = useState<ImageMetadata[]>([]);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteTargetFolder, setPasteTargetFolder] = useState<string | null>(null);
  
  // 폴더 관리 UI 상태
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  // 이미지 추가 모달
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeAddTab, setActiveAddTab] = useState<'upload' | 'url' | 'ai'>('upload');
  const [pending, setPending] = useState(false);
  const [addUrl, setAddUrl] = useState('');
  const [selectedUploadFolder, setSelectedUploadFolder] = useState<string>('');
  const [uploadMode, setUploadMode] = useState<'auto' | 'preserve-name' | 'preserve-original'>('auto'); // 업로드 모드
  const [aiBrandTone, setAiBrandTone] = useState<'senior_emotional' | 'high_tech_innovative'>('senior_emotional');
  
  // 모달 열 때 현재 폴더 자동 설정
  const handleOpenAddModal = () => {
    // 현재 선택된 폴더를 기본값으로 설정
    const currentFolder = folderFilter && folderFilter !== 'all' && folderFilter !== 'root' 
      ? folderFilter 
      : `uploaded/${new Date().toISOString().slice(0, 7)}/${new Date().toISOString().slice(0, 10)}`;
    
    setSelectedUploadFolder(currentFolder);
    setShowAddModal(true);
    setActiveAddTab('upload'); // 기본 탭은 업로드
  };
  
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
  
  // 기존 이미지 변형 관련 상태
  const [showExistingImageModal, setShowExistingImageModal] = useState(false);
  const [selectedExistingImage, setSelectedExistingImage] = useState('');
  const [activeImageTab, setActiveImageTab] = useState<'upload' | 'gallery' | 'url'>('upload');
  const [isGeneratingExistingVariation, setIsGeneratingExistingVariation] = useState(false);
  const [variationPrompt, setVariationPrompt] = useState('');
  const [variationPreset, setVariationPreset] = useState('creative');
  
  // 블로그 스타일 이미지 변형 관련 상태 (추가)
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [showGeneratedImages, setShowGeneratedImages] = useState(false);
  const [imageGenerationPrompt, setImageGenerationPrompt] = useState('');
  const [selectedBaseImage, setSelectedBaseImage] = useState('');
  const [isGeneratingVariation, setIsGeneratingVariation] = useState(false);
  const [imageGenerationStep, setImageGenerationStep] = useState('');
  const [imageGenerationModel, setImageGenerationModel] = useState('');
  const [showGenerationProcess, setShowGenerationProcess] = useState(false);
  
  // Replicate 변형 관련 상태 (프롬프트 입력 불가, 빠르고 간단)
  const [isGeneratingReplicateVariation, setIsGeneratingReplicateVariation] = useState(false);
  
  // Nanobanana 변형 관련 상태
  const [isGeneratingNanobananaVariation, setIsGeneratingNanobananaVariation] = useState(false);
  
  // 프롬프트 입력 모달 관련 상태
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptModalType, setPromptModalType] = useState<'fal' | 'replicate' | 'nanobanana' | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  
  // 업스케일링 관련 상태
  const [isUpscaling, setIsUpscaling] = useState(false);
  
  // 이미지 회전 관련 상태
  const [showRotateMenu, setShowRotateMenu] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  
  // 이미지 변환 관련 상태
  const [showConvertMenu, setShowConvertMenu] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [upscaleModel, setUpscaleModel] = useState<'fal' | 'replicate'>('fal');
  const [upscaleScale, setUpscaleScale] = useState<2 | 4>(2);
  const [navigateSelectedOnly, setNavigateSelectedOnly] = useState(false);
  const [metadataAnimation, setMetadataAnimation] = useState(false);
  const [thumbnailSelectMode, setThumbnailSelectMode] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const thumbnailStripRef = useRef<HTMLDivElement>(null);

  // 이미지의 고유 식별자 생성 (id가 있으면 사용, 없으면 name만 사용)
  const getImageUniqueId = (image: ImageMetadata) => {
    return image.id || image.name;
  };

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // 회전 메뉴가 열려있고, 클릭이 메뉴 외부인 경우
      if (showRotateMenu) {
        const rotateMenu = document.querySelector('[data-rotate-menu]');
        const rotateButton = document.querySelector('[data-rotate-button]');
        if (rotateMenu && rotateButton && 
            !rotateMenu.contains(target) && 
            !rotateButton.contains(target)) {
          setShowRotateMenu(false);
        }
      }
      // 변환 메뉴가 열려있고, 클릭이 메뉴 외부인 경우
      if (showConvertMenu) {
        const convertMenu = document.querySelector('[data-convert-menu]');
        const convertButton = document.querySelector('[data-convert-button]');
        if (convertMenu && convertButton && 
            !convertMenu.contains(target) && 
            !convertButton.contains(target)) {
          setShowConvertMenu(false);
        }
      }
    };

    if (showRotateMenu || showConvertMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showRotateMenu, showConvertMenu]);

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
    const [isLoaded, setIsLoaded] = useState(false);
    
    useEffect(() => {
      if (imgRef.current && imageObserver) {
        imageObserver.observe(imgRef.current);
      }
    }, [imageObserver]);
    
    // 배포 환경에서 지연 로딩이 작동하지 않을 수 있으므로, 
    // Intersection Observer가 작동하지 않는 경우를 대비해 즉시 로드도 시도
    useEffect(() => {
      if (imgRef.current && src && !isLoaded) {
        const img = imgRef.current;
        const dataSrc = img.dataset.src;
        if (dataSrc && !img.src) {
          // Intersection Observer가 이미 처리했는지 확인
          if (!img.src || img.src === window.location.href) {
            img.src = dataSrc;
            setIsLoaded(true);
          }
        }
      }
    }, [src, isLoaded]);
    
    return (
      <img
        ref={imgRef}
        data-src={src}
        src={src} // 배포 환경 호환성을 위해 src도 직접 설정
        alt={alt}
        className={className}
        loading="lazy" // 네이티브 지연 로딩도 활성화
        {...props}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          // data-src가 있으면 다시 시도
          if (target.dataset.src && target.src !== target.dataset.src) {
            target.src = target.dataset.src;
          } else {
            target.src = '/placeholder-image.jpg';
          }
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
  // 비교 모달 개별 삭제 확인 모달
  const [showCompareDeleteConfirm, setShowCompareDeleteConfirm] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<any>(null);
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

  // 단일 이미지의 사용 위치 정보 가져오기 (상세보기 모달용)
  const fetchImageUsageInfo = async (imageUrl: string): Promise<ImageMetadata | null> => {
    try {
      const response = await fetch(`/api/admin/all-images?limit=1&offset=0&includeUsageInfo=true&searchQuery=${encodeURIComponent(imageUrl)}`);
      const data = await response.json();
      
      if (response.ok && data.images && data.images.length > 0) {
        return data.images[0];
      }
      return null;
    } catch (error) {
      console.error('❌ 사용 위치 정보 로드 에러:', error);
      return null;
    }
  };

  // 이미지 로드
  const fetchImages = async (page = 1, reset = false, customFolderFilter?: string, customIncludeChildren?: boolean, customSearchQuery?: string, forceRefresh?: boolean) => {
    try {
      if (reset || page === 1) {
        setIsLoading(true);
        // 새로고침 시 필터를 "전체"로 초기화 (단, 검색어는 보존)
        if (reset && customSearchQuery === undefined) {
          setFilterType('all');
          setSearchQuery('');
        }
      } else {
        setIsLoadingMore(true);
      }
      
      // 커스텀 파라미터가 있으면 사용, 없으면 현재 상태 사용
      const effectiveFolderFilter = customFolderFilter !== undefined ? customFolderFilter : folderFilter;
      const effectiveIncludeChildren = customIncludeChildren !== undefined ? customIncludeChildren : includeChildren;
      const effectiveSearchQuery = customSearchQuery !== undefined ? customSearchQuery : searchQuery;
      
      const offset = (page - 1) * imagesPerPage;
      const prefix = effectiveFolderFilter === 'all' ? '' : (effectiveFolderFilter === 'root' ? '' : encodeURIComponent(effectiveFolderFilter));
      
      // 검색어 파라미터 추가
      const searchParam = effectiveSearchQuery.trim() ? `&searchQuery=${encodeURIComponent(effectiveSearchQuery.trim())}` : '';
      
      // 캐시 무효화 파라미터 추가
      const refreshParam = forceRefresh ? `&forceRefresh=true` : '';
      
      // 디버깅 로그
      if (customFolderFilter !== undefined || customIncludeChildren !== undefined || customSearchQuery !== undefined || forceRefresh) {
        console.log('🔄 fetchImages 호출:', {
          customFolderFilter,
          effectiveFolderFilter,
          prefix,
          customIncludeChildren,
          effectiveIncludeChildren,
          customSearchQuery,
          effectiveSearchQuery,
          forceRefresh
        });
      }
      
      const response = await fetch(`/api/admin/all-images?limit=${imagesPerPage}&offset=${offset}&prefix=${prefix}&includeChildren=${effectiveIncludeChildren}&includeUsageInfo=false${searchParam}${refreshParam}`);
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

        // 🔧 중복 제거 로직 개선: file_path 또는 (name + url) 기준으로 중복 제거
        const deduplicateImages = (imageList: any[]) => {
          const seen = new Set<string>();
          const uniqueImages: any[] = [];
          
          for (const img of imageList) {
            // 1차: file_path 기준 (가장 정확)
            const key1 = img.file_path || img.folder_path 
              ? `${img.file_path || img.folder_path}/${img.name || img.filename}`
              : null;
            
            // 2차: name + url 기준
            const key2 = `${img.name || img.filename || ''}-${img.url || ''}`;
            
            // 3차: cdn_url 기준
            const key3 = img.cdn_url || img.url || '';
            
            // 중복 확인 (우선순위: file_path > name+url > cdn_url)
            const uniqueKey = key1 || key2 || key3;
            
            if (uniqueKey && !seen.has(uniqueKey)) {
              seen.add(uniqueKey);
              uniqueImages.push(img);
            } else if (uniqueKey) {
              // 중복 발견 (디버깅용)
              console.log('🔍 중복 이미지 제거:', {
                name: img.name || img.filename,
                url: img.url?.substring(0, 60),
                file_path: img.file_path || img.folder_path,
              });
            }
          }
          
          if (uniqueImages.length !== imageList.length) {
            const removedCount = imageList.length - uniqueImages.length;
            console.log(`✅ 중복 제거 완료: ${removedCount}개 제거 (${imageList.length} → ${uniqueImages.length})`);
          }
          
          return uniqueImages;
        };

        const uniqueImages = deduplicateImages(imagesWithMetadata);

        if (reset || page === 1) {
          setImages(uniqueImages);
          setCurrentPage(1);
        } else {
          setImages(prev => {
            // 기존 이미지와 새 이미지 합치기 (중복 제거)
            const existingKeys = new Set(
              prev.map(img => {
                const key1 = img.file_path || img.folder_path 
                  ? `${img.file_path || img.folder_path}/${img.name || img.filename}`
                  : null;
                return key1 || `${img.name || img.filename || ''}-${img.url || ''}` || img.cdn_url || img.url || '';
              })
            );
            
            const newImages = uniqueImages.filter(img => {
              const key1 = img.file_path || img.folder_path 
                ? `${img.file_path || img.folder_path}/${img.name || img.filename}`
                : null;
              const key = key1 || `${img.name || img.filename || ''}-${img.url || ''}` || img.cdn_url || img.url || '';
              return !existingKeys.has(key);
            });
            
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

  // 상세보기 모달이 열릴 때 사용 위치 정보 가져오기
  useEffect(() => {
    if (selectedImageForZoom && (!selectedImageForZoom.used_in || selectedImageForZoom.used_in.length === 0)) {
      // 사용 위치 정보가 없으면 가져오기
      const imageUrl = selectedImageForZoom.url || selectedImageForZoom.original_url || '';
      if (imageUrl) {
        fetchImageUsageInfo(imageUrl).then((imageWithUsage) => {
          if (imageWithUsage && imageWithUsage.used_in) {
            setSelectedImageForZoom(prev => prev ? {
              ...prev,
              used_in: imageWithUsage.used_in,
              usage_count: imageWithUsage.usage_count || prev.usage_count
            } : null);
          }
        });
      }
    }
  }, [selectedImageForZoom]);

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

  // currentPage 변경 시 추가 이미지 로드 (초기 로드는 위에서 처리)
  useEffect(() => {
    if (initialLoadRef.current) {
      return; // 초기 로드는 위의 useEffect에서 처리
    }
    if (currentPage > 1) {
      // 페이지 변경 시 추가 로드
      fetchImages(currentPage);
    }
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // 성능 모니터링
  const [performanceMetrics, setPerformanceMetrics] = useState({
    loadTime: 0,
    imageCount: 0,
    cacheHitRate: 0
  });

  // 초기 로드 (성능 최적화) - fetchImages는 다른 useEffect에서 처리하므로 제거
  useEffect(() => {
    const startTime = performance.now();
    
    const initializeGallery = async () => {
      try {
        // 병렬로 데이터 로드 (fetchImages는 initialLoadRef useEffect에서 처리)
        await Promise.all([
          // fetchImages(1, true), // initialLoadRef useEffect에서 처리하므로 제거
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
    // 일반 선택 토글
    const imageId = getImageUniqueId(image);
    const newSelected = new Set(selectedImages);
    
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      newSelected.add(imageId);
    }
    setSelectedImages(newSelected);
    
    // 비교 선택도 함께 업데이트 (최대 3개까지)
    if (image.id) {
      const newCompareSelected = new Set(selectedForCompare);
      if (newSelected.has(imageId)) {
        if (newCompareSelected.size < 3) {
          newCompareSelected.add(image.id);
        } else {
          // 3개 초과 시 알림
          alert('비교는 최대 3개까지만 선택할 수 있습니다.');
          return;
        }
      } else {
        newCompareSelected.delete(image.id);
      }
      setSelectedForCompare(newCompareSelected);
    }
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedImages.size === filteredImages.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(filteredImages.map(img => getImageUniqueId(img))));
    }
  };

  // 블로그 스타일 이미지 불러오기 및 프롬프트 생성 함수 (추가)
  const handleLoadExistingImageAndPrompt = async () => {
    if (!selectedExistingImage) {
      alert('불러올 이미지를 선택해주세요.');
      return;
    }

    setIsGeneratingExistingVariation(true);
    setImageGenerationStep('이미지와 프롬프트 불러오는 중...');
    setImageGenerationModel('이미지 불러오기');
    setShowGenerationProcess(true);

    try {
      // 기존 이미지의 프롬프트가 있는지 확인
      let prompt = '';
      try {
        const promptResponse = await fetch('/api/get-image-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: selectedExistingImage })
        });
        
        if (promptResponse.ok) {
          const promptData = await promptResponse.json();
          prompt = promptData.prompt || '';
        }
      } catch (error) {
        console.warn('기존 프롬프트 조회 실패, AI로 생성:', error);
      }

      // 프롬프트가 없으면 AI로 생성
      if (!prompt) {
        setImageGenerationStep('이미지 분석 및 프롬프트 생성 중...');
        
        // 이미지가 골프 관련인지 일반 이미지인지 판단 (간단한 휴리스틱)
        // 실제로는 이미지 분석 API를 통해 판단해야 하지만, 여기서는 URL이나 메타데이터로 판단
        const isGolfImage = selectedExistingImage.includes('golf') || 
                           selectedExistingImage.includes('골프') ||
                           selectedExistingImage.includes('driver') ||
                           selectedExistingImage.includes('club');
        
        const analysisEndpoint = isGolfImage 
          ? '/api/analyze-image-prompt'  // 골프 이미지용
          : '/api/analyze-image-general'; // 일반 이미지용
        
        const analysisResponse = await fetch(analysisEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            imageUrl: selectedExistingImage,
            title: '갤러리 이미지 변형',
            excerpt: '갤러리에서 변형된 이미지'
          })
        });

        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          // analyze-image-prompt는 prompt 필드를, analyze-image-general은 다른 구조를 반환할 수 있음
          prompt = analysisData.prompt || analysisData.englishPrompt || '';
        }
      }

      // 프롬프트 미리보기에 표시
      setImageGenerationPrompt(prompt);
      
      // 선택된 이미지를 "생성된 이미지" 섹션에 추가
      setGeneratedImages(prev => [selectedExistingImage, ...prev]);
      setShowGeneratedImages(true);
      
      // 모달 닫고 상태 초기화
      setShowExistingImageModal(false);
      setSelectedExistingImage('');
      setActiveImageTab('upload');
      setImageGenerationStep('');
      setIsGeneratingExistingVariation(false);
      setShowGenerationProcess(false);
      
      alert('✅ 이미지와 프롬프트가 불러와졌습니다!\n\n📸 "생성된 이미지" 섹션에서 이미지 확인\n✏️ "프롬프트 미리보기"에서 프롬프트 수정 가능\n🎨 AI 이미지 생성 버튼으로 변형 시작');
      return;
    } catch (error: any) {
      console.error('이미지 불러오기 오류:', error);
      alert('이미지 불러오기 중 오류가 발생했습니다: ' + (error as any).message);
    } finally {
      setIsGeneratingExistingVariation(false);
      setTimeout(() => {
        setShowGenerationProcess(false);
        setImageGenerationStep('');
      }, 2000);
    }
  };

  // 이미지 변형 관련 함수들 (추가)
  const generateImageVariation = async (model: 'FAL AI' | 'Replicate Flux' | 'Stability AI') => {
    if (!selectedBaseImage) {
      alert('변형할 기본 이미지를 선택해주세요.');
      return;
    }

    setIsGeneratingVariation(true);
    setImageGenerationStep(`${model}로 이미지 변형 중...`);
    setImageGenerationModel(model);
    setShowGenerationProcess(true);

    try {
      let apiEndpoint = '';
      let requestBody = {
        title: '갤러리 이미지 변형',
        excerpt: '갤러리에서 변형된 이미지',
        contentType: 'gallery',
        brandStrategy: 'professional',
        baseImageUrl: selectedBaseImage,
        prompt: imageGenerationPrompt || undefined,
        variationCount: 1
      };

      switch (model) {
        case 'FAL AI':
          apiEndpoint = '/api/generate-blog-image-fal-variation';
          break;
        case 'Replicate Flux':
          apiEndpoint = '/api/generate-blog-image-replicate-flux';
          break;
        case 'Stability AI':
          apiEndpoint = '/api/generate-blog-image-stability';
          break;
        default:
          throw new Error('지원하지 않는 모델입니다.');
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.images && result.images.length > 0) {
          // 변형된 이미지들을 Supabase에 저장
          const savedImages = [];
          for (let i = 0; i < result.images.length; i++) {
            try {
              const saveResponse = await fetch('/api/save-generated-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  imageUrl: result.images[i].originalUrl || result.images[i],
                  fileName: `${model.toLowerCase().replace(' ', '-')}-variation-${Date.now()}-${i + 1}.png`,
                  blogPostId: null
                })
              });
              
              if (saveResponse.ok) {
                const { storedUrl } = await saveResponse.json();
                savedImages.push(storedUrl);
              } else {
                savedImages.push(result.images[i].originalUrl || result.images[i]);
              }
            } catch (error) {
              console.warn(`이미지 ${i + 1} 저장 실패:`, error);
              savedImages.push(result.images[i].originalUrl || result.images[i]);
            }
          }
          
          setGeneratedImages(prev => [...prev, ...savedImages]);
          setShowGeneratedImages(true);
          
          // ✅ 모달 닫기 (확대 모달이 열려있는 경우)
          setSelectedImageForZoom(null);
          
          // ✅ "전체 폴더"로 리셋
          setFolderFilter('all');
          setIncludeChildren(true);
          
          // ✅ 이미지 목록 새로고침 (캐시 무효화 포함)
          fetchImages(1, true, 'all', true, '', true);
          
          alert(`${model} 변형이 완료되었습니다! ${savedImages.length}개의 이미지가 생성되었습니다.`);
        } else {
          throw new Error('변형된 이미지가 생성되지 않았습니다.');
        }
      } else {
        const error = await response.json();
        throw new Error(error.message || '이미지 변형에 실패했습니다.');
      }
    } catch (error: any) {
      console.error(`${model} 이미지 변형 오류:`, error);
      alert(`${model} 이미지 변형 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsGeneratingVariation(false);
      setTimeout(() => {
        setShowGenerationProcess(false);
        setImageGenerationStep('');
      }, 2000);
    }
  };

  // Nanobanana 변형 함수 (원본 스타일 유지에 최적화)
  const generateNanobananaVariation = async (imageUrl: string, imageName: string, imageFolderPath?: string, customPrompt?: string) => {
    if (!imageUrl) {
      alert('변형할 이미지를 선택해주세요.');
      return;
    }

    if (isGeneratingNanobananaVariation) {
      alert('이미 변형 중입니다. 잠시만 기다려주세요.');
      return;
    }

    setIsGeneratingNanobananaVariation(true);
    setImageGenerationStep('Nanobanana로 이미지 변형 중...');
    setImageGenerationModel('Nanobanana (원본 스타일 유지)');
    setShowGenerationProcess(true);

    try {
      const response = await fetch('/api/vary-nanobanana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: imageUrl,
          prompt: customPrompt || undefined,
          preserveStyle: true,
          numImages: 1,
          aspectRatio: '1:1',
          outputFormat: 'jpeg',
          quality: 90,
          title: '갤러리 이미지 변형',
          excerpt: 'Nanobanana로 변형된 이미지',
          contentType: 'gallery',
          brandStrategy: 'professional',
          originalImageFolder: imageFolderPath || selectedImageForZoom?.folder_path || null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.details || '이미지 변형 실패');
      }

      const result = await response.json();
      
      if (result.imageUrl) {
        // selectedImageForZoom을 변형된 이미지로 업데이트 (모달 유지)
        if (selectedImageForZoom) {
          setSelectedImageForZoom({
            ...selectedImageForZoom,
            url: result.imageUrl,
            name: result.fileName || selectedImageForZoom.name,
            folder_path: imageFolderPath || selectedImageForZoom.folder_path
          });
        }
        
        // 이미지 목록 새로고침
        fetchImages(1, true, folderFilter, includeChildren, searchQuery, true);
        
        alert('✅ Nanobanana 변형이 완료되었습니다!');
      } else {
        throw new Error('변형된 이미지가 생성되지 않았습니다.');
      }
    } catch (error: any) {
      console.error('❌ Nanobanana 변형 오류:', error);
      alert('Nanobanana 변형 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsGeneratingNanobananaVariation(false);
      setTimeout(() => {
        setShowGenerationProcess(false);
        setImageGenerationStep('');
      }, 2000);
    }
  };

  // 편집 시작
  // Replicate 변형 함수 (프롬프트 입력 불가, 빠르고 간단)
  const generateReplicateVariation = async (imageUrl: string, imageName: string, imageFolderPath?: string) => {
    if (!imageUrl) {
      alert('변형할 이미지를 선택해주세요.');
      return;
    }

    if (isGeneratingReplicateVariation) {
      alert('이미 변형 중입니다. 잠시만 기다려주세요.');
      return;
    }

    if (!confirm(`"${imageName}" 이미지를 Replicate 방식으로 변형하시겠습니까?\n\n(프롬프트 입력 없이 빠르게 변형됩니다)`)) {
      return;
    }

    setIsGeneratingReplicateVariation(true);
    try {
      const response = await fetch('/api/generate-blog-image-replicate-flux', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '갤러리 이미지 변형',
          excerpt: '갤러리에서 변형된 이미지',
          contentType: 'gallery',
          brandStrategy: 'professional',
          baseImageUrl: imageUrl,
          variationStrength: 0.8,
          variationCount: 1
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '이미지 변형 실패');
      }

      const result = await response.json();
      
      if (result.images && result.images.length > 0) {
        // 원본 이미지의 folder_path 가져오기 (원본 폴더에 저장)
        let targetFolderPath = imageFolderPath;
        if (!targetFolderPath) {
          const currentImage = images.find(img => img.url === imageUrl || img.name === imageName);
          targetFolderPath = currentImage?.folder_path || null;
        }
        
        // 변형된 이미지를 Supabase에 저장 (원본 폴더에)
        const savedImages = [];
        for (let i = 0; i < result.images.length; i++) {
          try {
            const saveResponse = await fetch('/api/save-generated-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageUrl: result.images[i].originalUrl || result.images[i],
                fileName: `replicate-variation-${Date.now()}-${i + 1}.png`,
                blogPostId: null,
                folderPath: targetFolderPath // 원본 이미지 폴더 경로 전달
              })
            });
            
            if (saveResponse.ok) {
              const { storedUrl } = await saveResponse.json();
              savedImages.push(storedUrl);
            } else {
              savedImages.push(result.images[i].originalUrl || result.images[i]);
            }
          } catch (error) {
            console.warn(`이미지 ${i + 1} 저장 실패:`, error);
            savedImages.push(result.images[i].originalUrl || result.images[i]);
          }
        }

        // 첫 번째 이미지로 selectedImageForZoom 업데이트 (모달 유지)
        if (savedImages.length > 0 && selectedImageForZoom) {
          setSelectedImageForZoom({
            ...selectedImageForZoom,
            url: savedImages[0],
            name: `replicate-variation-${Date.now()}-1.png`,
            folder_path: targetFolderPath || selectedImageForZoom.folder_path
          });
        }
        
        // 이미지 목록 새로고침
        fetchImages(1, true, folderFilter, includeChildren, searchQuery, true);
        
        alert(`✅ Replicate 변형 완료!\n\n${savedImages.length}개의 이미지가 생성되었습니다.`);
      } else {
        throw new Error('변형된 이미지가 생성되지 않았습니다.');
      }
    } catch (error: any) {
      console.error('❌ Replicate 변형 오류:', error);
      alert(`Replicate 변형 실패: ${error.message}`);
    } finally {
      setIsGeneratingReplicateVariation(false);
    }
  };

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

  // 일괄 골프 AI 생성 (메타데이터 자동 생성 및 저장)
  const handleBulkGolfAIGeneration = async () => {
    if (selectedImages.size === 0) {
      alert('이미지를 선택해주세요.');
      return;
    }

    if (!confirm(`${selectedImages.size}개 이미지의 메타데이터를 AI로 생성하시겠습니까?\n\n골프 이미지는 골프 특화 분석을, 일반 이미지는 범용 분석을 사용합니다.`)) {
      return;
    }

    setIsBulkWorking(true);
    const selectedIds = Array.from(selectedImages);
    let successCount = 0;
    let failCount = 0;
    let golfCount = 0;
    let generalCount = 0;

    try {
      for (let i = 0; i < selectedIds.length; i++) {
        const imageId = selectedIds[i];
        const image = images.find(img => getImageUniqueId(img) === imageId);
        
        if (!image) continue;

        try {
          // 골프 이미지인지 일반 이미지인지 판단
          // 1차: URL/파일명/폴더 경로 기반 빠른 판단
          const urlLower = (image.url || '').toLowerCase();
          const nameLower = (image.name || '').toLowerCase();
          const folderLower = (image.folder_path || '').toLowerCase();
          
          let isGolfImage = urlLower.includes('golf') || 
                           urlLower.includes('골프') ||
                           urlLower.includes('driver') ||
                           urlLower.includes('club') ||
                           nameLower.includes('golf') ||
                           nameLower.includes('골프') ||
                           nameLower.includes('driver') ||
                           nameLower.includes('club') ||
                           folderLower.includes('golf') ||
                           folderLower.includes('골프');
          
          // 2차: 기존 메타데이터가 있으면 키워드로도 확인
          if (!isGolfImage && image.keywords && image.keywords.length > 0) {
            const keywordsText = image.keywords.join(' ').toLowerCase();
            isGolfImage = keywordsText.includes('golf') || 
                         keywordsText.includes('골프') ||
                         keywordsText.includes('드라이버') ||
                         keywordsText.includes('클럽');
          }
          
          const analysisEndpoint = isGolfImage 
            ? '/api/analyze-image-prompt'  // 골프 이미지용
            : '/api/analyze-image-general'; // 일반 이미지용
          
          if (isGolfImage) golfCount++;
          else generalCount++;
          
          // AI 메타데이터 생성
          const response = await fetch(analysisEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              imageUrl: image.url,
              title: '갤러리 이미지',
              excerpt: '갤러리에서 메타데이터 생성'
            })
          });

          if (response.ok) {
            const metadata = await response.json();
            
            // 키워드 처리 (문자열 또는 배열)
            let keywords = [];
            if (metadata.keywords) {
              if (typeof metadata.keywords === 'string') {
                keywords = metadata.keywords.split(',').map(k => k.trim()).filter(k => k);
              } else if (Array.isArray(metadata.keywords)) {
                keywords = metadata.keywords;
              }
            }
            
            // 메타데이터 자동 저장
            const saveResponse = await fetch('/api/admin/image-metadata', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageName: image.name,
                imageUrl: image.url,
                alt_text: metadata.alt_text || metadata.alt || '',
                keywords: keywords,
                title: metadata.title || '',
                description: metadata.description || ''
              })
            });
            
            if (saveResponse.ok) {
              successCount++;
            } else {
              failCount++;
            }
          } else {
            // 크레딧 부족 오류 확인
            try {
              const errorData = await response.json();
              if (errorData.type === 'insufficient_credit' || response.status === 402) {
                // 첫 번째 크레딧 부족 오류만 알림 표시
                if (failCount === 0) {
                  alert('💰 OpenAI 계정에 크레딧이 부족합니다.\n\nOpenAI 계정에 크레딧을 충전해주세요.\nhttps://platform.openai.com/settings/organization/billing/overview');
                }
                failCount++;
                continue;
              }
            } catch (e) {
              // JSON 파싱 실패 시 무시
            }
            failCount++;
          }
        } catch (error) {
          console.error(`이미지 ${image.name} 처리 실패:`, error);
          
          // 크레딧 부족 오류 확인 (catch 블록에서도)
          const errorMessage = error.message || '';
          if (errorMessage.includes('크레딧이 부족') || errorMessage.includes('insufficient_credit')) {
            // 첫 번째 크레딧 부족 오류만 알림 표시
            if (failCount === 0) {
              alert('💰 OpenAI 계정에 크레딧이 부족합니다.\n\nOpenAI 계정에 크레딧을 충전해주세요.\nhttps://platform.openai.com/settings/organization/billing/overview');
            }
          }
          
          failCount++;
        }
        
        // API 호출 제한 방지 (400ms 간격)
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      alert(`✅ 일괄 메타데이터 생성 완료!\n\n성공: ${successCount}개\n실패: ${failCount}개\n\n골프 이미지: ${golfCount}개\n일반 이미지: ${generalCount}개`);
      
      // 이미지 목록 새로고침
      fetchImages(currentPage, false, folderFilter, includeChildren, searchQuery);
      
    } catch (error) {
      console.error('일괄 메타데이터 생성 오류:', error);
      
      // 크레딧 부족 오류 확인
      const errorMessage = error.message || '';
      if (errorMessage.includes('크레딧이 부족') || errorMessage.includes('insufficient_credit')) {
        alert('💰 OpenAI 계정에 크레딧이 부족합니다.\n\nOpenAI 계정에 크레딧을 충전해주세요.\nhttps://platform.openai.com/settings/organization/billing/overview');
      } else {
        alert(`일괄 메타데이터 생성 중 오류가 발생했습니다: ${error.message}`);
      }
    } finally {
      setIsBulkWorking(false);
      setSelectedImages(new Set()); // 선택 초기화
    }
  };

  // 일괄 편집 실행 (기존 기능 유지 - 필요시 사용)
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

  // 이미지 복사/링크 핸들러
  const handleImageCopyOrLink = async (imageData: any, targetFolder: string, action: 'copy' | 'link' | 'move') => {
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
      
      // move인 경우 다른 API 호출
      if (action === 'move') {
        const moveResponse = await fetch('/api/admin/move-image-to-folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: imageData.url,
            targetFolder: targetFolder
          })
        });

        const moveResult = await moveResponse.json();

        if (moveResult.success) {
          alert(`✅ 이미지 이동 완료!\n\n${moveResult.message || '이미지가 성공적으로 이동되었습니다.'}\n\n💡 카카오 콘텐츠 생성 페이지에서 변경사항을 보려면 페이지를 새로고침하세요.`);
          
          // 이미지 목록 새로고침
          fetchImages(currentPage, false, folderFilter, includeChildren, searchQuery);
        } else {
          alert(`❌ 이미지 이동 실패: ${moveResult.error || moveResult.details || '알 수 없는 오류'}`);
        }
        
        setShowCopyLinkModal(false);
        setPendingImageDrop(null);
        setIsLoading(false);
        return;
      }
      
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
        const actionText = action === 'copy' ? '복사' : action === 'link' ? '링크 생성' : '이동';
        alert(`✅ 이미지 ${actionText} 완료!\n\n${result.message}`);
        
        // 이미지 목록 새로고침
        fetchImages(currentPage, false, folderFilter, includeChildren, searchQuery);
      } else {
        alert(`❌ 이미지 ${action === 'copy' ? '복사' : action === 'link' ? '링크 생성' : '이동'} 실패: ${result.error || result.details}`);
      }
    } catch (error: any) {
      console.error('❌ 이미지 복사/링크 오류:', error);
      alert(`❌ 이미지 ${action === 'copy' ? '복사' : action === 'link' ? '링크 생성' : '이동'} 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
      setShowCopyLinkModal(false);
      setPendingImageDrop(null);
    }
  };

  // 복사 기능
  const handleCopyImages = () => {
    if (selectedImages.size === 0) {
      alert('복사할 이미지를 선택해주세요.');
      return;
    }
    
    const selectedIds = Array.from(selectedImages);
    const imagesToCopy = selectedIds.map(id => {
      const image = images.find(img => getImageUniqueId(img) === id);
      return image;
    }).filter(Boolean) as ImageMetadata[];
    
    setCopiedImages(imagesToCopy);
    alert(`${imagesToCopy.length}개 이미지가 복사되었습니다.\n붙여넣기 버튼을 눌러 대상 폴더를 선택하세요.`);
  };

  // 붙여넣기 기능
  const handlePasteImages = async (targetFolder: string) => {
    if (copiedImages.length === 0) {
      alert('복사된 이미지가 없습니다.');
      return;
    }
    
    if (!targetFolder || targetFolder === 'all' || targetFolder === 'root') {
      alert('붙여넣기할 폴더를 선택해주세요.');
      return;
    }
    
    setIsBulkWorking(true);
    
    try {
      // 같은 폴더인지 확인
      const sameFolderImages = copiedImages.filter(img => {
        const sourceFolder = img.folder_path || '';
        return sourceFolder === targetFolder;
      });
      
      if (sameFolderImages.length > 0) {
        const confirmMessage = `⚠️ 일부 이미지가 같은 폴더에 있습니다.\n\n` +
          `같은 폴더: ${sameFolderImages.length}개\n` +
          `다른 폴더: ${copiedImages.length - sameFolderImages.length}개\n\n` +
          `같은 폴더의 이미지는 파일명 뒤에 순번이 추가됩니다.\n계속하시겠습니까?`;
        
        if (!confirm(confirmMessage)) {
          setIsBulkWorking(false);
          return;
        }
      }
      
      console.log('📋 붙여넣기 시작:', copiedImages.length, '개 이미지');
      console.log('📋 대상 폴더:', targetFolder);
      
      // API 호출
      const response = await fetch('/api/admin/copy-images-to-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: copiedImages.map(img => ({
            name: img.name,
            url: img.url,
            folder_path: img.folder_path || '',
            alt_text: img.alt_text || '',
            title: img.title || '',
            description: img.description || '',
            keywords: img.keywords || []
          })),
          targetFolder: targetFolder
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.details || '붙여넣기에 실패했습니다.';
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('✅ 붙여넣기 성공:', result);
      
      // 모달 닫기
      setShowPasteModal(false);
      setPasteTargetFolder(null);
      
      // 갤러리 새로고침
      setTimeout(() => {
        fetchImages(1, true);
      }, 500);
      
      alert(`붙여넣기 완료: ${result.copiedCount}개 이미지가 "${targetFolder}" 폴더에 복사되었습니다.`);
      
    } catch (error: any) {
      console.error('❌ 붙여넣기 오류:', error);
      alert(`붙여넣기에 실패했습니다: ${error.message}`);
    } finally {
      setIsBulkWorking(false);
    }
  };

  // 다운로드 기능
  const handleDownloadImages = async () => {
    if (selectedImages.size === 0) {
      alert('다운로드할 이미지를 선택해주세요.');
      return;
    }

    const selectedIds = Array.from(selectedImages);
    const imagesToDownload = selectedIds.map(id => {
      const image = images.find(img => getImageUniqueId(img) === id);
      return image;
    }).filter(Boolean) as ImageMetadata[];

    // 1개 선택 시: 즉시 다운로드
    if (imagesToDownload.length === 1) {
      const img = imagesToDownload[0];
      try {
        const response = await fetch(img.url);
        if (!response.ok) throw new Error('이미지 다운로드 실패');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = img.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (error: any) {
        console.error('다운로드 오류:', error);
        alert(`다운로드 실패: ${error.message}`);
      }
      return;
    }

    // 여러 개 선택 시: 압축 후 다운로드
    try {
      const zip = new JSZip();
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < imagesToDownload.length; i++) {
        const img = imagesToDownload[i];
        try {
          const response = await fetch(img.url);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const blob = await response.blob();
          
          // 파일명 중복 처리 (같은 이름이 여러 개 있을 수 있음)
          let fileName = img.name;
          if (zip.file(fileName)) {
            const ext = fileName.split('.').pop();
            const baseName = fileName.replace(/\.[^/.]+$/, '');
            let counter = 1;
            while (zip.file(`${baseName}-${counter}.${ext}`)) {
              counter++;
            }
            fileName = `${baseName}-${counter}.${ext}`;
          }
          
          zip.file(fileName, blob);
          successCount++;
        } catch (error: any) {
          console.error(`이미지 다운로드 실패 (${img.name}):`, error);
          failCount++;
        }
      }

      if (successCount === 0) {
        alert('다운로드할 수 있는 이미지가 없습니다.');
        return;
      }

      // ZIP 파일 생성 및 다운로드
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `images-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      if (failCount > 0) {
        alert(`다운로드 완료: ${successCount}개 성공, ${failCount}개 실패`);
      }
    } catch (error: any) {
      console.error('압축 다운로드 오류:', error);
      alert(`압축 다운로드 실패: ${error.message}`);
    }
  };

  // Phase 4: 폴더 타입 판단 헬퍼 함수
  const getFolderType = (folderPath: string | undefined): 'uploaded' | 'originals' | 'variants' | 'references' | 'other' => {
    if (!folderPath) return 'other';
    const path = folderPath.toLowerCase();
    if (path.startsWith('uploaded/')) return 'uploaded';
    if (path.startsWith('originals/')) return 'originals';
    if (path.startsWith('variants/')) return 'variants';
    if (path.startsWith('references/')) return 'references';
    return 'other';
  };

  // 폴더 경로 포맷팅 헬퍼 함수 (originals/ 제거, 한두 뎁스 전까지 표시)
  const formatFolderPath = (folderPath: string | undefined): string => {
    if (!folderPath) return '';
    // originals/ 제거
    let formatted = folderPath.startsWith('originals/') 
      ? folderPath.replace('originals/', '') 
      : folderPath;
    
    // 한두 뎁스 전까지 표시 (예: blog/2025-12/487 → blog/2025-12/487)
    // 예: daily-branding/kakao/2026-01-04/account1/feed → kakao/2026-01-04/account1/feed
    const parts = formatted.split('/');
    if (parts.length > 3) {
      // 3개 이상이면 마지막 3개만 표시
      return parts.slice(-3).join('/');
    }
    return formatted;
  };

  // Phase 4: 삭제 경고 생성 함수
  const generateDeleteWarning = (image: ImageMetadata): string | null => {
    const folderType = getFolderType(image.folder_path);
    const warnings: string[] = [];

    // 1. uploaded/ 외 폴더 삭제 경고
    if (folderType !== 'uploaded' && folderType !== 'other') {
      const folderTypeNames = {
        'originals': '원본',
        'variants': '변형',
        'references': '참조'
      };
      warnings.push(`⚠️ ${folderTypeNames[folderType]} 폴더의 이미지입니다.`);
      warnings.push(`이미지를 삭제하면 연결된 콘텐츠에서 이미지가 깨질 수 있습니다.`);
    }

    // 2. usage_count > 0인 이미지 삭제 경고
    if (image.usage_count && image.usage_count > 0) {
      warnings.push(`⚠️ 현재 ${image.usage_count}개 위치에서 사용 중입니다.`);
      
      // 사용 위치 상세 정보 추가
      if (image.used_in && image.used_in.length > 0) {
        const usageDetails = image.used_in.slice(0, 5).map(usage => {
          const typeNames = {
            'blog': '블로그',
            'funnel': '퍼널',
            'homepage': '홈페이지',
            'muziik': 'MUZIIK',
            'static_page': '정적 페이지'
          };
          return `  - ${typeNames[usage.type] || usage.type}: ${usage.title || usage.url}`;
        }).join('\n');
        
        if (image.used_in.length > 5) {
          warnings.push(`\n사용 위치:\n${usageDetails}\n  ... 외 ${image.used_in.length - 5}개`);
        } else {
          warnings.push(`\n사용 위치:\n${usageDetails}`);
        }
      }
    }

    if (warnings.length > 0) {
      return warnings.join('\n\n');
    }
    return null;
  };

  // 일괄 삭제 실행
  // 개별 이미지 삭제 핸들러
  const handleDeleteImage = async (imageName: string) => {
    try {
      console.log('🗑️ 삭제 시도:', imageName);
      
      // 🔧 정확한 이미지 매칭: fullPath 또는 name으로 찾기
      const matchingImages = images.filter(img => {
        const fullPath = img.folder_path && img.folder_path !== '' 
          ? `${img.folder_path}/${img.name}` 
          : img.name;
        return fullPath === imageName || img.name === imageName;
      });

      // 중복 이미지가 발견된 경우 (같은 URL을 가진 이미지들)
      if (matchingImages.length > 1) {
        // URL 기반으로 실제로 같은 이미지인지 확인
        const uniqueUrls = new Set(matchingImages.map(img => img.url || img.cdn_url));
        if (uniqueUrls.size === 1) {
          // 실제로는 같은 이미지 (중복 표시)
          const image = matchingImages[0];
          const duplicateCount = matchingImages.length;
          
          // Phase 4: 삭제 전 경고 확인
          const warning = generateDeleteWarning(image);
          
          let confirmMessage = `정말로 이 이미지를 삭제하시겠습니까?\n\n`;
          confirmMessage += `⚠️ 참고: 중복 표시된 ${duplicateCount}개 항목 중 실제 파일 1개만 삭제됩니다.\n\n`;
          if (warning) {
            confirmMessage += `${warning}\n\n`;
          }
          confirmMessage += `삭제를 계속하려면 확인을 다시 눌러주세요.`;
          
          if (!confirm(confirmMessage)) {
            return;
          }
          
          // 실제 파일 경로로 삭제 (첫 번째 이미지의 경로 사용)
          const actualPath = image.folder_path && image.folder_path !== '' 
            ? `${image.folder_path}/${image.name}` 
            : image.name;
          
          const response = await fetch('/api/admin/delete-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageName: actualPath })
          });

          if (response.ok) {
            // 중복된 모든 항목을 UI에서 제거 (URL 기준)
            const targetUrl = image.url || image.cdn_url;
            setImages(prev => prev.filter(img => {
              const imgUrl = img.url || img.cdn_url;
              const fullPath = img.folder_path && img.folder_path !== '' 
                ? `${img.folder_path}/${img.name}` 
                : img.name;
              // URL이 같거나 경로가 같은 모든 항목 제거
              return imgUrl !== targetUrl && fullPath !== imageName && img.name !== imageName;
            }));
            
            // 현재 확대된 이미지가 삭제된 경우 모달 닫기
            if (selectedImageForZoom) {
              const zoomUrl = selectedImageForZoom.url || selectedImageForZoom.cdn_url;
              if (zoomUrl === targetUrl || selectedImageForZoom.name === imageName) {
                setSelectedImageForZoom(null);
              }
            }
            
            alert(`이미지가 삭제되었습니다. (중복 표시된 ${duplicateCount}개 항목 모두 UI에서 제거됨)`);
            
            // ✅ 서버에서 목록 새로고침 (캐시 무효화 포함)
            setTimeout(() => {
              fetchImages(1, true, folderFilter, includeChildren, searchQuery);
            }, 500);
          } else {
            const error = await response.json().catch(() => ({ error: '삭제 실패' }));
            alert(`이미지 삭제 실패: ${error.error || '알 수 없는 오류'}`);
          }
          return;
        }
      }

      // 단일 이미지 삭제 (기존 로직)
      const image = matchingImages[0];
      
      if (!image) {
        alert('삭제할 이미지를 찾을 수 없습니다.');
        return;
      }

      // ⭐ 링크 이미지 삭제 처리
      const isLinked = (image as any).is_linked === true;
      if (isLinked) {
        const originalFolder = (image as any).original_folder || '알 수 없음';
        const confirmMessage = `이 이미지는 링크 이미지입니다.\n\n` +
          `삭제하면 이 폴더에서의 링크만 제거되고, 원본 이미지는 삭제되지 않습니다.\n\n` +
          `원본 폴더: ${originalFolder}\n\n` +
          `링크를 삭제하시겠습니까?`;
        
        if (!confirm(confirmMessage)) {
          return;
        }

        // ⭐ 링크 삭제: image_metadata에서 태그만 제거
        try {
          const response = await fetch('/api/admin/remove-image-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: image.url || image.cdn_url,
              folderPath: image.folder_path,
              messageId: image.folder_path?.match(/\/(\d+)$/)?.[1] // 폴더 경로에서 메시지 ID 추출
            })
          });

          if (response.ok) {
            const result = await response.json();
            console.log('✅ 링크 삭제 완료:', result);
            
            // UI에서 링크 이미지 제거
            setImages(prev => prev.filter(img => {
              const fullPath = img.folder_path && img.folder_path !== '' 
                ? `${img.folder_path}/${img.name}` 
                : img.name;
              return fullPath !== imageName && img.name !== imageName;
            }));
            
            // 현재 확대된 이미지가 삭제된 경우 모달 닫기
            if (selectedImageForZoom && selectedImageForZoom.name === imageName) {
              setSelectedImageForZoom(null);
            }
            
            alert('링크가 삭제되었습니다.\n\n원본 이미지는 그대로 유지됩니다.');
            
            // 목록 새로고침
            setTimeout(() => {
              fetchImages(1, true, folderFilter, includeChildren, searchQuery);
            }, 500);
          } else {
            const errorData = await response.json().catch(() => ({ error: '링크 삭제 실패' }));
            alert(`링크 삭제 실패: ${errorData.error || '알 수 없는 오류'}`);
          }
        } catch (error) {
          console.error('링크 삭제 오류:', error);
          alert('링크 삭제 중 오류가 발생했습니다.');
        }
        return; // 링크 삭제 후 종료
      }

      // Phase 4: 삭제 전 경고 확인 (일반 이미지)
      const warning = generateDeleteWarning(image);
      if (warning) {
        const confirmMessage = `정말로 이 이미지를 삭제하시겠습니까?\n\n${warning}\n\n삭제를 계속하려면 확인을 다시 눌러주세요.`;
        if (!confirm(confirmMessage)) {
          return;
        }
      }
      
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
        
        // 삭제된 이미지를 상태에서 제거 (즉시 UI 업데이트)
        // fullPath와 name 모두 확인하여 중복 항목도 제거
        setImages(prev => prev.filter(img => {
          const fullPath = img.folder_path && img.folder_path !== '' 
            ? `${img.folder_path}/${img.name}` 
            : img.name;
          return fullPath !== imageName && img.name !== imageName;
        }));
        
        // 현재 확대된 이미지가 삭제된 경우 모달 닫기
        if (selectedImageForZoom && selectedImageForZoom.name === imageName) {
          setSelectedImageForZoom(null);
        }
        
        alert('이미지가 삭제되었습니다.');
        
        // ✅ 서버에서 목록 새로고침 (캐시 무효화 포함)
        setTimeout(() => {
          fetchImages(1, true, folderFilter, includeChildren, searchQuery);
        }, 500);
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
      
      // 선택된 ID에서 실제 이미지 객체 추출
      const selectedImageObjects = selectedIds.map(id => {
        const image = images.find(img => getImageUniqueId(img) === id);
        if (image) {
          const fullPath = image.folder_path && image.folder_path !== '' 
            ? `${image.folder_path}/${image.name}` 
            : image.name;
          return { image, fullPath };
        }
        return null;
      }).filter(Boolean) as Array<{ image: ImageMetadata; fullPath: string }>;
      
      // 🔧 URL 기반 중복 제거: 같은 URL을 가진 이미지는 하나만 삭제
      const uniqueByUrl = new Map<string, { image: ImageMetadata; fullPath: string }>();
      selectedImageObjects.forEach(({ image, fullPath }) => {
        const url = image.url || image.cdn_url || '';
        if (url && !uniqueByUrl.has(url)) {
          uniqueByUrl.set(url, { image, fullPath });
        } else if (!url) {
          // URL이 없는 경우 fullPath로 구분
          if (!uniqueByUrl.has(fullPath)) {
            uniqueByUrl.set(fullPath, { image, fullPath });
          }
        }
      });
      
      const uniqueImageObjects = Array.from(uniqueByUrl.values());
      const duplicateCount = selectedImageObjects.length - uniqueImageObjects.length;
      
      // Phase 4: 일괄 삭제 전 경고 확인
      const warnings: string[] = [];
      const originalsCount = uniqueImageObjects.filter(({ image }) => 
        getFolderType(image.folder_path) === 'originals'
      ).length;
      const variantsCount = uniqueImageObjects.filter(({ image }) => 
        getFolderType(image.folder_path) === 'variants'
      ).length;
      const referencesCount = uniqueImageObjects.filter(({ image }) => 
        getFolderType(image.folder_path) === 'references'
      ).length;
      const usedImages = uniqueImageObjects.filter(({ image }) => 
        image.usage_count && image.usage_count > 0
      );
      
      if (originalsCount > 0) {
        warnings.push(`⚠️ 원본 폴더 이미지: ${originalsCount}개`);
      }
      if (variantsCount > 0) {
        warnings.push(`⚠️ 변형 폴더 이미지: ${variantsCount}개`);
      }
      if (referencesCount > 0) {
        warnings.push(`⚠️ 참조 폴더 이미지: ${referencesCount}개`);
      }
      if (usedImages.length > 0) {
        warnings.push(`⚠️ 사용 중인 이미지: ${usedImages.length}개`);
        const totalUsage = usedImages.reduce((sum, { image }) => sum + (image.usage_count || 0), 0);
        warnings.push(`  총 ${totalUsage}개 위치에서 사용 중`);
      }
      
      if (warnings.length > 0 || duplicateCount > 0) {
        let confirmMessage = `정말로 `;
        if (duplicateCount > 0) {
          confirmMessage += `실제 파일 ${uniqueImageObjects.length}개 (중복 표시 ${selectedImageObjects.length}개 중)를 삭제하시겠습니까?\n\n`;
          confirmMessage += `⚠️ 참고: 선택된 ${selectedImageObjects.length}개 항목 중 실제로는 ${uniqueImageObjects.length}개 파일만 삭제됩니다.\n\n`;
        } else {
          confirmMessage += `${uniqueImageObjects.length}개 이미지를 삭제하시겠습니까?\n\n`;
        }
        
        if (warnings.length > 0) {
          confirmMessage += `${warnings.join('\n')}\n\n`;
        }
        
        confirmMessage += `이미지를 삭제하면 연결된 콘텐츠에서 이미지가 깨질 수 있습니다.\n\n삭제를 계속하려면 확인을 다시 눌러주세요.`;
        
        if (!confirm(confirmMessage)) {
          setIsBulkWorking(false);
          return;
        }
      }
      
      // 실제 고유한 파일들만 삭제
      const names = uniqueImageObjects.map(({ fullPath }) => fullPath);
      
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
      let successMessage = '';
      if (verification) {
        console.log('🔍 삭제 검증 결과:', verification);
        
        if (!verification.deletionSuccess) {
          console.warn('⚠️ 일부 파일이 삭제되지 않음:', verification.stillExisting);
          successMessage = `삭제 완료: ${verification.actuallyDeleted}개 삭제됨\n\n⚠️ 삭제되지 않은 파일: ${verification.stillExisting.length}개\n${verification.stillExisting.join(', ')}`;
        } else {
          if (duplicateCount > 0) {
            successMessage = `일괄 삭제 완료: 실제 파일 ${verification.actuallyDeleted}개가 삭제되었습니다.\n(중복 표시된 ${selectedImageObjects.length}개 항목 중)`;
          } else {
            successMessage = `일괄 삭제 완료: ${verification.actuallyDeleted}개 이미지가 삭제되었습니다.`;
          }
        }
      } else {
        if (duplicateCount > 0) {
          successMessage = `일괄 삭제 완료: 실제 파일 ${result.deletedImages.length}개가 삭제되었습니다.\n(중복 표시된 ${selectedImageObjects.length}개 항목 중)`;
        } else {
          successMessage = `일괄 삭제 완료: ${result.deletedImages.length}개 이미지가 삭제되었습니다.`;
        }
      }
      alert(successMessage);
      
      // 삭제된 이미지들을 상태에서 제거 (중복 항목도 함께 제거)
      const deletedUrls = new Set(uniqueImageObjects.map(({ image }) => image.url || image.cdn_url).filter(Boolean));
      setImages(prev => prev.filter(img => {
        // 선택된 ID에 있거나, 삭제된 URL과 같은 이미지는 모두 제거
        const imgUrl = img.url || img.cdn_url;
        const isSelected = selectedImages.has(getImageUniqueId(img));
        const isDeletedUrl = imgUrl && deletedUrls.has(imgUrl);
        const isDeletedPath = names.some(name => {
          const fullPath = img.folder_path && img.folder_path !== '' 
            ? `${img.folder_path}/${img.name}` 
            : img.name;
          return fullPath === name || img.name === name;
        });
        return !isSelected && !isDeletedUrl && !isDeletedPath;
      }));
      
      // 현재 확대된 이미지가 삭제된 경우 모달 닫기
      if (selectedImageForZoom) {
        const zoomUrl = selectedImageForZoom.url || selectedImageForZoom.cdn_url;
        const isDeleted = deletedUrls.has(zoomUrl) || names.includes(selectedImageForZoom.name);
        if (isDeleted) {
          setSelectedImageForZoom(null);
        }
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
        <title>갤러리 관리 - MAS Golf</title>
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
                <h1 className="text-2xl font-bold text-gray-900">갤러리 관리</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 메인 레이아웃: 트리 사이드바 + 콘텐츠 영역 */}
          <div className="flex gap-6">
            {/* 트리 사이드바 (왼쪽) */}
            <div className="w-80 flex-shrink-0 relative z-10">
              {/* 폴더 로딩 상태 표시 */}
              {isLoadingFolders ? (
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {folderLoadProgress || '폴더 목록 로딩 중...'}
                      </p>
                      {folderLoadError && (
                        <p className="text-xs text-red-600 mt-1 truncate">{folderLoadError}</p>
                      )}
                    </div>
                  </div>
                  {folderLoadError && folderLoadProgress.includes('재시도') && (
                    <p className="text-xs text-gray-500 mt-2">
                      자동 재시도 중...
                    </p>
                  )}
                </div>
              ) : folderLoadError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 shadow-sm">
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-700">⚠️ 폴더 목록 로드 실패</p>
                      <p className="text-xs text-red-600 mt-1 break-words">{folderLoadError}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setFolderLoadError(null);
                      setFolderLoadProgress('');
                      const fetchFolders = async () => {
                        setIsLoadingFolders(true);
                        setFolderLoadError(null);
                        setFolderLoadProgress('폴더 목록 조회 중...');
                        try {
                          const response = await fetch('/api/admin/folders-list');
                          const data = await response.json();
                          if (response.ok && data.folders && Array.isArray(data.folders)) {
                            setAvailableFolders(data.folders);
                            setIsLoadingFolders(false);
                            setFolderLoadError(null);
                            setFolderLoadProgress('');
                          } else {
                            setFolderLoadError(data.error || '폴더 목록을 불러올 수 없습니다');
                            setIsLoadingFolders(false);
                          }
                        } catch (error: any) {
                          setFolderLoadError('폴더 목록을 불러올 수 없습니다');
                          setIsLoadingFolders(false);
                        }
                      };
                      fetchFolders();
                    }}
                    className="mt-3 w-full text-xs px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    다시 시도
                  </button>
                </div>
              ) : null}
              
              {/* 이미지 추가 버튼 */}
              {!isLoadingFolders && !folderLoadError && (
                <button
                  onClick={handleOpenAddModal}
                  className="w-full mb-3 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors"
                >
                  ➕ 이미지 추가
                </button>
              )}
              
              {/* 폴더 트리 (로딩 완료 후에만 표시) */}
              {!isLoadingFolders && !folderLoadError && availableFolders.length > 0 && (
              <FolderTree
                folders={availableFolders}
                selectedFolder={folderFilter}
                onFolderSelect={(folderPath) => {
                  // 🔧 수정: daily-branding/kakao, kakao-ch 또는 mms로 시작하는 경로에 originals/ 프리픽스 자동 추가
                  let adjustedPath = folderPath;
                  if (folderPath && folderPath !== 'all' && folderPath !== 'root') {
                    // originals/ 프리픽스가 없고, daily-branding/kakao, kakao-ch 또는 mms로 시작하는 경우만 추가
                    if ((folderPath.startsWith('daily-branding/kakao') || folderPath.startsWith('daily-branding/kakao-ch') || folderPath.startsWith('mms')) && !folderPath.startsWith('originals/')) {
                      adjustedPath = `originals/${folderPath}`;
                    }
                  }
                  
                  setFolderFilter(adjustedPath);
                  setCurrentPage(1);
                  // "all" 클릭 시 항상 초기화 (reset=true)
                  fetchImages(1, true, adjustedPath, includeChildren, searchQuery);
                }}
                includeChildren={includeChildren}
                onIncludeChildrenChange={(include) => {
                  setIncludeChildren(include);
                  setCurrentPage(1);
                  fetchImages(1, true, folderFilter, include, searchQuery);
                }}
                onFoldersChanged={async () => {
                  try {
                    const response = await fetch('/api/admin/folders-list');
                    const data = await response.json();
                    if (response.ok && data.folders) {
                      setAvailableFolders(data.folders);
                    }
                    // 현재 리스트도 새로고침
                    fetchImages(1, true, folderFilter, includeChildren, searchQuery);
                  } catch {}
                }}
                onRefreshFolder={async (folderPath: string) => {
                  // 특정 폴더의 하위 폴더만 조회
                  try {
                    const response = await fetch(`/api/admin/folders-list?parent=${encodeURIComponent(folderPath)}`);
                    const data = await response.json();
                    
                    if (response.ok && data.folders && Array.isArray(data.folders)) {
                      // 기존 폴더 목록에 새로 로드한 하위 폴더 병합
                      const newFolders = new Set(availableFolders);
                      
                      // 새로 로드한 하위 폴더 추가
                      data.folders.forEach((folder: string) => {
                        newFolders.add(folder);
                        
                        // 하위 경로도 모두 추가 (예: originals/goods/bucket-hat-muziik-black/gallery → originals, originals/goods, ...)
                        const parts = folder.split('/').filter(Boolean);
                        let currentPath = '';
                        parts.forEach(part => {
                          currentPath = currentPath ? `${currentPath}/${part}` : part;
                          newFolders.add(currentPath);
                        });
                      });
                      
                      const mergedFolders = Array.from(newFolders).sort();
                      setAvailableFolders(mergedFolders);
                      
                      console.log(`✅ 폴더 새로고침 완료: ${folderPath} → ${data.folders.length}개 하위 폴더 추가 (총 ${mergedFolders.length}개)`);
                      
                      return data.folders;
                    } else {
                      throw new Error(data.error || '하위 폴더 조회 실패');
                    }
                  } catch (error: any) {
                    console.error(`❌ 폴더 새로고침 오류: ${folderPath}`, error);
                    throw error;
                  }
                }}
                onImageDrop={async (imageData, targetFolder, event?: DragEvent) => {
                  console.log('📁 이미지 드롭:', { imageData, targetFolder, event });
                  
                  // Alt 키 = 이동, Shift 키 = 링크, Ctrl/Cmd 키 = 복사, 기본 = 선택 모달
                  const isAltPressed = event?.altKey || false;
                  const isShiftPressed = event?.shiftKey || false;
                  const isCtrlPressed = event?.ctrlKey || event?.metaKey || false;
                  
                  if (isAltPressed) {
                    // Alt 키: 바로 이동
                    await handleImageCopyOrLink(imageData, targetFolder, 'move');
                  } else if (isShiftPressed) {
                    // Shift 키: 바로 링크 생성
                    await handleImageCopyOrLink(imageData, targetFolder, 'link');
                  } else if (isCtrlPressed) {
                    // Ctrl/Cmd 키: 바로 복사
                    await handleImageCopyOrLink(imageData, targetFolder, 'copy');
                  } else {
                    // 기본: 선택 모달 표시
                    setPendingImageDrop({ imageData, targetFolder });
                    setShowCopyLinkModal(true);
                  }
                }}
              />
              )}
              
              {/* 폴더가 없을 때 */}
              {!isLoadingFolders && !folderLoadError && availableFolders.length === 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">폴더가 없습니다.</p>
                </div>
              )}
            </div>

            {/* 콘텐츠 영역 (오른쪽) */}
            <div className="flex-1 min-w-0">
              {/* 브레드크럼 */}
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <span className="mr-2 text-gray-500">경로:</span>
                {folderFilter === 'all' ? (
                  <span className="font-medium">전체</span>
                ) : (
                  folderFilter.split('/').filter(Boolean).map((seg, idx, arr) => (
                    <span key={idx} className="flex items-center">
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={() => {
                          const path = arr.slice(0, idx + 1).join('/');
                          setFolderFilter(path);
                          setCurrentPage(1);
                          fetchImages(1, true, path, includeChildren, searchQuery);
                        }}
                      >
                        {seg}
                      </button>
                      {idx < arr.length - 1 && <span className="mx-2 text-gray-400">/</span>}
                    </span>
                  ))
                )}
              </div>

              {/* 프롬프트 미리보기 및 생성된 이미지 섹션 (블로그 스타일) */}
              {(showGeneratedImages || imageGenerationPrompt) && (
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                  {/* 프롬프트 미리보기 */}
                  {imageGenerationPrompt && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">✏️ 프롬프트 미리보기</h4>
                      <textarea
                        value={imageGenerationPrompt}
                        onChange={(e) => setImageGenerationPrompt(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                        placeholder="프롬프트를 수정할 수 있습니다..."
                      />
                    </div>
                  )}

                  {/* 이미지 생성 과정 표시 */}
                  {showGenerationProcess && imageGenerationStep && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">
                        🤖 {imageGenerationModel} 이미지 생성 과정
                      </h4>
                      <div className="text-sm text-blue-700">
                        {imageGenerationStep}
                      </div>
                    </div>
                  )}

                  {/* 생성된 이미지 갤러리 */}
                  {showGeneratedImages && generatedImages.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">생성된 이미지</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {generatedImages.map((imageUrl, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={imageUrl}
                              alt={`생성된 이미지 ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:border-blue-500 transition-colors"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-wrap gap-1 justify-center p-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('이 이미지를 삭제하시겠습니까?')) {
                                      setGeneratedImages(prev => prev.filter((_, i) => i !== index));
                                    }
                                  }}
                                  className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                                  title="삭제"
                                >
                                  🗑️
                                </button>
                                <button
                                  type="button"
                                  disabled={isGeneratingVariation}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (isGeneratingVariation) return;
                                    setSelectedBaseImage(imageUrl);
                                    await generateImageVariation('Replicate Flux');
                                  }}
                                  className={`px-2 py-1 text-xs rounded ${isGeneratingVariation ? 'bg-purple-300 text-white cursor-not-allowed' : 'bg-purple-500 text-white hover:bg-purple-600'}`}
                                  title="변형"
                                >
                                  {isGeneratingVariation ? '…' : '🎨'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* 검색 및 필터 */}
              <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* 검색 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      const newSearchQuery = e.target.value;
                      setSearchQuery(newSearchQuery);
                      setCurrentPage(1);
                      // 검색어 변경은 디바운싱으로 처리 (onChange에서는 상태만 업데이트)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        // Enter 키 입력 시 즉시 검색 실행 (디바운싱 우회)
                        fetchImages(1, true, folderFilter, includeChildren, searchQuery);
                      }
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
                  <option value="logos">🎨 로고만 보기</option>
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
              
              {/* 폴더 필터는 트리 사이드바로 이동 (트리 UI에서 처리) */}
              
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
                      } else {
                        // 크레딧 부족 오류 확인
                        try {
                          const errorData = await res.json();
                          if (errorData.type === 'insufficient_credit' || res.status === 402) {
                            alert('💰 OpenAI 계정에 크레딧이 부족합니다.\n\nOpenAI 계정에 크레딧을 충전해주세요.\nhttps://platform.openai.com/settings/organization/billing/overview');
                          } else {
                            alert('적용 실패');
                          }
                        } catch (e) {
                          alert('적용 실패');
                        }
                      }
                    }}
                    className="px-3 py-1 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700"
                  >
                    ✅ 적용
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDownloadImages}
                  disabled={selectedImages.size === 0}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ⬇️ 다운로드
                </button>
                <button
                  type="button"
                  onClick={handleCopyImages}
                  disabled={selectedImages.size === 0}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📋 복사
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasteModal(true)}
                  disabled={copiedImages.length === 0}
                  className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📌 붙여넣기
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                >
                  🗑️ 일괄 삭제
                </button>
                
                {/* 상세 보기 버튼 (1-3개 선택 시) */}
                {selectedForCompare.size >= 1 && selectedForCompare.size <= 3 && (
                  <button
                    type="button"
                    onClick={handleCompareImages}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                  >
                    {selectedForCompare.size === 1 ? '상세 보기' : `비교 (${selectedForCompare.size}개)`}
                  </button>
                )}
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
                <div 
                  className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
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
                        const targetFolder = folderFilter !== 'all' && folderFilter !== 'root' ? folderFilter : 'originals/mms';
                        
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
                  <div className="text-4xl mb-4">🖼️</div>
                  <p className="text-lg mb-2">이미지가 없습니다</p>
                  <p className="text-sm mb-4">검색 조건을 변경해보세요</p>
                  {folderFilter !== 'all' && folderFilter !== 'root' && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-400 mb-2">이미지를 여기에 드래그하여 복사/링크할 수 있습니다</p>
                      <p className="text-xs text-gray-400">
                        💡 Shift + 드롭 = 링크 | Ctrl/Cmd + 드롭 = 복사
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredImages.map((image, index) => {
                    // 렌더링 중
                    
                    return (
                    <div 
                      key={image.name} 
                      className={`relative group border-2 rounded-lg overflow-hidden hover:shadow-md transition-all ${
                        selectedForCompare.has(image.id || '')
                          ? 'border-green-500 ring-2 ring-green-200'
                          : selectedImages.has(getImageUniqueId(image)) 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={(e) => {
                        // 체크박스나 버튼 클릭은 이벤트 전파 방지
                        if ((e.target as HTMLElement).closest('.compare-checkbox') || 
                            (e.target as HTMLElement).closest('button')) {
                          return;
                        }
                        // 비교 선택이 있으면 비교 선택 우선, 없으면 일반 선택
                        if (image.id && selectedForCompare.has(image.id)) {
                          toggleImageForCompare(image.id);
                        } else {
                          toggleImageSelection(image);
                        }
                      }}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('image', JSON.stringify({
                          name: image.name,
                          url: image.url,
                          folder_path: image.folder_path
                        }));
                        
                        // ⭐ 항상 캔버스 사용 (이미지 로드 여부와 관계없이)
                        try {
                          const canvas = document.createElement('canvas');
                          canvas.width = 64;
                          canvas.height = 64;
                          const ctx = canvas.getContext('2d');
                          
                          if (ctx) {
                            // 배경을 흰색으로 채우기
                            ctx.fillStyle = '#ffffff';
                            ctx.fillRect(0, 0, 64, 64);
                            
                            // ⭐ 화면에 렌더링된 이미지 요소 찾기
                            const imgElement = e.currentTarget.querySelector('img') as HTMLImageElement;
                            
                            // 이미지가 로드되어 있고 CORS 문제가 없으면 그리기
                            if (imgElement && imgElement.complete && imgElement.naturalWidth > 0) {
                              try {
                                // 이미지를 64x64px로 그리기 (비율 유지하며 중앙 정렬)
                                const imgAspect = imgElement.naturalWidth / imgElement.naturalHeight;
                                let drawWidth = 64;
                                let drawHeight = 64;
                                let offsetX = 0;
                                let offsetY = 0;
                                
                                if (imgAspect > 1) {
                                  // 가로가 더 긴 경우
                                  drawHeight = 64 / imgAspect;
                                  offsetY = (64 - drawHeight) / 2;
                                } else {
                                  // 세로가 더 긴 경우
                                  drawWidth = 64 * imgAspect;
                                  offsetX = (64 - drawWidth) / 2;
                                }
                                
                                // CORS 문제가 있을 수 있으므로 try-catch로 감싸기
                                ctx.drawImage(imgElement, offsetX, offsetY, drawWidth, drawHeight);
                              } catch (drawError) {
                                // CORS 문제나 drawImage 실패 시 배경만 표시
                                console.warn('이미지 그리기 실패 (CORS 문제 가능):', drawError);
                                ctx.fillStyle = '#f3f4f6';
                                ctx.fillRect(0, 0, 64, 64);
                              }
                            } else {
                              // 이미지가 로드되지 않았으면 회색 배경만
                              ctx.fillStyle = '#f3f4f6';
                              ctx.fillRect(0, 0, 64, 64);
                            }
                            
                            // 항상 setDragImage 호출 (캔버스는 항상 생성됨)
                            e.dataTransfer.setDragImage(canvas, 32, 32);
                          }
                        } catch (err) {
                          console.warn('드래그 이미지 설정 실패:', err);
                        }
                        
                        // ⭐ 조금만 흐리게 (0.7로 조정 - 폴더가 잘 보이도록)
                        e.currentTarget.style.opacity = '0.7';
                        // ⭐ z-index를 낮춰서 폴더 트리가 위에 보이도록
                        e.currentTarget.style.zIndex = '1';
                      }}
                      onDragEnd={(e) => {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.zIndex = '';
                      }}
                    >
                      {/* 선택 표시 (일반 선택 - 파란색) */}
                      {selectedImages.has(getImageUniqueId(image)) && (
                        <div className="absolute top-2 left-2 z-10">
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        </div>
                      )}
                      
                      {/* 🔗 링크된 이미지 배지 */}
                      {(image as any).is_linked && (
                        <span className="absolute top-2 right-2 z-20 px-2 py-1 text-[10px] font-bold rounded-md bg-purple-600 text-white shadow-lg">
                          🔗 링크
                        </span>
                      )}
                      
                      {/* 이미지 */}
                      <div className="aspect-square bg-gray-100">
                        <LazyImage
                          src={`${image.url}?width=200&height=200&quality=80&resize=cover`}
                          data-full-src={image.url}
                          alt={image.alt_text || image.name}
                          className={`w-full h-full object-cover ${(image as any).is_linked ? 'opacity-60' : ''}`}
                          onError={(e) => {
                            // 썸네일 실패 시 원본으로 폴백
                            const target = e.target as HTMLImageElement;
                            if (target.dataset.fullSrc && target.src !== target.dataset.fullSrc) {
                              target.src = target.dataset.fullSrc;
                            }
                          }}
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
                        {/* Phase 5: 폴더 타입 배지 표시 */}
                        {(() => {
                          const folderType = getFolderType(image.folder_path);
                          const badgeConfig = {
                            'uploaded': { label: '임시 업로드', color: 'bg-gray-100 text-gray-700 border-gray-300' },
                            'originals': { label: '원본', color: 'bg-blue-100 text-blue-700 border-blue-300' },
                            'variants': { label: '변형', color: 'bg-purple-100 text-purple-700 border-purple-300' },
                            'references': { label: '참조', color: 'bg-green-100 text-green-700 border-green-300' },
                            'other': { label: '기타', color: 'bg-gray-100 text-gray-600 border-gray-300' }
                          };
                          const badge = badgeConfig[folderType];
                          return (
                            <div className="mb-2 flex items-center gap-2">
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${badge.color}`}>
                                {badge.label}
                              </span>
                              {image.folder_path && (
                                <span className="text-xs text-blue-600 truncate flex-1" title={`폴더: ${image.folder_path}`}>
                                  📁 {image.folder_path}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                        
                        <div className="text-xs text-gray-600 mb-2 truncate" title={image.name}>
                          {image.name}
                        </div>
                        
                        {/* 🔗 링크된 이미지 원본 폴더 표시 */}
                        {(image as any).is_linked && (image as any).original_folder && (
                          <div className="text-[10px] text-purple-600 mb-1 truncate" title={`원본: ${(image as any).original_folder}`}>
                            🔗 {(image as any).original_folder.split('/').pop()}
                          </div>
                        )}
                        
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
                      
                      {/* 퀵 액션 버튼들: 확대 / 편집 / 삭제만 표시 */}
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
              
              {/* 더 이상 로드할 이미지가 없을 때 (로딩 중이 아닐 때만 표시) */}
              {!hasMoreImages && images.length > 0 && !isLoading && !isLoadingMore && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <p>모든 이미지를 불러왔습니다.</p>
                </div>
              )}
            </div>
          </div>
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
        onSave={async (metadata, exifData) => {
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
              categories: categoriesArray,  // 다중 선택: 배열로 전송
              exifData: exifData || null  // EXIF 정보 추가
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
              // 주의: 저장 시 최종 정제된 값(titleValue, finalKeywords, finalFileName)을 사용하여
              // 제목이 파일명으로 되돌아가거나 키워드가 사라지는 현상을 방지
              setImages(prev => prev.map(img => 
                img.name === editingImage 
                  ? { 
                      ...img, 
                      alt_text: metadata.alt_text,
                      keywords: finalKeywords,
                      title: titleValue,
                      description: metadata.description,
                      category: categoryString,
                      name: finalFileName || img.name
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-7xl w-full max-h-[95vh] overflow-y-auto">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-blue-600">📋</span>
                이미지 상세 정보
              </h2>
              <button
                onClick={() => setSelectedImageForZoom(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-light transition-colors"
                title="닫기"
              >
                ×
              </button>
            </div>

            {/* 상단 액션 버튼들 (아이콘 제거) */}
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50 mb-6">
                {/* 액션 버튼들 */}
                <button
                  onClick={async () => {
                    try {
                      // 1. 이미지 다운로드
                      const response = await fetch(selectedImageForZoom.url);
                      if (!response.ok) {
                        throw new Error(`이미지 다운로드 실패: ${response.status}`);
                      }
                      const blob = await response.blob();
                      
                      // 2. cleanup.pictures 열기
                      const cleanupWindow = window.open('https://cleanup.pictures/', '_blank');
                      
                      // 3. 이미지를 다운로드 폴더에 저장
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = selectedImageForZoom.name || `image-${Date.now()}.${selectedImageForZoom.name?.split('.').pop() || 'png'}`;
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
                  className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 transition-colors"
                  title="cleanup.pictures에서 편집"
                >
                  수정
                </button>
                {/* 회전 버튼 */}
                <div className="relative inline-block">
                  <button
                    data-rotate-button
                    onClick={() => setShowRotateMenu(!showRotateMenu)}
                    disabled={isRotating}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      isRotating
                        ? 'bg-blue-300 text-white cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                    title="회전"
                  >
                    {isRotating ? '회전 중...' : '회전'}
                  </button>
                  {showRotateMenu && !isRotating && (
                    <div data-rotate-menu className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10 min-w-[220px]">
                      <div className="px-3 py-2 text-xs text-gray-500 border-b">회전 방향</div>
                      <button
                        onClick={async () => {
                          if (!selectedImageForZoom) return;
                          setIsRotating(true);
                          setShowRotateMenu(false);
                          try {
                            // 1. 클라이언트에서 Canvas로 회전 처리
                            const metadata = await getImageMetadata(selectedImageForZoom.url);
                            const format = metadata.hasAlpha ? 'png' : 'jpg';
                            
                            const rotatedBlob = await rotateImageWithCanvas(
                              selectedImageForZoom.url,
                              -90,
                              format
                            );
                            
                            // 2. 새 파일명 생성
                            const baseName = selectedImageForZoom.name?.replace(/\.[^/.]+$/, '') || `rotated-${Date.now()}`;
                            const extension = format === 'webp' ? 'webp' : format === 'jpg' ? 'jpg' : 'png';
                            const newFileName = `${baseName}-rotated-90.${extension}`;
                            
                            // 3. FormData 생성
                            const formData = new FormData();
                            formData.append('image', rotatedBlob, newFileName);
                            formData.append('folderPath', selectedImageForZoom.folder_path || '');
                            formData.append('fileName', newFileName);
                            
                            // 4. 서버에 업로드
                            const response = await fetch('/api/admin/upload-processed-image', {
                              method: 'POST',
                              body: formData
                            });
                            
                            if (!response.ok) {
                              const error = await response.json();
                              throw new Error(error.error || '업로드 실패');
                            }
                            
                            const data = await response.json();
                            if (data.success) {
                              alert(`✅ 이미지가 반시계방향으로 90도 회전되었습니다.\n포맷: ${format.toUpperCase()}\n크기: ${(data.size / 1024).toFixed(2)}KB`);
                              // 확대 모달 닫기
                              setSelectedImageForZoom(null);
                              // 약간의 지연 후 이미지 목록 새로고침 (Supabase 반영 시간 고려)
                              setTimeout(async () => {
                                await fetchImages(1, true, folderFilter, includeChildren, searchQuery, true);
                              }, 500);
                            }
                          } catch (error: any) {
                            console.error('❌ 회전 오류:', error);
                            alert(`회전 실패: ${error.message}`);
                          } finally {
                            setIsRotating(false);
                          }
                        }}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        ↺ 반시계방향 90도
                      </button>
                      <button
                        onClick={async () => {
                          if (!selectedImageForZoom) return;
                          setIsRotating(true);
                          setShowRotateMenu(false);
                          try {
                            // 1. 클라이언트에서 Canvas로 회전 처리
                            const metadata = await getImageMetadata(selectedImageForZoom.url);
                            const format = metadata.hasAlpha ? 'png' : 'jpg';
                            
                            const rotatedBlob = await rotateImageWithCanvas(
                              selectedImageForZoom.url,
                              90,
                              format
                            );
                            
                            // 2. 새 파일명 생성
                            const baseName = selectedImageForZoom.name?.replace(/\.[^/.]+$/, '') || `rotated-${Date.now()}`;
                            const extension = format === 'webp' ? 'webp' : format === 'jpg' ? 'jpg' : 'png';
                            const newFileName = `${baseName}-rotated-90.${extension}`;
                            
                            // 3. FormData 생성
                            const formData = new FormData();
                            formData.append('image', rotatedBlob, newFileName);
                            formData.append('folderPath', selectedImageForZoom.folder_path || '');
                            formData.append('fileName', newFileName);
                            
                            // 4. 서버에 업로드
                            const response = await fetch('/api/admin/upload-processed-image', {
                              method: 'POST',
                              body: formData
                            });
                            
                            if (!response.ok) {
                              const error = await response.json();
                              throw new Error(error.error || '업로드 실패');
                            }
                            
                            const data = await response.json();
                            if (data.success) {
                              alert(`✅ 이미지가 시계방향으로 90도 회전되었습니다.\n포맷: ${format.toUpperCase()}\n크기: ${(data.size / 1024).toFixed(2)}KB`);
                              // 확대 모달 닫기
                              setSelectedImageForZoom(null);
                              // 약간의 지연 후 이미지 목록 새로고침 (Supabase 반영 시간 고려)
                              setTimeout(async () => {
                                await fetchImages(1, true, folderFilter, includeChildren, searchQuery, true);
                              }, 500);
                            }
                          } catch (error: any) {
                            console.error('❌ 회전 오류:', error);
                            alert(`회전 실패: ${error.message}`);
                          } finally {
                            setIsRotating(false);
                          }
                        }}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-b-lg"
                      >
                        ↻ 시계방향 90도
                      </button>
                    </div>
                  )}
                </div>
                {/* 변환 버튼 */}
                <div className="relative inline-block">
                  <button
                    data-convert-button
                    onClick={() => setShowConvertMenu(!showConvertMenu)}
                    disabled={isConverting}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      isConverting
                        ? 'bg-green-300 text-white cursor-not-allowed'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                    title="변환"
                  >
                    {isConverting ? '변환 중...' : '변환'}
                  </button>
                  {showConvertMenu && !isConverting && (
                    <div data-convert-menu className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10 min-w-[200px]">
                      <div className="px-3 py-2 text-xs text-gray-500 border-b">포맷 선택</div>
                      <button
                        onClick={async () => {
                          if (!selectedImageForZoom) return;
                          setIsConverting(true);
                          setShowConvertMenu(false);
                          try {
                            // 1. 클라이언트에서 Canvas로 변환 처리
                            const convertedBlob = await convertImageWithCanvas(
                              selectedImageForZoom.url,
                              'webp',
                              0.85
                            );
                            
                            // 2. 새 파일명 생성
                            const baseName = selectedImageForZoom.name?.replace(/\.[^/.]+$/, '') || `converted-${Date.now()}`;
                            const newFileName = `${baseName}.webp`;
                            
                            // 3. FormData 생성
                            const formData = new FormData();
                            formData.append('image', convertedBlob, newFileName);
                            formData.append('folderPath', selectedImageForZoom.folder_path || '');
                            formData.append('fileName', newFileName);
                            
                            // 4. 서버에 업로드
                            const response = await fetch('/api/admin/upload-processed-image', {
                              method: 'POST',
                              body: formData
                            });
                            
                            if (!response.ok) {
                              const error = await response.json();
                              throw new Error(error.error || '업로드 실패');
                            }
                            
                            const data = await response.json();
                            if (data.success) {
                              // 원본 크기 가져오기
                              const originalResponse = await fetch(selectedImageForZoom.url);
                              const originalBlob = await originalResponse.blob();
                              const originalSize = originalBlob.size;
                              const reduction = originalSize > 0 
                                ? ((1 - data.size / originalSize) * 100).toFixed(1)
                                : '0';
                              alert(`✅ WebP 변환 완료!\n크기: ${(data.size / 1024).toFixed(2)}KB\n원본 대비: ${reduction}% 감소\n투명도: 지원`);
                              // 확대 모달 닫기
                              setSelectedImageForZoom(null);
                              // 약간의 지연 후 이미지 목록 새로고침 (Supabase 반영 시간 고려)
                              setTimeout(async () => {
                                await fetchImages(1, true, folderFilter, includeChildren, searchQuery, true);
                              }, 500);
                            }
                          } catch (error: any) {
                            console.error('❌ 변환 오류:', error);
                            alert(`변환 실패: ${error.message}`);
                          } finally {
                            setIsConverting(false);
                          }
                        }}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        WebP 85% (투명도 지원)
                      </button>
                      <button
                        onClick={async () => {
                          if (!selectedImageForZoom) return;
                          setIsConverting(true);
                          setShowConvertMenu(false);
                          try {
                            // 1. 클라이언트에서 Canvas로 변환 처리
                            const convertedBlob = await convertImageWithCanvas(
                              selectedImageForZoom.url,
                              'jpg',
                              0.85
                            );
                            
                            // 2. 새 파일명 생성
                            const baseName = selectedImageForZoom.name?.replace(/\.[^/.]+$/, '') || `converted-${Date.now()}`;
                            const newFileName = `${baseName}.jpg`;
                            
                            // 3. FormData 생성
                            const formData = new FormData();
                            formData.append('image', convertedBlob, newFileName);
                            formData.append('folderPath', selectedImageForZoom.folder_path || '');
                            formData.append('fileName', newFileName);
                            
                            // 4. 서버에 업로드
                            const response = await fetch('/api/admin/upload-processed-image', {
                              method: 'POST',
                              body: formData
                            });
                            
                            if (!response.ok) {
                              const error = await response.json();
                              throw new Error(error.error || '업로드 실패');
                            }
                            
                            const data = await response.json();
                            if (data.success) {
                              // 원본 크기 가져오기
                              const originalResponse = await fetch(selectedImageForZoom.url);
                              const originalBlob = await originalResponse.blob();
                              const originalSize = originalBlob.size;
                              const reduction = originalSize > 0 
                                ? ((1 - data.size / originalSize) * 100).toFixed(1)
                                : '0';
                              alert(`✅ JPG 변환 완료!\n크기: ${(data.size / 1024).toFixed(2)}KB\n원본 대비: ${reduction}% 감소`);
                              // 확대 모달 닫기
                              setSelectedImageForZoom(null);
                              // 약간의 지연 후 이미지 목록 새로고침 (Supabase 반영 시간 고려)
                              setTimeout(async () => {
                                await fetchImages(1, true, folderFilter, includeChildren, searchQuery, true);
                              }, 500);
                            }
                          } catch (error: any) {
                            console.error('❌ 변환 오류:', error);
                            alert(`변환 실패: ${error.message}`);
                          } finally {
                            setIsConverting(false);
                          }
                        }}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        JPG 85% (투명도 없음)
                      </button>
                      <button
                        onClick={async () => {
                          if (!selectedImageForZoom) return;
                          setIsConverting(true);
                          setShowConvertMenu(false);
                          try {
                            // 1. 클라이언트에서 Canvas로 변환 처리
                            const convertedBlob = await convertImageWithCanvas(
                              selectedImageForZoom.url,
                              'png'
                            );
                            
                            // 2. 새 파일명 생성
                            const baseName = selectedImageForZoom.name?.replace(/\.[^/.]+$/, '') || `converted-${Date.now()}`;
                            const newFileName = `${baseName}.png`;
                            
                            // 3. FormData 생성
                            const formData = new FormData();
                            formData.append('image', convertedBlob, newFileName);
                            formData.append('folderPath', selectedImageForZoom.folder_path || '');
                            formData.append('fileName', newFileName);
                            
                            // 4. 서버에 업로드
                            const response = await fetch('/api/admin/upload-processed-image', {
                              method: 'POST',
                              body: formData
                            });
                            
                            if (!response.ok) {
                              const error = await response.json();
                              throw new Error(error.error || '업로드 실패');
                            }
                            
                            const data = await response.json();
                            if (data.success) {
                              const metadata = await getImageMetadata(selectedImageForZoom.url);
                              alert(`✅ PNG 변환 완료!\n크기: ${(data.size / 1024).toFixed(2)}KB\n무손실 압축\n투명도: ${metadata.hasAlpha ? '지원' : '없음'}`);
                              // 확대 모달 닫기
                              setSelectedImageForZoom(null);
                              // 약간의 지연 후 이미지 목록 새로고침 (Supabase 반영 시간 고려)
                              setTimeout(async () => {
                                await fetchImages(1, true, folderFilter, includeChildren, searchQuery, true);
                              }, 500);
                            }
                          } catch (error: any) {
                            console.error('❌ 변환 오류:', error);
                            alert(`변환 실패: ${error.message}`);
                          } finally {
                            setIsConverting(false);
                          }
                        }}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-b-lg"
                      >
                        PNG (무손실, 투명도 지원)
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={async () => {
                      if (!selectedImageForZoom) return;
                      if (isGeneratingExistingVariation) return;
                      
                      // 바로 변형 시작
                      setIsGeneratingExistingVariation(true);
                      setImageGenerationStep('FAL AI로 이미지 변형 중...');
                      setImageGenerationModel('FAL AI (기존 이미지 변형)');
                      setShowGenerationProcess(true);
                      
                      try {
                        // 1. 기존 프롬프트 확인 또는 생성
                        let prompt = '';
                        try {
                          const promptResponse = await fetch('/api/get-image-prompt', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ imageUrl: selectedImageForZoom.url })
                          });
                          
                          if (promptResponse.ok) {
                            const promptData = await promptResponse.json();
                            prompt = promptData.prompt || '';
                          }
                        } catch (error) {
                          console.warn('기존 프롬프트 조회 실패, AI로 생성:', error);
                        }
                        
                        // 프롬프트가 없으면 AI로 생성
                        if (!prompt) {
                          setImageGenerationStep('이미지 분석 및 프롬프트 생성 중...');
                          
                          const isGolfImage = selectedImageForZoom.url.includes('golf') || 
                                             selectedImageForZoom.url.includes('골프') ||
                                             selectedImageForZoom.url.includes('driver') ||
                                             selectedImageForZoom.url.includes('club');
                          
                          const analysisEndpoint = isGolfImage 
                            ? '/api/analyze-image-prompt'
                            : '/api/analyze-image-general';
                          
                          const analysisResponse = await fetch(analysisEndpoint, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              imageUrl: selectedImageForZoom.url,
                              title: '갤러리 이미지 변형',
                              excerpt: '갤러리에서 변형된 이미지'
                            })
                          });
                          
                          if (analysisResponse.ok) {
                            const analysisData = await analysisResponse.json();
                            prompt = analysisData.prompt || analysisData.englishPrompt || '';
                          }
                        }
                        
                        // 2. 바로 FAL AI 변형 시작
                        setImageGenerationStep('FAL AI로 이미지 변형 중...');
                        
                        const response = await fetch('/api/vary-existing-image', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            imageUrl: selectedImageForZoom.url,
                            prompt: prompt || 'high quality image variation',
                            title: '갤러리 이미지 변형',
                            excerpt: '갤러리에서 변형된 이미지',
                            contentType: 'gallery',
                            brandStrategy: 'professional',
                            preset: variationPreset || 'creative',
                            originalImageFolder: selectedImageForZoom.folder_path || null
                          })
                        });
                        
                        if (response.ok) {
                          const result = await response.json();
                          
                          if (result.imageUrl) {
                            // selectedImageForZoom을 변형된 이미지로 업데이트 (모달 유지)
                            setSelectedImageForZoom({
                              ...selectedImageForZoom,
                              url: result.imageUrl,
                              name: result.fileName || selectedImageForZoom.name,
                              folder_path: selectedImageForZoom.folder_path
                            });
                            
                            // 이미지 목록 새로고침
                            fetchImages(1, true, folderFilter, includeChildren, searchQuery, true);
                            
                            alert('✅ 이미지 변형이 완료되었습니다!');
                          } else {
                            throw new Error('변형된 이미지가 생성되지 않았습니다.');
                          }
                        } else {
                          const error = await response.json();
                          throw new Error(error.message || '이미지 변형에 실패했습니다.');
                        }
                      } catch (error: any) {
                        console.error('이미지 변형 오류:', error);
                        alert('이미지 변형 중 오류가 발생했습니다: ' + error.message);
                      } finally {
                        setIsGeneratingExistingVariation(false);
                        setTimeout(() => {
                          setShowGenerationProcess(false);
                          setImageGenerationStep('');
                        }, 2000);
                      }
                    }}
                    disabled={isGeneratingExistingVariation}
                    className={`px-3 py-1.5 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 transition-colors ${
                      isGeneratingExistingVariation ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title="변형 (FAL AI - 바로 변형 시작)"
                  >
                    {isGeneratingExistingVariation ? '변형 중...' : '변형 (FAL)'}
                  </button>
                  <button
                    onClick={() => {
                      setPromptModalType('fal');
                      setCustomPrompt('');
                      setShowPromptModal(true);
                    }}
                    disabled={isGeneratingExistingVariation}
                    className={`px-1.5 py-1.5 bg-orange-400 text-white text-xs rounded hover:bg-orange-500 transition-colors ${
                      isGeneratingExistingVariation ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title="프롬프트 입력 후 변형"
                  >
                    ✏️
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={async () => {
                      if (!selectedImageForZoom) return;
                      if (isGeneratingReplicateVariation) return;
                      await generateReplicateVariation(selectedImageForZoom.url, selectedImageForZoom.name, selectedImageForZoom.folder_path);
                    }}
                    disabled={isGeneratingReplicateVariation}
                    className={`px-3 py-1.5 text-sm rounded transition-colors ${
                      isGeneratingReplicateVariation
                        ? 'bg-purple-300 text-white cursor-not-allowed'
                        : 'bg-purple-500 text-white hover:bg-purple-600'
                    }`}
                    title="변형 (Replicate - 빠르고 간단)"
                  >
                    {isGeneratingReplicateVariation ? '변형 중...' : '변형 (Replicate)'}
                  </button>
                  <button
                    onClick={() => {
                      setPromptModalType('replicate');
                      setCustomPrompt('');
                      setShowPromptModal(true);
                    }}
                    disabled={isGeneratingReplicateVariation}
                    className={`px-1.5 py-1.5 bg-purple-400 text-white text-xs rounded hover:bg-purple-500 transition-colors ${
                      isGeneratingReplicateVariation ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title="프롬프트 입력 후 변형 (Replicate는 프롬프트 지원 안 함)"
                  >
                    ✏️
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={async () => {
                      if (!selectedImageForZoom) return;
                      if (isGeneratingNanobananaVariation) return;
                      await generateNanobananaVariation(selectedImageForZoom.url, selectedImageForZoom.name, selectedImageForZoom.folder_path);
                    }}
                    disabled={isGeneratingNanobananaVariation}
                    className={`px-3 py-1.5 text-sm rounded transition-colors ${
                      isGeneratingNanobananaVariation
                        ? 'bg-green-300 text-white cursor-not-allowed'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                    title="변형 (Nanobanana - 원본 스타일 유지)"
                  >
                    {isGeneratingNanobananaVariation ? '변형 중...' : '변형 (Nanobanana)'}
                  </button>
                  <button
                    onClick={() => {
                      setPromptModalType('nanobanana');
                      setCustomPrompt('');
                      setShowPromptModal(true);
                    }}
                    disabled={isGeneratingNanobananaVariation}
                    className={`px-1.5 py-1.5 bg-green-400 text-white text-xs rounded hover:bg-green-500 transition-colors ${
                      isGeneratingNanobananaVariation ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title="프롬프트 입력 후 변형"
                  >
                    ✏️
                  </button>
                </div>
                <button
                  onClick={async () => {
                    if (!selectedImageForZoom) return;
                    if (isUpscaling) return;
                    
                    if (!confirm(`"${selectedImageForZoom.name}" 이미지를 ${upscaleScale}배 업스케일링하시겠습니까?`)) {
                      return;
                    }
                    
                    setIsUpscaling(true);
                    try {
                      const response = await fetch('/api/admin/upscale-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          imageUrl: selectedImageForZoom.url,
                          model: upscaleModel,
                          scale: upscaleScale,
                          preserveExif: true
                        })
                      });
                      
                      if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error || '업스케일링 실패');
                      }
                      
                      const data = await response.json();
                      if (data.success) {
                        alert(`✅ 업스케일링 완료!\n\n새 이미지: ${data.fileName || 'URL 사용'}`);
                        fetchImages(1, true, folderFilter, includeChildren, searchQuery);
                        if (data.imageUrl) {
                          setSelectedImageForZoom({
                            ...selectedImageForZoom,
                            url: data.imageUrl,
                            width: data.width,
                            height: data.height
                          });
                        }
                      } else {
                        throw new Error(data.error || '업스케일링 실패');
                      }
                    } catch (error: any) {
                      console.error('❌ 업스케일링 오류:', error);
                      alert(`업스케일링 실패: ${error.message}`);
                    } finally {
                      setIsUpscaling(false);
                    }
                  }}
                  disabled={isUpscaling}
                  className="px-3 py-1.5 bg-indigo-500 text-white text-sm rounded hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="업스케일"
                >
                  {isUpscaling ? '업스케일링 중...' : '업스케일'}
                </button>
            </div>

            {/* 이미지 카드 (비교 모달과 동일한 구조) */}
            <div className="grid gap-6 mb-6 grid-cols-1">
              <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 shadow-lg">
                {/* 이미지 썸네일 */}
                <div 
                  className="bg-gray-100 rounded-lg mb-4 overflow-hidden shadow-inner flex items-center justify-center relative"
                  style={{ 
                    maxHeight: '600px',
                    minHeight: '200px',
                    width: 'auto',
                    maxWidth: '600px',
                    margin: '0 auto'
                  }}
                >
                  <img
                    src={selectedImageForZoom.url}
                    alt={selectedImageForZoom.alt_text || selectedImageForZoom.name}
                    className="max-w-full max-h-full object-contain"
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
                
                {/* 이미지 정보 (개선된 디자인) */}
                <div className="space-y-3">
                  {/* 파일명 */}
                  <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                    <div className="text-sm font-semibold text-gray-800 truncate" title={selectedImageForZoom.name}>
                      {selectedImageForZoom.name}
                    </div>
                  </div>
                  
                  {/* 폴더 경로 */}
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">📁</span> {selectedImageForZoom.folder_path || '경로 없음'}
                  </div>
                  
                  {/* 크기, 포맷, 사용현황 (배지 형태) */}
                  <div className="flex gap-2 flex-wrap">
                    {selectedImageForZoom.size && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                        {(selectedImageForZoom.size / 1024 / 1024).toFixed(1)}MB
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium uppercase">
                      {selectedImageForZoom.name.split('.').pop()?.toUpperCase() || ''}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      selectedImageForZoom.usage_count && selectedImageForZoom.usage_count > 0
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-50 text-gray-500'
                    }`}>
                      {selectedImageForZoom.usage_count && selectedImageForZoom.usage_count > 0 
                        ? `✅ ${selectedImageForZoom.usage_count}회 사용` 
                        : '❌ 미사용'}
                    </span>
                  </div>
                  
                  {/* 사용 위치 (details 태그) */}
                  {selectedImageForZoom.used_in && selectedImageForZoom.used_in.length > 0 && (
                    <details className="text-xs mt-2">
                      <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium">
                        🔗 사용 위치 ({selectedImageForZoom.used_in.length}개)
                      </summary>
                      <div className="mt-2 space-y-1 pl-2 max-h-32 overflow-y-auto">
                        {selectedImageForZoom.used_in.slice(0, 5).map((u: any, idx: number) => (
                          <div key={idx} className="text-gray-600">
                            {u.type === 'blog' && '📰'} {u.type === 'funnel' && '🎯'} {u.type === 'homepage' && '🏠'} {u.type === 'muziik' && '🎵'} {(u.type === 'kakao_profile' || u.type === 'kakao_feed') && '💬'} {u.title || u.url || '링크 없음'}
                          </div>
                        ))}
                        {selectedImageForZoom.used_in.length > 5 && (
                          <div className="text-gray-400">... 외 {selectedImageForZoom.used_in.length - 5}개</div>
                        )}
                      </div>
                    </details>
                  )}
                  
                  {/* 삭제 버튼 */}
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => {
                        const fullPath = selectedImageForZoom.folder_path && selectedImageForZoom.folder_path !== '' 
                          ? `${selectedImageForZoom.folder_path}/${selectedImageForZoom.name}` 
                          : selectedImageForZoom.name;
                        if (confirm(`"${selectedImageForZoom.name}" 이미지를 삭제하시겠습니까?`)) {
                          handleDeleteImage(fullPath);
                          setSelectedImageForZoom(null);
                        }
                      }}
                      className="px-4 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors font-medium"
                      title="삭제"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            </div>


            {/* 썸네일 스트립 (1개 선택 시에만 표시) */}
            {!showCompareModal && (
              <div className="mt-6 pt-6 border-t border-gray-200">
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
                
                {/* 구글 지도 (GPS 정보가 있는 경우) */}
                {selectedImageForZoom && (selectedImageForZoom as any).gps_lat && (selectedImageForZoom as any).gps_lng && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">📍 촬영 위치</h4>
                    <iframe
                      src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${(selectedImageForZoom as any).gps_lat},${(selectedImageForZoom as any).gps_lng}&zoom=17`}
                      width="100%"
                      height="300"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 기존 이미지 변형 모달 */}
      {showExistingImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">🔄 기존 이미지 변형</h3>
              <button
                type="button"
                onClick={() => {
                  setShowExistingImageModal(false);
                  setSelectedExistingImage('');
                  setActiveImageTab('upload');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* 이미지 선택 탭 */}
              <div className="flex space-x-4 border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => setActiveImageTab('upload')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeImageTab === 'upload'
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
                  }`}
                >
                  📁 파일 업로드
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImageTab('gallery')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeImageTab === 'gallery'
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
                  }`}
                >
                  🖼️ 갤러리에서 선택
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImageTab('url')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeImageTab === 'url'
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
                  }`}
                >
                  🔗 URL 입력
                </button>
              </div>
              
              {/* 파일 업로드 섹션 */}
              {activeImageTab === 'upload' && (
                <div className="space-y-4">
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const files = e.dataTransfer.files;
                      if (files.length > 0) {
                        const file = files[0];
                        if (!file) return;
                        // 파일을 임시 URL로 변환
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          const result = e.target?.result as string;
                          if (result) {
                            setSelectedExistingImage(result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  >
                    <div className="space-y-4">
                      <div className="text-gray-500">
                        <label htmlFor="existing-image-upload" className="cursor-pointer">
                          <svg className="mx-auto h-12 w-12 text-gray-400 hover:text-blue-500 transition-colors" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </label>
                      </div>
                      <div>
                        <label htmlFor="existing-image-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            이미지 파일을 선택하거나 드래그하세요
                          </span>
                          <span className="mt-1 block text-sm text-gray-500">
                            PNG, JPG, GIF, HEIC 파일 지원
                          </span>
                        </label>
                        <input
                          id="existing-image-upload"
                          name="existing-image-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*,.heic,.heif"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                const result = e.target?.result as string;
                                if (result) {
                                  setSelectedExistingImage(result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 갤러리에서 선택 섹션 */}
              {activeImageTab === 'gallery' && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    갤러리에서 이미지 선택
                  </label>
                  <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {filteredImages.length > 0 ? (
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {filteredImages.map((image, index) => (
                          <div
                            key={index}
                            className={`relative cursor-pointer border-2 rounded-lg overflow-hidden transition-colors ${
                              selectedExistingImage === image.url
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-300'
                            }`}
                            onClick={() => setSelectedExistingImage(image.url)}
                          >
                            <img
                              src={image.url}
                              alt={image.name}
                              className="w-full h-20 object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder-image.jpg';
                              }}
                            />
                            <div className="p-1 bg-white">
                              <div className="text-xs text-gray-600 truncate" title={image.name}>
                                {image.name}
                              </div>
                            </div>
                            {selectedExistingImage === image.url && (
                              <div className="absolute top-1 right-1">
                                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">✓</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-2">🖼️</div>
                        <p>갤러리에 이미지가 없습니다</p>
                        <p className="text-sm">먼저 이미지를 업로드하거나 생성해주세요</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* URL 입력 섹션 */}
              {activeImageTab === 'url' && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    이미지 URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => {
                      const url = e.target.value;
                      if (url) {
                        if (url.startsWith('file://')) {
                          alert('로컬 파일 경로는 지원되지 않습니다. 웹 URL을 입력하거나 파일 업로드를 사용해주세요.');
                          e.target.value = '';
                          return;
                        }
                        setSelectedExistingImage(url);
                      }
                    }}
                  />
                </div>
              )}
              
              {/* 선택된 이미지 미리보기 */}
              {selectedExistingImage && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700">선택된 이미지</h4>
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <img
                      src={selectedExistingImage}
                      alt="선택된 이미지"
                      className="w-24 h-24 object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">이미지가 선택되었습니다</p>
                      <p className="text-xs text-gray-600 truncate">{selectedExistingImage.substring(0, 100)}...</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedExistingImage('')}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                    >
                      선택 해제
                    </button>
                  </div>
                </div>
              )}
              
              {/* 액션 버튼들 */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowExistingImageModal(false);
                    setSelectedExistingImage('');
                    setActiveImageTab('upload');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedExistingImage) {
                        setShowExistingImageModal(false);
                      handleLoadExistingImageAndPrompt();
                      } else {
                      alert('불러올 이미지를 선택해주세요.');
                    }
                  }}
                  disabled={!selectedExistingImage || isGeneratingExistingVariation}
                  className={`px-4 py-2 text-sm font-medium rounded-lg ${
                    selectedExistingImage && !isGeneratingExistingVariation
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isGeneratingExistingVariation ? '불러오는 중...' : '이미지 불러오기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 프롬프트 입력 모달 */}
      {showPromptModal && promptModalType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  프롬프트 입력
                </h3>
                <button
                  onClick={() => {
                    setShowPromptModal(false);
                    setPromptModalType(null);
                    setCustomPrompt('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    변형 프롬프트 {promptModalType === 'replicate' && '(Replicate는 프롬프트 지원 안 함)'}
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="예: Korean golfer, professional golf course, high quality, natural lighting"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                    disabled={promptModalType === 'replicate'}
                  />
                  {promptModalType === 'replicate' && (
                    <p className="mt-1 text-xs text-gray-500">
                      Replicate는 프롬프트 입력을 지원하지 않습니다. FAL 또는 Nanobanana를 사용해주세요.
                    </p>
                  )}
                  {promptModalType === 'nanobanana' && (
                    <p className="mt-1 text-xs text-gray-500">
                      원본 스타일 유지가 자동으로 적용됩니다. 프롬프트는 추가 변형 지시사항으로 사용됩니다.
                    </p>
                  )}
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowPromptModal(false);
                      setPromptModalType(null);
                      setCustomPrompt('');
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={async () => {
                      if (!selectedImageForZoom) {
                        alert('이미지를 선택해주세요.');
                        return;
                      }

                      if (promptModalType === 'replicate') {
                        alert('Replicate는 프롬프트 입력을 지원하지 않습니다.');
                        setShowPromptModal(false);
                        setPromptModalType(null);
                        setCustomPrompt('');
                        return;
                      }

                      setShowPromptModal(false);
                      
                      if (promptModalType === 'fal') {
                        setIsGeneratingExistingVariation(true);
                        setImageGenerationStep('FAL AI로 이미지 변형 중...');
                        setImageGenerationModel('FAL AI (프롬프트 입력)');
                        setShowGenerationProcess(true);
                        
                        try {
                          const response = await fetch('/api/vary-existing-image', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              imageUrl: selectedImageForZoom.url,
                              prompt: customPrompt || 'high quality image variation',
                              title: '갤러리 이미지 변형',
                              excerpt: '갤러리에서 변형된 이미지',
                              contentType: 'gallery',
                              brandStrategy: 'professional',
                              preset: variationPreset || 'creative',
                              originalImageFolder: selectedImageForZoom.folder_path || null
                            })
                          });
                          
                          if (response.ok) {
                            const result = await response.json();
                            
                            if (result.imageUrl) {
                              // selectedImageForZoom을 변형된 이미지로 업데이트 (모달 유지)
                              setSelectedImageForZoom({
                                ...selectedImageForZoom,
                                url: result.imageUrl,
                                name: result.fileName || selectedImageForZoom.name,
                                folder_path: selectedImageForZoom.folder_path
                              });
                              
                              fetchImages(1, true, folderFilter, includeChildren, searchQuery, true);
                              alert('✅ 이미지 변형이 완료되었습니다!');
                            } else {
                              throw new Error('변형된 이미지가 생성되지 않았습니다.');
                            }
                          } else {
                            const error = await response.json();
                            throw new Error(error.message || '이미지 변형에 실패했습니다.');
                          }
                        } catch (error: any) {
                          console.error('이미지 변형 오류:', error);
                          alert('이미지 변형 중 오류가 발생했습니다: ' + error.message);
                        } finally {
                          setIsGeneratingExistingVariation(false);
                          setTimeout(() => {
                            setShowGenerationProcess(false);
                            setImageGenerationStep('');
                          }, 2000);
                        }
                      } else if (promptModalType === 'nanobanana') {
                        await generateNanobananaVariation(
                          selectedImageForZoom.url,
                          selectedImageForZoom.name,
                          selectedImageForZoom.folder_path,
                          customPrompt
                        );
                      }
                      
                      setPromptModalType(null);
                      setCustomPrompt('');
                    }}
                    disabled={promptModalType === 'replicate'}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      promptModalType === 'replicate'
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : promptModalType === 'fal'
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    변형 시작
                  </button>
                </div>
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

      {/* 붙여넣기 모달 */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">📌 붙여넣기</h3>
              <button 
                onClick={() => {
                  setShowPasteModal(false);
                  setPasteTargetFolder(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                {copiedImages.length}개 이미지를 붙여넣을 폴더를 선택하세요.
              </p>
              <p className="text-xs text-gray-500 mb-4">
                💡 같은 폴더에 붙여넣으면 파일명 뒤에 순번이 자동으로 추가됩니다.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  폴더 경로
                </label>
                <input
                  type="text"
                  value={pasteTargetFolder || folderFilter !== 'all' && folderFilter !== 'root' ? folderFilter : ''}
                  onChange={(e) => setPasteTargetFolder(e.target.value)}
                  placeholder="originals/blog/2025-01 또는 폴더 트리에서 선택"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="text-xs text-gray-500">
                현재 선택된 폴더: {folderFilter !== 'all' && folderFilter !== 'root' ? folderFilter : '없음'}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => {
                  setShowPasteModal(false);
                  setPasteTargetFolder(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  const target = pasteTargetFolder || (folderFilter !== 'all' && folderFilter !== 'root' ? folderFilter : null);
                  if (target) {
                    handlePasteImages(target);
                  } else {
                    alert('폴더를 선택하거나 입력해주세요.');
                  }
                }}
                disabled={isBulkWorking}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBulkWorking ? '붙여넣는 중...' : '붙여넣기'}
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
                    onClick={async () => {
                      if (!newFolderName.trim()) {
                        alert('폴더명을 입력해주세요.');
                        return;
                      }

                      // 폴더명 검증 (특수문자, 공백 등)
                      const folderName = newFolderName.trim();
                      if (!/^[a-zA-Z0-9가-힣_/-]+$/.test(folderName)) {
                        alert('폴더명에는 영문, 숫자, 한글, 하이픈(-), 언더스코어(_), 슬래시(/)만 사용할 수 있습니다.');
                        return;
                      }

                      try {
                        const response = await fetch('/api/admin/create-folder', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ folderPath: folderName })
                        });

                        const result = await response.json();

                        if (response.ok && result.success) {
                          alert(`✅ 폴더가 생성되었습니다: ${folderName}`);
                          setNewFolderName('');
                          // 폴더 트리 새로고침
                          if (typeof fetchFolders === 'function') {
                            fetchFolders();
                          }
                        } else {
                          throw new Error(result.error || '폴더 생성 실패');
                        }
                      } catch (error: any) {
                        console.error('❌ 폴더 생성 오류:', error);
                        alert(`폴더 생성 실패: ${error.message}`);
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col my-auto">
            <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-800">이미지 추가</h3>
              <button onClick={()=>setShowAddModal(false)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
            </div>
            
            {/* 현재 경로 표시 (상단 고정) */}
            <div className="px-4 pt-4 pb-3 border-b bg-blue-50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-gray-600 mb-1">업로드/생성 대상 폴더</p>
                  <p className="text-sm font-mono font-semibold text-blue-700 break-all">
                    {selectedUploadFolder || '폴더를 선택하세요'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    // 현재 갤러리 폴더로 다시 설정
                    const currentFolder = folderFilter && folderFilter !== 'all' && folderFilter !== 'root' 
                      ? folderFilter 
                      : `uploaded/${new Date().toISOString().slice(0, 7)}/${new Date().toISOString().slice(0, 10)}`;
                    setSelectedUploadFolder(currentFolder);
                  }}
                  className="ml-3 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors whitespace-nowrap"
                >
                  현재 경로로 복원
                </button>
              </div>
            </div>
            
            <div className="px-4 pt-4 flex-shrink-0">
              <div className="flex space-x-6 border-b">
                <button
                  className={`px-2 pb-2 text-sm ${activeAddTab==='upload' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                  onClick={()=>setActiveAddTab('upload')}
                >📁 파일 업로드</button>
                <button
                  className={`px-2 pb-2 text-sm ${activeAddTab==='url' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                  onClick={()=>setActiveAddTab('url')}
                >🔗 URL 입력</button>
                <button
                  className={`px-2 pb-2 text-sm ${activeAddTab==='ai' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                  onClick={()=>setActiveAddTab('ai')}
                >🎨 AI 이미지 생성</button>
              </div>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {activeAddTab==='upload' && (
                <div className="grid grid-cols-2 gap-4">
                  {/* 왼쪽: 폴더 선택 (컴팩트) */}
                  <div className="space-y-2">
                  <FolderSelector
                    selectedPath={selectedUploadFolder}
                    onSelectPath={setSelectedUploadFolder}
                      defaultPath={folderFilter && folderFilter !== 'all' && folderFilter !== 'root' ? folderFilter : `uploaded/${new Date().toISOString().slice(0, 7)}/${new Date().toISOString().slice(0, 10)}`}
                    showLabel={true}
                      // 🔧 최적화: 이미 가져온 폴더 목록 전달 (추가 API 호출 없음)
                    folders={availableFolders}
                    isLoadingFolders={isLoadingFolders}
                  />
                  
                  {/* 업로드 모드 선택 */}
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                    <label className="text-xs font-medium text-gray-600 mb-2 block">
                      업로드 모드
                    </label>
                    
                    {/* 자동 (기본) */}
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="radio"
                        name="uploadMode"
                        value="auto"
                        checked={uploadMode === 'auto'}
                        onChange={(e) => setUploadMode('auto')}
                        className="mt-1 mr-2 w-4 h-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <span className="text-sm text-gray-700 font-medium">자동 (기본)</span>
                        <p className="text-xs text-gray-500 mt-1">
                          최적화 + 파일명 변경: {selectedUploadFolder ? (selectedUploadFolder.match(/originals\/([^\/]+)/)?.[1] || 'blog') : 'blog'}-{'{타임스탬프}'}-{'{랜덤}'}.jpg
                        </p>
                      </div>
                    </label>
                    
                    {/* 파일명 유지 */}
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="radio"
                        name="uploadMode"
                        value="preserve-name"
                        checked={uploadMode === 'preserve-name'}
                        onChange={(e) => setUploadMode('preserve-name')}
                        className="mt-1 mr-2 w-4 h-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <span className="text-sm text-gray-700 font-medium">파일명 유지</span>
                        <p className="text-xs text-gray-500 mt-1">
                          최적화 적용 + 파일명/확장자 원본 그대로: golf-hat-muziik-4.webp
                        </p>
                      </div>
                    </label>
                    
                    {/* 원본 그대로 */}
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="radio"
                        name="uploadMode"
                        value="preserve-original"
                        checked={uploadMode === 'preserve-original'}
                        onChange={(e) => setUploadMode('preserve-original')}
                        className="mt-1 mr-2 w-4 h-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <span className="text-sm text-gray-700 font-medium">원본 그대로</span>
                        <p className="text-xs text-gray-500 mt-1">
                          최적화 없음 + 파일명/확장자 원본 그대로: golf-hat-muziik-4.webp (원본 파일 그대로)
                        </p>
                      </div>
                    </label>
                  </div>
                  </div>
                  
                  {/* 오른쪽: 드래그 앤 드롭 업로드 영역 (컴팩트) */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      파일 업로드
                    </label>
                  <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const files = e.dataTransfer.files;
                      if (files.length > 0) {
                        const file = files[0];
                        if (!file) return;
                        try {
                          setPending(true);
                          
                          // 공통 업로드 함수 사용
                          const { url } = await uploadImageToSupabase(file, {
                            targetFolder: selectedUploadFolder || undefined,
                            enableHEICConversion: true,
                            enableEXIFBackfill: true,
                            uploadMode: uploadMode,
                          });
                          
                          // ✅ 업로드한 폴더로 자동 이동
                          const targetFolder = selectedUploadFolder || folderFilter;
                          if (targetFolder && targetFolder !== 'all' && targetFolder !== 'root') {
                            setFolderFilter(targetFolder);
                          }
                          
                          setShowAddModal(false);
                          fetchImages(1, true, targetFolder);
                          alert(`이미지 업로드 완료!\n저장 위치: ${targetFolder || '기본 폴더'}`);
                        } catch (e: any) {
                          console.error('❌ 이미지 업로드 오류:', e);
                          alert(`업로드 실패: ${e.message}`);
                        } finally {
                          setPending(false);
                        }
                      }
                    }}
                  >
                      <div className="space-y-3">
                      <div className="text-gray-500">
                        <label htmlFor="gallery-file-upload" className="cursor-pointer">
                            <svg className="mx-auto h-10 w-10 text-gray-400 hover:text-blue-500 transition-colors" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </label>
                      </div>
                      <div>
                        <label htmlFor="gallery-file-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                              파일 선택 또는 드래그
                          </span>
                            <span className="mt-1 block text-xs text-gray-500">
                              PNG, JPG, GIF, HEIC
                          </span>
                        </label>
                        <input
                          id="gallery-file-upload"
                          name="gallery-file-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*,.heic,.heif"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              setPending(true);
                              
                              // 공통 업로드 함수 사용
                              const { url } = await uploadImageToSupabase(file, {
                                targetFolder: selectedUploadFolder || undefined,
                                enableHEICConversion: true,
                                enableEXIFBackfill: true,
                                preserveFilename: preserveFilename,
                                preserveExtension: preserveExtension,
                              });
                              
                              setShowAddModal(false);
                              const uploadFolder = selectedUploadFolder || folderFilter;
                              setSelectedUploadFolder(''); // 업로드 후 폴더 선택 초기화
                              
                              // 업로드한 폴더만 새로고침 (전체 조회 방지로 타임아웃 방지)
                              if (uploadFolder && uploadFolder !== 'all' && uploadFolder !== 'root') {
                                fetchImages(1, true, uploadFolder, includeChildren, '', true); // forceRefresh=true
                              } else {
                                // 폴더가 없으면 현재 필터 사용 (전체 조회는 피함)
                                fetchImages(1, true, folderFilter !== 'all' ? folderFilter : 'root', includeChildren, searchQuery, true);
                              }
                              alert('이미지 업로드 완료');
                            } catch (e: any) {
                              console.error('❌ 이미지 업로드 오류:', e);
                              alert(`업로드 실패: ${e.message}`);
                            } finally {
                              setPending(false);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                    <p className="text-xs text-gray-500">업로드 후 자동으로 메타데이터가 보강됩니다.</p>
                  </div>
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
                          const targetFolder = selectedUploadFolder || `duplicated/${new Date().toISOString().slice(0,10)}`;
                          const resp = await fetch('/api/admin/duplicate-images',{
                            method:'POST', headers:{'Content-Type':'application/json'},
                            body: JSON.stringify({ images:[{ url: addUrl }], targetFolder })
                          });
                          const j = await resp.json();
                          if(!resp.ok) throw new Error(j.error||'URL 가져오기 실패');
                          
                          // ✅ 업로드한 폴더로 자동 이동
                          if (targetFolder && targetFolder !== 'all' && targetFolder !== 'root') {
                            setFolderFilter(targetFolder);
                          }
                          
                          setShowAddModal(false);
                          fetchImages(1, true, targetFolder);
                          alert(`URL 이미지가 갤러리에 추가되었습니다.\n저장 위치: ${targetFolder}`);
                        }catch(e:any){ alert(`실패: ${e.message}`); } finally{ setPending(false);} 
                      }}
                      className={`px-4 py-2 rounded text-white ${pending? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                    >가져오기</button>
                  </div>
                </div>
              )}

              {activeAddTab==='ai' && (
                <div className="space-y-4">
                  {/* 현재 폴더 표시 */}
                  <div className="p-3 bg-blue-50 rounded border border-blue-200">
                    <p className="text-xs text-gray-600 mb-1">생성된 이미지 저장 위치</p>
                    <p className="text-sm font-mono text-blue-700 break-all">{selectedUploadFolder || '폴더를 선택하세요'}</p>
                  </div>
                  
                  {/* 빠른 생성 프리셋 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      빠른 생성 프리셋
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const promptInput = document.getElementById('ai-prompt') as HTMLTextAreaElement;
                          if (promptInput) {
                            promptInput.value = '한국인 전문 피터가 골프 스튜디오에서 스윙 데이터를 태블릿으로 분석하는 장면, 프리미엄 골프 클럽이 배경에 배치되어 있음, 고급스러운 골프 스튜디오 인테리어, 한국인 피터의 명확한 한국인 외모와 특징, 피터가 모자를 쓰고 있고 모자와 옷에 MASSGOO 로고가 명확하게 보임, 스튜디오 벽면이나 아트월에 MASSGOO 브랜딩이 표시됨';
                            setAiBrandTone('senior_emotional');
                          }
                        }}
                        className="p-3 border-2 border-blue-500 bg-blue-50 rounded-lg text-left hover:bg-blue-100 transition-all"
                      >
                        <div className="font-semibold text-blue-900 mb-1 text-sm">🎯 피팅 이미지</div>
                        <div className="text-xs text-blue-700">전문 피터 작업 장면 (시니어 감성형)</div>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const promptInput = document.getElementById('ai-prompt') as HTMLTextAreaElement;
                          if (promptInput) {
                            promptInput.value = '밝고 현대적인 시타장(피팅 스튜디오) 내부, 골프 시뮬레이터 대형 스크린이 배경에 보임, 스윙 분석 장비와 피팅 장비가 보임, 골프 클럽 랙에 프리미엄 골프 클럽이 배치되어 있음, 피팅 테이블과 전문 장비들이 보임, 밝은 자연광과 따뜻한 조명, 긍정적이고 친근한 분위기, 고급스러운 시타장 인테리어, 시타장 벽면이나 아트월에 MASSGOO 브랜딩이 명확하게 표시됨, 밝고 현대적인 분위기, 사람은 없고 시타장의 시설과 장비만 보임';
                            setAiBrandTone('senior_emotional');
                          }
                        }}
                        className="p-3 border-2 border-yellow-500 bg-yellow-50 rounded-lg text-left hover:bg-yellow-100 transition-all"
                      >
                        <div className="font-semibold text-yellow-900 mb-1 text-sm">🌟 히어로 섹션</div>
                        <div className="text-xs text-yellow-700">밝은 배경 이미지 (가로형)</div>
                      </button>
                    </div>
                  </div>
                  
                  {/* 브랜딩 톤 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      브랜딩 톤
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAiBrandTone('senior_emotional')}
                        className={`p-3 border-2 rounded-lg text-left transition-all ${
                          aiBrandTone === 'senior_emotional'
                            ? 'border-yellow-500 bg-yellow-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-semibold text-sm text-gray-900">시니어 감성적</div>
                        <div className="text-xs text-gray-600 mt-1">골드 톤, 따뜻한 분위기</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiBrandTone('high_tech_innovative')}
                        className={`p-3 border-2 rounded-lg text-left transition-all ${
                          aiBrandTone === 'high_tech_innovative'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-semibold text-sm text-gray-900">하이테크 혁신형</div>
                        <div className="text-xs text-gray-600 mt-1">블랙 톤, 현대적 분위기</div>
                      </button>
                    </div>
                  </div>
                  
                  {/* AI 이미지 생성 폼 */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        프롬프트
                      </label>
                      <textarea
                        id="ai-prompt"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="예: Korean male golfer in his 50s, professional golf course, warm lighting..."
                      />
                    </div>
                    <div className="flex items-center space-x-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          이미지 개수
                        </label>
                        <select
                          id="ai-image-count"
                          className="px-3 py-2 border border-gray-300 rounded-md"
                          defaultValue="1"
                        >
                          <option value="1">1개</option>
                          <option value="2">2개</option>
                          <option value="4">4개</option>
                        </select>
                      </div>
                      <div className="flex-1"></div>
                      <button
                        onClick={async () => {
                          const promptInput = document.getElementById('ai-prompt') as HTMLTextAreaElement;
                          const countSelect = document.getElementById('ai-image-count') as HTMLSelectElement;
                          const prompt = promptInput?.value.trim();
                          const imageCount = parseInt(countSelect?.value || '1');
                          
                          if (!prompt) {
                            alert('프롬프트를 입력해주세요.');
                            return;
                          }
                          
                          if (!selectedUploadFolder) {
                            alert('저장할 폴더를 선택해주세요.');
                            return;
                          }
                          
                          try {
                            setPending(true);
                            
                            // AI 이미지 생성 API 호출 (브랜딩 톤 포함)
                            const response = await fetch('/api/kakao-content/generate-images', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                prompts: [{ prompt }],
                                metadata: {
                                  account: aiBrandTone === 'senior_emotional' ? 'account1' : 'account2',
                                  date: new Date().toISOString().split('T')[0],
                                  type: 'feed',
                                },
                                logoOption: 'full-brand', // 브랜딩 톤에 따라 자동 설정
                                imageCount: imageCount,
                                targetFolder: selectedUploadFolder, // ✅ 저장 폴더 지정
                              }),
                            });
                            
                            if (!response.ok) {
                              const error = await response.json();
                              throw new Error(error.message || '이미지 생성에 실패했습니다.');
                            }
                            
                            const result = await response.json();
                            const imageUrls = result.images || [];
                            
                            if (imageUrls.length === 0) {
                              throw new Error('생성된 이미지가 없습니다.');
                            }
                            
                            // 생성된 이미지가 자동으로 selectedUploadFolder에 저장됨
                            const targetFolder = selectedUploadFolder || folderFilter;
                            if (targetFolder && targetFolder !== 'all' && targetFolder !== 'root') {
                              setFolderFilter(targetFolder);
                            }
                            
                            setShowAddModal(false);
                            fetchImages(1, true, targetFolder);
                            alert(`AI 이미지 생성 완료! (${imageUrls.length}개)\n저장 위치: ${targetFolder || '기본 폴더'}`);
                          } catch (error: any) {
                            console.error('❌ AI 이미지 생성 오류:', error);
                            alert(`AI 이미지 생성 실패: ${error.message}`);
                          } finally {
                            setPending(false);
                          }
                        }}
                        disabled={pending || !selectedUploadFolder}
                        className={`px-4 py-2 rounded text-white ${pending || !selectedUploadFolder ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                        {pending ? '생성 중...' : '🎨 이미지 생성'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      💡 팁: 프롬프트에 "Korean golfer", "professional golf course" 등의 키워드를 포함하면 더 나은 결과를 얻을 수 있습니다.
                    </p>
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

      {/* 중복 제거 확인 모달 */}
      {showDuplicateModal && duplicateCheckResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">🔍 중복 이미지 확인 결과</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>폴더:</strong> {duplicateCheckResult.folderPath}
              </p>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-xs text-gray-600">전체 파일</div>
                  <div className="text-xl font-bold">{duplicateCheckResult.summary.totalFiles}개</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded">
                  <div className="text-xs text-gray-600">중복 그룹</div>
                  <div className="text-xl font-bold">{duplicateCheckResult.summary.duplicateGroups}개</div>
                </div>
                <div className="bg-red-50 p-3 rounded">
                  <div className="text-xs text-gray-600">제거 가능</div>
                  <div className="text-xl font-bold">{duplicateCheckResult.summary.safeToRemove}개</div>
                </div>
              </div>
            </div>

            {duplicateCheckResult.duplicateGroups && duplicateCheckResult.duplicateGroups.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">중복 그룹 상세:</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {duplicateCheckResult.duplicateGroups.map((group: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded p-3">
                      <div className="text-sm font-semibold mb-2">
                        그룹 {index + 1}: {group.count}개 파일 (hash_md5: {group.hash_md5.substring(0, 16)}...)
                      </div>
                      <div className="space-y-1">
                        {group.files.map((file: any, fileIndex: number) => {
                          const fileUsage = duplicateCheckResult.usageResults?.[index]?.files?.[fileIndex];
                          const isUsed = fileUsage?.usedIn?.totalCount > 0;
                          return (
                            <div key={fileIndex} className={`text-xs pl-4 ${isUsed ? 'text-green-600' : 'text-gray-600'}`}>
                              {fileIndex + 1}. {file.name}
                              {isUsed ? ` ✅ 사용 중 (${fileUsage.usedIn.totalCount}회)` : ' ❌ 미사용'}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {duplicateCheckResult.safeToRemove && duplicateCheckResult.safeToRemove.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 text-red-600">
                  제거 가능한 파일 ({duplicateCheckResult.safeToRemove.length}개):
                </h3>
                <div className="bg-red-50 border border-red-200 rounded p-3 max-h-40 overflow-y-auto">
                  {duplicateCheckResult.safeToRemove.map((file: any, index: number) => (
                    <div key={index} className="text-sm mb-1">
                      {index + 1}. {file.name}
                      <span className="text-xs text-gray-500 ml-2">(유지: {file.keepFile})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowDuplicateModal(false);
                  setDuplicateCheckResult(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                닫기
              </button>
              {duplicateCheckResult.safeToRemove && duplicateCheckResult.safeToRemove.length > 0 && (
                <button
                  onClick={handleRemoveDuplicates}
                  disabled={isCheckingDuplicates}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {isCheckingDuplicates ? '제거 중...' : `🗑️ ${duplicateCheckResult.safeToRemove.length}개 제거`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Phase 5-7: 이미지 비교 모달 */}
      {showCompareModal && compareResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-7xl w-full max-h-[95vh] overflow-y-auto">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-blue-600">
                  {compareResult.images.length === 1 ? '📋' : '🔍'}
                </span>
                {compareResult.images.length === 1 ? '이미지 상세 정보' : '이미지 비교 결과'}
              </h2>
              <button
                onClick={() => {
                  setShowCompareModal(false);
                  setCompareResult(null);
                  setSelectedForCompare(new Set());
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-light transition-colors"
                title="닫기"
              >
                ×
              </button>
            </div>
            
            {/* 상태 알림 - 2개 이상일 때만 표시 */}
            {compareResult.images.length >= 2 && (
            <div className="mb-6">
              <div className={`p-4 rounded-lg shadow-sm ${
                compareResult.analysis.isDuplicate 
                  ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500' 
                  : 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">
                    {compareResult.analysis.isDuplicate ? '⚠️' : '✅'}
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-semibold text-gray-800 mb-1">
                      {compareResult.analysis.isDuplicate ? '중복 이미지로 판단됨' : '중복 이미지가 아님'}
                    </div>
                    <div className="text-sm text-gray-600 leading-relaxed">
                      {compareResult.analysis.recommendation}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}
            
            {/* 유사도 점수 표시 (간소화) - 2개 이상일 때만 표시 */}
            {compareResult.images.length >= 2 && compareResult.analysis.similarityScore !== undefined && (
              <div className="mb-4 px-4 py-3 border-b bg-gray-50">
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">유사도:</span>
                  <span className="ml-2 text-lg font-bold text-blue-600">{compareResult.analysis.similarityScore}%</span>
                  {compareResult.analysis.similarityScore >= 80 && <span className="ml-2 text-xs text-orange-600">⚠️ 중복 가능</span>}
                  {compareResult.analysis.similarityScore >= 60 && compareResult.analysis.similarityScore < 80 && <span className="ml-2 text-xs text-yellow-600">⚡ 가능성 있음</span>}
                  <div className="flex gap-2 mt-2 text-xs">
                    <span className={`px-2 py-1 rounded ${compareResult.analysis.filenameMatch ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {compareResult.analysis.filenameMatch ? '✓' : '✗'} 파일명
                    </span>
                    <span className={`px-2 py-1 rounded ${compareResult.analysis.hashMatch ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {compareResult.analysis.hashMatch ? '✓' : '✗'} 해시
                    </span>
                    <span className={`px-2 py-1 rounded ${compareResult.analysis.sizeMatch ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {compareResult.analysis.sizeMatch ? '✓' : '✗'} 크기
                    </span>
                    <span className={`px-2 py-1 rounded ${compareResult.analysis.formatMatch ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {compareResult.analysis.formatMatch ? '✓' : '✗'} 포맷
                    </span>
                  </div>
                </div>
              </div>
            )}


            {/* 이미지 상세 정보 */}
            <div className={`grid gap-6 mb-6 ${
              compareResult.images.length === 1 ? 'grid-cols-1' :
              compareResult.images.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
              'grid-cols-1 md:grid-cols-3'
            }`}>
              {compareResult.images.map((img: any, index: number) => {
                // 사용 위치 분석
                const otherImages = compareResult.images.filter((other: any, idx: number) => idx !== index);
                const usedInList = Array.isArray(img.usedIn) ? img.usedIn : (img.usedIn ? [img.usedIn] : []);
                const commonLocations: any[] = [];
                const uniqueLocations: any[] = [];

                if (usedInList.length > 0) {
                  usedInList.forEach((location: any) => {
                    const isCommon = otherImages.some((other: any) => {
                      const otherUsedIn = Array.isArray(other.usedIn) ? other.usedIn : (other.usedIn ? [other.usedIn] : []);
                      return otherUsedIn.some((otherLoc: any) => 
                        otherLoc.type === location.type && 
                        otherLoc.title === location.title
                      );
                    });
                    
                    if (isCommon) {
                      commonLocations.push(location);
                    } else {
                      uniqueLocations.push(location);
                    }
                  });
                }

                return (
                  <div key={img.id} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 shadow-lg">
                    {/* 이미지 썸네일 - 원본 비율 유지 */}
                    <div 
                      className="bg-gray-100 rounded-lg mb-4 overflow-hidden shadow-inner flex items-center justify-center"
                      style={{ 
                        maxHeight: '600px',
                        minHeight: '200px',
                        width: compareResult.images.length === 1 ? 'auto' : '100%',
                        maxWidth: compareResult.images.length === 1 ? '600px' : '100%',
                        margin: compareResult.images.length === 1 ? '0 auto' : '0',
                        aspectRatio: img.width && img.height ? `${img.width} / ${img.height}` : undefined
                      }}
                    >
                      <img
                        src={img.cdnUrl}
                        alt={img.altText || img.filename}
                        className="max-w-full max-h-full object-contain"
                        style={{
                          width: img.width && img.height ? 'auto' : '100%',
                          height: img.width && img.height ? 'auto' : '100%'
                        }}
                      />
                    </div>
                    
                    {/* 이미지 정보 (개선된 디자인) */}
                    <div className="space-y-3">
                      {/* 파일명 */}
                      <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                        <div className="text-sm font-semibold text-gray-800 truncate" title={img.filename}>
                          {img.filename}
                        </div>
                      </div>
                      
                      {/* 폴더 경로 */}
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">📁</span> {img.filePath || '경로 없음'}
                      </div>
                      
                      {/* 크기, 포맷, 사용현황 (배지 형태) */}
                      <div className="flex gap-2 flex-wrap">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                          {(img.fileSize / 1024).toFixed(1)}KB
                        </span>
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium uppercase">
                          {img.format}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          img.usage && img.usedIn && img.usedIn.length > 0
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-50 text-gray-500'
                        }`}>
                          {img.usage && img.usedIn && img.usedIn.length > 0 
                            ? `✅ ${img.usageCount}회 사용` 
                            : '❌ 미사용'}
                        </span>
                      </div>
                      
                      {/* 사용 위치 (간소화 - details 태그) */}
                      {usedInList.length > 0 && (
                        <details className="text-xs mt-2">
                          <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium">
                            🔗 사용 위치 ({usedInList.length}개)
                          </summary>
                          <div className="mt-2 space-y-1 pl-2 max-h-32 overflow-y-auto">
                            {usedInList.slice(0, 5).map((u: any, idx: number) => (
                              <div key={idx} className="text-gray-600">
                                {u.type === 'blog' && '📰'} {u.type === 'funnel' && '🎯'} {u.type === 'homepage' && '🏠'} {u.type === 'muziik' && '🎵'} {(u.type === 'kakao_profile' || u.type === 'kakao_feed') && '💬'} {u.title || u.url || '링크 없음'}
                              </div>
                            ))}
                            {usedInList.length > 5 && (
                              <div className="text-gray-400">... 외 {usedInList.length - 5}개</div>
                            )}
                          </div>
                        </details>
                      )}
                      
                      {/* 사용 위치 - URL별 그룹화 (기존 상세 버전 - 주석 처리) */}
                      {false && usedInList.length > 0 && (() => {
                        // URL별로 그룹화
                        const groupedByUrl: { [key: string]: { url: string, title: string, locations: any[], count: number, lastUsed: string | null, type: string, isCommon: boolean } } = {};
                        
                        usedInList.forEach((u: any) => {
                          // URL 키 생성 (url이 있으면 url, 없으면 title 사용)
                          const urlKey = u.url || u.title || '링크 없음';
                          
                          if (!groupedByUrl[urlKey]) {
                            const isCommon = commonLocations.some(loc => 
                              loc.type === u.type && loc.title === u.title
                            );
                            
                            groupedByUrl[urlKey] = {
                              url: u.url || '',
                              title: u.title || '',
                              locations: [],
                              count: 0,
                              lastUsed: null,
                              type: u.type || '',
                              isCommon: isCommon
                            };
                          }
                          
                          groupedByUrl[urlKey].locations.push(u);
                          groupedByUrl[urlKey].count++;
                          
                          // 가장 최근 사용일 추적
                          if (u.updated_at || u.last_used_at) {
                            const usedDate = u.updated_at || u.last_used_at;
                            if (!groupedByUrl[urlKey].lastUsed || usedDate > groupedByUrl[urlKey].lastUsed) {
                              groupedByUrl[urlKey].lastUsed = usedDate;
                            }
                          }
                        });
                        
                        const groupedList = Object.values(groupedByUrl);
                        
                        return (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              <span>🔗</span>
                              <span>사용 위치 ({usedInList.length}개)</span>
                              {commonLocations.length > 0 && (
                                <span className="ml-auto text-green-600 text-xs">
                                  공통 {commonLocations.length}개
                                </span>
                              )}
                              {uniqueLocations.length > 0 && (
                                <span className="text-orange-600 text-xs">
                                  고유 {uniqueLocations.length}개
                                </span>
                              )}
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {groupedList.map((group, groupIdx) => {
                                const u = group.locations[0]; // 첫 번째 항목을 기준으로 링크 생성
                                
                                // 🔧 배포되지 않은 블로그 판단
                                const isUnpublishedBlog = u.type === 'blog' && 
                                  (u.status === 'draft' || u.status === 'archived' || 
                                   (u.isPublished === false && u.status !== 'published'));
                                
                                // 🔧 id가 없거나 유효하지 않으면 slug 사용
                                const getEditId = () => {
                                  if (u.id && u.id !== 'undefined' && u.id !== 'null' && String(u.id).trim() !== '') {
                                    return u.id;
                                  }
                                  if (u.slug && u.slug !== 'undefined' && u.slug !== 'null' && String(u.slug).trim() !== '') {
                                    return u.slug;
                                  }
                                  return null;
                                };
                                
                                const editId = getEditId();
                                
                                // 🔧 링크 URL 생성
                                let linkUrl = '#';
                                if (isUnpublishedBlog) {
                                  linkUrl = editId ? `/admin/blog?edit=${editId}` : '#';
                                } else {
                                  // 카카오 콘텐츠인 경우 날짜 파라미터 사용
                                  if (u.type === 'kakao_profile' || u.type === 'kakao_feed') {
                                    // date 속성을 우선 사용 (가장 정확함)
                                    if (u.date) {
                                      linkUrl = `/admin/kakao-content?date=${u.date}`;
                                    } else if (u.url) {
                                      // url이 있으면 그대로 사용 (이미 날짜 포함되어 있을 수 있음)
                                      // 상대 경로인 경우 그대로 사용, 절대 경로인 경우 변환
                                      if (u.url.startsWith('http')) {
                                        linkUrl = u.url;
                                      } else {
                                        linkUrl = u.url; // 상대 경로는 그대로 사용
                                      }
                                    } else {
                                      linkUrl = '#';
                                    }
                                  } else if (u.url) {
                                    linkUrl = u.url.startsWith('http') ? u.url : `http://localhost:3000${u.url}`;
                                  } else if (u.slug) {
                                    linkUrl = `http://localhost:3000/blog/${u.slug}`;
                                  } else {
                                    linkUrl = '#';
                                  }
                                }
                                
                                return (
                                  <div 
                                    key={groupIdx} 
                                    className={`text-xs p-2.5 rounded border ${
                                      group.isCommon ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
                                    }`}
                                  >
                                    {/* URL/제목 */}
                                    <div className="font-semibold text-gray-800 mb-1.5 flex items-center gap-2">
                                      <span className="text-base">
                                        {group.type === 'blog' && '📰'}
                                        {group.type === 'funnel' && '🎯'}
                                        {group.type === 'homepage' && '🏠'}
                                        {group.type === 'muziik' && '🎵'}
                                        {group.type === 'static_page' && '📄'}
                                        {(group.type === 'kakao_profile' || group.type === 'kakao_feed') && '💬'}
                                      </span>
                                      <span className="flex-1 min-w-0">
                                        {linkUrl !== '#' ? (
                                          <a 
                                            href={linkUrl}
                                            target={isUnpublishedBlog ? undefined : "_blank"}
                                            rel={isUnpublishedBlog ? undefined : "noopener noreferrer"}
                                            className={`${isUnpublishedBlog ? 'text-orange-600 hover:text-orange-800' : 'text-blue-600 hover:text-blue-800'} underline break-all`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (isUnpublishedBlog) {
                                                e.preventDefault();
                                                if (linkUrl !== '#') {
                                                  window.location.href = linkUrl;
                                                }
                                              }
                                            }}
                                            title={isUnpublishedBlog ? `초안/미배포: ${group.title}` : (u.url || linkUrl)}
                                          >
                                            {group.title}
                                            {isUnpublishedBlog && ' (초안)'}
                                          </a>
                                        ) : (
                                          <span className="text-gray-500">{group.title} (링크 없음)</span>
                                        )}
                                      </span>
                                    </div>
                                    
                                    {/* 위치 개수 및 사용일 */}
                                    <div className="text-gray-600 text-xs mt-1 flex items-center gap-2">
                                      <span>위치 {group.count}개</span>
                                      {group.lastUsed && (
                                        <>
                                          <span>•</span>
                                          <span>사용일: {new Date(group.lastUsed).toLocaleDateString('ko-KR', { 
                                            year: 'numeric', 
                                            month: '2-digit', 
                                            day: '2-digit' 
                                          })}</span>
                                        </>
                                      )}
                                    </div>
                                    
                                    {/* 배지들 */}
                                    <div className="flex gap-1 mt-1.5">
                                      {group.locations.some((loc: any) => loc.isFeatured) && (
                                        <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                                          대표
                                        </span>
                                      )}
                                      {group.locations.some((loc: any) => loc.isInContent && !loc.isFeatured) && (
                                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                          본문
                                        </span>
                                      )}
                                      {group.isCommon && (
                                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                          공통
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                      
                      {/* 삭제 버튼 */}
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => {
                            setImageToDelete(img);
                            setShowCompareDeleteConfirm(true);
                          }}
                          className="px-4 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors font-medium"
                          title="삭제"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* 비교 모달 개별 삭제 확인 모달 */}
      {showCompareDeleteConfirm && imageToDelete && (
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
                  이미지 삭제 확인
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  <span className="font-semibold text-red-600">{imageToDelete.filename}</span> 이미지를 삭제하시겠습니까?
                  <br />
                  <span className="text-red-600">이 작업은 되돌릴 수 없습니다.</span>
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => {
                      setShowCompareDeleteConfirm(false);
                      setImageToDelete(null);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={async () => {
                      if (!imageToDelete) return;

                      try {
                        console.log('🗑️ 이미지 삭제 시작:', {
                          id: imageToDelete.id,
                          filename: imageToDelete.filename,
                          usage: imageToDelete.usage,
                          usageCount: imageToDelete.usageCount
                        });

                        const response = await fetch('/api/admin/image-asset-manager', {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            id: imageToDelete.id,
                            permanent: true 
                          }),
                        });

                        console.log('📡 API 응답 상태:', response.status, response.statusText);

                        if (!response.ok) {
                          const errorData = await response.json();
                          console.error('❌ API 오류 응답:', errorData);
                          throw new Error(errorData.error || errorData.details || '삭제 실패');
                        }

                        const result = await response.json();
                        console.log('📦 API 응답 데이터:', result);

                        if (!result.success) {
                          console.error('❌ 삭제 실패:', result);
                          throw new Error(result.error || '삭제 실패');
                        }

                        // ✅ 모달을 닫지 않고 삭제된 이미지만 목록에서 제거
                        setCompareResult((prev: any) => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            images: prev.images.filter((i: any) => i.id !== imageToDelete.id)
                          };
                        });

                        // ✅ 로컬 images 상태에서도 즉시 제거
                        setImages((prev: any[]) => prev.filter((i: any) => i.id !== imageToDelete.id));

                        // ✅ 이미지 목록 새로고침 (캐시 무효화, 타이밍 증가)
                        setTimeout(() => {
                          fetchImages(1, true, folderFilter, includeChildren, searchQuery, true);
                        }, 500);

                        // 모달 닫기
                        setShowCompareDeleteConfirm(false);
                        setImageToDelete(null);

                        alert(`✅ 이미지 삭제 완료!\n\n${imageToDelete.filename}\n\n다른 이미지도 삭제할 수 있습니다.`);

                      } catch (error: any) {
                        console.error('❌ 이미지 삭제 오류:', error);
                        console.error('❌ 상세 오류 정보:', {
                          imageId: imageToDelete.id,
                          filename: imageToDelete.filename,
                          error: error.message,
                          stack: error.stack
                        });
                        alert(`이미지 삭제 중 오류가 발생했습니다:\n\n${error.message}\n\n콘솔을 확인해주세요.`);
                      }
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 확장자 중복 확인 모달 - 삭제됨 */}
      {false && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">🔄 확장자 중복 확인 결과</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>폴더:</strong> {extensionDuplicateResult.folderPath}
              </p>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-xs text-gray-600">전체 파일</div>
                  <div className="text-xl font-bold">{extensionDuplicateResult.totalFiles}개</div>
                </div>
                <div className="bg-orange-50 p-3 rounded">
                  <div className="text-xs text-gray-600">중복 그룹</div>
                  <div className="text-xl font-bold">{extensionDuplicateResult.totalDuplicateGroups}개</div>
                </div>
                <div className="bg-red-50 p-3 rounded">
                  <div className="text-xs text-gray-600">삭제 가능 파일</div>
                  <div className="text-xl font-bold">
                    {extensionDuplicateResult.duplicateGroups.reduce((sum: number, g: any) => 
                      sum + g.safeToRemoveJpg.length + (g.safeToRemovePng?.length || 0), 0)}개
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    JPG: {extensionDuplicateResult.duplicateGroups.reduce((sum: number, g: any) => sum + g.safeToRemoveJpg.length, 0)}개
                    {extensionDuplicateResult.duplicateGroups.some((g: any) => g.safeToRemovePng?.length > 0) && (
                      <span>, PNG: {extensionDuplicateResult.duplicateGroups.reduce((sum: number, g: any) => sum + (g.safeToRemovePng?.length || 0), 0)}개</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {extensionDuplicateResult.duplicateGroups && extensionDuplicateResult.duplicateGroups.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">확장자 중복 그룹:</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {extensionDuplicateResult.duplicateGroups.map((group: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded p-4">
                      <div className="text-sm font-semibold mb-3">
                        그룹 {index + 1}: {group.normalizedName}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* JPG 파일들 */}
                        {group.jpgFiles.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-gray-700 mb-2">JPG 파일 ({group.jpgFiles.length}개):</div>
                            <div className="space-y-3">
                              {group.jpgFiles.map((jpg: any, jpgIndex: number) => {
                                const jpgUrl = jpg.url || '';
                                return (
                                  <div key={jpgIndex} className={`text-xs p-3 rounded border-2 ${jpg.usage ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'}`}>
                                    {jpgUrl && (
                                      <div className="mb-2 aspect-square bg-gray-100 rounded overflow-hidden">
                                        <img
                                          src={jpgUrl}
                                          alt={jpg.name}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                          }}
                                        />
                                      </div>
                                    )}
                                    <div className="font-medium mb-1 truncate" title={jpg.name}>{jpg.name}</div>
                                    <div className="text-gray-500 mb-1">{(jpg.size / 1024).toFixed(1)}KB</div>
                                    <div className={`mb-2 ${jpg.usage ? 'text-green-600' : 'text-gray-400'}`}>
                                      {jpg.usage ? `✅ 사용 중 (${jpg.usageCount}회)` : '❌ 미사용'}
                                    </div>
                                    {!jpg.usage && jpg.dbId && (
                                      <button
                                        onClick={() => {
                                          if (confirm(`이 JPG 파일을 삭제하시겠습니까?\n\n${jpg.name}`)) {
                                            handleRemoveExtensionDuplicates([jpg.dbId], 'jpg');
                                          }
                                        }}
                                        className="w-full px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                                      >
                                        🗑️ 삭제
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* PNG 파일들 */}
                        {group.pngFiles && group.pngFiles.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-gray-700 mb-2">PNG 파일 ({group.pngFiles.length}개):</div>
                            <div className="space-y-3">
                              {group.pngFiles.map((png: any, pngIndex: number) => {
                                const pngUrl = png.url || '';
                                return (
                                  <div key={pngIndex} className={`text-xs p-3 rounded border-2 ${png.usage ? 'bg-green-50 border-green-300' : 'bg-purple-50 border-purple-300'}`}>
                                    {pngUrl && (
                                      <div className="mb-2 aspect-square bg-gray-100 rounded overflow-hidden">
                                        <img
                                          src={pngUrl}
                                          alt={png.name}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                          }}
                                        />
                                      </div>
                                    )}
                                    <div className="font-medium mb-1 truncate" title={png.name}>{png.name}</div>
                                    <div className="text-gray-500 mb-1">{(png.size / 1024).toFixed(1)}KB</div>
                                    <div className={`mb-2 ${png.usage ? 'text-green-600' : 'text-gray-400'}`}>
                                      {png.usage ? `✅ 사용 중 (${png.usageCount}회)` : '❌ 미사용'}
                                    </div>
                                    {!png.usage && png.dbId && (
                                      <button
                                        onClick={() => {
                                          if (confirm(`이 PNG 파일을 삭제하시겠습니까?\n\n${png.name}`)) {
                                            handleRemoveExtensionDuplicates([png.dbId], 'png');
                                          }
                                        }}
                                        className="w-full px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                                      >
                                        🗑️ 삭제
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* WebP 파일들 */}
                        {group.webpFiles.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-gray-700 mb-2">WebP 파일 ({group.webpFiles.length}개):</div>
                            <div className="space-y-3">
                              {group.webpFiles.map((webp: any, webpIndex: number) => {
                                const webpUrl = webp.url || '';
                                return (
                                  <div key={webpIndex} className={`text-xs p-3 rounded border-2 ${webp.usage ? 'bg-green-50 border-green-300' : 'bg-blue-50 border-blue-300'}`}>
                                    {webpUrl && (
                                      <div className="mb-2 aspect-square bg-gray-100 rounded overflow-hidden">
                                        <img
                                          src={webpUrl}
                                          alt={webp.name}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                          }}
                                        />
                                      </div>
                                    )}
                                    <div className="font-medium mb-1 truncate" title={webp.name}>{webp.name}</div>
                                    <div className="text-gray-500 mb-1">{(webp.size / 1024).toFixed(1)}KB</div>
                                    <div className={webp.usage ? 'text-green-600' : 'text-gray-400'}>
                                      {webp.usage ? `✅ 사용 중 (${webp.usageCount}회)` : '❌ 미사용'}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {(group.safeToRemoveJpg.length > 0 || group.safeToRemovePng?.length > 0) && (
                        <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded">
                          <div className="text-xs font-semibold text-orange-700 mb-1">
                            삭제 가능한 파일:
                          </div>
                          {group.safeToRemoveJpg.length > 0 && (
                            <div className="text-xs text-orange-600 mb-1">
                              JPG ({group.safeToRemoveJpg.length}개): {group.safeToRemoveJpg.map((jpg: any) => jpg.name).join(', ')}
                            </div>
                          )}
                          {group.safeToRemovePng && group.safeToRemovePng.length > 0 && (
                            <div className="text-xs text-orange-600">
                              PNG ({group.safeToRemovePng.length}개): {group.safeToRemovePng.map((png: any) => png.name).join(', ')}
                            </div>
                          )}
                          {group.recommendation === 'remove_png_or_jpg' && (
                            <div className="text-xs text-blue-600 mt-2 font-semibold">
                              💡 PNG와 JPG가 모두 있습니다. 사용자가 선택하여 삭제할 수 있습니다.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowExtensionDuplicateModal(false);
                  setExtensionDuplicateResult(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                닫기
              </button>
              {extensionDuplicateResult.duplicateGroups && extensionDuplicateResult.duplicateGroups.some((g: any) => 
                g.safeToRemoveJpg.length > 0 || g.safeToRemovePng?.length > 0
              ) && (
                <>
                  {extensionDuplicateResult.duplicateGroups.some((g: any) => g.safeToRemoveJpg.length > 0) && (
                    <button
                      onClick={() => {
                        const allJpgIds = extensionDuplicateResult.duplicateGroups
                          .flatMap((g: any) => g.safeToRemoveJpg)
                          .map((jpg: any) => jpg.dbId)
                          .filter(Boolean);
                        if (allJpgIds.length > 0) {
                          handleRemoveExtensionDuplicates(allJpgIds, 'jpg');
                        }
                      }}
                      disabled={isCheckingExtensionDuplicates}
                      className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                    >
                      {isCheckingExtensionDuplicates ? '삭제 중...' : `🗑️ JPG 삭제 (${extensionDuplicateResult.duplicateGroups.reduce((sum: number, g: any) => sum + g.safeToRemoveJpg.length, 0)}개)`}
                    </button>
                  )}
                  {extensionDuplicateResult.duplicateGroups.some((g: any) => g.safeToRemovePng?.length > 0) && (
                    <button
                      onClick={() => {
                        const allPngIds = extensionDuplicateResult.duplicateGroups
                          .flatMap((g: any) => g.safeToRemovePng || [])
                          .map((png: any) => png.dbId)
                          .filter(Boolean);
                        if (allPngIds.length > 0) {
                          handleRemoveExtensionDuplicates(allPngIds, 'png');
                        }
                      }}
                      disabled={isCheckingExtensionDuplicates}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                      {isCheckingExtensionDuplicates ? '삭제 중...' : `🗑️ PNG 삭제 (${extensionDuplicateResult.duplicateGroups.reduce((sum: number, g: any) => sum + (g.safeToRemovePng?.length || 0), 0)}개)`}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 블로그 중복 이미지 분석 모달 - 삭제됨 */}
      {false && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="p-6">
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">블로그 중복 이미지 분석 결과</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    분석한 글: {blogDuplicateAnalysis.summary.totalBlogPosts}개 | 
                    중복 그룹: {blogDuplicateAnalysis.summary.duplicateGroupsCount}개 | 
                    삭제 후보: {blogDuplicateAnalysis.summary.totalImagesToRemove}개 | 
                    예상 절약: {(blogDuplicateAnalysis.summary.estimatedSpaceToSave / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowBlogDuplicateModal(false);
                    setBlogDuplicateAnalysis(null);
                    setSelectedDuplicateHashes(new Set());
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* 전체 선택/해제 */}
              <div className="mb-4 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDuplicateHashes.size === blogDuplicateAnalysis.deletionCandidates.length && blogDuplicateAnalysis.deletionCandidates.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDuplicateHashes(new Set(blogDuplicateAnalysis.deletionCandidates.map((g: any) => g.hash_md5)));
                      } else {
                        setSelectedDuplicateHashes(new Set());
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    전체 선택 ({selectedDuplicateHashes.size}/{blogDuplicateAnalysis.deletionCandidates.length})
                  </span>
                </label>
                {selectedDuplicateHashes.size > 0 && (
                  <button
                    onClick={handleRemoveBlogDuplicates}
                    disabled={isRemovingDuplicates}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {isRemovingDuplicates ? '[삭제 중...]' : `[삭제] 선택한 그룹 삭제 (${selectedDuplicateHashes.size}개)`}
                  </button>
                )}
              </div>

              {/* 중복 그룹 목록 */}
              <div className="space-y-4">
                {blogDuplicateAnalysis.deletionCandidates.map((group: any, index: number) => {
                  const isSelected = selectedDuplicateHashes.has(group.hash_md5);
                  return (
                    <div
                      key={group.hash_md5}
                      className={`border-2 rounded-lg p-4 ${isSelected ? 'border-pink-500 bg-pink-50' : 'border-gray-200 bg-white'}`}
                    >
                      {/* 그룹 헤더 */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const newSelected = new Set(selectedDuplicateHashes);
                              if (e.target.checked) {
                                newSelected.add(group.hash_md5);
                              } else {
                                newSelected.delete(group.hash_md5);
                              }
                              setSelectedDuplicateHashes(newSelected);
                            }}
                            className="w-4 h-4 mt-1"
                          />
                          <div>
                            <div className="font-semibold text-gray-900">
                              그룹 {index + 1}: Hash {group.hash_md5.substring(0, 16)}...
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              총 {group.totalCount}개 중복 | 보존 {group.keepCount}개, 삭제 {group.removeCount}개 | 
                              사용 글: {group.blogPostCount}개
                            </div>
                            {group.blogPostTitles.length > 0 && (
                              <div className="text-xs text-gray-400 mt-1">
                                {group.blogPostTitles.slice(0, 3).join(', ')}
                                {group.blogPostTitles.length > 3 && ` 외 ${group.blogPostTitles.length - 3}개`}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 이미지 비교 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 보존할 이미지 */}
                        <div className="space-y-2">
                          <div className="text-sm font-semibold text-green-700 bg-green-50 px-2 py-1 rounded">
                            [보존] 보존할 이미지 ({group.imagesToKeep.length}개)
                          </div>
                          {group.imagesToKeep.map((img: any, imgIndex: number) => (
                            <div key={imgIndex} className="border-2 border-green-300 rounded-lg p-3 bg-green-50">
                              <div className="aspect-video bg-gray-100 rounded mb-2 overflow-hidden">
                                <img
                                  src={img.url}
                                  alt={img.fileName}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                              <div className="text-xs">
                                <div className="font-medium truncate" title={img.fileName}>{img.fileName}</div>
                                <div className="text-gray-500">{(img.size / 1024).toFixed(1)}KB</div>
                                <div className="text-green-600">사용: {img.usageCount}개 글</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* 삭제할 이미지 */}
                        <div className="space-y-2">
                          <div className="text-sm font-semibold text-red-700 bg-red-50 px-2 py-1 rounded">
                            [삭제] 삭제할 이미지 ({group.imagesToRemove.length}개)
                          </div>
                          {group.imagesToRemove.map((img: any, imgIndex: number) => (
                            <div key={imgIndex} className="border-2 border-red-300 rounded-lg p-3 bg-red-50">
                              <div className="aspect-video bg-gray-100 rounded mb-2 overflow-hidden">
                                <img
                                  src={img.url}
                                  alt={img.fileName}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                              <div className="text-xs">
                                <div className="font-medium truncate" title={img.fileName}>{img.fileName}</div>
                                <div className="text-gray-500">{(img.size / 1024).toFixed(1)}KB</div>
                                <div className="text-red-600">{img.reason}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 하단 액션 버튼 */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowBlogDuplicateModal(false);
                    setBlogDuplicateAnalysis(null);
                    setSelectedDuplicateHashes(new Set());
                  }}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium shadow-sm"
                >
                  닫기
                </button>
                {selectedDuplicateHashes.size > 0 && (
                  <button
                    onClick={handleRemoveBlogDuplicates}
                    disabled={isRemovingDuplicates}
                    className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                  >
                    {isRemovingDuplicates ? '[삭제 중...]' : `[삭제] 선택한 그룹 삭제 (${selectedDuplicateHashes.size}개)`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
                onClick={() => handleImageCopyOrLink(pendingImageDrop.imageData, pendingImageDrop.targetFolder, 'move')}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                📁 이동 (파일 이동)
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
                <li><strong>Alt + 드롭</strong>: 바로 이동</li>
                <li><strong>Shift + 드롭</strong>: 바로 링크 생성</li>
                <li><strong>Ctrl/Cmd + 드롭</strong>: 바로 복사</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
