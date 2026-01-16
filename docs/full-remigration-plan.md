# 전체 재마이그레이션 계획서

## 📋 목적
2022년부터 2026년까지 모든 고객 이미지를 깨끗한 상태로 재마이그레이션하여:
- 메타데이터 완전성 보장
- 누락된 파일 제거
- 일관된 파일명 및 폴더 구조
- 스토리보드 정상 작동

## 🔍 현재 문제점 요약

### 1. 메타데이터 불완전
- `english_filename` null
- `story_scene` null
- `image_type` null

### 2. 파일 누락
- 동영상 28개 누락
- 사인 이미지 16개 미처리
- PDF 파일 미변환

### 3. 폴더 구조 불일치
- 일부 고객 폴더명 형식 불일치
- 사인 이미지 별도 폴더에 존재

## 🗑️ 1단계: 데이터 삭제

### 1.1 Supabase Storage 삭제
```bash
node scripts/delete-customers-folder.js
```

**삭제 대상**:
- `originals/customers/` 폴더 전체

### 1.2 데이터베이스 메타데이터 삭제
```sql
-- image_metadata 테이블에서 customer 관련 데이터 삭제
DELETE FROM image_metadata 
WHERE source = 'customer' 
   OR folder_path LIKE 'originals/customers/%';

-- customers 테이블 초기화
UPDATE customers 
SET folder_name = NULL, 
    name_en = NULL, 
    initials = NULL;
```

### 1.3 검증
```bash
# 삭제 확인
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { count } = await supabase
    .from('image_metadata')
    .select('*', { count: 'exact', head: true })
    .or('source.eq.customer,folder_path.like.originals/customers/%');
  console.log('남은 customer 이미지:', count);
}
check();
"
```

## 📁 2단계: 사인 이미지 정리

### 2.1 사인 이미지 고객 폴더로 이동
```bash
node scripts/organize-sign-images.js
```

**대상 폴더**: `/Users/m2/MASLABS/00.블로그_고객/사인`
**목적지**: 각 고객의 연도별 폴더 (예: `2023.08.16.송화용/`)

## 🔄 3단계: 연도별 마이그레이션

### 3.1 2022년
```bash
# migrate-all-customers.js에서 YEAR_FILTER 수정
# const YEAR_FILTER = ['2022'];

node scripts/migrate-all-customers.js
```

**예상 시간**: 10-20분
**예상 파일 수**: 약 1-5개

### 3.2 2023년
```bash
# const YEAR_FILTER = ['2023'];

node scripts/migrate-all-customers.js
```

**예상 시간**: 1-2시간
**예상 파일 수**: 약 150개

### 3.3 2024년
```bash
# const YEAR_FILTER = ['2024'];

node scripts/migrate-all-customers.js
```

**예상 시간**: 1-2시간
**예상 파일 수**: 약 200개

### 3.4 2025년
```bash
# const YEAR_FILTER = ['2025'];

node scripts/migrate-all-customers.js
```

**예상 시간**: 1-2시간
**예상 파일 수**: 약 250개

### 3.5 2026년
```bash
# const YEAR_FILTER = ['2026'];

node scripts/migrate-all-customers.js
```

**예상 시간**: 10-20분
**예상 파일 수**: 약 10개

## ✅ 4단계: 검증

### 4.1 전체 파일 점검
```bash
# 사인, 동영상 파일 체크
node scripts/verify-2022-2023-sign-video.js

# 전체 파일 1:1 점검
node scripts/verify-2022-2023-migration.js
```

### 4.2 누락 파일 마이그레이션
```bash
# 누락된 동영상 파일
node scripts/migrate-missing-videos-2022-2023.js

# 누락된 기타 파일
node scripts/migrate-missing-files-2022-2023.js
```

### 4.3 메타데이터 검증
```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verify() {
  const { data, count } = await supabase
    .from('image_metadata')
    .select('*', { count: 'exact' })
    .or('source.eq.customer,folder_path.like.originals/customers/%');
  
  const nullEnglish = data.filter(img => !img.english_filename).length;
  const nullScene = data.filter(img => !img.story_scene).length;
  const nullType = data.filter(img => !img.image_type).length;
  
  console.log('총 이미지:', count);
  console.log('english_filename null:', nullEnglish);
  console.log('story_scene null:', nullScene);
  console.log('image_type null:', nullType);
}
verify();
"
```

## 📊 예상 결과

### 성공 기준
- ✅ 모든 이미지에 `english_filename` 존재
- ✅ 모든 이미지에 `story_scene` 할당 (1-7)
- ✅ 모든 이미지에 `image_type` 할당
- ✅ PDF 파일 0개 (모두 WebP로 변환)
- ✅ 동영상 파일 모두 업로드
- ✅ 사인 이미지 모두 고객 폴더로 이동
- ✅ 갤러리에서 모든 이미지 표시
- ✅ 스토리보드에서 장면별 분류 정상 작동

### 통계
- 총 고객 수: 약 100-150명
- 총 이미지 수: 약 600-800개
- 총 동영상 수: 약 50-100개
- 총 처리 시간: 약 5-8시간

## ⚠️ 주의사항

1. **백업**: 삭제 전 현재 상태 백업 권장
2. **시간**: 전체 프로세스는 5-8시간 소요 가능
3. **검증**: 각 단계 후 검증 스크립트 실행 필수
4. **중단**: 중단 시 재시작 지점 명확히 기록

## 🚀 실행 순서

```bash
# 1. 삭제
node scripts/delete-customers-folder.js

# 2. 사인 이미지 정리
node scripts/organize-sign-images.js

# 3. 연도별 마이그레이션 (순차 실행)
# 2022년
# migrate-all-customers.js에서 YEAR_FILTER = ['2022'] 설정 후
node scripts/migrate-all-customers.js

# 2023년
# migrate-all-customers.js에서 YEAR_FILTER = ['2023'] 설정 후
node scripts/migrate-all-customers.js

# ... (2024, 2025, 2026 반복)

# 4. 검증
node scripts/verify-2022-2023-sign-video.js
node scripts/verify-2022-2023-migration.js

# 5. 누락 파일 처리
node scripts/migrate-missing-videos-2022-2023.js
node scripts/migrate-missing-files-2022-2023.js

# 6. 최종 검증
# 메타데이터 검증 스크립트 실행
```

---

**작성일**: 2026-01-16
**상태**: 실행 대기
