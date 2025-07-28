# 🎬 7월 캠페인 유튜브 팝업 - 초간단 가이드

## 🚀 한 줄 실행 (가장 심플!)

```bash
# 유튜브 비디오 ID만 바꿔서 실행하세요
bash add-youtube-popup-july.sh YOUR_VIDEO_ID
```

예시:
```bash
bash add-youtube-popup-july.sh dQw4w9WgXcQ
```

## 📝 비디오 ID 찾는 방법

유튜브 URL에서 비디오 ID 추출:
- `https://www.youtube.com/watch?v=dQw4w9WgXcQ` → **dQw4w9WgXcQ**
- `https://youtu.be/dQw4w9WgXcQ` → **dQw4w9WgXcQ**

## ✨ 추가되는 기능

1. **플로팅 버튼**: 페이지 우측 하단에 빨간색 버튼
2. **팝업 모달**: 클릭시 유튜브 영상 재생
3. **닫기 옵션**: X 버튼, ESC 키, 배경 클릭

## 🛠 커스터마이징 (선택사항)

### 버튼 텍스트 변경
```javascript
// add-youtube-popup-july.js 파일에서
'🎥 7월 피팅 영상 보기' // 이 부분을 원하는 텍스트로 변경
```

### 버튼 위치 변경
```css
bottom: 30px;  /* 아래에서 거리 */
right: 30px;   /* 오른쪽에서 거리 */
```

### 자동 팝업 열기
```javascript
// 주석 제거하면 2초 후 자동으로 팝업 열림
window.addEventListener('load', function() {
  setTimeout(openYoutubeModal, 2000);
});
```

## 🔧 문제 해결

### 파일을 찾을 수 없다는 오류
```bash
# 대화형 모드로 실행 (파일 선택 가능)
bash add-youtube-popup-july.sh
```

### 이미 팝업이 있다는 메시지
- 기존 팝업을 유지하거나
- 백업 파일에서 복원 후 다시 실행

## 📁 파일 구조

```
작업 파일: public/versions/funnel-2025-07-supabase.html
백업 위치: public/versions/backup/july-youtube-backup-*.html
```

## ⚡ 더 간단한 방법?

원클릭 실행을 원한다면:
```bash
# .env.local에 기본 비디오 ID 설정
echo "DEFAULT_YOUTUBE_ID=YOUR_VIDEO_ID" >> .env.local

# 그 다음부터는 그냥 실행
npm run add-youtube
```

---

끝! 이제 복잡한 과정 없이 바로 유튜브 팝업을 추가할 수 있습니다. 🎉