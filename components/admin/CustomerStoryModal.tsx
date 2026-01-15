'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';

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

export default function CustomerStoryModal({ customer, onClose }: CustomerStoryModalProps) {
  const [viewMode, setViewMode] = useState<'storyboard' | 'list'>('storyboard');
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [sceneDescriptions, setSceneDescriptions] = useState<Record<number, string>>({});
  const [editingScene, setEditingScene] = useState<number | null>(null);
  const [editingDescription, setEditingDescription] = useState<Record<number, string>>({});
  const [draggedImage, setDraggedImage] = useState<number | null>(null);
  const [dragOverScene, setDragOverScene] = useState<number | null>(null);
  const [dragOverUnassigned, setDragOverUnassigned] = useState(false);
  const [loading, setLoading] = useState(true);

  // 이미지 로드
  useEffect(() => {
    loadCustomerImages();
    loadSceneDescriptions();
  }, [customer.id]);

  // 미할당 이미지 추출
  const unassignedImages = useMemo(() => {
    return images.filter(img => !img.story_scene || img.story_scene < 1 || img.story_scene > 7);
  }, [images]);

  // 장면별 이미지 그룹화
  const imagesByScene = useMemo(() => {
    const grouped: Record<number, ImageMetadata[]> = {};
    
    // 1-7 장면 초기화
    for (let i = 1; i <= 7; i++) {
      grouped[i] = [];
    }
    
    // 이미지를 장면별로 분류
    images.forEach((img) => {
      const scene = img.story_scene;
      if (scene && scene >= 1 && scene <= 7) {
        grouped[scene].push(img);
      }
    });
    
    // 각 장면별로 정렬
    for (let i = 1; i <= 7; i++) {
      grouped[i].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }
    
    // 디버깅: 각 장면별 이미지 개수 및 전체 이미지 정보 로그
    console.log('📊 장면별 이미지 그룹화:', {
      totalImages: images.length,
      imagesWithScene: images.filter(img => img.story_scene && img.story_scene >= 1 && img.story_scene <= 7).length,
      unassignedImages: unassignedImages.length,
      scenes: Object.keys(grouped).map(scene => ({
        scene,
        count: grouped[parseInt(scene)].length
      }))
    });
    
    return grouped;
  }, [images, unassignedImages]);

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (e: React.DragEvent, imageId: number) => {
    setDraggedImage(imageId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('imageId', String(imageId));
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
    const imageId = parseInt(e.dataTransfer.getData('imageId'));
    if (!imageId) return;
    
    // targetScene이 null이면 미할당 영역으로 이동
    await updateImageScene(imageId, targetScene);
    await loadCustomerImages();
    
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
      const response = await fetch(`/api/admin/upload-customer-image?customerId=${customer.id}`);
      const result = await response.json();
      
      console.log('📸 고객 이미지 로드 결과:', {
        success: result.success,
        imageCount: result.images?.length || 0,
        images: result.images?.map((img: any) => ({
          id: img.id,
          image_url: img.image_url,
          story_scene: img.story_scene,
          image_type: img.image_type,
          english_filename: img.english_filename
        }))
      });
      
      if (result.success && result.images) {
        // story_scene이 null인 이미지도 포함하여 설정
        const processedImages = result.images.map((img: any) => ({
          ...img,
          story_scene: img.story_scene || null
        }));
        setImages(processedImages);
        console.log('✅ 이미지 설정 완료:', processedImages.length, '개');
      } else {
        console.warn('⚠️ 이미지가 없거나 로드 실패:', result);
        setImages([]);
      }
    } catch (error) {
      console.error('❌ 이미지 로드 오류:', error);
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
              draggedImage={draggedImage}
              dragOverScene={dragOverScene}
              dragOverUnassigned={dragOverUnassigned}
              setDragOverUnassigned={setDragOverUnassigned}
            />
          ) : (
            <ListView images={images} />
          )}
        </div>
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
  setDragOverUnassigned
}: {
  images: ImageMetadata[];
  onDragStart: (e: React.DragEvent, imageId: number) => void;
  onDrop: (e: React.DragEvent) => void;
  draggedImage: number | null;
  dragOverUnassigned: boolean;
  setDragOverUnassigned: (value: boolean) => void;
}) {
  return (
    <div className="mb-6 border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-md font-semibold text-gray-700">
          📦 미할당 이미지 ({images.length}개)
        </h3>
        <span className="text-xs text-gray-500">
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
          dragOverUnassigned ? 'bg-blue-100 border-2 border-blue-400' : ''
        }`}
      >
        {images.map((image) => (
          <div
            key={image.id}
            draggable
            onDragStart={(e) => onDragStart(e, image.id)}
            className={`cursor-move transition-opacity rounded overflow-hidden border bg-white ${
              draggedImage === image.id ? 'opacity-50 scale-95' : 'hover:shadow-md'
            }`}
          >
            <img
              src={image.image_url}
              alt={image.alt_text || ''}
              className="w-full h-20 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-image.png';
              }}
            />
            <div className="p-1 text-xs bg-white truncate" title={image.english_filename || image.original_filename || '이미지'}>
              {image.english_filename || image.original_filename || '이미지'}
            </div>
          </div>
        ))}
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
              {imagesByScene[sceneNum]?.map((image: ImageMetadata) => (
                <div
                  key={image.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, image.id)}
                  className={`relative group cursor-move transition-opacity rounded-lg overflow-hidden border ${
                    draggedImage === image.id ? 'opacity-50 scale-95' : 'hover:shadow-md'
                  }`}
                >
                  <img
                    src={image.image_url}
                    alt={image.alt_text || ''}
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      console.error('❌ 이미지 로드 실패:', image.image_url);
                      (e.target as HTMLImageElement).src = '/placeholder-image.png';
                    }}
                    onLoad={() => {
                      console.log('✅ 이미지 로드 성공:', image.image_url);
                    }}
                  />
                  {/* 제거 버튼 */}
                  <button
                    onClick={() => onRemoveFromScene(image.id)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="장면에서 제거"
                  >
                    ×
                  </button>
                  <div className="p-2 text-xs bg-white">
                    {image.english_filename || image.original_filename || '이미지'}
                  </div>
                </div>
              ))}
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
      {images.map((image) => (
        <div key={image.id} className="border rounded-lg overflow-hidden">
          <img
            src={image.image_url}
            alt={image.alt_text || ''}
            className="w-full h-48 object-cover"
          />
          <div className="p-2 text-xs">
            <div>장면: {image.story_scene || '미분류'}</div>
            <div>{image.english_filename || image.original_filename || '이미지'}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
