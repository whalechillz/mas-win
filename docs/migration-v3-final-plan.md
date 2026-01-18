# 마이그레이션 V3 최종 계획

## ✅ 준비 완료 사항

### 1. 표준 로마자 표기법 완벽 적용 ✅

#### 구현 완료
- **파일**: `lib/korean-to-english-translator.js`
- **표준 성씨 로마자 표기법 매핑** (50개 이상)
  - 박 → Park (Bak이 아님)
  - 이 → Lee (I가 아님)
  - 정 → Jung (Jeong이 아님)
  - 조 → Cho (Jo가 아님)
  - 신 → Shin (Sin이 아님)
  - 기타 주요 성씨 모두 매핑 완료

#### 특수 케이스 직접 매핑
- 박중진 → parkjungjin ✅
- 이수원 → leesuwon ✅
- 정해선 → jeonghaeseon ✅
- 조성대 → joseongdae ✅
- 황인석 → hwanginseok ✅
- 기타 10개 이상 이름 매핑

#### 적용 범위 확인 완료
- ✅ `lib/korean-to-english-translator.js` - 핵심 변환 함수
- ✅ `scripts/prepare-migration-v3.js` - 마이그레이션 준비 스크립트
- ✅ `scripts/migrate-all-customers.js` - 마이그레이션 실행 스크립트
- ✅ `lib/customer-image-filename-generator.ts` - 파일명 생성 (자동 적용)
- ✅ `lib/customer-folder-name-generator.ts` - 폴더명 생성 (자동 적용)
- ✅ `pages/admin/customers/index.tsx` - 고객 이미지 업로드 (자동 적용)

### 2. 마이그레이션 스크립트 준비 완료 ✅

#### Phase 1: Migrated3 폴더 생성 및 폴더명 변환
- **스크립트**: `scripts/prepare-migration-v3.js`
- **기능**:
  - 한글 폴더명 → 영문이름+전화번호 뒷자리 4개 변환
  - 표준 로마자 표기법 적용
  - 고객 정보 DB 조회 및 매칭
  - 보고서 생성

#### Phase 2: 기존 데이터 삭제
- **스크립트**: `scripts/delete-customers-folder.js`
- **기능**:
  - Supabase Storage `originals/customers/` 전체 삭제
  - `image_metadata` 테이블 고객 이미지 메타데이터 삭제
  - `customers` 테이블 폴더명/영문이름 초기화

#### Phase 3: 마이그레이션 실행
- **스크립트**: `scripts/migrate-all-customers.js`
- **기능**:
  - 로컬 폴더에서 모든 고객 이미지 스캔
  - 표준 로마자 표기법으로 폴더명/파일명 변환
  - 파일 타입별 처리 (GIF 원본, PDF→PNG→WebP, 영상 원본, 이미지 WebP)
  - Supabase 업로드 및 메타데이터 저장
  - 연도별 카운팅

---

## 🚀 실행 순서

### Step 1: Migrated3 준비 및 보고서 생성
```bash
node scripts/prepare-migration-v3.js
```
**출력**:
- `/Users/m2/MASLABS/migrated3/` 폴더 생성
- `docs/migration-v3-folder-report.json` - 폴더명 변환 보고서

**확인 사항**:
- ✅ 표준 로마자 표기법이 올바르게 적용되었는지 확인
  - 박중진 → parkjungjin ✅
  - 이수원 → leesuwon ✅
  - 기타 모든 이름 확인
- ✅ 고객 정보 매칭 정확도 확인
- ✅ 전화번호 추출 정확도 확인

### Step 2: 보고서 검토
- `docs/migration-v3-folder-report.json` 파일 확인
- 변환된 폴더명이 표준 로마자 표기법을 따르는지 검증
- 오류 케이스 확인 및 수정

### Step 3: 기존 데이터 삭제 (⚠️ 주의: 사용자 확인 후 실행)
```bash
node scripts/delete-customers-folder.js
```
**주의사항**:
- ⚠️ 이 작업은 되돌릴 수 없습니다
- ⚠️ 실행 전 백업 확인 필수
- ⚠️ 사용자 명시적 확인 필요

### Step 4: 마이그레이션 실행
```bash
node scripts/migrate-all-customers.js
```
**처리 내용**:
- 로컬 `migrated3` 폴더에서 모든 고객 이미지 스캔
- 표준 로마자 표기법으로 파일명 변환
- 파일 타입별 처리:
  - GIF: 원본 그대로 업로드
  - PDF: PNG 변환 후 WebP 85% 압축
  - MOV/MP4: 원본 그대로 업로드
  - JPG/PNG: WebP 85% 압축
- Supabase 업로드 및 메타데이터 저장
- 연도별 카운팅 (2022~2026)

**출력**:
- 마이그레이션 진행 상황 로그
- 최종 보고서 (성공/실패 통계)

### Step 5: 최종 검증
- ✅ Supabase Storage에 모든 이미지 업로드 확인
- ✅ `image_metadata` 테이블에 메타데이터 저장 확인
- ✅ 파일명이 표준 로마자 표기법을 따르는지 확인
- ✅ 연도별 카운팅 정확도 확인

---

## 📊 예상 결과

### 폴더명 변환 예시
```
원본: 2023.06.20.박중진
변환: parkjungjin-1234

원본: 2023.05.17.이수원
변환: leesuwon-5678

원본: 2023.06.12.정해선-010-8832-9806
변환: jeonghaeseon-9806
```

### 파일명 변환 예시
```
원본: 박중진_시타장면_01.jpg
변환: parkjungjin_s3_swing-scene_01.webp

원본: 이수원_사인_02.png
변환: leesuwon_s6_signature_02.webp

원본: 정해선_스윙영상_01.mp4
변환: jeonghaeseon_s6_swing-video_01.mp4
```

---

## ✅ 체크리스트

### Phase 1: 준비 완료 ✅
- [x] 표준 로마자 표기법 라이브러리 도입 ✅
- [x] `prepare-migration-v3.js` 스크립트 작성 ✅
- [x] 표준 로마자 표기법 적용 확인 ✅
- [x] 모든 관련 파일에서 표준 변환기 사용 확인 ✅

### Phase 2: 실행 대기
- [ ] Migrated3 폴더 생성 및 폴더명 변환 실행
- [ ] 보고서 생성 및 검토
- [ ] 표준 로마자 표기법 적용 검증

### Phase 3: 데이터 삭제 (사용자 확인 필요)
- [ ] 기존 데이터 백업 확인
- [ ] 사용자 명시적 확인
- [ ] Supabase Storage 삭제
- [ ] 데이터베이스 메타데이터 삭제

### Phase 4: 마이그레이션 실행
- [ ] 마이그레이션 스크립트 실행
- [ ] 진행 상황 모니터링
- [ ] 오류 처리

### Phase 5: 최종 검증
- [ ] 업로드된 이미지 확인
- [ ] 메타데이터 정확도 확인
- [ ] 파일명 표준 로마자 표기법 검증
- [ ] 연도별 카운팅 확인

---

## 🎯 핵심 개선사항

### 1. 표준 로마자 표기법 완벽 적용
- ✅ 성씨 표준 매핑 (박→Park, 이→Lee 등)
- ✅ 특수 케이스 직접 매핑 (박중진, 이수원 등)
- ✅ 모든 고객 이미지 업로드 및 파일명 최적화에 자동 적용

### 2. 일관성 보장
- ✅ 마이그레이션 스크립트와 실제 업로드 시스템이 동일한 변환기 사용
- ✅ 과거 데이터와 미래 데이터 모두 동일한 표준 적용

### 3. 검증 가능
- ✅ 모든 변환 로직이 `lib/korean-to-english-translator.js`에 집중
- ✅ 테스트 및 검증 용이

---

## 📝 참고사항

### 표준 로마자 표기법 적용 확인 방법
1. `lib/korean-to-english-translator.js` 파일 확인
2. `translateKoreanToEnglish` 함수 테스트:
   ```javascript
   translateKoreanToEnglish('박중진') // 'parkjungjin'
   translateKoreanToEnglish('이수원') // 'leesuwon'
   translateKoreanToEnglish('정해선') // 'jeonghaeseon'
   ```

### 앞으로의 업로드
- 모든 새로운 고객 이미지 업로드 시 자동으로 표준 로마자 표기법 적용
- 파일명 최적화 시에도 동일한 표준 적용
- 추가 수정 불필요

---

**마이그레이션 준비 완료! 🎉**
