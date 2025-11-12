# E2E 테스트 스크립트

이 폴더에는 관리자 페이지의 주요 기능을 검증하는 Playwright E2E 테스트 스크립트가 저장되어 있습니다.

## 🔐 로그인 정보

**중요**: 로그인 정보는 `TEST_CREDENTIALS.md` 파일을 참고하세요.

- **로그인 ID**: `010-6669-9000`
- **비밀번호**: `66699000`

자세한 내용은 [`TEST_CREDENTIALS.md`](./TEST_CREDENTIALS.md)를 참고하세요.

## 스크립트 목록

### `gallery-duplicate-check.js` (신규)
갤러리 페이지에서 중복 이미지를 확인하는 E2E 테스트 스크립트입니다.

**테스트 시나리오:**
1. 관리자 로그인
2. 갤러리 페이지 접속
3. `originals/campaigns/2025-05` 폴더 선택
4. 이미지 수집 및 중복 감지
5. URL 기준 및 파일명 기준 중복 확인
6. 결과 저장 및 스크린샷 촬영

**실행 방법:**
```bash
cd /Users/m2/MASLABS/win.masgolf.co.kr
node docs/e2e-tests/gallery-duplicate-check.js
```

**결과 파일:**
- `docs/e2e-tests/gallery-duplicate-check-result.json` - 중복 감지 결과
- `docs/gallery-duplicate-check-{timestamp}.png` - 스크린샷

**필수 조건:**
- 로컬 서버가 실행 중이어야 함 (`npm run dev`)
- 로그인 정보: `TEST_CREDENTIALS.md` 참고

---

### `blog-image-variation-flow.js`
블로그 관리 페이지의 이미지 변형 기능 전체 플로우를 테스트하는 스크립트입니다.

**테스트 시나리오:**
1. 로그인
2. 블로그 관리 페이지 접속
3. 게시물 생성/편집 모드 진입
4. 썸네일 이미지 선택 (대표 이미지 설정)
5. "기존 이미지 변형" 버튼 클릭
6. 변형 모달에서 갤러리 탭 클릭
7. 모달 내 첫 번째 이미지 선택
8. "이미지 불러오기" 버튼 클릭
9. "생성된 이미지" 섹션 나타날 때까지 대기
10. 이미지 업로드 완료 대기
11. 생성된 이미지 위의 "변형" 버튼 클릭
12. 변형 생성 완료까지 대기
13. 생성 완료 확인 모달 닫기

**실행 방법:**
```bash
cd /Users/m2/MASLABS/win.masgolf.co.kr
node docs/e2e-tests/blog-image-variation-flow.js
```

**필수 조건:**
- 로컬 서버가 실행 중이어야 함 (`npm run dev`)
- 로그인 정보: `TEST_CREDENTIALS.md` 참고

## 커서AI에서 사용하기

이 스크립트들은 커서AI에게 관리자 페이지 기능을 설명하거나 테스트할 때 참조용으로 사용할 수 있습니다.

**사용 예시:**
- "블로그 이미지 변형 기능이 어떻게 동작하는지 확인해줘" → `blog-image-variation-flow.js` 참조
- "갤러리에도 같은 기능을 적용하려면 어떻게 해야 해?" → 이 스크립트를 참고하여 갤러리 페이지에 적용

## 주의사항

- 모든 스크립트는 실제 데이터베이스와 상호작용합니다
- 테스트 실행 전에 로컬 서버가 실행 중인지 확인하세요
- 테스트 중 생성된 데이터는 수동으로 정리해야 할 수 있습니다
- 로그인 정보는 절대 Git에 커밋하지 마세요

