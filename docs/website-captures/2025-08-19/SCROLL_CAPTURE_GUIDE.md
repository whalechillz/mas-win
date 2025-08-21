# 스크롤 캡처 가이드 - 긴 페이지 완전 캡처 방법

## 🎯 문제점과 해결방안

### ❌ 현재 문제점
- **첫 화면만 캡처**: 중요한 하단 콘텐츠 누락
- **스크롤 깊이 무시**: 사용자가 실제로 보는 전체 콘텐츠 미반영
- **섹션별 분석 불가**: 각 섹션의 디자인과 레이아웃 개별 검토 어려움

### ✅ 해결방안

## 📸 캡처 방법 3가지

### 1. 전체 페이지 캡처 (Full Page Screenshot)
```javascript
// Playwright 전체 페이지 캡처
await page.screenshot({
  path: 'full-page.png',
  fullPage: true  // 전체 페이지 캡처
});
```

**장점**: 
- 한 번에 전체 페이지 캡처
- 파일 크기 최적화
- 간단한 작업

**단점**: 
- 세부 분석 어려움
- 특정 섹션 집중 검토 불가

### 2. 섹션별 캡처 (Section-by-Section)
```javascript
// 각 섹션을 개별적으로 캡처
const sections = [
  'hero-section',
  'product-collection', 
  'customer-reviews',
  'contact-form',
  'footer'
];

for (const section of sections) {
  await page.locator(`#${section}`).screenshot({
    path: `${section}.png`
  });
}
```

**장점**:
- 섹션별 상세 분석 가능
- 디자인 개선점 명확히 파악
- 파일 관리 용이

**단점**:
- 작업 시간 증가
- 섹션 구분 작업 필요

### 3. 스크롤 단계별 캡처 (Scroll-Step Capture)
```javascript
// 화면 높이만큼 스크롤하며 단계별 캡처
const viewportHeight = await page.evaluate(() => window.innerHeight);
const pageHeight = await page.evaluate(() => document.body.scrollHeight);
const steps = Math.ceil(pageHeight / viewportHeight);

for (let i = 0; i < steps; i++) {
  await page.evaluate((step) => {
    window.scrollTo(0, step * window.innerHeight);
  }, i);
  
  await page.screenshot({
    path: `scroll-step-${i + 1}.png`
  });
}
```

**장점**:
- 사용자 경험과 동일한 시각
- 스크롤 애니메이션 효과 확인
- 자연스러운 페이지 흐름 파악

**단점**:
- 파일 수 증가
- 중복 콘텐츠 발생

## 🛠️ 실제 구현 방법

### MASGOLF 홈페이지 섹션별 캡처 계획

#### 1. 히어로 섹션
- **위치**: 페이지 최상단
- **내용**: 메인 헤드라인, CTA 버튼
- **파일명**: `hero-section_pc.png`, `hero-section_mobile.png`

#### 2. 제품 컬렉션
- **위치**: 히어로 섹션 아래
- **내용**: 5개 드라이버 제품
- **파일명**: `product-collection_pc.png`, `product-collection_mobile.png`

#### 3. 고객 후기
- **위치**: 제품 컬렉션 아래
- **내용**: 3개 시니어 골퍼 후기
- **파일명**: `customer-reviews_pc.png`, `customer-reviews_mobile.png`

#### 4. 문의 폼
- **위치**: 고객 후기 아래
- **내용**: 상세한 문의 양식
- **파일명**: `contact-form_pc.png`, `contact-form_mobile.png`

#### 5. 푸터
- **위치**: 페이지 최하단
- **내용**: 회사 정보, 연락처, 링크
- **파일명**: `footer_pc.png`, `footer_mobile.png`

## 📁 개선된 디렉토리 구조

```
docs/website-captures/2025-08-19/
├── pc/
│   ├── homepage/
│   │   ├── hero-section_pc.png
│   │   ├── product-collection_pc.png
│   │   ├── customer-reviews_pc.png
│   │   ├── contact-form_pc.png
│   │   ├── footer_pc.png
│   │   └── full-page_pc.png
│   ├── funnel-25-08/
│   │   ├── hero-section_pc.png
│   │   ├── customer-stories_pc.png
│   │   ├── product-lineup_pc.png
│   │   ├── special-offers_pc.png
│   │   └── footer_pc.png
│   └── admin-dashboard/
│       ├── login_pc.png
│       ├── main-dashboard_pc.png
│       └── navigation_pc.png
└── mobile/
    ├── homepage/
    │   ├── hero-section_mobile.png
    │   ├── product-collection_mobile.png
    │   ├── customer-reviews_mobile.png
    │   ├── contact-form_mobile.png
    │   ├── footer_mobile.png
    │   └── full-page_mobile.png
    └── ...
```

## 🎨 섹션별 분석 포인트

### 히어로 섹션
- [ ] 메인 헤드라인 가독성
- [ ] CTA 버튼 위치와 색상
- [ ] 배경 이미지/색상 효과
- [ ] 반응형 디자인 적용

### 제품 컬렉션
- [ ] 제품 카드 레이아웃
- [ ] 가격 표시 방식
- [ ] 제품 이미지 품질
- [ ] 구매 버튼 위치

### 고객 후기
- [ ] 후기 카드 디자인
- [ ] 프로필 이미지 배치
- [ ] 인용구 스타일링
- [ ] 신뢰도 요소

### 문의 폼
- [ ] 폼 레이아웃
- [ ] 입력 필드 디자인
- [ ] 버튼 스타일
- [ ] 유효성 검사 표시

### 푸터
- [ ] 정보 구조화
- [ ] 링크 배치
- [ ] 연락처 정보
- [ ] 브랜딩 요소

## 📋 캡처 체크리스트

### 사전 준비
- [ ] 페이지 로딩 완료 확인
- [ ] 모든 이미지 로드 확인
- [ ] 폰트 로딩 완료 확인
- [ ] 애니메이션 완료 대기

### 캡처 실행
- [ ] 전체 페이지 캡처
- [ ] 섹션별 개별 캡처
- [ ] PC/모바일 버전 모두 캡처
- [ ] 파일명 규칙 준수

### 품질 확인
- [ ] 이미지 선명도 확인
- [ ] 색상 정확도 확인
- [ ] 텍스트 가독성 확인
- [ ] 파일 크기 최적화

## 🚀 자동화 스크립트 예시

```javascript
// Playwright 자동 섹션 캡처 스크립트
const { chromium } = require('playwright');

async function captureSections() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('https://www.masgolf.co.kr');
  
  // 전체 페이지 캡처
  await page.screenshot({
    path: 'full-page.png',
    fullPage: true
  });
  
  // 섹션별 캡처
  const sections = [
    { id: 'hero', name: 'hero-section' },
    { id: 'products', name: 'product-collection' },
    { id: 'reviews', name: 'customer-reviews' },
    { id: 'contact', name: 'contact-form' },
    { id: 'footer', name: 'footer' }
  ];
  
  for (const section of sections) {
    try {
      await page.locator(`#${section.id}`).screenshot({
        path: `${section.name}.png`
      });
    } catch (error) {
      console.log(`Section ${section.name} not found`);
    }
  }
  
  await browser.close();
}

captureSections();
```

## 📈 활용 효과

### 디자인 점검
- **섹션별 상세 분석**: 각 섹션의 디자인 품질 개별 평가
- **일관성 검토**: 전체 페이지의 디자인 일관성 확인
- **사용자 경험 분석**: 스크롤 흐름에 따른 UX 평가

### 리뉴얼 참고
- **개선 전후 비교**: 섹션별 개선 효과 명확히 파악
- **우선순위 설정**: 개선이 필요한 섹션 우선순위 결정
- **성과 측정**: 섹션별 개선 효과 측정

### 품질 관리
- **변경사항 추적**: 섹션별 변경사항 세밀하게 추적
- **버그 발견**: 특정 섹션의 문제점 조기 발견
- **사용자 피드백 대응**: 섹션별 피드백 수집 및 대응

---

**결론**: 섹션별 캡처를 통해 긴 페이지의 모든 콘텐츠를 완전히 문서화하고, 디자인 점검 및 리뉴얼 작업에 활용할 수 있는 상세한 기준점을 마련할 수 있습니다.
