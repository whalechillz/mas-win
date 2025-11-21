# Solapi 연동 기반 SMS 복구 계획

## 1. 소프트 삭제 복구 (완료)
- `channel_sms.deleted_at` 가 `NULL`이 아닌 레코드는 목록에서 숨김 처리됨.
- ID 80, 72, 69, 66, 64 등 소프트 삭제된 메시지를 `UPDATE channel_sms SET deleted_at = NULL`로 복구 완료.
- 추후에도 숨김 해제 시 동일한 방식으로 처리.

## 2. 솔라피 API를 통한 재동기화
1. **대상 목록 추출**
   - `solapi_group_id`가 존재하지만 `deleted_at`가 NULL인 메시지 목록 조회
   - 필요 시 특정 기간/ID 범위 필터 적용
2. **그룹 상태 동기화**
   - `/api/admin/sync-solapi-status`를 메시지마다 호출
   - Solapi v4 `messages/v4/groups/{groupId}`와 `messages/v4/list?groupId=...` 응답을 사용해 `status`, `success_count`, `fail_count` 갱신
   - 스크립트: `scripts/sync-solapi-message-to-db.js` 참고
3. **일괄 동기화**
   - 여러 메시지를 동시에 처리하려면 `/api/admin/sync-all-solapi-status` 또는 맞춤 스크립트 사용
   - 실패 시 로그 수집 후 재시도

## 3. 완전 삭제된 메시지 재생성
1. **Solapi에서 발송 이력 조회**
   - API: `GET /messages/v4/list` (전체), `GET /messages/v4/groups` (그룹 목록)
   - 혹은 Playwright 스크립트 (`e2e-test/sync-solapi-from-console.js`)로 콘솔 크롤링
2. **DB 비교**
   - `solapi_group_id` 기준으로 `channel_sms`에 없는 데이터 식별
3. **레코드 재생성**
   - Solapi 응답에서 `message_text`, `type`, `recipientNumbers`, `dateCreated` 등을 추출하여 `channel_sms`에 INSERT
   - 이후 `/api/admin/sync-solapi-status`로 상태/카운트 동기화

## 4. 자동화 스크립트 제안
- `scripts/restore-soft-deleted-messages.js`: `deleted_at` 제거와 로그 작성
- `scripts/resync-solapi-groups.js`: 주어진 ID 목록 또는 기간에 대해 동기화 수행
- `scripts/recreate-from-solapi.js`: Solapi API 응답을 기반으로 누락된 메시지 재생성


