# Vercel 배포 시 Google Vision API 키 설정 가이드

## 문제점

Vercel은 **동적 IP 주소**를 사용하므로, 고정된 IP 주소로 제한할 수 없습니다.

## 해결 방법

### 방법 1: Application restrictions를 "없음"으로 설정 (가장 간단)

1. Google Cloud Console > API 키 수정
2. **Application restrictions**: "없음" 선택
3. **API restrictions**: "키 제한" > "Cloud Vision API"만 선택 (보안)
4. 저장

**장점**: 간단하고 확실하게 작동  
**단점**: API 키가 노출되면 어디서든 사용 가능 (하지만 API restrictions로 Vision API만 사용 가능하도록 제한 가능)

### 방법 2: Vercel 환경 변수로 API 키 보호

1. Application restrictions: "없음" 선택
2. API restrictions: "Cloud Vision API"만 선택
3. Vercel 환경 변수에만 API 키 저장 (코드에 하드코딩하지 않음)
4. API 키가 노출되어도 Vision API만 사용 가능하도록 제한

### 방법 3: 서비스 계정 사용 (가장 안전하지만 복잡)

서버 사이드에서는 API 키 대신 서비스 계정 JSON 키를 사용할 수 있지만, 현재 구조에서는 API 키 사용이 더 간단합니다.

## Vercel IP 주소 (참고용)

Vercel의 IP 주소는 동적이지만, 주요 IP 범위는 다음과 같습니다:

```
76.76.21.0/24
76.76.22.0/24
76.76.23.0/24
```

하지만 이 IP 범위는 변경될 수 있고, 모든 요청이 이 IP에서 오는 것도 아니므로 **IP 제한은 권장하지 않습니다**.

## 추천 설정

**로컬 개발 + Vercel 프로덕션 모두 사용:**

1. **Application restrictions**: "없음"
2. **API restrictions**: "키 제한" > "Cloud Vision API"만 선택
3. 환경 변수로 API 키 관리:
   - 로컬: `.env.local`
   - Vercel: Environment Variables

이렇게 하면:
- ✅ 로컬 개발 환경에서 작동
- ✅ Vercel 프로덕션에서 작동
- ✅ API 키가 노출되어도 Vision API만 사용 가능 (보안)

## 보안 고려사항

1. **API restrictions 필수**: Vision API만 사용 가능하도록 제한
2. **환경 변수 사용**: 코드에 API 키 하드코딩 금지
3. **Vercel 환경 변수**: 프로덕션 API 키는 Vercel에만 저장
4. **API 키 로테이션**: 정기적으로 API 키 변경

## 테스트

설정 후:

```bash
# 로컬 테스트
node scripts/test-google-vision-api.js

# Vercel 배포 후 프로덕션 테스트
# 웹 애플리케이션에서 OCR 기능 테스트
```
