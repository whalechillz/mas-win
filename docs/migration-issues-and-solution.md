# 마이그레이션 문제점 및 해결 방안

## 📋 현재 발견된 문제점

### 1. 5명 고객 이미지/스토리보드 문제
**고객**: 송화용, 강병부, 하종천, 조성대, 김한구

**문제점**:
- `english_filename`이 `null`인 이미지가 다수 존재
- `story_scene`이 `null`인 이미지가 다수 존재
- 이미지가 갤러리에 표시되지 않음
- 스토리보드에서 장면별 분류가 안 됨

**원인 분석**:
1. 초기 마이그레이션 시 메타데이터가 불완전하게 저장됨
2. PDF 파일이 이미지로 변환되지 않고 그대로 남아있음
3. 동영상 파일이 누락됨 (28개)
4. 사인 이미지가 별도 폴더에 있어서 마이그레이션되지 않음

### 2. 사인 이미지 정리 문제
- `/Users/m2/MASLABS/00.블로그_고객/사인` 폴더에 16개 PNG 파일 존재
- 파일명 형식: `고객이름_사인.png`
- 정규식 매칭 실패로 고객 폴더로 이동되지 않음

### 3. 동영상 파일 누락
- 2023년 기준 30개 동영상 파일 중 28개가 DB에 없음
- 마이그레이션 스크립트가 동영상 파일을 제대로 처리하지 못함

### 4. PDF 파일 처리 문제
- 일부 고객의 PDF 파일이 이미지로 변환되지 않음
- PDF 파일이 그대로 남아있어서 이미지로 표시되지 않음

## 🔧 해결 방안

### 옵션 1: 전체 삭제 후 재마이그레이션 (권장)

**장점**:
- 깨끗한 상태에서 시작
- 일관된 메타데이터 구조
- 누락된 파일 없이 완전한 마이그레이션

**단계**:
1. Supabase Storage의 `originals/customers/` 폴더 전체 삭제
2. `image_metadata` 테이블에서 `source='customer'` 또는 `folder_path LIKE 'originals/customers/%'` 데이터 삭제
3. `customers` 테이블의 `folder_name`, `name_en`, `initials` 컬럼 초기화
4. 2022년부터 순차적으로 재마이그레이션

**스크립트**:
- `scripts/delete-customers-folder.js` (이미 존재)
- `scripts/migrate-all-customers.js` (YEAR_FILTER로 연도별 실행)

### 옵션 2: 부분 수정 (비권장)

**단점**:
- 기존 데이터와 새 데이터의 불일치 가능성
- 누락된 파일을 찾기 어려움
- 메타데이터 일관성 문제

## 📝 재마이그레이션 계획

### 1단계: 데이터 삭제
```bash
# Supabase Storage 삭제
node scripts/delete-customers-folder.js

# 또는 수동으로:
# - Supabase Dashboard에서 originals/customers/ 폴더 삭제
# - image_metadata 테이블에서 customer 관련 데이터 삭제
# - customers 테이블의 folder_name, name_en, initials 초기화
```

### 2단계: 사인 이미지 정리
```bash
# 사인 폴더의 이미지를 고객 폴더로 이동
node scripts/organize-sign-images.js
```

### 3단계: 연도별 마이그레이션
```bash
# 2022년
YEAR_FILTER=['2022'] node scripts/migrate-all-customers.js

# 2023년
YEAR_FILTER=['2023'] node scripts/migrate-all-customers.js

# 2024년
YEAR_FILTER=['2024'] node scripts/migrate-all-customers.js

# 2025년
YEAR_FILTER=['2025'] node scripts/migrate-all-customers.js

# 2026년
YEAR_FILTER=['2026'] node scripts/migrate-all-customers.js
```

### 4단계: 검증
```bash
# 전체 파일 점검
node scripts/verify-2022-2023-sign-video.js

# 누락된 파일 마이그레이션
node scripts/migrate-missing-videos-2022-2023.js
```

## 🎯 개선 사항

### migrate-all-customers.js 개선
1. ✅ PDF 파일 자동 삭제 및 PNG 변환
2. ✅ 동영상 파일 처리 추가
3. ✅ 사인 이미지 인식 개선
4. ✅ 메타데이터 완전성 보장 (english_filename, story_scene 필수)

### organize-sign-images.js 개선
1. ✅ 정규식 수정 (Unicode 정규화 고려)
2. ✅ 고객 폴더 찾기 로직 개선

## 📊 예상 결과

재마이그레이션 후:
- 모든 이미지에 `english_filename` 존재
- 모든 이미지에 `story_scene` 할당 (1-7)
- 모든 이미지에 `image_type` 할당
- PDF 파일은 모두 WebP로 변환
- 동영상 파일 모두 업로드
- 사인 이미지 모두 고객 폴더로 이동

## ⚠️ 주의사항

1. **백업**: 삭제 전에 현재 상태를 백업하는 것을 권장
2. **시간**: 전체 재마이그레이션은 시간이 소요될 수 있음
3. **검증**: 각 연도 마이그레이션 후 검증 스크립트 실행

---

**작성일**: 2026-01-16
**상태**: 검토 필요
