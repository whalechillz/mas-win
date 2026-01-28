# 이미지 삭제 오류 해결 가이드

## 문제 상황

코드는 올바르게 수정되었지만 여전히 `/api/admin/gallery-image-delete` 오류가 발생합니다.

## 원인 분석

1. **코드 수정 완료**: `pages/admin/customers/index.tsx`에서 `extractImageNameFromUrl` 사용하여 `imageUrl` → `imageName` 변환 구현 완료
2. **오류 메시지**: `/api/admin/gallery-image-delete` API 호출 (존재하지 않는 API)
3. **가능한 원인**:
   - 브라우저 캐시 문제
   - Next.js 빌드 캐시 문제
   - 서버 재시작 필요

## 해결 방법

### 1. 개발 서버 재시작

```bash
# 서버 중지 (Ctrl+C)
# 서버 재시작
npm run dev
# 또는
yarn dev
```

### 2. 브라우저 캐시 클리어

1. **Chrome/Edge**:
   - `Ctrl+Shift+Delete` (Windows) 또는 `Cmd+Shift+Delete` (Mac)
   - "캐시된 이미지 및 파일" 선택
   - "데이터 삭제" 클릭

2. **하드 새로고침**:
   - `Ctrl+Shift+R` (Windows) 또는 `Cmd+Shift+R` (Mac)
   - 또는 `Ctrl+F5` (Windows)

3. **개발자 도구에서 캐시 비활성화**:
   - 개발자 도구 열기 (F12)
   - Network 탭에서 "Disable cache" 체크
   - 페이지 새로고침

### 3. Next.js 빌드 캐시 클리어

```bash
# .next 폴더 삭제 후 재시작
rm -rf .next
npm run dev
```

### 4. 코드 확인

수정된 코드가 제대로 로드되었는지 확인:

1. 브라우저 개발자 도구 열기 (F12)
2. Sources 탭에서 `pages/admin/customers/index.tsx` 파일 확인
3. 3529줄 근처에서 `extractImageNameFromUrl` 함수 호출 확인
4. Network 탭에서 실제 호출되는 API 확인

## 확인 사항

### 올바른 API 호출
- ✅ `/api/admin/delete-image` (DELETE 메서드)
- ✅ `{ imageName: "originals/customers/..." }` 형식

### 잘못된 API 호출
- ❌ `/api/admin/gallery-image-delete` (존재하지 않음)
- ❌ `{ imageUrl: "https://..." }` 형식

## 추가 디버깅

만약 여전히 문제가 발생한다면:

1. **콘솔 로그 확인**:
   ```javascript
   // 브라우저 콘솔에서 확인
   console.log('onDelete 호출됨');
   ```

2. **Network 탭 확인**:
   - 실제로 어떤 API가 호출되는지 확인
   - 요청 본문 확인

3. **코드 재확인**:
   - `pages/admin/customers/index.tsx` 3529줄 확인
   - `extractImageNameFromUrl` import 확인
   - 변환 로직이 실행되는지 확인

## 예상 결과

수정 후:
- ✅ `/api/admin/delete-image` API 호출
- ✅ `imageName` 파라미터 전달
- ✅ 삭제 성공
