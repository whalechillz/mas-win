# 노션 API 연동 보안 가이드

## 1. 환경변수 설정 (.env.local)
```env
# 절대 GitHub에 올리지 마세요!
NOTION_TOKEN=secret_xxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxxxxxxx
```

## 2. API Route 보안 (pages/api/notion.ts)
```typescript
export default async function handler(req, res) {
  // 1. 인증 확인
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 2. Rate Limiting
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  // 3. 캐싱으로 API 호출 최소화
  const cached = await getCache('notion-content');
  if (cached) {
    return res.status(200).json(cached);
  }

  // 4. 노션 API 호출
  try {
    const notion = new Client({ auth: process.env.NOTION_TOKEN });
    const data = await notion.pages.retrieve({ page_id: 'xxx' });
    
    // 5. 민감한 정보 필터링
    const filtered = filterSensitiveData(data);
    
    // 6. 캐시 저장 (5분)
    await setCache('notion-content', filtered, 300);
    
    return res.status(200).json(filtered);
  } catch (error) {
    // 7. 에러 정보 숨기기
    console.error('Notion API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

## 3. 클라이언트 보안
```typescript
// 직접 노션 API 호출 금지
// ❌ 잘못된 방법
const data = await fetch('https://api.notion.com/...');

// ✅ 올바른 방법
const data = await fetch('/api/notion');
```

## 4. 추가 보안 조치
- [ ] Vercel 환경변수 사용
- [ ] API 키 정기 교체
- [ ] 접근 로그 모니터링
- [ ] CORS 설정
- [ ] 콘텐츠 검증