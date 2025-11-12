'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Head from 'next/head';
import AdminNav from '../../components/admin/AdminNav';
import Link from 'next/link';
import { ImageMetadataModal } from '../../components/ImageMetadataModal';
import { CategoryManagementModal } from '../../components/CategoryManagementModal';
import FolderTree from '../../components/gallery/FolderTree';
import { createClient } from '@supabase/supabase-js';

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
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [imagesPerPage] = useState(20); // 성능 최적화를 위해 페이지당 이미지 수 감소
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
        alert(`✅ 확장자 중복 이미지가 없습니다.\n\n폴더: ${currentFolder}\n전체 파일: ${data.totalFiles}개`);
        setIsCheckingExtensionDuplicates(false);
        return;
      }

      setExtensionDuplicateResult(data);
      setShowExtensionDuplicateModal(true);

    } catch (error: any) {
      console.error('❌ 확장자 중복 감지 오류:', error);
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

  // Phase 5-7: 이미지 비교 핸들러
  const handleCompareImages = async () => {
    if (selectedForCompare.size < 1 || selectedForCompare.size > 3) {
      alert('1-3개의 이미지를 선택해주세요.');
      return;
    }

    try {
      const imageIds = Array.from(selectedForCompare);
      
      // 디버깅: 선택된 이미지 ID 확인
      console.log('🔍 비교할 이미지 ID:', imageIds);
      const selectedImagesData = images.filter(img => img.id && imageIds.includes(img.id));
      console.log('🔍 선택된 이미지 데이터:', selectedImagesData.map(img => ({
        id: img.id,
        filename: img.name,
        url: img.url
      })));

      if (selectedImagesData.length !== imageIds.length) {
        console.warn('⚠️ 일부 이미지를 찾을 수 없습니다:', {
          requested: imageIds.length,
          found: selectedImagesData.length
        });
      }

      const response = await fetch('/api/admin/compare-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds }),
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
  }, [images, filterType, folderFilter, selectedCategoryFilter, dynamicCategories, sortBy, sortOrder]);
  // searchQuery는 의존성에서 제거 (서버 사이드 검색 사용)
  
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
  
  // 업스케일링 관련 상태
  const [isUpscaling, setIsUpscaling] = useState(false);
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
      
      const response = await fetch(`/api/admin/all-images?limit=${imagesPerPage}&offset=${offset}&prefix=${prefix}&includeChildren=${effectiveIncludeChildren}${searchParam}${refreshParam}`);
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

  // 편집 시작
  // Replicate 변형 함수 (프롬프트 입력 불가, 빠르고 간단)
  const generateReplicateVariation = async (imageUrl: string, imageName: string) => {
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
        // 변형된 이미지를 Supabase에 저장
        const savedImages = [];
        for (let i = 0; i < result.images.length; i++) {
          try {
            const saveResponse = await fetch('/api/save-generated-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageUrl: result.images[i].originalUrl || result.images[i],
                fileName: `replicate-variation-${Date.now()}-${i + 1}.png`,
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

        alert(`✅ Replicate 변형 완료!\n\n${savedImages.length}개의 이미지가 생성되었습니다.`);
        
        // ✅ 모달 닫기
        setSelectedImageForZoom(null);
        
        // ✅ "전체 폴더"로 리셋
        setFolderFilter('all');
        setIncludeChildren(true);
        
        // ✅ 이미지 목록 새로고침 (캐시 무효화 포함)
        fetchImages(1, true, 'all', true, '', true);
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
        
        // 삭제된 이미지를 상태에서 제거 (즉시 UI 업데이트)
        setImages(prev => prev.filter(img => img.name !== imageName));
        
        // 현재 확대된 이미지가 삭제된 경우 모달 닫기
        if (selectedImageForZoom && selectedImageForZoom.name === imageName) {
          setSelectedImageForZoom(null);
        }
        
        alert('이미지가 삭제되었습니다.');
        
        // ✅ 서버에서 목록 새로고침 (캐시 무효화 포함)
        setTimeout(() => {
          // forceRefresh 파라미터로 캐시 무효화
          fetchImages(1, true, folderFilter, includeChildren, searchQuery, true);
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
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    placeholder="블로그 ID"
                    value={blogIdForOrganization || ''}
                    onChange={(e) => setBlogIdForOrganization(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <button
                    onClick={handleOrganizeBlogImages}
                    disabled={isOrganizingImages}
                    className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isOrganizingImages ? '정렬 중...' : '📁 이미지 정렬'}
                  </button>
                  <button
                    onClick={handleSyncBlogMetadata}
                    disabled={isSyncingBlogMetadata}
                    className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSyncingBlogMetadata ? '동기화 중...' : '🔄 메타 동기화'}
                  </button>
                </div>
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
              <button
                onClick={handleCheckAndRemoveDuplicates}
                disabled={isCheckingDuplicates}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="현재 선택된 폴더의 중복 이미지를 감지하고 제거합니다"
              >
                {isCheckingDuplicates ? '🔍 확인 중...' : '🔍 중복 제거 확인'}
              </button>
              <button
                onClick={handleCheckExtensionDuplicates}
                disabled={isCheckingExtensionDuplicates}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="현재 선택된 폴더의 JPG/WebP 확장자 중복을 감지합니다"
              >
                {isCheckingExtensionDuplicates ? '🔄 확인 중...' : '🔄 확장자 중복 확인'}
              </button>
              {selectedForCompare.size >= 1 && (
                <button
                  onClick={handleCompareImages}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                  title={selectedForCompare.size === 1 ? "선택된 이미지 상세 정보를 확인합니다" : "선택된 이미지를 비교합니다"}
                >
                  {selectedForCompare.size === 1 ? '📋 상세 보기' : `🔍 비교 (${selectedForCompare.size}개)`}
                </button>
              )}
              <div className="relative">
                <button
                  onClick={handleCampaignImageMigration}
                  disabled={isMigratingCampaigns}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title="월별 퍼널 이미지를 Supabase Storage로 마이그레이션"
                >
                  {isMigratingCampaigns ? '🔄 마이그레이션 중...' : '📦 퍼널 이미지 마이그레이션'}
                </button>
                {campaignMigrationProgress && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
                    <div className="text-sm font-semibold text-gray-700 mb-2">
                      {campaignMigrationProgress.step === 'init' && '마이그레이션 시작'}
                      {campaignMigrationProgress.step === 'folders' && '폴더 구조 생성'}
                      {campaignMigrationProgress.step === 'migrate' && `이미지 마이그레이션 (${campaignMigrationProgress.month})`}
                      {campaignMigrationProgress.step === 'html' && 'HTML 파일 업데이트'}
                      {campaignMigrationProgress.step === 'blog' && '블로그 본문 업데이트'}
                      {campaignMigrationProgress.step === 'complete' && '마이그레이션 완료'}
                      {campaignMigrationProgress.step === 'error' && '오류 발생'}
                    </div>
                    {campaignMigrationProgress.message && (
                      <div className="text-xs text-gray-600 mb-2">
                        {campaignMigrationProgress.message}
                      </div>
                    )}
                    {campaignMigrationProgress.current && campaignMigrationProgress.total && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(campaignMigrationProgress.current / campaignMigrationProgress.total) * 100}%` }}
                        />
                      </div>
                    )}
                    {campaignMigrationProgress.current && campaignMigrationProgress.total && (
                      <div className="text-xs text-gray-500">
                        {campaignMigrationProgress.current} / {campaignMigrationProgress.total}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {SHOW_LEGACY_META_SYNC_BUTTON && (
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
              )}
              
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
          {/* 메인 레이아웃: 트리 사이드바 + 콘텐츠 영역 */}
          <div className="flex gap-6">
            {/* 트리 사이드바 (왼쪽) */}
            <div className="w-80 flex-shrink-0">
              <FolderTree
                folders={availableFolders}
                selectedFolder={folderFilter}
                onFolderSelect={(folderPath) => {
                  setFolderFilter(folderPath);
                  setCurrentPage(1);
                  fetchImages(1, true, folderPath, includeChildren, searchQuery);
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
                onImageDrop={async (imageData, targetFolder) => {
                  try {
                    console.log('📁 이미지 드롭:', { imageData, targetFolder });
                    
                    const response = await fetch('/api/admin/move-image-to-folder', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        imageUrl: imageData.url,
                        targetFolder: targetFolder
                      })
                    });

                    const result = await response.json();

                    if (result.success) {
                      alert(`✅ 이미지가 "${targetFolder}" 폴더로 이동되었습니다.`);
                      // 이미지 목록 새로고침
                      fetchImages(currentPage, false, folderFilter, includeChildren, searchQuery);
                    } else {
                      alert(`❌ 이미지 이동 실패: ${result.error || result.details}`);
                    }
                  } catch (error) {
                    console.error('❌ 이미지 이동 오류:', error);
                    alert(`❌ 이미지 이동 중 오류가 발생했습니다: ${error.message}`);
                  }
                }}
              />
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
                  <button
                    type="button"
                    onClick={handleBulkGolfAIGeneration}
                    disabled={isBulkWorking}
                    className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBulkWorking ? '⏳ 생성 중...' : '⛳ 골프 AI 생성 (일괄)'}
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
                        e.currentTarget.style.opacity = '0.5';
                      }}
                      onDragEnd={(e) => {
                        e.currentTarget.style.opacity = '1';
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
                      
                      {/* 비교 선택 표시 (비교용 - 초록색) */}
                      {image.id && selectedForCompare.has(image.id) && (
                        <div className="absolute top-2 left-2 z-10">
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">🔍</span>
                          </div>
                        </div>
                      )}
                      
                      {/* 비교용 체크박스 (Phase 5-7) - 하단 우측에 배치 */}
                      <div 
                        className="absolute bottom-2 right-2 z-20 compare-checkbox opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (image.id) {
                            toggleImageForCompare(image.id);
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={image.id ? selectedForCompare.has(image.id) : false}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (image.id) {
                              toggleImageForCompare(image.id);
                            }
                          }}
                          className="w-5 h-5 rounded border-2 border-green-500 text-green-600 focus:ring-green-500 compare-checkbox bg-white"
                          title="비교용 선택 (2-3개)"
                        />
                      </div>
                      
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
                        
                        {/* 🔗 사용 위치 상세 정보 (새로 추가) */}
                        {image.usage_count > 0 && image.used_in && image.used_in.length > 0 && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs border border-gray-200">
                            <div className="font-semibold mb-1 text-gray-700">
                              🔗 {image.usage_count}회 사용 ({image.used_in.length}개 위치)
                            </div>
                            <div className="space-y-1 max-h-24 overflow-y-auto">
                              {image.used_in.slice(0, 3).map((usage, idx) => (
                                <div key={idx} className="text-gray-600 flex items-start">
                                  <span className="mr-1">
                                    {usage.type === 'blog' && '📰'}
                                    {usage.type === 'funnel' && '🎯'}
                                    {usage.type === 'homepage' && '🏠'}
                                    {usage.type === 'muziik' && '🎵'}
                                    {usage.type === 'static_page' && '📄'}
                                  </span>
                                  <span className="flex-1 truncate">
                                    {usage.url ? (
                                      <a 
                                        href={usage.url.startsWith('http') ? usage.url : `http://localhost:3000${usage.url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 underline"
                                        onClick={(e) => e.stopPropagation()}
                                        title={usage.url}
                                      >
                                        {usage.title}
                                      </a>
                                    ) : (
                                      usage.title
                                    )}
                                    {usage.isFeatured && <span className="text-yellow-600 ml-1">(대표)</span>}
                                    {usage.isInContent && !usage.isFeatured && <span className="text-blue-600 ml-1">(본문)</span>}
                                  </span>
                                </div>
                              ))}
                              {image.used_in.length > 3 && (
                                <div className="text-gray-500 text-xs">
                                  +{image.used_in.length - 3}개 위치 더...
                                </div>
                              )}
                            </div>
                            {image.last_used_at && (
                              <div className="mt-1 text-gray-500 text-xs">
                                📅 최근 사용: {new Date(image.last_used_at).toLocaleDateString('ko-KR')}
                              </div>
                            )}
                          </div>
                        )}
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
                            generateReplicateVariation(image.url, image.name);
                          }}
                          disabled={isGeneratingReplicateVariation}
                          className={`p-1 rounded shadow-sm ${
                            isGeneratingReplicateVariation
                              ? 'bg-purple-300 text-white cursor-not-allowed'
                              : 'bg-purple-500 text-white hover:bg-purple-600'
                          }`}
                          title="변형 (Replicate - 빠르고 간단, 프롬프트 입력 불가)"
                        >
                          {isGeneratingReplicateVariation ? '…' : '🎨'}
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
                  onClick={() => {
                    // 기존 이미지 변형 모달 열기 (FAL AI - 프롬프트 입력 가능)
                    setSelectedExistingImage(selectedImageForZoom.url);
                    setShowExistingImageModal(true);
                  }}
                  className="px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 transition-colors"
                  title="변형 (FAL AI - 프롬프트 입력 가능)"
                >
                  🔄 변형 (FAL)
                </button>
                <button
                  onClick={async () => {
                    // Replicate 변형 (프롬프트 입력 불가, 빠르고 간단)
                    if (!selectedImageForZoom) return;
                    if (isGeneratingReplicateVariation) return;
                    await generateReplicateVariation(selectedImageForZoom.url, selectedImageForZoom.name);
                  }}
                  disabled={isGeneratingReplicateVariation}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    isGeneratingReplicateVariation
                      ? 'bg-purple-300 text-white cursor-not-allowed'
                      : 'bg-purple-500 text-white hover:bg-purple-600'
                  }`}
                  title="변형 (Replicate - 빠르고 간단, 프롬프트 입력 불가)"
                >
                  {isGeneratingReplicateVariation ? '⏳ 변형 중...' : '🎨 변형 (Replicate)'}
                </button>
                <button
                  onClick={async () => {
                    // 업스케일링 시작
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
                        // 이미지 목록 새로고침
                        fetchImages(1, true, folderFilter, includeChildren, searchQuery);
                        // 업스케일된 이미지로 교체
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
                  className="px-3 py-1 bg-indigo-500 text-white text-sm rounded hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="업스케일"
                >
                  {isUpscaling ? '⏳ 업스케일링 중...' : '⬆️ 업스케일'}
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
                  {/* 드래그 앤 드롭 업로드 영역 */}
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
                        try {
                          setPending(true);
                          
                          // Supabase 클라이언트 초기화
                          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
                          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
                          if (!supabaseUrl || !supabaseAnonKey) {
                            throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
                          }
                          const sb = createClient(supabaseUrl, supabaseAnonKey);
                          
                          // 1) 파일명 정리 및 경로 생성
                          const dateStr = new Date().toISOString().slice(0, 10);
                          const baseName = (file.name || 'upload').replace(/[^a-zA-Z0-9_.-]/g, '_').replace(/\s+/g, '_');
                          const ts = Date.now();
                          const objectPath = `originals/${dateStr}/${ts}_${baseName}`;
                          
                          // 2) 서명 업로드 URL 발급
                          const res = await fetch('/api/admin/storage-signed-upload', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ path: objectPath })
                          });
                          
                          if (!res.ok) {
                            const error = await res.json();
                            throw new Error(error.error || '서명 URL 발급 실패');
                          }
                          
                          const { token } = await res.json();
                          
                          // 3) Supabase SDK로 업로드
                          const { error: uploadError } = await sb.storage
                            .from('blog-images')
                            .uploadToSignedUrl(objectPath, token, file);
                          
                          if (uploadError) {
                            throw new Error(`업로드 실패: ${uploadError.message}`);
                          }
                          
                          // 4) 공개 URL 가져오기
                          const { data: publicUrlData } = sb.storage
                            .from('blog-images')
                            .getPublicUrl(objectPath);
                          const publicUrl = publicUrlData?.publicUrl;
                          
                          if (!publicUrl) {
                            throw new Error('공개 URL을 가져올 수 없습니다.');
                          }
                          
                          // 5) 메타데이터 저장
                          await fetch('/api/admin/upsert-image-metadata', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              file_name: file.name,
                              image_url: publicUrl,
                              date_folder: dateStr,
                              width: null,
                              height: null,
                              file_size: file.size
                            })
                          });
                          
                          // 6) EXIF 백필 비동기
                          fetch('/api/admin/backfill-exif', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ paths: [objectPath] })
                          }).catch(err => console.error('EXIF 백필 오류:', err));
                          
                          setShowAddModal(false);
                          fetchImages(1, true);
                          alert('이미지 업로드 완료');
                        } catch (e: any) {
                          console.error('❌ 이미지 업로드 오류:', e);
                          alert(`업로드 실패: ${e.message}`);
                        } finally {
                          setPending(false);
                        }
                      }
                    }}
                  >
                    <div className="space-y-4">
                      <div className="text-gray-500">
                        <label htmlFor="gallery-file-upload" className="cursor-pointer">
                          <svg className="mx-auto h-12 w-12 text-gray-400 hover:text-blue-500 transition-colors" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </label>
                      </div>
                      <div>
                        <label htmlFor="gallery-file-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            이미지 파일을 선택하거나 드래그하세요
                          </span>
                          <span className="mt-1 block text-sm text-gray-500">
                            PNG, JPG, GIF, HEIC 파일 지원
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
                              
                              // Supabase 클라이언트 초기화
                              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
                              const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
                              if (!supabaseUrl || !supabaseAnonKey) {
                                throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
                              }
                              const sb = createClient(supabaseUrl, supabaseAnonKey);
                              
                              // 1) 파일명 정리 및 경로 생성
                              const dateStr = new Date().toISOString().slice(0, 10);
                              const baseName = (file.name || 'upload').replace(/[^a-zA-Z0-9_.-]/g, '_').replace(/\s+/g, '_');
                              const ts = Date.now();
                              const objectPath = `originals/${dateStr}/${ts}_${baseName}`;
                              
                              // 2) 서명 업로드 URL 발급
                              const res = await fetch('/api/admin/storage-signed-upload', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ path: objectPath })
                              });
                              
                              if (!res.ok) {
                                const error = await res.json();
                                throw new Error(error.error || '서명 URL 발급 실패');
                              }
                              
                              const { token } = await res.json();
                              
                              // 3) Supabase SDK로 업로드
                              const { error: uploadError } = await sb.storage
                                .from('blog-images')
                                .uploadToSignedUrl(objectPath, token, file);
                              
                              if (uploadError) {
                                throw new Error(`업로드 실패: ${uploadError.message}`);
                              }
                              
                              // 4) 공개 URL 가져오기
                              const { data: publicUrlData } = sb.storage
                                .from('blog-images')
                                .getPublicUrl(objectPath);
                              const publicUrl = publicUrlData?.publicUrl;
                              
                              if (!publicUrl) {
                                throw new Error('공개 URL을 가져올 수 없습니다.');
                              }
                              
                              // 5) 메타데이터 저장
                              await fetch('/api/admin/upsert-image-metadata', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  file_name: file.name,
                                  image_url: publicUrl,
                                  date_folder: dateStr,
                                  width: null,
                                  height: null,
                                  file_size: file.size
                                })
                              });
                              
                              // 6) EXIF 백필 비동기
                              fetch('/api/admin/backfill-exif', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ paths: [objectPath] })
                              }).catch(err => console.error('EXIF 백필 오류:', err));
                              
                              setShowAddModal(false);
                              fetchImages(1, true);
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
            
            {/* 유사도 점수 표시 (개선) - 2개 이상일 때만 표시 */}
            {compareResult.images.length >= 2 && compareResult.analysis.similarityScore !== undefined && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 종합 유사도 */}
                      <div>
                        <div className="text-sm font-semibold text-gray-700 mb-2">
                          📊 종합 유사도
                          <span className="ml-2 text-xs text-gray-500">(파일명, 해시, 크기, 포맷 종합)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-2xl font-bold text-blue-700">
                            {compareResult.analysis.similarityScore}%
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-3">
                            <div 
                              className={`h-3 rounded-full transition-all ${
                                compareResult.analysis.similarityScore >= 80 ? 'bg-red-500' :
                                compareResult.analysis.similarityScore >= 60 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(compareResult.analysis.similarityScore, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {compareResult.analysis.similarityScore >= 80 && '⚠️ 중복 가능성 높음'}
                          {compareResult.analysis.similarityScore >= 60 && compareResult.analysis.similarityScore < 80 && '⚡ 중복 가능성 있음'}
                          {compareResult.analysis.similarityScore < 60 && '✅ 다른 이미지'}
                        </div>
                      </div>
                      
                      {/* 시각적 유사도 */}
                      {compareResult.analysis.phashSimilarity > 0 && (
                        <div>
                          <div className="text-sm font-semibold text-gray-700 mb-2">
                            🎨 시각적 유사도
                            <span className="ml-2 text-xs text-gray-500">(pHash 기반 이미지 유사도)</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-2xl font-bold text-purple-700">
                              {compareResult.analysis.phashSimilarity}%
                            </div>
                            <div className="flex-1 bg-gray-200 rounded-full h-3">
                              <div 
                                className={`h-3 rounded-full transition-all ${
                                  compareResult.analysis.phashSimilarity >= 85 ? 'bg-purple-600' :
                                  compareResult.analysis.phashSimilarity >= 70 ? 'bg-purple-400' :
                                  'bg-purple-300'
                                }`}
                                style={{ width: `${Math.min(compareResult.analysis.phashSimilarity, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {compareResult.analysis.phashSimilarity >= 85 && '🎯 매우 유사'}
                            {compareResult.analysis.phashSimilarity >= 70 && compareResult.analysis.phashSimilarity < 85 && '👁️ 유사'}
                            {compareResult.analysis.phashSimilarity < 70 && '🔍 다름'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
            
            {/* 비교 기준 상세 - 2개 이상일 때만 표시 */}
            {compareResult.images.length >= 2 && (
            <div className="mt-4 pt-4 border-t border-gray-200 mb-6">
                  <div className="text-xs font-semibold text-gray-500 mb-2">비교 기준:</div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className={`p-2 rounded text-center transition-all ${
                      compareResult.analysis.filenameMatch 
                        ? 'bg-green-100 text-green-700 border border-green-300 shadow-sm' 
                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                    }`}>
                      <div className="text-lg mb-1">{compareResult.analysis.filenameMatch ? '✓' : '✗'}</div>
                      <div className="text-xs">파일명 일치</div>
                    </div>
                    <div className={`p-2 rounded text-center transition-all ${
                      compareResult.analysis.normalizedFilenameMatch 
                        ? 'bg-green-100 text-green-700 border border-green-300 shadow-sm' 
                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                    }`}>
                      <div className="text-lg mb-1">{compareResult.analysis.normalizedFilenameMatch ? '✓' : '✗'}</div>
                      <div className="text-xs">정규화 파일명</div>
                    </div>
                    <div className={`p-2 rounded text-center transition-all ${
                      compareResult.analysis.hashMatch 
                        ? 'bg-green-100 text-green-700 border border-green-300 shadow-sm' 
                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                    }`}>
                      <div className="text-lg mb-1">{compareResult.analysis.hashMatch ? '✓' : '✗'}</div>
                      <div className="text-xs">해시 일치</div>
                    </div>
                    <div className={`p-2 rounded text-center transition-all ${
                      compareResult.analysis.sizeMatch 
                        ? 'bg-green-100 text-green-700 border border-green-300 shadow-sm' 
                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                    }`}>
                      <div className="text-lg mb-1">{compareResult.analysis.sizeMatch ? '✓' : '✗'}</div>
                      <div className="text-xs">크기 일치</div>
                    </div>
                    <div className={`p-2 rounded text-center transition-all ${
                      compareResult.analysis.formatMatch 
                        ? 'bg-green-100 text-green-700 border border-green-300 shadow-sm' 
                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                    }`}>
                      <div className="text-lg mb-1">{compareResult.analysis.formatMatch ? '✓' : '✗'}</div>
                      <div className="text-xs">포맷 일치</div>
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
                    {/* 이미지 썸네일 */}
                    <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden shadow-inner">
                      <img
                        src={img.cdnUrl}
                        alt={img.altText || img.filename}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* 이미지 정보 */}
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-semibold text-gray-500 mb-1">파일명</div>
                        <div className="text-sm text-gray-800 break-all font-mono" title={img.filename}>
                          {img.filename}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs font-semibold text-gray-500 mb-1">파일 크기</div>
                          <div className="text-sm font-semibold text-gray-700">{(img.fileSize / 1024).toFixed(1)}KB</div>
                        </div>
                        {img.width && img.height && (
                          <div>
                            <div className="text-xs font-semibold text-gray-500 mb-1">픽셀 사이즈</div>
                            <div className="text-sm font-semibold text-gray-700">{img.width} × {img.height}px</div>
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-semibold text-gray-500 mb-1">포맷</div>
                          <div className="text-sm font-semibold text-gray-700 uppercase">{img.format}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-500 mb-1">사용 현황</div>
                          <div className={`text-sm font-semibold ${img.usage ? 'text-green-600' : 'text-gray-400'}`}>
                            {img.usage ? `✅ ${img.usageCount}회` : '❌ 미사용'}
                          </div>
                        </div>
                      </div>
                      
                      {/* 사용 위치 */}
                      {usedInList.length > 0 && (
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
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {usedInList.map((u: any, idx: number) => {
                              const isCommon = commonLocations.some(loc => 
                                loc.type === u.type && loc.title === u.title
                              );
                              return (
                                <div 
                                  key={idx} 
                                  className={`text-xs p-2 rounded flex items-start gap-2 ${
                                    isCommon ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'
                                  }`}
                                >
                                  <span className="text-base">
                                    {u.type === 'blog' && '📰'}
                                    {u.type === 'funnel' && '🎯'}
                                    {u.type === 'homepage' && '🏠'}
                                    {u.type === 'muziik' && '🎵'}
                                    {u.type === 'static_page' && '📄'}
                                  </span>
                                  <span className="flex-1 min-w-0">
                                    {u.url ? (
                                      <a 
                                        href={u.url.startsWith('http') ? u.url : `http://localhost:3000${u.url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 underline break-all"
                                        onClick={(e) => e.stopPropagation()}
                                        title={u.url}
                                      >
                                        {u.title}
                                      </a>
                                    ) : (
                                      <span className="text-gray-700">{u.title}</span>
                                    )}
                                    <div className="flex gap-1 mt-0.5">
                                      {u.isFeatured && (
                                        <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                                          대표
                                        </span>
                                      )}
                                      {u.isInContent && !u.isFeatured && (
                                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                          본문
                                        </span>
                                      )}
                                      {isCommon && (
                                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                          공통
                                        </span>
                                      )}
                                    </div>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* 개별 삭제 버튼 */}
                      {!img.usage && (
                        <button
                          onClick={async () => {
                            if (!confirm(`이 이미지를 삭제하시겠습니까?\n\n${img.filename}`)) {
                              return;
                            }

                            try {
                              const response = await fetch('/api/admin/image-asset-manager', {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                  id: img.id,
                                  permanent: true 
                                }),
                              });

                              if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.error || errorData.details || '삭제 실패');
                              }

                              const result = await response.json();
                              if (!result.success) {
                                throw new Error(result.error || '삭제 실패');
                              }

                              alert(`✅ 이미지 삭제 완료!\n\n${img.filename}`);

                              setShowCompareModal(false);
                              setCompareResult(null);
                              setSelectedForCompare(new Set());
                              setTimeout(() => {
                                fetchImages(1, true, folderFilter, includeChildren, searchQuery);
                              }, 100);

                            } catch (error: any) {
                              console.error('❌ 이미지 삭제 오류:', error);
                              alert(`이미지 삭제 중 오류가 발생했습니다: ${error.message}`);
                            }
                          }}
                          className="w-full mt-4 px-4 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors shadow-sm"
                        >
                          🗑️ 이 이미지 삭제
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 하단 액션 버튼 */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowCompareModal(false);
                  setCompareResult(null);
                  setSelectedForCompare(new Set());
                }}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium shadow-sm"
              >
                닫기
              </button>
              {/* 중복 이미지이고 미사용인 경우 삭제 버튼 표시 */}
              {compareResult.analysis.isDuplicate && 
               compareResult.images.some((img: any) => !img.usage) && (
                <button
                  onClick={async () => {
                    const unusedImages = compareResult.images.filter((img: any) => !img.usage);
                    const unusedIds = unusedImages.map((img: any) => img.id);
                    
                    if (unusedIds.length === 0) {
                      alert('삭제할 수 있는 이미지가 없습니다.');
                      return;
                    }

                    const confirmMessage = unusedIds.length === 1
                      ? `이미지 1개를 삭제하시겠습니까?\n\n${unusedImages[0].filename}`
                      : `이미지 ${unusedIds.length}개를 삭제하시겠습니까?\n\n${unusedImages.map((img: any) => img.filename).join('\n')}`;

                    if (!confirm(confirmMessage)) {
                      return;
                    }

                    try {
                      // 각 이미지 삭제 (image-asset-manager API 사용)
                      const deletePromises = unusedIds.map(async (id: string) => {
                        const image = compareResult.images.find((img: any) => img.id === id);
                        if (!image) return { success: false, id, error: '이미지를 찾을 수 없습니다' };

                        try {
                          // image-asset-manager API로 영구 삭제 (DELETE 메서드 사용)
                          const response = await fetch('/api/admin/image-asset-manager', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              id: id,
                              permanent: true 
                            }),
                          });

                          if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || errorData.details || '삭제 실패');
                          }

                          const result = await response.json();
                          if (!result.success) {
                            throw new Error(result.error || '삭제 실패');
                          }

                          return { success: true, id, filename: image.filename };
                        } catch (error: any) {
                          return { success: false, id, error: error.message, filename: image.filename };
                        }
                      });

                      const results = await Promise.all(deletePromises);
                      const successCount = results.filter(r => r.success).length;
                      const failCount = results.filter(r => !r.success).length;

                      if (failCount === 0) {
                        alert(`✅ ${successCount}개 이미지 삭제 완료!`);
                      } else {
                        alert(`⚠️ ${successCount}개 삭제 완료, ${failCount}개 실패\n\n${results.filter(r => !r.success).map(r => `${r.filename}: ${r.error}`).join('\n')}`);
                      }

                      // 모달 닫기 및 이미지 목록 새로고침
                      setShowCompareModal(false);
                      setCompareResult(null);
                      setSelectedForCompare(new Set());
                      setTimeout(() => {
                        fetchImages(1, true, folderFilter, includeChildren, searchQuery);
                      }, 100);

                    } catch (error: any) {
                      console.error('❌ 이미지 삭제 오류:', error);
                      alert(`이미지 삭제 중 오류가 발생했습니다: ${error.message}`);
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  🗑️ 미사용 이미지 삭제 ({compareResult.images.filter((img: any) => !img.usage).length}개)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Phase 8-9-7: 확장자 중복 확인 모달 */}
      {showExtensionDuplicateModal && extensionDuplicateResult && (
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
    </div>
  );
}
