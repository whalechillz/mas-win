# OCR 내용 확인 가이드

## 📋 업로드 상태 확인

### 1. 서버 재시작 (필수)
SQL 마이그레이션을 실행한 후 **반드시 로컬 서버를 재시작**해야 합니다:

```bash
# 터미널에서 Ctrl+C로 서버 중지 후
npm run dev
# 또는
yarn dev
```

### 2. Supabase 대시보드에서 확인

1. **Supabase 대시보드 접속**: https://supabase.com/dashboard
2. **Table Editor** 열기
3. **`image_assets` 테이블** 선택
4. **필터 추가**:
   - `ocr_extracted` = `true`
5. **컬럼 확인**:
   - `ocr_text`: 추출된 텍스트 전체
   - `ocr_confidence`: OCR 신뢰도 점수
   - `ocr_processed_at`: OCR 처리 시각

### 3. SQL 쿼리로 확인

Supabase SQL Editor에서 다음 쿼리 실행:

```sql
-- OCR로 처리된 모든 이미지 조회
SELECT 
  id,
  filename,
  original_filename,
  ocr_extracted,
  ocr_text,
  ocr_confidence,
  ocr_processed_at,
  cdn_url,
  created_at
FROM image_assets
WHERE ocr_extracted = true
ORDER BY ocr_processed_at DESC
LIMIT 10;
```

```sql
-- 특정 고객의 OCR 이미지 조회
SELECT 
  id,
  filename,
  original_filename,
  ocr_text,
  ocr_confidence,
  ocr_processed_at
FROM image_assets
WHERE 
  ocr_extracted = true
  AND file_path LIKE '%customer-2109%'  -- 고객 ID로 변경
ORDER BY ocr_processed_at DESC;
```

## 🔍 OCR 내용 확인 방법

### 방법 1: Supabase 대시보드 (가장 간단)

1. Supabase 대시보드 > **Table Editor**
2. `image_assets` 테이블 선택
3. `ocr_extracted = true` 필터 적용
4. 각 행의 `ocr_text` 컬럼에서 텍스트 확인

### 방법 2: API로 조회 (개발 중)

현재 OCR 텍스트를 반환하는 API는 구현되지 않았습니다. 
다음 API를 사용하여 이미지 메타데이터를 조회할 수 있습니다:

```javascript
// GET /api/admin/upload-customer-image?customerId=2109
// 응답에 ocr_text가 포함되어야 함 (현재 미구현)
```

### 방법 3: 데이터베이스 직접 조회

Node.js 스크립트 실행:

```bash
# 환경 변수 설정 후
NEXT_PUBLIC_SUPABASE_URL=your_url \
SUPABASE_SERVICE_ROLE_KEY=your_key \
node scripts/check-uploaded-ocr-images.js
```

## 🚨 문제 해결

### "Could not find the 'ocr_extracted' column" 오류가 계속 발생하는 경우

1. **서버 재시작 확인**: 로컬 서버를 완전히 중지하고 재시작했는지 확인
2. **Supabase 스키마 확인**: Supabase 대시보드에서 `image_assets` 테이블에 다음 컬럼이 있는지 확인:
   - `ocr_extracted` (BOOLEAN)
   - `ocr_text` (TEXT)
   - `ocr_confidence` (DECIMAL)
   - `ocr_processed_at` (TIMESTAMP)
3. **Supabase 클라이언트 캐시**: Supabase JS 클라이언트는 스키마를 캐시할 수 있습니다. 서버 재시작으로 해결됩니다.

### 업로드는 되었지만 OCR 텍스트가 없는 경우

1. **OCR API 호출 확인**: 서버 로그에서 `✅ [OCR] 텍스트 추출 완료` 메시지 확인
2. **메타데이터 저장 확인**: `✅ [create-customer-image-metadata] 메타데이터 저장 완료` 메시지 확인
3. **데이터베이스 직접 확인**: Supabase에서 해당 이미지의 `ocr_text` 컬럼 값 확인

## 📝 향후 개선 사항

- [ ] UI에 OCR 텍스트 표시 기능 추가
- [ ] 고객 이미지 관리 모달에 OCR 텍스트 미리보기 추가
- [ ] OCR 텍스트 검색 기능 추가
- [ ] OCR 텍스트 다운로드 기능 추가
