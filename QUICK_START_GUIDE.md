# 🚀 빠른 실행 가이드

## 1️⃣ Supabase에서 SQL 실행

```sql
-- 아래 파일의 내용을 복사해서 실행
/database/enhanced-campaign-schema.sql
```

## 2️⃣ MarketingDashboard.tsx 수정

```typescript
// 상단에 import 추가
import { EnhancedMarketingDashboard } from './EnhancedMarketingDashboard';

// activeView === 'campaign' 부분을 아래로 변경
{activeView === 'campaign' && <EnhancedMarketingDashboard supabase={supabase} />}
```

## 3️⃣ 바로 확인하기

1. 관리자 페이지 접속
2. "마케팅 콘텐츠" 메뉴 클릭
3. "📊 통합 캠페인" 탭에서 새로운 기능 확인

## 🎯 핵심 개선사항

### 네이버 블로그 발행 스케줄
```
✅ 주 3회 발행 권장
- 월: mas9golf (제이)
- 수: massgoogolf (스테피)
- 금: massgoogolfkorea (허상원)
```

### 월별 테마 관리
```
✅ DB에서 관리 (하드코딩 X)
- 7월: 뜨거운 여름, 완벽한 스윙을 위한 준비
- 8월: 휴가철, 골프 휴양지 필수품
- ... (12개월 모두 등록됨)
```

### 새로운 메뉴
```
1. 📋 마케팅 계획 - 월별 테마 관리
2. 💡 글감 관리 - 아이디어 뱅크
3. 🤖 AI 서포트 - 콘텐츠 생성
4. ✍️ 수동 배포 - 네이버 블로그
5. 🚀 자동 배포 - 멀티채널
6. 📊 통계 - 성과 분석
7. 🎯 KPI 관리 - 목표 추적
```

## 💡 팁

- **글감 관리**: 아이디어가 생길 때마다 바로 등록
- **AI 서포트**: 프롬프트를 구체적으로 작성하면 더 좋은 결과
- **통계**: 매주 월요일에 지난주 성과 확인 권장

## 🔧 문제 발생 시

1. SQL 실행 오류: 기존 테이블 삭제 후 재실행
2. 컴포넌트 오류: 파일명 및 import 경로 확인
3. 데이터 안 보임: 새로고침 또는 재로그인

---

**준비 완료!** 이제 통합 마케팅 시스템을 사용할 수 있습니다. 🎉