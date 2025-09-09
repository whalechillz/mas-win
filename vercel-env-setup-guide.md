# Vercel 환경 변수 설정 가이드

## 🔧 **필요한 환경 변수들**

### **1. Google AI API 키**
```
GOOGLE_AI_API_KEY=AIzaSyCu6yRFXgFnHNE-LFZ63ShFD-Ind0Z2XPE
```

### **2. 기존 환경 변수들 (확인 필요)**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
OPENAI_API_KEY=your_openai_api_key
FAL_API_KEY=your_fal_api_key
```

## 📋 **Vercel 설정 단계**

### **1단계: Vercel 대시보드 접속**
```
https://vercel.com/dashboard
```

### **2단계: 프로젝트 선택**
- `win-masgolf` 프로젝트 선택

### **3단계: Settings > Environment Variables**
- "Add New" 클릭

### **4단계: 환경 변수 추가**
각 환경 변수를 하나씩 추가:

#### **Google AI API 키**
- **Name**: `GOOGLE_AI_API_KEY`
- **Value**: `AIzaSyCu6yRFXgFnHNE-LFZ63ShFD-Ind0Z2XPE`
- **Environment**: Production, Preview, Development 모두 선택

#### **기존 환경 변수 확인**
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `FAL_API_KEY`

### **5단계: 재배포**
- 환경 변수 추가 후 자동으로 재배포됨
- 또는 수동으로 "Redeploy" 클릭

## ✅ **설정 완료 확인**

### **배포 상태 확인**
```
https://vercel.com/dashboard
```

### **환경 변수 확인**
- Settings > Environment Variables에서 모든 변수가 표시되는지 확인

### **기능 테스트**
1. **블로그 목록**: `https://your-domain.vercel.app/blog`
2. **관리자 페이지**: `https://your-domain.vercel.app/admin/blog`
3. **마이그레이션 탭**: "🔄 블로그 마이그레이션" 클릭
4. **API 테스트**: 스크래핑 및 이미지 분석 기능

## 🚨 **주의사항**

### **보안**
- API 키를 공개 저장소에 커밋하지 마세요
- Vercel 환경 변수는 암호화되어 저장됩니다

### **할당량**
- Google AI API 무료 할당량 확인
- 월 15회 이미지 생성, 1,500회 텍스트 분석

### **도메인 설정**
- 커스텀 도메인이 설정되어 있다면 해당 도메인으로 테스트
- `masgolf.co.kr` 도메인 확인

## 📞 **문제 해결**

### **환경 변수 오류**
```
Error: Google AI API 키가 설정되지 않았습니다.
```
→ Vercel 환경 변수에서 `GOOGLE_AI_API_KEY` 확인

### **배포 실패**
```
Build failed
```
→ Vercel 대시보드에서 빌드 로그 확인

### **API 오류**
```
500 Internal Server Error
```
→ Vercel Function 로그에서 상세 오류 확인
