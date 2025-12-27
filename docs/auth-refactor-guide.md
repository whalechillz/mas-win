# 인증 시스템 리팩토링 가이드

## 📋 변경 사항 요약

### 1. UI 구조 개선
- **우상단 사용자 프로필 드롭다운**: 사용자 정보, 개인정보 수정, 로그아웃 버튼 통합
- **개인정보 수정 모달**: 우상단 드롭다운에서 접근 가능한 모달 형태
- **계정 관리 페이지**: 내 프로필 탭 제거, 팀 관리만 담당

### 2. 새로운 컴포넌트
- `components/admin/UserProfileDropdown.tsx`: 우상단 사용자 프로필 드롭다운
- `components/admin/ProfileEditModal.tsx`: 개인정보 수정 모달

### 3. 수정된 컴포넌트
- `components/admin/AdminNav.tsx`: UserProfileDropdown 통합
- `components/admin/AccountManagement.tsx`: 내 프로필 탭 제거, 팀 관리만

### 4. 로그아웃 기능 개선
- 모든 NextAuth 쿠키 삭제 (다양한 도메인/경로 조합)
- localStorage/sessionStorage 정리
- 강제 리다이렉트로 세션 완전 종료

## 🗄️ 데이터베이스 마이그레이션

### 실행 방법

1. **Supabase 대시보드에서 실행**:
   - Supabase 대시보드 → SQL Editor
   - `database/migrate-admin-users-structure.sql` 파일 내용 복사
   - 실행

2. **또는 CLI로 실행**:
   ```bash
   # Supabase CLI 사용 시
   supabase db execute -f database/migrate-admin-users-structure.sql
   ```

### 마이그레이션 내용

1. **컬럼 추가** (없는 경우):
   - `last_login TIMESTAMPTZ`: 마지막 로그인 시간
   - `is_active BOOLEAN DEFAULT true`: 활성 상태
   - `updated_at TIMESTAMPTZ DEFAULT NOW()`: 업데이트 시간

2. **인덱스 생성**:
   - `idx_admin_users_phone`: 전화번호 검색 최적화
   - `idx_admin_users_role`: 역할 검색 최적화
   - `idx_admin_users_is_active`: 활성 상태 필터링 최적화

3. **트리거 생성**:
   - `trigger_update_admin_users_updated_at`: 업데이트 시 자동으로 `updated_at` 갱신

4. **기존 데이터 처리**:
   - `is_active`가 NULL인 경우 `true`로 설정
   - `last_login`이 NULL인 경우 `created_at`으로 설정

## 🚀 배포 전 체크리스트

- [ ] DB 마이그레이션 스크립트 실행 완료
- [ ] 로그아웃 기능 테스트
- [ ] 개인정보 수정 기능 테스트
- [ ] 팀 관리 기능 테스트
- [ ] 우상단 드롭다운 UI 확인

## 📝 사용 방법

### 개인정보 수정
1. 우상단 사용자 프로필 아이콘 클릭
2. "개인정보 수정" 선택
3. 이름, 전화번호, 비밀번호 수정
4. 저장 클릭

### 로그아웃
1. 우상단 사용자 프로필 아이콘 클릭
2. "로그아웃" 선택
3. 자동으로 로그인 페이지로 리다이렉트

### 팀 관리
1. 시스템 → 계정 관리 메뉴 접근
2. 팀 관리 탭에서 사용자 추가/수정/삭제

## ⚠️ 주의사항

1. **DB 마이그레이션**: 프로덕션 환경에서 실행 전 반드시 백업
2. **세션 관리**: 로그아웃 시 모든 쿠키가 삭제되므로 다른 탭에서도 로그아웃됨
3. **개인정보 수정**: 비밀번호 변경 시 즉시 적용되며, 다음 로그인부터 새 비밀번호 사용

