# 갤러리 메타데이터 (골프 AI / OCR) 로그 확인 방법

## 1. 브라우저 콘솔 로그

이미지 추가 시 **골프 AI 생성** 또는 **OCR (구글 비전)** 선택 후 업로드하면 다음 로그가 출력됩니다.

### 골프 AI 생성
- `[갤러리 메타데이터] 🤖 분석 API 호출:` — 분석 API 요청 시작
- `[갤러리 메타데이터] 📊 분석 결과:` — 분석 성공 시
- `[갤러리 메타데이터] 📤 메타데이터 저장 요청 (PUT):` — 저장 요청 직전
- **실패 시:** `[갤러리 메타데이터] ❌ 메타데이터 저장 실패:` — `status`, `error`, `details`, `code`, `hint` 확인

### OCR (구글 비전)
- `[갤러리 메타데이터] 📄 OCR 처리 시작:` — OCR API 요청 시작
- `[갤러리 메타데이터] 📄 OCR API 응답:` — OCR API 상태
- `[갤러리 메타데이터] 📄 OCR 결과:` — 텍스트 추출 여부
- `[갤러리 메타데이터] 📤 OCR 메타데이터 저장 요청:` — 저장 요청 직전
- **실패 시:** `[갤러리 메타데이터] ❌ OCR 메타데이터 저장 실패:` — `status`, `error`, `details`, `code` 확인

### 콘솔에서 필터
- **Chrome DevTools Console**에서 `[갤러리 메타데이터]` 로 검색하면 메타데이터 관련 로그만 볼 수 있습니다.
- **실패 시** 빨간색으로 표시된 `PUT .../api/admin/image-metadata 500` 항목을 클릭해 **Response** 탭에서 `details`, `code`, `hint` 를 확인하세요.

---

## 2. 서버 터미널 로그 (npm run dev)

`npm run dev` 를 실행한 터미널에서는 다음 로그가 출력됩니다.

- `[image-metadata] 📝 PUT 업데이트 시도:` — PUT 요청 수신
- `[image-metadata] ⚠️ cdn_url에 해당 레코드 없음 → INSERT 시도` — 레코드 없을 때 INSERT 시도
- `[image-metadata] ✅ INSERT 완료:` — INSERT 성공
- `[image-metadata] ❌ INSERT 실패:` — INSERT 실패 시 **message, code, details** (원인 파악용)
- `[image-metadata] ❌ UPDATE 오류:` — UPDATE 실패 시

**500 원인 확인:** 서버 터미널에 `[image-metadata] ❌` 로 시작하는 줄이 있으면 그 다음에 나오는 `message`, `code`, `details` 가 원인입니다.

---

## 3. Playwright 재현 테스트

로그를 파일로 남기며 자동 재현하려면:

```bash
# 로컬 서버 실행 중인 상태에서
node e2e-test/playwright-gallery-metadata-ocr-golf-ai.js
# 또는 OCR만 테스트
METADATA_TYPE=ocr node e2e-test/playwright-gallery-metadata-ocr-golf-ai.js
```

결과는 `e2e-test/gallery-metadata-test-log.txt` 에 저장됩니다.
