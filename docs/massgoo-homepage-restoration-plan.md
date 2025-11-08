# MASSGOO 홈페이지 복원 계획

## 📋 개요

배포된 최종 버전(`https://mas-lva3ulwew-taksoo-kims-projects.vercel.app`)을 기반으로 로컬 파일을 복원하는 계획입니다.

## 🎯 목표

1. 배포된 사이트의 모든 페이지 HTML을 스크래핑하여 분석
2. 현재 로컬 파일과 비교하여 차이점 파악
3. 배포된 버전의 구조와 내용을 정확히 복원
4. 이미지 경로 및 링크 확인 및 수정

## 📊 확인된 페이지 구조

### 1. 홈페이지 (`/`)
- **URL**: `https://mas-lva3ulwew-taksoo-kims-projects.vercel.app/`
- **제목**: "MASSGOO - 프리미엄 골프 클럽의 새로운 기준"
- **주요 섹션**:
  - 히어로 섹션: "MASSGOO X MUZIIK"
  - 제품 소개: 시크리트웨폰 블랙 MUZIIK, 시크리트포스 골드 2 MUZIIK
  - 혁신적인 테크놀로지 섹션 (`id="technology"`)
  - 페이스 두께의 비밀
  - 프리미엄 드라이버 컬렉션 (`id="products"`)
  - 퍼포먼스의 변화 (`id="reviews"`)
  - 문의하기

### 2. 브랜드 스토리 (`/about`)
- **URL**: `https://mas-lva3ulwew-taksoo-kims-projects.vercel.app/about`
- **제목**: "MASSGOO 브랜드 스토리 - 22년 전통의 프리미엄 드라이버"
- **주요 섹션**:
  - 히어로: "22년 전, 하나의 꿈이 시작되었습니다"
  - 브랜드 철학
  - 혁신의 시작
  - 차별화된 기술력
  - 프리미엄 샤프트 콜라보
  - 글로벌 여정
  - 22년간 함께한 골퍼들의 이야기
  - 프리미엄 드라이버 시리즈
  - 서비스 보증

### 3. 시타매장 (`/contact`)
- **URL**: `https://mas-lva3ulwew-taksoo-kims-projects.vercel.app/contact`
- **제목**: "마쓰구 수원본점 - MASGOLF 시타센터 | 위치 안내"
- **주요 섹션**:
  - 히어로: "마쓰구 수원본점"
  - 주소 및 연락처
  - 매장 운영 시간
  - 지도로 찾아오기 (Google Maps 임베드)
  - 네비게이션 앱 링크 (Google Maps, 네이버 지도, T맵, 카카오맵)
  - 매장 둘러보기 (외관, 내부 이미지)
  - 찾아오는 길 (대중교통, 자가용)
  - 주변 랜드마크

## 🔍 확인된 네비게이션 메뉴

모든 페이지에서 공통으로 사용되는 상단 네비게이션:

1. **드라이버**: `https://www.masgolf.co.kr/` (외부 링크)
2. **기술력**: `/#technology` (홈페이지 앵커)
3. **고객후기**: `/#reviews` (홈페이지 앵커)
4. **브랜드 스토리**: `/about` (내부 링크)
5. **시타매장**: `/contact` (내부 링크)
6. **무료 시타**: `https://www.mas9golf.com/try-a-massgoo` (외부 링크, 빨간 버튼)

## 📝 복원 작업 단계

### 1단계: HTML 스크래핑 및 분석 ✅
- [x] 배포된 페이지 HTML 스크래핑
- [x] 스크린샷 캡처
- [x] 페이지 구조 분석

### 2단계: 현재 파일 분석
- [ ] `pages/index.js` 현재 상태 확인
- [ ] `pages/about.tsx` 현재 상태 확인
- [ ] `pages/contact.tsx` 현재 상태 확인
- [ ] 스크래핑된 HTML과 비교

### 3단계: 이미지 경로 확인
- [ ] 스크래핑된 HTML에서 이미지 경로 추출
- [ ] 현재 프로젝트의 이미지 경로와 비교
- [ ] 누락된 이미지 확인

### 4단계: 컴포넌트 구조 분석
- [ ] 스크래핑된 HTML의 클래스명 및 구조 분석
- [ ] Tailwind CSS 클래스 확인
- [ ] React 컴포넌트 구조 파악

### 5단계: 파일 복원
- [ ] `pages/index.js` 복원
- [ ] `pages/about.tsx` 복원
- [ ] `pages/contact.tsx` 복원
- [ ] 이미지 경로 수정
- [ ] 링크 수정

### 6단계: 검증 및 테스트
- [ ] 로컬 빌드 테스트
- [ ] 각 페이지 렌더링 확인
- [ ] 네비게이션 링크 확인
- [ ] 이미지 로딩 확인

## 🖼️ 이미지 확인 사항

### 홈페이지 이미지
- 히어로 이미지: "MASSGOO 히어로 - 티타늄 원석"
- 제품 이미지들
- 기술력 섹션 이미지들
- 고객후기 이미지들

### About 페이지 이미지
- 히어로 이미지: "티타늄 드라이버 클로즈업"
- 2003년 초기 제품 이미지
- 수상 내역 이미지
- 프리미엄 드라이버 시리즈 이미지
- 서비스 보증 이미지

### Contact 페이지 이미지
- 히어로 이미지: "마쓰구 수원본점 외관"
- 외관 이미지들 (3개)
- 내부 이미지들 (2개)

## ⚠️ 주의사항

1. **관리자 페이지 보호**: `pages/admin/` 디렉토리는 절대 변경하지 않음
2. **muziik 사이트 보호**: `pages/muziik/` 디렉토리는 절대 변경하지 않음
3. **이미지 경로**: Next.js의 `Image` 컴포넌트 사용 확인
4. **SEO 메타 태그**: 각 페이지의 메타 태그 확인
5. **반응형 디자인**: 모바일 메뉴 및 반응형 레이아웃 확인

## 📂 스크래핑된 파일 위치

- `./scraped-pages/home.html` - 홈페이지 HTML
- `./scraped-pages/about.html` - About 페이지 HTML
- `./scraped-pages/contact.html` - Contact 페이지 HTML
- `./scraped-pages/home.png` - 홈페이지 스크린샷
- `./scraped-pages/about.png` - About 페이지 스크린샷
- `./scraped-pages/contact.png` - Contact 페이지 스크린샷

## 🔄 다음 단계

1. 스크래핑된 HTML 파일을 상세 분석
2. 현재 로컬 파일과 비교하여 차이점 도출
3. 복원 작업 진행
4. 빌드 및 배포 전 최종 검증

