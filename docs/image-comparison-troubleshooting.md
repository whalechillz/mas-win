# 이미지 비교 기능 문제 해결 가이드

## 개요

이미지 비교 기능은 `image_assets` 테이블에 등록된 이미지만 사용할 수 있습니다. Storage에 파일이 있어도 `image_assets` 테이블에 등록되지 않으면 비교가 불가능합니다.

## 비교 불가능한 이미지의 원인

### 1. 자동 등록 실패
- **원인**: DB 오류, 권한 문제, 네트워크 오류 등
- **증상**: 콘솔에 `❌ 자동 등록 실패` 메시지 표시
- **해결**: 아래 "해결 방법" 참조

### 2. 아직 조회되지 않은 이미지
- **원인**: 갤러리에서 해당 폴더를 열어보지 않아 자동 등록이 실행되지 않음
- **증상**: 이미지에 `id`가 `null`이거나 `temp-`로 시작
- **해결**: 갤러리에서 해당 폴더를 열어 자동 등록 실행

### 3. 임시 ID (`temp-`)를 가진 이미지
- **원인**: 아직 업로드 중이거나 저장되지 않은 이미지
- **증상**: 이미지 ID가 `temp-`로 시작
- **해결**: 페이지 새로고침 후 다시 시도

### 4. `image_assets` 테이블이 없는 경우
- **원인**: Supabase에 테이블이 생성되지 않음
- **증상**: 자동 등록 시도 시 에러 발생
- **해결**: `supabase-image-tables-manual.sql` 실행

## 해결 방법

### 방법 1: 자동 등록 (권장)

갤러리 관리에서 해당 폴더를 열면 자동으로 등록됩니다:

1. 갤러리 관리 접속
2. 문제가 있는 폴더 열기 (예: `/blog`, `/daily-branding`)
3. 이미지 목록이 로드되면 자동 등록 실행
4. 콘솔에서 `✅ 자동 등록 완료` 메시지 확인

**장점**:
- 자동으로 실행됨
- 메타데이터도 함께 등록됨
- 실시간으로 처리됨

**단점**:
- 폴더를 하나씩 열어야 함
- 많은 이미지가 있으면 시간이 걸림

### 방법 2: 일괄 등록 API 사용

특정 폴더의 모든 이미지를 한 번에 등록:

```bash
# POST 요청 예시
curl -X POST http://localhost:3000/api/admin/batch-register-images \
  -H "Content-Type: application/json" \
  -d '{
    "folderPath": "originals/blog",
    "limit": 100,
    "dryRun": false
  }'
```

**파라미터**:
- `folderPath`: 등록할 폴더 경로 (빈 문자열이면 전체)
- `limit`: 한 번에 등록할 최대 이미지 수 (기본값: 100)
- `dryRun`: `true`면 실제 등록 없이 확인만 (기본값: `false`)

**응답 예시**:
```json
{
  "success": true,
  "message": "50개 이미지 등록 완료",
  "results": {
    "total": 100,
    "registered": 50,
    "alreadyExists": 45,
    "failed": 5,
    "details": [...]
  }
}
```

**장점**:
- 한 번에 많은 이미지 등록 가능
- Dry Run으로 미리 확인 가능
- 폴더별로 선택적 등록 가능

**단점**:
- API 호출 필요
- 메타데이터가 기본값으로만 저장됨

### 방법 3: 등록 상태 검토 API 사용

등록되지 않은 이미지의 수와 통계를 확인:

```bash
# GET 요청 예시
curl http://localhost:3000/api/admin/check-image-registration-status?folderPath=originals/blog&sampleSize=1000
```

**파라미터**:
- `folderPath`: 검토할 폴더 경로 (빈 문자열이면 전체)
- `sampleSize`: 샘플링할 최대 이미지 수 (기본값: 1000)

**응답 예시**:
```json
{
  "success": true,
  "message": "검토 완료: 25개 이미지가 등록되지 않았습니다.",
  "results": {
    "total": 100,
    "registered": 75,
    "missing": 25,
    "registrationRate": 75.00,
    "folderStats": [
      {
        "folder": "originals",
        "total": 50,
        "registered": 40,
        "missing": 10,
        "registrationRate": 80.00,
        "totalSizeMB": 125.50,
        "subFolders": [...]
      }
    ],
    "uploadSourceStats": {
      "auto_registered": 30,
      "batch_registered": 20,
      "manual": 25
    },
    "missingImages": [...]
  }
}
```

## 비교 불가능한 이미지 처리 절차

### 1단계: 문제 확인

1. 갤러리에서 이미지 선택
2. "비교" 또는 "상세 보기" 버튼 클릭
3. 에러 메시지 확인:
   - `"선택한 이미지가 아직 데이터베이스에 저장되지 않았습니다"` → 등록 필요
   - `"일부 이미지를 찾을 수 없습니다"` → 등록 실패 또는 ID 불일치

### 2단계: 등록 상태 확인

등록 상태 검토 API로 확인:

```javascript
// 브라우저 콘솔에서 실행
fetch('/api/admin/check-image-registration-status?folderPath=originals/blog')
  .then(res => res.json())
  .then(data => console.log(data));
```

### 3단계: 일괄 등록 실행

등록되지 않은 이미지가 많으면 일괄 등록:

```javascript
// 브라우저 콘솔에서 실행
fetch('/api/admin/batch-register-images', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    folderPath: 'originals/blog',
    limit: 100,
    dryRun: false
  })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

### 4단계: 재확인

1. 페이지 새로고침
2. 이미지 선택 후 비교 버튼 클릭
3. 정상 작동 확인

## 예방 방법

### 1. 자동 등록 기능 활용

`all-images.js`의 자동 등록 기능이 활성화되어 있으므로, 갤러리에서 폴더를 열면 자동으로 등록됩니다.

### 2. 정기적인 검토

주기적으로 등록 상태를 확인하여 누락된 이미지를 찾아 등록:

```bash
# 매주 실행 권장
node scripts/check-missing-image-assets.js
```

### 3. 업로드 시 즉시 등록

새 이미지를 업로드할 때 `image_assets`에 즉시 등록되도록 업로드 API를 수정 (이미 구현됨).

## FAQ

### Q: 모든 이미지를 한 번에 등록할 수 있나요?

A: 네, `batch-register-images` API에서 `folderPath`를 빈 문자열로 설정하면 전체 이미지를 등록할 수 있습니다. 다만 많은 이미지가 있으면 시간이 오래 걸릴 수 있으므로 `limit` 파라미터로 제한하는 것을 권장합니다.

### Q: 등록 실패한 이미지는 어떻게 하나요?

A: 등록 실패 원인을 확인하고 수동으로 등록하거나, 갤러리에서 해당 이미지를 다시 열어 자동 등록을 시도하세요. 반복 실패 시 Supabase 로그를 확인하세요.

### Q: 비교 기능이 여전히 작동하지 않아요.

A: 다음을 확인하세요:
1. `image_assets` 테이블이 존재하는지
2. 이미지에 유효한 `id`가 있는지 (콘솔에서 확인)
3. 임시 ID(`temp-`)가 아닌지
4. 페이지를 새로고침했는지

### Q: 자동 등록이 너무 느려요.

A: 많은 이미지가 있는 폴더는 일괄 등록 API를 사용하는 것이 더 빠릅니다. 자동 등록은 이미지 조회 시마다 실행되므로 느릴 수 있습니다.

## 관련 파일

- `pages/api/admin/all-images.js`: 자동 등록 로직
- `pages/api/admin/batch-register-images.js`: 일괄 등록 API
- `pages/api/admin/check-image-registration-status.js`: 등록 상태 검토 API
- `pages/api/admin/compare-images.js`: 이미지 비교 API
- `pages/admin/gallery.tsx`: 갤러리 UI 및 비교 기능

