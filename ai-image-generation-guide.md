# AI 이미지 생성 시스템 완전 가이드

## 🎯 모든 버튼들의 구동 방식

### 1. **🎨 DALL-E 3 이미지 생성 버튼들**

#### **🎨 AI 이미지** (1개)
- **모델**: OpenAI DALL-E 3
- **용도**: 일반적인 마케팅 이미지
- **특징**: 한국인 50-70대 골퍼, 실사 사진, 전문 카메라, 자연광
- **프롬프트 생성**: 제목 + 요약 + 콘텐츠 유형 + 브랜드 전략 분석
- **이미지 크기**: 1024x1024 (정사각형)

#### **🎨 AI 이미지 2개** (2개)
- **모델**: OpenAI DALL-E 3
- **용도**: 다양한 스타일의 이미지 선택
- **특징**: 같은 프롬프트로 2개의 다른 이미지 생성
- **선택 방식**: 생성된 2개 이미지 중 원하는 것 선택

#### **🎨 AI 이미지 4개** (4개)
- **모델**: OpenAI DALL-E 3
- **용도**: 최대한 다양한 선택지 제공
- **특징**: 같은 프롬프트로 4개의 다른 이미지 생성
- **선택 방식**: 생성된 4개 이미지 중 원하는 것 선택

### 2. **📸 FAL AI 실사 이미지 생성 버튼들**

#### **📸 FAL 실사 1개** (1개)
- **모델**: FAL AI hidream-i1-dev
- **용도**: 최고 품질 실사 이미지
- **특징**: 한국 골프장 실사 환경, 8K 해상도, Ultra-realistic
- **프롬프트 생성**: 한국 골프장 특화 프롬프트
- **이미지 크기**: landscape_16_9 (가로 16:9)

#### **📸 FAL 실사 2개** (2개)
- **모델**: FAL AI hidream-i1-dev
- **용도**: 실사 이미지의 다양한 버전
- **특징**: 같은 프롬프트로 2개의 다른 실사 이미지 생성
- **선택 방식**: 생성된 2개 실사 이미지 중 원하는 것 선택

#### **📸 FAL 실사 4개** (4개)
- **모델**: FAL AI hidream-i1-dev
- **용도**: 최대한 다양한 실사 이미지 선택지
- **특징**: 같은 프롬프트로 4개의 다른 실사 이미지 생성
- **선택 방식**: 생성된 4개 실사 이미지 중 원하는 것 선택

## 🔄 이미지 생성 과정 (투명성)

### **DALL-E 3 생성 과정**
1. **1단계: AI 프롬프트 생성 중...**
   - 제목 분석
   - 요약 내용 분석
   - 콘텐츠 유형별 프롬프트 생성
   - 브랜드 전략 적용

2. **2단계: 이미지 생성 완료!**
   - OpenAI DALL-E 3 API 호출
   - 이미지 생성 및 반환
   - 생성된 프롬프트 표시

### **FAL AI 생성 과정**
1. **1단계: 한국 골프장 실사 프롬프트 생성 중...**
   - 한국 골프장 특화 프롬프트 생성
   - 실사 이미지 최적화 설정
   - 이상한 이미지 방지 설정

2. **2단계: FAL AI 서버에 이미지 생성 요청 중...**
   - FAL AI hidream-i1-dev API 호출
   - 8K 해상도 실사 이미지 생성

3. **3단계: 초고품질 실사 이미지 생성 완료!**
   - 생성된 실사 이미지 반환
   - 생성된 프롬프트 표시

## 🎨 프롬프트 생성 로직

### **DALL-E 3 프롬프트 특징**
```
Professional golf marketing image for MASGOLF brand: "{제목}"
Show a satisfied Korean senior golfer (50-70 years old, Korean ethnicity, Asian features) 
holding a premium MASGOLF driver, with a confident and happy expression. 
Include a golf course background with beautiful green fairways.

Photography style: Realistic, professional camera shot, natural lighting, 
high-end DSLR camera quality, photorealistic, authentic Korean people, 
natural expressions, soft natural light, outdoor or well-lit indoor setting, 
professional portrait photography, marketing-quality image.
```

### **FAL AI 프롬프트 특징**
```
Professional golf marketing image for MASGOLF brand: "{제목}"
Show a satisfied Korean senior golfer (50-70 years old, Korean ethnicity, Asian features) 
holding a premium MASGOLF driver on a real Korean golf course. 
Include authentic Korean golf course background with beautiful green fairways, 
Korean-style golf course architecture, and natural Korean landscape.

Photography style: Ultra-realistic, photorealistic, high-end DSLR camera quality, 
natural lighting, authentic Korean golf course environment, real Korean people, 
natural expressions, soft natural light, outdoor Korean golf course setting, 
professional portrait photography, marketing-quality image, hyperrealistic, 
cinematic quality, 8K resolution, Korean golf course architecture, 
Korean landscape, authentic Korean golf culture.

Avoid: abstract patterns, colorful backgrounds, artistic effects, bokeh effects, 
unrealistic colors, fantasy elements, cartoon style, anime style, digital art style.
Focus on: realistic photography, natural colors, authentic Korean golf course setting, 
professional marketing image.
```

## 🚫 이상한 이미지 방지 설정

### **FAL AI에서 방지하는 요소들**
- **추상적 패턴** (abstract patterns)
- **화려한 배경** (colorful backgrounds)
- **예술적 효과** (artistic effects)
- **보케 효과** (bokeh effects)
- **비현실적 색상** (unrealistic colors)
- **판타지 요소** (fantasy elements)
- **카툰 스타일** (cartoon style)
- **애니메이션 스타일** (anime style)
- **디지털 아트 스타일** (digital art style)

### **집중하는 요소들**
- **현실적 사진** (realistic photography)
- **자연스러운 색상** (natural colors)
- **한국 골프장 실사 환경** (authentic Korean golf course setting)
- **전문 마케팅 이미지** (professional marketing image)

## 📊 모델별 비교

| 특징 | DALL-E 3 | FAL AI (hidream-i1-dev) |
|------|----------|-------------------------|
| **이미지 품질** | 고품질 | 초고품질 (8K) |
| **스타일** | 일반적 실사 | Ultra-realistic |
| **한국 골프장** | 일반적 | 특화 |
| **이미지 크기** | 1024x1024 | landscape_16_9 |
| **생성 시간** | 빠름 | 보통 |
| **비용** | OpenAI 과금 | FAL AI 과금 |
| **용도** | 일반 마케팅 | 고급 실사 마케팅 |

## 🎯 사용 권장사항

### **DALL-E 3 사용 시기**
- 일반적인 블로그 포스트 이미지
- 빠른 이미지 생성이 필요한 경우
- 비용을 절약하고 싶은 경우

### **FAL AI 사용 시기**
- 최고 품질의 실사 이미지가 필요한 경우
- 한국 골프장 특화 이미지가 필요한 경우
- 마케팅용 고급 이미지가 필요한 경우

## 🔧 환경 설정

### **필요한 환경 변수**
```bash
# .env.local 파일에 추가
OPENAI_API_KEY=your_openai_api_key_here
FAL_API_KEY=b6ae9e4b-d592-4dee-a0ac-78a4a2be3486:5642c60bc1fd9b18402026df987a2123
```

### **Next.js 서버 재시작**
환경 변수 변경 후 반드시 서버 재시작:
```bash
npm run dev
# 또는
yarn dev
```
