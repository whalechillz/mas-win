# MASGOLF 이미지 관리 가이드

## 폴더 구조

```
/public/assets/
├── campaigns/          # 월별 캠페인 전용 이미지
│   ├── 2025-05/       # 5월 "가정의 달" 캠페인
│   ├── 2025-06/       # 6월 "인생 황금기" 캠페인
│   └── 2025-07/       # 7월 "뜨거운 여름" 캠페인
├── hero/              # 히어로 섹션 공통 이미지
├── product/           # 제품 공통 이미지 (드라이버, 샤프트 등)
├── review/            # 고객 리뷰 아바타 이미지
├── package/           # 패키지/프로모션 관련 이미지
└── story/             # 브랜드 스토리 이미지
```

## 이미지 명명 규칙

### 1. 캠페인별 이미지 (campaigns/YYYY-MM/)
- `hero-[설명]-[월].jpg` (예: hero-summer-golf-07.jpg)
- `promo-[설명]-[월].jpg` (예: promo-cooling-towel-07.jpg)
- `video-[설명]-[월].mp4` (예: video-summer-swing-07.mp4)

### 2. 공통 이미지
- **제품**: `[제품명]-[특징]-[크기].jpg` (예: driver-titanium-1200x800.jpg)
- **리뷰**: `golfer_avatar_[번호].jpg` (예: golfer_avatar_01.jpg)
- **히어로**: `hero-[설명].jpg` (예: hero-senior-golfer.jpg)

## 이미지 사용 가이드

### 1. 월별 캠페인 이미지
```html
<!-- 7월 캠페인 전용 이미지 -->
<img src="/assets/campaigns/2025-07/hero-summer-golf.jpg" alt="여름 골프">

<!-- 6월 캠페인 전용 이미지 -->
<img src="/assets/campaigns/2025-06/golden-time-golfer-story.mp4" alt="황금기 스토리">
```

### 2. 공통 이미지 재사용
```html
<!-- 모든 캠페인에서 사용 가능한 제품 이미지 -->
<img src="/assets/product/driver_impact_1200x800.jpg" alt="드라이버">
<img src="/assets/review/golfer_avatar_512x512_01.jpg" alt="고객 후기">
```

## 이미지 최적화 가이드

1. **크기**:
   - 히어로 이미지: 1920x1080 이상
   - 제품 이미지: 1200x800
   - 아바타 이미지: 512x512
   - 모바일 최적화: 각 이미지의 @2x 버전 준비

2. **포맷**:
   - 사진: JPEG (품질 85-90%)
   - 아이콘/로고: PNG
   - 애니메이션: MP4 (웹 최적화)

3. **파일 크기**:
   - 히어로 이미지: 500KB 이하
   - 제품 이미지: 200KB 이하
   - 아바타: 50KB 이하

## 캠페인 추가 시 체크리스트

- [ ] `/assets/campaigns/YYYY-MM/` 폴더 생성
- [ ] 캠페인 전용 이미지를 해당 폴더에 저장
- [ ] 공통으로 사용할 이미지는 기존 공통 폴더 활용
- [ ] HTML에서 올바른 경로 참조
- [ ] 이미지 alt 텍스트 추가
- [ ] 모바일 반응형 확인

## 기존 캠페인 관리

- 과거 캠페인 이미지는 삭제하지 않고 보관
- 재사용 가능한 이미지는 공통 폴더로 이동
- 캠페인별 고유 이미지는 해당 월 폴더에 유지
