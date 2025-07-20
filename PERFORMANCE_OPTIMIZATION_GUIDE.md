# 🚀 통합 마케팅 시스템 성능 최적화 가이드

## 1. 프론트엔드 최적화

### 1.1 번들 사이즈 최적화
```javascript
// next.config.js 설정
module.exports = {
  // 이미지 최적화
  images: {
    domains: ['win.masgolf.co.kr'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // 번들 분석
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      };
    }
    return config;
  },
};
```

### 1.2 컴포넌트 지연 로딩
```typescript
// IntegratedMarketingHub.tsx
import dynamic from 'next/dynamic';

// 동적 임포트로 초기 로딩 시간 감소
const FunnelPlanManager = dynamic(
  () => import('./FunnelPlanManager'),
  { 
    loading: () => <LoadingSpinner />,
    ssr: false 
  }
);

const KPIManager = dynamic(
  () => import('./KPIManager'),
  { 
    loading: () => <LoadingSpinner />,
    ssr: false 
  }
);
```

### 1.3 React 성능 최적화
```typescript
// 메모이제이션 사용
import { useMemo, useCallback, memo } from 'react';

// 컴포넌트 메모이제이션
export const OptimizedComponent = memo(({ data }) => {
  // 복잡한 계산은 useMemo로 캐싱
  const processedData = useMemo(() => {
    return expensiveCalculation(data);
  }, [data]);
  
  // 이벤트 핸들러는 useCallback으로 캐싱
  const handleClick = useCallback(() => {
    // 처리 로직
  }, [dependency]);
  
  return <div>{/* UI */}</div>;
});
```

## 2. API 최적화

### 2.1 데이터베이스 쿼리 최적화
```typescript
// 효율적인 쿼리 작성
// ❌ 나쁜 예: N+1 문제
const plans = await supabase.from('monthly_funnel_plans').select('*');
for (const plan of plans.data) {
  const pages = await supabase
    .from('funnel_pages')
    .select('*')
    .eq('funnel_plan_id', plan.id);
}

// ✅ 좋은 예: JOIN 사용
const { data } = await supabase
  .from('monthly_funnel_plans')
  .select(`
    *,
    funnel_pages (*),
    generated_contents (*)
  `)
  .eq('year', year)
  .eq('month', month);
```

### 2.2 캐싱 전략
```typescript
// API 응답 캐싱
import { LRUCache } from 'lru-cache';

const cache = new LRUCache({
  max: 100,
  ttl: 1000 * 60 * 5, // 5분
});

export async function getCachedData(key: string, fetcher: () => Promise<any>) {
  const cached = cache.get(key);
  if (cached) return cached;
  
  const data = await fetcher();
  cache.set(key, data);
  return data;
}
```

### 2.3 API 요청 최적화
```typescript
// 디바운싱 적용
import { debounce } from 'lodash';

const debouncedSearch = debounce(async (query: string) => {
  const results = await searchAPI(query);
  setSearchResults(results);
}, 300);

// 요청 배칭
const batchRequests = async (requests: Promise<any>[]) => {
  return Promise.all(requests);
};
```

## 3. 이미지 최적화

### 3.1 Next.js Image 컴포넌트 활용
```typescript
import Image from 'next/image';

// 최적화된 이미지 로딩
<Image
  src="/campaigns/2025-07/main.jpg"
  alt="캠페인 메인 이미지"
  width={1200}
  height={600}
  loading="lazy"
  placeholder="blur"
  blurDataURL={blurDataUrl}
/>
```

### 3.2 이미지 포맷 최적화
```bash
# WebP 변환 스크립트
for img in public/campaigns/**/*.{jpg,png}; do
  cwebp -q 80 "$img" -o "${img%.*}.webp"
done
```

## 4. 상태 관리 최적화

### 4.1 컨텍스트 분리
```typescript
// 큰 컨텍스트를 작은 단위로 분리
const FunnelPlanContext = createContext();
const KPIContext = createContext();
const UIContext = createContext();

// 필요한 컨텍스트만 구독
function Component() {
  const { theme } = useContext(UIContext); // 전체가 아닌 필요한 부분만
}
```

### 4.2 상태 정규화
```typescript
// 정규화된 상태 구조
interface NormalizedState {
  entities: {
    funnelPlans: { [id: string]: FunnelPlan };
    contents: { [id: string]: Content };
  };
  ids: {
    funnelPlans: string[];
    contents: string[];
  };
}
```

## 5. 네트워크 최적화

### 5.1 요청 압축
```typescript
// API 요청/응답 압축
import compression from 'compression';

// middleware.ts
export const config = {
  matcher: '/api/:path*',
};

export function middleware(request: NextRequest) {
  // gzip 압축 적용
  return NextResponse.next({
    headers: {
      'Content-Encoding': 'gzip',
    },
  });
}
```

### 5.2 CDN 활용
```javascript
// vercel.json
{
  "headers": [
    {
      "source": "/campaigns/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

## 6. 모니터링 및 분석

### 6.1 성능 모니터링
```typescript
// 성능 측정 훅
export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 로깅 또는 분석 도구로 전송
      console.log(`${componentName} 렌더링 시간: ${duration}ms`);
      
      if (duration > 100) {
        console.warn(`${componentName} 성능 저하 감지`);
      }
    };
  }, [componentName]);
}
```

### 6.2 번들 분석
```bash
# 번들 크기 분석
npm install --save-dev @next/bundle-analyzer

# package.json
"scripts": {
  "analyze": "ANALYZE=true next build"
}
```

## 7. 데이터베이스 최적화

### 7.1 인덱스 최적화
```sql
-- 자주 조회되는 컬럼에 복합 인덱스 추가
CREATE INDEX idx_funnel_plans_year_month_status 
ON monthly_funnel_plans(year, month, status);

CREATE INDEX idx_contents_funnel_channel_status 
ON generated_contents(funnel_plan_id, channel, status);
```

### 7.2 뷰 활용
```sql
-- 자주 사용되는 복잡한 쿼리를 뷰로 생성
CREATE MATERIALIZED VIEW monthly_performance_summary AS
SELECT 
  mfp.year,
  mfp.month,
  mfp.theme,
  COUNT(DISTINCT gc.id) as total_contents,
  COUNT(DISTINCT CASE WHEN gc.status = 'published' THEN gc.id END) as published_contents,
  AVG((gc.validation_score->>'seoScore')::float) as avg_seo_score
FROM monthly_funnel_plans mfp
LEFT JOIN generated_contents gc ON mfp.id = gc.funnel_plan_id
GROUP BY mfp.year, mfp.month, mfp.theme;

-- 주기적으로 뷰 새로고침
REFRESH MATERIALIZED VIEW monthly_performance_summary;
```

## 8. 성능 목표

### 목표 지표
- **초기 로딩**: < 2초
- **페이지 전환**: < 300ms
- **API 응답**: < 500ms
- **대용량 데이터 처리**: 1000개 아이템 < 1초

### 측정 도구
- Lighthouse
- Web Vitals
- React DevTools Profiler
- Chrome DevTools Performance

## 9. 체크리스트

- [ ] 번들 사이즈 < 200KB (gzipped)
- [ ] 이미지 최적화 (WebP 포맷)
- [ ] API 캐싱 구현
- [ ] 데이터베이스 인덱스 최적화
- [ ] 지연 로딩 구현
- [ ] 메모이제이션 적용
- [ ] CDN 설정
- [ ] 성능 모니터링 설정