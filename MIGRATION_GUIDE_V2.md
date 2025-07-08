# 🚀 MASGOLF DB 구조 개선 마이그레이션 가이드

## 개요
퀴즈 결과와 예약/문의를 분리하여 더 효율적인 데이터 구조로 개선합니다.

## 🎯 장점
- **데이터 중복 제거**: 한 고객의 정보가 한 곳에만 저장
- **추적 개선**: 퀴즈만 완료하고 이탈한 고객도 추적 가능
- **전환율 분석**: 퀴즈→예약, 퀴즈→문의 전환율 정확히 측정
- **재방문 대응**: 전화번호로 기존 고객 데이터 조회 및 맞춤 대응

## 📋 마이그레이션 단계

### 1단계: DB 구조 생성 (Supabase SQL Editor에서 실행)

```sql
-- 파일: /database/step1-create-tables.sql 내용 실행
```

### 2단계: 기존 데이터 마이그레이션

```sql
-- 파일: /database/step2-migrate-data.sql 내용 실행
```

### 3단계: API 파일 교체

```bash
# 기존 API 백업
mv pages/api/quiz-result.js pages/api/quiz-result-backup.js
mv pages/api/booking.js pages/api/booking-backup.js

# 새 API 파일로 교체
mv pages/api/quiz-result-v2.js pages/api/quiz-result.js
mv pages/api/booking-v2.js pages/api/booking.js
```

### 4단계: 관리자 대시보드 업데이트

```bash
# 기존 admin 백업
mv pages/admin.tsx pages/admin-backup.tsx

# 새 버전으로 교체
mv pages/admin-v2.tsx pages/admin.tsx

# 컴포넌트 교체
mv components/admin/bookings/BookingManagementFull.tsx components/admin/bookings/BookingManagementFull-backup.tsx
mv components/admin/bookings/BookingManagementV2.tsx components/admin/bookings/BookingManagementFull.tsx
```

### 5단계: 프론트엔드 연동

```html
<!-- funnel-2025-07-complete.html에 추가 -->
<script src="/js/frontend-v2-update.js"></script>
```

또는 파일을 직접 수정

### 6단계: 배포 및 테스트

```bash
# 빌드 테스트
npm run build

# 로컬 테스트
npm run dev

# Vercel 배포
vercel --prod
```

## ✅ 체크리스트

- [ ] Supabase에 새 테이블 생성됨
- [ ] 기존 데이터 마이그레이션 완료
- [ ] API 파일 교체됨
- [ ] 관리자 대시보드 정상 작동
- [ ] 도넛 차트에 데이터 표시됨
- [ ] 예약 시 퀴즈 데이터 저장됨
- [ ] 퀴즈 전환율 통계 표시됨

## 🔄 롤백 방법

문제 발생 시:

```bash
# API 롤백
mv pages/api/quiz-result.js pages/api/quiz-result-v2.js
mv pages/api/quiz-result-backup.js pages/api/quiz-result.js
mv pages/api/booking.js pages/api/booking-v2.js
mv pages/api/booking-backup.js pages/api/booking.js

# Admin 롤백
mv pages/admin.tsx pages/admin-v2.tsx
mv pages/admin-backup.tsx pages/admin.tsx
```

## 📊 모니터링

마이그레이션 후 확인:

1. **Supabase Dashboard**에서:
   - quiz_results 테이블에 데이터 생성되는지
   - bookings_with_quiz 뷰가 정상 작동하는지
   - quiz_conversion_stats 뷰 통계 확인

2. **관리자 대시보드**에서:
   - 퀴즈 완료 수 표시
   - 전환율 표시
   - 고객 스타일 분석 차트 작동

3. **프론트엔드**에서:
   - 퀴즈 완료 시 quiz_result_id 생성
   - 예약 시 quiz_result_id 연결
   - 재방문 고객 인식

## 💡 주의사항

1. **기존 데이터 보존**: 마이그레이션 전 백업 필수
2. **API 호환성**: 기존 프론트엔드도 계속 작동하도록 폴백 로직 포함
3. **점진적 적용**: 한 번에 모든 것을 변경하지 말고 단계별로 진행
4. **모니터링**: 각 단계 후 정상 작동 확인

## 📞 문제 발생 시

1. Supabase 로그 확인
2. Vercel 함수 로그 확인
3. 브라우저 콘솔 에러 확인
4. 롤백 후 원인 분석
