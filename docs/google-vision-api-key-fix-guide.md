# Google Vision API 키 403 오류 해결 가이드

## 문제 원인

API 키에 **HTTP Referrer 제한**이 설정되어 있어서 서버 사이드(Node.js)에서 호출할 때 차단되고 있습니다.

오류: `API_KEY_HTTP_REFERRER_BLOCKED` - "Requests from referer <empty> are blocked."

## 해결 방법

### 방법 1: API 키 제한 수정 (권장)

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com/ 접속
   - 프로젝트 선택 (projects/731179211867)

2. **API 키 설정 열기**
   - APIs & Services > Credentials
   - 현재 사용 중인 API 키 클릭

3. **Application restrictions 수정**
   - 현재: "HTTP referrers (web sites)" 설정됨
   - 변경: **"None"** 또는 **"IP addresses"** 선택
     - **"None"**: 모든 곳에서 사용 가능 (보안상 권장하지 않음)
     - **"IP addresses"**: 서버 IP 주소 추가 (Vercel 배포 시 IP 범위 추가 필요)

4. **API restrictions 확인**
   - "Restrict key" 선택 시: "Cloud Vision API"가 포함되어 있는지 확인
   - "Don't restrict key" 선택 시: 모든 API 사용 가능

5. **저장** 후 몇 분 대기 (변경사항 반영 시간)

### 방법 2: 서버 사이드용 API 키 별도 생성 (더 안전)

1. **새 API 키 생성**
   - APIs & Services > Credentials > Create Credentials > API Key

2. **제한 설정**
   - Application restrictions: **"IP addresses"** 또는 **"None"**
   - API restrictions: **"Restrict key"** > "Cloud Vision API"만 선택

3. **환경 변수 업데이트**
   - `.env.local` 파일의 `GOOGLE_VISION_API_KEY` 값 업데이트
   - Vercel 환경 변수도 업데이트

### 방법 3: Vercel 배포 시 설정 (권장)

Vercel은 **동적 IP 주소**를 사용하므로 IP 제한은 권장하지 않습니다.

**Vercel + 로컬 개발 모두 지원하는 설정:**

1. **Application restrictions**: **"없음"** 선택
2. **API restrictions**: **"키 제한"** > **"Cloud Vision API"**만 선택
3. 환경 변수로 API 키 관리:
   - 로컬: `.env.local` 파일
   - Vercel: Environment Variables 설정

**이렇게 하면:**
- ✅ 로컬 개발 환경에서 작동
- ✅ Vercel 프로덕션에서 작동
- ✅ API 키가 노출되어도 Vision API만 사용 가능 (보안)

**Vercel IP 주소 (참고용, 권장하지 않음):**
```
76.76.21.0/24
76.76.22.0/24
76.76.23.0/24
```
⚠️ Vercel의 IP는 동적이므로 IP 제한은 권장하지 않습니다.

## 테스트

수정 후 다음 명령어로 테스트:

```bash
node scripts/test-google-vision-api.js
```

성공 시:
```
✅ API 호출 성공!
```

## 참고

- **HTTP Referrer 제한**: 브라우저에서만 사용 가능 (클라이언트 사이드)
- **IP 주소 제한**: 특정 IP에서만 사용 가능 (서버 사이드)
- **제한 없음**: 모든 곳에서 사용 가능 (보안상 주의 필요)

서버 사이드에서 사용하려면 **IP 주소 제한** 또는 **제한 없음**을 사용해야 합니다.
