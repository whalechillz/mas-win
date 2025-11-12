# 브랜드 전략 시스템

## 📋 개요

페르소나와 오디언스 온도에 맞춘 맞춤형 콘텐츠 생성을 위한 브랜드 전략 선택 시스템입니다.

## 📍 위치

- **컴포넌트**: `components/admin/BrandStrategySelector.tsx`
- **데이터**: `lib/masgolf-brand-data.js`

## 🎯 주요 기능

1. **콘텐츠 유형 선택**
   - 골프 정보, 제품 정보, 고객 후기, 브랜드 스토리, 이벤트, 기술 및 성능

2. **고객 페르소나 선택**
   - 메인 페르소나: tech_enthusiast, competitive_maintainer, health_conscious_senior 등
   - 서브 페르소나: senior_fitting, returning_60plus 등

3. **오디언스 온도 설정**
   - Cold (관심 낮음): 정보 탐색 단계
   - Warm (관심 보통): 고려 단계
   - Hot (관심 높음): 구매 의향 높음

4. **브랜드 강도 자동 매칭**
   - 콘텐츠 유형에 따라 자동 설정
   - 낮음/중간/높음

5. **스토리텔링 프레임워크**
   - PAS, STDC, AIDA 등

## 💻 사용 방법

### 기본 사용

```typescript
import BrandStrategySelector from '@/components/admin/BrandStrategySelector';

function MyComponent() {
  const [strategy, setStrategy] = useState(null);

  return (
    <BrandStrategySelector
      onStrategyChange={(newStrategy) => {
        setStrategy(newStrategy);
        console.log('전략 변경:', newStrategy);
      }}
      onApplyStrategy={(appliedStrategy) => {
        console.log('전략 적용:', appliedStrategy);
      }}
    />
  );
}
```

### 커스텀 설정

```typescript
<BrandStrategySelector
  config={{
    brandName: '마쓰구',
    contentTypes: ['골프 정보', '제품 정보', '고객 후기'],
  }}
  onStrategyChange={handleStrategyChange}
  onApplyStrategy={handleApplyStrategy}
  showVariationButton={true}
  isLoading={false}
/>
```

## 📊 전략 객체 구조

```typescript
interface BrandStrategy {
  contentType: string;           // '골프 정보', '제품 정보' 등
  persona: string;               // 'tech_enthusiast', 'senior_fitting' 등
  framework: string;              // 'PAS', 'STDC' 등
  channel: string;                // 'local', 'online' 등
  brandStrength: string;          // '낮음', '중간', '높음'
  audienceTemperature: string;   // 'cold', 'warm', 'hot'
  conversionGoal: string;         // 'awareness', 'consideration', 'purchase'
}
```

## 🔄 자동 매칭 로직

### 콘텐츠 유형 → 브랜드 강도

```typescript
// lib/masgolf-brand-data.js의 CONTENT_TYPE_FRAMEWORK_MAPPING 참조
{
  '골프 정보': { brandStrength: '낮음', frameworks: ['PAS', 'STDC'] },
  '제품 정보': { brandStrength: '높음', frameworks: ['AIDA', 'STDC'] },
  // ...
}
```

### 페르소나 → 오디언스 온도

```typescript
// lib/masgolf-brand-data.js의 PERSONA_AUDIENCE_MAPPING 참조
{
  'tech_enthusiast': 'hot',
  'senior_fitting': 'warm',
  // ...
}
```

## 📝 예시: 카카오톡 콘텐츠에 적용

```typescript
import BrandStrategySelector from '@/components/admin/BrandStrategySelector';

export default function KakaoContentPage() {
  const [brandStrategy, setBrandStrategy] = useState({
    contentType: '골프 정보',
    persona: 'senior_fitting',  // 시니어 타겟
    audienceTemperature: 'warm',
    brandStrength: '중간'
  });

  return (
    <div>
      <h2>🎯 마쓰구 브랜드 전략</h2>
      <BrandStrategySelector
        config={{
          brandName: '마쓰구',
        }}
        onStrategyChange={(strategy) => {
          setBrandStrategy(strategy);
          // 카카오톡 콘텐츠에 전략 적용
        }}
      />
    </div>
  );
}
```

## 🔗 관련 파일

- `components/admin/BrandStrategySelector.tsx` - 메인 컴포넌트
- `lib/masgolf-brand-data.js` - 페르소나, 프레임워크 데이터
- `pages/admin/blog.tsx` - 실제 사용 예시 (6563번째 줄)

## 📚 참고 문서

- [프로젝트 계획](../project_plan.md) - Phase 13: 콘텐츠 허브 시스템


