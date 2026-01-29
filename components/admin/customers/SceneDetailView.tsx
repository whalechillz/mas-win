/**
 * 장면별 상세 뷰 컴포넌트 (재구성)
 * 왼쪽: 장면 목록, 오른쪽: 선택된 장면 상세 (미할당 미디어 + 사진/장면 설명/목록보기 탭)
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import MediaRenderer from '../MediaRenderer';

interface SceneDetailViewProps {
  customerId: number;
  images?: ImageMetadata[];
  onImagesChange?: () => void;
  onDragStart?: (e: React.DragEvent, imageId: number | null, imageUrl?: string) => void;
  onDragOver?: (e: React.DragEvent, scene: number) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent, scene: number | null) => void;
  onRemoveFromScene?: (imageId: number, imageUrl?: string) => void;
  draggedImage?: number | string | null;
  dragOverScene?: number | null;
  dragOverUnassigned?: boolean;
  setDragOverUnassigned?: (value: boolean) => void;
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
  is_scanned_document?: boolean;
  document_type?: string;
}

interface SceneDescription {
  scene_number: number;
  description: string;
}

const SCENE_NAMES: Record<number, string> = {
  1: '행복한 주인공',
  2: '행복+불안 전조',
  3: '문제 발생',
  4: '가이드 만남',
  5: '가이드 장소',
  6: '성공 회복',
  7: '여운 정적'
};

// 파일명 정규화 함수
const normalizeDisplayFileName = (name: string | null | undefined): string => {
  if (!name) return '이미지';
  try {
    const decoded = decodeURIComponent(name);
    return decoded.trim().replace(/^%20+|%20+$/g, '').replace(/^ +| +$/g, '');
  } catch {
    return name.trim().replace(/^%20+|%20+$/g, '').replace(/^ +| +$/g, '');
  }
};

// 동영상 체크 함수
const isVideo = (imageUrl: string | null): boolean => {
  if (!imageUrl) return false;
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
  const lowerUrl = imageUrl.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
};

export default function SceneDetailView({ 
  customerId,
  images: externalImages,
  onImagesChange,
  onDragStart: externalDragStart,
  onDragOver: externalDragOver,
  onDragLeave: externalDragLeave,
  onDrop: externalDrop,
  onRemoveFromScene: externalRemoveFromScene,
  draggedImage: externalDraggedImage,
  dragOverScene: externalDragOverScene,
  dragOverUnassigned: externalDragOverUnassigned,
  setDragOverUnassigned: externalSetDragOverUnassigned
}: SceneDetailViewProps) {
  const [activeScene, setActiveScene] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'images' | 'description' | 'list'>('images');
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [sceneDescriptions, setSceneDescriptions] = useState<Record<number, string>>({});
  const [editingDescription, setEditingDescription] = useState<string>('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draggedImage, setDraggedImage] = useState<number | string | null>(null);
  const [dragOverScene, setDragOverScene] = useState<number | null>(null);
  const [dragOverUnassigned, setDragOverUnassigned] = useState(false);
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'image' | 'video' | 'document'>('all');

  // 외부에서 전달된 images 사용 또는 내부에서 로드
  const useExternalImages = externalImages !== undefined;

  useEffect(() => {
    if (!useExternalImages) {
      loadData();
    } else {
      setImages(externalImages);
      setLoading(false);
    }
  }, [customerId, useExternalImages, externalImages]);

  useEffect(() => {
    if (useExternalImages) return;
    loadSceneDescriptions();
  }, [customerId, useExternalImages]);

  const loadData = async () => {
    setLoading(true);
    try {
      const imagesResponse = await fetch(`/api/admin/upload-customer-image?customerId=${customerId}&_t=${Date.now()}`);
      const imagesResult = await imagesResponse.json();
      if (imagesResult.success) {
        setImages(imagesResult.images || []);
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSceneDescriptions = async () => {
    try {
      const response = await fetch(`/api/admin/customer-story-scenes?customerId=${customerId}`);
      const result = await response.json();
      if (result.success && result.data) {
        const descriptions: Record<number, string> = {};
        (result.data || []).forEach((scene: SceneDescription) => {
          descriptions[scene.scene_number] = scene.description || '';
        });
        setSceneDescriptions(descriptions);
      }
    } catch (error) {
      console.error('장면 설명 로드 오류:', error);
    }
  };

  // 미할당 미디어 계산
  const unassignedMedia = useMemo(() => {
    return images.filter(img => !img.story_scene || img.story_scene < 1 || img.story_scene > 7);
  }, [images]);

  // 타입별 분류
  const unassignedImages = useMemo(() => {
    return unassignedMedia.filter(img => {
      const isVideoFile = isVideo(img.image_url);
      const isDoc = img.is_scanned_document === true || 
                    (img.document_type !== null && 
                     img.document_type !== undefined && 
                     img.document_type !== '');
      return !isVideoFile && !isDoc;
    });
  }, [unassignedMedia]);

  const unassignedVideos = useMemo(() => {
    return unassignedMedia.filter(img => isVideo(img.image_url));
  }, [unassignedMedia]);

  const unassignedDocuments = useMemo(() => {
    return unassignedMedia.filter(img => {
      const isDoc = img.is_scanned_document === true;
      const hasDocumentType = img.document_type !== null && 
                              img.document_type !== undefined && 
                              img.document_type !== '';
      return isDoc || hasDocumentType;
    });
  }, [unassignedMedia]);

  // 장면별 이미지
  const sceneImages = useMemo(() => {
    return images
      .filter(img => img.story_scene === activeScene)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }, [images, activeScene]);

  // 필터링된 미디어 (목록보기 탭용) - 모든 미디어 (할당/미할당 구분 없이)
  const filteredMedia = useMemo(() => {
    // 전체 이미지의 is_scanned_document 상태 확인
    const documentStatusCheck = images.map(img => ({
      id: img.id,
      filename: img.english_filename,
      is_scanned_document: img.is_scanned_document,
      document_type: img.document_type,
      type: typeof img.is_scanned_document,
      isTrue: img.is_scanned_document === true,
      isFalse: img.is_scanned_document === false,
      isUndefined: img.is_scanned_document === undefined,
      isNull: img.is_scanned_document === null
    }));
    
    console.log('🔍 [필터] 필터링 시작:', { 
      mediaTypeFilter, 
      totalImages: images.length,
      videoCount: images.filter(img => isVideo(img.image_url)).length,
      documentCount: images.filter(img => img.is_scanned_document === true).length,
      imageCount: images.filter(img => !isVideo(img.image_url) && img.is_scanned_document !== true).length,
      documentStatusCheck: documentStatusCheck.filter(d => d.is_scanned_document !== false && d.is_scanned_document !== undefined)
    });
    
    let filtered = images;
    
    // 타입별 필터링
    if (mediaTypeFilter === 'video') {
      filtered = images.filter(img => {
        const isVideoFile = isVideo(img.image_url);
        return isVideoFile;
      });
    } else if (mediaTypeFilter === 'document') {
      filtered = images.filter(img => {
        // is_scanned_document가 명시적으로 true인 경우만 서류로 판단
        const isDoc = img.is_scanned_document === true;
        // document_type이 있는 경우도 서류로 판단 (대안)
        const hasDocumentType = img.document_type !== null && img.document_type !== undefined && img.document_type !== '';
        const result = isDoc || hasDocumentType;
        
        console.log('🔍 [필터] 서류 체크:', { 
          id: img.id,
          url: img.image_url, 
          is_scanned_document: img.is_scanned_document,
          document_type: img.document_type,
          isDoc,
          hasDocumentType,
          result,
          filename: img.english_filename,
          type: typeof img.is_scanned_document
        });
        
        return result;
      });
      console.log('✅ [필터] 서류 필터링 결과:', { 
        totalImages: images.length,
        filteredCount: filtered.length,
        documents: filtered.map(img => ({
          id: img.id,
          filename: img.english_filename,
          is_scanned_document: img.is_scanned_document,
          document_type: img.document_type
        }))
      });
    } else if (mediaTypeFilter === 'image') {
      filtered = images.filter(img => {
        const isVideoFile = isVideo(img.image_url);
        const isDoc = img.is_scanned_document === true || (img.document_type !== null && img.document_type !== undefined && img.document_type !== '');
        const isImage = !isVideoFile && !isDoc;
        return isImage;
      });
    }
    // 'all'인 경우는 필터링하지 않음 (전체 표시)
    
    console.log('✅ [필터] 필터링 결과:', { 
      mediaTypeFilter,
      filteredCount: filtered.length,
      originalCount: images.length
    });
    
    return filtered.sort((a, b) => {
      // 날짜별 정렬 (최신순)
      const dateA = a.date_folder || '';
      const dateB = b.date_folder || '';
      return dateB.localeCompare(dateA);
    });
  }, [images, mediaTypeFilter]);

  // 필터링된 미할당 미디어 (미할당 미디어 섹션용)
  const filteredUnassignedMedia = useMemo(() => {
    console.log('🔍 [필터] 미할당 미디어 필터링 시작:', {
      mediaTypeFilter,
      totalUnassigned: unassignedMedia.length,
      unassignedImages: unassignedMedia.filter(img => {
        const isVideoFile = isVideo(img.image_url);
        const isDoc = img.is_scanned_document === true || (img.document_type !== null && img.document_type !== undefined && img.document_type !== '');
        return !isVideoFile && !isDoc;
      }).length,
      unassignedVideos: unassignedMedia.filter(img => isVideo(img.image_url)).length,
      unassignedDocs: unassignedMedia.filter(img => {
        const isDoc = img.is_scanned_document === true;
        const hasDocumentType = img.document_type !== null && img.document_type !== undefined && img.document_type !== '';
        return isDoc || hasDocumentType;
      }).length
    });
    
    let filtered = unassignedMedia;
    
    // 타입별 필터링
    if (mediaTypeFilter === 'video') {
      filtered = unassignedMedia.filter(img => {
        const isVideoFile = isVideo(img.image_url);
        console.log('🔍 [필터] 미할당 동영상 체크:', {
          id: img.id,
          url: img.image_url,
          isVideo: isVideoFile,
          filename: img.english_filename
        });
        return isVideoFile;
      });
      console.log('✅ [필터] 미할당 동영상 필터링 결과:', {
        totalUnassigned: unassignedMedia.length,
        filteredCount: filtered.length
      });
    } else if (mediaTypeFilter === 'document') {
      // is_scanned_document가 명시적으로 true인 경우 또는 document_type이 있는 경우 서류로 판단
      filtered = unassignedMedia.filter(img => {
        const isDoc = img.is_scanned_document === true;
        const hasDocumentType = img.document_type !== null && img.document_type !== undefined && img.document_type !== '';
        const result = isDoc || hasDocumentType;
        
        console.log('🔍 [필터] 미할당 서류 체크:', { 
          id: img.id,
          url: img.image_url, 
          is_scanned_document: img.is_scanned_document,
          document_type: img.document_type,
          isDoc,
          hasDocumentType,
          result,
          filename: img.english_filename
        });
        
        return result;
      });
      console.log('✅ [필터] 미할당 서류 필터링 결과:', { 
        totalUnassigned: unassignedMedia.length,
        filteredCount: filtered.length,
        documents: filtered.map(img => ({
          id: img.id,
          filename: img.english_filename,
          is_scanned_document: img.is_scanned_document,
          document_type: img.document_type
        }))
      });
    } else if (mediaTypeFilter === 'image') {
      filtered = unassignedMedia.filter(img => {
        const isVideoFile = isVideo(img.image_url);
        const isDoc = img.is_scanned_document === true || (img.document_type !== null && img.document_type !== undefined && img.document_type !== '');
        return !isVideoFile && !isDoc;
      });
    }
    // 'all'인 경우는 필터링하지 않음 (전체 표시)
    
    console.log('✅ [필터] 최종 미할당 미디어 필터링 결과:', {
      mediaTypeFilter,
      filteredCount: filtered.length,
      willShowSection: filtered.length > 0 || (mediaTypeFilter === 'all' && unassignedMedia.length > 0)
    });
    
    return filtered;
  }, [unassignedMedia, mediaTypeFilter]);

  // 현재 장면 설명
  const currentDescription = sceneDescriptions[activeScene] || '';

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (e: React.DragEvent, imageId: number | null, imageUrl?: string) => {
    if (externalDragStart) {
      externalDragStart(e, imageId, imageUrl);
    } else {
      // 개별 키로 데이터 저장 (CustomerStoryModal 방식과 일치)
      if (imageId !== null) {
        e.dataTransfer.setData('imageId', imageId.toString());
      }
      if (imageUrl) {
        e.dataTransfer.setData('imageUrl', imageUrl);
      }
      // 추가: text/plain에도 JSON으로 저장 (하위 호환성)
      e.dataTransfer.setData('text/plain', JSON.stringify({ imageId, imageUrl }));
      
      const identifier = imageId !== null ? imageId : (imageUrl || 'unknown');
      setDraggedImage(identifier);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e: React.DragEvent, scene: number | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (externalDragOver && scene !== null) {
      externalDragOver(e, scene);
    } else {
      if (scene !== null) {
        setDragOverScene(scene);
      } else {
        setDragOverUnassigned(true);
      }
    }
  };

  const handleDragLeave = () => {
    if (externalDragLeave) {
      externalDragLeave();
    } else {
      setDragOverScene(null);
      setDragOverUnassigned(false);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetScene: number | null) => {
    e.preventDefault();
    e.stopPropagation(); // 이벤트 버블링 방지
    
    if (externalDrop) {
      // externalDrop이 있으면 먼저 시도
      externalDrop(e, targetScene);
      setDragOverScene(null);
      setDragOverUnassigned(false);
      setDraggedImage(null);
      return;
    }
    
    try {
      // 방법 1: 개별 키로 읽기 시도 (CustomerStoryModal 방식)
      let imageId: number | null = null;
      let imageUrl: string | undefined = undefined;
      
      const imageIdStr = e.dataTransfer.getData('imageId');
      const imageUrlData = e.dataTransfer.getData('imageUrl');
      
      if (imageIdStr && imageIdStr !== 'null' && imageIdStr !== '') {
        const parsedId = parseInt(imageIdStr);
        if (!isNaN(parsedId)) {
          imageId = parsedId;
        }
      }
      if (imageUrlData && imageUrlData !== '') {
        imageUrl = imageUrlData;
      }
      
      // 방법 2: text/plain에서 JSON 파싱 시도 (하위 호환성)
      if (!imageId && !imageUrl) {
        try {
          const data = e.dataTransfer.getData('text/plain');
          if (data && data !== '') {
            const parsed = JSON.parse(data);
            if (parsed.imageId !== null && parsed.imageId !== undefined) {
              imageId = typeof parsed.imageId === 'number' ? parsed.imageId : parseInt(parsed.imageId);
            }
            if (parsed.imageUrl) {
              imageUrl = parsed.imageUrl;
            }
          }
        } catch (parseError) {
          console.warn('JSON 파싱 실패:', parseError);
        }
      }
      
      if (!imageId && !imageUrl) {
        console.error('❌ [SceneDetailView 드롭] 드롭 데이터를 찾을 수 없습니다');
        alert('이미지 정보를 찾을 수 없습니다. 페이지를 새로고침해주세요.');
        return;
      }
      
      console.log('🔍 [SceneDetailView 드롭] 데이터:', { imageId, imageUrl, targetScene });
      
      const response = await fetch('/api/admin/update-image-scene', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId,
          imageUrl,
          storyScene: targetScene === null ? null : targetScene // 명시적으로 null 처리
        })
      });

      const result = await response.json();
      console.log('📥 [SceneDetailView 드롭] API 응답:', result);
      
      if (result.success) {
        // 이미지 재로드
        if (useExternalImages && onImagesChange) {
          onImagesChange();
        } else {
          await loadData();
        }
        console.log('✅ [SceneDetailView 드롭] 성공');
      } else {
        console.error('❌ [SceneDetailView 드롭] API 실패:', result);
        alert(`이미지 이동에 실패했습니다: ${result.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('❌ [SceneDetailView 드롭] 오류:', error);
      alert(`이미지 이동에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setDragOverScene(null);
      setDragOverUnassigned(false);
      setDraggedImage(null);
    }
  };

  const handleRemoveFromScene = async (imageId: number, imageUrl?: string) => {
    if (!confirm('이미지를 장면에서 제거하시겠습니까?')) return;
    
    if (externalRemoveFromScene) {
      externalRemoveFromScene(imageId, imageUrl);
    } else {
      try {
        const response = await fetch('/api/admin/update-image-scene', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageId,
            imageUrl,
            storyScene: null
          })
        });

        const result = await response.json();
        if (result.success) {
          await loadData();
          if (onImagesChange) onImagesChange();
        } else {
          alert('이미지 제거에 실패했습니다.');
        }
      } catch (error) {
        console.error('이미지 제거 오류:', error);
        alert('이미지 제거에 실패했습니다.');
      }
    }
  };

  // 장면 설명 저장
  const handleSaveDescription = async () => {
    try {
      const response = await fetch('/api/admin/customer-story-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          sceneNumber: activeScene,
          description: editingDescription
        })
      });

      const result = await response.json();
      if (result.success) {
        setSceneDescriptions(prev => ({
          ...prev,
          [activeScene]: editingDescription
        }));
        setIsEditingDescription(false);
        alert('장면 설명이 저장되었습니다.');
      } else {
        alert('장면 설명 저장 실패');
      }
    } catch (error) {
      console.error('장면 설명 저장 오류:', error);
      alert('장면 설명 저장 실패');
    }
  };

  const handleCancelDescription = () => {
    setEditingDescription(currentDescription);
    setIsEditingDescription(false);
  };

  // URL 정규화 함수
  const normalizeUrl = (url: string): string => {
    if (!url) return '';
    try {
      const urlObj = new URL(url);
      return decodeURIComponent(urlObj.origin + urlObj.pathname);
    } catch {
      return decodeURIComponent(url.split('?')[0]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  const finalDraggedImage = externalDraggedImage !== undefined ? externalDraggedImage : draggedImage;
  const finalDragOverScene = externalDragOverScene !== undefined ? externalDragOverScene : dragOverScene;
  const finalDragOverUnassigned = externalDragOverUnassigned !== undefined ? externalDragOverUnassigned : dragOverUnassigned;
  const finalSetDragOverUnassigned = externalSetDragOverUnassigned || setDragOverUnassigned;

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* 왼쪽: 장면 목록 */}
      <div className="col-span-1 space-y-2">
        <h3 className="font-semibold text-gray-900 mb-3">장면 목록</h3>
        {[1, 2, 3, 4, 5, 6, 7].map(sceneNum => {
          const sceneImagesCount = images.filter(img => img.story_scene === sceneNum).length;
          const isDragOver = finalDragOverScene === sceneNum;
          
          return (
            <button
              key={sceneNum}
              onClick={() => {
                setActiveScene(sceneNum);
                setEditingDescription(sceneDescriptions[sceneNum] || '');
                setIsEditingDescription(false);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation(); // 중요: 이벤트 버블링 방지
                handleDragOver(e, sceneNum);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation(); // 중요: 이벤트 버블링 방지
                if (finalDragOverScene === sceneNum) {
                  handleDragLeave();
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation(); // 중요: 이벤트 버블링 방지
                handleDrop(e, sceneNum);
              }}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                activeScene === sceneNum
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : isDragOver
                  ? 'bg-green-100 border-green-500 border-2' // 드래그 오버 시 시각적 피드백
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">장면 {sceneNum}</div>
              <div className="text-sm text-gray-600">{SCENE_NAMES[sceneNum]}</div>
              <div className="text-xs text-gray-500 mt-1">
                미디어: {sceneImagesCount}개
              </div>
            </button>
          );
        })}
      </div>

      {/* 오른쪽: 선택된 장면 상세 */}
      <div className="col-span-2">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          {/* 필터 - 맨 위 */}
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setMediaTypeFilter('all')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                mediaTypeFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setMediaTypeFilter('image')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                mediaTypeFilter === 'image'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              이미지
            </button>
            <button
              onClick={() => setMediaTypeFilter('video')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                mediaTypeFilter === 'video'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              동영상
            </button>
            <button
              onClick={() => setMediaTypeFilter('document')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                mediaTypeFilter === 'document'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              서류
            </button>
          </div>

          {/* 미할당 미디어 섹션 - 필터 아래, 장면 헤더 위 */}
          {/* 필터링된 미할당 미디어가 있거나, 필터가 'all'일 때 전체 미할당 미디어가 있으면 표시 */}
          {(filteredUnassignedMedia.length > 0 || (mediaTypeFilter === 'all' && unassignedMedia.length > 0)) && (
            <div className="mb-6 border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
              <h4 className="text-sm font-semibold text-blue-700 mb-3">
                📦 미할당 미디어 ({mediaTypeFilter === 'all' ? unassignedMedia.length : filteredUnassignedMedia.length}개)
                <span className="text-xs text-gray-600 ml-2">
                  {mediaTypeFilter === 'all' ? (
                    <>이미지: {unassignedImages.length} | 동영상: {unassignedVideos.length} | 서류: {unassignedDocuments.length}</>
                  ) : mediaTypeFilter === 'image' ? (
                    <>이미지: {filteredUnassignedMedia.length}개</>
                  ) : mediaTypeFilter === 'video' ? (
                    <>동영상: {filteredUnassignedMedia.length}개</>
                  ) : mediaTypeFilter === 'document' ? (
                    <>서류: {filteredUnassignedMedia.length}개</>
                  ) : null}
                </span>
              </h4>
              <div
                onDragOver={(e) => handleDragOver(e, null)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, null)}
                className={`grid grid-cols-4 gap-2 min-h-[100px] p-2 rounded transition-colors ${
                  finalDragOverUnassigned ? 'bg-blue-200 border-2 border-blue-500' : ''
                }`}
              >
                {filteredUnassignedMedia.map((media) => {
                  const fileName = normalizeDisplayFileName(media.english_filename || media.original_filename);
                  const isVideoFile = isVideo(media.image_url);
                  const isDocument = media.is_scanned_document === true || 
                                    (media.document_type !== null && 
                                     media.document_type !== undefined && 
                                     media.document_type !== '');
                  const normalizedImageUrl = normalizeUrl(media.image_url);
                  const imageIdentifier = media.id !== null ? media.id : (normalizedImageUrl || media.image_url);

                  return (
                    <div
                      key={media.id || `unassigned-${media.image_url}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, media.id, normalizedImageUrl)}
                      className={`cursor-move transition-all rounded overflow-hidden border-2 border-blue-200 bg-white shadow-sm relative ${
                        finalDraggedImage === imageIdentifier ? 'opacity-50 scale-95' : 'hover:shadow-md hover:border-blue-400'
                      }`}
                    >
                      <MediaRenderer
                        url={media.image_url}
                        alt={media.alt_text || fileName}
                        className="w-full h-20 object-cover"
                        showControls={false}
                        onVideoClick={isVideoFile ? () => {
                          const event = new CustomEvent('openVideoModal', { detail: { url: media.image_url } });
                          window.dispatchEvent(event);
                        } : undefined}
                        onClick={!isVideoFile ? () => {
                          const normalizedFileName = normalizeDisplayFileName(media.english_filename || media.original_filename);
                          const event = new CustomEvent('openImageModal', { detail: { url: media.image_url, fileName: normalizedFileName } });
                          window.dispatchEvent(event);
                        } : undefined}
                      />
                      
                      {/* 미할당 배지 - 왼쪽 상단 */}
                      <span className="absolute top-2 left-2 z-10 px-2 py-1 text-[10px] font-semibold rounded-md bg-yellow-500 text-white shadow-lg">
                        미할당
                      </span>
                      
                      {/* 동영상 배지 - 오른쪽 상단 */}
                      {isVideoFile && (
                        <span className="absolute top-2 right-2 z-10 px-2 py-1 text-[10px] font-semibold rounded-md bg-blue-500 text-white shadow-lg">
                          동영상
                        </span>
                      )}
                      
                      {/* 서류 배지 - 오른쪽 상단 (동영상이 아닐 때) */}
                      {isDocument && !isVideoFile && (
                        <span className="absolute top-2 right-2 z-10 px-2 py-1 text-[10px] font-semibold rounded-md bg-purple-500 text-white shadow-lg">
                          서류
                        </span>
                      )}
                      
                      <div className="p-1 text-xs bg-white truncate" title={fileName}>
                        {fileName}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 탭 메뉴 */}
          <div className="border-b border-gray-200 mb-4">
            <nav className="flex space-x-4">
              <button
                onClick={() => setActiveTab('images')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'images'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                사진 ({sceneImages.length})
              </button>
              <button
                onClick={() => setActiveTab('description')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'description'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                장면 설명
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'list'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                목록보기 ({images.length})
              </button>
            </nav>
          </div>

          {/* 탭 내용 */}
          {activeTab === 'images' && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDragOver(e, activeScene);
              }}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, activeScene)}
              className={`min-h-[200px] p-4 rounded-lg border-2 border-dashed transition-colors ${
                finalDragOverScene === activeScene
                  ? 'bg-blue-100 border-blue-400'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              {sceneImages.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {sceneImages.map(img => {
                    const fileName = normalizeDisplayFileName(img.english_filename || img.original_filename);
                    const isVideoFile = isVideo(img.image_url);
                    const isGif = fileName.toLowerCase().endsWith('.gif');
                    const normalizedImageUrl = normalizeUrl(img.image_url);
                    const imageIdentifier = img.id !== null ? img.id : (normalizedImageUrl || img.image_url);

                    return (
                      <div
                        key={img.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, img.id, normalizedImageUrl)}
                        className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-all ${
                          finalDraggedImage === imageIdentifier ? 'opacity-50 scale-95' : 'hover:shadow-md cursor-move'
                        }`}
                      >
                        <MediaRenderer
                          url={img.image_url}
                          alt={img.alt_text || fileName}
                          className="w-full h-full object-cover"
                          showControls={false}
                          onVideoClick={isVideoFile ? () => {
                            const event = new CustomEvent('openVideoModal', { detail: { url: img.image_url } });
                            window.dispatchEvent(event);
                          } : undefined}
                          onClick={!isVideoFile ? () => {
                            const normalizedFileName = normalizeDisplayFileName(img.english_filename || img.original_filename);
                            const event = new CustomEvent('openImageModal', { detail: { url: img.image_url, fileName: normalizedFileName } });
                            window.dispatchEvent(event);
                          } : undefined}
                        />
                        
                        {/* 동영상 배지 - 제외 버튼 왼쪽에 배치 */}
                        {isVideoFile && (
                          <span className="absolute top-2 right-12 z-10 px-2 py-1 text-[10px] font-semibold rounded-md bg-blue-500 text-white shadow-lg">
                            동영상
                          </span>
                        )}
                        
                        {/* 서류 배지 - 제외 버튼 왼쪽에 배치 */}
                        {(img.is_scanned_document === true || 
                          (img.document_type !== null && 
                           img.document_type !== undefined && 
                           img.document_type !== '')) && !isVideoFile && (
                          <span className="absolute top-2 right-12 z-10 px-2 py-1 text-[10px] font-semibold rounded-md bg-purple-500 text-white shadow-lg">
                            서류
                          </span>
                        )}
                        
                        {/* 제외 버튼 - 우측 상단, 미할당으로 이동 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFromScene(img.id, normalizedImageUrl);
                          }}
                          className="absolute top-2 right-2 z-20 px-2 py-1 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 opacity-90 hover:opacity-100 transition-opacity shadow-lg"
                          title="이 이미지를 장면에서 제거하고 미할당으로 이동"
                        >
                          제외
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  이 장면에 할당된 미디어가 없습니다. 미할당 미디어를 드래그하여 추가하세요.
                </div>
              )}
            </div>
          )}

          {activeTab === 'description' && (
            <div className="space-y-4">
              {isEditingDescription ? (
                <>
                  <textarea
                    value={editingDescription}
                    onChange={(e) => setEditingDescription(e.target.value)}
                    placeholder="장면 설명을 입력하세요 (최대 500자)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={6}
                    maxLength={500}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleCancelDescription}
                      className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSaveDescription}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      저장
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap min-h-[100px] p-3 bg-gray-50 rounded">
                    {currentDescription || '장면 설명을 추가하세요...'}
                  </p>
                  <button
                    onClick={() => {
                      setEditingDescription(currentDescription);
                      setIsEditingDescription(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    편집
                  </button>
                </>
              )}
            </div>
          )}

          {activeTab === 'list' && (
            <div>
              {/* 목록 (필터는 상단으로 이동했으므로 여기서 제거) */}
              <div className="grid grid-cols-4 gap-4">
                {filteredMedia.map((image) => {
                  const fileName = normalizeDisplayFileName(image.filename || image.english_filename || image.original_filename);
                  const isVideoFile = isVideo(image.image_url);
                  const isGif = fileName.toLowerCase().endsWith('.gif');
                  const normalizedImageUrl = normalizeUrl(image.image_url);
                  const imageIdentifier = image.id !== null ? image.id : (normalizedImageUrl || image.image_url);

                  return (
                    <div
                      key={image.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, image.id, normalizedImageUrl)}
                      className={`border rounded-lg overflow-hidden relative cursor-move transition-all ${
                        finalDraggedImage === imageIdentifier ? 'opacity-50 scale-95' : 'hover:shadow-md'
                      }`}
                    >
                      <MediaRenderer
                        url={image.image_url}
                        alt={image.alt_text || fileName}
                        className="w-full h-48 object-cover"
                        showControls={false}
                        onVideoClick={isVideoFile ? () => {
                          const event = new CustomEvent('openVideoModal', { detail: { url: image.image_url } });
                          window.dispatchEvent(event);
                        } : undefined}
                        onClick={!isVideoFile ? () => {
                          const normalizedFileName = normalizeDisplayFileName(image.english_filename || image.original_filename);
                          const event = new CustomEvent('openImageModal', { detail: { url: image.image_url, fileName: normalizedFileName } });
                          window.dispatchEvent(event);
                        } : undefined}
                      />
                      
                      {/* 할당 상태 배지 - 왼쪽 상단 */}
                      {image.story_scene !== null && image.story_scene >= 1 && image.story_scene <= 7 ? (
                        <span className="absolute top-2 left-2 z-10 px-2 py-1 text-[10px] font-semibold rounded-md bg-green-500 text-white shadow-lg">
                          장면 {image.story_scene}
                        </span>
                      ) : (
                        <span className="absolute top-2 left-2 z-10 px-2 py-1 text-[10px] font-semibold rounded-md bg-yellow-500 text-white shadow-lg">
                          미할당
                        </span>
                      )}
                      
                      {/* 동영상 배지 - 제외 버튼 왼쪽에 배치 */}
                      {isVideoFile && (
                        <span className="absolute top-2 right-12 z-10 px-2 py-1 text-[10px] font-semibold rounded-md bg-blue-500 text-white shadow-lg">
                          동영상
                        </span>
                      )}
                      
                      {/* 서류 배지 - 제외 버튼 왼쪽에 배치 (동영상이 아닐 때) */}
                      {((image.is_scanned_document === true || 
                         (image.document_type !== null && 
                          image.document_type !== undefined && 
                          image.document_type !== '')) && !isVideoFile) && (
                        <span className="absolute top-2 right-12 z-10 px-2 py-1 text-[10px] font-semibold rounded-md bg-purple-500 text-white shadow-lg">
                          서류
                        </span>
                      )}
                      
                      {/* 애니메이션 GIF 배지 - 제외 버튼 왼쪽에 배치 */}
                      {!isVideoFile && 
                       !(image.is_scanned_document === true || 
                         (image.document_type !== null && 
                          image.document_type !== undefined && 
                          image.document_type !== '')) && 
                       isGif && (
                        <span className="absolute top-2 right-12 z-10 px-2 py-1 text-[10px] font-semibold rounded-md bg-orange-500 text-white shadow-lg">
                          움짤
                        </span>
                      )}
                      
                      {/* 제외 버튼 - 장면 할당된 이미지에만, 우측 상단 */}
                      {image.story_scene !== null && image.story_scene >= 1 && image.story_scene <= 7 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFromScene(image.id, normalizedImageUrl);
                          }}
                          className="absolute top-2 right-2 z-20 px-2 py-1 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 opacity-90 hover:opacity-100 transition-opacity shadow-lg"
                          title="이 이미지를 장면에서 제거하고 미할당으로 이동"
                        >
                          제외
                        </button>
                      )}
                      
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
