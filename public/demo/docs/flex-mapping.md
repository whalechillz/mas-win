# 마쓰구(MASGOLF) 플렉스 매핑

## 📊 제품별 플렉스 범위

### 시크리트포스 시리즈 (딥 페이스)
```sql
-- 시크리트포스 V3
-- 플렉스: R1, R2, R, SR, S
-- 가격: 950,000원
-- 타겟: 40대~70대

-- 시크리트포스 PRO3
-- 플렉스: R2, R1, R, SR, S
-- 가격: 1,150,000원
-- 타겟: 50대후반~60대후반

-- 시크리트포스 골드 2
-- 플렉스: R2, R1, R, SR
-- 가격: 1,700,000원
-- 타겟: 60대후반~70대
```

### 시크리트웨폰 시리즈 (샬로우 페이스)
```sql
-- 시크리트웨폰 블랙
-- 플렉스: R2, R1, R, SR, S
-- 가격: 1,700,000원
-- 타겟: 50대후반~60대후반

-- 시크리트웨폰 4.1
-- 플렉스: R2, R1, R, SR
-- 가격: 1,700,000원
-- 타겟: 60대후반~70대
```

## 🎯 비거리별 플렉스 추천 로직

### 비거리별 플렉스 매핑
```javascript
function getFlexByDistance(currentDistance) {
  if (currentDistance < 150) {
    return 'R3'; // 매우 부드러운 플렉스
  } else if (currentDistance BETWEEN 150 AND 160) {
    return 'R3'; // 매우 부드러운 플렉스
  } else if (currentDistance BETWEEN 160 AND 170) {
    return 'R2'; // 부드러운 플렉스
  } else if (currentDistance BETWEEN 170 AND 180) {
    return 'R1'; // 중간 플렉스
  } else if (currentDistance BETWEEN 180 AND 190) {
    return 'R';  // 표준 플렉스
  } else if (currentDistance BETWEEN 190 AND 200) {
    return 'SR'; // 약간 딱딱한 플렉스
  } else if (currentDistance BETWEEN 200 AND 210) {
    return 'S';  // 딱딱한 플렉스
  } else if (currentDistance >= 210) {
    return 'S';  // 매우 딱딱한 플렉스
  }
  return 'R2'; // 기본값
}
```

### 비거리별 플렉스 테이블
| 현재 비거리 | 추천 플렉스 | 특징 |
|-------------|-------------|------|
| 150m 미만 | R3 | 매우 부드러운 플렉스 |
| 150-160m | R3 | 매우 부드러운 플렉스 |
| 160-170m | R2 | 부드러운 플렉스 |
| 170-180m | R1 | 중간 플렉스 |
| 180-190m | R | 표준 플렉스 |
| 190-200m | SR | 약간 딱딱한 플렉스 |
| 200-210m | S | 딱딱한 플렉스 |
| 210m 이상 | S | 매우 딱딱한 플렉스 |

## 🎯 플렉스 추천 로직

### 연령대별 플렉스 추천
```javascript
function getFlexByAge(ageGroup) {
  switch(ageGroup) {
    case '70대':
    case '80대+':
      return 'R2'; // 가장 부드러운 플렉스
    case '60대':
      return 'R2'; // 부드러운 플렉스
    case '50대':
      return 'R1'; // 중간 플렉스
    case '40대':
      return 'R1'; // 중간 플렉스
    default:
      return 'R2';
  }
}
```

### 볼스피드별 플렉스 추천
```javascript
function getFlexByBallSpeed(ballSpeed) {
  if (ballSpeed < 50) {
    return 'R2'; // 저속 - 부드러운 플렉스
  } else if (ballSpeed BETWEEN 50 AND 54) {
    return 'R1'; // 중속 - 중간 플렉스
  } else if (ballSpeed > 54) {
    return 'S';  // 고속 - 딱딱한 플렉스
  }
  return 'R2';
}
```

### 통합 플렉스 추천 로직
```javascript
function getRecommendedFlex(quizData, recommendedClub) {
  const { ballSpeed, ageGroup, currentDistance } = quizData;
  
  // 제품별 플렉스 범위
  const clubFlexRanges = {
    '시크리트포스 V3': ['R1', 'R2', 'R', 'SR', 'S'],
    '시크리트포스 PRO3': ['R2', 'R1', 'R', 'SR', 'S'],
    '시크리트포스 골드 2': ['R2', 'R1', 'R', 'SR'],
    '시크리트웨폰 블랙': ['R2', 'R1', 'R', 'SR', 'S'],
    '시크리트웨폰 4.1': ['R2', 'R1', 'R', 'SR']
  };
  
  const availableFlexes = clubFlexRanges[recommendedClub] || ['R2', 'R1', 'R', 'SR', 'S'];
  
  // 1단계: 비거리별 추천
  const distanceFlex = getFlexByDistance(currentDistance);
  
  // 2단계: 연령대별 조정
  const ageFlex = getFlexByAge(ageGroup);
  
  // 3단계: 볼스피드별 조정
  const speedFlex = getFlexByBallSpeed(ballSpeed);
  
  // 4단계: 사용 가능한 플렉스 중에서 선택
  const recommendedFlex = getBestAvailableFlex([distanceFlex, ageFlex, speedFlex], availableFlexes);
  
  return recommendedFlex;
}

function getBestAvailableFlex(preferredFlexes, availableFlexes) {
  // 선호 플렉스 중에서 사용 가능한 것 찾기
  for (const flex of preferredFlexes) {
    if (availableFlexes.includes(flex)) {
      return flex;
    }
  }
  
  // 없으면 기본값
  return availableFlexes[0];
}
```

### 제품별 사용 가능한 플렉스
```javascript
const clubFlexRanges = {
  '시크리트포스 V3': ['R1', 'R2', 'R', 'SR', 'S'],
  '시크리트포스 PRO3': ['R2', 'R1', 'R', 'SR', 'S'],
  '시크리트포스 골드 2': ['R2', 'R1', 'R', 'SR'],
  '시크리트웨폰 블랙': ['R2', 'R1', 'R', 'SR', 'S'],
  '시크리트웨폰 4.1': ['R2', 'R1', 'R', 'SR']
};
```

## 📋 플렉스별 특징

### R3 (레귤러 3) - 새로운 추가
- **특징**: 가장 부드러운 플렉스
- **적합한 비거리**: 160m 미만
- **적합한 연령대**: 70대, 80대+
- **효과**: 매우 편안한 스윙, 부드러운 타구감

### R2 (레귤러 2)
- **특징**: 부드러운 플렉스
- **적합한 비거리**: 160-170m
- **적합한 연령대**: 60대, 70대
- **효과**: 편안한 스윙, 부드러운 타구감

### R1 (레귤러 1)
- **특징**: 중간 플렉스
- **적합한 비거리**: 170-180m
- **적합한 연령대**: 50대, 60대
- **효과**: 편안하면서도 적절한 반발력

### R (레귤러)
- **특징**: 표준 플렉스
- **적합한 비거리**: 180-190m
- **적합한 연령대**: 50대
- **효과**: 균형잡힌 성능

### SR (스티프 레귤러)
- **특징**: 약간 딱딱한 플렉스
- **적합한 비거리**: 190-200m
- **적합한 연령대**: 40대
- **효과**: 정확한 방향성

### S (스티프)
- **특징**: 가장 딱딱한 플렉스
- **적합한 비거리**: 200m 이상
- **적합한 연령대**: 40대
- **효과**: 최대 비거리, 정확한 방향성

## 🔄 플렉스 변경 추천

### 업그레이드 필요 (현재 플렉스가 너무 부드러운 경우)
```javascript
// 비거리가 높은데 R2 사용 중
if (currentDistance > 180 && currentFlex === 'R2') {
  return 'R1 또는 R로 업그레이드 필요';
}
```

### 다운그레이드 필요 (현재 플렉스가 너무 딱딱한 경우)
```javascript
// 비거리가 낮은데 S 사용 중
if (currentDistance < 170 && currentFlex === 'S') {
  return 'R2로 다운그레이드 필요';
}
```

## 📊 플렉스 매핑 테이블

| 제품 | R3 | R2 | R1 | R | SR | S | 가격 |
|------|----|----|----|---|----|---|------|
| 시크리트포스 V3 | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | 950,000원 |
| 시크리트포스 PRO3 | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | 1,150,000원 |
| 시크리트포스 골드 2 | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | 1,700,000원 |
| 시크리트웨폰 블랙 | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | 1,700,000원 |
| 시크리트웨폰 4.1 | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | 1,700,000원 |

## 🔗 관련 링크
- [데이터베이스 스키마](./database-schema.md)
- [제품별 특징](./product-features.md)
- [추천 로직](./recommendation-logic.md)
- [퀴즈 질문](./quiz-questions.md) 