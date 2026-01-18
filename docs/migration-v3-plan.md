# 마이그레이션 V3 최종 계획

## 📋 개요
표준 로마자 표기법을 도입하여 모든 고객 이미지를 재마이그레이션합니다.

---

## 🎯 주요 변경사항

### 1. 표준 로마자 표기법 도입 ✅ 완료
- 기존: 간단한 초성-중성-종성 기반 변환
- 변경: **국립국어원 표준 로마자 표기법 (Revised Romanization of Korean) 적용**
- 표준 성씨 로마자 표기법 매핑 추가:
  - 박 → Park (Bak이 아님)
  - 이 → Lee (I가 아님)
  - 정 → Jung (Jeong이 아님)
  - 조 → Cho (Jo가 아님)
  - 신 → Shin (Sin이 아님)
  - 기타 주요 성씨 50개 이상 매핑
- 특수 케이스 직접 매핑:
  - 박중진 → parkjungjin ✅
  - 이수원 → leesuwon ✅
  - 정해선 → jeonghaeseon ✅
  - 조성대 → joseongdae ✅
  - 기타 10개 이상 이름 매핑
- 적용 범위:
  - ✅ `lib/korean-to-english-translator.js` - 표준 로마자 표기법 적용
  - ✅ `scripts/prepare-migration-v3.js` - 마이그레이션 준비 스크립트
  - ✅ `scripts/migrate-all-customers.js` - 마이그레이션 실행 스크립트
  - ✅ `lib/customer-image-filename-generator.ts` - 파일명 생성 (자동 적용)
  - ✅ `lib/customer-folder-name-generator.ts` - 폴더명 생성 (자동 적용)
  - ✅ `pages/admin/customers/index.tsx` - 고객 이미지 업로드 (자동 적용)

### 2. 파일 처리 규칙 개선
- **GIF**: 원본 그대로 업로드 (변환 없음)
- **PDF**: 업로드하지 않음, PNG 변환본만 사용 → WebP 85% 압축
- **영상 (MOV, MP4)**: 원본 그대로 업로드, 파일명만 커스터마이징
- **일반 이미지**: WebP 85% 압축

### 3. 파일명 형식
```
{영문이름전체}_s{장면코드}_{타입}_{번호}.{확장자}
```
예: `joseotdae_s3_swing-scene_01.webp`, `jeonghaeseon_s6_signature_01.webp`

### 4. 연도별 카운팅
- 2022년, 2023년, 2024년, 2025년, 2026년별 통계

---

## 📂 단계별 실행 계획

### Phase 1: Migrated3 폴더 생성 및 폴더명 변환 (1단계)

#### 목적
한글 폴더명을 영문이름+전화번호 뒷자리 4개로 변환하고 보고서 생성

#### 작업 내용
1. **Migrated3 폴더 생성**
   - 소스: `/Users/m2/MASLABS/00.blog_customers/`
   - 대상: `/Users/m2/MASLABS/migrated3/`
   - 연도별 폴더 구조 유지 (2022, 2023, 2024, 2025, 2026)

2. **폴더명 변환**
   - 입력: 한글 고객명 폴더 (예: `조성대`, `정해선`)
   - 출력: 영문이름+전화번호 뒷자리 4개 (예: `joseotdae-7010`, `jeonghaeseon-0712`)
   - 표준 로마자 표기법 적용

3. **보고서 생성**
   - 총 폴더 수
   - 성공/실패/스킵 건수
   - 변환 전/후 폴더명 목록
   - 오류 상세 내역
   - 고객 정보가 없는 폴더 목록

#### 스크립트
- `scripts/prepare-migration-v3.js`

#### 출력
- `docs/migration-v3-folder-report.json` (또는 CSV)

---

### Phase 2: 기존 데이터 삭제

#### 작업 내용
1. **Supabase Storage 삭제**
   - `originals/customers/` 폴더 전체 삭제
   - 모든 하위 폴더 및 파일 삭제

2. **데이터베이스 메타데이터 삭제**
   - `image_metadata` 테이블에서 `folder_path`가 `originals/customers/`로 시작하는 모든 레코드 삭제

#### 스크립트
- `scripts/delete-existing-customers.js` (기존 스크립트 재사용 가능)

---

### Phase 3: 마이그레이션 실행

#### 파일 처리 규칙 상세

| 파일 타입 | 처리 방법 | 압축률 | 확장자 |
|----------|---------|--------|--------|
| GIF | 원본 그대로 | - | `.gif` |
| PDF | 업로드 안함 | - | - |
| PNG (PDF 변환본) | WebP 변환 | 85% | `.webp` |
| MOV, MP4 | 원본 그대로 | - | `.mov`, `.mp4` |
| JPG, PNG | WebP 변환 | 85% | `.webp` |
| 기타 이미지 | WebP 변환 | 85% | `.webp` |

#### 파일명 생성 규칙
```
{영문이름전체}_s{장면코드}_{타입}_{번호}.{확장자}
```

**예시:**
- `joseotdae_s3_swing-scene_01.webp`
- `jeonghaeseon_s6_signature_01.webp`
- `jangjinsu_s3_swing-video_01.mp4`
- `kimseonae_s1_hero_01.gif`

#### 연도별 카운팅
- 각 연도별로 파일 수 집계
- 최종 보고서에 포함

#### 스크립트
- `scripts/migrate-all-customers-v3.js`

---

### Phase 4: 최종 보고서 생성

#### 보고서 항목
1. **전체 통계**
   - 총 고객 수
   - 성공/실패/스킵 수
   - 총 파일 수

2. **연도별 통계**
   - 2022년: X개
   - 2023년: X개
   - 2024년: X개
   - 2025년: X개
   - 2026년: X개

3. **파일 타입별 통계**
   - WebP: X개
   - GIF: X개
   - MP4: X개
   - MOV: X개
   - 기타: X개

4. **오류 상세 내역**
   - 업로드 실패 파일
   - 스킵된 고객
   - 패턴 매칭 실패 파일

5. **변환 통계**
   - 폴더명 변환 성공/실패
   - 파일명 변환 성공/실패

---

## 🛠 기술 스택

### 표준 로마자 표기법 ✅ 완료
**구현 방식: 국립국어원 표준 직접 구현 (하이브리드)**
- ✅ 표준 성씨 로마자 표기법 매핑 테이블 (50개 이상)
- ✅ 특수 케이스 전체 이름 직접 매핑 (10개 이상)
- ✅ 표준 로마자 표기법 (Revised Romanization of Korean) 문자별 변환 로직
- ✅ 우선순위:
  1. 전체 이름 직접 매핑 (예: "박중진" → "parkjungjin")
  2. 성씨 표준 매핑 + 이름 표준 변환 (예: "박" → "park", "중진" → "jungjin")
  3. 일반 표준 로마자 표기법 변환

**적용 위치:**
- `lib/korean-to-english-translator.js` - 핵심 변환 함수
- 모든 고객 이미지 업로드 및 파일명 최적화 자동 적용

### 파일 처리 라이브러리
- **Sharp**: 이미지 변환 (PNG → WebP 85%)
- **원본 유지**: GIF, MOV, MP4
- **PDF 처리**: PNG 변환본만 사용

---

## 📁 스크립트 구조

```
scripts/
├── prepare-migration-v3.js      # Phase 1: Migrated3 폴더 생성 및 폴더명 변환
├── delete-existing-customers.js   # Phase 2: 기존 데이터 삭제 (기존 스크립트)
└── migrate-all-customers-v3.js    # Phase 3: 마이그레이션 실행
```

---

## 🚀 실행 순서

### Step 1: Migrated3 준비 및 보고서 생성
```bash
node scripts/prepare-migration-v3.js
```
→ `docs/migration-v3-folder-report.json` 생성

### Step 2: 보고서 검토
- 사용자가 보고서 확인
- 오류 케이스 검토
- 수정 필요사항 확인

### Step 3: 기존 데이터 삭제 (사용자 확인 후)
```bash
node scripts/delete-existing-customers.js
```

### Step 4: 마이그레이션 실행
```bash
node scripts/migrate-all-customers-v3.js
```

### Step 5: 최종 보고서 확인
- 마이그레이션 결과 보고서 확인
- 오류 처리

---

## ⚠️ 주의사항

1. **백업 필수**
   - 기존 데이터 삭제 전 백업 확인
   - Migrated3 폴더는 원본 보존

2. **단계별 확인**
   - Phase 1 완료 후 보고서 확인 필수
   - Phase 2 실행 전 사용자 확인 필요

3. **오류 처리**
   - 업로드 실패 파일은 별도 로그 기록
   - 스킵된 고객은 수동 처리 필요

4. **성능 고려**
   - 대용량 파일 처리 시 배치 크기 조정
   - 네트워크 오류 시 재시도 로직

---

## 📊 예상 결과

### Migrated3 보고서 예시
```json
{
  "totalFolders": 93,
  "success": 84,
  "failed": 4,
  "skipped": 9,
  "convertedFolders": [
    {
      "original": "조성대",
      "converted": "joseotdae-7010",
      "status": "success"
    },
    {
      "original": "정해선",
      "converted": "jeonghaeseon-0712",
      "status": "success"
    }
  ],
  "errors": [
    {
      "folder": "김성준",
      "reason": "전화번호 없음"
    }
  ]
}
```

### 최종 마이그레이션 보고서 예시
```json
{
  "totalCustomers": 93,
  "success": 84,
  "failed": 0,
  "skipped": 9,
  "totalFiles": 5000,
  "byYear": {
    "2022": 1000,
    "2023": 1500,
    "2024": 1200,
    "2025": 800,
    "2026": 500
  },
  "byType": {
    "webp": 4000,
    "gif": 500,
    "mp4": 400,
    "mov": 100
  }
}
```

---

## ✅ 체크리스트

### Phase 1 (Migrated3) ✅ 준비 완료
- [x] 표준 로마자 표기법 라이브러리 도입 ✅
- [x] `prepare-migration-v3.js` 스크립트 작성 ✅
- [x] 표준 로마자 표기법 적용 확인 ✅
- [ ] Migrated3 폴더 생성 및 폴더명 변환 (실행 대기)
- [ ] 보고서 생성 및 검토

### Phase 2 (데이터 삭제)
- [ ] 기존 데이터 백업 확인
- [ ] Supabase Storage 삭제
- [ ] 데이터베이스 메타데이터 삭제

### Phase 3 (마이그레이션)
- [ ] GIF 원본 업로드 로직
- [ ] PDF 처리 로직 (PNG만 사용)
- [ ] 영상 파일 원본 업로드 로직
- [ ] WebP 85% 압축 로직
- [ ] 파일명 커스터마이징 로직
- [ ] 연도별 카운팅 로직
- [ ] 마이그레이션 실행

### Phase 4 (보고서)
- [ ] 최종 보고서 생성
- [ ] 오류 상세 내역 정리
- [ ] 사용자 검토 및 승인
