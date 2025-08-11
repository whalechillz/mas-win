# 📊 Admin 대시보드 데이터 연동 현황

## 🎯 현재 대시보드 데이터 상태

### ✅ **작동 중인 부분**
1. **GA4 연동** - 실시간 데이터 수집 중
   - 페이지 조회수: `/versions/funnel-2025-08-live.html` (21회)
   - 전화 클릭 이벤트: 2건 확인
   - 실시간 사용자 추적 가능

2. **Supabase 데이터베이스** - 자체 데이터 저장
   - 예약 데이터 (bookings 테이블)
   - 문의 데이터 (contacts 테이블) 
   - 캠페인 메트릭 (campaign_metrics 테이블)

3. **실시간 업데이트** - 5초마다 자동 갱신
   - PostgreSQL 실시간 구독 설정
   - 인터벌 기반 데이터 폴링

---

## ⚠️ **설정 필요한 부분**

### 1. Google Ads API ❌
```env
# 추가 필요한 환경변수
GOOGLE_ADS_CLIENT_ID=your-client-id
GOOGLE_ADS_CLIENT_SECRET=your-client-secret  
GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token
GOOGLE_ADS_REFRESH_TOKEN=your-refresh-token

# MCC 계정 (이미 있음)
GOOGLE_ADS_MANAGER_CUSTOMER_ID=7571427013
GOOGLE_ADS_MASGOLF1_ID=7398653521
GOOGLE_ADS_MASGOLF2_ID=6417483168
GOOGLE_ADS_SINGSING_ID=4495437776
```

### 2. 추가 전환 추적 설정 ⚠️
- 퍼널별 전환 이벤트 설정
- Google Ads 전환 라벨 연결
- 크로스 도메인 추적

---

## 📈 **실제 데이터 vs 모의 데이터**

### 🟢 **실제 데이터 (Live)**
- **GA4**: ✅ 실시간 페이지뷰, 사용자, 이벤트
- **Supabase**: ✅ 예약, 문의, 캠페인 데이터
- **전화 클릭**: ✅ 실제 추적 중 (2건 확인)

### 🟡 **하이브리드 (일부 실제)**
- **캠페인 KPI**: GA4 + 모의 데이터 조합
- **전환 깔때기**: 실제 방문 + 예상 전환율

### 🔴 **모의 데이터 (Mock)**
- **Google Ads 성과**: API 미연동으로 시뮬레이션
- **ROI 계산**: 실제 광고비 데이터 없음
- **일부 메트릭**: 랜덤 생성 데이터

---

## 🔧 **대시보드 실제 데이터 활성화 방법**

### 단계 1: Google Ads API 연동 (우선순위 높음)
```bash
# 1. Google Cloud Console에서 서비스 계정 생성
# 2. Google Ads API 활성화
# 3. 환경변수 설정
echo "GOOGLE_ADS_CLIENT_ID=your-client-id" >> .env.local
echo "GOOGLE_ADS_CLIENT_SECRET=your-secret" >> .env.local
echo "GOOGLE_ADS_DEVELOPER_TOKEN=your-token" >> .env.local
echo "GOOGLE_ADS_REFRESH_TOKEN=your-refresh-token" >> .env.local
```

### 단계 2: 실시간 데이터 대시보드 생성
```typescript
// components/admin/RealDataStatus.tsx
export function RealDataStatus() {
  return (
    <div className="bg-gradient-to-r from-green-500 to-blue-600 p-4 rounded-lg text-white mb-6">
      <h3 className="font-bold mb-2">📊 데이터 연동 현황</h3>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="block">GA4</span>
          <span className="text-green-200">✅ 연결됨</span>
        </div>
        <div>
          <span className="block">Google Ads</span>
          <span className="text-red-200">❌ 설정 필요</span>
        </div>
        <div>
          <span className="block">Database</span>
          <span className="text-green-200">✅ 실시간</span>
        </div>
      </div>
    </div>
  );
}
```

### 단계 3: Vercel 환경변수 설정
```bash
# Vercel Dashboard에서 설정 필요
GOOGLE_ADS_CLIENT_ID
GOOGLE_ADS_CLIENT_SECRET
GOOGLE_ADS_DEVELOPER_TOKEN
GOOGLE_ADS_REFRESH_TOKEN
```

---

## 🎯 **현재 화면 데이터 분석**

### 화면 1: 상세 데이터 (일부 실제)
- **페이지 조회수 1,234**: GA4 + 추정치
- **예약 완료 23**: ✅ Supabase 실제 데이터
- **달성률 12.3%**: 계산된 값

### 화면 2: 실시간 전환 깔때기 (하이브리드)
- **페이지 방문 671**: ✅ GA4 실제 데이터
- **관심 표현 589**: 일부 실제 + 추정
- **문의/상담**: ✅ Supabase 실제 데이터

### 화면 3: 캠페인 KPI (모의 데이터)
- **총 조회수, 공유 방문자**: ❌ Google Ads API 필요
- **전환 클릭, 전환율**: ⚠️ 일부 실제, 일부 추정

---

## ✅ **권장사항**

### 🔥 **즉시 적용 (높은 우선순위)**
1. **대시보드에 데이터 상태 표시** - 사용자에게 실제/모의 구분
2. **Google Ads API 설정** - 실제 광고 성과 연동
3. **전환 추적 강화** - 퍼널별 정확한 이벤트 설정

### 📊 **중장기 (보통 우선순위)**
1. **데이터 검증 시스템** - 실제 vs 예상 비교
2. **알림 시스템** - 비정상 데이터 감지
3. **고급 분석** - 예측 모델링, 트렌드 분석

### 🎮 **현재도 충분히 활용 가능**
- GA4 실시간 데이터로 방문자 추적
- Supabase로 예약/문의 실시간 관리  
- 기본적인 성과 분석 가능

**결론: 현재 60-70% 실제 데이터로 운영 중이며, Google Ads API만 연동하면 90% 이상 실제 데이터 대시보드 완성!** 🚀

## **이유:**

### **✅ 영어 입력 권장:**
- Google Ads API는 **영어 기반** 시스템
- **신청 검토팀**이 영어로 더 정확히 이해
- **신청 승인률**이 더 높음
- **표준 형식**으로 처리됨

### **❌ 한글 입력 시:**
- 번역 과정에서 **의미 왜곡** 가능
- **검토 지연** 가능성
- **표준화되지 않은 형식**

---

## **영어로 다시 작성해드릴게요:**

### **6번 질문 답변 (영어):**
```
MASGOLF is a golf club fitting and sales company. 
We use Google Ads to target golf equipment related keywords 
and generate leads through online funnel pages for conversions.
```

**이 영어 텍스트를 입력해주세요!** 📝

**영어로 입력하는 것이 훨씬 좋습니다!** ✨

## **English Version:**

### **1. Company Name:**
```
Company Name: MASGOLF
```

### **2. Business Model:**
```
Business Model: MASGOLF is a golf club fitting and sales company. 
We generate customer leads through online funnel pages and 
increase conversion rates through targeted marketing with Google Ads. 
We reach target customers with golf equipment related keywords 
to encourage test drive bookings and inquiries.
```

### **3. Tool Access/Use:**
```
Tool Access/Use: MASGOLF employees use this tool to monitor Google Ads campaign performance 
and generate reports. We provide real-time performance monitoring through internal dashboard 
and PDF report generation functionality. 
Includes campaign performance analysis, keyword planning, and budget management features.
```

### **4. Tool Design:**
```
Tool Design: We pull data from Google Ads API and store it in our internal database, 
allowing real-time performance monitoring through web dashboard. 
Provides campaign management, keyword planning, and performance analysis features. 
Multi-account (MCC) management functionality to integrate management of 
Gwanggyo Golf, MASGOLF2, and Singsing Golf accounts.
```

### **5. API Services Called:**
```
API Services Called:
- Campaign Management API (campaign creation and management)
- Reporting API (performance report generation)
- Keyword Planning API (keyword planning services)
- Account Management API (account management)
- Customer Service API (customer data management)
```

### **6. Tool Mockups:**
```
Tool Mockups: 
- MASGOLF Dashboard (campaign performance monitoring)
- Multi-account management screen (MCC integrated management)
- Report generation tool (PDF reports)
```

---

## **지금 해야 할 일:**

**위 영어 내용으로 문서를 수정하고 저장해주세요!**

**수정 완료 후 PDF로 다운로드해서 신청서에 업로드하면 됩니다!** ✨