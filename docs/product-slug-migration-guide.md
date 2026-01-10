# 제품 Slug 마이그레이션 가이드

## 📋 개요

제품 slug를 새로운 명명 규칙에 맞춰 변경하는 마이그레이션입니다.

### Slug 변경 매핑

| 기존 Slug | 새 Slug |
|-----------|---------|
| `black-beryl` | `secret-weapon-black-muziik` |
| `black-weapon` | `secret-weapon-black` |
| `gold-weapon4` | `secret-weapon-gold-4-1` |
| `gold2` | `secret-force-gold-2` |
| `gold2-sapphire` | `secret-force-gold-2-muziik` |
| `pro3-muziik` | `secret-force-pro-3-muziik` |
| `pro3` | `secret-force-pro-3` |
| `v3` | `secret-force-v3` |

---

## 🚀 실행 순서

### 1. secret-force-common 파일 업로드

다운로드 폴더의 9개 파일을 `originals/products/secret-force-common/composition/` 폴더에 업로드합니다.

```bash
node scripts/upload-secret-force-common.js
```

**파일명 매핑:**
- `마쓰구_드라이버_2000X2000 (0).webp` → `secret-force-common-sole-01.webp`
- `마쓰구_드라이버_2000X2000 (1).webp` → `secret-force-common-sole-02.webp`
- `마쓰구_드라이버_2000X2000 (2).webp` → `secret-force-common-sole-03.webp`
- `마쓰구_드라이버_2000X2000 (3).webp` → `secret-force-common-front-face-01.webp`
- `마쓰구_드라이버_2000X2000 (4).webp` → `secret-force-common-crown-01.webp`
- `마쓰구_드라이버_2000X2000 (5).webp` → `secret-force-common-toe-01.webp`
- `마쓰구_드라이버_2000X2000 (6).webp` → `secret-force-common-back-01.webp`
- `마쓰구_드라이버_2000X2000 (7).webp` → `secret-force-common-back-02.webp`
- `마쓰구_드라이버_2000X2000 (8).webp` → `secret-force-common-back-03.webp`

---

### 2. 데이터베이스 마이그레이션

Supabase SQL Editor에서 다음 SQL 스크립트를 실행합니다:

```bash
# SQL 파일 실행
psql $DATABASE_URL -f database/migrate-product-slugs.sql
```

또는 Supabase Dashboard의 SQL Editor에서 `database/migrate-product-slugs.sql` 파일 내용을 복사하여 실행합니다.

**실행 내용:**
1. `products` 테이블 slug 업데이트
2. `product_composition` 테이블 slug 업데이트
3. `products` 테이블 이미지 경로 업데이트 (detail_images, gallery_images, composition_images)

---

### 3. Supabase Storage 폴더 마이그레이션

환경 변수가 설정된 상태에서 스크립트를 실행합니다:

```bash
# .env.local 파일 확인
cat .env.local | grep SUPABASE

# 스크립트 실행
node scripts/migrate-product-slugs.js
```

**실행 내용:**
- 기존 폴더의 모든 파일을 새 폴더로 이동
- detail, composition, gallery 하위 폴더도 함께 이동

---

### 4. 코드 파일 업데이트 (완료)

다음 파일들이 이미 업데이트되었습니다:
- ✅ `lib/product-composition.ts` - slug 및 경로 업데이트
- ✅ `pages/api/admin/upload-product-image.js` - slug 매핑 제거 (직접 사용)
- ✅ `pages/index.js` - getDefaultImages 함수 및 fallback 데이터 업데이트

---

### 5. 제품 상세 페이지 파일명 변경 (수동)

다음 파일들의 이름을 변경해야 합니다:

```bash
# 파일명 변경
mv pages/products/gold2-sapphire.tsx pages/products/secret-force-gold-2-muziik.tsx
mv pages/products/weapon-beryl.tsx pages/products/secret-weapon-black-muziik.tsx
mv pages/products/gold2.tsx pages/products/secret-force-gold-2.tsx
mv pages/products/pro3.tsx pages/products/secret-force-pro-3.tsx
mv pages/products/v3.tsx pages/products/secret-force-v3.tsx
mv pages/products/black-weapon.tsx pages/products/secret-weapon-black.tsx
mv pages/products/gold-weapon4.tsx pages/products/secret-weapon-gold-4-1.tsx
mv pages/products/pro3-muziik.tsx pages/products/secret-force-pro-3-muziik.tsx
```

각 파일 내부의 slug 참조도 업데이트해야 합니다.

---

## ⚠️ 주의사항

1. **백업 필수**: 데이터베이스와 Supabase Storage를 백업한 후 진행하세요.
2. **단계별 실행**: 각 단계를 순서대로 실행하고 결과를 확인한 후 다음 단계로 진행하세요.
3. **기존 slug 호환성**: 코드에 기존 slug에 대한 호환성 처리가 포함되어 있습니다.
4. **제품 페이지 리다이렉트**: 기존 slug로 접근하는 경우를 위해 리다이렉트를 추가하는 것을 권장합니다.

---

## ✅ 검증

마이그레이션 후 다음을 확인하세요:

1. **홈페이지 제품 표시**: `/` 페이지에서 모든 제품이 정상적으로 표시되는지 확인
2. **제품 상세 페이지**: 각 제품 상세 페이지가 정상적으로 로드되는지 확인
3. **이미지 로드**: 모든 제품 이미지가 정상적으로 로드되는지 확인
4. **제품 합성 기능**: AI 이미지 합성 기능이 정상적으로 작동하는지 확인

---

## 📝 참고

- 마이그레이션 결과는 `scripts/migrate-product-slugs-result.json`에 저장됩니다.
- secret-force-common 업로드 결과는 `scripts/upload-secret-force-common-result.json`에 저장됩니다.
