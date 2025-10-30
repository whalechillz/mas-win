# GoTrueClient 중복 인스턴스 경고 해결

## 🚨 문제

브라우저 개발자 콘솔에 다음 경고가 표시됨:
```
Multiple GoTrueClient instances detected in the same browser context.
```

## 🔍 원인

여러 컴포넌트에서 각각 Supabase 클라이언트를 생성하여 중복 인스턴스가 생성됨:
- `components/admin/dashboard/RealtimeMetrics.tsx`: 독립적으로 `createClient` 호출
- `pages/admin/ai-management.tsx`: 독립적으로 `createClient` 호출

## ✅ 해결 방법

통합 클라이언트(`lib/supabase-client.ts`) 사용으로 변경:

### 변경 파일

1. **components/admin/dashboard/RealtimeMetrics.tsx**
```typescript
// 변경 전
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 변경 후
import { supabase } from '../../../../lib/supabase-client';
```

2. **pages/admin/ai-management.tsx**
```typescript
// 변경 전
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 변경 후
import { supabase } from '../../lib/supabase-client';
```

## 📋 체크리스트

- [x] RealtimeMetrics.tsx 수정
- [x] ai-management.tsx 수정
- [x] 브라우저 콘솔 경고 확인
- [x] 배포 완료

## 🧪 테스트 방법

1. 브라우저 개발자 도구 열기
2. `/admin/ai-dashboard` 접속
3. 콘솔에서 "Multiple GoTrueClient instances" 경고가 사라졌는지 확인

## 📅 적용 일자

2025-10-31

## 📝 참고

- 통합 클라이언트: `lib/supabase-client.ts`
- 모든 컴포넌트는 이 파일의 `supabase` 인스턴스를 사용해야 함

