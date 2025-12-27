# 제품 관리 시스템 구현 체크리스트

## ✅ 완료된 작업

- [x] 제품 합성 관리 페이지에서 `imageType='composition'` 파라미터 추가
- [x] 데이터베이스 스키마 확장 SQL 작성
- [x] 드라이버 제품 마이그레이션 스크립트 작성
- [x] 최종 계획 문서 작성

## 🔄 진행 중

- [ ] 데이터베이스 스키마 확장 실행
- [ ] 드라이버 제품 마이그레이션 실행

## 📋 다음 단계

### 1. 데이터베이스 스키마 확장 실행

**방법 1: Supabase 대시보드에서 실행**
1. Supabase 대시보드 → SQL Editor 접속
2. `database/extend-products-table-for-drivers.sql` 파일 내용 복사
3. 실행

**방법 2: Node.js 스크립트로 실행**
```bash
node scripts/run-sql-migration.js database/extend-products-table-for-drivers.sql
```

### 2. 드라이버 제품 마이그레이션 실행

```bash
node scripts/migrate-driver-products-to-db.js
```

### 3. 제품 합성 관리 페이지 수정 확인

- [x] `handleImageUpload` 함수에 `imageType='composition'` 추가 완료
- [x] `handleReferenceImageUpload` 함수에 `imageType='composition'` 추가 완료
- [ ] 테스트: 이미지 업로드 시 올바른 폴더에 저장되는지 확인

### 4. 통합 제품 관리 페이지 개선 (예정)

- [ ] 제품 타입별 필터 추가
- [ ] 드라이버 제품 관리 기능 추가
- [ ] 이미지 타입별 탭 구조 구현

### 5. 메인 페이지 연동 (예정)

- [ ] `pages/index.js` 하드코딩 제거
- [ ] 데이터베이스에서 제품 로드
- [ ] 이미지 경로를 Supabase Storage URL로 변경

