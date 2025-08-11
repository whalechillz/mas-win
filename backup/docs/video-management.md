# 동영상 파일 관리 가이드

## 📂 폴더 구조

```
/public/assets/campaigns/
├── 2025-06/                    # 2025년 6월 캠페인
│   ├── primetime-golfer-daily.mp4
│   ├── testimonial-kim.mp4
│   └── product-showcase.mp4
├── 2025-07/                    # 2025년 7월 캠페인
│   └── summer-special.mp4
└── ...
```

## 📝 파일명 규칙

### 1. 캠페인 폴더명
- 형식: `YYYY-MM` (예: 2025-06)
- 캠페인 연도와 월로 구분

### 2. 동영상 파일명
- 소문자와 하이픈(-) 사용
- 내용을 설명하는 명확한 이름
- 예시:
  - `primetime-golfer-daily.mp4` - 프라임타임 골퍼의 하루
  - `testimonial-{name}.mp4` - 고객 후기
  - `product-showcase.mp4` - 제품 소개
  - `course-aerial-view.mp4` - 코스 항공 뷰

## 🎬 동영상 추가 방법

### 1. 새 캠페인 동영상 추가
```bash
# 1. 캠페인 폴더 생성 (없는 경우)
mkdir -p public/assets/campaigns/2025-07

# 2. 동영상 파일 복사
cp ~/Downloads/new-video.mp4 public/assets/campaigns/2025-07/descriptive-name.mp4

# 3. 코드에서 경로 사용
<source src="/assets/campaigns/2025-07/descriptive-name.mp4" type="video/mp4" />
```

### 2. 기존 동영상 교체
```bash
# 백업 후 교체
mv public/assets/campaigns/2025-06/old-video.mp4 public/assets/campaigns/2025-06/old-video.backup.mp4
cp ~/Downloads/new-video.mp4 public/assets/campaigns/2025-06/new-name.mp4
```

## 🔧 최적화 팁

### 1. 파일 크기
- 웹용으로 압축 (5-10MB 권장)
- ffmpeg 사용 예시:
```bash
ffmpeg -i input.mp4 -vcodec h264 -acodec aac -movflags +faststart output.mp4
```

### 2. 포스터 이미지
- 각 동영상에 대한 썸네일 이미지 준비
- 같은 폴더에 `.jpg` 또는 `.png` 형식으로 저장
- 예: `primetime-golfer-daily-poster.jpg`

### 3. 다중 형식 지원
```html
<video>
  <source src="video.mp4" type="video/mp4" />
  <source src="video.webm" type="video/webm" />
</video>
```

## 📊 관리 현황

| 캠페인 | 폴더 | 동영상 개수 | 총 용량 |
|--------|------|------------|---------|
| 2025-06 | /campaigns/2025-06 | 1개 | - |
| 2025-07 | 준비중 | - | - |

## 🚀 자동화 스크립트 (추가 예정)
- 동영상 압축 자동화
- 썸네일 자동 생성
- 파일명 정리 스크립트
