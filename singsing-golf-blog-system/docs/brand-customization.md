# 싱싱골프투어 브랜드 커스터마이징 가이드

## 🎯 브랜드 전략 수정

### 1. 브랜드 데이터 파일 생성

`src/lib/singsing-brand-data.js` 파일을 생성하여 싱싱골프투어 브랜드 정보를 정의합니다.

```javascript
// 싱싱골프투어 브랜드 프로필
export const SINGSING_BRAND_PROFILE = `
싱싱골프투어 - 프리미엄 골프 투어 전문 브랜드

## 핵심 가치
- 리무진 버스를 이용한 편안한 골프 여행
- 2박3일 올인클루시브 패키지
- 순천 파인힐스 & 영덕 오션비치 골프장
- 전일정 클럽식 포함
- 숙소, 식사, 관광까지 한 번에 해결

## 서비스 특징
- 최신 리무진 버스 (상해보장)
- 5성급 호텔 숙박
- 3일간 54홀 라운드
- 관광 차량비 포함
- 4팀 이상 출발 확정

## 신뢰성
- 2025년 하반기 일정 확정
- 출발 4주 전 마감
- 전화 상담: 031-215-3990
- 카톡 상담 서비스
`;

// 브랜드 색상 팔레트
export const SINGSING_COLORS = {
  primary: '#2E7D32',    // 골프 그린
  secondary: '#FF6F00',  // 오렌지
  accent: '#1976D2',     // 블루
  neutral: '#424242',    // 다크 그레이
  light: '#F5F5F5'       // 라이트 그레이
};

// 브랜드 메시지
export const SINGSING_MESSAGES = {
  tagline: "편안한 리무진 골프투어, 싱싱골프투어",
  cta: "지금 예약하세요!",
  value: "숨겨진 비용 없이 진짜 올인클루시브 프리미엄 골프패키지"
};
```

### 2. AI 이미지 생성 프롬프트 수정

`src/pages/api/generate-paragraph-images.js`에서 브랜드 관련 프롬프트를 수정합니다.

```javascript
// 기존 MASSGOO 브랜드 프롬프트를 싱싱골프투어로 변경
const systemPrompt = `당신은 전문적인 AI 이미지 생성 프롬프트 작성자입니다.

프롬프트 작성 규칙:
1. 단락의 핵심 내용을 시각적으로 표현
2. 다양한 상황과 장면 생성
3. 한국인 50-70대 골퍼가 주인공
4. 싱싱골프투어 브랜드 자연스럽게 포함
5. 리무진 버스, 프리미엄 골프 투어 요소 강조
6. 텍스트나 글자는 절대 포함하지 않음

싱싱골프투어 시각적 요소:
- 리무진 버스 (Singsing Golf Tour 로고)
- 프리미엄 골프장 (순천 파인힐스, 영덕 오션비치)
- 2박3일 투어 장면
- 올인클루시브 서비스 분위기
- 만족스러운 골퍼들의 모습
`;
```

### 3. UI 색상 테마 변경

`tailwind.config.js`에서 싱싱골프투어 브랜드 색상을 적용합니다.

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8f5e8',
          100: '#c8e6c9',
          500: '#2E7D32',  // 싱싱골프투어 그린
          600: '#1b5e20',
          700: '#2e7d32'
        },
        secondary: {
          50: '#fff3e0',
          100: '#ffe0b2',
          500: '#FF6F00',  // 싱싱골프투어 오렌지
          600: '#f57c00',
          700: '#ef6c00'
        }
      }
    }
  }
}
```

### 4. 로고 및 브랜딩 요소

`src/assets/` 폴더에 싱싱골프투어 로고와 브랜딩 요소를 추가합니다.

```
src/assets/
├── logo/
│   ├── singsing-logo.png
│   ├── singsing-logo-white.png
│   └── singsing-favicon.ico
├── images/
│   ├── limousine-bus.jpg
│   ├── pine-hills-golf.jpg
│   └── ocean-beach-golf.jpg
└── icons/
    ├── golf-icon.svg
    ├── tour-icon.svg
    └── premium-icon.svg
```

### 5. 메타데이터 설정

`src/pages/_app.tsx`에서 싱싱골프투어 메타데이터를 설정합니다.

```javascript
export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>싱싱골프투어 - 프리미엄 골프 투어</title>
        <meta name="description" content="편안한 리무진 골프투어, 2박3일 올인클루시브 패키지" />
        <meta name="keywords" content="골프투어, 리무진, 순천파인힐스, 영덕오션비치, 골프패키지" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
```

## 🎨 디자인 시스템

### 타이포그래피
- 제목: Noto Sans KR Bold
- 본문: Noto Sans KR Regular
- 강조: Noto Sans KR Medium

### 아이콘
- 골프 관련 아이콘
- 투어 관련 아이콘
- 프리미엄 서비스 아이콘

### 레이아웃
- 깔끔하고 모던한 디자인
- 골프의 프리미엄함을 강조
- 사용자 친화적인 인터페이스

## 📱 반응형 디자인

모든 페이지가 모바일, 태블릿, 데스크톱에서 최적화되도록 설계되었습니다.

- 모바일: 320px ~ 768px
- 태블릿: 768px ~ 1024px
- 데스크톱: 1024px 이상
