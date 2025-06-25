# Google Ads 전환 추적 설정 가이드

## 📍 전환 ID 및 라벨 확인 방법

1. Google Ads 로그인
2. 도구 및 설정 → 측정 → 전환
3. 전환 액션 클릭
4. "태그 설정" → "직접 태그 설치"
5. 다음 정보 확인:
   - 전환 ID: AW-XXXXXXXXX
   - 전환 라벨: YYYYYYYYYYY

## 🔧 코드에 적용하기

### 1. _app.js 파일 수정
```javascript
// AW-YOUR_CONVERSION_ID를 실제 전환 ID로 변경
src="https://www.googletagmanager.com/gtag/js?id=AW-1234567890"
gtag('config', 'AW-1234567890');
```

### 2. funnel-2025-06.tsx 파일 수정
```javascript
// 전환 추적 코드에서 ID와 라벨 변경
'send_to': 'AW-1234567890/AbCdEfGhIjKl',
```

## 📊 전환 테스트

1. 개발 서버 실행: `npm run dev`
2. 페이지에서 전화번호 클릭
3. Chrome DevTools → Network 탭에서 "conversion" 요청 확인
4. Google Ads에서 전환 확인 (최대 3시간 소요)

## 🚀 배포 체크리스트

- [ ] 전환 ID 입력 완료
- [ ] 전환 라벨 입력 완료
- [ ] 로컬에서 테스트 완료
- [ ] Vercel에 배포
- [ ] 실제 사이트에서 테스트
- [ ] Google Ads에서 전환 확인

## ⚠️ 주의사항

- 전환 ID와 라벨은 절대 GitHub에 커밋하지 마세요
- 환경 변수로 관리하는 것을 권장합니다
- 테스트 전환은 Google Ads에서 삭제 가능합니다
