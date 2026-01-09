# 카카오 채널 관리 배포 체크리스트

## ✅ 완료된 작업

### Phase 1 핵심 기능
- [x] 신규 글 초안 저장 오류 수정
- [x] 전화번호 → UUID 변환 시스템 구현
- [x] 알림톡 발송 완성 (Solapi 연동)
- [x] 수신자 그룹 관리 시스템 구현
- [x] SMS 페이지에 카카오톡 대행 발송 옵션 추가
- [x] 친구 없으면 SMS 대체 발송 로직 구현
- [x] 테스트 그룹 생성 (MASLABS, 010-6669-9000)
- [x] 빌드 테스트 통과

---

## 🚀 배포 전 확인 사항

### 1. 환경 변수 (Vercel)

**필수 환경 변수**:
```bash
# 카카오 API
KAKAO_ADMIN_KEY=your_kakao_admin_key
KAKAO_PLUS_FRIEND_ID=your_plus_friend_id

# Solapi (알림톡 발송용)
SOLAPI_API_KEY=your_solapi_key
SOLAPI_API_SECRET=your_solapi_secret
SOLAPI_SENDER=0312150013

# Supabase (이미 설정되어 있을 것)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**확인 방법**:
```bash
# Vercel CLI로 확인
vercel env ls

# 또는 Vercel 대시보드에서 확인
# Settings → Environment Variables
```

---

### 2. 데이터베이스 스키마

**실행 완료된 SQL**:
- [x] `database/create-kakao-friend-mappings-table.sql`
- [x] `database/create-kakao-recipient-groups-table.sql`
- [x] `channel_sms` 테이블 확장 (카카오 발송 정보 컬럼)

**확인 쿼리**:
```sql
-- Supabase SQL Editor에서 실행
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('kakao_friend_mappings', 'kakao_recipient_groups');
```

---

### 3. API 엔드포인트 확인

**로컬 테스트**:
```bash
# 친구 목록 조회
curl http://localhost:3000/api/kakao/friends

# 수신자 그룹 조회
curl http://localhost:3000/api/kakao/recipient-groups

# 친구 목록 동기화 (KAKAO_ADMIN_KEY 필요)
curl "http://localhost:3000/api/kakao/friends?sync=true"
```

**배포 환경 테스트**:
```bash
# 친구 목록 조회
curl https://your-domain.vercel.app/api/kakao/friends

# 수신자 그룹 조회
curl https://your-domain.vercel.app/api/kakao/recipient-groups

# 친구 목록 동기화
curl "https://your-domain.vercel.app/api/kakao/friends?sync=true"
```

---

## 📋 배포 절차

### 1. 환경 변수 설정 (Vercel)
```bash
# Vercel CLI 사용
vercel env add KAKAO_ADMIN_KEY production
vercel env add KAKAO_PLUS_FRIEND_ID production
vercel env add SOLAPI_API_KEY production
vercel env add SOLAPI_API_SECRET production
vercel env add SOLAPI_SENDER production
```

### 2. 빌드 확인
```bash
npm run build
```

### 3. 배포
```bash
# Vercel CLI
vercel --prod

# 또는 Git Push (자동 배포)
git add .
git commit -m "카카오 채널 관리 Phase 1 완성"
git push
```

### 4. 배포 후 테스트
1. 친구 목록 동기화 테스트
2. 테스트 그룹으로 발송 테스트
3. SMS 페이지에서 카카오톡 대행 발송 테스트

---

## 🎯 사용 방법

### 친구 목록 동기화
1. `/admin/kakao-list` 페이지 접속
2. "친구 목록 동기화" 버튼 클릭 (향후 UI 추가)
3. 또는 API 직접 호출: `/api/kakao/friends?sync=true`

### SMS에서 카카오톡 대행 발송
1. `/admin/sms` 페이지 접속
2. 메시지 작성
3. "카카오톡 대행 발송" 체크
4. 발송 방식 선택 (친구톡/알림톡)
5. 수신자 그룹 선택 또는 개별 번호 입력
6. 발송

### 수신자 그룹 사용
1. SMS 페이지에서 "카카오톡 대행 발송" 체크
2. 수신자 그룹 드롭다운에서 "MASLABS" 선택
3. 발송

---

## ⚠️ 주의사항

1. **친구 목록 동기화**: 주기적으로 실행 필요 (1일 1회 권장)
2. **알림톡 템플릿**: Solapi에서 템플릿 등록 및 검수 완료 필요
3. **전화번호 형식**: 숫자만 입력 (하이픈 제거 자동 처리)
4. **친구 추가**: 카카오 비즈니스 채널에 친구로 추가된 번호만 카카오톡 발송 가능

---

## 📊 구현된 파일 목록

### API
- `pages/api/kakao/friends.ts` - 친구 목록 조회/동기화
- `pages/api/kakao/recipient-groups.ts` - 수신자 그룹 관리
- `pages/api/channels/sms/send-with-kakao.js` - SMS 카카오톡 대행 발송
- `pages/api/channels/kakao/send.ts` - 카카오 메시지 발송 (전화번호→UUID 변환 추가)
- `pages/api/channels/kakao/save.ts` - 카카오 메시지 저장 (업데이트 로직 추가

### 컴포넌트
- `components/admin/KakaoSendOption.tsx` - 카카오톡 대행 발송 옵션 UI

### 데이터베이스
- `database/create-kakao-friend-mappings-table.sql`
- `database/create-kakao-recipient-groups-table.sql`
- `database/verify-kakao-tables.sql`

### 문서
- `docs/kakao-channel-phase1-completion.md`
- `docs/kakao-channel-final-plan.md`
- `docs/kakao-channel-deployment-checklist.md`

---

## ✅ 배포 준비 완료

모든 Phase 1 기능이 구현되었고 빌드 테스트를 통과했습니다.
배포 후 환경 변수만 확인하면 바로 사용 가능합니다.







