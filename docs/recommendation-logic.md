# 마쓰구(MASGOLF) 추천 로직

## 🎯 통합 추천 로직 (JavaScript)

```javascript
function getRecommendedClub(quizData) {
  const { 
    ageGroup, 
    priority, 
    swingStyle, 
    teeHeightPreference, 
    ballFlightPreference,
    controlNeed,
    ballSpeed,
    budget 
  } = quizData;

  // 1단계: 예산 기반 필터링
  let availableClubs = [];
  
  if (budget >= 1700000) {
    availableClubs = ['시크리트포스 골드 2', '시크리트웨폰 4.1', '시크리트웨폰 블랙'];
  } else if (budget >= 1150000) {
    availableClubs = ['시크리트포스 PRO3'];
  } else if (budget >= 950000) {
    availableClubs = ['시크리트포스 V3'];
  } else {
    availableClubs = ['시크리트포스 V3']; // 기본 추천
  }

  // 2단계: 연령대 + 선호도 기반 추천
  if (ageGroup === '70대' || ageGroup === '80대+') {
    if (priority === '편안함' || swingStyle === '안정형') {
      return availableClubs.includes('시크리트포스 V3') ? '시크리트포스 V3' : '시크리트포스 골드 2';
    } else if (priority === '방향성') {
      return availableClubs.includes('시크리트웨폰 4.1') ? '시크리트웨폰 4.1' : '시크리트포스 V3';
    } else {
      return availableClubs.includes('시크리트포스 골드 2') ? '시크리트포스 골드 2' : '시크리트포스 V3';
    }
  } else if (ageGroup === '60대') {
    if (priority === '편안함') {
      return availableClubs.includes('시크리트포스 V3') ? '시크리트포스 V3' : '시크리트포스 PRO3';
    } else if (priority === '방향성') {
      return availableClubs.includes('시크리트웨폰 4.1') ? '시크리트웨폰 4.1' : '시크리트포스 V3';
    } else {
      return availableClubs.includes('시크리트포스 골드 2') ? '시크리트포스 골드 2' : '시크리트포스 V3';
    }
  } else if (ageGroup === '50대') {
    if (priority === '방향성' || swingStyle === '안정형') {
      return availableClubs.includes('시크리트웨폰 블랙') ? '시크리트웨폰 블랙' : '시크리트포스 PRO3';
    } else if (priority === '비거리') {
      return availableClubs.includes('시크리트포스 PRO3') ? '시크리트포스 PRO3' : '시크리트포스 V3';
    } else {
      return availableClubs.includes('시크리트포스 V3') ? '시크리트포스 V3' : '시크리트포스 PRO3';
    }
  } else if (ageGroup === '40대') {
    if (priority === '비거리') {
      return availableClubs.includes('시크리트포스 PRO3') ? '시크리트포스 PRO3' : '시크리트포스 V3';
    } else if (priority === '방향성') {
      return availableClubs.includes('시크리트웨폰 블랙') ? '시크리트웨폰 블랙' : '시크리트포스 V3';
    } else {
      return availableClubs.includes('시크리트포스 V3') ? '시크리트포스 V3' : '시크리트포스 PRO3';
    }
  }

  // 3단계: 페이스 타입 기반 추천
  if (teeHeightPreference === '40mm' || ballFlightPreference === '고탄도') {
    // 시크리트웨폰 시리즈 (샬로우 페이스)
    if (priority === '방향성' || swingStyle === '안정형') {
      return availableClubs.includes('시크리트웨폰 블랙') ? '시크리트웨폰 블랙' : '시크리트포스 V3';
    } else {
      return availableClubs.includes('시크리트웨폰 4.1') ? '시크리트웨폰 4.1' : '시크리트포스 V3';
    }
  } else if (teeHeightPreference === '50mm' || ballFlightPreference === '저탄도') {
    // 시크리트포스 시리즈 (딥 페이스)
    if (controlNeed === '구질컨트롤' || controlNeed === '스핀량컨트롤') {
      return availableClubs.includes('시크리트포스 PRO3') ? '시크리트포스 PRO3' : '시크리트포스 V3';
    } else if (ageGroup === '70대' || ageGroup === '80대+') {
      return availableClubs.includes('시크리트포스 V3') ? '시크리트포스 V3' : '시크리트포스 PRO3';
    } else {
      return availableClubs.includes('시크리트포스 PRO3') ? '시크리트포스 PRO3' : '시크리트포스 V3';
    }
  }

  // 4단계: 볼스피드 기반 추천
  if (ballSpeed < 50) {
    return availableClubs.includes('시크리트포스 V3') ? '시크리트포스 V3' : '시크리트포스 PRO3';
  } else if (ballSpeed BETWEEN 50 AND 54) {
    return availableClubs.includes('시크리트포스 PRO3') ? '시크리트포스 PRO3' : '시크리트포스 V3';
  } else if (ballSpeed > 54) {
    return availableClubs.includes('시크리트웨폰 블랙') ? '시크리트웨폰 블랙' : '시크리트포스 PRO3';
  }

  // 5단계: 기본 추천
  return availableClubs.includes('시크리트포스 V3') ? '시크리트포스 V3' : '시크리트포스 PRO3';
}
```

## 🎯 플렉스 추천 로직

```javascript
function getRecommendedFlex(quizData, recommendedClub) {
  const { ballSpeed, ageGroup } = quizData;
  
  // 제품별 플렉스 범위
  const clubFlexRanges = {
    '시크리트포스 V3': ['R1', 'R2', 'R', 'SR', 'S'],
    '시크리트포스 PRO3': ['R2', 'R1', 'R', 'SR', 'S'],
    '시크리트포스 골드 2': ['R2', 'R1', 'R', 'SR'],
    '시크리트웨폰 블랙': ['R2', 'R1', 'R', 'SR', 'S'],
    '시크리트웨폰 4.1': ['R2', 'R1', 'R', 'SR']
  };
  
  const availableFlexes = clubFlexRanges[recommendedClub] || ['R2', 'R1', 'R', 'SR', 'S'];
  
  if (ageGroup === '70대' || ageGroup === '80대+') {
    return availableFlexes.includes('R2') ? 'R2' : availableFlexes[0];
  } else if (ballSpeed < 50) {
    return availableFlexes.includes('R2') ? 'R2' : availableFlexes[0];
  } else if (ballSpeed BETWEEN 50 AND 54) {
    return availableFlexes.includes('R1') ? 'R1' : availableFlexes[0];
  } else if (ballSpeed > 54) {
    return availableFlexes.includes('S') ? 'S' : availableFlexes[availableFlexes.length - 1];
  }
  
  return availableFlexes[0]; // 기본값
}
```

## 📊 추천 우선순위

### 1단계: 예산 필터링
- 170만원 이상: 모든 제품
- 115만원 이상: 시크리트포스 PRO3
- 95만원 이상: 시크리트포스 V3

### 2단계: 연령대 + 선호도
- 70대+: 편안함 → V3, 방향성 → 4.1
- 60대: 편안함 → V3, 방향성 → 4.1
- 50대: 방향성 → 블랙, 비거리 → PRO3
- 40대: 비거리 → PRO3, 방향성 → 블랙

### 3단계: 페이스 타입
- 낮은 티 높이/고탄도: 시크리트웨폰 시리즈
- 높은 티 높이/저탄도: 시크리트포스 시리즈

### 4단계: 볼스피드
- 50m/s 미만: V3
- 50-54m/s: PRO3
- 54m/s 초과: 블랙

## 🔗 관련 링크
- [데이터베이스 스키마](./database-schema.md)
- [제품별 특징](./product-features.md)
- [퀴즈 질문](./quiz-questions.md)
- [플렉스 매핑](./flex-mapping.md) 