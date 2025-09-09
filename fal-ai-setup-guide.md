# FAL AI 이미지 생성 설정 가이드

## 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 추가하세요:

```bash
# FAL AI API 키
FAL_API_KEY=b6ae9e4b-d592-4dee-a0ac-78a4a2be3486:5642c60bc1fd9b18402026df987a2123

# 기존 OpenAI API 키 (이미 있다면)
OPENAI_API_KEY=your_openai_api_key_here
```

## FAL AI 모델 정보

- **모델**: `fal-ai/hidream-i1-dev`
- **특징**: 가장 실사 같은 리얼한 이미지 생성
- **용도**: 한국 골프장 실사 이미지 생성에 최적화

## 사용 방법

1. **블로그 관리 페이지**에서 새 게시물 작성
2. **제목**과 **마쓰구 브랜드 전략** 설정
3. **FAL AI 이미지 생성 버튼** 선택:
   - 📸 FAL 실사 2개
   - 📸 FAL 실사 4개
4. **생성된 이미지 선택**: 원하는 이미지 클릭으로 대표 이미지 설정

## 프롬프트 특징

FAL AI는 다음 특징으로 최적화된 프롬프트를 사용합니다:

- **한국인 골퍼**: 50-70대 한국인 골퍼 명시
- **실사 스타일**: Ultra-realistic, photorealistic, 8K resolution
- **한국 골프장**: Authentic Korean golf course environment
- **자연광**: Natural lighting, outdoor Korean golf course setting
- **전문 촬영**: High-end DSLR camera quality, cinematic quality

## 비용 정보

- FAL AI는 사용량 기반 과금
- hidream-i1-dev 모델은 고품질 실사 이미지 생성에 특화
- 한국 골프장 실사 이미지에 최적화된 모델

## 테스트

환경 변수 설정 후 다음 명령어로 테스트할 수 있습니다:

```bash
node test-fal-ai-image-generation.js
```
