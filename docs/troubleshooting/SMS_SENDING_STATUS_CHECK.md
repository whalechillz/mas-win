# SMS 발송 상태 확인 방법 (2025-11-18)

## 문제 상황

**증상:**
- 1309명에게 SMS 발송 시도
- Solapi 콘솔에 "총 200건 발송요청완료"만 표시됨
- 실제로 200개만 발송되었는지, 나머지도 발송되었는지 확인 필요

## 확인 방법

### 1. API를 통한 발송 상태 확인

#### 방법 1: 브라우저에서 직접 확인
```
http://localhost:3000/api/channels/sms/check-sending-status?messageId=<메시지ID>
```

예시:
```
http://localhost:3000/api/channels/sms/check-sending-status?messageId=81
```

#### 방법 2: curl 명령어
```bash
curl "http://localhost:3000/api/channels/sms/check-sending-status?messageId=81" | jq '.'
```

#### 방법 3: 스크립트 실행
```bash
node scripts/check-sms-sending-status.js <메시지ID>
```

예시:
```bash
node scripts/check-sms-sending-status.js 81
```

### 2. 응답 데이터 해석

#### ✅ 발송 완료인 경우
```json
{
  "success": true,
  "analysis": {
    "totalRecipients": 1309,
    "dbSentCount": 1309,
    "isComplete": true
  }
}
```

#### ❌ 발송 불완전한 경우
```json
{
  "success": true,
  "analysis": {
    "totalRecipients": 1309,
    "dbSentCount": 200,
    "missingCount": 1109,
    "isComplete": false,
    "warning": "⚠️ DB에 기록된 발송 건수(200건)가 수신자 수(1309명)보다 적습니다."
  },
  "recommendations": [
    "1. 서버 콘솔 로그에서 모든 그룹 ID 확인",
    "2. Solapi 콘솔에서 발송 날짜로 모든 그룹 검색",
    "3. 나머지 수신자에게 재발송 (필요시)"
  ]
}
```

### 3. DB에서 직접 확인

#### Supabase SQL 쿼리
```sql
SELECT 
  id,
  message_text,
  array_length(recipient_numbers, 1) as recipient_count,
  sent_count,
  success_count,
  fail_count,
  status,
  solapi_group_id,
  sent_at
FROM channel_sms
WHERE id = <메시지ID>;
```

### 4. 서버 콘솔 로그 확인

발송 시 서버 콘솔에 다음과 같은 로그가 출력됩니다:

```
📤 총 1309건을 7개 청크로 나눠서 발송 시작 (청크 크기: 200건)

============================================================
📤 청크 1/7 발송 시작
   범위: 1번째 ~ 200번째 수신자
   건수: 200건
============================================================

✅ 청크 1/7 발송 성공!
   그룹 ID: G4V20251118130500A9PFVXOUCYRU2WD

... (청크 2~7도 동일하게 진행)

📋 생성된 그룹 IDs (Solapi 콘솔에서 각각 확인 가능):
   1. G4V20251118130500A9PFVXOUCYRU2WD
   2. G4V20251118130501B9PFVXOUCYRU2WE
   3. G4V20251118130502C9PFVXOUCYRU2WF
   ...
```

## 나머지 수신자 재발송 방법

### 상황 1: 일부 청크만 발송된 경우

#### 확인 사항
1. 서버 콘솔 로그에서 실제로 발송된 청크 수 확인
2. DB의 `sent_count`와 `recipient_numbers` 길이 비교
3. Solapi 콘솔에서 발송된 그룹 수 확인

#### 재발송 방법

**방법 1: 미발송 수신자만 선별하여 재발송**
1. SMS 편집 페이지에서 해당 메시지 열기
2. `message_logs` 테이블에서 이미 발송된 번호 확인:
   ```sql
   SELECT DISTINCT customer_phone 
   FROM message_logs 
   WHERE content_id = '<메시지ID>';
   ```
3. 수신자 목록에서 이미 발송된 번호 제외
4. 나머지 수신자만 선택하여 재발송

**방법 2: 전체 재발송 (중복 방지 로직 활용)**
- `pages/api/channels/sms/send.js`의 중복 발송 방지 로직이 자동으로 이미 발송된 번호를 제외합니다
- 따라서 전체 수신자 목록으로 재발송해도 안전합니다

### 상황 2: 모든 청크가 발송되었지만 DB에 기록되지 않은 경우

#### 확인 사항
1. 서버 콘솔 로그에서 모든 청크가 성공했는지 확인
2. Solapi 콘솔에서 모든 그룹 확인
3. DB의 `sent_count` 업데이트 필요

#### 해결 방법
1. SMS 목록 페이지에서 "발송 결과 새로고침" 버튼 클릭
2. 또는 API 호출:
   ```
   GET /api/channels/sms/list?refresh=true
   ```

## Solapi 콘솔에서 확인 방법

### 1. Solapi 콘솔 접속
https://console.solapi.com/message-log

### 2. 전송요청내역 탭 클릭

### 3. 필터 설정
- **생성일**: 발송한 날짜 선택
- **타입**: MMS (또는 해당 메시지 타입)

### 4. 각 그룹 확인
- 각 그룹은 약 200건씩 발송됨
- 그룹 1: 1~200번째
- 그룹 2: 201~400번째
- 그룹 3: 401~600번째
- ... (총 7개 그룹)

### 5. 그룹 상세 확인
- 각 그룹을 클릭하면 상세 정보 확인 가능
- 성공/실패/발송중 건수 확인

## 예상 시나리오

### 시나리오 1: 모든 청크가 정상 발송됨 ✅
- **서버 로그**: 7개 청크 모두 성공
- **DB `sent_count`**: 1309건
- **Solapi 콘솔**: 7개 그룹 모두 확인 가능
- **조치**: 추가 조치 불필요

### 시나리오 2: 일부 청크만 발송됨 ❌
- **서버 로그**: 1개 청크만 성공 (또는 일부 실패)
- **DB `sent_count`**: 200건 (또는 일부)
- **Solapi 콘솔**: 1개 그룹만 확인 가능
- **조치**: 나머지 수신자 재발송 필요

### 시나리오 3: 모든 청크 발송되었지만 DB 미기록 ⚠️
- **서버 로그**: 7개 청크 모두 성공
- **DB `sent_count`**: 200건 (또는 부정확)
- **Solapi 콘솔**: 7개 그룹 모두 확인 가능
- **조치**: "발송 결과 새로고침"으로 DB 업데이트

## 참고 사항

### 중복 발송 방지
- `message_logs` 테이블을 사용하여 동일 `content_id`로 이미 발송된 번호는 자동 제외
- 재발송 시에도 중복 발송되지 않음

### 청크 발송 로직
- 200건씩 자동으로 청크 분할
- 각 청크는 순차적으로 발송
- 일부 청크 실패해도 나머지 청크는 계속 발송

### DB 업데이트
- `sent_count`: 전체 발송 시도 건수
- `success_count`: 성공 건수
- `fail_count`: 실패 건수
- `solapi_group_id`: 첫 번째 그룹 ID만 저장 (참고용)

