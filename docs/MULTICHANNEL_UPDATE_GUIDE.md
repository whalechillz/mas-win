# 📱 멀티채널 콘텐츠 관리 시스템 업데이트

## 🎯 주요 변경사항

### 1. 메뉴 이름 변경
- **이전**: 블로그 관리 (간편) / 블로그 관리 (상세)
- **변경후**: 
  - 🟢 **블로그 관리 (네이버)** - 네이버 블로그 전용
  - 📱 **멀티채널 관리** - 자사블로그, 카카오, 인스타 등

### 2. 멀티채널 관리 시스템
**지원 플랫폼**:
- 🏠 자사 블로그
- 💬 카카오채널
- 📷 인스타그램
- 📺 유튜브
- 🎵 틱톡

**주요 기능**:
- 플랫폼별 필터링
- 통합 콘텐츠 캘린더
- 담당자별 업무 분배
- 태그 관리

## 📋 사용 가이드

### 네이버 블로그 팀
1. **"🟢 블로그 관리 (네이버)"** 사용
   - 1개 주제 → 3개 앵글
   - 각 글 담당자 개별 배정
   - 예약 발행 기능

### 멀티채널 담당자
1. **"📱 멀티채널 관리"** 사용
   - 플랫폼 선택 (자사블로그, 카카오 등)
   - 콘텐츠 작성 및 관리
   - 발행 일정 관리

## 🛠️ 설정 방법

### Supabase SQL 실행
```sql
-- /database/multichannel-schema.sql 파일 내용 실행
```

### 페이지 새로고침
브라우저 새로고침 (F5)

## 📊 시스템 구조

| 시스템 | 테이블 | 용도 |
|--------|---------|------|
| 네이버 블로그 | `simple_blog_posts` | 네이버 전용, 중복방지 |
| 멀티채널 | `content_ideas` | 다중 플랫폼 통합 |
| 캘린더 | `blog_contents` | 일정 관리 |

## ✨ 장점
- **명확한 구분**: 네이버 vs 기타 플랫폼
- **전문화**: 각 플랫폼 특성에 맞는 관리
- **효율성**: 팀별 독립적 운영

## 🚀 향후 계획
1. 플랫폼별 자동 발행 API 연동
2. 성과 분석 대시보드
3. AI 콘텐츠 추천 기능