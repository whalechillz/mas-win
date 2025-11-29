# 📋 블로그 이미지 마이그레이션 및 정리 계획

## 📌 프로젝트 개요

**목적**: Wix에서 마이그레이션된 블로그 이미지들을 체계적으로 정리하고 최적화

**현재 상황**:
- ✅ 대부분의 블로그 글이 Wix에서 마이그레이션됨
- ⚠️ 이미지가 여러 폴더에 산재 (중복 가능성 높음)
- ⚠️ 메타데이터 누락
- ⚠️ 상세 보기 링크 미검증
- ⚠️ 강석 글(첫 번째 글)부터 중복 이미지 발견
- ⚠️ 갤러리 루트 폴더에 블로그 이미지들이 혼재

**목표**:
1. 모든 블로그 이미지를 `originals/blog/YYYY-MM/{blog-id}/` 폴더로 정리
2. 각 이미지의 상세 보기 링크 점검 및 수정
3. 메타데이터 생성 및 최적화
4. 스크래핑 시 중복된 이미지 확인 및 정리 (다른 곳에 사용하지 않으면 삭제)

**기대 효과**:
- ✅ 갤러리 루트 폴더가 심플해짐
- ✅ 블로그 이미지가 날짜별/글별로 체계적으로 정리됨
- ✅ 중복 이미지 제거로 저장 공간 절약
- ✅ 메타데이터 완성도 향상으로 SEO 개선

---

## 🎯 5단계 실행 계획

### **Phase 1: 전체 분석 및 현황 파악** ⚡ (우선 실행)

#### 목표
- 모든 블로그 글의 이미지 현황 파악
- 중복 이미지 그룹 식별
- 외부 URL 및 깨진 링크 확인
- 갤러리 루트 폴더의 블로그 이미지 현황 파악

#### 실행 방법
```bash
# API 호출
POST /api/admin/analyze-all-blog-images

# 또는 관리자 UI에서
/admin/gallery → "블로그 이미지 분석" 버튼 클릭
```

#### 결과 확인 항목
- [ ] 총 블로그 글 수
- [ ] 총 이미지 URL 수 (고유)
- [ ] Storage에서 찾은 이미지 수
- [ ] Storage에서 못 찾은 이미지 수
- [ ] 외부 URL 이미지 수
- [ ] 중복 이미지 그룹 수 및 리스트
- [ ] 연결되지 않은 이미지 수

#### 결과 저장
- 분석 결과 JSON 저장: `backup/blog-image-analysis-YYYYMMDD.json`
- 중복 그룹 리스트: `backup/blog-duplicate-groups-YYYYMMDD.json`

---

### **Phase 2: 발행일 순서로 글별 정리** (3-5일)

#### 목표
- 발행일이 빠른 글부터 하나씩 정리
- 이미지를 `originals/blog/YYYY-MM/{blog-id}/` 폴더로 이동
- 메타데이터 생성
- 상세 보기 링크 점검 및 수정

#### 실행 순서

1. **발행일 순서로 블로그 글 목록 조회**
   ```sql
   SELECT id, title, slug, published_at, created_at
   FROM blog_posts
   WHERE status = 'published'
   ORDER BY published_at ASC, created_at ASC
   ```

2. **글별로 순차 처리 (강석 글부터 시작)**
   ```bash
   # 예: 강석 글(ID 121) 처리
   POST /api/admin/sync-blog-with-dedupe
   {
     "blogPostId": 121,
     "organizeImages": true,     # 폴더 정리
     "syncMetadata": true,        # 메타데이터 생성
     "removeDuplicates": false    # 아직 중복 제거 안 함
   }
   ```

3. **각 글 처리 후 확인**
   - [ ] 갤러리에서 이미지 확인 (`/admin/gallery` → `originals/blog/YYYY-MM/{blog-id}/`)
   - [ ] 상세 보기 링크 테스트 (블로그 글 페이지에서 이미지 클릭)
   - [ ] 메타데이터 생성 확인 (Alt Text, Title, Keywords)
   - [ ] 블로그 본문에서 이미지 정상 표시 확인

#### ⚠️ 중요 주의사항

1. **이미지 이동 후 대기 시간 필수**
   - 이미지를 Storage에서 이동한 후, 메타데이터 생성 전에 **최소 10초 대기** 필요
   - Storage 파일 이동이 완전히 완료되기 전에 메타데이터 생성 API를 호출하면 "Object not found" 오류 발생 가능
   - 스크립트 실행 시 자동으로 대기 시간 포함

2. **메타데이터 생성 방법 선택**
   - **일반 메타 생성** 사용 권장 (골프 AI 생성 아님)
   - 이유:
     - 블로그 이미지는 골프 관련이지만, 연령대 분석이나 골프 카테고리 자동 결정 같은 특화 기능이 필요 없음
     - ALT, Title, Description, Keywords만 있으면 충분
     - 더 빠르고 간단한 처리
   - 골프 AI 생성은 골프 특화 기능(연령대 분석 등)이 필요한 경우에만 사용

#### 처리 우선순위
1. **우선 처리 대상 (Top 10)**
   - 강석 글 (첫 발행, ID 121)
   - 트래픽이 많은 글 (view_count 높은 순)
   - 대표 이미지가 있는 글

2. **순차 처리**
   - 나머지 글들을 발행일 순서로 처리
   - 하루 5-10개 글씩 처리 권장

#### 폴더 구조
```
originals/blog/
├── 2015-08/
│   ├── 121/          # 강석 글
│   │   ├── featured.jpg
│   │   ├── image-1.jpg
│   │   └── image-2.jpg
│   └── 122/
├── 2015-09/
│   └── 123/
└── 2025-11/
    └── 482/
```

---

### **Phase 3: 중복 이미지 확인 및 통합** (1-2일)

#### 목표
- 같은 이미지가 여러 폴더에 있는 경우 통합
- 블로그에서 사용하지 않는 중복 이미지 삭제
- 갤러리 루트 폴더의 블로그 이미지 정리

#### 실행 방법

1. **중복 이미지 그룹별 확인**
   ```bash
   # Phase 1에서 저장한 중복 그룹 리스트 사용
   GET /api/admin/find-duplicates-with-blog?includeBlogUsage=true
   ```

2. **각 중복 그룹 처리 규칙**
   - ✅ **보존**: 블로그에서 사용 중인 이미지
   - ✅ **보존**: 가장 최신 이미지 (1개)
   - 🗑️ **삭제**: 블로그에서 사용하지 않는 나머지

3. **안전 삭제 (시뮬레이션 먼저)**
   ```bash
   POST /api/admin/remove-duplicates-with-blog
   {
     "duplicateGroups": [...],
     "keepBlogConnected": true,  # 블로그 연결된 것 보존
     "dryRun": true              # 먼저 시뮬레이션
   }
   ```

4. **실제 삭제**
   ```bash
   # dryRun 결과 확인 후
   POST /api/admin/remove-duplicates-with-blog
   {
     "duplicateGroups": [...],
     "keepBlogConnected": true,
     "dryRun": false  # 실제 삭제
   }
   ```

#### 체크리스트
- [ ] 중복 그룹 리스트 확인
- [ ] 각 그룹의 사용 현황 확인
- [ ] 삭제 대상 이미지 리스트 확보
- [ ] dryRun 결과 검토
- [ ] 실제 삭제 실행
- [ ] 갤러리 루트 폴더 확인 (블로그 이미지 제거 확인)

---

### **Phase 4: 메타데이터 최적화** (1일)

#### 목표
- 모든 이미지에 SEO 최적화된 메타데이터 추가
- 누락된 Alt Text, Title, Keywords 생성

#### 실행 방법
```bash
# 폴더별로 메타데이터 생성 (AI 사용)
POST /api/admin/generate-metadata-for-folder
{
  "folderPath": "originals/blog/2015-08/121",
  "generateAltText": true,
  "generateTitle": true,
  "generateKeywords": true
}
```

#### 체크리스트
- [ ] 모든 이미지에 Alt Text 있음
- [ ] 모든 이미지에 Title 있음
- [ ] 모든 이미지에 Keywords 있음
- [ ] 인물/연예인 관련 키워드 추가 (해당하는 경우: 예 - 이경영 글 → "이경영", "연예인", "배우" 키워드 추가)
- [ ] `hash_md5` 계산 완료
- [ ] `usage_count` 업데이트 완료
- [ ] 메타데이터 최적화 점수 80점 이상

---

### **Phase 5: 최종 검증 및 문서화** (1일)

#### 목표
- 전체 블로그 이미지 정리 상태 최종 확인
- 깨진 링크 0개 확인
- 문서화

#### 실행 방법

1. **최종 검증**
   ```bash
   POST /api/admin/analyze-all-blog-images
   # 결과 비교: Phase 1 vs Phase 5
   ```

2. **확인 항목**
   - [ ] 모든 이미지가 `originals/blog/` 폴더에 정리됨
   - [ ] 중복 이미지 0개
   - [ ] Storage에 없는 이미지 0개
   - [ ] 외부 URL 리스트 확보 (필요 시 다운로드 계획)
   - [ ] 모든 이미지에 메타데이터 있음
   - [ ] 갤러리 루트 폴더에 블로그 이미지 없음

3. **문서화**
   - 처리 완료된 블로그 글 리스트
   - 삭제된 중복 이미지 리스트
   - 외부 URL 이미지 리스트
   - 향후 유지보수 가이드

---

## 🔧 사용 가능한 도구

### 기존 API
1. `POST /api/admin/analyze-all-blog-images` - 전체 분석
2. `POST /api/admin/organize-images-by-blog` - 글별 폴더 정리
3. `POST /api/admin/sync-blog-with-dedupe` - 정리 + 메타데이터 + 중복 제거 통합
4. `GET /api/admin/find-duplicates-with-blog` - 중복 찾기
5. `POST /api/admin/remove-duplicates-with-blog` - 중복 제거
6. `POST /api/admin/generate-metadata-for-folder` - 메타데이터 생성

### 관리자 UI
- `/admin/gallery` - 갤러리 관리
  - "블로그 이미지 분석" 버튼
  - "중복 제거 확인" 버튼
  - 폴더 구조 탐색
- `/admin/blog` - 블로그 관리
  - "이미지 정렬" 버튼 (각 글별)

---

## ⏱️ 예상 소요 시간

| Phase | 작업 | 소요 시간 |
|-------|------|----------|
| Phase 1 | 전체 분석 | 1일 |
| Phase 2 | 글별 정리 (100개 글 기준) | 3-5일 |
| Phase 3 | 중복 제거 | 1-2일 |
| Phase 4 | 메타데이터 최적화 | 1일 |
| Phase 5 | 최종 검증 | 1일 |
| **총합** | | **7-10일** |

---

## 💡 추천 실행 순서

1. **오늘**: Phase 1 (전체 분석) 실행 → 현황 파악
2. **내일부터**: Phase 2 (강석 글부터 Top 10) → 하루 5-10개 글씩 처리
3. **중간 점검**: 10개 글 완료 후 프로세스 점검 및 조정
4. **나머지 글**: 검증된 프로세스로 일괄 처리
5. **마무리**: Phase 3-5 (중복 제거, 메타데이터, 검증)

---

## 📊 진행 상황 추적

### Phase 1: 전체 분석 ✅ (2025-11-29 완료)
- [x] 분석 실행 완료
- [x] 결과 JSON 저장 완료: `backup/blog-image-analysis-2025-11-29T00-19-21.json`
- [x] 중복 그룹 리스트 확보: `backup/blog-duplicate-groups-2025-11-29T00-19-21.json`
- [x] 외부 URL 리스트 확보

#### Phase 1 분석 결과 요약
- **총 블로그 글**: 164개
- **고유 이미지 URL**: 524개
- **처리된 이미지**: 524개
- **Storage에서 찾음**: 424개 (80.9%)
- **Storage에서 못 찾음**: 93개 (17.8%) ⚠️
- **외부 URL**: 7개 (1.3%) ⚠️
- **중복 이미지 그룹**: 2개
- **총 중복 이미지**: 4개

#### 발견된 중복 이미지
1. **IMG_8012.jpg** (2개)
   - `originals/blog/2025-11/482/IMG_8012.jpg` (글 482 사용)
   - `scraped-images/2025-11-14/IMG_8012.jpg` (글 483 사용)
   
2. **IMG_8014.jpg** (2개)
   - `originals/blog/2025-11/482/IMG_8014.jpg` (글 482 사용)
   - `scraped-images/2025-11-14/IMG_8014.jpg` (글 483 사용)

#### 다음 단계 권장사항
- ⚠️ **Storage에서 못 찾은 이미지 93개**: Phase 2에서 복구 필요
- ⚠️ **외부 URL 7개**: 별도 다운로드 계획 필요
- ✅ **중복 이미지 4개**: Phase 3에서 정리 예정

### Phase 2: 글별 정리
- [ ] 강석 글 (ID: ___) 완료
- [ ] Top 10 글 완료
- [ ] 전체 글 완료 (___ / ___ 개)

### Phase 3: 중복 제거
- [ ] 중복 그룹 확인 완료
- [ ] dryRun 실행 완료
- [ ] 실제 삭제 완료

### Phase 4: 메타데이터 최적화
- [ ] 폴더별 메타데이터 생성 완료
- [ ] 최적화 점수 확인 완료

### Phase 5: 최종 검증
- [ ] 최종 분석 완료
- [ ] 문서화 완료

---

## 🚨 주의사항

1. **백업 필수**: 각 Phase 시작 전 데이터 백업
2. **단계별 검증**: 각 Phase 완료 후 결과 확인
3. **dryRun 활용**: 삭제 작업 전 반드시 시뮬레이션
4. **외부 URL 처리**: 외부 URL 이미지는 별도 계획 필요

---

**작성일**: 2025-11-28
**최종 업데이트**: 2025-11-28

