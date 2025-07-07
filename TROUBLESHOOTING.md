# Supabase 오류 해결 체크리스트

## 1. 즉시 확인사항
- [ ] Supabase 대시보드 접속 가능한가?
- [ ] 프로젝트가 일시 중단되지 않았는가?
- [ ] 무료 플랜 한도를 초과하지 않았는가?

## 2. RLS 정책 확인
- [ ] bookings 테이블의 RLS가 활성화되어 있는가?
- [ ] contacts 테이블의 RLS가 활성화되어 있는가?
- [ ] INSERT 정책이 설정되어 있는가?

## 3. 테이블 구조 확인
- [ ] 퀴즈 관련 컬럼들이 추가되어 있는가?
  - swing_style
  - priority
  - current_distance
  - recommended_flex
  - expected_distance

## 4. 해결 방법
1. **긴급 패치 적용** (이미 완료)
   - emergency-fix.js가 로드되어 로컬 스토리지 사용

2. **RLS 정책 수정**
   - fix-database.sql 파일의 쿼리 실행

3. **디버그 페이지 확인**
   - https://win.masgolf.co.kr/debug-test.html

## 5. 복구 후 할 일
- [ ] emergency-fix.js 스크립트 제거
- [ ] 로컬 스토리지의 데이터를 Supabase로 마이그레이션
- [ ] 정상 작동 테스트