# ✅ 갤러리 마이그레이션 체크리스트

## 📋 원래 제시한 개발 계획 대비 누락 사항 확인

### ✅ 포함된 사항

1. **블로그 이미지 폴더 정리** ✅
   - Phase 2: 블로그 이미지 분석 및 분류
   - Phase 3: 블로그 이미지 마이그레이션
   - `originals/blog/YYYY-MM/` 구조로 정리

2. **메타태그 입력** ✅
   - Phase 3: 메타데이터 동기화 및 AI 생성
   - 누락된 메타데이터 AI 생성
   - 메타데이터 품질 검증

3. **중복 삭제** ✅
   - Phase 4: 중복 이미지 제거
   - 해시 기반 중복 감지
   - 안전한 중복 제거 (블로그 연결 이미지 보존)

4. **프론트엔드 개발 편의성 개선** ✅
   - Phase 5: 프론트엔드 개발 편의성 개선
   - 폴더 트리 네비게이션
   - 검색 및 필터링 강화
   - 이미지 카드 정보 확장

5. **현재 갤러리 폴더와 스토리지 모두 옮기기** ✅
   - Phase 3: 블로그 이미지 마이그레이션
   - 기존 `blog-images` 버킷 → 새 `masgolf-images` 버킷으로 이동

---

## ⚠️ 누락된 사항 (추가 필요)

### 1. 기존 API 및 프론트엔드 코드 버킷명 변경 작업

#### 현재 상황:
- 여러 API 파일에서 `blog-images` 버킷 하드코딩 사용 중
- 새 버킷 `masgolf-images` 사용으로 전환 필요

#### 영향받는 파일:
1. `pages/api/admin/organize-images-by-blog.js` (15곳)
2. `pages/api/admin/sync-blog-with-dedupe.js` (2곳)
3. `pages/api/admin/remove-duplicates-with-blog.js` (1곳)
4. `pages/api/admin/all-images.js` (버킷명 확인 필요)
5. `pages/api/admin/find-duplicates.js` (버킷명 확인 필요)
6. `pages/api/admin/sync-missing-metadata.js` (버킷명 확인 필요)
7. `pages/api/admin/blog-images.js` (버킷명 확인 필요)
8. `pages/api/save-images-to-storage.js` (버킷명 확인 필요)
9. `pages/admin/blog.tsx` (프론트엔드, 버킷명 확인 필요)
10. `pages/admin/gallery.tsx` (프론트엔드, 버킷명 확인 필요)

#### 작업 내용:
- [ ] 환경 변수로 버킷명 관리 (`BUCKET_NAME` 또는 `IMAGE_BUCKET`)
- [ ] 모든 API 파일에서 하드코딩된 `blog-images` → 환경 변수 사용으로 변경
- [ ] 프론트엔드 코드에서 버킷명 참조 확인 및 수정
- [ ] 기존 버킷(`blog-images`)과 새 버킷(`masgolf-images`) 병행 운영 계획

---

### 2. 블로그 글 URL 업데이트 작업 세부화

#### 현재 상황:
- Phase 3에서 블로그 글 URL 업데이트 포함됨
- 하지만 세부 작업 내용이 명확하지 않음

#### 추가 필요 작업:
- [ ] 블로그 글 `featured_image` 필드 URL 업데이트
- [ ] 블로그 글 `content` 필드 내 이미지 URL 업데이트 (Markdown 형식)
- [ ] 블로그 글 `content` 필드 내 이미지 URL 업데이트 (HTML 형식)
- [ ] URL 업데이트 후 검증 (모든 블로그 글 확인)
- [ ] 롤백 계획 (URL 업데이트 실패 시 원복)

---

### 3. 기존 버킷(`blog-images`) 정리 및 삭제 계획

#### 현재 상황:
- 새 버킷(`masgolf-images`)으로 마이그레이션 후 기존 버킷 처리 방안이 명확하지 않음

#### 추가 필요 작업:
- [ ] 기존 버킷 데이터 백업 (마이그레이션 전)
- [ ] 기존 버킷 삭제 시점 결정 (마이그레이션 완료 후?)
- [ ] 기존 버킷 유지 방안 (롤백 대비)
- [ ] 기존 버킷 읽기 전용 전환 (선택 사항)

---

### 4. 환경 변수 및 설정 관리

#### 현재 상황:
- 버킷명이 하드코딩되어 있어 환경별 설정 관리 어려움

#### 추가 필요 작업:
- [ ] 환경 변수 추가: `NEXT_PUBLIC_IMAGE_BUCKET` (프론트엔드)
- [ ] 환경 변수 추가: `IMAGE_BUCKET` (서버)
- [ ] `.env.local`, `.env.production` 설정 확인
- [ ] Vercel 환경 변수 설정 안내

---

### 5. 테스트 및 검증 계획 세부화

#### 현재 상황:
- 각 Phase별 검증 항목은 있으나 구체적인 테스트 시나리오 부족

#### 추가 필요 작업:
- [ ] 마이그레이션 전 전체 이미지 백업
- [ ] 마이그레이션 후 이미지 파일 존재 확인
- [ ] 마이그레이션 후 메타데이터 정확성 확인
- [ ] 마이그레이션 후 블로그 글 이미지 표시 확인
- [ ] 성능 테스트 (대량 이미지 처리)
- [ ] 롤백 테스트 (문제 발생 시 원복)

---

### 6. 문서화 및 운영 가이드

#### 현재 상황:
- 개발 계획 문서는 있으나 운영 가이드 부족

#### 추가 필요 작업:
- [ ] 마이그레이션 실행 가이드 작성
- [ ] 롤백 실행 가이드 작성
- [ ] 문제 해결 가이드 작성
- [ ] 운영자 매뉴얼 작성

---

## 🔄 수정된 개발 계획 (누락 사항 포함)

### Phase 1: 인프라 준비 및 DB 설계 (2일) - **수정됨**

#### Day 1: 새 버킷 및 기본 폴더 구조 생성
- [x] Supabase Storage에 `masgolf-images` 버킷 생성
- [x] 블로그 이미지용 기본 폴더 구조 생성
- [ ] **추가**: 환경 변수 설정 (`IMAGE_BUCKET`, `NEXT_PUBLIC_IMAGE_BUCKET`)
- [ ] **추가**: 기존 버킷(`blog-images`) 백업 계획 수립

#### Day 2: 데이터베이스 스키마 설계 및 확장
- [x] `image_metadata` 테이블 확장
- [x] 해시 기반 검색 최적화
- [ ] **추가**: 버킷명 마이그레이션 로그 테이블 생성 (선택)

---

### Phase 3: 블로그 이미지 마이그레이션 및 메타데이터 동기화 (3일) - **수정됨**

#### Day 5-6: 블로그 이미지 마이그레이션
- [x] 블로그 이미지 이동 (`originals/blog/YYYY-MM/` 구조)
- [x] 메타데이터 자동 생성
- [x] URL 업데이트 (`image_url` 필드)
- [ ] **추가**: 블로그 글 `featured_image` URL 업데이트
- [ ] **추가**: 블로그 글 `content` 내 이미지 URL 업데이트 (Markdown/HTML)
- [ ] **추가**: URL 업데이트 후 검증

#### Day 7: 메타데이터 동기화 및 AI 생성
- [x] 누락된 메타데이터 확인
- [x] AI 메타데이터 생성
- [x] 메타데이터 품질 검증
- [ ] **추가**: 메타데이터 업데이트 후 블로그 글 재검증

---

### Phase 6: 코드 버킷명 변경 (1일 추가) - **신규**

#### 작업 내용:
1. **환경 변수 설정**
   - `.env.local`에 `IMAGE_BUCKET=masgolf-images` 추가
   - `.env.production`에 `IMAGE_BUCKET=masgolf-images` 추가
   - Vercel 환경 변수 설정

2. **API 파일 수정**
   - `pages/api/admin/organize-images-by-blog.js` (15곳)
   - `pages/api/admin/sync-blog-with-dedupe.js` (2곳)
   - `pages/api/admin/remove-duplicates-with-blog.js` (1곳)
   - `pages/api/admin/all-images.js` (확인 후 수정)
   - `pages/api/admin/find-duplicates.js` (확인 후 수정)
   - `pages/api/admin/sync-missing-metadata.js` (확인 후 수정)
   - `pages/api/admin/blog-images.js` (확인 후 수정)
   - `pages/api/save-images-to-storage.js` (확인 후 수정)

3. **프론트엔드 파일 수정**
   - `pages/admin/blog.tsx` (확인 후 수정)
   - `pages/admin/gallery.tsx` (확인 후 수정)

4. **테스트**
   - 로컬 환경 테스트
   - 스테이징 환경 테스트
   - 프로덕션 배포 전 검증

#### API 엔드포인트:
- 수정된 파일들에 대한 테스트 필요
- 기존 버킷과 새 버킷 병행 지원 (점진적 전환)

#### 검증:
- [ ] 모든 API가 새 버킷 사용
- [ ] 기존 버킷 참조 제거
- [ ] 환경 변수 정상 작동
- [ ] 프로덕션 배포 전 검증 완료

---

## 📊 최종 체크리스트

### 🔴 Critical (즉시 진행)
- [ ] 새 버킷 `masgolf-images` 생성
- [ ] 환경 변수 설정 (`IMAGE_BUCKET`, `NEXT_PUBLIC_IMAGE_BUCKET`)
- [ ] 블로그 이미지용 기본 폴더 구조 생성
- [ ] 데이터베이스 스키마 확장
- [ ] 모든 블로그 이미지 분석 및 분류
- [ ] 블로그 이미지 마이그레이션
- [ ] 블로그 글 URL 업데이트 (featured_image, content)
- [ ] 메타데이터 동기화
- [ ] 중복 이미지 제거
- [ ] **코드 버킷명 변경** (신규 추가)
- [ ] 프론트엔드 개선

### 🟡 High (1주 이내)
- [ ] 기존 버킷 정리 및 삭제 계획
- [ ] 테스트 및 검증 완료
- [ ] 운영 가이드 작성

### 🟢 Medium (2주 이내)
- [ ] 제품 이미지 마이그레이션
- [ ] 고객 콘텐츠 마이그레이션

---

## 🚨 추가 주의사항

### 코드 버킷명 변경 시
1. **점진적 전환**: 기존 버킷과 새 버킷 병행 지원
2. **환경 변수 우선**: 하드코딩 제거, 환경 변수 사용
3. **테스트 필수**: 모든 API 및 프론트엔드 기능 테스트
4. **롤백 준비**: 문제 발생 시 즉시 롤백 가능하도록

### 블로그 글 URL 업데이트 시
1. **트랜잭션 처리**: 실패 시 전체 롤백
2. **검증 필수**: 업데이트 후 모든 블로그 글 확인
3. **백업 필수**: 업데이트 전 전체 블로그 글 백업

---

## 📝 다음 단계

1. **Phase 6 추가**: 코드 버킷명 변경 작업 (1일)
2. **Phase 3 보완**: 블로그 글 URL 업데이트 세부화
3. **운영 가이드 작성**: 마이그레이션 실행 가이드, 롤백 가이드

