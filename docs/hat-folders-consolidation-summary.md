# hat-* 폴더 정리 작업 완료 보고서

## 작업 일시
2026-01-03

## 작업 목표
- `hat-black-bucket`, `hat-white-bucket`, `hat-white-golf` 폴더 정리
- 모든 버킷햇 이미지를 `bucket-hat-muziik/gallery/`로 통합

## 작업 결과

### 1. 이미지 이동

#### hat-black-bucket → bucket-hat-muziik/gallery
- **이동 완료**: 2개 이미지
  - `composed-1-a10ed3c2-fd40-4dae-8063-7b245ab7b2f2-1767061550580.png`
  - `composed-1-a10ed3c2-fd40-4dae-8063-7b245ab7b2f2-1767338691526.png`

#### hat-white-bucket → bucket-hat-muziik/gallery
- **이동 완료**: 1개 이미지
  - `composed-1-d1d615b7-9b7a-4ec8-b8fb-4296aa3ae964-1767061647996.png`

### 2. 폴더 삭제

#### hat-white-golf
- 폴더가 비어있어서 삭제할 파일 없음

#### hat-black-bucket, hat-white-bucket
- 모든 이미지 이동 완료 후 빈 폴더 상태
- Supabase Storage는 빈 폴더가 자동으로 사라지므로 별도 삭제 작업 불필요

### 3. DB 업데이트

#### product_composition 테이블
- **비활성화 완료**: 3개 제품
  1. `MASSGOO 버킷햇 (화이트)` (slug: `hat-white-bucket`)
  2. `MASSGOO 버킷햇 (블랙)` (slug: `hat-black-bucket`)
  3. `MASSGOO 골프모자 (화이트)` (slug: `hat-white-golf`)

## 최종 폴더 구조

```
originals/goods/
├── bucket-hat-muziik/          # 버킷햇 통합 폴더
│   ├── gallery/                # 모든 버킷햇 이미지 (survey + 합성 결과)
│   │   ├── [기존 12개 이미지]
│   │   ├── composed-1-a10ed3c2-fd40-4dae-8063-7b245ab7b2f2-1767061550580.png (이동됨)
│   │   ├── composed-1-a10ed3c2-fd40-4dae-8063-7b245ab7b2f2-1767338691526.png (이동됨)
│   │   └── composed-1-d1d615b7-9b7a-4ec8-b8fb-4296aa3ae964-1767061647996.png (이동됨)
│   ├── composition/            # 합성용 참조 이미지
│   └── detail/                 # 상세페이지 이미지 (필요시)
│
├── golf-hat-muziik/            # 골프모자 (변경 없음)
│   ├── gallery/
│   ├── composition/
│   └── detail/
│
└── [기타 굿즈 폴더들...]
```

## 작업 파일

- **스크립트**: `scripts/consolidate-hat-folders.js`
- **결과 파일**: `scripts/consolidate-hat-folders-result.json`
- **DB 확인 SQL**: 
  - `database/check-hat-folders-before-consolidation.sql`
  - `database/verify-hat-folders-consolidation.sql`

## 다음 단계

1. ✅ Survey 페이지 이미지 로드 확인 (`bucket-hat-muziik`의 `gallery_images` 확인)
2. ✅ 제품 합성 관리에서 이미지 선택 테스트
3. ✅ 빈 폴더 자동 삭제 확인 (Supabase Storage)

## 참고사항

- `hat-*` slug를 사용하는 제품은 `product_composition` 테이블에서 비활성화되었습니다.
- 향후 이 제품들을 다시 사용하려면 `is_active = true`로 변경하거나 새로운 slug로 재생성해야 합니다.
- `bucket-hat-muziik/gallery/` 폴더에 총 15개 이미지가 있습니다 (기존 12개 + 이동 3개).

