# 제품 이미지 마이그레이션 가이드

## 개요

제품 이미지를 새로운 구조로 마이그레이션합니다.

**기존 구조**: `/main/products/{product-slug}/`
**신규 구조**: `/originals/products/{product-slug}/{type}/`

- `detail/`: 상세페이지용 이미지 (배경 있는 이미지)
- `composition/`: 합성용 참조 이미지 (배경 없는 순수 제품)
- `gallery/`: AI 합성 결과 이미지

## 마이그레이션 단계

### 1단계: 마이그레이션 스크립트 실행

```bash
node scripts/migrate-product-images-to-new-structure.js
```

이 스크립트는:
- `public/main/products/` 폴더의 이미지를 읽어서
- 파일명 패턴으로 타입을 결정하고 (`detail`, `composition`, `gallery`)
- Supabase Storage의 새 구조로 업로드합니다
- 마이그레이션 로그를 `migration-log-product-images.json`에 저장합니다

### 2단계: 마이그레이션 검증

마이그레이션 로그를 확인하여 모든 파일이 성공적으로 업로드되었는지 확인합니다.

```bash
cat migration-log-product-images.json
```

### 3단계: 백업 및 원본 파일 삭제

마이그레이션이 성공적으로 완료되면 원본 파일을 백업하고 삭제합니다.

```bash
node scripts/backup-and-cleanup-product-images.js
```

이 스크립트는:
- 마이그레이션 로그를 읽어서 성공한 파일만 처리
- `backup/product-images/{날짜}/` 폴더에 백업
- 원본 파일 삭제
- 빈 폴더 정리

## 파일명 패턴 규칙

### Composition (합성용)
- `-sole-` 포함
- `-500` 또는 `-500-long` 포함
- `composition` 또는 `composed` 포함

### Gallery (갤러리)
- `gallery-` 접두사

### Detail (상세페이지용)
- 위 패턴에 해당하지 않는 모든 파일

## 관리자 페이지 역할

### `/admin/products`
- **역할**: 상세페이지 이미지 관리
- **Storage 경로**: `originals/products/{product-slug}/detail/`
- **기능**: 제품 상세페이지에 표시되는 이미지 업로드/삭제/순서 변경

### `/admin/product-composition`
- **역할**: 합성용 참조 이미지 관리
- **Storage 경로**: `originals/products/{product-slug}/composition/`
- **기능**: AI 합성에 사용할 참조 이미지 업로드/관리

### `/admin/ai-image-generator`
- **역할**: 갤러리 이미지 생성 및 저장
- **Storage 경로**: `originals/products/{product-slug}/gallery/`
- **기능**: 제품 합성 후 자동으로 `gallery/` 폴더에 저장

## API 변경 사항

### `pages/api/admin/upload-product-image.js`
- `imageType` 파라미터 추가 (`detail`, `composition`, `gallery`)
- 새 구조로 저장: `originals/products/{product-slug}/{imageType}/`

### `pages/api/compose-product-image.js`
- 합성 결과를 제품별 `gallery/` 폴더에 저장
- 경로: `originals/products/{product-slug}/gallery/composed-{productId}-{timestamp}.png`

## 제품 페이지 업데이트

제품 페이지는 `lib/product-image-url.ts`의 `getProductImageUrl()` 함수를 사용하여 이미지 URL을 생성합니다.

기존 경로도 자동으로 새 경로로 변환됩니다.

## 굿즈 제품 구조

굿즈 제품도 동일한 구조를 사용합니다:

```
originals/products/goods/
├── white-bucket-hat/
│   ├── detail/
│   ├── composition/
│   └── gallery/
├── navy-golf-cap/
│   ├── detail/
│   ├── composition/
│   └── gallery/
└── ...
```

## 롤백 방법

마이그레이션에 문제가 발생한 경우:

1. 백업 폴더에서 원본 파일 복원
2. `migration-log-product-images.json` 확인
3. 실패한 파일만 다시 마이그레이션

```bash
# 백업에서 복원
cp -r backup/product-images/{날짜}/main/products public/
```

