# 카카오 친구 목록 조회 API 오류 해결 방안

## 🔴 오류 원인

### 현재 오류
- **401 Unauthorized**: `access token should not be null or empty`
- **500 Internal Server Error**: 카카오 API 인증 실패

### 근본 원인
카카오 친구 목록 조회 API (`/v1/api/talk/friends`)는 **OAuth 2.0 Access Token**이 필요합니다.
현재 코드는 **Admin Key**를 사용하고 있어 인증이 실패합니다.

### API 인증 방식 차이

| API | 필요한 인증 | 현재 사용 중 |
|-----|------------|------------|
| `/v1/api/talk/friends` (친구 목록 조회) | **OAuth 2.0 Access Token** (Bearer) | ❌ Admin Key (KakaoAK) |
| `/v1/api/talk/friends/message/default/send` (친구톡 발송) | Admin Key (KakaoAK) | ✅ Admin Key |
| `/v1/api/talk/memo/default/send` (알림톡 발송) | Admin Key (KakaoAK) | ✅ Admin Key |

---

## ✅ 해결 방안

### 옵션 1: OAuth 2.0 Access Token 사용 (권장)

친구 목록 조회를 위해서는 사용자 로그인을 통해 Access Token을 발급받아야 합니다.

**구현 방법:**
1. 카카오 로그인 연동 (OAuth 2.0)
2. 사용자 동의 받기 (friends 동의 항목)
3. Access Token 발급
4. Access Token으로 친구 목록 조회

**장점:**
- 카카오 공식 API 사용
- 정확한 친구 목록 조회 가능

**단점:**
- OAuth 2.0 구현 필요
- 사용자 로그인 필요
- 복잡도 증가

---

### 옵션 2: 수동 친구 등록 (현실적)

카카오 비즈니스 파트너센터에서 친구 목록을 수동으로 가져와서 데이터베이스에 등록

**구현 방법:**
1. 카카오 비즈니스 파트너센터에서 친구 목록 확인
2. 전화번호와 UUID를 수동으로 입력하거나 CSV로 업로드
3. `kakao_friend_mappings` 테이블에 저장

**장점:**
- 구현 간단
- 즉시 사용 가능
- Admin Key만으로 충분

**단점:**
- 수동 작업 필요
- 자동 동기화 불가

---

### 옵션 3: 전화번호 기반 친구 확인 (현재 방식 유지)

친구 목록 동기화 없이, 발송 시 전화번호로 친구 여부만 확인

**현재 구현:**
- 전화번호를 입력하면 데이터베이스에서 UUID 조회
- 친구인 경우 카카오톡 발송, 아닌 경우 SMS 발송

**장점:**
- 현재 시스템과 호환
- 추가 구현 불필요

**단점:**
- 친구 목록 미리보기 불가
- 친구 추가 시 수동 업데이트 필요

---

## 🎯 권장 해결책

### 단기 해결책 (즉시 적용 가능)
**옵션 3 유지 + 수동 친구 등록 기능 강화**

1. 친구 목록 동기화 버튼 비활성화 또는 안내 메시지 표시
2. 수동 친구 등록 UI 개선
   - 전화번호 직접 입력
   - CSV 업로드
   - 카카오 비즈니스 파트너센터에서 복사/붙여넣기

### 장기 해결책 (향후 구현)
**OAuth 2.0 Access Token 발급 시스템 구축**

1. 카카오 로그인 연동
2. Access Token 관리 시스템
3. 자동 친구 목록 동기화

---

## 📝 현재 상태

### 동작하는 기능
- ✅ 친구톡 발송 (Admin Key 사용)
- ✅ 알림톡 발송 (Solapi 사용)
- ✅ 전화번호 → UUID 변환 (DB 조회)
- ✅ 친구 그룹 관리
- ✅ 친구 그룹 타게팅 발송

### 제한된 기능
- ❌ 자동 친구 목록 동기화 (OAuth 필요)
- ⚠️ 친구 목록 미리보기 (수동 등록 필요)

---

## 🔧 즉시 적용 가능한 수정

친구 목록 동기화 버튼에 안내 메시지 추가:

```typescript
// KakaoFriendSyncStatus.tsx 수정
if (!KAKAO_ADMIN_KEY) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
      <p className="text-sm text-yellow-800">
        ⚠️ 친구 목록 자동 동기화는 OAuth 2.0 Access Token이 필요합니다.
        <br />
        현재는 수동으로 친구를 등록하거나, 전화번호로 친구 여부를 확인할 수 있습니다.
      </p>
    </div>
  );
}
```

---

## 📚 참고 자료

- [카카오 친구 목록 조회 API 문서](https://developers.kakao.com/docs/latest/ko/kakaotalk-social/rest-api)
- [카카오 OAuth 2.0 가이드](https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api)
- [카카오 비즈니스 파트너센터](https://business.kakao.com)
