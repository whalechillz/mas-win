'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import MediaRenderer from './MediaRenderer';

interface CustomerStoryModalProps {
  customer: {
    id: number;
    name: string;
    phone?: string;
  };
  onClose: () => void;
}

interface ImageMetadata {
  id: number;
  image_url: string;
  alt_text?: string;
  story_scene?: number;
  display_order?: number;
  image_type?: string;
  english_filename?: string;
  original_filename?: string;
  date_folder?: string;
}

interface SceneDescription {
  id?: number;
  scene_number: number;
  description: string;
}

const SCENE_NAMES = {
  1: '행복한 주인공',
  2: '행복+불안 전조',
  3: '문제 발생',
  4: '가이드 만남',
  5: '가이드 장소',
  6: '성공 회복',
  7: '여운 정적'
};

// 파일명 정규화 함수 (공백, %20 제거)
const normalizeDisplayFileName = (name: string | null | undefined): string => {
  if (!name) return '이미지';
  try {
    const decoded = decodeURIComponent(name);
    return decoded.trim().replace(/^%20+|%20+$/g, '').replace(/^ +| +$/g, '');
  } catch {
    return name.trim().replace(/^%20+|%20+$/g, '').replace(/^ +| +$/g, '');
  }
};

export default function CustomerStoryModal({ customer, onClose }: CustomerStoryModalProps) {
  const [viewMode, setViewMode] = useState<'storyboard' | 'list'>('storyboard');
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [sceneDescriptions, setSceneDescriptions] = useState<Record<number, string>>({});
  const [editingScene, setEditingScene] = useState<number | null>(null);
  const [editingDescription, setEditingDescription] = useState<Record<number, string>>({});
  const [draggedImage, setDraggedImage] = useState<number | string | null>(null);
  const [dragOverScene, setDragOverScene] = useState<number | null>(null);
  const [dragOverUnassigned, setDragOverUnassigned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedImageFileName, setSelectedImageFileName] = useState<string | null>(null);

  // 이미지 로드
  useEffect(() => {
    loadCustomerImages();
    loadSceneDescriptions();
  }, [customer.id]);

  // 비디오 및 이미지 모달 이벤트 리스너
  useEffect(() => {
    const handleOpenVideoModal = (e: CustomEvent) => {
      setSelectedVideoUrl(e.detail.url);
    };
    const handleOpenImageModal = (e: CustomEvent) => {
      setSelectedImageUrl(e.detail.url);
      setSelectedImageFileName(e.detail.fileName || null);
    };
    // 고객 이미지 업데이트 이벤트 리스너 (신규 업로드 시 자동 새로고침)
    const handleCustomerImagesUpdated = (e: CustomEvent) => {
      if (e.detail.customerId === customer.id) {
        console.log('🔄 [고객 스토리 관리] 이미지 업데이트 이벤트 수신, 새로고침 시작');
        loadCustomerImages();
      }
    };
    
    window.addEventListener('openVideoModal', handleOpenVideoModal as EventListener);
    window.addEventListener('openImageModal', handleOpenImageModal as EventListener);
    window.addEventListener('customerImagesUpdated', handleCustomerImagesUpdated as EventListener);
    
    return () => {
      window.removeEventListener('openVideoModal', handleOpenVideoModal as EventListener);
      window.removeEventListener('openImageModal', handleOpenImageModal as EventListener);
      window.removeEventListener('customerImagesUpdated', handleCustomerImagesUpdated as EventListener);
    };
  }, [customer.id]);

  // 미할당 이미지 추출
  const unassignedImages = useMemo(() => {
    return images.filter(img => !img.story_scene || img.story_scene < 1 || img.story_scene > 7);
  }, [images]);

  // 장면별 이미지 그룹화
  const imagesByScene = useMemo(() => {
    console.log('🔄 [그룹화] 시작, images 개수:', images.length);
    
    const grouped: Record<number, ImageMetadata[]> = {};
    
    // 1-7 장면 초기화
    for (let i = 1; i <= 7; i++) {
      grouped[i] = [];
    }
    
    // 이미지를 장면별로 분류
    images.forEach((img, index) => {
      const scene = img.story_scene;
      console.log(`  [${index}] 이미지:`, {
        id: img.id,
        english_filename: img.english_filename,
        story_scene: scene,
        sceneType: typeof scene,
        sceneValue: scene
      });
      
      if (scene !== null && scene !== undefined && !isNaN(Number(scene)) && Number(scene) >= 1 && Number(scene) <= 7) {
        grouped[Number(scene)].push(img);
        console.log(`    ✅ 장면 ${scene}에 추가됨`);
      } else {
        console.log(`    ⚠️ 장면에 할당되지 않음 (scene: ${scene})`);
      }
    });
    
    // 각 장면별로 정렬
    for (let i = 1; i <= 7; i++) {
      grouped[i].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }
    
    // 미할당 이미지 확인
    const unassigned = images.filter(img => 
      !img.story_scene || img.story_scene < 1 || img.story_scene > 7
    );
    
    // 디버깅: 각 장면별 이미지 개수 및 전체 이미지 정보 로그
    console.log('📊 [그룹화] 장면별 이미지 그룹화 결과:', {
      totalImages: images.length,
      imagesWithScene: images.filter(img => {
        const scene = img.story_scene;
        return scene !== null && scene !== undefined && !isNaN(Number(scene)) && Number(scene) >= 1 && Number(scene) <= 7;
      }).length,
      unassignedImages: unassigned.length,
      unassignedDetails: unassigned.map(img => ({
        id: img.id,
        english_filename: img.english_filename,
        story_scene: img.story_scene
      })),
      scenes: Object.keys(grouped).map(scene => ({
        scene,
        count: grouped[parseInt(scene)].length,
        images: grouped[parseInt(scene)].map(img => ({
          id: img.id,
          english_filename: img.english_filename
        }))
      }))
    });
    
    return grouped;
  }, [images]);

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (e: React.DragEvent, imageId: number | null, imageUrl?: string) => {
    // 고유 식별자 생성: imageId가 있으면 id, 없으면 imageUrl 사용
    const identifier = imageId !== null ? imageId : (imageUrl || 'unknown');
    console.log('🔍 드래그 시작:', { imageId, imageUrl, identifier });
    setDraggedImage(identifier);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('imageId', String(imageId || ''));
    if (imageUrl) {
      e.dataTransfer.setData('imageUrl', imageUrl);
    }
  };

  // 드래그 종료 핸들러
  const handleDragEnd = () => {
    console.log('🔍 드래그 종료 - 상태 초기화');
    setDraggedImage(null);
    setDragOverScene(null);
    setDragOverUnassigned(false);
  };

  const handleDragOver = (e: React.DragEvent, scene: number | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverScene(scene);
  };

  const handleDragLeave = () => {
    setDragOverScene(null);
    setDragOverUnassigned(false);
  };

  const handleDrop = async (e: React.DragEvent, targetScene: number | null) => {
    e.preventDefault();
    e.stopPropagation();
    
    const imageIdStr = e.dataTransfer.getData('imageId');
    const imageUrl = e.dataTransfer.getData('imageUrl');
    const imageId = imageIdStr ? parseInt(imageIdStr) : null;
    
    console.log('🔍 [드롭 시작] 드롭 이벤트 수신:', { 
      imageIdStr, 
      imageId, 
      imageUrl, 
      targetScene,
      timestamp: new Date().toISOString()
    });
    
    // imageId가 없어도 imageUrl로 처리 가능하도록 수정
    if (!imageId && !imageUrl) {
      console.error('❌ [드롭 실패] 유효하지 않은 드래그 데이터:', { imageIdStr, imageUrl });
      return;
    }
    
    try {
      // URL 정규화 함수 (쿼리 파라미터 제거 및 디코딩)
      const normalizeUrl = (url: string) => {
        if (!url) return '';
        try {
          const urlObj = new URL(url);
          // URL 디코딩 및 정규화
          const decodedPath = decodeURIComponent(urlObj.pathname);
          return urlObj.origin + decodedPath;
        } catch {
          // URL 파싱 실패 시 디코딩만 시도
          return decodeURIComponent(url.split('?')[0]);
        }
      };

      // imageUrl로 이미지 찾기 (imageId가 null인 경우)
      if (!imageId && imageUrl) {
        console.log('🔍 [드롭 처리] imageId가 null, imageUrl로 처리 시작:', {
          imageUrl,
          totalImages: images.length,
          드래그한URL: imageUrl
        });
        
        const normalizedImageUrl = normalizeUrl(imageUrl);
        console.log('🔍 [드롭 처리] URL 정규화 결과:', {
          원본: imageUrl,
          정규화: normalizedImageUrl
        });
        
        // 파일명 추출 및 정규화 함수 (인코딩 문자 제거)
        const extractFileName = (url: string) => {
          try {
            const urlObj = new URL(url);
            return decodeURIComponent(urlObj.pathname.split('/').pop() || '');
          } catch {
            return decodeURIComponent(url.split('/').pop() || '');
          }
        };
        
        // 파일명 정규화 (인코딩 문자, 공백, 특수문자 제거)
        const normalizeFileName = (fileName: string) => {
          if (!fileName) return '';
          // URL 디코딩 후 공백 및 특수문자 제거
          try {
            const decoded = decodeURIComponent(fileName);
            // 앞뒤 공백, %20, 특수문자 제거하고 소문자로 변환
            return decoded.trim().replace(/%20/g, '').replace(/[^a-z0-9.-]/gi, '').toLowerCase();
          } catch {
            return fileName.replace(/%20/g, '').replace(/[^a-z0-9.-]/gi, '').toLowerCase();
          }
        };
        
        const draggedFileName = extractFileName(imageUrl);
        const normalizedDraggedFileName = normalizeFileName(draggedFileName);
        console.log('🔍 [드롭 처리] 드래그한 파일명:', {
          원본: draggedFileName,
          정규화: normalizedDraggedFileName
        });
        
        console.log('🔍 [드롭 처리] 전체 이미지 목록:', images.map(img => ({
          id: img.id,
          url: img.image_url,
          fileName: extractFileName(img.image_url || ''),
          normalizedFileName: normalizeFileName(extractFileName(img.image_url || '')),
          normalized: normalizeUrl(img.image_url || ''),
          story_scene: img.story_scene,
          english_filename: img.english_filename,
          normalizedEnglishFilename: normalizeFileName(img.english_filename || '')
        })));
        
        // 정확한 매칭: 파일명 기반 매칭도 시도
        const image = images.find(img => {
          const normalizedImgUrl = normalizeUrl(img.image_url || '');
          const imgFileName = extractFileName(img.image_url || '');
          const normalizedImgFileName = normalizeFileName(imgFileName);
          
          // 1. URL 정규화 비교
          const urlMatches = normalizedImgUrl === normalizedImageUrl || img.image_url === imageUrl;
          
          // 2. 파일명 비교 (정규화된 파일명 사용, 확장자 제외)
          const fileNameWithoutExt = (name: string) => {
            if (!name) return '';
            return name.replace(/\.[^/.]+$/, '').toLowerCase();
          };
          const fileNameMatches = fileNameWithoutExt(normalizedImgFileName) === fileNameWithoutExt(normalizedDraggedFileName);
          
          // 3. english_filename 비교 (정규화된 파일명 사용)
          const normalizedEnglishFilename = normalizeFileName(img.english_filename || '');
          const englishFilenameMatches = img.english_filename && 
            fileNameWithoutExt(normalizedEnglishFilename) === fileNameWithoutExt(normalizedDraggedFileName);
          
          // 4. 원본 파일명 비교 (인코딩 차이 무시)
          const originalFileNameMatches = fileNameWithoutExt(imgFileName) === fileNameWithoutExt(draggedFileName);
          
          const matches = urlMatches || fileNameMatches || englishFilenameMatches || originalFileNameMatches;
          
          if (matches) {
            console.log('✅ [드롭 처리] 이미지 매칭 성공:', {
              imageId: img.id,
              originalUrl: img.image_url,
              normalizedUrl: normalizedImgUrl,
              targetUrl: imageUrl,
              normalizedTargetUrl: normalizedImageUrl,
              imgFileName,
              draggedFileName,
              normalizedImgFileName,
              normalizedDraggedFileName,
              urlMatches,
              fileNameMatches,
              englishFilenameMatches,
              originalFileNameMatches,
              english_filename: img.english_filename,
              normalizedEnglishFilename
            });
          }
          return matches;
        });
        
        if (image && image.id) {
          console.log('✅ [드롭 처리] image.id가 있음, updateImageScene 호출:', {
            imageId: image.id,
            targetScene
          });
          await updateImageScene(image.id, targetScene);
          console.log('✅ [드롭 처리] updateImageScene 완료, 이미지 재로드 시작');
          await loadCustomerImages();
          console.log('✅ [드롭 처리] 완료 - image.id로 업데이트 성공');
        } else if (image && !image.id) {
          // image.id가 null인 경우, imageUrl을 직접 사용하여 API 호출
          console.log('⚠️ [드롭 처리] image.id가 null인 경우, imageUrl로 직접 업데이트 시도:', {
            imageUrl,
            normalizedImageUrl,
            targetScene,
            imageData: image
          });
          
          const requestBody = { 
            imageUrl: imageUrl,
            storyScene: targetScene 
          };
          console.log('📤 [API 요청] PATCH /api/admin/update-image-scene:', requestBody);
          
          const response = await fetch('/api/admin/update-image-scene', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          });
          
          console.log('📥 [API 응답] 상태:', response.status, response.statusText);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ [API 에러] 응답 데이터:', errorData);
            throw new Error(errorData.error || `이미지 장면 업데이트 실패 (${response.status})`);
          }
          
          const result = await response.json();
          console.log('✅ [API 성공] 응답 데이터:', result);
          
          if (result.success) {
            console.log('✅ [드롭 처리] API 호출 성공, 업데이트된 데이터:', result.updatedData);
            console.log('✅ [드롭 처리] API 호출 성공, 이미지 재로드 시작');
            // 약간의 지연 후 재로드 (DB 반영 시간 고려)
            await new Promise(resolve => setTimeout(resolve, 500));
            await loadCustomerImages();
            console.log('✅ [드롭 처리] 완료 - imageUrl로 업데이트 성공');
          } else {
            throw new Error(result.error || '이미지 장면 업데이트 실패');
          }
        } else {
          console.error('❌ [드롭 실패] 이미지를 찾을 수 없습니다:', {
            imageUrl,
            normalizedImageUrl,
            totalImages: images.length,
            availableUrls: images.map(img => ({
              id: img.id,
              url: img.image_url,
              normalized: normalizeUrl(img.image_url || '')
            }))
          });
          alert('이미지를 찾을 수 없습니다. 페이지를 새로고침해주세요.');
          return;
        }
      } else if (imageId && !isNaN(imageId)) {
        // targetScene이 null이면 미할당 영역으로 이동
        console.log('✅ [드롭 처리] imageId로 업데이트:', { imageId, targetScene });
        await updateImageScene(imageId, targetScene);
        await loadCustomerImages();
        console.log('✅ [드롭 처리] 완료 - imageId로 업데이트 성공');
      } else {
        console.error('❌ [드롭 실패] 유효하지 않은 imageId:', imageIdStr);
        return;
      }
    } catch (error) {
      console.error('❌ [드롭 실패] 드롭 처리 실패:', error);
      console.error('❌ [드롭 실패] 에러 상세:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      alert(`이미지 이동에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
    
    setDraggedImage(null);
    setDragOverScene(null);
    setDragOverUnassigned(false);
  };

  const handleRemoveFromScene = async (imageId: number) => {
    if (confirm('이 이미지를 장면에서 제거하시겠습니까?')) {
      await updateImageScene(imageId, null);
      await loadCustomerImages();
    }
  };

  // API 함수들
  const loadCustomerImages = async () => {
    setLoading(true);
    try {
      console.log('🔄 [이미지 로드] 시작, customerId:', customer.id);
      // 캐시 무효화를 위한 타임스탬프 추가
      const response = await fetch(`/api/admin/upload-customer-image?customerId=${customer.id}&_t=${Date.now()}`);
      const result = await response.json();
      
      console.log('📸 [이미지 로드] API 응답:', {
        success: result.success,
        imageCount: result.images?.length || 0,
        metadataCount: result.metadataCount,
        storageCount: result.storageCount
      });
      
      // 각 이미지의 상세 정보 로그
      if (result.images && result.images.length > 0) {
        console.log('📸 [이미지 로드] 전체 이미지 상세 정보:');
        result.images.forEach((img: any, index: number) => {
          console.log(`  [${index}]`, {
            id: img.id,
            image_url: img.image_url,
            english_filename: img.english_filename,
            original_filename: img.original_filename,
            story_scene: img.story_scene,
            image_type: img.image_type,
            date_folder: img.date_folder,
            isFromStorage: img.isFromStorage,
            metadataMissing: img.metadataMissing
          });
        });
        
        // story_scene별 그룹화 확인
        const sceneGroups: Record<number | string, number> = {};
        result.images.forEach((img: any) => {
          const scene = img.story_scene || 'null';
          sceneGroups[scene] = (sceneGroups[scene] || 0) + 1;
        });
        console.log('📊 [이미지 로드] story_scene별 개수:', sceneGroups);
        
        // 업데이트된 이미지 확인 (joseotdae_s3_swing-scene 관련)
        const swingSceneImages = result.images.filter((img: any) => 
          img.image_url?.includes('joseotdae_s3_swing') || 
          img.english_filename?.includes('joseotdae_s3_swing') ||
          img.original_filename?.includes('joseotdae_s3_swing')
        );
        if (swingSceneImages.length > 0) {
          console.log('🎯 [이미지 로드] swing-scene 관련 이미지:', swingSceneImages.map((img: any) => ({
            id: img.id,
            image_url: img.image_url,
            english_filename: img.english_filename,
            story_scene: img.story_scene,
            fileName: img.image_url?.split('/').pop()
          })));
        }
      }
      
      if (result.success && result.images) {
        // story_scene이 null인 이미지도 포함하여 설정
        // date_folder가 없는 이미지에 대해 폴더 경로에서 날짜 추출
        const processedImages = result.images.map((img: any) => {
          const processed = {
            ...img,
            story_scene: img.story_scene !== undefined && img.story_scene !== null ? img.story_scene : null
          };
          
          // date_folder가 없으면 폴더 경로나 image_url에서 추출
          if (!processed.date_folder) {
            if (processed.folder_path) {
              const dateMatch = processed.folder_path.match(/(\d{4}-\d{2}-\d{2})/);
              if (dateMatch) {
                processed.date_folder = dateMatch[1];
              }
            }
            if (!processed.date_folder && processed.image_url) {
              const urlDateMatch = processed.image_url.match(/(\d{4}-\d{2}-\d{2})/);
              if (urlDateMatch) {
                processed.date_folder = urlDateMatch[1];
              }
            }
          }
          
          return processed;
        });
        
        console.log('✅ [이미지 로드] 처리된 이미지 설정:', {
          totalCount: processedImages.length,
          withScene: processedImages.filter(img => img.story_scene !== null).length,
          withoutScene: processedImages.filter(img => img.story_scene === null).length
        });
        
        setImages(processedImages);
        console.log('✅ [이미지 로드] 이미지 설정 완료:', processedImages.length, '개');
      } else {
        console.warn('⚠️ [이미지 로드] 이미지가 없거나 로드 실패:', result);
        setImages([]);
      }
    } catch (error) {
      console.error('❌ [이미지 로드] 오류:', error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSceneDescriptions = async () => {
    try {
      const response = await fetch(`/api/admin/customer-story-scenes?customerId=${customer.id}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const descriptions: Record<number, string> = {};
        result.data.forEach((desc: SceneDescription) => {
          descriptions[desc.scene_number] = desc.description || '';
        });
        setSceneDescriptions(descriptions);
        setEditingDescription(descriptions);
      }
    } catch (error) {
      console.error('장면 설명 로드 오류:', error);
    }
  };

  const updateImageScene = async (imageId: number, scene: number | null) => {
    try {
      const response = await fetch('/api/admin/update-image-scene', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, storyScene: scene })
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '업데이트 실패');
      }
    } catch (error) {
      console.error('이미지 장면 업데이트 오류:', error);
      alert('이미지 장면 업데이트에 실패했습니다.');
    }
  };

  const saveSceneDescription = async (sceneNumber: number, description: string) => {
    try {
      const response = await fetch('/api/admin/customer-story-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          sceneNumber,
          description
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setSceneDescriptions(prev => ({
          ...prev,
          [sceneNumber]: description
        }));
      } else {
        throw new Error(result.error || '저장 실패');
      }
    } catch (error) {
      console.error('장면 설명 저장 오류:', error);
      alert('장면 설명 저장에 실패했습니다.');
    }
  };

  const handleDescriptionChange = (sceneNumber: number, value: string) => {
    setEditingDescription(prev => ({
      ...prev,
      [sceneNumber]: value
    }));
  };

  const handleDescriptionSave = async (sceneNumber: number) => {
    const description = editingDescription[sceneNumber] || '';
    await saveSceneDescription(sceneNumber, description);
    setEditingScene(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">고객 스토리 관리: {customer.name}</h2>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            닫기
          </button>
        </div>

        {/* 탭 */}
        <div className="p-4 border-b flex gap-2">
          <button
            onClick={() => setViewMode('storyboard')}
            className={`px-4 py-2 rounded ${
              viewMode === 'storyboard' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            스토리보드
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded ${
              viewMode === 'list' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            목록보기
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">로딩 중...</div>
          ) : viewMode === 'storyboard' ? (
            <StoryboardView
              unassignedImages={unassignedImages}
              imagesByScene={imagesByScene}
              sceneDescriptions={sceneDescriptions}
              editingScene={editingScene}
              editingDescription={editingDescription}
              onDescriptionChange={handleDescriptionChange}
              onEditClick={setEditingScene}
              onSave={handleDescriptionSave}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onRemoveFromScene={handleRemoveFromScene}
              onDragEnd={handleDragEnd}
              draggedImage={draggedImage}
              dragOverScene={dragOverScene}
              dragOverUnassigned={dragOverUnassigned}
              setDragOverUnassigned={setDragOverUnassigned}
            />
          ) : (
            <ListView images={images} />
          )}
        </div>

        {/* 비디오 및 이미지 전체 화면 모달 (Portal 사용) */}
        {typeof window !== 'undefined' && createPortal(
          <>
            {selectedVideoUrl && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-90 z-[100] flex items-center justify-center p-4"
                onClick={() => setSelectedVideoUrl(null)}
              >
                <div className="max-w-4xl w-full p-4 relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setSelectedVideoUrl(null)}
                    className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
                  >
                    ×
                  </button>
                  <video
                    src={selectedVideoUrl}
                    controls
                    autoPlay
                    className="w-full"
                  >
                    비디오를 재생할 수 없습니다.
                  </video>
                </div>
              </div>
            )}

            {selectedImageUrl && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-90 z-[100] flex items-center justify-center p-4"
                onClick={() => {
                  setSelectedImageUrl(null);
                  setSelectedImageFileName(null);
                }}
              >
                <div className="w-full h-full flex flex-col items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      setSelectedImageUrl(null);
                      setSelectedImageFileName(null);
                    }}
                    className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
                  >
                    ×
                  </button>
                  <div className="flex-1 flex items-center justify-center w-full mb-16">
                    <img
                      src={selectedImageUrl}
                      alt="확대 이미지"
                      className="max-w-full max-h-[calc(100vh-120px)] object-contain"
                    />
                  </div>
                  {selectedImageFileName && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm text-center bg-black bg-opacity-70 px-4 py-2 rounded max-w-[90%] truncate">
                      {selectedImageFileName}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>,
          document.body
        )}
      </div>
    </div>
  );
}

// 미할당 이미지 섹션 컴포넌트
function UnassignedImagesSection({
  images,
  onDragStart,
  onDrop,
  draggedImage,
  dragOverUnassigned,
  setDragOverUnassigned,
  onDragEnd
}: {
  images: ImageMetadata[];
  onDragStart: (e: React.DragEvent, imageId: number | null, imageUrl?: string) => void;
  onDrop: (e: React.DragEvent) => void;
  draggedImage: number | string | null;
  dragOverUnassigned: boolean;
  setDragOverUnassigned: (value: boolean) => void;
  onDragEnd: () => void;
}) {
  return (
    <div className="mb-6 border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-md font-semibold text-blue-700">
          📦 미할당 이미지 ({images.length}개)
        </h3>
        <span className="text-xs text-blue-600">
          이미지를 드래그하여 장면에 추가하세요
        </span>
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          setDragOverUnassigned(true);
        }}
        onDragLeave={() => {
          setDragOverUnassigned(false);
        }}
        onDrop={onDrop}
        className={`grid grid-cols-8 gap-2 min-h-[100px] p-2 rounded transition-colors ${
          dragOverUnassigned ? 'bg-blue-200 border-2 border-blue-500' : ''
        }`}
      >
        {images.map((image, index) => {
          const fileName = normalizeDisplayFileName(image.english_filename || image.original_filename);
          const isVideo = fileName.toLowerCase().match(/\.(mp4|mov|avi|webm|mkv)$/);
          
          // imageUrl 정규화 (드래그 시 정확한 URL 전달)
          const getImageUrl = () => {
            if (image.image_url) {
              // URL 정규화 함수
              const normalizeUrl = (url: string) => {
                if (!url) return '';
                try {
                  const urlObj = new URL(url);
                  return decodeURIComponent(urlObj.origin + urlObj.pathname);
                } catch {
                  return decodeURIComponent(url.split('?')[0]);
                }
              };
              return normalizeUrl(image.image_url);
            }
            return image.image_url;
          };
          
          const normalizedImageUrl = getImageUrl();
          
          // 고유 식별자 생성: imageId가 있으면 id, 없으면 imageUrl 사용
          const imageIdentifier = image.id !== null ? image.id : (normalizedImageUrl || image.image_url);
          
          return (
            <div
              key={image.id || `unassigned-${index}-${image.image_url}`}
              draggable
              onDragStart={(e) => {
                console.log('🔍 [UnassignedImagesSection] 드래그 시작:', {
                  imageId: image.id,
                  originalUrl: image.image_url,
                  normalizedUrl: normalizedImageUrl,
                  english_filename: image.english_filename,
                  fileName,
                  identifier: imageIdentifier
                });
                onDragStart(e, image.id || null, normalizedImageUrl || image.image_url);
              }}
              onDragEnd={onDragEnd}
              className={`cursor-move transition-all rounded overflow-hidden border-2 border-blue-200 bg-white shadow-sm ${
                draggedImage === imageIdentifier ? 'opacity-50 scale-95' : 'hover:shadow-md hover:border-blue-400 hover:scale-105'
              }`}
            >
              <MediaRenderer
                url={image.image_url}
                alt={image.alt_text || fileName}
                className="w-full h-20 object-cover"
                showControls={false}
                onVideoClick={isVideo ? () => {
                  // 비디오 클릭 시 전체 화면 재생은 부모 컴포넌트에서 처리
                  const event = new CustomEvent('openVideoModal', { detail: { url: image.image_url } });
                  window.dispatchEvent(event);
                } : undefined}
                onClick={!isVideo ? () => {
                  const normalizedFileName = normalizeDisplayFileName(image.english_filename || image.original_filename);
                  const event = new CustomEvent('openImageModal', { detail: { url: image.image_url, fileName: normalizedFileName } });
                  window.dispatchEvent(event);
                } : undefined}
              />
              <div className="p-1 text-xs bg-white truncate" title={fileName}>
                {fileName}
              </div>
            </div>
          );
        })}
        {images.length === 0 && (
          <div className="col-span-8 text-center text-gray-400 py-8">
            모든 이미지가 장면에 할당되었습니다
          </div>
        )}
      </div>
    </div>
  );
}

// 스토리보드 뷰 컴포넌트
function StoryboardView({ 
  unassignedImages,
  imagesByScene, 
  sceneDescriptions, 
  editingScene,
  editingDescription,
  onDescriptionChange,
  onEditClick,
  onSave,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemoveFromScene,
  onDragEnd,
  draggedImage,
  dragOverScene,
  dragOverUnassigned,
  setDragOverUnassigned
}: any) {
  return (
    <div className="space-y-6">
      {/* 미할당 이미지 섹션 */}
      <UnassignedImagesSection
        images={unassignedImages}
        onDragStart={onDragStart}
        onDrop={(e) => onDrop(e, null)}
        onDragEnd={onDragEnd}
        draggedImage={draggedImage}
        dragOverUnassigned={dragOverUnassigned}
        setDragOverUnassigned={setDragOverUnassigned}
      />

      {/* 장면 1-7 */}
      {[1, 2, 3, 4, 5, 6, 7].map((sceneNum) => (
        <div key={sceneNum} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">
              장면 {sceneNum}: {SCENE_NAMES[sceneNum as keyof typeof SCENE_NAMES]}
            </h3>
            <button
              onClick={() => {
                if (editingScene === sceneNum) {
                  onSave(sceneNum);
                } else {
                  onEditClick(sceneNum);
                }
              }}
              className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
            >
              {editingScene === sceneNum ? '저장' : '편집'}
            </button>
          </div>

          {/* 장면 설명 편집 */}
          <div className="mb-4">
            {editingScene === sceneNum ? (
              <div className="flex gap-2">
                <textarea
                  value={editingDescription[sceneNum] || ''}
                  onChange={(e) => onDescriptionChange(sceneNum, e.target.value)}
                  maxLength={500}
                  className="flex-1 px-3 py-2 border rounded"
                  rows={2}
                  placeholder="장면 설명을 입력하세요 (최대 500자)"
                />
                <button
                  onClick={() => onEditClick(null)}
                  className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  취소
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                {sceneDescriptions[sceneNum] || '장면 설명을 추가하세요...'}
              </p>
            )}
          </div>

          {/* 이미지 카드 영역 */}
          <div
            onDragOver={(e) => onDragOver(e, sceneNum)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, sceneNum)}
            className={`min-h-[200px] p-4 rounded-lg border-2 border-dashed transition-colors ${
              dragOverScene === sceneNum
                ? 'bg-blue-100 border-blue-400'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="grid grid-cols-4 gap-4">
              {imagesByScene[sceneNum]?.map((image: ImageMetadata) => {
                const fileName = normalizeDisplayFileName(image.english_filename || image.original_filename);
                const isVideo = fileName.toLowerCase().match(/\.(mp4|mov|avi|webm|mkv)$/);
                
                // 고유 식별자 생성: imageId가 있으면 id, 없으면 imageUrl 사용
                const imageIdentifier = image.id !== null ? image.id : (image.image_url || 'unknown');
                
                return (
                  <div
                    key={image.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, image.id, image.image_url)}
                    onDragEnd={onDragEnd}
                    className={`relative group cursor-move transition-opacity rounded-lg overflow-hidden border ${
                      draggedImage === imageIdentifier ? 'opacity-50 scale-95' : 'hover:shadow-md'
                    }`}
                  >
                    <MediaRenderer
                      url={image.image_url}
                      alt={image.alt_text || fileName}
                      className="w-full h-32 object-cover"
                      showControls={false}
                      onVideoClick={isVideo ? () => {
                        const event = new CustomEvent('openVideoModal', { detail: { url: image.image_url } });
                        window.dispatchEvent(event);
                      } : undefined}
                      onClick={!isVideo ? () => {
                        const normalizedFileName = normalizeDisplayFileName(image.english_filename || image.original_filename);
                        const event = new CustomEvent('openImageModal', { detail: { url: image.image_url, fileName: normalizedFileName } });
                        window.dispatchEvent(event);
                      } : undefined}
                    />
                    {/* 제거 버튼 */}
                    <button
                      onClick={() => onRemoveFromScene(image.id)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      title="장면에서 제거"
                    >
                      ×
                    </button>
                    <div className="p-2 text-xs bg-white truncate" title={fileName}>
                      {fileName}
                    </div>
                  </div>
                );
              })}
            </div>
            {(!imagesByScene[sceneNum] || imagesByScene[sceneNum].length === 0) && (
              <div className="text-center text-gray-400 py-8">
                이미지를 드래그하여 추가하세요
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// 목록 보기 컴포넌트
function ListView({ images }: { images: ImageMetadata[] }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {images.map((image) => {
        const fileName = normalizeDisplayFileName(image.english_filename || image.original_filename);
        const isVideo = fileName.toLowerCase().match(/\.(mp4|mov|avi|webm|mkv)$/);
        return (
          <div key={image.id} className="border rounded-lg overflow-hidden">
            <MediaRenderer
              url={image.image_url}
              alt={image.alt_text || fileName}
              className="w-full h-48 object-cover"
              showControls={false}
              onVideoClick={isVideo ? () => {
                const event = new CustomEvent('openVideoModal', { detail: { url: image.image_url } });
                window.dispatchEvent(event);
              } : undefined}
              onClick={!isVideo ? () => {
                const normalizedFileName = normalizeDisplayFileName(image.english_filename || image.original_filename);
                const event = new CustomEvent('openImageModal', { detail: { url: image.image_url, fileName: normalizedFileName } });
                window.dispatchEvent(event);
              } : undefined}
            />
            <div className="p-2 text-xs">
              <div className="truncate" title={fileName}>
                {fileName}
              </div>
              <div className="text-gray-500 mt-1">
                장면: {image.story_scene || '미분류'} | {image.date_folder || '날짜 없음'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
