# 마쓰구(MASGOLF) 퀴즈 질문

## 📝 1단계 퀴즈 (모든 퍼널)

### 연령대 질문
```javascript
{
  id: 'age_group',
  question: '연령대를 선택해주세요',
  options: ['40대', '50대', '60대', '70대', '80대+']
}
```

### 스윙 스타일 질문 (퍼널별)
```javascript
// 7월 퍼널
{
  id: 'swing_style',
  question: '당신의 스윙 스타일은?',
  options: ['안정형', '파워형', '복합형']
}

// 8월 퍼널
{
  id: 'swing_style',
  question: '당신의 스윙 스타일은?',
  options: ['스윙어', '히터형']
}

// 전문 퍼널
{
  id: 'swing_style',
  question: '당신의 스윙 스타일은?',
  options: ['스위퍼', '디거', '드라이버']
}
```

### 중요 요소 질문 (퍼널별)
```javascript
// 7월 퍼널
{
  id: 'priority',
  question: '클럽 선택 시 가장 중요한 것은?',
  options: ['비거리', '방향성', '편안함']
}

// 8월 퍼널
{
  id: 'priority',
  question: '클럽 선택 시 가장 중요한 것은?',
  options: ['비거리', '정확성', '편안함']
}

// 전문 퍼널
{
  id: 'priority',
  question: '클럽 선택 시 가장 중요한 것은?',
  options: ['비거리', '정확성', '편안함']
}
```

### 현재 비거리 질문
```javascript
{
  id: 'current_distance',
  question: '현재 드라이버 비거리는?',
  type: 'number',
  unit: 'm',
  placeholder: '예: 180'
}
```

## 📝 2단계 퀴즈 (선택적)

### 현재 클럽 스펙 질문
```javascript
{
  id: 'current_club_spec',
  question: '현재 사용 중인 클럽 스펙은?',
  type: 'text',
  placeholder: '예: 10.5R, 9S',
  description: '헤드 각도와 샤프트 강도를 입력해주세요'
}
```

### 볼스피드 질문
```javascript
{
  id: 'ball_speed',
  question: '골프존에서 측정한 볼스피드는?',
  type: 'number',
  unit: 'm/s',
  placeholder: '예: 52',
  description: '골프존에서 측정한 볼스피드를 입력해주세요'
}
```

### 티 높이 선호도 질문
```javascript
{
  id: 'tee_height_preference',
  question: '티 높이를 어떻게 사용하시나요?',
  options: ['40mm (낮게)', '45mm (보통)', '50mm (높게)'],
  description: '현재 사용하는 티 높이를 선택해주세요'
}
```

### 볼 플라이트 선호도 질문
```javascript
{
  id: 'ball_flight_preference',
  question: '어떤 볼 플라이트를 선호하시나요?',
  options: ['고탄도', '중탄도', '저탄도'],
  description: '원하는 볼 플라이트를 선택해주세요'
}
```

### 컨트롤 요구사항 질문
```javascript
{
  id: 'control_need',
  question: '어떤 컨트롤이 가장 중요하신가요?',
  options: ['구질컨트롤', '스핀량컨트롤', '방향성컨트롤'],
  description: '가장 중요하게 생각하는 컨트롤을 선택해주세요'
}
```

### 예산 질문
```javascript
{
  id: 'budget',
  question: '예산 범위를 선택해주세요',
  options: [
    '100만원 이하 (시크리트포스 V3)',
    '100-120만원 (시크리트포스 PRO3)',
    '170만원 이상 (모든 제품)'
  ],
  description: '예산에 맞는 제품을 추천해드립니다'
}
```

### 원하는 샤프트 질문
```javascript
{
  id: 'desired_shaft_flex',
  question: '원하는 샤프트 강도는?',
  options: ['R2', 'R1', 'R', 'SR', 'S'],
  description: '추천된 제품의 사용 가능한 플렉스 중에서 선택해주세요'
}
```

## 📊 퍼널별 퀴즈 구성

### 빠른 전환 퍼널 (1단계만)
```javascript
const quickFunnel = {
  quizSteps: 1,
  questions: [
    'age_group',
    'swing_style', // 7월 퍼널 옵션
    'priority',    // 7월 퍼널 옵션
    'current_distance'
  ],
  message: '3분 만에 맞춤 클럽 찾기',
  expectedConversion: '12%'
};
```

### 상세 분석 퍼널 (2단계까지)
```javascript
const detailedFunnel = {
  quizSteps: 2,
  questions: [
    // 1단계
    'age_group',
    'swing_style', // 전문 퍼널 옵션
    'priority',    // 전문 퍼널 옵션
    'current_distance',
    // 2단계
    'current_club_spec',
    'ball_speed',
    'tee_height_preference',
    'ball_flight_preference',
    'control_need',
    'budget'
  ],
  message: '정확한 맞춤 분석',
  expectedConversion: '20%'
};
```

### 하이브리드 퍼널 (선택적 2단계)
```javascript
const hybridFunnel = {
  quizSteps: 2,
  step1: {
    required: true,
    questions: [
      'age_group',
      'swing_style', // 8월 퍼널 옵션
      'priority',    // 8월 퍼널 옵션
      'current_distance'
    ]
  },
  step2: {
    required: false,
    questions: [
      'current_club_spec',
      'ball_speed',
      'budget'
    ]
  },
  message: '기본 추천 + 상세 분석',
  expectedConversion: '16%'
};
```

## 🔗 관련 링크
- [데이터베이스 스키마](./database-schema.md)
- [제품별 특징](./product-features.md)
- [추천 로직](./recommendation-logic.md)
- [플렉스 매핑](./flex-mapping.md) 