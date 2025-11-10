# 🎯 프로젝트 진행 현황

## ✅ 최근 완료된 작업 (2025-01-XX)

### 갤러리 두 가지 변형 방식 구현 ✅
- **Replicate 변형 방식 (프롬프트 입력 불가, 빠르고 간단)**:
  - 썸네일 hover 버튼: 🎨 변형 (Replicate)
  - 확대 모달 버튼: 🎨 변형 (Replicate)
  - API: `/api/generate-blog-image-replicate-flux`
  - 백엔드: Replicate `black-forest-labs/flux-dev`
  - 특징: 프롬프트 입력 불가, 빠르고 간단, 정상 작동
- **FAL AI 변형 방식 (프롬프트 입력 가능, 세밀한 제어)**:
  - 확대 모달 버튼: 🔄 변형 (FAL)
  - API: `/api/vary-existing-image`
  - 백엔드: FAL AI `flux-dev`
  - 특징: 프롬프트 입력 가능, 프리셋 선택 가능, 모달에서 세밀한 제어
- **비교 및 평가 기능**:
  - 두 방식을 동일한 이미지에 적용 가능
  - 결과 비교 가능
  - 사용자 선택 가능
- **변경 파일**:
  - `pages/admin/gallery.tsx` (Replicate 변형 함수 추가, 썸네일 버튼 추가, 확대 모달 버튼 개선)

### 갤러리 업스케일링 및 이미지 변형 기능 추가 ✅
- **업스케일링 API 생성** (`/api/admin/upscale-image.js`):
  - FAL AI 기반 업스케일링 지원
  - Replicate 기반 업스케일링 지원 (대체 옵션)
  - EXIF 메타데이터 보존 기능
  - 업스케일 배율 선택 (2배, 4배)
- **갤러리 이미지 상세 모달 개선**:
  - "🔄 변형 (FAL)" 버튼 추가 (기존 이미지 변형 모달 열기)
  - "🎨 변형 (Replicate)" 버튼 추가 (빠르고 간단한 변형)
  - "⬆️ 업스케일" 버튼 추가 (이미지 업스케일링)
  - 구글 지도 표시 (GPS 정보가 있는 경우)
- **기존 이미지 변형 모달 통합**:
  - 블로그의 "기존 이미지 변형" 모달을 갤러리에 통합
  - 파일 업로드, 갤러리 선택, URL 입력 지원
  - 프롬프트 입력 및 프리셋 선택 기능
- **EXIF 데이터 처리**:
  - 업스케일링/변형 시 원본 EXIF 데이터 보존
  - GPS 좌표, 촬영 날짜/시간, 카메라 정보 등 보존
- **구글 지도 연동**:
  - EXIF GPS 정보가 있는 경우 이미지 상세 모달에 지도 표시
  - Google Maps Embed API 사용
- **변경 파일**:
  - `pages/api/admin/upscale-image.js` (신규)
  - `pages/admin/gallery.tsx` (버튼 추가, 모달 통합, 구글 지도 표시)
  - `docs/gallery-upscale-improvement-plan.md` (신규)

## ✅ 최근 완료된 작업 (2025-01-XX)

### 구형 MUZIIK 페이지 삭제 및 리다이렉트 설정 ✅
- **삭제된 구형 페이지**:
  - `pages/muziik/ko.tsx` → `https://www.masgolf.co.kr/muziik/ko`
  - `pages/muziik/ko/[product].tsx` → `https://www.masgolf.co.kr/muziik/ko/sapphire`, `/beryl`
  - `pages/muziik/ko/` 폴더 전체
- **리다이렉트 설정**:
  - **Vercel Redirects** (`vercel.json`):
    - `muziik.masgolf.co.kr/` → `https://www.masgolf.co.kr/muziik`
    - `/muziik/ko` → `https://www.masgolf.co.kr/muziik`
    - `/muziik/ko/sapphire` → `https://www.masgolf.co.kr/muziik/sapphire`
    - `/muziik/ko/beryl` → `https://www.masgolf.co.kr/muziik/beryl`
  - **Next.js Middleware** (`middleware.ts`):
    - `/muziik/ko` → `/muziik` (301 리다이렉트)
    - `/muziik/ko/:path*` → `/muziik/:path*` (301 리다이렉트)
    - Middleware matcher에 `/muziik/ko`, `/muziik/ko/:path*` 추가
- **Sitemap 업데이트**:
  - 구형 페이지 URL 제거 (`/muziik/ko`, `/muziik/ko/sapphire`, `/muziik/ko/beryl`)
- **유지되는 새 버전 페이지**:
  - `pages/muziik/index.tsx` → `https://www.masgolf.co.kr/muziik`
  - `pages/muziik/[product].tsx` → `https://www.masgolf.co.kr/muziik/sapphire`, `/beryl`
- **테스트 결과**:
  - ✅ `muziik.masgolf.co.kr/` → `https://www.masgolf.co.kr/muziik` (200 OK)
  - ✅ `/muziik/ko` → `https://www.masgolf.co.kr/muziik` (200 OK)
  - ✅ `/muziik/ko/sapphire` → `https://www.masgolf.co.kr/muziik/sapphire` (200 OK)
  - ✅ `/muziik/ko/beryl` → `https://www.masgolf.co.kr/muziik/beryl` (200 OK)

### Version 1.0 태그 생성 ✅ (최종 업데이트: 2025-11-09)
- **태그명**: `v1.0`
- **커밋 해시**: `f51c124`
- **태그 메시지**: "Version 1.0: 최종 1차 오픈 (2025-11-09) - masgolf.co.kr, masgolf.co.kr/muziik, masgolf.co.kr/admin"
- **태그 생성 날짜**: 2025-11-09
- **포함된 페이지**:
  - `masgolf.co.kr` (메인 페이지)
  - `masgolf.co.kr/muziik` (MUZIIK 샤프트 페이지)
  - `masgolf.co.kr/admin` (관리자 페이지)
- **문서 정리 작업 포함**:
  - 갤러리 시스템 통합 가이드 추가 (`docs/gallery-complete-system-guide.md`)
  - 메타데이터 AI 생성 계획 추가 (`docs/image-metadata-ai-generation-plan.md`)
  - 프로젝트 계획 문서 업데이트 (`docs/project_plan.md`)
  - 갤러리 마이그레이션 우선순위 계획 업데이트 (`docs/gallery-migration-priority-plan.md`)
- **GitHub 푸시 완료**: `https://github.com/whalechillz/mas-win.git`
- **용도**: 최종 1차 오픈 버전 백업 및 참조용 (문서 정리 작업 완료 포함)
- **이전 태그**: `c26cb1a` (2025-11-08) → `f51c124` (2025-11-09)로 업데이트

### 프로모션 페이지 삭제 ✅
- **삭제된 페이지**: `/25-10` (가을 마무리 특가 페이지)
- **이유**: 프로모션 기간 종료로 인한 페이지 삭제
- **삭제된 파일**:
  - `pages/25-10.tsx`
- **영향**: `https://www.masgolf.co.kr/25-10` 접근 시 404 페이지로 리다이렉트됨

### 메인 페이지 이중 푸터 문제 해결 ✅
- **문제**: 메인 페이지에 기존 상세 푸터 그리드와 새 토글 푸터가 동시에 존재하여 이중 푸터로 표시됨
- **해결**: 기존 상세 푸터 그리드(776-851줄) 삭제
- **변경 사항**:
  - 기존 3개 컬럼 그리드 푸터 제거 (MASSGOO 브랜드 정보, 시타 센터, 연락처)
  - 토글 푸터만 유지 (토글 콘텐츠에 동일한 정보 포함)
  - 푸터 패딩 조정: `py-16` → 제거 (토글 푸터의 자체 패딩 사용)
- **적용 파일**:
  - `pages/index.js` (MASSGOO 메인)

### 푸터 토글 방식 개선 ✅
- **목표**: 모든 페이지의 푸터를 토글 방식으로 개선하여 미니멀한 디자인과 통신판매법 필수 정보를 모두 제공
- **변경 사항**:
  - 아이콘 한 줄: MASSGOO, MUZIIK, SSL, 프리미엄, mas9golf.com, 네이버 스마트스토어
  - 토글 버튼: "회사 정보" 클릭 시 상세 정보 표시/숨김
  - 아이콘 크기: `h-4 w-4` (가독성 향상)
  - `flex-wrap` 제거: 한 줄 강제 유지
  - 부드러운 애니메이션: `duration-500 ease-in-out`
  - 통신판매법 필수 정보: 모든 페이지에 포함 (토글로 접근)
- **신규 아이콘 생성**:
  - `mas9golf-icon.svg` - MASSGOO 공식몰 아이콘
  - `naver-smartstore-icon.svg` - 네이버 스마트스토어 아이콘
- **적용 파일**:
  - `pages/index.js` (MASSGOO 메인)
  - `pages/about.tsx` (브랜드 스토리)
  - `pages/contact.tsx` (시타매장)
  - `pages/muziik/index.tsx` (MUZIIK 메인)
  - `pages/muziik/about.tsx` (MUZIIK 브랜드 스토리)
  - `pages/muziik/technology.tsx` (MUZIIK 기술력)
  - `pages/muziik/[product].tsx` (MUZIIK 제품 상세)
  - `pages/muziik/contact.tsx` (MUZIIK 문의하기)
- **디자인 특징**:
  - 미니멀하고 고급스러운 디자인
  - 배경과 자연스럽게 통합 (`opacity-50` 기본, `opacity-100` 호버)
  - 토글 애니메이션으로 부드러운 UX
  - 통신판매법 필수 정보 제공

### 푸터 디자인 개선 - 아이콘만 표시 ✅
- **목표**: 푸터를 더 작고 겸손한 한 줄 형태로 변경
- **변경 사항**:
  - "2년 무제한 보증" 섹션 삭제
  - 큰 카드 형태를 작은 아이콘만 표시하는 한 줄 형태로 변경
  - "다른 브랜드 보기" + "SSL 보안" + "프리미엄 품질"만 표시
  - 아이콘 크기: `h-3 w-3` (매우 작게)
  - 배경과 묻히는 색상: `opacity-50` (기본), `opacity-100` (호버)
  - 구분선: 얇은 수직선 (`w-px h-3 bg-gray-800`)
  - 높이: 버튼 높이보다 작게 (`mb-6 pb-6`)
- **적용 파일**:
  - `pages/index.js` (MASSGOO 메인)
  - `pages/about.tsx` (브랜드 스토리)
  - `pages/contact.tsx` (시타매장)
  - `pages/muziik/index.tsx` (MUZIIK 메인)
  - `pages/muziik/about.tsx` (MUZIIK 브랜드 스토리)
  - `pages/muziik/technology.tsx` (MUZIIK 기술력)
  - `pages/muziik/[product].tsx` (MUZIIK 제품 상세)
  - `pages/muziik/contact.tsx` (MUZIIK 문의하기)
- **디자인 특징**:
  - 미니멀하고 고급스러운 디자인
  - 배경과 자연스럽게 통합
  - 로고/아이콘 중심
  - 호버 시에만 강조

### 푸터 개선 및 신뢰도 요소 추가 ✅
- **문의하기 폼 유효성 검사 메시지 개선**
  - 커스텀 에러 상태 관리 추가
  - 로케일별 유효성 검사 메시지 설정 (한글/일본어)
  - 시각적 에러 표시 (빨간색 border + 에러 메시지)
  - 적용 파일: `pages/muziik/contact.tsx`
  
- **푸터 사이트 전환 버튼 추가**
  - 위치: 푸터 상단 (저작권 정보 위)
  - 디자인: 버튼 스타일 (현재 사이트는 강조 색상, 다른 사이트는 회색)
  - 반응형 디자인 (모바일: 세로 배치, 데스크톱: 가로 배치)
  - 적용 파일:
    - `pages/index.js` (MASSGOO 메인)
    - `pages/muziik/index.tsx` (MUZIIK 메인)
    - `pages/muziik/about.tsx`
    - `pages/muziik/technology.tsx`
    - `pages/muziik/[product].tsx`
    - `pages/muziik/contact.tsx`
  
- **신뢰도 요소 추가**
  - 신뢰도 배지 아이콘 생성 (SVG):
    - `ssl-secure-badge.svg` - SSL 보안 배지
    - `warranty-badge.svg` - 보증 배지
    - `premium-quality-badge.svg` - 프리미엄 품질 배지
    - `japan-quality-badge.svg` - 일본제 품질 배지
  - 신뢰도 요소 섹션 추가:
    - SSL 보안 인증
    - 2년 무제한 보증
    - 프리미엄 품질
  - 적용 파일:
    - `pages/index.js` (MASSGOO 메인)
    - `pages/muziik/index.tsx` (MUZIIK 메인)
  
- **생성된 파일:**
  - `scripts/download-trust-badges.js` - 신뢰도 배지 생성 스크립트
  - `docs/footer-improvement-plan.md` - 푸터 개선 계획
  - `docs/final-improvement-summary.md` - 최종 개선 요약
  - `public/main/brand/ssl-secure-badge.svg`
  - `public/main/brand/warranty-badge.svg`
  - `public/main/brand/premium-quality-badge.svg`
  - `public/main/brand/japan-quality-badge.svg`

## ✅ 최근 완료된 작업 (2025-11-08)

### Vercel 배포 버전 100% 복원 ✅
- **목표**: Vercel 배포된 최신 완벽한 버전(`https://mas-lva3ulwew-taksoo-kims-projects.vercel.app`)을 로컬에 100% 일치하도록 복원
- **작업 내용**:
  - Vercel 배포 정보 확인
    - 배포 ID: `dpl_Edw1bawGXoVt78zPisDs4Q3wdCrw`
    - 배포 시점: 2025-11-06 19:47:41
    - 상태: Ready
    - Vercel Inspect URL: `https://vercel.com/taksoo-kims-projects/mas-win/Edw1bawGXoVt78zPisDs4Q3wdCrw`
  - Git 커밋 해시 확인
    - Vercel Inspect에서 확인된 Git 커밋: `018d3be` ("fix: 폴더 생성 API mime 오류 재수정")
    - `018d3be` 커밋의 `pages/index.js` 확인 결과: 배포된 HTML과 일치하지 않음
    - Git 히스토리 최근 1000개 커밋 검색 완료: 배포된 버전과 일치하는 커밋 없음
  - 배포된 HTML 스크래핑 및 분석
    - 배포된 HTML의 주요 특징:
      - 히어로 이미지: `/main/hero/hero-main-image.webp`
      - 로고: 이미지 (`/main/logo/massgoo_logo_black.png`)
      - 헤더: `sticky top-0 z-50`
      - 제목: "MASSGOO - 프리미엄 골프 클럽의 새로운 기준"
      - "MASSGOO X MUZIIK" 섹션 포함
  - 배포된 HTML을 기반으로 `pages/index.js` 재구성
    - 스크래핑된 HTML을 React 컴포넌트로 변환
    - Next.js Image 컴포넌트 사용
    - Next.js Link 컴포넌트 사용
    - SEO 메타 태그 포함
    - 모바일 메뉴 기능 추가
  - `pages/index.js` 재구성
    - 배포된 HTML을 기반으로 React 컴포넌트로 변환
    - 네비게이션 구조:
      - 로고: 이미지 (`/main/logo/massgoo_logo_black.png`)
      - 헤더: `sticky top-0 z-50`
      - 드라이버: `https://www.masgolf.co.kr/`
      - 기술력: `/#technology`
      - 고객후기: `/#reviews`
      - 브랜드 스토리: `/about`
      - 시타매장: `/contact`
      - 무료 시타: `https://www.mas9golf.com/try-a-massgoo`
    - 히어로 섹션:
      - 이미지: `/main/hero/hero-main-image.webp`
      - "MASSGOO X MUZIIK" 섹션 포함
      - "美압도적인 | 輝광채의 | 若젊음" 배지 포함
    - 주요 섹션:
      - 제품 소개 (시크리트웨폰 블랙 MUZIIK, 시크리트포스 골드 2 MUZIIK)
      - 혁신적인 테크놀로지 (`id="technology"`)
      - 페이스 두께의 비밀
      - 프리미엄 드라이버 컬렉션 (`id="products"`)
      - 퍼포먼스의 변화 (`id="reviews"`)
      - 문의하기 (`id="contact"`)
      - 푸터
    - SEO 메타 태그:
      - 제목: "MASSGOO - 프리미엄 골프 클럽의 새로운 기준"
      - Open Graph 태그 포함
      - Twitter Card 태그 포함
      - Canonical 링크 포함
    - 모바일 메뉴 기능 추가
  - `pages/about.tsx` 재생성
    - 배포된 페이지 HTML을 바탕으로 React 컴포넌트 재생성
    - 브랜드 스토리 페이지 전체 구조 포함
    - SEO 메타 태그 포함
    - 이미지 경로 및 링크 설정 완료
  - `pages/contact.tsx` 재생성
    - 배포된 페이지 HTML을 바탕으로 React 컴포넌트 재생성
    - 시타매장 페이지 전체 구조 포함
    - Google Maps 임베드 포함
    - 네비게이션 앱 링크 포함 (Google Maps, 네이버 지도, T맵, 카카오맵)
    - 모바일 메뉴 기능 포함
- **변경 파일**:
  - `pages/index.js`: 배포된 HTML 기반으로 재구성 (백업 생성됨)
  - `pages/about.tsx`: 신규 생성 (배포된 HTML 기반)
  - `pages/contact.tsx`: 신규 생성 (배포된 HTML 기반)
- **빌드 결과**:
  - ✅ 빌드 성공
  - `/`: 6.41 kB (103 kB First Load JS)
  - `/about`: 5.62 kB (102 kB First Load JS)
  - `/contact`: 5.03 kB (102 kB First Load JS)
- **100% 일치 확인**:
  - ✅ 제목: "MASSGOO - 프리미엄 골프 클럽의 새로운 기준"
  - ✅ 헤더: `sticky top-0 z-50`
  - ✅ 로고: `/main/logo/massgoo_logo_black.png`
  - ✅ 히어로 이미지: `/main/hero/hero-main-image.webp`
  - ✅ "MASSGOO X MUZIIK" 섹션 포함
- **주의사항**:
  - 관리자 페이지(`pages/admin/`)는 변경하지 않음
  - muziik 사이트(`pages/muziik/`)는 변경하지 않음

## ✅ 최근 완료된 작업 (2025-11-09)

### 보안 개선: 관리자 로그인 페이지 계정 정보 노출 제거 ✅
- **문제**: 관리자 로그인 페이지에 실제 관리자 계정 정보(이름, 전화번호)가 노출되어 보안 위험 발생
- **해결**: 관리자 계정 정보 섹션 완전 삭제
- **변경 파일**: `pages/admin/login.tsx`
- **삭제된 내용**:
  - 관리자 계정 정보 섹션 (이름 및 전화번호 노출)
  - 김탁수, 이은정, 최형호, 나수진 계정 정보
- **보안 영향**: 관리자 계정 정보가 공개 페이지에서 노출되지 않도록 수정 완료

### 갤러리 고도화 브랜치 작업 내역 ✅
- **브랜치**: `feature/gallery-advanced`
- **최신 커밋**: `02526a9` - Vercel 강제 배포 트리거
- **상태**: Phase 1-5 완료, Phase 3 일부 미완료

#### Phase 1: 인프라 준비 및 DB 설계 ✅ (완료)
- 데이터베이스 스키마 확장 완료 (10개 새 컬럼 추가)
- 인덱스 생성 완료 (7개 기본 + 1개 복합)
- 함수 및 트리거 생성 완료 (자동 업데이트 기능)
- 유틸리티 함수 생성 완료 (중복 검사, 검색)

#### Phase 2: 블로그 이미지 분석 및 분류 ✅ (완료)
- 모든 블로그 이미지 분석 API 생성 완료
- Storage에서 실제 파일 찾기 (HEAD 요청, 2초 타임아웃)
- 중복 이미지 감지 및 그룹화
- 블로그 연결 여부 확인
- 프론트엔드 UI 추가 완료
- 테스트 결과: 총 160개 블로그 글, 507개 고유 이미지 URL, 490개 Storage에서 찾음 (96.6%)

#### Phase 3: 블로그 이미지 마이그레이션 및 메타데이터 동기화 ⚠️ (부분 완료)
- ✅ 블로그 이미지 이동 (`originals/blog/YYYY-MM/` 구조)
- ✅ 메타데이터 자동 생성
- ✅ URL 업데이트 (`image_url` 필드)
- ⚠️ 블로그 글 `featured_image` URL 업데이트 (미완료)
- ⚠️ 블로그 글 `content` 내 이미지 URL 업데이트 (Markdown/HTML) (미완료)
- ⚠️ URL 업데이트 후 검증 (미완료)

#### Phase 4: 중복 이미지 제거 ✅ (완료)
- 중복 이미지 그룹 확인 (해시 기반)
- 안전한 중복 제거 (블로그 연결 이미지 보존)
- 메타데이터 정리

#### Phase 5: 프론트엔드 개발 편의성 개선 ✅ (완료)
- 폴더 트리 네비게이션 구현 (`components/gallery/FolderTree.tsx`)
- 폴더별 이미지 조회 API
- 갤러리 UI 통합 (폴더 트리 사이드바)
- 이미지 검색 및 필터링 강화
- 이미지 카드 정보 확장 및 사용 편의성 개선
- 폴더 트리 UX 개선 (Phase 5 - 1~3)

#### 최근 버그 수정 및 개선
- ✅ 폴더 생성 API mime 오류 수정
- ✅ 이미지 메타데이터 저장 후 제목이 파일명으로 덮어쓰기 되는 문제 수정
- ✅ 블로그 다운로드 이미지 다운로드 실패 추적 및 로깅 개선
- ✅ 마크다운 이미지 URL 추출 로직 개선
- ✅ 블로그 다운로드 기능 개선 (최신 저장된 내용 및 메타데이터 포함)
- ✅ 갤러리 상단 레거시 '메타데이터 동기화' 버튼 숨김

#### 문서 정리
- ✅ 갤러리 시스템 통합 가이드 추가 (`docs/gallery-complete-system-guide.md`)
- ✅ 메타데이터 AI 생성 계획 추가 (`docs/image-metadata-ai-generation-plan.md`)
- ✅ v1.0 태그 정보 업데이트

#### AI 메타데이터 생성 품질 개선 (2025-11-09)
- **문제**: 단일 API 호출로 전환 후 생성된 설명이 이전보다 짧아짐
- **해결**: 프롬프트 개선 및 토큰 제한 증가
- **변경 사항**:
  - `max_tokens`: 500 → 800 (60% 증가)
  - ALT text 가이드라인: 50-100 words → 80-150 words
  - Description 가이드라인: 50-100 words → 100-200 words
  - Keywords 가이드라인: 5-8개 → 8-12개
  - 프롬프트에 "풍부하고 상세한 설명" 지시 추가
  - UI 길이 제한 조정: description maxLength 200 → 300자
  - SEO 권장사항 업데이트: alt_text 80-200자, description 100-300자
- **변경 파일**:
  - `pages/api/analyze-image-prompt.js` - 골프 모드 프롬프트 개선
  - `pages/api/analyze-image-general.js` - 범용 모드 프롬프트 개선
  - `components/ImageMetadataModal/hooks/useAIGeneration.ts` - 키워드 제한 및 길이 제한 조정
  - `components/ImageMetadataModal/index.tsx` - description maxLength 증가
  - `components/ImageMetadataModal/utils/validation.ts` - SEO 권장사항 업데이트

#### 남은 작업
- ⚠️ Phase 3 미완료: 블로그 글 URL 업데이트 (featured_image, content)
- ⏳ 이미지 메타데이터 AI 생성 기능 (골프/일반 구분) - 계획 단계
- ⏳ Phase 6-7: 제품/고객 이미지 정리 (후속 작업)

### 이미지 갤러리 메타데이터 품질 검증 기능 (1단계) ✅
- **메타데이터 품질 검증 로직 추가** (`pages/api/admin/all-images.js`)
  - `hasQualityMetadata()`: 의미 있는 메타데이터 존재 여부 확인
  - `calculateMetadataQualityScore()`: 품질 점수 계산 (0-100점)
  - `getMetadataQualityIssues()`: 품질 이슈 목록 생성
- **API 응답에 품질 정보 포함**
  - `has_quality_metadata`: 의미 있는 메타데이터 존재 여부
  - `metadata_quality.score`: 품질 점수 (0-100)
  - `metadata_quality.issues`: 품질 이슈 목록
  - 각 항목별 존재 여부 (has_alt_text, has_title, has_description, has_keywords)
- **갤러리 UI에 품질 정보 표시** (`pages/admin/gallery.tsx`)
  - 메타데이터 없음: ⚠️ 노란색 배지
  - 메타데이터 불완전: ⚠️ 주황색 배지 (점수 + 이슈 목록)
  - 메타데이터 양호 (75점 이상): ✅ 초록색 배지
- **커밋**: 
  - `0e2a578` - 메타데이터 품질 검증 기능 추가
  - `44082e6` - 갤러리 UI에 품질 정보 표시 추가

### 이미지 Storage 전체 조회 개선 ✅
- **Storage 배치 조회 추가** (`pages/api/admin/all-images.js`)
  - 한 번에 1000개씩 배치로 조회하여 모든 파일 가져오기
  - 재귀 폴더 조회 시에도 배치 조회 적용
  - 총 1,166개 이미지 모두 조회 가능
- **커밋**: 
  - `537d16d` - Storage 배치 조회 추가
  - `acca405` - Storage list limit 추가

## ✅ 완료된 작업 (이전)

### 1. 완벽한 허브 중심 API (`/api/admin/content-calendar-hub.js`)
- **GET**: 허브 콘텐츠 조회 (채널별 상태 포함)
- **POST**: 새 허브 콘텐츠 생성
- **PUT**: 허브 콘텐츠 수정
- **DELETE**: 허브 콘텐츠 삭제
- **PATCH**: 채널별 상태 업데이트 및 초안 생성

### 2. 프로페셔널 허브 UI (`/admin/content-calendar-hub`)
- **허브 콘텐츠 목록**: 채널별 상태 시각화
- **통계 대시보드**: 채널별 연결 현황
- **CRUD 기능**: 생성, 조회, 수정, 삭제
- **채널별 초안 생성**: SMS, 네이버, 카카오 초안 생성

### 3. 채널별 상태 관리 시스템
- **JSONB 기반**: `channel_status` 필드로 관리
- **실시간 업데이트**: 채널별 상태 동기화
- **시각적 표시**: 색상별 상태 구분

### 4. AdminNav 업데이트
- **새 메뉴**: "🎯 허브 시스템" 추가
- **네비게이션**: `/admin/content-calendar-hub` 연결

## 🚀 핵심 기능

### 허브 중심 아키텍처
- **단일 허브**: 모든 채널의 루트 콘텐츠
- **채널별 상태**: JSONB로 관리
- **자동 동기화**: 채널별 초안 생성

### 프로페셔널 UI/UX
- **통계 대시보드**: 실시간 현황 파악
- **채널별 상태**: 시각적 상태 표시
- **직관적 인터페이스**: 사용자 친화적 설계

### 확장 가능한 구조
- **모듈화**: API와 UI 분리
- **확장성**: 새로운 채널 쉽게 추가
- **유지보수성**: 깔끔한 코드 구조

## 📊 시스템 구조

```
허브 콘텐츠 (cc_content_calendar)
├── 홈피블로그 (blog_post_id)
├── SMS (sms_id)
├── 네이버 블로그 (naver_blog_id)
└── 카카오 (kakao_id)
```

## 🚀 다음 단계: 갤러리 관리 시스템 고도화

### ✅ Phase 1 완료 (2025-11-02)
- **인프라 준비 및 DB 설계** 완료
  - 데이터베이스 스키마 확장 완료 (**10개 새 컬럼 추가**)
    - `original_path` (TEXT) - 실제 Storage 경로
    - `internal_id` (VARCHAR(255)) - 내부 고유 ID (UUID)
    - `"references"` (JSONB) - 참조 정보 배열 (예약어이므로 따옴표 사용)
    - `blog_posts` (INTEGER[]) - 연결된 블로그 글 ID 배열
    - `variants` (JSONB) - 베리에이션 경로 정보
    - `usage_type` (VARCHAR(50)) - 사용 유형
    - `product_slug` (VARCHAR(100)) - 제품 이미지용
    - `customer_id` (VARCHAR(50)) - 고객 콘텐츠용
    - `consent_status` (VARCHAR(20)) - 고객 동의 상태
    - `privacy_level` (VARCHAR(20)) - 프라이버시 레벨
  - 인덱스 생성 완료 (7개 기본 + 1개 복합)
  - 함수 및 트리거 생성 완료 (자동 업데이트 기능)
  - 유틸리티 함수 생성 완료 (중복 검사, 검색)
  
  ⚠️ **중요 사항**: `references` 컬럼은 PostgreSQL 예약어이므로 항상 따옴표(`"references"`)로 감싸서 사용해야 합니다. SQL 파일(`database/gallery-storage-schema.sql`)에 이미 반영되었습니다.

### ✅ Phase 2 완료 (2025-01-XX): 블로그 이미지 분석 및 분류
- **모든 블로그 이미지 분석 API** 생성 완료
  - API 엔드포인트: `POST /api/admin/analyze-all-blog-images`
  - 모든 블로그 글에서 이미지 URL 추출
  - Storage에서 실제 파일 찾기 (HEAD 요청, 2초 타임아웃)
  - 중복 이미지 감지 및 그룹화
  - 블로그 연결 여부 확인
  - 외부 URL 및 경로 추출 실패 분류
- **프론트엔드 UI 추가** 완료
  - 갤러리 페이지에 "블로그 이미지 분석" 버튼 추가
  - 분석 결과 표시 및 요약 정보 제공
  - 외부 URL, 경로 추출 실패 통계 표시
- **API 테스트 스크립트** 생성 완료
  - `test-analyze-blog-images.js`: 직접 API 테스트 가능
- **최적화** 완료
  - 배치 크기: 50 → 100개
  - HEAD 요청 타임아웃: 500ms → 2초
  - 전체 처리 시간 제한: 8초 (Vercel 10초 제한 고려)
  - 처리량 제한 제거 (전체 이미지 처리 시도)
- **테스트 결과** (2025-01-XX)
  - 총 블로그 글: 160개
  - 고유 이미지 URL: 507개
  - Storage에서 찾음: 490개 (96.6%)
  - Storage에서 못 찾음: 10개 (1.9%)
  - 외부 URL: 7개 (1.4%)

## 🚀 전체 이미지 및 소스 통합 마이그레이션 계획 (2025-11-10)

### 현재 상황 분석

#### 1. 이미지 분산 현황
- **블로그 이미지**: `/public/campaigns/YYYY-MM/` (일부), Supabase Storage `originals/blog/`
- **월별 퍼널 이미지**: `/public/campaigns/YYYY-MM/` (로컬만)
- **제품 이미지 (MASGOLF)**: `/public/products/`, `/public/main/products/`
- **MUZIIK 제품 이미지**: `/public/muziik/products/`
- **MUZIIK 브랜딩 이미지**: `/public/muziik/brand/`
- **MUZIIK 기술 이미지**: `/public/muziik/technology/`

#### 2. 소스 코드 분산 현황
- **제품 페이지**: `pages/products/[slug].tsx`, `pages/products/gold2-sapphire.tsx`, `pages/products/weapon-beryl.tsx`
- **MUZIIK 페이지**: `pages/muziik/index.tsx`, `pages/muziik/[product].tsx`, `pages/muziik/technology.tsx`
- **메인 페이지**: `pages/index.js` (제품 데이터 포함)
- **제품 데이터**: `lib/products.ts`, `data/products.json` (분산)

#### 3. 문제점
- 이미지가 로컬 `/public/` 폴더와 Supabase Storage에 혼재
- 블로그 본문에서 `/campaigns/YYYY-MM/...` 경로로 참조하지만 Storage에 없음
- 제품 이미지가 여러 폴더에 분산 (`/products/`, `/main/products/`)
- MUZIIK 이미지가 별도 폴더에 분리
- 소스 코드에서 이미지 경로가 하드코딩되어 있음
- 중복 이미지 관리 어려움
- **블로그 글에 오타 및 문법 오류 존재**
- **블로그 본문에 깨진 이미지 URL 존재 (ID 88, 309 등)**
- **이미지가 갤러리 폴더에 제대로 정리되지 않음**

### 목표
1. 모든 이미지를 Supabase Storage로 통합 마이그레이션
2. 제공된 폴더 구조에 맞게 정리
3. 소스 코드에서 이미지 경로를 Storage URL로 업데이트
4. 제품 데이터 및 소스 코드 중앙 관리
5. 메타데이터 생성 및 관리
6. **블로그 글 오타 및 문법 오류 정비**
7. **깨진 이미지 정비 및 복구**
8. **이미지를 갤러리 폴더에 제대로 옮기기**

### 우선순위: 전체 이미지 통합 마이그레이션

1. **Phase 8: 월별 퍼널 이미지 마이그레이션** (즉시 시작) ⚡
   - 블로그 본문 이미지 표시 문제 해결
   - 퍼널 페이지 이미지 중앙 관리
   - ID 88 게시물 등 영향받는 게시물 수정

2. **Phase 9: 제품 이미지 (MASGOLF) 마이그레이션** (우선 작업) ⚡
   - `/public/products/` → `originals/products/{product-slug}/`
   - `/public/main/products/` → `originals/products/{product-slug}/`
   - 제품 페이지 소스 코드 업데이트
   - 메인 페이지 제품 이미지 경로 업데이트

3. **Phase 10: MUZIIK 이미지 및 소스 정리** (우선 작업) ⚡
   - `/public/muziik/products/` → `originals/products/muziik-{product-slug}/`
   - `/public/muziik/brand/` → `originals/branding/muziik/`
   - `/public/muziik/technology/` → `originals/products/muziik-technology/`
   - MUZIIK 페이지 소스 코드 업데이트

4. **Phase 1-5: 블로그 이미지 정리** (진행 중)
   - 기존 블로그 이미지 정리 계속

5. **Phase 11: 블로그 글 정비 및 이미지 마이그레이션** (우선 작업) ⚡
   - 블로그 글 오타 정비
   - 깨진 이미지 정비 및 복구
   - 이미지를 갤러리 폴더에 제대로 옮기기
   - 블로그 본문 URL 업데이트

6. **Phase 6-7: 고객/기타 이미지 정리** (후속 작업)
   - 퍼널/제품 이미지 마이그레이션 완료 후 진행

---

## 📋 Phase 8: 월별 퍼널 이미지 마이그레이션 (우선 작업) ⚡

### 8-1. 퍼널 이미지 분석 및 수집
- [ ] 로컬 `/public/campaigns/` 폴더의 모든 이미지 확인
  - `2025-05/` (5월 퍼널)
  - `2025-06/` (6월 퍼널)
  - `2025-07/` (7월 퍼널)
  - `2025-08/` (8월 퍼널)
  - `2025-09/` (9월 퍼널)
- [ ] HTML 파일에서 사용된 이미지 경로 추출
  - `/versions/funnel-2025-05-live.html`
  - `/versions/funnel-2025-06-live.html`
  - `/versions/funnel-2025-07-live.html`
  - `/versions/funnel-2025-08-live.html`
  - `/versions/funnel-2025-09-live.html`
- [ ] 블로그 본문에서 `/campaigns/YYYY-MM/...` 경로로 참조하는 이미지 확인
- [ ] 중복 이미지 감지 (제품 이미지와 겹치는 경우)

### 8-2. Storage 폴더 구조 생성
- [ ] `originals/campaigns/YYYY-MM/` 폴더 구조 생성
  - `originals/campaigns/2025-05/`
  - `originals/campaigns/2025-06/`
  - `originals/campaigns/2025-07/`
  - `originals/campaigns/2025-08/`
  - `originals/campaigns/2025-09/`

### 8-3. 이미지 업로드 및 마이그레이션
- [ ] 로컬 `/public/campaigns/` 폴더의 이미지를 Supabase Storage로 업로드
- [ ] 파일명 정리 (UUID + SEO 파일명)
- [ ] 메타데이터 자동 생성 (골프 AI 생성 일괄 기능 활용)
- [ ] HTML 파일의 이미지 경로를 Storage URL로 업데이트
- [ ] 블로그 본문의 이미지 URL 자동 업데이트

### 8-4. 제품 이미지 분리 (선택)
- [ ] 퍼널 이미지 중 제품 이미지 식별
- [ ] 제품 이미지는 `originals/products/{product-slug}/`로 이동
- [ ] 퍼널 이미지는 `originals/campaigns/YYYY-MM/`에 유지

### 구현 계획
- **API 개발**: `/api/admin/migrate-campaign-images.js` (신규)
- **API 개발**: `/api/admin/update-funnel-image-urls.js` (신규)
- **API 개발**: `/api/admin/update-blog-campaign-urls.js` (신규)
- **프론트엔드**: 갤러리 페이지에 "퍼널 이미지 마이그레이션" 버튼 추가

---

## 📋 Phase 9: 제품 이미지 (MASGOLF) 마이그레이션 (우선 작업) ⚡

### 9-1. 제품 이미지 분석 및 수집
- [ ] `/public/products/` 폴더의 모든 이미지 확인
  - `secret-force-gold-2/` (메인, 갤러리, 상세, 스팩)
  - `secret-force-pro-3/` (메인, 갤러리, 상세, 스팩)
  - `secret-force-v3/` (메인, 갤러리, 상세, 스팩)
  - `secret-weapon-black/` (메인, 갤러리, 상세, 스팩)
  - `secret-weapon-gold-4-1/` (메인, 갤러리, 상세, 스팩)
- [ ] `/public/main/products/` 폴더의 모든 이미지 확인
  - `gold2-sapphire/` (MUZIIK 샤프트 포함 이미지)
  - `black-beryl/` (MUZIIK 샤프트 포함 이미지)
- [ ] 제품 페이지에서 사용된 이미지 경로 추출
  - `pages/products/[slug].tsx`
  - `pages/products/gold2-sapphire.tsx`
  - `pages/products/weapon-beryl.tsx`
  - `pages/index.js` (메인 페이지 제품 이미지)
- [ ] 중복 이미지 감지 및 통합

### 9-2. Storage 폴더 구조 생성
- [ ] `originals/products/{product-slug}/` 폴더 구조 생성
  - `secret-force-gold-2/studio/` (스튜디오 이미지)
  - `secret-force-gold-2/detail/` (상세페이지용)
  - `secret-force-gold-2/specs/` (스팩표 이미지)
  - `secret-force-gold-2/gallery/` (갤러리 이미지)
  - `secret-force-pro-3/...`
  - `secret-force-v3/...`
  - `secret-weapon-black/...`
  - `secret-weapon-4-1/...`

### 9-3. 이미지 업로드 및 마이그레이션
- [ ] 로컬 `/public/products/` 폴더의 이미지를 Supabase Storage로 업로드
- [ ] 로컬 `/public/main/products/` 폴더의 이미지를 Supabase Storage로 업로드
- [ ] 파일명 정리 (UUID + SEO 파일명)
- [ ] 메타데이터 자동 생성 (골프 AI 생성 일괄 기능 활용)
- [ ] 제품 페이지 소스 코드의 이미지 경로를 Storage URL로 업데이트
- [ ] 메인 페이지 제품 이미지 경로 업데이트

### 9-4. 제품 데이터 중앙 관리
- [ ] 제품 데이터 통합 (`lib/products.ts`, `data/products.json` → 단일 소스)
- [ ] 제품 이미지 경로를 Storage URL로 업데이트
- [ ] 제품 페이지 소스 코드 리팩토링

### 구현 계획
- **API 개발**: `/api/admin/migrate-product-images.js` (신규)
- **API 개발**: `/api/admin/update-product-image-urls.js` (신규)
- **프론트엔드**: 갤러리 페이지에 "제품 이미지 마이그레이션" 버튼 추가
- **소스 코드**: 제품 데이터 중앙 관리 시스템 구축

---

## 📋 Phase 10: MUZIIK 이미지 및 소스 정리 (우선 작업) ⚡

### 10-1. MUZIIK 이미지 분석 및 수집
- [ ] `/public/muziik/products/` 폴더의 모든 이미지 확인
  - `sapphire/` (메인, 샤프트, 차트)
  - `beryl/` (메인, 샤프트, 차트)
- [ ] `/public/muziik/brand/` 폴더의 모든 이미지 확인
  - 로고, 브랜딩 이미지
- [ ] `/public/muziik/technology/` 폴더의 모든 이미지 확인
  - 기술 설명 이미지
- [ ] MUZIIK 페이지에서 사용된 이미지 경로 추출
  - `pages/muziik/index.tsx`
  - `pages/muziik/[product].tsx`
  - `pages/muziik/technology.tsx`

### 10-2. Storage 폴더 구조 생성
- [ ] `originals/products/muziik-{product-slug}/` 폴더 구조 생성
  - `muziik-sapphire/` (제품 이미지)
  - `muziik-beryl/` (제품 이미지)
- [ ] `originals/branding/muziik/` 폴더 구조 생성
  - 로고, 브랜딩 이미지
- [ ] `originals/products/muziik-technology/` 폴더 구조 생성
  - 기술 설명 이미지

### 10-3. 이미지 업로드 및 마이그레이션
- [ ] 로컬 `/public/muziik/products/` 폴더의 이미지를 Supabase Storage로 업로드
- [ ] 로컬 `/public/muziik/brand/` 폴더의 이미지를 Supabase Storage로 업로드
- [ ] 로컬 `/public/muziik/technology/` 폴더의 이미지를 Supabase Storage로 업로드
- [ ] 파일명 정리 (UUID + SEO 파일명)
- [ ] 메타데이터 자동 생성 (골프 AI 생성 일괄 기능 활용)
- [ ] MUZIIK 페이지 소스 코드의 이미지 경로를 Storage URL로 업데이트

### 10-4. MUZIIK 소스 코드 정리
- [ ] MUZIIK 제품 데이터 중앙 관리 (`lib/muziik-products.ts`)
- [ ] MUZIIK 페이지 소스 코드 리팩토링
- [ ] 이미지 경로를 Storage URL로 업데이트

### 구현 계획
- **API 개발**: `/api/admin/migrate-muziik-images.js` (신규)
- **API 개발**: `/api/admin/update-muziik-image-urls.js` (신규)
- **프론트엔드**: 갤러리 페이지에 "MUZIIK 이미지 마이그레이션" 버튼 추가
- **소스 코드**: MUZIIK 제품 데이터 중앙 관리 시스템 구축

---

## 📋 Phase 11: 블로그 글 정비 및 이미지 마이그레이션 (우선 작업) ⚡

### 11-1. 블로그 글 오타 정비
- [ ] 모든 블로그 글 내용 검토
- [ ] 오타 및 문법 오류 수정
- [ ] 맞춤법 검사 도구 활용
- [ ] 일관된 문체 및 톤 적용
- [ ] SEO 최적화를 위한 키워드 검토

### 11-2. 깨진 이미지 정비 및 복구
- [ ] 모든 블로그 글의 이미지 URL 검증
- [ ] 깨진 이미지 URL 감지 및 목록 작성
- [ ] 깨진 이미지 원본 파일 찾기
  - 로컬 `/public/campaigns/` 폴더 확인
  - 로컬 `/public/products/` 폴더 확인
  - 로컬 `/public/main/products/` 폴더 확인
  - Supabase Storage 확인
- [ ] 깨진 이미지 복구 또는 대체 이미지 찾기
- [ ] 깨진 이미지 URL 수정

### 11-3. 이미지를 갤러리 폴더에 제대로 옮기기
- [ ] 블로그 본문에서 사용된 모든 이미지 추출
- [ ] 이미지 경로 분석 및 분류
  - `/campaigns/YYYY-MM/...` → `originals/campaigns/YYYY-MM/`
  - `/products/...` → `originals/products/{product-slug}/`
  - `/main/products/...` → `originals/products/{product-slug}/`
  - 로컬 파일 경로 → Supabase Storage 경로
- [ ] 이미지가 Storage에 없으면 업로드
- [ ] 이미지 파일명 정리 (UUID + SEO 파일명)
- [ ] 메타데이터 자동 생성 (골프 AI 생성 일괄 기능 활용)

### 11-4. 블로그 본문 URL 업데이트
- [ ] 블로그 본문의 모든 이미지 URL을 Storage URL로 업데이트
- [ ] 마크다운 형식 이미지 URL 업데이트
- [ ] HTML 형식 이미지 URL 업데이트
- [ ] URL 업데이트 후 검증

### 11-5. 블로그 글 품질 검증
- [ ] 모든 이미지가 정상적으로 표시되는지 확인
- [ ] 오타 및 문법 오류 최종 검토
- [ ] SEO 메타데이터 검토
- [ ] 모바일 반응형 확인

### 구현 계획
- **API 개발**: `/api/admin/audit-blog-posts.js` (신규)
  - 블로그 글 오타 검사
  - 깨진 이미지 감지
  - 이미지 경로 분석
- **API 개발**: `/api/admin/fix-broken-images.js` (신규)
  - 깨진 이미지 복구
  - 이미지 업로드 및 마이그레이션
- **API 개발**: `/api/admin/update-blog-image-urls.js` (신규)
  - 블로그 본문 URL 업데이트
- **프론트엔드**: 블로그 관리 페이지에 "블로그 글 정비" 버튼 추가
  - 오타 검사 결과 표시
  - 깨진 이미지 목록 표시
  - 이미지 마이그레이션 진행 상황 표시
- **도구**: 맞춤법 검사 API 연동 (선택)

### 작업 순서
1. **1단계**: 깨진 이미지 감지 및 목록 작성
2. **2단계**: 깨진 이미지 복구 및 업로드
3. **3단계**: 이미지를 갤러리 폴더에 제대로 옮기기
4. **4단계**: 블로그 본문 URL 업데이트
5. **5단계**: 블로그 글 오타 정비
6. **6단계**: 최종 검증 및 품질 확인

---

### Storage 폴더 구조 (최종 업데이트)

```
masgolf-images/
├── originals/
│   ├── blog/                     # ✅ 블로그 이미지
│   │   └── YYYY-MM/
│   │       └── {blog-id}/
│   │
│   ├── campaigns/                # 🆕 월별 퍼널 이미지 (Phase 8)
│   │   ├── 2025-05/
│   │   ├── 2025-06/
│   │   ├── 2025-07/
│   │   ├── 2025-08/
│   │   └── 2025-09/
│   │
│   ├── products/                 # 🆕 제품 이미지 (Phase 9)
│   │   ├── secret-force-gold-2/
│   │   │   ├── studio/
│   │   │   ├── detail/
│   │   │   ├── specs/
│   │   │   └── gallery/
│   │   ├── secret-force-pro-3/
│   │   ├── secret-force-v3/
│   │   ├── secret-weapon-black/
│   │   ├── secret-weapon-4-1/
│   │   ├── muziik-sapphire/      # 🆕 MUZIIK 제품 (Phase 10)
│   │   ├── muziik-beryl/
│   │   └── muziik-technology/
│   │
│   ├── branding/                 # 🆕 브랜딩 이미지 (Phase 10)
│   │   ├── masgolf/
│   │   └── muziik/
│   │
│   ├── locations/                # 🟡 매장 이미지 (후속 작업)
│   ├── customers/                # 🟡 고객 콘텐츠 (후속 작업)
│   ├── uploaded/                 # 직접 업로드 (기존)
│   └── ai-generated/             # AI 생성 원본 (기존)
```

### 관련 문서
- `docs/gallery-migration-priority-plan.md`: 실전 개발 계획
- `docs/gallery-architecture-principles.md`: 아키텍처 원칙
- `docs/gallery-complete-system-guide.md`: 갤러리 시스템 완전 가이드 (✅ 신규 생성)
- `database/gallery-storage-schema.sql`: 데이터베이스 스키마
- `docs/gallery-migration-checklist.md`: 누락 사항 체크리스트
- `docs/image-metadata-ai-generation-plan.md`: 메타데이터 AI 생성 계획 (✅ 신규 생성)

## 🎯 향후 개선 사항

1. **트리 구조 UI**: 허브-채널 관계 시각화
2. **고급 기능**: 자동 동기화, 스케줄링
3. **성능 최적화**: 인덱싱, 캐싱
4. **모니터링**: 로그, 알림 시스템

## 📁 변경된 파일

- `pages/api/admin/content-calendar-hub.js` (새로 생성)
- `pages/admin/content-calendar-hub.tsx` (새로 생성)
- `components/admin/AdminNav.tsx` (업데이트)
- `docs/project_plan.md` (업데이트)

---

## 📦 2025-10-30 SMS 시스템 고도화 — 1차 구현

### 무엇을 했나
- `pages/api/channels/sms/send.js`: 단일 수신자 → 전체 수신자 대량 발송으로 확장, 200건 청크 전송, 성공/실패 집계, per-recipient 로그/연락 이벤트 적재 추가.
- `pages/api/solapi/webhook.js` (신규): Solapi 배달/실패 웹훅 수신 엔드포인트 추가(요약 이벤트 기록, 원본 페이로드 로그).
 - `pages/api/channels/sms/send.js`: 수신거부(Opt-out) 고객 자동 제외 로직 추가(`customers.opt_out`).

### 왜 했나
- 안정적인 대량 발송(청크/집계)과 이후 운영 가시성(로그/연락 이벤트) 확보를 위해.

### 변경 파일
- `pages/api/channels/sms/send.js`
- `pages/api/solapi/webhook.js`

### 남은 일
- Opt-out(수신거부) UI 토글 및 세그먼트 조건 반영
- ~~VIP 레벨 산정 배치 작업~~ ✅ 완료
- ~~관리자 UI(세그먼트/템플릿/스케줄)~~ ✅ 완료 (세그먼트 필터링 완료)
- 운영/장애 대응 문서 보강

---

## 📦 2025-10-31 버그 수정 및 시스템 강화

### 수정 사항
- **GoTrueClient 중복 인스턴스 경고 해결**: RealtimeMetrics, ai-management에서 통합 클라이언트 사용
  - 파일: `components/admin/dashboard/RealtimeMetrics.tsx`, `pages/admin/ai-management.tsx`
  - 해결: `lib/supabase-client.ts`의 통합 인스턴스 사용
  - 문서: `docs/resolved/2025-10-31-gotrue-fix.md`

- **MMS 이미지 업로드 에러 핸들링 강화**: formidable Promise 래퍼, JPG 파일 검증 추가
  - 파일: `pages/api/solapi/upload-image.js`
  - 해결: Promise 래퍼 추가, JPG 파일 검증 강화, 에러 메시지 개선
  - 문서: `docs/resolved/2025-10-31-mms-upload-fix.md`

### 변경 파일
- `components/admin/dashboard/RealtimeMetrics.tsx`
- `pages/admin/ai-management.tsx`
- `pages/api/solapi/upload-image.js`
- `docs/project_plan.md`
- `docs/resolved/2025-10-31-gotrue-fix.md` (신규)
- `docs/resolved/2025-10-31-mms-upload-fix.md` (신규)

## 🔒 보안 이슈 해결 (2025-01-27)

### Supabase Security Advisor 오류 해결
- **문제**: 61개의 "Policy Exists RLS Disabled" 오류 발생
- **원인**: RLS(Row Level Security) 정책이 존재하지만 비활성화됨
- **해결**: 모든 테이블에 대한 RLS 정책 재구성

### 생성된 파일
- `database/fix-rls-security-errors.sql` - 기본 RLS 정책 수정
- `database/complete-rls-fix.sql` - 모든 테이블 RLS 완전 수정

### 적용 방법
1. Supabase 대시보드 → SQL Editor 접속
2. `complete-rls-fix.sql` 스크립트 실행
3. Security Advisor에서 오류 해결 확인

## ✨ 완성도

- **API**: 완벽한 CRUD + 채널 관리
- **UI**: 프로페셔널한 디자인
- **기능**: 모든 요구사항 구현
- **확장성**: 미래 확장 고려
- **보안**: RLS 정책 완전 수정

**프로페셔널한 허브 시스템이 완성되었습니다!** 🎉

---

## 📦 2025-01-27 SMS 고도화된 세그먼트 필터링 및 VIP 레벨 자동 분류

### 무엇을 했나
- **고객 API 세그먼트 필터 추가**: 구매자/비구매자, 구매 경과 기간(0-1년, 1-3년, 3-5년, 5년+), VIP 레벨 필터 지원
- **SMS 에디터 세그먼트 선택 UI**: 구매자/비구매자, 구매 경과 기간, VIP 레벨을 선택하여 자동으로 수신자 목록 생성
- **CustomerSelector 세그먼트 필터**: 고객 선택 모달에도 세그먼트 필터 적용
- **VIP 레벨 자동 분류 로직**: 구매 날짜 기반으로 Platinum/Gold/Silver/Bronze 자동 분류
- **고객 관리 페이지 VIP 업데이트 버튼**: 모든 고객의 VIP 레벨을 한 번에 업데이트

### 왜 했나
- 구매자와 비구매자에게 차별화된 메시지 전송
- 구매 경과 기간에 따른 맞춤형 마케팅 메시지 전송
- VIP 레벨에 따른 고급 고객 관리 및 타겟팅

### 변경 파일
- `pages/api/admin/customers/index.ts` - 세그먼트 필터 파라미터 추가
- `pages/admin/sms.tsx` - 세그먼트 선택 UI 추가
- `components/admin/CustomerSelector.tsx` - 세그먼트 필터 추가
- `pages/api/admin/customers/update-vip-levels.ts` (신규) - VIP 레벨 자동 분류 API
- `pages/admin/customers/index.tsx` - VIP 레벨 업데이트 버튼 추가

### 기능 설명
1. **구매자/비구매자 분류**
   - 구매자: `first_purchase_date` 또는 `last_purchase_date`가 있는 고객
   - 비구매자: 두 날짜 모두 null인 고객

2. **구매 경과 기간 분류** (구매자만)
   - 1년 미만: 최근 구매 고객
   - 1-3년: 재구매 유도 대상
   - 3-5년: 장기 고객 복귀 대상
   - 5년 이상: 장기 미구매자

3. **VIP 레벨 자동 분류**
   - Platinum: 최근 3개월 이내 구매
   - Gold: 최근 6개월 이내 구매
   - Silver: 최근 1년 이내 구매 또는 1-3년 경과
   - Bronze: 3년 이상 경과
   - null: 비구매자

### 사용 예시
1. **구매자에게만 특별 할인 메시지 발송**
   - 세그먼트: "구매자만" 선택 → "세그먼트 적용하여 수신자 자동 선택" 클릭

2. **장기 미구매자 재구매 유도 메시지**
   - 세그먼트: "구매자만" + "5년 이상" 선택 → 자동 선택

3. **VIP 고객 감사 메시지**
   - 세그먼트: "VIP 레벨: Platinum" 선택 → 자동 선택

### 남은 작업
- 템플릿 저장/관리 기능 (향후 개선)
- 스케줄 발송 기능 (향후 개선)
- 구매 횟수/금액 기반 VIP 레벨 산정 (구매 이력 테이블 추가 후)

---

## 🧹 2025-10-31 운영 정리 - 테스트 페이지 제거

- 무엇을 했나: 운영에 노출된 임시 테스트 페이지 `/test-sms` 삭제
- 왜 했나: 관리자 메뉴에 없는 디버그/테스트 경로의 외부 접근 차단, 보안·혼선 방지
- 변경 파일:
  - `pages/test-sms.tsx` 삭제
- 참고: 동일 성격의 숨은 경로 추가 점검 예정 (`/pages/test-auth.tsx`, `/pages/test-db.js` 등)

### 🧹 추가 정리 (2025-10-31)
- 테스트/디버그/마이그레이션 보조 파일 운영 노출 방지를 위해 백업 확장자로 리네임
- 백업된 항목(.backup.20251031):
  - `pages/test-db.js`
  - `pages/debug-404.tsx`
  - `pages/test-auth.tsx`
  - `pages/api/test-auth.js`
  - `pages/api/test-supabase.js`
  - `pages/api/ga4-test.ts`
  - `pages/api/debug-image-status.js`
  - `pages/api/debug-storage.js`
  - `pages/api/preview-image-prompt.js`
  - `pages/api/migrate-wix-images-playwright.js`
  - `pages/api/migrate-naver-blog-preview.js`
  - `pages/muziik/index_backup_20251021_082924.tsx`
- 목적: 메뉴에 없는 테스트 경로 외부 접근 차단, 혼선/보안 리스크 축소

### 2025-10-31 SMS 발송 안정화 (허브콘텐츠 1회 원칙)
- 허브콘텐츠별 중복 발송 방지: `message_logs(content_id, customer_phone)` 유니크 인덱스 전제, `send.js`에서 중복 제외 후 발송, 로그는 upsert로 갱신
- 발송 이력 조회 API 추가: `GET /api/admin/sms/history?contentId=...` (총건수/성공/실패/목록)
- 에디터 개선: 세그먼트 “자동 페이징 수집(1000 단위)”로 전체 대상 수집, “발송 이력 보기” 버튼 추가
- 응답 개선: 중복 제외 수(duplicates), 최종 sent/failed 카운트 반환

---

## 📦 2025-11-09 이미지 메타데이터 AI 생성 기능 개선 완료 ✅

### 현재 상태: ✅ 구현 완료

**목적**: 골프 특화 이미지와 일반 이미지를 구분하여 각각에 최적화된 메타데이터를 생성하는 기능

### ✅ 구현 완료
- `components/ImageMetadataModal/hooks/useAIGeneration.ts` - 기본 AI 생성 Hook (골프 특화만 구현됨)
- `components/ImageMetadataModal/index.tsx` - 메타데이터 모달 UI
- `pages/api/analyze-image-prompt.js` - 골프 특화 이미지 분석 API
- `pages/api/admin/image-ai-analyzer.js` - 골프 특화 키워드 추출 API

### ✅ 구현 완료 (2025-11-09)
- ✅ `pages/api/analyze-image-general.js` - 범용 이미지 분석 API 생성 완료
- ✅ `pages/api/admin/image-ai-analyzer-general.js` - 범용 키워드 추출 API 생성 완료
- ✅ `useAIGeneration.ts`에 `generateGolfMetadata()`, `generateGeneralMetadata()` 함수 추가 완료
- ✅ `ImageMetadataModal/index.tsx`에 "⛳ 골프 AI 생성", "🌐 일반 메타 생성" 버튼 추가 완료
- ✅ 프롬프트 개선 완료 (2025-11-09):
  - `max_tokens`: 500 → 800 (더 풍부한 설명 생성)
  - ALT text: 50-100 words → 80-150 words
  - Description: 50-100 words → 100-200 words
  - Keywords: 5-8개 → 8-12개
  - "풍부하고 상세한 설명" 지시 추가

### 계획된 구현 내용

#### 1. 범용 API 생성
- **`/api/analyze-image-general.js`** (신규 필요)
  - 골프 제약 없는 범용 프롬프트
  - 모든 이미지 타입 인식 (건물, 음식, 사람, 풍경, 제품 등)
  - 성능 최적화: max_tokens 300, temperature 0.3

- **`/api/admin/image-ai-analyzer-general.js`** (신규 필요)
  - 골프 특화 없이 일반 키워드 추출
  - 모든 주제 키워드 추출 (건물, 음식, 사람, 풍경, 제품 등)
  - 성능 최적화: max_tokens 100, temperature 0.1

#### 2. Hook 함수 개선
- **`useAIGeneration.ts`** 개선 필요
  - `generateGolfMetadata()`: 골프 메타데이터 생성 (기존 `generateAllMetadata` 리네임)
  - `generateGeneralMetadata()`: 범용 메타데이터 생성 (신규)
  - 범용 모드: 연령대 분석 제거 (골프 특화 기능)
  - 범용 모드: 카테고리 자동 결정 제거
  - 범용 모드: 카테고리 키워드 자동 추가 제거

#### 3. UI 개선
- **`index.tsx`** 버튼 추가 필요
  - "한글 AI 생성" → "⛳ 골프 AI 생성" (텍스트 변경)
  - "🌐 일반 메타 생성" 버튼 추가
  - 버튼 배치: `[⛳ 골프 AI 생성] [🌐 일반 메타 생성]`

### ✅ 성능 최적화 완료
- ✅ 단일 API 호출: 골프 모드와 범용 모드 모두 1개 API 호출로 최적화
- ✅ JSON 형식 응답: 모든 메타데이터를 한 번에 생성하여 효율성 향상
- ✅ 에러 핸들링: API 호출 독립적 에러 처리
- ✅ 부분 성공 처리: 일부 필드만 성공해도 결과 반환

### ✅ 구현된 차이점

| 항목 | 골프 모드 | 범용 모드 |
|------|----------|----------|
| API 엔드포인트 | `/api/analyze-image-prompt` | `/api/analyze-image-general` |
| 응답 형식 | JSON (alt_text, title, description, keywords, age_estimation) | JSON (alt_text, title, description, keywords) |
| 연령대 분석 | ✅ 포함 | ❌ 제거 (골프 특화) |
| 카테고리 자동 결정 | ✅ 포함 | ❌ 제거 |
| 카테고리 키워드 추가 | ✅ 포함 | ❌ 제거 |
| 제목 기본값 | "골프 이미지" | "이미지" |
| API 호출 수 | **1개** | **1개** |

### 계획된 변경 파일
- `pages/api/analyze-image-general.js` (신규 필요)
- `pages/api/admin/image-ai-analyzer-general.js` (신규 필요)
- `components/ImageMetadataModal/hooks/useAIGeneration.ts` (수정 필요)
- `components/ImageMetadataModal/index.tsx` (수정 필요)
- `docs/image-metadata-ai-generation-plan.md` (✅ 생성 완료)
- `docs/project_plan.md` (✅ 업데이트 완료)

### 계획된 사용 방법
1. **골프 이미지**: "⛳ 골프 AI 생성" 버튼 클릭 → 골프 중심 메타데이터 생성
2. **일반 이미지**: "🌐 일반 메타 생성" 버튼 클릭 → 범용 메타데이터 생성

### ✅ 최적화된 성능 (2025-11-09 개선)
- **골프 모드**: 1개 API 호출, 예상 시간 2-3초, 토큰 ~800 (max_tokens 증가로 풍부한 설명 생성)
- **범용 모드**: 1개 API 호출, 예상 시간 2-3초, 토큰 ~800 (max_tokens 증가로 풍부한 설명 생성)
- **프롬프트 개선**: ALT text 80-150 words, Description 100-200 words, Keywords 8-12개

### 관련 문서
- `docs/image-metadata-ai-generation-plan.md` - 상세 구현 계획

---

## 🐛 이미지 추가 모듈 오류 수정 (2025-01-XX)

### 발견된 오류
- **오류 메시지**: "업로드 실패: path is required"
- **원인**: `storage-signed-upload` API는 `path`를 요구하지만, 갤러리 페이지의 이미지 추가 모달에서는 `fileName`, `folder`, `contentType`을 보내고 있었음
- **API 응답 불일치**: API는 `token`만 반환하지만, 갤러리 코드는 `signedUrl`, `objectPath`, `publicUrl`을 기대하고 있었음

### 수정 내용
- **`pages/admin/gallery.tsx`**:
  - Supabase 클라이언트 import 추가 (`@supabase/supabase-js`)
  - `storage-signed-upload` API 호출 방식 수정:
    - `fileName`, `folder`, `contentType` → `path` (올바른 형식으로 변경)
    - 파일명 정리 로직 추가 (특수문자 제거, 타임스탬프 추가)
    - 경로 형식: `originals/${dateStr}/${ts}_${baseName}`
  - Supabase SDK를 사용한 업로드 방식으로 변경:
    - `token`을 받아서 `uploadToSignedUrl()` 사용
    - `getPublicUrl()`로 공개 URL 가져오기
  - 에러 처리 개선:
    - 환경 변수 검증 추가
    - 상세한 에러 메시지 제공
    - 콘솔 로깅 추가

### 수정 전/후 비교
| 항목 | 수정 전 | 수정 후 |
|------|---------|---------|
| API 요청 형식 | `{ fileName, folder, contentType }` | `{ path }` |
| API 응답 처리 | `{ signedUrl, objectPath, publicUrl }` | `{ token }` |
| 업로드 방식 | `fetch(signedUrl, PUT)` | `sb.storage.uploadToSignedUrl()` |
| 공개 URL 가져오기 | API 응답에서 직접 | `sb.storage.getPublicUrl()` |
| 에러 처리 | 기본적인 try-catch | 상세한 검증 및 로깅 |

### 참고 코드
- **`pages/admin/blog.tsx`**: 올바른 업로드 방식 참고 (3745-3785줄)
- **`pages/api/admin/storage-signed-upload.js`**: API 스펙 확인

### 테스트 필요 사항
- ✅ 파일 업로드 기능 정상 작동 확인
- ✅ HEIC/JPG/PNG 파일 형식 지원 확인
- ✅ 메타데이터 자동 저장 확인
- ✅ EXIF 백필 비동기 처리 확인

### 추가 개선 가능 사항
- 파일 선택 UI 개선 (드래그 앤 드롭, 미리보기)
- 업로드 진행률 표시
- 파일 크기 제한 추가
- 파일 타입 검증 강화

---