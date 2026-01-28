# 오리지널 맥 폴더 기반 고객 이미지 마이그레이션 계획

## 목표
오리지널 맥의 `00.blog_customers` 폴더 구조를 참고하여 Storage의 `originals/customers`와 매칭하고 모든 이미지를 마이그레이션

## 오리지널 맥 폴더 구조

### 구조
```
00.blog_customers/
├── 2020/
│   └── 2020.09.02.최석호/
├── 2022/
│   └── 2022.04.18.장진수/
├── 2023/
│   ├── 2023.06.14.이윤희-010-3532-4572/
│   └── ...
├── 2024/
│   ├── 2024.11.11.김수환/
│   └── ...
├── 2025/
│   ├── 2025.06.05.민호식/
│   └── ...
└── 2026/
    └── ...
```

### 특징
- **폴더명 형식**: `YYYY.MM.DD.고객명` 또는 `YYYY.MM.DD.고객명-전화번호`
- **연도별 분류**: 2020, 2022, 2023, 2024, 2025, 2026
- **총 고객 폴더**: 107개
- **총 이미지**: 545개

## Storage 구조

### 현재 구조
```
originals/customers/
├── {영문이름}-{전화번호마지막4자리}/
│   └── YYYY-MM-DD/
│       └── 이미지 파일들
```

### 특징
- **폴더명 형식**: `{영문이름}-{전화번호마지막4자리}`
- **하위 구조**: 날짜별 폴더 (`YYYY-MM-DD/`)
- **총 폴더**: 96개 (Storage에서 확인)

## 마이그레이션 전략

### Phase 1: 로컬 맥 폴더 분석 및 매핑
1. 로컬 맥의 모든 고객 폴더 스캔
2. 폴더명에서 고객명과 날짜 추출
3. customers 테이블에서 고객명으로 매칭
4. 전화번호가 있으면 전화번호로도 매칭 확인

### Phase 2: Storage 폴더와 매칭
1. 로컬 맥 폴더명 → Storage 폴더명 매핑
2. 고객명을 영문으로 변환하여 Storage 폴더명 생성
3. 전화번호 마지막 4자리로 매칭 확인

### Phase 3: 이미지 마이그레이션
1. 로컬 맥의 모든 이미지 파일 스캔
2. Storage에 이미 업로드되어 있는지 확인
3. 없으면 Storage에 업로드
4. image_assets에 등록
5. ai_tags에 customer-{id} 태그 추가

### Phase 4: customers 테이블 업데이트
1. folder_name 업데이트 (Storage 폴더명 기준)
2. 누락된 고객 정보 보완

## 실행 순서

```bash
# 1. 로컬 맥 폴더 구조 분석 (완료)
node scripts/analyze-original-mac-folder-structure.js

# 2. 로컬 맥 폴더와 customers 테이블 매칭
node scripts/match-original-mac-to-customers.js

# 3. Storage 폴더와 매칭
node scripts/match-original-mac-to-storage.js

# 4. 이미지 마이그레이션 (로컬 → Storage → image_assets)
node scripts/migrate-images-from-original-mac.js
```

## 예상 결과

- ✅ 로컬 맥의 107개 고객 폴더 모두 매칭
- ✅ 545개 이미지 모두 Storage에 업로드 및 image_assets에 등록
- ✅ 모든 이미지에 customer-{id} 태그 추가
- ✅ customers 테이블의 folder_name 업데이트
