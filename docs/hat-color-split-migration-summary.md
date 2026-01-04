# 모자 제품 색상별 분리 마이그레이션 요약

## 작업 완료 내역

### 1. 이미지 폴더 분리
- ✅ **버킷햇 composition 폴더**: 2개 이미지 색상별 분리 완료
  - `black-bucket-hat.webp` → `bucket-hat-muziik-black/composition/`
  - `white-bucket-hat.webp` → `bucket-hat-muziik-white/composition/`
- ✅ **골프모자 composition 폴더**: 4개 이미지 색상별 분리 완료
  - `black-golf-cap.webp` → `golf-hat-muziik-black/composition/`
  - `white-golf-cap.webp` → `golf-hat-muziik-white/composition/`
  - `navy-golf-cap.webp` → `golf-hat-muziik-navy/composition/`
  - `beige-golf-cap.webp` → `golf-hat-muziik-beige/composition/`

### 2. Gallery 폴더 이미지 처리
- ⚠️ **주의**: Gallery 폴더의 이미지들은 파일명에 색상 정보가 없어 자동 분류되지 않았습니다.
- 총 22개 이미지 (버킷햇 15개, 골프모자 7개)가 분류되지 않음
- **해결 방법**:
  1. 수동으로 이미지를 확인하여 색상별 폴더로 이동
  2. 또는 이미지 메타데이터나 DB 정보를 활용하여 자동 분류

### 3. 코드 수정 완료
- ✅ Survey 페이지 API 수정: `/api/products/survey-hats` 생성
- ✅ Survey 페이지 수정: 여러 색상 제품의 gallery_images 합치기
- ✅ 업로드 API 수정: 전체 Supabase URL 반환
- ✅ 제품 합성 관리 페이지: slug 기반 폴더 경로 수정

## 다음 단계

### 1. DB 마이그레이션 실행
다음 SQL 스크립트를 Supabase SQL Editor에서 실행하세요:

1. `database/migrate-hat-products-by-color.sql` - 제품 분리 및 생성
2. `database/convert-image-urls-to-full-urls.sql` - 이미지 URL 전체 URL로 변환

### 2. Gallery 이미지 수동 분류 (선택사항)
Gallery 폴더의 이미지들을 수동으로 확인하여 색상별 폴더로 이동하거나, 
각 제품의 `gallery_images` 필드를 업데이트하여 올바른 경로를 지정하세요.

### 3. 제품 합성 관리에서 이미지 경로 확인
각 색상별 제품의 `image_url`과 `reference_images`가 올바른 경로를 가리키는지 확인하세요.

## 파일 구조

### 버킷햇
```
originals/goods/
├── bucket-hat-muziik-black/
│   ├── gallery/     (수동 분류 필요)
│   └── composition/ ✅ 완료
└── bucket-hat-muziik-white/
    ├── gallery/     (수동 분류 필요)
    └── composition/ ✅ 완료
```

### 골프모자
```
originals/goods/
├── golf-hat-muziik-black/
│   ├── gallery/     (수동 분류 필요)
│   └── composition/ ✅ 완료
├── golf-hat-muziik-white/
│   ├── gallery/     (수동 분류 필요)
│   └── composition/ ✅ 완료
├── golf-hat-muziik-navy/
│   ├── gallery/     (수동 분류 필요)
│   └── composition/ ✅ 완료
└── golf-hat-muziik-beige/
    ├── gallery/     (수동 분류 필요)
    └── composition/ ✅ 완료
```

## 참고사항

- Gallery 이미지는 Survey 페이지에서 사용되므로, 각 색상별 제품의 `gallery_images` 필드에 올바른 경로가 저장되어야 합니다.
- 이미지 URL은 전체 Supabase URL로 변환되어야 합니다.
- 제품 합성 관리에서 각 색상별 제품을 선택할 수 있도록 `product_composition` 테이블이 업데이트되어야 합니다.

