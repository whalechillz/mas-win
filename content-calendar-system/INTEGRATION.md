# MASSGOO Content Calendar System - Integration Guide

## 🔄 기존 시스템과의 통합 가이드

### 목차
1. [개요](#개요)
2. [데이터베이스 통합](#데이터베이스-통합)
3. [API 통합](#api-통합)
4. [UI/UX 일관성](#uiux-일관성)
5. [네이버 블로그 스크래퍼 연동](#네이버-블로그-스크래퍼-연동)
6. [주의사항](#주의사항)

---

## 개요

콘텐츠 캘린더 시스템은 기존 MASSGOO 블로그 관리 시스템과 완벽하게 통합되도록 설계되었습니다.

### 통합 원칙
- ✅ **비침해성**: 기존 기능에 영향 없음
- ✅ **데이터 호환성**: 양방향 데이터 동기화
- ✅ **UI 일관성**: 동일한 디자인 시스템 사용
- ✅ **확장성**: 독립적 확장 가능

### 시스템 구조
```
masgolf.co.kr
├── /admin/blog/           # 기존 블로그 관리
├── /admin/content-calendar/  # 새로운 콘텐츠 캘린더
├── /api/blog/             # 기존 블로그 API
├── /api/content-calendar/ # 콘텐츠 캘린더 API
└── /api/blog/naver-scraper/  # 네이버 스크래퍼
```

---

## 데이터베이스 통합

### 테이블 구조
모든 콘텐츠 캘린더 테이블은 `cc_` prefix를 사용하여 충돌 방지:

```sql
-- 콘텐츠 캘린더 전용 테이블
cc_content_calendar      # 메인 콘텐츠 테이블
cc_campaigns            # 캠페인 관리
cc_content_templates    # 템플릿
cc_content_versions     # 버전 관리
cc_publishing_logs      # 발행 로그
cc_content_performance  # 성과 분석

-- 기존 테이블과의 연동 필드
blog_posts.calendar_content_id  # 캘린더 연동
naver_scraped_posts.calendar_content_id  # 스크래퍼 연동
```

### 데이터베이스 마이그레이션
```bash
# 1. 백업 생성
pg_dump -h [host] -U [user] -d [database] > backup_$(date +%Y%m%d).sql

# 2. 통합 스키마 적용
psql -h [host] -U [user] -d [database] < database/schema-integrated.sql

# 3. 기존 데이터 연동
psql -h [host] -U [user] -d [database] < scripts/migrate-existing-data.sql
```

---

## API 통합

### 1. 블로그 시스템 동기화
```typescript
// 캘린더 → 블로그 동기화
POST /api/content-calendar/sync-blog
{
  "contentId": "uuid",
  "action": "create|update|delete",
  "direction": "calendar_to_blog"
}

// 블로그 → 캘린더 동기화
POST /api/content-calendar/sync-blog
{
  "blogPostId": "uuid",
  "action": "create|update|delete",
  "direction": "blog_to_calendar"
}
```

### 2. 네이버 스크래퍼 가져오기
```typescript
// 스크랩된 포스트 목록
GET /api/content-calendar/import-naver?notImported=true

// 캘린더로 가져오기
POST /api/content-calendar/import-naver
{
  "scrapedPostIds": ["id1", "id2"],
  "options": {
    "autoApprove": false,
    "contentDate": "2024-01-20"
  }
}
```

### 3. 통합 인증
기존 인증 시스템 사용:
```typescript
// middleware/auth.ts
import { withAuth } from '@/lib/auth';

export default withAuth(handler, {
  requiredPermissions: ['content_calendar_view']
});
```

---

## UI/UX 일관성

### 디자인 토큰
```scss
// 기존 시스템과 동일한 색상 사용
$primary: #1e3a8a;    // MASSGOO Navy
$secondary: #f59e0b;  // MASSGOO Gold
$gray-scale: (
  50: #f9fafb,
  // ...
  900: #111827
);
```

### 컴포넌트 재사용
```typescript
// 기존 공유 컴포넌트 import
import { Button, Card, Modal } from '@/components/shared';
import { AdminLayout } from '@/layouts/AdminLayout';
```

### 네비게이션 통합
```typescript
// layouts/AdminLayout.tsx 수정
const navigation = [
  { name: '대시보드', href: '/admin' },
  { name: '블로그 관리', href: '/admin/blog' },
  { name: '콘텐츠 캘린더', href: '/admin/content-calendar' }, // 새로 추가
  { name: '네이버 스크래퍼', href: '/admin/blog/scraper' },
];
```

---

## 네이버 블로그 스크래퍼 연동

### 1. BlogIntegrationBridge 컴포넌트 사용
```tsx
import BlogIntegrationBridge from '@/components/admin/content-calendar/BlogIntegrationBridge';

function ContentCalendarPage() {
  return (
    <BlogIntegrationBridge 
      onImport={(content) => {
        // 가져온 콘텐츠 처리
        console.log('Imported:', content);
      }}
    />
  );
}
```

### 2. 자동 가져오기 설정
```typescript
// lib/config/integration.ts
export const IntegrationConfig = {
  naverScraper: {
    enabled: true,
    importToCalendar: true,
    autoClassify: true,
    fieldMapping: {
      title: 'title',
      content: 'content',
      // ...
    }
  }
};
```

### 3. 스크래퍼 Webhook 설정
```typescript
// pages/api/webhooks/naver-scraper.ts
export default async function handler(req, res) {
  const { event, data } = req.body;
  
  if (event === 'new_post_scraped') {
    // 자동으로 캘린더로 가져오기
    await importToCalendar(data.postId);
  }
}
```

---

## 주의사항

### ⚠️ 데이터베이스
1. **백업 필수**: 스키마 변경 전 반드시 백업
2. **트랜잭션 사용**: 대량 작업 시 트랜잭션으로 묶기
3. **인덱스 확인**: 성능 최적화를 위한 인덱스 점검

### ⚠️ API
1. **Rate Limiting**: 기존 설정 준수 (100 req/min)
2. **에러 처리**: 기존 에러 형식 유지
3. **버전 관리**: API 버전 호환성 유지

### ⚠️ 권한
1. **새 권한 추가**: 
   - `content_calendar_view`
   - `content_calendar_create`
   - `content_calendar_edit`
   - `content_calendar_delete`
   - `content_calendar_publish`
2. **역할 업데이트**: Admin, Editor 역할에 새 권한 부여

### ⚠️ 성능
1. **캐싱**: Redis 캐시 키 prefix 사용 (`cc_`)
2. **쿼리 최적화**: N+1 문제 방지
3. **Lazy Loading**: 대용량 데이터 페이지네이션

---

## 설치 및 배포

### 1. 환경 변수 설정
```bash
# .env.local 수정
NEXT_PUBLIC_SUPABASE_URL=기존_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=기존_KEY
SUPABASE_SERVICE_KEY=기존_SERVICE_KEY

# 새로 추가
OPENAI_API_KEY=your_key
FAL_AI_KEY=your_key
GA4_MEASUREMENT_ID=your_id
```

### 2. 의존성 설치
```bash
npm install
# 또는
yarn install
```

### 3. 데이터베이스 마이그레이션
```bash
npm run db:migrate
```

### 4. 빌드 및 배포
```bash
npm run build
npm run start
```

### 5. 기능 확인 체크리스트
- [ ] 기존 블로그 관리 정상 작동
- [ ] 네이버 스크래퍼 정상 작동
- [ ] 콘텐츠 캘린더 접근 가능
- [ ] 블로그 ↔ 캘린더 동기화
- [ ] 네이버 스크랩 가져오기
- [ ] AI 콘텐츠 생성
- [ ] 다중 채널 발행
- [ ] 성과 분석 대시보드

---

## 문제 해결

### Q: 기존 블로그 포스트가 캘린더에 나타나지 않음
```sql
-- 수동 동기화 실행
INSERT INTO cc_content_calendar (blog_post_id, title, content_type, ...)
SELECT id, title, 'blog', ...
FROM blog_posts
WHERE calendar_content_id IS NULL;
```

### Q: 네이버 스크래퍼 가져오기 실패
```typescript
// 로그 확인
SELECT * FROM cc_publishing_logs 
WHERE channel = 'naver_import' 
AND status = 'failed'
ORDER BY published_at DESC;
```

### Q: 권한 오류 발생
```sql
-- 권한 재설정
GRANT ALL ON cc_content_calendar TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

---

## 지원

### 기술 지원
- Email: dev@maslabs.co.kr
- Slack: #content-calendar-support

### 문서
- [API 문서](/docs/api)
- [데이터베이스 스키마](/docs/database)
- [컴포넌트 가이드](/docs/components)

### 버전 정보
- Content Calendar: v1.0.0
- Blog System: v2.3.1 (호환)
- Naver Scraper: v1.5.0 (호환)

---

## 업데이트 로그

### v1.0.0 (2024-01-20)
- 🎉 초기 릴리즈
- ✨ 기존 블로그 시스템 통합
- ✨ 네이버 스크래퍼 연동
- ✨ AI 콘텐츠 생성
- ✨ 다중 채널 발행
- ✨ 성과 분석 대시보드

---

*Last Updated: 2024-01-20*
