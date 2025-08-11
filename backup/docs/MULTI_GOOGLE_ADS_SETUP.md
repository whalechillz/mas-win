# 다중 Google Ads 계정 설정 가이드

## 📊 현재 계정 정보 (MCC 구조)

### 광교골프 (MCC 총관리자) ⭐
```env
GOOGLE_ADS_MANAGER_CUSTOMER_ID=7571427013
GOOGLE_ADS_ACCOUNT_NAME_MCC="광교골프"
GOOGLE_ADS_ACCOUNT_TYPE="MCC"
```

### 하위 계정들

#### 마쓰구1 (예전 계정)
```env
GOOGLE_ADS_MASGOLF1_ID=7398653521
GOOGLE_ADS_ACCOUNT_NAME_OLD="마쓰구1"
```

#### MASGOLF2 (현재 활성)
```env
GOOGLE_ADS_MASGOLF2_ID=6417483168
GOOGLE_ADS_ACCOUNT_NAME_CURRENT="MASGOLF2"
```

#### 싱싱골프 (별도 브랜드)
```env
GOOGLE_ADS_SINGSING_ID=4495437776
GOOGLE_ADS_ACCOUNT_NAME_SINGSING="싱싱골프"
```

---

## 🎯 계정별 역할 분담

### 광교골프 (MCC Manager - 757-142-7013) 🏢
- **역할**: 총관리자 계정
- **기능**: 모든 하위 계정 통합 관리
- **권한**: 전체 계정 데이터 접근
- **활용**: 통합 대시보드, 전체 성과 분석

### 마쓰구1 (예전 계정 - 739-865-3521) 💎
- **특징**: 리타겟팅 데이터 풍부
- **활용**: 기존 고객 재마케팅
- **타겟**: 과거 구매 고객층
- **전략**: 룩어라이크 오디언스, 리마케팅 캠페인

### MASGOLF2 (현재 활성 - 641-748-3168) 🎯
- **역할**: 메인 마케팅 계정
- **타겟**: 골프 용품 관련  
- **캠페인**: 클럽 판매, 피팅 서비스
- **키워드**: "골프클럽", "드라이버", "아이언", "시타"
- **퍼널**: 제품 판매 중심 (8월 퍼널 등)

### 싱싱골프 (별도 브랜드 - 449-543-7776) 🏌️‍♂️
- **역할**: 독립 브랜드 마케팅
- **타겟**: 싱싱골프 브랜드 고객
- **전략**: 교차 마케팅, 브랜드 간 성과 비교
- **활용**: 시너지 효과 창출

---

## 🔧 API 설정 (다중 계정)

### 환경 변수 설정 (MCC 방식)
```env
# 기본 Google Ads 설정
GOOGLE_ADS_CLIENT_ID=your-client-id
GOOGLE_ADS_CLIENT_SECRET=your-client-secret
GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token
GOOGLE_ADS_REFRESH_TOKEN=your-refresh-token

# MCC (Manager) 계정
GOOGLE_ADS_MANAGER_CUSTOMER_ID=7571427013

# 하위 계정들 (실제 Customer ID)
GOOGLE_ADS_MASGOLF1_ID=7398653521
GOOGLE_ADS_MASGOLF2_ID=6417483168
GOOGLE_ADS_SINGSING_ID=4495437776
```

### API 구현 예시
```typescript
// pages/api/googleads/multi-account.ts
import { GoogleAdsApi } from 'google-ads-api';

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});

export default async function handler(req, res) {
  try {
    // MCC 계정으로 연결
    const mccCustomer = client.Customer({
      customer_id: process.env.GOOGLE_ADS_MANAGER_CUSTOMER_ID, // 7571427013
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    });
    
    // 모든 하위 계정 데이터 병렬로 가져오기
    const [masgolf1Data, masgolf2Data, singsingsData] = await Promise.all([
      // 마쓰구1 (예전 계정) - 리타겟팅 중심
      client.Customer({
        customer_id: process.env.GOOGLE_ADS_MASGOLF1_ID,
        refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
      }).query(`
        SELECT 
          campaign.name,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions
        FROM campaign 
        WHERE segments.date DURING LAST_7_DAYS
      `),
      
      // MASGOLF2 (현재 활성) - 메인 계정
      client.Customer({
        customer_id: process.env.GOOGLE_ADS_MASGOLF2_ID,
        refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
      }).query(`
        SELECT 
          campaign.name,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions
        FROM campaign 
        WHERE segments.date DURING LAST_7_DAYS
      `),
      
      // 싱싱골프 (별도 브랜드)
      client.Customer({
        customer_id: process.env.GOOGLE_ADS_SINGSING_ID,
        refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
      }).query(`
        SELECT 
          campaign.name,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions
        FROM campaign 
        WHERE segments.date DURING LAST_7_DAYS
      `)
    ]);
    
    res.status(200).json({
      masgolf1: {
        account_name: "마쓰구1 (예전)",
        account_id: process.env.GOOGLE_ADS_MASGOLF1_ID,
        data: masgolf1Data,
        specialty: "리타겟팅"
      },
      masgolf2: {
        account_name: "MASGOLF2 (현재)",
        account_id: process.env.GOOGLE_ADS_MASGOLF2_ID,
        data: masgolf2Data,
        specialty: "메인 광고"
      },
      singsing: {
        account_name: "싱싱골프",
        account_id: process.env.GOOGLE_ADS_SINGSING_ID,
        data: singsingsData,
        specialty: "별도 브랜드"
      },
      combined: {
        total_impressions: 
          masgolf1Data.reduce((sum, row) => sum + row.metrics.impressions, 0) +
          masgolf2Data.reduce((sum, row) => sum + row.metrics.impressions, 0) +
          singsingsData.reduce((sum, row) => sum + row.metrics.impressions, 0),
        total_clicks: 
          masgolf1Data.reduce((sum, row) => sum + row.metrics.clicks, 0) +
          masgolf2Data.reduce((sum, row) => sum + row.metrics.clicks, 0) +
          singsingsData.reduce((sum, row) => sum + row.metrics.clicks, 0),
        total_conversions:
          masgolf1Data.reduce((sum, row) => sum + row.metrics.conversions, 0) +
          masgolf2Data.reduce((sum, row) => sum + row.metrics.conversions, 0) +
          singsingsData.reduce((sum, row) => sum + row.metrics.conversions, 0)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

---

## 📈 Admin 대시보드 통합

### MCC 통합 대시보드
```typescript
// components/admin/MCCMultiAccountDashboard.tsx
export function MCCMultiAccountDashboard() {
  const [accountData, setAccountData] = useState({
    masgolf1: null,
    masgolf2: null,
    singsing: null,
    combined: null
  });
  
  useEffect(() => {
    fetch('/api/googleads/multi-account')
      .then(res => res.json())
      .then(data => setAccountData(data));
  }, []);
  
  return (
    <div className="space-y-6">
      {/* MCC 헤더 */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-lg text-white">
        <h2 className="text-2xl font-bold mb-2">광교골프 MCC 통합 대시보드</h2>
        <p className="text-blue-100">Manager Account: 757-142-7013</p>
      </div>
      
      {/* 3개 계정 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 마쓰구1 (예전) */}
        <div className="bg-red-50 border-2 border-red-200 p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-bold text-red-800">마쓰구1 (예전)</h3>
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">💎 리타겟팅</span>
          </div>
          <div className="space-y-2 text-sm">
            <p>계정 ID: 739-865-3521</p>
            <p>노출수: {accountData.masgolf1?.data?.reduce((sum, campaign) => sum + campaign.metrics.impressions, 0)?.toLocaleString()}</p>
            <p>클릭수: {accountData.masgolf1?.data?.reduce((sum, campaign) => sum + campaign.metrics.clicks, 0)?.toLocaleString()}</p>
            <p>전환수: {accountData.masgolf1?.data?.reduce((sum, campaign) => sum + campaign.metrics.conversions, 0)}</p>
          </div>
        </div>
        
        {/* MASGOLF2 (현재) */}
        <div className="bg-green-50 border-2 border-green-200 p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-bold text-green-800">MASGOLF2 (현재)</h3>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">🎯 메인</span>
          </div>
          <div className="space-y-2 text-sm">
            <p>계정 ID: 641-748-3168</p>
            <p>노출수: {accountData.masgolf2?.data?.reduce((sum, campaign) => sum + campaign.metrics.impressions, 0)?.toLocaleString()}</p>
            <p>클릭수: {accountData.masgolf2?.data?.reduce((sum, campaign) => sum + campaign.metrics.clicks, 0)?.toLocaleString()}</p>
            <p>전환수: {accountData.masgolf2?.data?.reduce((sum, campaign) => sum + campaign.metrics.conversions, 0)}</p>
          </div>
        </div>
        
        {/* 싱싱골프 */}
        <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-bold text-blue-800">싱싱골프</h3>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">🏌️‍♂️ 브랜드</span>
          </div>
          <div className="space-y-2 text-sm">
            <p>계정 ID: 449-543-7776</p>
            <p>노출수: {accountData.singsing?.data?.reduce((sum, campaign) => sum + campaign.metrics.impressions, 0)?.toLocaleString()}</p>
            <p>클릭수: {accountData.singsing?.data?.reduce((sum, campaign) => sum + campaign.metrics.clicks, 0)?.toLocaleString()}</p>
            <p>전환수: {accountData.singsing?.data?.reduce((sum, campaign) => sum + campaign.metrics.conversions, 0)}</p>
          </div>
        </div>
      </div>
      
      {/* 통합 성과 요약 */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-lg text-white">
        <h3 className="text-xl font-bold mb-4">🚀 통합 성과 요약</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-purple-100 text-sm">총 계정 수</p>
            <p className="text-2xl font-bold">3개</p>
          </div>
          <div>
            <p className="text-purple-100 text-sm">총 노출수</p>
            <p className="text-2xl font-bold">{accountData.combined?.total_impressions?.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-purple-100 text-sm">총 클릭수</p>
            <p className="text-2xl font-bold">{accountData.combined?.total_clicks?.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-purple-100 text-sm">총 전환수</p>
            <p className="text-2xl font-bold">{accountData.combined?.total_conversions}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎯 전환 추적 설정

### MCC 하위 계정별 전환 ID 설정
```javascript
// 마쓰구1 전환 추적 (리타겟팅 중심)
function trackMasgolf1Conversion() {
  gtag('event', 'conversion', {
    'send_to': 'AW-7398653521/REMARKETING_CONVERSION_LABEL',
    'value': 1200000,
    'currency': 'KRW',
    'custom_parameters': {
      'account_type': 'remarketing',
      'source': 'masgolf1'
    }
  });
}

// MASGOLF2 전환 추적 (메인 계정)
function trackMasgolf2Conversion() {
  gtag('event', 'conversion', {
    'send_to': 'AW-6417483168/MAIN_CONVERSION_LABEL',
    'value': 1000000,
    'currency': 'KRW',
    'custom_parameters': {
      'account_type': 'main',
      'source': 'masgolf2',
      'funnel': '8월퍼널'
    }
  });
}

// 싱싱골프 전환 추적 (별도 브랜드)
function trackSingsing Conversion() {
  gtag('event', 'conversion', {
    'send_to': 'AW-4495437776/SINGSING_CONVERSION_LABEL',
    'value': 800000,
    'currency': 'KRW',
    'custom_parameters': {
      'account_type': 'brand',
      'source': 'singsing'
    }
  });
}

// 통합 전환 추적 함수
function trackConversionByAccount(accountType, value, additionalParams = {}) {
  const conversionConfig = {
    'masgolf1': 'AW-7398653521/REMARKETING_CONVERSION_LABEL',
    'masgolf2': 'AW-6417483168/MAIN_CONVERSION_LABEL', 
    'singsing': 'AW-4495437776/SINGSING_CONVERSION_LABEL'
  };
  
  gtag('event', 'conversion', {
    'send_to': conversionConfig[accountType],
    'value': value,
    'currency': 'KRW',
    'custom_parameters': {
      'account_type': accountType,
      'timestamp': new Date().getTime(),
      ...additionalParams
    }
  });
}
```

---

## 📊 권장 사용 전략

### 1. 계정별 활용 전략

#### 마쓰구1 (예전 계정) 💎
- **활용**: 기존 고객 리타겟팅
- **예산**: 월 50만원 (리마케팅 중심)
- **타겟**: 과거 구매 고객, 방문자
- **캠페인**: 재구매 유도, 업그레이드 제안

#### MASGOLF2 (현재 활성) 🎯  
- **활용**: 신규 고객 획득
- **예산**: 월 300만원 (메인 예산)
- **타겟**: 골프 초보자, 클럽 교체 고객
- **캠페인**: 8월 퍼널, 신제품 런칭

#### 싱싱골프 (별도 브랜드) 🏌️‍♂️
- **활용**: 브랜드 차별화
- **예산**: 월 100만원 (독립 운영)
- **타겟**: 싱싱골프 브랜드 선호 고객
- **캠페인**: 브랜드 인지도, 교차 마케팅

### 2. 시너지 효과 극대화
- **데이터 통합**: 3개 계정 성과 비교 분석
- **오디언스 공유**: 마쓰구1 → MASGOLF2 룩어라이크
- **교차 프로모션**: 싱싱골프 ↔ MASGOLF2 연계 이벤트

### 3. 성과 측정 KPI
- **계정별 ROAS**: 마쓰구1(150%), MASGOLF2(200%), 싱싱골프(120%)
- **고객 생애 가치(LTV)**: 계정간 고객 이동 패턴 분석
- **브랜드 시너지**: 멀티 브랜드 구매 고객 비율

---

## ⚠️ 주의사항

1. **MCC 권한**: 광교골프 MCC 계정으로 모든 하위 계정 접근
2. **Developer Token**: 하나의 토큰으로 모든 계정 관리 가능
3. **예산 독립성**: 각 하위 계정별 독립적 예산 설정 유지
4. **전환 추적**: 각 계정별 고유 전환 ID 사용 필수
5. **데이터 보안**: MCC 레벨 접근 권한 신중히 관리
6. **계정 구분**: API 호출 시 정확한 Customer ID 사용
7. **리타겟팅 활용**: 마쓰구1의 기존 오디언스 데이터 적극 활용