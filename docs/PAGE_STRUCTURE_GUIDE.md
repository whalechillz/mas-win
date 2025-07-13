# 🚨 WIN.MASGOLF.CO.KR 페이지 구조 가이드

## 7월 캠페인 페이지 구조

### 1. 메인 접근 경로
- **URL**: `https://win.masgolf.co.kr/funnel-2025-07`
- **파일**: `/pages/funnel-2025-07.tsx`
- **역할**: iframe 래퍼, 전화번호 클릭 처리, API 통합

### 2. 실제 콘텐츠
- **URL**: `https://win.masgolf.co.kr/versions/funnel-2025-07-complete.html`
- **파일**: `/public/versions/funnel-2025-07-complete.html`
- **역할**: 실제 캠페인 콘텐츠 (모든 수정은 여기서!)

## 수정 가이드

### 콘텐츠 수정이 필요한 경우:
✅ **항상 HTML 파일만 수정**
- `/public/versions/funnel-2025-07-complete.html`

### TSX 파일은 언제 수정?
- 전화번호 클릭 로직 변경
- API 연동 추가
- 새로운 JavaScript 기능 추가

## 장점
1. **안정성**: TSX 오류 시 HTML 직접 접근 가능
2. **성능**: HTML은 CDN에서 직접 서빙
3. **유지보수**: 콘텐츠와 로직 분리

## 비상 시 대응
- TSX 문제: `/versions/funnel-2025-07-complete.html` 직접 사용
- HTML 문제: 백업 파일 사용 (`.backup-*` 파일들)

---
마지막 업데이트: 2025년 7월
