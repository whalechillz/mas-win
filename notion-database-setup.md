# Notion 데이터베이스 설정 가이드

## 🔑 **1. Notion API 키 생성**

1. **https://www.notion.so/my-integrations** 접속
2. **"New integration"** 클릭
3. **Integration 이름**: `MAS Golf Blog System`
4. **Workspace**: `MASLABS` 선택
5. **"Submit"** 클릭
6. **Internal Integration Token** 복사

## 🗄️ **2. 데이터베이스 생성**

### **블로그 포스트 데이터베이스**
```
데이터베이스 이름: "블로그 포스트"
속성:
- 제목 (Title)
- 콘텐츠 유형 (Select): golf, restaurant, travel, shopping, general
- AI 분석 신뢰도 (Number)
- 생성된 이미지 수 (Number)
- 생성일 (Date)
- 상태 (Select): 생성됨, 발행됨, 임시저장
```

### **AI 사용량 데이터베이스**
```
데이터베이스 이름: "AI 사용량"
속성:
- AI 모델 (Select): ChatGPT, FAL AI, Kie AI, DALL-E 3
- 토큰 수 (Number)
- 비용 (Number)
- 성공 여부 (Checkbox)
- 사용일 (Date)
- 시간 (Created time)
```

### **학습 피드백 데이터베이스**
```
데이터베이스 이름: "학습 피드백"
속성:
- 콘텐츠 제목 (Title)
- 예측 카테고리 (Select): golf, restaurant, travel, shopping, general
- 실제 카테고리 (Select): golf, restaurant, travel, shopping, general
- 사용자 피드백 (Select): correct, incorrect, partially_correct
- 신뢰도 (Number)
- 피드백일 (Date)
```

### **배치 작업 데이터베이스**
```
데이터베이스 이름: "배치 작업"
속성:
- 배치 이름 (Title)
- 총 URL 수 (Number)
- 성공 수 (Number)
- 실패 수 (Number)
- 성공률 (Number)
- 처리일 (Date)
```

## 🔧 **3. 환경 변수 설정**

### **Vercel 환경 변수 추가**
```
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_BLOG_DATABASE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NOTION_AI_USAGE_DATABASE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NOTION_LEARNING_DATABASE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NOTION_BATCH_DATABASE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### **데이터베이스 ID 찾는 방법**
1. **Notion 데이터베이스** 페이지 열기
2. **URL에서 ID 복사**:
   ```
   https://www.notion.so/workspace/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx?v=...
   ```

## 🔗 **4. 권한 설정**

각 데이터베이스에서:
1. **"Share"** 클릭
2. **"Invite"** → **"MAS Golf Blog System"** 검색
3. **"Invite"** 클릭

## 📝 **5. 사용 방법**

### **블로그 포스트 저장**
```javascript
POST /api/notion-integration
{
  "action": "save-blog-post",
  "data": {
    "title": "샤브올데이 후기",
    "content": "맛있는 샤브샤브...",
    "images": [{"publicUrl": "https://..."}],
    "contentType": "restaurant",
    "aiAnalysis": {"confidence": 0.95}
  }
}
```

### **AI 사용량 저장**
```javascript
POST /api/notion-integration
{
  "action": "save-ai-usage",
  "data": {
    "model": "FAL AI",
    "tokens": 150,
    "cost": 0.02,
    "success": true,
    "details": {"imageCount": 1}
  }
}
```

### **학습 피드백 저장**
```javascript
POST /api/notion-integration
{
  "action": "save-learning-feedback",
  "data": {
    "contentTitle": "샤브올데이 후기",
    "predictedCategory": "restaurant",
    "actualCategory": "restaurant",
    "userFeedback": "correct",
    "confidence": 0.95,
    "reasoning": "샤브, 뷔페 키워드 감지"
  }
}
```

## 🎯 **6. 자동 연동 설정**

### **블로그 생성 시 자동 저장**
```javascript
// pages/admin/blog.tsx에서
const saveToNotion = async (blogData) => {
  await fetch('/api/notion-integration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'save-blog-post',
      data: blogData
    })
  });
};
```

### **AI 사용 시 자동 저장**
```javascript
// AI API에서 사용량 추적
const trackAIUsage = async (model, tokens, cost, success) => {
  await fetch('/api/notion-integration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'save-ai-usage',
      data: { model, tokens, cost, success }
    })
  });
};
```

## ✅ **완료 체크리스트**

- [ ] Notion API 키 생성
- [ ] 4개 데이터베이스 생성
- [ ] 데이터베이스 권한 설정
- [ ] Vercel 환경 변수 추가
- [ ] API 테스트
- [ ] 자동 연동 설정

이제 모든 블로그 데이터와 AI 사용량이 Notion에 자동으로 저장됩니다! 🚀
