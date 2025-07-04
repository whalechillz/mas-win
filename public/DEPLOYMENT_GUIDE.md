# MASGOLF 서버 배포 가이드

## 문제 해결 체크리스트

### 1. 즉시 확인할 사항
- [ ] `config.js` 파일이 서버에 업로드되었는지 확인
- [ ] Supabase URL과 API 키가 올바른지 확인
- [ ] HTTPS로 서비스되고 있는지 확인
- [ ] 브라우저 콘솔에서 에러 메시지 확인

### 2. HTML 파일 수정 사항

기존 HTML 파일의 `<head>` 부분에 다음 스크립트를 추가하세요:

```html
<!-- Supabase -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- 설정 파일 (경로 확인 필수) -->
<script src="/config.js"></script>

<!-- 데이터베이스 핸들러 -->
<script src="/js/database-handler.js"></script>

<!-- 폼 핸들러 -->
<script src="/js/form-handler.js"></script>
```

### 3. 폼 태그 확인

시타 예약 폼:
```html
<form id="bookingForm">
    <input type="text" name="name" required>
    <input type="tel" name="phone" required>
    <input type="date" name="preferredDate" required>
    <select name="preferredTime">
        <option value="오전">오전</option>
        <option value="오후">오후</option>
    </select>
    <input type="text" name="clubInterest">
    <button type="submit">시타 예약</button>
</form>
```

문의 폼:
```html
<form id="contactForm">
    <input type="text" name="name" required>
    <input type="tel" name="phone" required>
    <select name="callTime">
        <option value="오전 10-12시">오전 10-12시</option>
        <option value="오후 2-4시">오후 2-4시</option>
        <option value="오후 4-6시">오후 4-6시</option>
    </select>
    <button type="submit">문의하기</button>
</form>
```

### 4. 서버 설정

#### Nginx 설정 (CORS 해결)
```nginx
location / {
    add_header 'Access-Control-Allow-Origin' '*';
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
    add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization';
}
```

#### Apache 설정 (.htaccess)
```apache
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type, Authorization"
```

### 5. 디버깅 방법

1. **디버그 페이지 사용**
   - `/debug-test.html` 페이지에 접속해서 연결 상태 확인
   - 각 테스트 버튼을 순서대로 클릭하여 문제 파악

2. **브라우저 콘솔 확인**
   ```javascript
   // 콘솔에서 직접 확인
   console.log(window.dbHandler.getDebugInfo());
   ```

3. **네트워크 탭 확인**
   - F12 > Network 탭에서 Supabase API 호출 확인
   - 404, 403, CORS 에러 확인

### 6. 일반적인 에러와 해결 방법

#### "SUPABASE_CONFIG가 정의되지 않았습니다"
- `config.js` 파일 경로 확인
- 스크립트 로딩 순서 확인

#### "Supabase 연결 실패"
- Supabase 프로젝트 설정 확인
- API 키와 URL 확인
- RLS (Row Level Security) 정책 확인

#### CORS 에러
- 서버 설정에서 CORS 헤더 추가
- Supabase 대시보드에서 도메인 허용 목록 확인

### 7. 로컬 스토리지 폴백

데이터베이스 연결이 실패해도 로컬 스토리지에 자동 저장됩니다.
관리자 페이지에서 로컬 데이터를 확인할 수 있습니다.

### 8. 성능 최적화

1. **Tailwind 프로덕션 빌드 사용**
   ```bash
   npm install -D tailwindcss
   npx tailwindcss -i ./src/input.css -o ./dist/output.css --minify
   ```

2. **스크립트 최적화**
   - 모든 JS 파일 minify
   - 캐시 설정 추가

### 9. 모니터링

1. **에러 로깅 설정**
   ```javascript
   window.addEventListener('error', function(e) {
       console.error('Global error:', e);
       // 에러를 서버로 전송하는 코드 추가
   });
   ```

2. **성공률 모니터링**
   - 폼 제출 성공/실패 비율 추적
   - 로컬 스토리지 폴백 사용 빈도 확인

### 10. 긴급 대응

만약 모든 방법이 실패하면:
1. 로컬 스토리지 전용 모드로 전환
2. 데이터를 수동으로 CSV 다운로드
3. 나중에 데이터베이스에 일괄 업로드

## 문의사항
문제가 지속되면 다음 정보와 함께 문의하세요:
- 브라우저 콘솔 전체 로그
- 네트워크 탭 스크린샷
- `/debug-test.html` 페이지 결과