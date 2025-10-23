# 퍼널 페이지 구현 계획

## 🎯 퍼널 1: 시크릿포스 GOLD 2 + MUZIIK 사파이어

### 📋 페이지 구조
```
/funnel/gold2-sapphire
```

### 🎨 디자인 요소
- **색상**: 골드 + 블루 그라데이션
- **이미지**: 시니어 골퍼의 만족스러운 표정
- **레이아웃**: MAS9GOLF 스타일 적용

### 📝 콘텐츠 구성

#### 1. 헤드라인 섹션
```html
<h1>드라이버 + 샤프트만 바꿨는데 캐리 250m 넘김</h1>
<h2>+35m 비거리, 진짜 고수들은 콤보부터 바꿨다</h2>
<p>지금 무료 시타 신청하고 티샷부터 손맛 터지는 GOLD 2 + 사파이어 콤보 직접 쳐봐</p>
```

#### 2. 문제 인식 섹션
```html
<h3>나이 때문에 포기했던 비거리</h3>
<ul>
  <li>동반자들과의 비거리 차이로 자존심 상처</li>
  <li>스윙 스피드 저하로 인한 포기</li>
  <li>젊은 시절의 비거리를 그리워하는 마음</li>
</ul>
```

#### 3. 해결책 제시 섹션
```html
<h3>GOLD 2 + 사파이어 콤보의 혁신</h3>
<ul>
  <li>2.2mm 초박형 페이스 + 티타늄 파이버 샤프트</li>
  <li>R&A 비공인 0.87 반발계수 + 오토플렉스 기술</li>
  <li>시니어 최적화 설계 + 일본 장인정신</li>
</ul>
```

#### 4. 사회적 증명 섹션
```html
<div class="testimonial">
  <h4>실제 시니어 골퍼 후기</h4>
  <blockquote>
    "김성호 대표 (62세): +35m 비거리 증가<br>
    나이 들면서 비거리가 계속 줄어 고민이었는데, 이제 젊은 후배들과 비거리 차이가 거의 안 납니다."
  </blockquote>
</div>
```

#### 5. 긴급성 섹션
```html
<h3>한정 수량 + 시즌 마감</h3>
<ul>
  <li>월 10개 한정 제작</li>
  <li>시즌 마감 전 마지막 기회</li>
  <li>전문 피팅사 직접 상담</li>
</ul>
```

#### 6. CTA 섹션
```html
<div class="cta-section">
  <h3>무료 시타 예약 + 전화 상담</h3>
  <a href="tel:080-028-8888" class="cta-button">080-028-8888 (무료)</a>
  <p>KGFA 1급 전문 피터가 직접 상담</p>
  <p>첫 시타부터 체감하는 성능</p>
</div>
```

---

## 🎯 퍼널 2: 시크릿웨폰 블랙 + MUZIIK 베릴

### 📋 페이지 구조
```
/funnel/weapon-beryl
```

### 🎨 디자인 요소
- **색상**: 블랙 + 에메랄드 그린
- **이미지**: 프리미엄 장비의 비주얼
- **레이아웃**: 럭셔리 스타일

### 📝 콘텐츠 구성

#### 1. 헤드라인 섹션
```html
<h1>장비병 환자를 위한 궁극의 콤보</h1>
<h2>블랙 PVD 코팅 + 에메랄드 그린 샤프트</h2>
<p>프리미엄 비주얼 + 최고 성능의 만남</p>
```

#### 2. 문제 인식 섹션
```html
<h3>장비에 대한 끝없는 갈증</h3>
<ul>
  <li>새로운 장비를 사도 만족하지 못함</li>
  <li>성능과 비주얼 모두를 원하는 욕구</li>
  <li>다른 브랜드와의 차별화를 원함</li>
</ul>
```

#### 3. 해결책 제시 섹션
```html
<h3>웨폰 블랙 + 베릴 콤보의 차별화</h3>
<ul>
  <li>SP700 Grade 5 티타늄 + 오토플렉스 설계</li>
  <li>블랙 PVD 코팅 + 에메랄드 그린 샤프트</li>
  <li>일본 최고급 기술의 완벽한 조합</li>
</ul>
```

#### 4. 차별화 섹션
```html
<h3>다른 브랜드와의 비교</h3>
<table>
  <tr>
    <th>구분</th>
    <th>일반 드라이버</th>
    <th>MASGOLF + MUZIIK</th>
  </tr>
  <tr>
    <td>페이스 두께</td>
    <td>3.3mm</td>
    <td>2.2mm</td>
  </tr>
  <tr>
    <td>반발계수</td>
    <td>0.83</td>
    <td>0.87</td>
  </tr>
</table>
```

#### 5. 한정성 섹션
```html
<h3>리미티드 에디션</h3>
<ul>
  <li>월 5개 한정 제작</li>
  <li>블랙 + 베릴 조합은 이번이 마지막</li>
  <li>장비 전문가 직접 상담</li>
</ul>
```

#### 6. CTA 섹션
```html
<div class="cta-section">
  <h3>전화 상담 + 시타 예약</h3>
  <a href="tel:080-028-8888" class="cta-button">080-028-8888 (무료)</a>
  <p>장비 전문가 직접 상담</p>
  <p>프리미엄 장비의 진정한 가치 체험</p>
</div>
```

---

## 🔧 기술적 구현

### 파일 구조
```
pages/
├── funnel/
│   ├── gold2-sapphire.tsx
│   └── weapon-beryl.tsx
└── components/
    ├── funnel/
    │   ├── HeroSection.tsx
    │   ├── ProblemSection.tsx
    │   ├── SolutionSection.tsx
    │   ├── SocialProofSection.tsx
    │   ├── UrgencySection.tsx
    │   └── CTASection.tsx
    └── common/
        ├── Navigation.tsx
        └── Footer.tsx
```

### 스타일링
```css
/* 퍼널 1 스타일 */
.funnel-gold2 {
  background: linear-gradient(135deg, #FFD700, #4169E1);
  color: #000;
}

/* 퍼널 2 스타일 */
.funnel-weapon {
  background: linear-gradient(135deg, #000, #00C851);
  color: #fff;
}

/* 공통 CTA 버튼 */
.cta-button {
  display: inline-block;
  padding: 15px 30px;
  background: #FF6B35;
  color: white;
  text-decoration: none;
  border-radius: 5px;
  font-size: 18px;
  font-weight: bold;
  transition: background 0.3s;
}

.cta-button:hover {
  background: #E55A2B;
}
```

### A/B 테스트 설정
```javascript
// 헤드라인 A/B 테스트
const headlines = {
  A: "드라이버 + 샤프트만 바꿨는데 캐리 250m 넘김",
  B: "GOLD 2 + 사파이어 콤보로 비거리 35m 증가"
};

// CTA 버튼 A/B 테스트
const ctaButtons = {
  A: "080-028-8888 (무료)",
  B: "무료 시타 예약하기"
};
```

---

## 📊 성과 측정

### Google Analytics 설정
```javascript
// 전화 클릭 추적
gtag('event', 'phone_click', {
  funnel_type: 'gold2_sapphire',
  user_type: 'senior',
  value: 2200000
});

// 시타 예약 추적
gtag('event', 'fitting_booking', {
  funnel_type: 'gold2_sapphire',
  user_type: 'senior'
});
```

### 핵심 지표
- **페이지 체류 시간**: 2분 이상
- **스크롤 깊이**: 80% 이상
- **전화 클릭률**: 5% 이상
- **시타 예약률**: 3% 이상
- **구매 전환율**: 1% 이상

---

## 🎯 최종 구현 순서

### 1단계: 기본 페이지 생성
- 퍼널 1, 2 기본 구조 생성
- 헤드라인 및 기본 콘텐츠 작성

### 2단계: 디자인 적용
- MAS9GOLF 스타일 적용
- 반응형 디자인 구현

### 3단계: A/B 테스트 설정
- 헤드라인 변형 생성
- CTA 버튼 변형 생성

### 4단계: 분석 도구 연동
- Google Analytics 설정
- 전화 클릭 추적 구현

### 5단계: 최적화
- 성과 데이터 분석
- 지속적인 개선

## 🎯 퍼널 1: 시크릿포스 GOLD 2 + MUZIIK 사파이어

### 📋 페이지 구조
```
/funnel/gold2-sapphire
```

### 🎨 디자인 요소
- **색상**: 골드 + 블루 그라데이션
- **이미지**: 시니어 골퍼의 만족스러운 표정
- **레이아웃**: MAS9GOLF 스타일 적용

### 📝 콘텐츠 구성

#### 1. 헤드라인 섹션
```html
<h1>드라이버 + 샤프트만 바꿨는데 캐리 250m 넘김</h1>
<h2>+35m 비거리, 진짜 고수들은 콤보부터 바꿨다</h2>
<p>지금 무료 시타 신청하고 티샷부터 손맛 터지는 GOLD 2 + 사파이어 콤보 직접 쳐봐</p>
```

#### 2. 문제 인식 섹션
```html
<h3>나이 때문에 포기했던 비거리</h3>
<ul>
  <li>동반자들과의 비거리 차이로 자존심 상처</li>
  <li>스윙 스피드 저하로 인한 포기</li>
  <li>젊은 시절의 비거리를 그리워하는 마음</li>
</ul>
```

#### 3. 해결책 제시 섹션
```html
<h3>GOLD 2 + 사파이어 콤보의 혁신</h3>
<ul>
  <li>2.2mm 초박형 페이스 + 티타늄 파이버 샤프트</li>
  <li>R&A 비공인 0.87 반발계수 + 오토플렉스 기술</li>
  <li>시니어 최적화 설계 + 일본 장인정신</li>
</ul>
```

#### 4. 사회적 증명 섹션
```html
<div class="testimonial">
  <h4>실제 시니어 골퍼 후기</h4>
  <blockquote>
    "김성호 대표 (62세): +35m 비거리 증가<br>
    나이 들면서 비거리가 계속 줄어 고민이었는데, 이제 젊은 후배들과 비거리 차이가 거의 안 납니다."
  </blockquote>
</div>
```

#### 5. 긴급성 섹션
```html
<h3>한정 수량 + 시즌 마감</h3>
<ul>
  <li>월 10개 한정 제작</li>
  <li>시즌 마감 전 마지막 기회</li>
  <li>전문 피팅사 직접 상담</li>
</ul>
```

#### 6. CTA 섹션
```html
<div class="cta-section">
  <h3>무료 시타 예약 + 전화 상담</h3>
  <a href="tel:080-028-8888" class="cta-button">080-028-8888 (무료)</a>
  <p>KGFA 1급 전문 피터가 직접 상담</p>
  <p>첫 시타부터 체감하는 성능</p>
</div>
```

---

## 🎯 퍼널 2: 시크릿웨폰 블랙 + MUZIIK 베릴

### 📋 페이지 구조
```
/funnel/weapon-beryl
```

### 🎨 디자인 요소
- **색상**: 블랙 + 에메랄드 그린
- **이미지**: 프리미엄 장비의 비주얼
- **레이아웃**: 럭셔리 스타일

### 📝 콘텐츠 구성

#### 1. 헤드라인 섹션
```html
<h1>장비병 환자를 위한 궁극의 콤보</h1>
<h2>블랙 PVD 코팅 + 에메랄드 그린 샤프트</h2>
<p>프리미엄 비주얼 + 최고 성능의 만남</p>
```

#### 2. 문제 인식 섹션
```html
<h3>장비에 대한 끝없는 갈증</h3>
<ul>
  <li>새로운 장비를 사도 만족하지 못함</li>
  <li>성능과 비주얼 모두를 원하는 욕구</li>
  <li>다른 브랜드와의 차별화를 원함</li>
</ul>
```

#### 3. 해결책 제시 섹션
```html
<h3>웨폰 블랙 + 베릴 콤보의 차별화</h3>
<ul>
  <li>SP700 Grade 5 티타늄 + 오토플렉스 설계</li>
  <li>블랙 PVD 코팅 + 에메랄드 그린 샤프트</li>
  <li>일본 최고급 기술의 완벽한 조합</li>
</ul>
```

#### 4. 차별화 섹션
```html
<h3>다른 브랜드와의 비교</h3>
<table>
  <tr>
    <th>구분</th>
    <th>일반 드라이버</th>
    <th>MASGOLF + MUZIIK</th>
  </tr>
  <tr>
    <td>페이스 두께</td>
    <td>3.3mm</td>
    <td>2.2mm</td>
  </tr>
  <tr>
    <td>반발계수</td>
    <td>0.83</td>
    <td>0.87</td>
  </tr>
</table>
```

#### 5. 한정성 섹션
```html
<h3>리미티드 에디션</h3>
<ul>
  <li>월 5개 한정 제작</li>
  <li>블랙 + 베릴 조합은 이번이 마지막</li>
  <li>장비 전문가 직접 상담</li>
</ul>
```

#### 6. CTA 섹션
```html
<div class="cta-section">
  <h3>전화 상담 + 시타 예약</h3>
  <a href="tel:080-028-8888" class="cta-button">080-028-8888 (무료)</a>
  <p>장비 전문가 직접 상담</p>
  <p>프리미엄 장비의 진정한 가치 체험</p>
</div>
```

---

## 🔧 기술적 구현

### 파일 구조
```
pages/
├── funnel/
│   ├── gold2-sapphire.tsx
│   └── weapon-beryl.tsx
└── components/
    ├── funnel/
    │   ├── HeroSection.tsx
    │   ├── ProblemSection.tsx
    │   ├── SolutionSection.tsx
    │   ├── SocialProofSection.tsx
    │   ├── UrgencySection.tsx
    │   └── CTASection.tsx
    └── common/
        ├── Navigation.tsx
        └── Footer.tsx
```

### 스타일링
```css
/* 퍼널 1 스타일 */
.funnel-gold2 {
  background: linear-gradient(135deg, #FFD700, #4169E1);
  color: #000;
}

/* 퍼널 2 스타일 */
.funnel-weapon {
  background: linear-gradient(135deg, #000, #00C851);
  color: #fff;
}

/* 공통 CTA 버튼 */
.cta-button {
  display: inline-block;
  padding: 15px 30px;
  background: #FF6B35;
  color: white;
  text-decoration: none;
  border-radius: 5px;
  font-size: 18px;
  font-weight: bold;
  transition: background 0.3s;
}

.cta-button:hover {
  background: #E55A2B;
}
```

### A/B 테스트 설정
```javascript
// 헤드라인 A/B 테스트
const headlines = {
  A: "드라이버 + 샤프트만 바꿨는데 캐리 250m 넘김",
  B: "GOLD 2 + 사파이어 콤보로 비거리 35m 증가"
};

// CTA 버튼 A/B 테스트
const ctaButtons = {
  A: "080-028-8888 (무료)",
  B: "무료 시타 예약하기"
};
```

---

## 📊 성과 측정

### Google Analytics 설정
```javascript
// 전화 클릭 추적
gtag('event', 'phone_click', {
  funnel_type: 'gold2_sapphire',
  user_type: 'senior',
  value: 2200000
});

// 시타 예약 추적
gtag('event', 'fitting_booking', {
  funnel_type: 'gold2_sapphire',
  user_type: 'senior'
});
```

### 핵심 지표
- **페이지 체류 시간**: 2분 이상
- **스크롤 깊이**: 80% 이상
- **전화 클릭률**: 5% 이상
- **시타 예약률**: 3% 이상
- **구매 전환율**: 1% 이상

---

## 🎯 최종 구현 순서

### 1단계: 기본 페이지 생성
- 퍼널 1, 2 기본 구조 생성
- 헤드라인 및 기본 콘텐츠 작성

### 2단계: 디자인 적용
- MAS9GOLF 스타일 적용
- 반응형 디자인 구현

### 3단계: A/B 테스트 설정
- 헤드라인 변형 생성
- CTA 버튼 변형 생성

### 4단계: 분석 도구 연동
- Google Analytics 설정
- 전화 클릭 추적 구현

### 5단계: 최적화
- 성과 데이터 분석
- 지속적인 개선
