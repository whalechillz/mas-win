# 터치 스크롤 오류 원인 분석

## 플레이라이트 테스트 결과 요약

### 테스트 실행 결과
- **카카오 콘텐츠 페이지**: ❌ Error (테스트 중 오류 발생)
- **갤러리 관리 페이지**: ❌ Error (테스트 중 오류 발생)
- **블로그 관리 페이지**: ❌ Failed (`-webkit-overflow-scrolling: touch` 미적용)
- **고객 관리 페이지**: ⏭️ Skipped (스크롤할 콘텐츠 없음)

### 발견된 문제

#### 1. `-webkit-overflow-scrolling: touch` 미적용 ⚠️

**현상:**
- 개발자 콘솔에서 지속적으로 `-webkit-overflow-scrolling: touch 미적용` 경고 발생
- CSS에는 이미 추가했지만 실제로 적용되지 않음

**원인:**
- `-webkit-overflow-scrolling` 속성은 `html`이나 `body`에 직접 적용되는 것이 아니라, **스크롤 가능한 컨테이너**에 적용되어야 함
- 이 속성은 `overflow: auto` 또는 `overflow: scroll`이 있는 요소에만 작동
- `html, body`에 `overflow-y: auto`를 설정했지만, 실제 스크롤이 발생하는 요소가 다를 수 있음

**해결 방법:**
```css
/* 현재 (작동하지 않음) */
html, body {
  -webkit-overflow-scrolling: touch;
}

/* 수정 (작동함) */
html {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

body {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 또는 스크롤 가능한 컨테이너에 직접 적용 */
.scrollable-container {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
```

#### 2. 페이지 레이아웃 구조 문제

**발견된 패턴:**
```tsx
// pages/admin/kakao-content.tsx
<div className="min-h-screen bg-gray-50">
  {/* 콘텐츠 */}
</div>
```

**문제점:**
- `min-h-screen`은 최소 높이를 뷰포트 높이로 설정
- 콘텐츠가 뷰포트보다 길어도 스크롤이 제대로 작동하지 않을 수 있음
- 특히 모바일에서 `height: 100vh`와 함께 사용되면 스크롤 문제 발생

**해결 방법:**
- `min-h-screen` 대신 `min-h-full` 사용
- 또는 높이를 명시적으로 설정하지 않고 콘텐츠에 따라 자동으로 늘어나도록 설정

#### 3. 모바일 터치 이벤트 처리 문제

**현상:**
- 플레이라이트 테스트에서 터치 스크롤이 제대로 작동하지 않음
- 프로그래밍 방식 스크롤(`window.scrollTo`)은 작동하지만, 터치 제스처는 작동하지 않음

**원인:**
- iOS Safari에서 터치 스크롤을 위해서는:
  1. `-webkit-overflow-scrolling: touch` 필수
  2. `overflow: auto` 또는 `overflow: scroll` 필수
  3. 스크롤 가능한 컨테이너가 명확해야 함
  4. `touch-action` 속성 설정 필요

#### 4. 모달/오버레이 스크롤 차단 문제

**발견된 코드:**
```tsx
// components/admin/kakao/ImageSelectionModal.tsx
<div className="max-h-[90vh] overflow-auto">
```

**문제점:**
- 모달 내부 스크롤은 작동하지만, 모달이 열릴 때 body 스크롤이 차단됨
- 모달 닫힌 후 스크롤이 복구되지 않을 수 있음

## 근본 원인

### 1. CSS 속성 적용 위치 오류

**현재 상태:**
```css
html, body {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
```

**문제:**
- `-webkit-overflow-scrolling`은 스크롤 가능한 **컨테이너**에 적용되어야 함
- `html, body`는 스크롤 컨테이너가 아니라 루트 요소
- 실제 스크롤이 발생하는 요소에 적용해야 함

### 2. 높이 설정 문제

**현재 상태:**
- `min-h-screen` 사용으로 인해 높이가 뷰포트에 고정될 수 있음
- 모바일에서 `100vh`는 주소창을 포함하지 않아 스크롤 문제 발생 가능

### 3. 터치 이벤트 처리 부족

**현재 상태:**
- 터치 이벤트 리스너는 있지만, 실제 스크롤 동작과 연결되지 않음
- `touch-action` 속성이 제대로 설정되지 않음

## 수정 계획

### 1단계: CSS 수정 (즉시 적용)

**파일:** `styles/globals.css`

```css
/* 수정 전 */
html, body {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 수정 후 */
html {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  height: 100%;
}

body {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  height: auto;
  min-height: 100%;
}

/* 모바일 최적화 */
@media (max-width: 768px) {
  html {
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
  }
  
  body {
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
  }
  
  /* 스크롤 가능한 모든 컨테이너에 적용 */
  [class*="overflow"] {
    -webkit-overflow-scrolling: touch;
  }
}
```

### 2단계: 페이지 레이아웃 수정

**파일:** `pages/admin/kakao-content.tsx`

```tsx
// 수정 전
<div className="min-h-screen bg-gray-50">

// 수정 후
<div className="bg-gray-50">
  {/* min-h-screen 제거, 콘텐츠에 따라 자동 높이 */}
```

### 3단계: 모달 스크롤 관리 개선

**파일:** `components/admin/GalleryPicker.tsx` 및 기타 모달

```tsx
useEffect(() => {
  if (isOpen) {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    
    // 모달 열릴 때 body 스크롤 차단
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    
    return () => {
      // 모달 닫힐 때 스크롤 복구
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = '';
    };
  }
}, [isOpen]);
```

### 4단계: 터치 스크롤 강제 활성화

**파일:** `lib/touch-scroll-fix.ts` (새로 생성)

```typescript
export function enableTouchScroll() {
  if (typeof window === 'undefined') return;
  
  // 모든 스크롤 가능한 요소에 터치 스크롤 적용
  const style = document.createElement('style');
  style.textContent = `
    * {
      -webkit-overflow-scrolling: touch !important;
    }
    
    html, body {
      -webkit-overflow-scrolling: touch !important;
      touch-action: pan-y !important;
    }
  `;
  document.head.appendChild(style);
}
```

## 우선순위

1. **높음 (즉시 수정):**
   - CSS `-webkit-overflow-scrolling` 적용 위치 수정
   - `touch-action: pan-y` 추가
   - 모바일 미디어 쿼리 추가

2. **중간 (다음 단계):**
   - 페이지 레이아웃 `min-h-screen` 제거
   - 모달 스크롤 관리 개선

3. **낮음 (최적화):**
   - 터치 스크롤 강제 활성화 스크립트
   - 추가 성능 최적화

## 테스트 방법

### 수동 테스트
1. 모바일 디바이스에서 각 페이지 접속
2. 터치 스크롤 동작 확인
3. 개발자 콘솔에서 `[TOUCH-SCROLL]` 로그 확인

### 자동화 테스트
```bash
node e2e-test/playwright-touch-scroll-test.js
```

## 예상 효과

1. **즉시 효과:**
   - iOS Safari에서 부드러운 터치 스크롤
   - 모든 페이지에서 일관된 스크롤 동작

2. **장기 효과:**
   - 사용자 경험 개선
   - 모바일 사용성 향상
