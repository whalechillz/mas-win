# 메타데이터 관련 변경사항 백업

## 복구 날짜: 2025-11-01

### 복구 이유
- `13e08b7` 버전에서는 메타데이터가 정상 작동했으나, 이후 복잡한 URL 매칭 로직으로 인해 메타데이터 매칭 실패 발생

### 복구된 버전
- 커밋: `13e08b7` - "refactor: 파일명 변경 기능 비활성화 및 안내 메시지 추가"
- 복구된 파일:
  - `pages/api/admin/all-images.js`
  - `pages/api/admin/image-metadata.js`

### 백업된 변경사항 (3afeb3c 버전)
- 파일명: `backup/YYYYMMDD-HHMMSS/all-images.js`
- 파일명: `backup/YYYYMMDD-HHMMSS/image-metadata.js`

### 이후 개발된 변경사항 (복구 전 버전)
1. **URL 매칭 로직 개선** (2b09b78)
   - 4단계 URL 매칭 (정확한 URL → 정규화된 URL → 파일명 추출 → file_name 직접)
   - 문제: 복잡한 로직으로 인한 매칭 실패

2. **file_name 필드 추가** (a096c26)
   - 저장 시 `file_name` 필드 추가
   - 문제: 기존 데이터에 `file_name`이 없어서 매칭 실패

3. **파일명 정규화 로직** (fbac6d1, 0e266e7, 6536161)
   - 중복 확장자 제거 (`.png.png` → `.png`)
   - 문제: 정규식 오류 및 복잡성 증가

4. **has_metadata 판단 로직 개선** (115afa3)
   - 기본값과 실제 저장된 데이터 구분
   - 문제: 너무 엄격한 판단으로 인한 false negative

### 재적용 계획
1. ✅ 기본 작동 확인 (13e08b7 버전)
2. ⏳ 단계적 개선 적용:
   - file_name 필드 추가 (기존 데이터 마이그레이션 필요)
   - 간단한 URL 매칭 로직 개선
   - 파일명 정규화 (필요시만)

### 참고
- 복구 전 마지막 커밋: `3afeb3c` - "fix: image-metadata.js fileName 오류 수정"
- 복구 후 커밋: `d56683b` - "revert: all-images.js와 image-metadata.js를 13e08b7 버전으로 복구"

