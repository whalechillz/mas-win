# 고객 스토리보드 이미지 관리 시스템 개발 계획

## 📋 프로젝트 개요

고객 이미지를 스토리보드 형태로 시각적으로 관리하고, 드래그 앤 드롭으로 장면 간 이동 및 순서 변경이 가능한 시스템을 구축합니다. 각 장면에 짧은 설명 텍스트를 추가할 수 있는 기능도 포함합니다.

---

## 1. 언매칭 고객 확인 및 처리

### 1.1 2024년, 2025년 언매칭 고객 확인 결과

**확인 스크립트:** `scripts/check-unmatched-customers.js`

#### 2024년 언매칭 고객 (2명)
1. **김수환** - 폴더: `2024.*.*.김수환`
2. **유재영** - 폴더: `2024.*.*.유재영`

#### 2025년 언매칭 고객 (4명)
1. **이희익** - 폴더: `2025.*.*.이희익`
2. **이주동** - 폴더: `2025.*.*.이주동`
3. **장가반** - 폴더: `2025.*.*.장가반`
4. **블러거** - 폴더: `2025.*.*.블러거` (특수 케이스)

**총 언매칭 고객: 6명**

### 1.2 처리 방안

1. **전화번호 확인 후 수동 매칭**
   - 고객에게 전화번호를 확인받아 DB에서 매칭
   - 매칭 성공 시 정상 마이그레이션 진행

2. **unmatched 폴더에 임시 저장**
   - DB에 고객 정보가 없는 경우
   - `originals/customers/unmatched/{영문이름}/` 폴더에 저장
   - 나중에 고객 정보 추가 후 재매칭

3. **고객 정보 추가 후 재마이그레이션**
   - 고객 정보를 DB에 추가한 후
   - `scripts/migrate-unmatched-customers.js` 실행

---

## 2. 데이터베이스 스키마

### 2.1 기존 스키마 활용
- `image_metadata.story_scene`: 장면 번호 (1-7)
- `image_metadata.image_type`: 이미지 타입
- `image_metadata.display_order`: 순서 정보 (추가 필요)

### 2.2 추가 마이그레이션

```sql
-- 이미지 순서 정보 저장 (이미 있으면 스킵)
ALTER TABLE image_metadata 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 고객별 장면 설명 저장
CREATE TABLE IF NOT EXISTS customer_story_scenes (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  scene_number INTEGER NOT NULL CHECK (scene_number BETWEEN 1 AND 7),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(customer_id, scene_number)
);

CREATE INDEX IF NOT EXISTS idx_customer_story_scenes_customer ON customer_story_scenes(customer_id);

-- 코멘트 추가
COMMENT ON TABLE customer_story_scenes IS '고객별 스토리 장면 설명 저장';
COMMENT ON COLUMN customer_story_scenes.scene_number IS '스토리 장면 번호 (1: 행복한 주인공, 2: 행복+불안, 3: 문제 발생, 4: 가이드 만남, 5: 가이드 장소, 6: 성공 회복, 7: 여운 정적)';
COMMENT ON COLUMN customer_story_scenes.description IS '장면별 짧은 설명 텍스트 (최대 500자 권장)';
```

---

## 3. UI 구조 설계

### 3.1 버튼 구조 (권장: 옵션 3)

**고객 관리 테이블 액션 컬럼:**
```
[수정] [이미지] [고객스토리] [메시지] [선물] [삭제]
```

**버튼 설명:**
- **이미지**: 기본 이미지 관리 모달 (현재 기능 유지)
  - 업로드, 날짜별/타입별 보기, 삭제
- **고객스토리**: 스토리보드형 관리 모달 (새 기능)
  - 스토리보드 뷰, 드래그 앤 드롭, 장면 설명 편집

### 3.2 모달 구조

#### CustomerStoryModal 컴포넌트
```typescript
interface CustomerStoryModalProps {
  customer: Customer;
  onClose: () => void;
}

// 주요 기능:
// 1. 스토리보드 뷰 (기본)
// 2. 목록 보기 (기존과 유사)
// 3. 장면별 설명 편집
// 4. 드래그 앤 드롭으로 장면 변경
```

---

## 4. 스토리보드 UI 설계

### 4.1 레이아웃

```
┌─────────────────────────────────────────────────────────────┐
│  고객 스토리 관리: 송화용                            [닫기] │
├─────────────────────────────────────────────────────────────┤
│  [스토리보드] [목록보기]                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  장면 1: 행복한 주인공                                       │
│  ┌────────────────────────────────────────────────────┐    │
│  │ [편집] 짧은 설명 텍스트...                          │    │
│  │ ┌────┐ ┌────┐ ┌────┐ ┌────┐                       │    │
│  │ │이미│ │이미│ │이미│ │이미│  (드래그 가능)          │    │
│  │ │지1│ │지2│ │지3│ │지4│                       │    │
│  │ └────┘ └────┘ └────┘ └────┘                       │    │
│  └────────────────────────────────────────────────────┘    │
│  ────────────────────────────────────────────────────────   │
│  장면 2: 행복+불안                                           │
│  ┌────────────────────────────────────────────────────┐    │
│  │ [편집] 짧은 설명 텍스트...                          │    │
│  │ ┌────┐ ┌────┐                                      │    │
│  │ │이미│ │이미│                                       │    │
│  │ │지1│ │지2│                                       │    │
│  │ └────┘ └────┘                                       │    │
│  └────────────────────────────────────────────────────┘    │
│  ... (장면 3-7 동일)                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 장면 설명 편집 기능

**UI:**
- 각 장면 헤더에 [편집] 버튼
- 클릭 시 인라인 텍스트 입력 필드 표시
- 저장 시 `customer_story_scenes` 테이블에 저장
- 최대 500자 제한

**데이터 구조:**
```typescript
{
  customer_id: number,
  scene_number: 1-7,
  description: string // 최대 500자 권장
}
```

**편집 UI 예시:**
```typescript
// 읽기 모드
<div className="flex items-center gap-2">
  <span className="text-sm text-gray-600">
    {description || '장면 설명을 추가하세요...'}
  </span>
  <button onClick={() => setEditing(true)}>편집</button>
</div>

// 편집 모드
<div className="flex items-center gap-2">
  <textarea
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    maxLength={500}
    className="flex-1 px-2 py-1 border rounded"
    rows={2}
  />
  <button onClick={handleSave}>저장</button>
  <button onClick={() => setEditing(false)}>취소</button>
</div>
```

---

## 5. 드래그 앤 드롭 기능

### 5.1 기능 요구사항

1. **이미지 카드 드래그**
   - 이미지 카드에 `draggable="true"` 속성
   - 드래그 시작 시 시각적 피드백 (반투명, 스케일)

2. **장면 간 이동**
   - 다른 장면의 드롭존에 드롭 시 `story_scene` 업데이트
   - API 호출: `PATCH /api/admin/update-image-scene`

3. **같은 장면 내 순서 변경**
   - 같은 장면 내에서 드래그 앤 드롭
   - `display_order` 업데이트

4. **시각적 피드백**
   - 드래그 중: 반투명 처리, 커서 변경
   - 드롭존 하이라이트: 호버/드래그 오버 시 배경색 변경
   - 드롭 가능 영역 표시

### 5.2 구현 세부사항

```typescript
// 드래그 상태 관리
const [draggedImage, setDraggedImage] = useState<number | null>(null);
const [dragOverScene, setDragOverScene] = useState<number | null>(null);

// 드래그 핸들러
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
  
  if (!imageId || !draggedImage) return;
  
  // API 호출
  await updateImageScene(imageId, targetScene);
  
  // 상태 초기화
  setDraggedImage(null);
  setDragOverScene(null);
  
  // 이미지 목록 새로고침
  await refreshImages();
};

// 이미지 카드 컴포넌트
<div
  draggable
  onDragStart={(e) => handleDragStart(e, image.id)}
  className={`cursor-move transition-opacity ${
    draggedImage === image.id ? 'opacity-50 scale-95' : ''
  }`}
>
  <img src={image.image_url} alt={image.alt_text} />
</div>

// 드롭존 컴포넌트
<div
  onDragOver={(e) => handleDragOver(e, sceneNumber)}
  onDrop={(e) => handleDrop(e, sceneNumber)}
  className={`min-h-[200px] p-4 rounded-lg border-2 border-dashed transition-colors ${
    dragOverScene === sceneNumber
      ? 'bg-blue-100 border-blue-400'
      : 'bg-gray-50 border-gray-200'
  }`}
>
  {/* 이미지 카드들 */}
</div>
```

---

## 6. API 엔드포인트

### 6.1 이미지 장면 업데이트

```typescript
// PATCH /api/admin/update-image-scene
// Request Body:
{
  imageId: number,
  storyScene: number,
  displayOrder?: number
}

// Response:
{
  success: boolean,
  data?: {
    id: number,
    story_scene: number,
    display_order: number
  },
  error?: string
}
```

### 6.2 장면 설명 저장/조회

```typescript
// GET /api/admin/customer-story-scenes?customerId={id}
// Response:
{
  success: boolean,
  data: Array<{
    id: number,
    customer_id: number,
    scene_number: number,
    description: string,
    created_at: string,
    updated_at: string
  }>
}

// POST /api/admin/customer-story-scenes
// Request Body:
{
  customerId: number,
  sceneNumber: number,
  description: string
}

// Response:
{
  success: boolean,
  data?: {
    id: number,
    customer_id: number,
    scene_number: number,
    description: string
  },
  error?: string
}
```

---

## 7. 개발 단계

### 1단계: 언매칭 고객 확인 및 처리 ✅
- [x] `scripts/check-unmatched-customers.js` 생성
- [x] 2024년, 2025년 언매칭 고객 목록 확인
- [ ] 언매칭 고객 처리 (전화번호 확인 또는 unmatched 폴더 이동)

### 2단계: 데이터베이스 마이그레이션
- [ ] `customer_story_scenes` 테이블 생성
- [ ] `display_order` 컬럼 추가 (이미 있으면 스킵)
- [ ] 인덱스 및 코멘트 추가

### 3단계: UI 구조 변경
- [ ] "고객스토리" 버튼 추가 (`pages/admin/customers/index.tsx`)
- [ ] `CustomerStoryModal` 컴포넌트 생성
- [ ] 기본 레이아웃 구현 (7개 장면 타임라인)

### 4단계: 스토리보드 뷰 구현
- [ ] 장면별 이미지 카드 표시
- [ ] 장면 설명 표시 영역
- [ ] 목록 보기 탭 추가

### 5단계: 장면 설명 편집 기능
- [ ] 인라인 편집 UI
- [ ] API 엔드포인트 구현 (`/api/admin/customer-story-scenes`)
- [ ] 실시간 저장 및 로딩 상태 처리

### 6단계: 드래그 앤 드롭 기능
- [ ] 드래그 이벤트 핸들러 구현
- [ ] 드롭존 구현
- [ ] 시각적 피드백 (반투명, 하이라이트)
- [ ] API 연동 (`/api/admin/update-image-scene`)

### 7단계: UX 개선
- [ ] 애니메이션 추가 (드래그 시 부드러운 전환)
- [ ] 모바일 대응 (터치 드래그)
- [ ] 키보드 단축키 지원 (선택사항)
- [ ] 로딩 상태 및 에러 처리

---

## 8. 파일 구조

```
pages/admin/customers/
  ├── index.tsx (버튼 추가)
  └── components/
      ├── CustomerImageModal.tsx (기존)
      └── CustomerStoryModal.tsx (신규)

pages/api/admin/
  ├── update-image-scene.ts (신규)
  └── customer-story-scenes.ts (신규)

database/
  └── migrate-customer-story-scenes.sql (신규)

scripts/
  └── check-unmatched-customers.js (완료)
```

---

## 9. 예상 작업 시간

- 언매칭 고객 확인: ✅ 완료 (1시간)
- 데이터베이스 마이그레이션: 1시간
- UI 구조 변경: 2시간
- 스토리보드 뷰: 4시간
- 장면 설명 편집: 2시간
- 드래그 앤 드롭: 6시간
- UX 개선: 3시간

**총 예상 시간: 19시간**

---

## 10. 우선순위

1. **높음**: 언매칭 고객 처리 (전화번호 확인 또는 unmatched 폴더 이동)
2. **높음**: 스토리보드 뷰 기본 구현
3. **중간**: 드래그 앤 드롭 기능
4. **중간**: 장면 설명 편집 기능
5. **낮음**: UX 개선 (애니메이션, 모바일)

---

## 11. 참고사항

- 제품 합성 관리 페이지의 UI 패턴 참고
- GalleryPicker의 드래그 앤 드롭 로직 재사용 가능
- 기존 `story_scene` 컬럼 활용으로 추가 마이그레이션 최소화
- 장면 설명은 블로그 자동 생성 시 활용 가능

---

## 12. 스토리 장면 정의

1. **장면 1: 행복한 주인공** - 골프를 즐기는 모습
2. **장면 2: 행복+불안 전조** - 동료와 대화하지만 걱정이 섞인 표정
3. **장면 3: 문제 발생** - 비거리, 통증 등 문제로 고민
4. **장면 4: 가이드 만남** - 피팅 스튜디오에서 상담
5. **장면 5: 가이드 장소** - 피팅 스튜디오 배경 (사람 없음)
6. **장면 6: 성공 회복** - 문제 해결 후 성공적인 스윙
7. **장면 7: 여운 정적** - 후기, 감사 인사

---

## 13. 다음 단계

1. 언매칭 고객 처리 (전화번호 확인 또는 unmatched 폴더 이동)
2. 데이터베이스 마이그레이션 실행
3. UI 구조 변경 및 기본 컴포넌트 생성
4. 스토리보드 뷰 구현
5. 장면 설명 편집 기능 추가
6. 드래그 앤 드롭 기능 구현

---

**작성일:** 2026-01-15  
**최종 수정일:** 2026-01-15
