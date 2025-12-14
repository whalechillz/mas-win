# 고객 페이지 디자인 가이드라인

> 마쓰구골프 고객 페이지 디자인 및 개발 가이드라인  
> 최신 웹 에이전시 디자인 트렌드를 반영한 프리미엄 브랜드 경험 제공

## 목차

1. [개선 방향](#개선-방향)
2. [디자인 원칙](#디자인-원칙)
3. [타이포그래피 가이드](#타이포그래피-가이드)
4. [컴포넌트 가이드](#컴포넌트-가이드)
5. [반응형 디자인 가이드](#반응형-디자인-가이드)
6. [애니메이션 및 인터랙션](#애니메이션-및-인터랙션)
7. [색상 및 브랜딩](#색상-및-브랜딩)
8. [접근성 가이드](#접근성-가이드)

---

## 개선 방향

### 1. 시타 예약 페이지 (`/try-a-massgoo`)

#### 적용된 개선사항

**히어로 섹션**
- ✅ 모바일 최적화: 메인 타이틀 행바꿈 적용
- ✅ 그라데이션 효과: "시타서비스" 텍스트에 그라데이션 적용
- ✅ 서브타이틀: 모바일에서 행바꿈으로 가독성 향상
- ✅ CTA 버튼: 그라데이션 배경 및 호버 애니메이션

**서비스 소개 카드**
- ✅ 호버 효과: 카드 상승 애니메이션 (`hover:-translate-y-2`)
- ✅ 이미지 줌 효과: 호버 시 이미지 확대
- ✅ 그림자 강화: `shadow-lg` → `shadow-2xl` (호버 시)
- ✅ 테두리 추가: `border border-gray-100`

**매장 정보 섹션**
- ✅ 아이콘 추가: 위치, 전화, 시간, 비거리 상담
- ✅ 비거리 상담 전화번호 크기 증가 (`text-base md:text-lg`)
- ✅ 클릭 가능한 전화번호 링크 (`tel:` 링크)
- ✅ 레이아웃 개선: 아이콘 + 텍스트 구조

**반응형 타이포그래피**
- 모바일: `text-3xl`, `text-lg`, `text-base`
- 태블릿: `text-4xl`, `text-xl`, `text-lg`
- 데스크톱: `text-5xl`, `text-2xl`, `text-xl`

#### 개선 전/후 비교

| 항목 | 개선 전 | 개선 후 |
|------|---------|---------|
| 메인 타이틀 모바일 | 한 줄 표시 (가독성 저하) | 행바꿈 적용 (가독성 향상) |
| 서브타이틀 모바일 | 한 줄 표시 | 행바꿈 적용 |
| 비거리 상담 폰트 | `text-sm` (14px) | `text-base md:text-lg` (16-18px) |
| 카드 호버 효과 | 기본 그림자 | 상승 애니메이션 + 강화된 그림자 |
| CTA 버튼 | 단색 배경 | 그라데이션 배경 + 호버 애니메이션 |

### 2. 브랜드 스토리 페이지 (`/about`)

#### 적용된 개선사항

**히어로 섹션**
- ✅ 모바일 최적화: 타이포그래피 조정, 행바꿈 개선
- ✅ 반응형 폰트: `text-3xl sm:text-4xl md:text-5xl lg:text-7xl`
- ✅ 모바일 행바꿈: "22년 전," / "하나의 꿈이" / "시작되었습니다"

**섹션 제목**
- ✅ 모바일 폰트 크기 조정: 36px → 24-28px
- ✅ 반응형 타이포그래피: `text-2xl sm:text-3xl md:text-4xl lg:text-5xl`
- ✅ 긴 제목 행바꿈: 모바일에서 적절한 행바꿈 적용

**구분선 디자인**
- ✅ 그라데이션 효과: `bg-gradient-to-r from-transparent via-red-600 to-transparent`
- ✅ 반응형 크기: 모바일 `h-0.5 w-16`, 데스크톱 `h-1 w-24`

**기술력 카드**
- ✅ 그라데이션 배경: `bg-gradient-to-br from-white to-gray-50`
- ✅ 아이콘 배경 그라데이션: `from-red-100 to-red-200` 등
- ✅ 호버 효과: `hover:-translate-y-2`, `hover:shadow-2xl`
- ✅ 그림자 강화: `shadow-lg` → `shadow-2xl` (호버 시)
- ✅ 테두리 추가: `border border-gray-100`

**섹션 간격**
- ✅ 모바일 최적화: `py-12 md:py-20` (모바일 48px → 데스크톱 80px)
- ✅ 섹션 내부 여백: `mb-12 md:mb-16`

**CTA 버튼**
- ✅ 그라데이션 배경: `bg-gradient-to-r from-red-600 to-red-700`
- ✅ 호버 애니메이션: 화살표 이동 효과
- ✅ 그림자 강화: `shadow-xl hover:shadow-2xl`

#### 개선 전/후 비교

| 항목 | 개선 전 | 개선 후 |
|------|---------|---------|
| 섹션 제목 모바일 | 36px (너무 큼) | 24-28px (적절) |
| 섹션 간격 모바일 | `py-20` (80px, 과도함) | `py-12` (48px, 적절) |
| 구분선 | 단색 선 | 그라데이션 효과 |
| 기술력 카드 | 기본 배경 | 그라데이션 배경 + 호버 효과 |
| CTA 버튼 | 단색 배경 | 그라데이션 배경 + 애니메이션 |

---

## 디자인 원칙

### 1. 모바일 퍼스트 (Mobile First)

모든 디자인은 모바일을 우선으로 설계하고, 점진적으로 데스크톱으로 확장합니다.

**원칙:**
- 모바일에서 최적의 가독성 보장
- 터치 친화적인 인터페이스 (최소 44x44px 터치 영역)
- 모바일에서 불필요한 요소 제거
- 핵심 메시지 우선 표시

**예시:**
```tsx
// ✅ 좋은 예: 모바일 퍼스트
<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl">
  제목
</h1>

// ❌ 나쁜 예: 데스크톱 퍼스트
<h1 className="text-7xl md:text-5xl sm:text-4xl text-3xl">
  제목
</h1>
```

### 2. 프리미엄 브랜드 경험

고급스럽고 신뢰감 있는 브랜드 경험을 제공합니다.

**원칙:**
- 그라데이션 효과로 깊이감 추가
- 적절한 여백과 간격
- 고품질 이미지 사용
- 일관된 디자인 언어

**예시:**
```tsx
// ✅ 좋은 예: 그라데이션 배경
<div className="bg-gradient-to-br from-white to-gray-50">
  {/* 내용 */}
</div>

// ✅ 좋은 예: 그라데이션 텍스트
<span className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 bg-clip-text text-transparent">
  시타서비스
</span>
```

### 3. 명확한 정보 계층 구조

사용자가 정보를 쉽게 이해할 수 있도록 명확한 계층 구조를 유지합니다.

**원칙:**
- 제목, 부제목, 본문의 명확한 구분
- 적절한 폰트 크기 차이 (최소 1.2배)
- 색상 대비 확보 (WCAG AA 기준)
- 시각적 그룹핑

### 4. 일관성 (Consistency)

모든 페이지에서 일관된 디자인 언어를 사용합니다.

**원칙:**
- 동일한 컴포넌트 스타일 재사용
- 일관된 색상 팔레트
- 통일된 간격 시스템
- 동일한 애니메이션 패턴

---

## 타이포그래피 가이드

### 폰트 크기 시스템

#### 메인 타이틀 (H1)

```tsx
// 히어로 섹션 메인 타이틀
<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.2] tracking-tight">
  제목
</h1>
```

**크기:**
- 모바일: `text-3xl` (30px)
- 태블릿: `text-4xl` (36px)
- 데스크톱: `text-5xl` (48px)
- 대형 화면: `text-6xl` (60px)

#### 섹션 제목 (H2)

```tsx
// 섹션 제목
<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
  섹션 제목
</h2>
```

**크기:**
- 모바일: `text-2xl` (24px)
- 태블릿: `text-3xl` (30px)
- 데스크톱: `text-4xl` (36px)
- 대형 화면: `text-5xl` (48px)

#### 카드 제목 (H3)

```tsx
// 카드 제목
<h3 className="text-xl md:text-2xl font-bold">
  카드 제목
</h3>
```

**크기:**
- 모바일: `text-xl` (20px)
- 데스크톱: `text-2xl` (24px)

#### 본문 텍스트

```tsx
// 본문
<p className="text-sm sm:text-base md:text-lg leading-relaxed">
  본문 텍스트
</p>
```

**크기:**
- 모바일: `text-sm` (14px)
- 태블릿: `text-base` (16px)
- 데스크톱: `text-lg` (18px)

### 행간 (Line Height)

- **제목**: `leading-tight` (1.25) 또는 `leading-[1.2]`
- **본문**: `leading-relaxed` (1.625)
- **긴 텍스트**: `leading-relaxed` 또는 커스텀 값

### 행바꿈 가이드

모바일에서 긴 텍스트는 적절히 행바꿈합니다.

```tsx
// ✅ 좋은 예: 모바일 행바꿈
<h1 className="text-3xl sm:text-4xl">
  마쓰구 드라이버<br />
  <span className="text-yellow-400">시타서비스</span>
</h1>

// ✅ 좋은 예: 조건부 행바꿈
<h2 className="text-2xl sm:text-3xl">
  22년간 함께한<br className="sm:hidden" />
  골퍼들의 이야기
</h2>
```

---

## 컴포넌트 가이드

### 1. 히어로 섹션

```tsx
<section className="relative min-h-[70vh] md:min-h-[85vh] flex items-center justify-center overflow-hidden bg-black py-12 md:py-20">
  <div className="absolute inset-0 z-0">
    {/* 배경 이미지 */}
    <Image
      src="/background.jpg"
      alt="배경"
      fill
      className="object-cover opacity-60"
      priority
    />
    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/80"></div>
  </div>
  
  <div className="relative z-10 container mx-auto px-4 text-center">
    {/* 배지 */}
    <div className="mb-4 md:mb-6">
      <span className="inline-block bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 text-black px-4 py-1.5 md:px-5 md:py-2 rounded-full text-xs md:text-sm font-bold shadow-lg">
        배지 텍스트
      </span>
    </div>
    
    {/* 메인 타이틀 */}
    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 text-white leading-[1.2] tracking-tight">
      메인 타이틀<br />
      <span className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 bg-clip-text text-transparent">
        강조 텍스트
      </span>
    </h1>
    
    {/* 서브타이틀 */}
    <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-8 md:mb-10 text-gray-200 max-w-xl mx-auto">
      서브타이틀 텍스트<br className="sm:hidden" />
      추가 설명
    </p>
    
    {/* CTA 버튼 */}
    <div className="flex justify-center">
      <Link
        href="/action"
        className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 md:px-12 md:py-5 rounded-xl font-bold text-base md:text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 w-full max-w-xs md:w-auto"
      >
        <span>액션 텍스트</span>
        <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
      </Link>
    </div>
  </div>
</section>
```

### 2. 섹션 제목 및 구분선

```tsx
<div className="text-center mb-12 md:mb-16">
  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight px-4">
    섹션 제목<br className="sm:hidden" />
    추가 제목
  </h2>
  <div className="w-16 md:w-24 h-0.5 md:h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent mx-auto mb-6 md:mb-8"></div>
  <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
    섹션 설명
  </p>
</div>
```

### 3. 카드 컴포넌트

```tsx
<div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
  {/* 아이콘 */}
  <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-md">
    <span className="text-2xl md:text-3xl">⚡</span>
  </div>
  
  {/* 제목 */}
  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">
    카드 제목
  </h3>
  
  {/* 본문 */}
  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
    카드 설명 텍스트
  </p>
</div>
```

### 4. 정보 섹션 (아이콘 + 텍스트)

```tsx
<div className="space-y-4 md:space-y-5 text-gray-700">
  <div className="flex items-start gap-3">
    <span className="text-xl mt-0.5">📍</span>
    <div>
      <strong className="text-gray-900 block mb-1">위치</strong>
      <span className="text-gray-700">주소 정보</span>
    </div>
  </div>
  
  <div className="flex items-start gap-3">
    <span className="text-xl mt-0.5">📞</span>
    <div>
      <strong className="text-gray-900 block mb-1">전화</strong>
      <a href="tel:031-215-0013" className="text-blue-600 hover:text-blue-700 font-medium">
        031-215-0013
      </a>
    </div>
  </div>
</div>
```

---

## 반응형 디자인 가이드

### 브레이크포인트

Tailwind CSS 기본 브레이크포인트 사용:

- `sm`: 640px 이상
- `md`: 768px 이상
- `lg`: 1024px 이상
- `xl`: 1280px 이상
- `2xl`: 1536px 이상

### 섹션 간격

```tsx
// 표준 섹션 간격
<section className="py-12 md:py-20">
  {/* 내용 */}
</section>
```

- 모바일: `py-12` (48px)
- 데스크톱: `py-20` (80px)

### 컨테이너 패딩

```tsx
// 컨테이너 패딩
<div className="container mx-auto px-4">
  {/* 내용 */}
</div>
```

- 기본: `px-4` (16px)
- 필요시: `px-6` (24px)

### 그리드 레이아웃

```tsx
// 반응형 그리드
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
  {/* 카드들 */}
</div>
```

- 모바일: 1열
- 태블릿: 2열 (`md:grid-cols-2`)
- 데스크톱: 3열 (`lg:grid-cols-3`)

---

## 애니메이션 및 인터랙션

### 호버 효과

#### 카드 호버

```tsx
<div className="transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl">
  {/* 카드 내용 */}
</div>
```

**효과:**
- 상승 애니메이션: `hover:-translate-y-2` (8px 상승)
- 그림자 강화: `hover:shadow-2xl`
- 부드러운 전환: `transition-all duration-300`

#### 버튼 호버

```tsx
<Link
  href="/action"
  className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
>
  <span>텍스트</span>
  <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
</Link>
```

**효과:**
- 그라데이션 변화: `hover:from-blue-700 hover:to-blue-800`
- 확대 효과: `hover:scale-105` (5% 확대)
- 화살표 이동: `group-hover:translate-x-1`

### 이미지 호버

```tsx
<div className="relative h-48 overflow-hidden">
  <Image
    src="/image.jpg"
    alt="이미지"
    fill
    className="object-cover transition-transform duration-500 hover:scale-110"
  />
  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
</div>
```

**효과:**
- 이미지 확대: `hover:scale-110` (10% 확대)
- 부드러운 전환: `transition-transform duration-500`
- 오버레이 그라데이션: 텍스트 가독성 향상

---

## 색상 및 브랜딩

### 주요 색상

#### 브랜드 컬러

- **빨강**: `red-600` (#dc2626) - CTA 버튼, 강조
- **노랑**: `yellow-400` (#facc15) - 배지, 강조 텍스트
- **파랑**: `blue-600` (#2563eb) - 링크, CTA 버튼
- **회색**: `gray-900` (#111827) - 텍스트, 배경

#### 그라데이션

```tsx
// 빨강 그라데이션 (CTA 버튼)
bg-gradient-to-r from-red-600 to-red-700

// 노랑 그라데이션 (배지, 강조 텍스트)
bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400

// 파랑 그라데이션 (CTA 버튼)
bg-gradient-to-r from-blue-600 to-blue-700

// 배경 그라데이션 (카드)
bg-gradient-to-br from-white to-gray-50
```

### 텍스트 색상

- **제목**: `text-gray-900` (진한 회색)
- **본문**: `text-gray-600` (중간 회색)
- **부제목**: `text-gray-200` (밝은 회색, 다크 배경)
- **링크**: `text-blue-600 hover:text-blue-700`

---

## 접근성 가이드

### WCAG AA 기준 준수

#### 색상 대비

- 제목: 최소 4.5:1 대비
- 본문: 최소 4.5:1 대비
- 링크: 최소 3:1 대비 (비텍스트 요소)

#### 키보드 접근성

- 모든 인터랙티브 요소는 키보드로 접근 가능
- 포커스 표시 명확히 (`focus:ring-2 focus:ring-blue-500`)

#### 스크린 리더

- 의미 있는 alt 텍스트 제공
- 적절한 HTML 시맨틱 태그 사용 (`<h1>`, `<h2>`, `<nav>` 등)
- ARIA 레이블 사용 (필요시)

### 예시

```tsx
// ✅ 좋은 예: 접근성 고려
<Link
  href="/action"
  className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
  aria-label="무료 시타 예약하기"
>
  무료 시타 예약하기
</Link>

// ✅ 좋은 예: 의미 있는 alt 텍스트
<Image
  src="/image.jpg"
  alt="KGFA 1급 전문 피터가 시타 상담을 진행하는 장면"
  fill
/>
```

---

## 체크리스트

새 페이지를 만들거나 기존 페이지를 개선할 때 다음 사항을 확인하세요:

### 모바일 최적화
- [ ] 모바일에서 타이포그래피 가독성 확인
- [ ] 긴 텍스트 행바꿈 적용
- [ ] 터치 영역 최소 44x44px
- [ ] 모바일 섹션 간격 적절 (`py-12 md:py-20`)

### 디자인 일관성
- [ ] 섹션 제목 스타일 통일
- [ ] 구분선 스타일 통일
- [ ] 카드 디자인 통일
- [ ] CTA 버튼 스타일 통일

### 반응형 디자인
- [ ] 모든 브레이크포인트에서 레이아웃 확인
- [ ] 이미지 반응형 처리
- [ ] 그리드 레이아웃 적절히 조정

### 애니메이션
- [ ] 호버 효과 적용
- [ ] 전환 시간 적절 (`duration-300`)
- [ ] 성능 최적화 (GPU 가속 사용)

### 접근성
- [ ] 색상 대비 확인
- [ ] 키보드 접근성 확인
- [ ] 스크린 리더 테스트

---

## 참고 자료

- [Tailwind CSS 공식 문서](https://tailwindcss.com/docs)
- [WCAG 접근성 가이드라인](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web.dev 성능 가이드](https://web.dev/performance/)

---

**최종 업데이트**: 2025-01-14  
**작성자**: AI Assistant  
**버전**: 1.0

