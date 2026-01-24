# 터치 스크롤 문제 수정 계획

## 문제 상황

모바일 화면에서 모든 세로 페이지들이 터치로 스크롤이 안되는 오류가 발생하고 있습니다.

## 원인 분석

### 1. CSS 스타일 문제

**현재 문제점:**
- `html, body`에 `overflow-x: hidden`만 설정되어 있고 `overflow-y`가 명시되지 않음
- `height: 100%`로 고정되어 스크롤이 불가능할 수 있음
- `-webkit-overflow-scrolling: touch` 미적용
- `touch-action` 속성 미설정

**영향받는 파일:**
- `styles/globals.css`

### 2. 컴포넌트 레벨 문제

**잠재적 문제점:**
- 일부 컴포넌트에서 `overflow: hidden` 적용
- `height: 100vh` 또는 `max-height: 100vh`로 고정
- `position: fixed` 요소가 스크롤을 방해

**영향받는 컴포넌트:**
- `components/admin/kakao/ProfileManager.tsx`
- `components/admin/kakao/FeedManager.tsx`
- `components/admin/kakao/KakaoAccountEditor.tsx`
- `pages/admin/kakao-content.tsx`

### 3. 모달/오버레이 문제

**잠재적 문제점:**
- 모달이 열릴 때 `body`에 `overflow: hidden` 적용
- 모달 닫힌 후 스크롤이 복구되지 않음

**영향받는 컴포넌트:**
- `components/admin/GalleryPicker.tsx`
- 기타 모달 컴포넌트들

## 수정 계획

### 1단계: 전역 CSS 수정 ✅

**파일:** `styles/globals.css`

**수정 내용:**
```css
html, body {
  margin: 0;
  padding: 0;
  font-family: 'Noto Sans KR', sans-serif;
  overflow-x: hidden; /* 가로 스크롤 방지 */
  overflow-y: auto; /* 세로 스크롤 허용 */
  width: 100%;
  max-width: 100vw;
  height: auto; /* 높이 자동 (100% 고정 방지) */
  min-height: 100vh; /* 최소 높이 보장 */
  -webkit-overflow-scrolling: touch; /* iOS 터치 스크롤 최적화 */
  touch-action: pan-y; /* 세로 스크롤만 허용 */
}
```

**효과:**
- 세로 스크롤 명시적 허용
- iOS 터치 스크롤 최적화
- 높이 고정 문제 해결

### 2단계: 터치 스크롤 로깅 추가 ✅

**파일:**
- `lib/touch-scroll-logger.ts` (새로 생성)
- `pages/_app.tsx` (로거 초기화 추가)

**기능:**
- 터치 이벤트 로깅 (touchstart, touchmove, touchend)
- 스크롤 이벤트 로깅
- 스크롤 가능 여부 자동 진단
- CSS 스타일 문제 자동 감지

**사용법:**
- 개발자 콘솔에서 `[TOUCH-SCROLL]` 접두사로 로그 확인
- `window.touchScrollLogger.getLogs()`로 로그 조회
- `window.touchScrollLogger.disable()`로 로깅 비활성화

### 3단계: 플레이라이트 테스트 작성 ✅

**파일:** `e2e-test/playwright-touch-scroll-test.js`

**테스트 내용:**
- 모바일 뷰포트에서 각 페이지 접근
- 터치 스크롤 시도
- 스크롤 가능 여부 확인
- CSS 스타일 문제 진단
- 결과를 JSON 파일로 저장

**실행 방법:**
```bash
node e2e-test/playwright-touch-scroll-test.js
```

### 4단계: 컴포넌트별 스크롤 문제 수정

#### 4-1. ProfileManager.tsx

**확인 사항:**
- 컨테이너에 `overflow: hidden` 적용 여부
- `height: 100vh` 고정 여부
- 스크롤 가능한 영역 확인

**수정 방향:**
- 필요시 `overflow-y: auto` 추가
- `height: auto` 또는 `min-height` 사용
- 터치 스크롤 최적화 클래스 추가

#### 4-2. FeedManager.tsx

**확인 사항:**
- 동일한 스크롤 문제 확인
- 이미지 프리뷰 영역 스크롤 가능 여부

**수정 방향:**
- ProfileManager와 동일한 패턴 적용

#### 4-3. KakaoAccountEditor.tsx

**확인 사항:**
- 전체 레이아웃 스크롤 가능 여부
- 섹션별 스크롤 문제

**수정 방향:**
- 메인 컨테이너에 스크롤 허용
- 섹션 간 간격 조정

#### 4-4. kakao-content.tsx

**확인 사항:**
- 페이지 레벨 스크롤 문제
- 모달 열림/닫힘 시 스크롤 복구

**수정 방향:**
- 모달 관리 로직 개선
- body 스크롤 복구 보장

### 5단계: 모달 스크롤 문제 수정

#### 5-1. GalleryPicker.tsx

**확인 사항:**
- 모달 열릴 때 body 스크롤 차단
- 모달 닫힐 때 스크롤 복구
- 모달 내부 스크롤 가능 여부

**수정 방향:**
```typescript
// 모달 열릴 때
useEffect(() => {
  if (isOpen) {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }
}, [isOpen]);
```

### 6단계: 반응형 스크롤 최적화

**모바일 전용 스타일:**
```css
@media (max-width: 768px) {
  html, body {
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
  }
  
  .scrollable-container {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
  }
}
```

## 테스트 계획

### 1. 수동 테스트

1. **모바일 디바이스에서 테스트:**
   - iPhone (Safari)
   - Android (Chrome)
   - 다양한 화면 크기

2. **테스트 페이지:**
   - `/admin/kakao-content`
   - `/admin/gallery`
   - `/admin/blog`
   - `/admin/contacts`

3. **테스트 시나리오:**
   - 페이지 로드 후 스크롤 가능 여부
   - 터치 스크롤 동작 확인
   - 모달 열림/닫힘 후 스크롤 복구
   - 긴 콘텐츠 스크롤 테스트

### 2. 자동화 테스트

**플레이라이트 테스트 실행:**
```bash
# 로컬 환경
BASE_URL=http://localhost:3000 node e2e-test/playwright-touch-scroll-test.js

# 배포 환경
BASE_URL=https://www.masgolf.co.kr node e2e-test/playwright-touch-scroll-test.js
```

**결과 확인:**
- `e2e-test/playwright-touch-scroll-results.json` 파일 확인
- 실패한 테스트 케이스 분석
- CSS 스타일 문제 리포트 확인

### 3. 개발자 콘솔 로그 확인

1. 브라우저 개발자 도구 열기
2. Console 탭 확인
3. `[TOUCH-SCROLL]` 접두사 로그 확인
4. 스크롤 가능 여부 및 문제 진단 메시지 확인

## 예상 효과

### 1. 즉시 효과
- 모바일에서 터치 스크롤 정상 작동
- iOS Safari에서 부드러운 스크롤
- 스크롤 문제 자동 진단 가능

### 2. 장기 효과
- 모든 페이지에서 일관된 스크롤 동작
- 모달 관리 개선
- 사용자 경험 향상

## 우선순위

1. **높음 (즉시 수정):**
   - 전역 CSS 수정 ✅
   - 터치 스크롤 로깅 추가 ✅
   - 플레이라이트 테스트 작성 ✅

2. **중간 (다음 단계):**
   - 컴포넌트별 스크롤 문제 수정
   - 모달 스크롤 문제 수정

3. **낮음 (최적화):**
   - 반응형 스크롤 최적화
   - 성능 개선

## 참고 사항

- iOS Safari는 `-webkit-overflow-scrolling: touch` 필수
- Android Chrome은 기본적으로 터치 스크롤 지원
- `touch-action: pan-y`는 가로 스크롤 방지에 유용
- 모달이 열릴 때 body 스크롤 차단은 필요하지만, 닫힐 때 복구 필수
