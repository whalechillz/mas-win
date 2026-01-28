# 고객 이미지 마이그레이션 계획 (Storage 97개 폴더 기준)

## 목표
Storage에 존재하는 97개의 고객 폴더를 기준으로:
1. ✅ customers 테이블의 folder_name과 매칭 (41개 성공, 55개 실패)
2. ⚠️ 매칭되지 않은 55개 폴더 처리
3. 각 폴더의 모든 이미지를 image_assets 테이블에 등록
4. ai_tags에 customer-{id} 태그 추가
5. cdn_url 생성/업데이트
6. 이미지와 고객이 정확히 연결되도록 보장

## 현재 상황

### Storage
- **고객 폴더 수**: 96개 (실제로는 97개, .keep.png 제외)
- **폴더 경로**: `originals/customers/{folder_name}/`
- **하위 구조**: 날짜별 폴더 (`YYYY-MM-DD/`) 또는 직접 파일

### customers 테이블
- **총 고객 수**: 1000+ 명
- **folder_name 있는 고객**: 994명
- **Storage 폴더와 매칭**: 41개 ✅
- **매칭 실패**: 55개 ⚠️

### image_assets 테이블
- **이미지 있는 고객**: 28명 (동영상 제외)
- **누락 가능성**: Storage에 이미지가 있지만 image_assets에 등록되지 않은 경우

## 마이그레이션 단계

### ✅ Phase 1: Storage 폴더와 customers 테이블 매칭 (완료)

**결과**:
- 총 Storage 폴더: 96개
- 매칭 성공: 41개
- 매칭 실패: 55개

**매칭 결과 파일**: `scripts/storage-customers-match-result.json`

### ⚠️ Phase 2: 매칭되지 않은 폴더 처리 (필수)

**목표**: 55개 매칭 실패 폴더를 customers 테이블과 연결

**옵션**:
1. **폴더명 기반 고객 생성** (권장하지 않음 - 실제 고객이 아닐 수 있음)
2. **폴더명 수정하여 기존 고객과 매칭** (수동 확인 필요)
3. **매칭 불가능한 폴더는 스킵** (이미지만 등록, 고객 연결 없음)

**권장 방법**:
- 매칭 실패 폴더 목록을 확인하고, 수동으로 customers 테이블의 folder_name 업데이트
- 또는 폴더명을 기반으로 customers 테이블에서 유사한 고객 찾기

**스크립트**: `scripts/fix-unmatched-folders.js` (생성 필요)

### Phase 3: 각 폴더의 이미지 스캔 및 등록 (핵심)

**목표**: Storage의 모든 고객 이미지를 image_assets에 등록

**작업**:
1. 각 고객 폴더를 재귀적으로 스캔
2. 모든 이미지/비디오 파일 발견
3. 각 파일에 대해:
   - `file_path`로 image_assets에 존재 여부 확인
   - 없으면 새로 등록
   - 있으면 ai_tags와 cdn_url 업데이트
   - `customer-{id}` 태그 추가/확인 (매칭된 경우만)

**스크립트**: `scripts/migrate-all-customer-images-from-storage.js` ✅

### Phase 4: 데이터 검증 및 복구

**목표**: 마이그레이션 결과 검증 및 누락 데이터 복구

**작업**:
1. Storage의 모든 이미지가 image_assets에 등록되었는지 확인
2. ai_tags에 customer-{id} 태그가 있는지 확인 (매칭된 경우)
3. cdn_url이 정상적으로 생성되었는지 확인
4. 누락된 데이터 자동 복구

**스크립트**: `scripts/verify-customer-image-migration.js` (생성 필요)

## 실행 순서

```bash
# 1. Storage 폴더와 customers 매칭 (완료)
node scripts/match-storage-folders-to-customers.js

# 2. 매칭되지 않은 폴더 처리 (수동 또는 스크립트)
# - scripts/storage-customers-match-result.json 확인
# - customers 테이블의 folder_name 수동 업데이트 또는
# - node scripts/fix-unmatched-folders.js (생성 필요)

# 3. 모든 고객 이미지 마이그레이션
node scripts/migrate-all-customer-images-from-storage.js

# 4. 검증 및 복구
node scripts/verify-customer-image-migration.js (생성 필요)
```

## 예상 결과

### 성공 기준
- ✅ Storage의 97개 폴더 모두 customers 테이블과 매칭 (또는 최대한 매칭)
- ✅ 각 폴더의 모든 이미지가 image_assets에 등록
- ✅ 매칭된 고객의 이미지에 customer-{id} 태그 존재
- ✅ 모든 이미지에 cdn_url 생성
- ✅ 고객 관리에서 모든 이미지 정상 표시

### 통계 목표
- **매칭된 고객**: 41명 이상 (최대 97명)
- **등록된 이미지**: Storage의 모든 이미지
- **태그 완료율**: 매칭된 고객의 이미지 100%
- **URL 생성 완료율**: 100%

## 주의사항

1. **중복 방지**: 같은 file_path로 여러 번 등록되지 않도록 주의
2. **기존 데이터 보존**: 이미 등록된 이미지의 다른 태그나 메타데이터 보존
3. **에러 처리**: 개별 파일 처리 실패 시에도 전체 프로세스 계속 진행
4. **로깅**: 각 단계별 상세 로그 기록
5. **백업**: 마이그레이션 전 image_assets 테이블 백업 권장
6. **매칭 실패 폴더**: 55개 폴더는 수동 확인 후 처리 필요

## 롤백 계획

문제 발생 시:
1. 마이그레이션 중 생성된 레코드 삭제 (upload_source = 'customer-migration' 필터)
2. 백업에서 복원
3. 단계별 재실행

## 다음 단계

1. ✅ 매칭 결과 확인: `scripts/storage-customers-match-result.json`
2. ⚠️ 매칭 실패 폴더 55개 처리 방법 결정
3. ✅ 이미지 마이그레이션 스크립트 실행
4. 검증 스크립트 실행
