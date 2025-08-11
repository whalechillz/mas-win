# 🚀 Google Ads API 빠른 수동 설정 가이드

## 1️⃣ Google Cloud Console - OAuth 설정

### 단계 1: 프로젝트 생성
1. https://console.cloud.google.com 접속 (`taksoo.kim@gmail.com`)
2. 프로젝트 선택 드롭다운 → "새 프로젝트"
3. 이름: `MASGOLF-API` → "만들기"

### 단계 2: API 활성화
1. 왼쪽 메뉴 → "API 및 서비스" → "라이브러리"
2. "Google Ads API" 검색 → 클릭 → "사용 설정"

### 단계 3: OAuth 클라이언트 생성
1. "API 및 서비스" → "사용자 인증 정보"
2. "+ 사용자 인증 정보 만들기" → "OAuth 클라이언트 ID"
3. 애플리케이션 유형: **웹 애플리케이션**
4. 이름: `MASGOLF Google Ads API`
5. 승인된 리디렉션 URI:
   ```
   http://localhost:3000/auth/google/callback
   https://win.masgolf.co.kr/auth/google/callback
   ```
6. "만들기" 클릭

### 결과 복사:
```
클라이언트 ID: 123456789-abc.apps.googleusercontent.com
클라이언트 보안 비밀: GOCSPX-abcdef123456
```

---

## 2️⃣ Google Ads - Developer Token

### 단계 1: Google Ads 접속
1. https://ads.google.com 접속 (`taksoo.kim@gmail.com`)
2. 광교골프 MCC 계정 선택

### 단계 2: Developer Token 신청
1. 우상단 도구 아이콘 🔧 → "설정" → "API 센터"
2. "Developer token" 섹션
3. "토큰 요청" 버튼 클릭
4. 신청서 작성 및 제출

### 결과:
```
상태: 검토 중 (1-2일 소요)
임시 사용: 토큰이 나오면 복사
```

---

## 3️⃣ OAuth Playground - Refresh Token

### 단계 1: OAuth Playground 설정
1. https://developers.google.com/oauthplayground 접속
2. 오른쪽 톱니바퀴 ⚙️ 클릭
3. ✅ "Use your own OAuth credentials" 체크
4. 입력:
   - OAuth Client ID: (위에서 복사한 클라이언트 ID)
   - OAuth Client secret: (위에서 복사한 클라이언트 보안 비밀)

### 단계 2: 토큰 생성
1. 왼쪽에서 "Step 1" → scope 입력창에:
   ```
   https://www.googleapis.com/auth/adwords
   ```
2. "Authorize APIs" 클릭
3. Google 계정 로그인 및 권한 승인
4. "Step 2" → "Exchange authorization code for tokens" 클릭
5. **Refresh token 복사**:
   ```
   1//abcdef-ghijklmnop-qrstuvwxyz
   ```

---

## 4️⃣ 설정 완료

### 수동 입력 도구 실행:
```bash
node scripts/manual-google-ads-setup.js
```

### 또는 직접 .env.local 편집:
```env
GOOGLE_ADS_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=GOCSPX-abcdef123456
GOOGLE_ADS_DEVELOPER_TOKEN=PENDING_APPROVAL
GOOGLE_ADS_REFRESH_TOKEN=1//abcdef-ghijklmnop-qrstuvwxyz
```

### 테스트:
```bash
npm run dev
curl http://localhost:3000/api/test-google-ads-connection
```

---

## ⏰ 예상 소요 시간:
- OAuth 설정: 10분
- Developer Token 신청: 5분
- Refresh Token 생성: 10분
- **총 25분 + 승인 대기 1-2일**

## 📁 **파일명 확인:**
```
client_secret_983521706836-kquos2td8pb98kg0qi2hbmadad2jn18s.apps.googleusercontent.com.json
```

---

## 🔧 **프로젝트에 저장하는 방법:**

### **1단계: Downloads에서 프로젝트로 이동**
```bash
<code_block_to_apply_changes_from>
```

### **2단계: 간단한 이름으로 변경 (선택사항)**
```bash
# 더 간단한 이름으로 변경
mv client_secret_983521706836-kquos2td8pb98kg0qi2hbmadad2jn18s.apps.googleusercontent.com.json google-ads-credentials.json
```

### **3단계: .gitignore에 추가**
```bash
# 보안을 위해 Git에서 제외
echo "google-ads-credentials.json" >> .gitignore
echo "client_secret_*.json" >> .gitignore
```

---

## 🎯 **지금 할 일:**

1. **"확인" 버튼 클릭** (팝업 닫기)
2. **Downloads 폴더에서 파일 확인**
3. **프로젝트로 파일 복사**

**지금 "확인" 버튼을 클릭해서 팝업을 닫고, 다음 단계로 진행하세요!** ✨

**파일은 그대로 두고 다음 단계인 Google Ads Developer Token 신청으로 넘어가겠습니다!**