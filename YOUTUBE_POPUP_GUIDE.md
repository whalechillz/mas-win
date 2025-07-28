# YouTube 팝업 사용 가이드

## 구현 완료 내용

### 1. 컴포넌트 생성
- **위치**: `/components/common/YouTubePopup.tsx`
- **기능**:
  - 반응형 디자인 (모바일/데스크탑)
  - 로딩 표시
  - ESC 키로 닫기
  - 5초 후 닫기 버튼 표시 (변경 가능)
  - 자동 재생

### 2. 페이지 수정
- **파일**: `/pages/funnel-2025-07.tsx`
- **기능**:
  - 페이지 로드 3초 후 자동 팝업 표시
  - 24시간마다 한 번만 자동 표시 (localStorage 활용)
  - HTML에서 수동 트리거 가능

### 3. 트리거 스크립트
- **파일**: `/public/youtube-popup-trigger.js`
- HTML 파일에서 팝업을 수동으로 열 수 있는 함수 제공

## 사용 방법

### 1. 자동 팝업
- 현재 설정: 페이지 로드 3초 후 자동 표시
- 24시간 내 재방문 시 표시하지 않음

### 2. HTML에서 수동 트리거
```html
<!-- funnel-2025-07-complete.html에 추가 -->

<!-- 방법 1: 버튼 클릭 -->
<button onclick="window.parent.postMessage({ type: 'open-youtube' }, '*')">
  프로모션 동영상 보기
</button>

<!-- 방법 2: 링크 클릭 -->
<a href="javascript:window.parent.postMessage({ type: 'open-youtube' }, '*')">
  동영상 보기
</a>

<!-- 방법 3: 스크립트 포함하여 사용 -->
<script src="/youtube-popup-trigger.js"></script>
<button onclick="openYouTubePopup()">동영상 보기</button>
```

## 설정 변경 방법

### 1. 자동 팝업 시간 변경
```tsx
// funnel-2025-07.tsx에서
setTimeout(() => {
  setShowYouTube(true);
  // ...
}, 3000); // 3000ms = 3초, 원하는 시간으로 변경
```

### 2. 닫기 버튼 표시 시간 변경
```tsx
// funnel-2025-07.tsx에서
<YouTubePopup 
  videoId="WXyJdmPp9eE"
  onClose={() => setShowYouTube(false)}
  showCloseAfter={5} // 원하는 초 단위로 변경 (0이면 즉시 표시)
/>
```

### 3. 재표시 주기 변경
```tsx
// funnel-2025-07.tsx에서
const oneDayInMs = 24 * 60 * 60 * 1000; // 24시간
// 예: 12시간마다 = 12 * 60 * 60 * 1000
// 예: 1주일마다 = 7 * 24 * 60 * 60 * 1000
```

### 4. 다른 YouTube 비디오 사용
```tsx
// funnel-2025-07.tsx에서
<YouTubePopup 
  videoId="다른비디오ID" // YouTube URL의 v= 뒤의 ID
  // ...
/>
```

## 테스트 방법

1. **자동 팝업 테스트**:
   - 페이지 새로고침 후 3초 대기
   - 팝업이 자동으로 표시되는지 확인

2. **24시간 제한 테스트**:
   - 팝업 표시 후 페이지 새로고침
   - 팝업이 다시 표시되지 않는지 확인
   - localStorage에서 'youtubePopupLastShown' 삭제 후 테스트

3. **수동 트리거 테스트**:
   - 개발자 콘솔에서 실행:
   ```javascript
   window.postMessage({ type: 'open-youtube' }, '*')
   ```

## 주의사항

1. **모바일 자동재생**: 일부 모바일 브라우저에서는 자동재생이 제한될 수 있음
2. **팝업 차단기**: 브라우저 팝업 차단기는 영향을 주지 않음 (모달 방식)
3. **성능**: YouTube iframe은 필요할 때만 로드되므로 초기 페이지 로딩에 영향 없음
