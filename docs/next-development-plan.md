# 다음 개발 계획: 고객 스토리보드 이미지 관리 시스템

## 📋 현재 상태

### 완료된 작업 ✅
1. **데이터베이스 마이그레이션** ✅
   - `customer_story_scenes` 테이블 생성 완료
   - `display_order` 컬럼 추가 완료
   - 인덱스 및 코멘트 추가 완료

2. **고객 이미지 마이그레이션** ✅
   - 2022년: 1명 (장진수)
   - 2023년: 30명
   - 언매칭 고객: 6명 (김수환, 유재영, 이희익, 이주동, 장가반, 블러거)

---

## 🎯 다음 개발 단계

### Phase 1: API 엔드포인트 개발 (우선순위: 높음)

#### 1.1 이미지 장면 업데이트 API

**파일**: `pages/api/admin/update-image-scene.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { imageId, storyScene, displayOrder } = req.body;

  if (!imageId || !storyScene) {
    return res.status(400).json({ error: 'imageId and storyScene are required' });
  }

  const updateData: any = {
    story_scene: storyScene,
    updated_at: new Date().toISOString()
  };

  if (displayOrder !== undefined) {
    updateData.display_order = displayOrder;
  }

  const { data, error } = await supabase
    .from('image_metadata')
    .update(updateData)
    .eq('id', imageId)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true, data });
}
```

#### 1.2 장면 설명 저장/조회 API

**파일**: `pages/api/admin/customer-story-scenes.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // GET: 장면 설명 조회
  if (req.method === 'GET') {
    const { customerId } = req.query;

    if (!customerId) {
      return res.status(400).json({ error: 'customerId is required' });
    }

    const { data, error } = await supabase
      .from('customer_story_scenes')
      .select('*')
      .eq('customer_id', parseInt(customerId as string))
      .order('scene_number', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data: data || [] });
  }

  // POST: 장면 설명 저장/업데이트
  if (req.method === 'POST') {
    const { customerId, sceneNumber, description } = req.body;

    if (!customerId || !sceneNumber) {
      return res.status(400).json({ error: 'customerId and sceneNumber are required' });
    }

    const { data, error } = await supabase
      .from('customer_story_scenes')
      .upsert({
        customer_id: customerId,
        scene_number: sceneNumber,
        description: description || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'customer_id,scene_number'
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
```

---

### Phase 2: UI 컴포넌트 개발

#### 2.1 고객 관리 테이블에 "고객스토리" 버튼 추가

**파일**: `pages/admin/customers/index.tsx`

**변경 위치**: 액션 컬럼 버튼 영역

```typescript
// 상태 추가
const [storyModalOpen, setStoryModalOpen] = useState(false);
const [selectedCustomerForStory, setSelectedCustomerForStory] = useState<Customer | null>(null);

// 테이블 액션 버튼에 추가 (이미지 버튼 옆)
<button
  onClick={() => {
    setSelectedCustomerForStory(customer);
    setStoryModalOpen(true);
  }}
  className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
  title="고객 스토리보드 관리"
>
  고객스토리
</button>

// 모달 추가 (CustomerImageModal 아래)
{storyModalOpen && selectedCustomerForStory && (
  <CustomerStoryModal
    customer={selectedCustomerForStory}
    onClose={() => {
      setStoryModalOpen(false);
      setSelectedCustomerForStory(null);
    }}
  />
)}
```

#### 2.2 CustomerStoryModal 컴포넌트 생성

**파일**: `pages/admin/customers/components/CustomerStoryModal.tsx`

**주요 기능:**
1. 스토리보드 뷰 (7개 장면 타임라인)
2. 장면별 이미지 카드 표시
3. 장면 설명 편집 (인라인)
4. 드래그 앤 드롭 (장면 간 이동, 순서 변경)
5. 목록 보기 탭

**기본 구조:**

```typescript
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
  const [draggedImage, setDraggedImage] = useState<number | null>(null);
  const [dragOverScene, setDragOverScene] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // 이미지 로드
  useEffect(() => {
    loadCustomerImages();
    loadSceneDescriptions();
  }, [customer.id]);

  // 장면별 이미지 그룹화
  const imagesByScene = useMemo(() => {
    const grouped: Record<number, ImageMetadata[]> = {};
    for (let i = 1; i <= 7; i++) {
      grouped[i] = images
        .filter(img => img.story_scene === i)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }
    return grouped;
  }, [images]);

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (e: React.DragEvent, imageId: number) => {
    setDraggedImage(imageId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('imageId', String(imageId));
  };

  const handleDragOver = (e: React.DragEvent, scene: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverScene(scene);
  };

  const handleDrop = async (e: React.DragEvent, targetScene: number) => {
    e.preventDefault();
    const imageId = parseInt(e.dataTransfer.getData('imageId'));
    if (!imageId) return;
    
    await updateImageScene(imageId, targetScene);
    await loadCustomerImages();
    
    setDraggedImage(null);
    setDragOverScene(null);
  };

  // API 함수들
  const loadCustomerImages = async () => {
    // 고객 이미지 로드 로직
  };

  const loadSceneDescriptions = async () => {
    // 장면 설명 로드 로직
  };

  const updateImageScene = async (imageId: number, scene: number) => {
    // 이미지 장면 업데이트 로직
  };

  const saveSceneDescription = async (sceneNumber: number, description: string) => {
    // 장면 설명 저장 로직
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
          {viewMode === 'storyboard' ? (
            <StoryboardView
              imagesByScene={imagesByScene}
              sceneDescriptions={sceneDescriptions}
              editingScene={editingScene}
              onDescriptionChange={saveSceneDescription}
              onEditClick={setEditingScene}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              draggedImage={draggedImage}
              dragOverScene={dragOverScene}
            />
          ) : (
            <ListView images={images} />
          )}
        </div>
      </div>
    </div>
  );
}

// 스토리보드 뷰 컴포넌트
function StoryboardView({ 
  imagesByScene, 
  sceneDescriptions, 
  editingScene,
  onDescriptionChange,
  onEditClick,
  onDragStart,
  onDragOver,
  onDrop,
  draggedImage,
  dragOverScene
}: any) {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4, 5, 6, 7].map((sceneNum) => (
        <div key={sceneNum} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">
              장면 {sceneNum}: {SCENE_NAMES[sceneNum as keyof typeof SCENE_NAMES]}
            </h3>
            <button
              onClick={() => onEditClick(editingScene === sceneNum ? null : sceneNum)}
              className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
            >
              {editingScene === sceneNum ? '취소' : '편집'}
            </button>
          </div>

          {/* 장면 설명 편집 */}
          <div className="mb-4">
            {editingScene === sceneNum ? (
              <div className="flex gap-2">
                <textarea
                  value={sceneDescriptions[sceneNum] || ''}
                  onChange={(e) => {
                    // 임시 상태 업데이트
                  }}
                  onBlur={(e) => {
                    onDescriptionChange(sceneNum, e.target.value);
                    onEditClick(null);
                  }}
                  maxLength={500}
                  className="flex-1 px-3 py-2 border rounded"
                  rows={2}
                  placeholder="장면 설명을 입력하세요 (최대 500자)"
                />
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
                  className={`cursor-move transition-opacity rounded-lg overflow-hidden border ${
                    draggedImage === image.id ? 'opacity-50 scale-95' : ''
                  }`}
                >
                  <img
                    src={image.image_url}
                    alt={image.alt_text || ''}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-2 text-xs bg-white">
                    {image.english_filename || '이미지'}
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
            <div>{image.english_filename || '이미지'}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

### Phase 3: 개발 순서 및 예상 시간

1. **API 엔드포인트 개발** (2시간)
   - `update-image-scene.ts` 생성
   - `customer-story-scenes.ts` 생성
   - 테스트 및 검증

2. **UI 버튼 추가** (30분)
   - `pages/admin/customers/index.tsx` 수정
   - "고객스토리" 버튼 추가

3. **CustomerStoryModal 기본 구조** (2시간)
   - 컴포넌트 파일 생성
   - 기본 레이아웃 구현
   - 탭 전환 기능

4. **스토리보드 뷰 구현** (4시간)
   - 7개 장면 타임라인
   - 장면별 이미지 카드 표시
   - 이미지 로드 및 그룹화

5. **장면 설명 편집** (2시간)
   - 인라인 편집 UI
   - API 연동
   - 실시간 저장

6. **드래그 앤 드롭** (6시간)
   - 드래그 이벤트 핸들러
   - 드롭존 구현
   - 시각적 피드백
   - API 연동

7. **목록 보기 및 UX 개선** (3시간)
   - 목록 보기 탭
   - 애니메이션
   - 에러 처리
   - 로딩 상태

**총 예상 시간: 약 19시간**

---

## 📝 Supabase 쿼리 (이미 실행 완료)

```sql
-- 1. 이미지 순서 정보 컬럼 추가
ALTER TABLE image_metadata 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 2. 고객별 장면 설명 테이블 생성
CREATE TABLE IF NOT EXISTS customer_story_scenes (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  scene_number INTEGER NOT NULL CHECK (scene_number BETWEEN 1 AND 7),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, scene_number)
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_customer_story_scenes_customer 
ON customer_story_scenes(customer_id);

CREATE INDEX IF NOT EXISTS idx_image_metadata_display_order 
ON image_metadata(customer_id, story_scene, display_order);

-- 4. 코멘트 추가
COMMENT ON TABLE customer_story_scenes IS '고객별 스토리 장면 설명 저장';
COMMENT ON COLUMN customer_story_scenes.scene_number IS '스토리 장면 번호 (1: 행복한 주인공, 2: 행복+불안, 3: 문제 발생, 4: 가이드 만남, 5: 가이드 장소, 6: 성공 회복, 7: 여운 정적)';
COMMENT ON COLUMN customer_story_scenes.description IS '장면별 짧은 설명 텍스트 (최대 500자 권장)';
COMMENT ON COLUMN image_metadata.display_order IS '같은 장면 내 이미지 표시 순서';
```

---

## 🔍 확인 쿼리

```sql
-- 테이블 생성 확인
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customer_story_scenes'
ORDER BY ordinal_position;

-- 기존 고객 이미지 통계
SELECT 
  COUNT(*) as total_images,
  COUNT(DISTINCT customer_id) as total_customers,
  COUNT(CASE WHEN story_scene IS NOT NULL THEN 1 END) as images_with_scene,
  COUNT(CASE WHEN story_scene = 1 THEN 1 END) as scene1_count,
  COUNT(CASE WHEN story_scene = 2 THEN 1 END) as scene2_count,
  COUNT(CASE WHEN story_scene = 3 THEN 1 END) as scene3_count,
  COUNT(CASE WHEN story_scene = 4 THEN 1 END) as scene4_count,
  COUNT(CASE WHEN story_scene = 5 THEN 1 END) as scene5_count,
  COUNT(CASE WHEN story_scene = 6 THEN 1 END) as scene6_count,
  COUNT(CASE WHEN story_scene = 7 THEN 1 END) as scene7_count
FROM image_metadata
WHERE source = 'customer';

-- 고객별 이미지 수 확인
SELECT 
  c.id,
  c.name,
  COUNT(im.id) as image_count,
  COUNT(CASE WHEN im.story_scene IS NOT NULL THEN 1 END) as images_with_scene
FROM customers c
LEFT JOIN image_metadata im ON im.tags @> ARRAY['customer-' || c.id::text]
WHERE im.source = 'customer' OR im.source IS NULL
GROUP BY c.id, c.name
HAVING COUNT(im.id) > 0
ORDER BY image_count DESC
LIMIT 20;
```

---

## ✅ 다음 작업

1. API 엔드포인트 생성
2. UI 버튼 추가
3. CustomerStoryModal 컴포넌트 개발
4. 스토리보드 뷰 구현
5. 드래그 앤 드롭 기능 구현

---

**작성일**: 2026-01-15
