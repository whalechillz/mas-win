# 고객 대표 이미지 배지 중복 표시 문제 수정 계획

## 문제 분석

### 현재 상황
1. **원래 있던 이미지들**: 왼쪽 위에 대표/일반 버튼 1개만 표시 (정상)
2. **새로 올린 이미지들** (`ahnhuija-S1-20260128-01.webp`, `ahnhuija-S1-20260128-02.webp`):
   - 왼쪽 위에 "일반" 버튼 1개 (작동 안 함)
   - 바로 아래에 "대표" 버튼 1개 (작동함)
   - 총 2개의 버튼이 표시됨

### 원인 분석

**코드 구조**:
```tsx
{/* 장면별 대표 이미지 배지 */}
{img.story_scene && !isVideo(img.image_url) && (
  <button className="absolute top-2 left-2 z-10 ...">
    {img.is_scene_representative ? '⭐ 대표' : '○ 일반'}
  </button>
)}

{/* 고객 대표 이미지 배지 */}
{!isVideo(img.image_url) && (
  <button className={`absolute ${img.story_scene ? 'top-10 left-2' : 'top-2 left-2'} z-20 ...`}>
    {img.is_customer_representative ? '⭐ 대표' : '○ 일반'}
  </button>
)}
```

**문제점**:
1. **새로 올린 이미지**는 `story_scene`이 설정되어 있음 (S1-S7 자동 감지)
2. `story_scene`이 있으면:
   - 장면 배지: `top-2 left-2` (왼쪽 위) - "○ 일반" 표시
   - 고객 대표 이미지 배지: `top-10 left-2` (바로 아래) - "⭐ 대표" 또는 "○ 일반" 표시
3. **원래 있던 이미지**는 `story_scene`이 없거나 null:
   - 장면 배지: 표시 안 됨
   - 고객 대표 이미지 배지: `top-2 left-2` (왼쪽 위) - 1개만 표시

**왜 왼쪽 위 버튼이 작동 안 하는가?**
- 장면 배지(`z-10`)가 고객 대표 이미지 배지(`z-20`)보다 낮은 z-index를 가지고 있지만
- 장면 배지가 위에 있어서 클릭이 장면 배지로 가로채일 수 있음
- 또는 장면 배지의 클릭 핸들러가 제대로 작동하지 않을 수 있음

## 해결 방안

### 옵션 1: 고객 대표 이미지 배지만 사용 (권장) ⭐

**이유**:
- 고객 목록 썸네일은 고객 대표 이미지로 충분
- 장면 대표 이미지는 스토리보드용 (별도 기능)
- UI 단순화

**수정 내용**:
- 장면 배지를 제거하거나 조건부로 표시하지 않음
- 고객 대표 이미지 배지만 표시

**장점**:
- UI 단순화
- 혼란 제거
- 기능 명확화

**단점**:
- 장면 대표 이미지 설정을 다른 곳에서 해야 함 (스토리보드 모달)

### 옵션 2: 위치 조정으로 겹침 방지

**수정 내용**:
- 장면 배지: `top-2 left-2` (왼쪽 위)
- 고객 대표 이미지 배지: `top-2 right-2` (오른쪽 위) 또는 `bottom-2 left-2` (왼쪽 아래)

**장점**:
- 두 기능 모두 유지
- 겹침 방지

**단점**:
- UI 복잡도 증가
- 사용자 혼란 가능성

### 옵션 3: 조건부 표시

**수정 내용**:
- 고객 대표 이미지 배지를 우선 표시
- 장면 배지는 고객 대표 이미지가 설정되지 않았을 때만 표시

**장점**:
- 기능 모두 유지
- UI 단순화

**단점**:
- 로직 복잡도 증가

## 권장 방안: 옵션 1 (고객 대표 이미지 배지만 사용)

### 이유
1. 고객 목록 썸네일은 고객 대표 이미지로 충분
2. 장면 대표 이미지는 스토리보드 모달에서 설정 가능
3. UI 단순화 및 사용자 혼란 제거

### 구현 계획

#### Phase 1: 장면 배지 조건부 제거
**파일**: `pages/admin/customers/index.tsx`

**수정 내용**:
- 고객 이미지 관리 모달에서는 장면 배지를 표시하지 않음
- 고객 대표 이미지 배지만 표시

**수정 위치**:
1. 날짜별 그룹화 섹션 (3324-3344줄)
2. 일반 이미지 탭 (3460-3486줄)

#### Phase 2: 스토리보드 모달에서 장면 배지 유지
**파일**: `components/admin/CustomerStoryModal.tsx`

**확인 사항**:
- 스토리보드 모달에서는 장면 배지가 정상 작동하는지 확인
- 장면 대표 이미지 설정 기능 유지

## 수정 계획

### 즉시 수정 (우선순위: 높음)

1. **고객 이미지 관리 모달에서 장면 배지 제거**
   - 장면 배지 조건부 렌더링 제거 또는 조건 추가
   - 고객 대표 이미지 배지만 표시

2. **위치 통일**
   - 모든 이미지에서 고객 대표 이미지 배지를 `top-2 left-2`에 표시
   - `story_scene` 조건 제거

### 수정 코드 예시

```tsx
{/* 고객 대표 이미지 배지 (클릭 가능) - 동영상 제외 */}
{!isVideo(img.image_url) && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      e.preventDefault();
      if (img.is_customer_representative) {
        handleUnsetCustomerRepresentative(img.id);
      } else {
        handleSetCustomerRepresentative(img.id);
      }
    }}
    className={`absolute top-2 left-2 z-20 px-2 py-1 text-[10px] font-semibold rounded-md shadow-lg flex items-center gap-1 cursor-pointer transition-colors ${
      img.is_customer_representative
        ? 'bg-blue-500 text-white hover:bg-blue-600'
        : 'bg-gray-400 text-white hover:bg-gray-500 opacity-0 group-hover:opacity-100'
    }`}
    title={img.is_customer_representative ? '대표 이미지 해제 (클릭)' : '대표 이미지로 설정 (클릭)'}
  >
    {img.is_customer_representative ? '⭐ 대표' : '○ 일반'}
  </button>
)}
```

**변경 사항**:
- `img.story_scene ? 'top-10 left-2' : 'top-2 left-2'` → `top-2 left-2` (항상 같은 위치)
- 장면 배지 조건부 렌더링 제거 (고객 이미지 관리 모달에서)

## 예상 작업 시간

- 코드 수정: 30분
- 테스트: 30분
- **총 예상 시간: 1시간**

## 테스트 계획

1. **새로 올린 이미지 테스트**:
   - 이미지 업로드 후 버튼이 1개만 표시되는지 확인
   - 버튼 클릭 시 대표 이미지 설정/해제 작동 확인

2. **원래 있던 이미지 테스트**:
   - 기존 이미지의 버튼이 정상 작동하는지 확인
   - 버튼 위치가 일관된지 확인

3. **스토리보드 모달 테스트**:
   - 스토리보드 모달에서 장면 배지가 정상 작동하는지 확인
