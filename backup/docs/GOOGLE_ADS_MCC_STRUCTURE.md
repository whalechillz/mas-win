# Google Ads MCC (Manager Account) 구조 분석

## 🏢 현재 계정 구조

### 총관리자 계정 (MCC)
```
광교골프 (Customer ID: 757-142-7013)
├── 마쓰구1 (예전 계정) - 리타겟팅 데이터 풍부
├── MASGOLF2 (현재 활성) - 메인 광고 계정  
└── 싱싱골프 - 별도 브랜드
```

---

## 🎯 권장 설정: MCC 계정으로 API 구성

### 장점
1. **통합 관리**: 모든 하위 계정을 한번에 관리
2. **권한 효율성**: 하나의 API 설정으로 모든 계정 접근
3. **데이터 통합**: 전체 성과를 통합 분석 가능
4. **확장성**: 향후 새 계정 추가 시 쉽게 연동

### MCC API 설정
```env
# MCC (Manager) 계정 설정
GOOGLE_ADS_MANAGER_CUSTOMER_ID=7571427013
GOOGLE_ADS_CLIENT_ID=your-client-id
GOOGLE_ADS_CLIENT_SECRET=your-client-secret
GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token
GOOGLE_ADS_REFRESH_TOKEN=your-refresh-token

# 하위 계정들 (실제 Customer ID)
GOOGLE_ADS_MASGOLF1_ID=7398653521
GOOGLE_ADS_MASGOLF2_ID=6417483168
GOOGLE_ADS_SINGSING_ID=4495437776
```

---

## 🔧 MCC API 구현

### 1. 모든 하위 계정 데이터 가져오기
```typescript
// pages/api/googleads/mcc-overview.ts
import { GoogleAdsApi } from 'google-ads-api';

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});

export default async function handler(req, res) {
  try {
    const mccCustomer = client.Customer({
      customer_id: process.env.GOOGLE_ADS_MANAGER_CUSTOMER_ID, // 757-142-7013
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    });
    
    // 1. 모든 하위 계정 목록 가져오기
    const accounts = await mccCustomer.query(`
      SELECT 
        customer_client.descriptive_name,
        customer_client.id,
        customer_client.manager,
        customer_client.status
      FROM customer_client 
      WHERE customer_client.status = 'ENABLED'
    `);
    
    // 2. 각 계정별 성과 데이터 가져오기
    const accountsData = await Promise.all(
      accounts.map(async (account) => {
        const subCustomer = client.Customer({
          customer_id: account.customer_client.id,
          refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
        });
        
        const campaigns = await subCustomer.query(`
          SELECT 
            campaign.name,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions
          FROM campaign 
          WHERE segments.date DURING LAST_30_DAYS
        `);
        
        return {
          account_name: account.customer_client.descriptive_name,
          account_id: account.customer_client.id,
          campaigns: campaigns,
          totals: {
            impressions: campaigns.reduce((sum, c) => sum + c.metrics.impressions, 0),
            clicks: campaigns.reduce((sum, c) => sum + c.metrics.clicks, 0),
            cost: campaigns.reduce((sum, c) => sum + c.metrics.cost_micros, 0) / 1000000,
            conversions: campaigns.reduce((sum, c) => sum + c.metrics.conversions, 0)
          }
        };
      })
    );
    
    res.status(200).json({
      manager_account: "광교골프",
      accounts: accountsData,
      summary: {
        total_accounts: accountsData.length,
        total_impressions: accountsData.reduce((sum, acc) => sum + acc.totals.impressions, 0),
        total_clicks: accountsData.reduce((sum, acc) => sum + acc.totals.clicks, 0),
        total_cost: accountsData.reduce((sum, acc) => sum + acc.totals.cost, 0),
        total_conversions: accountsData.reduce((sum, acc) => sum + acc.totals.conversions, 0)
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### 2. 계정별 세부 데이터 API
```typescript
// pages/api/googleads/account/[accountId].ts
export default async function handler(req, res) {
  const { accountId } = req.query;
  
  try {
    const customer = client.Customer({
      customer_id: accountId,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    });
    
    const [campaigns, keywords, audiences] = await Promise.all([
      // 캠페인 데이터
      customer.query(`
        SELECT 
          campaign.id,
          campaign.name,
          campaign.status,
          metrics.impressions,
          metrics.clicks,
          metrics.ctr,
          metrics.average_cpc,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversion_rate
        FROM campaign 
        WHERE segments.date DURING LAST_30_DAYS
        ORDER BY metrics.impressions DESC
      `),
      
      // 키워드 성과
      customer.query(`
        SELECT 
          ad_group_criterion.keyword.text,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros
        FROM keyword_view 
        WHERE segments.date DURING LAST_30_DAYS
        ORDER BY metrics.clicks DESC
        LIMIT 20
      `),
      
      // 리마케팅 오디언스 (마쓰구1의 경우 중요)
      customer.query(`
        SELECT 
          user_list.name,
          user_list.size_for_display,
          user_list.size_for_search
        FROM user_list
        WHERE user_list.type = 'REMARKETING'
      `)
    ]);
    
    res.status(200).json({
      account_id: accountId,
      campaigns,
      top_keywords: keywords,
      remarketing_lists: audiences
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

---

## 📊 Admin 대시보드 통합

### MCC 통합 대시보드
```typescript
// components/admin/MCCDashboard.tsx
export function MCCDashboard() {
  const [mccData, setMccData] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  
  useEffect(() => {
    fetch('/api/googleads/mcc-overview')
      .then(res => res.json())
      .then(data => setMccData(data));
  }, []);
  
  return (
    <div className="space-y-6">
      {/* 전체 요약 */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-lg text-white">
        <h2 className="text-2xl font-bold mb-4">광교골프 MCC 통합 대시보드</h2>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm opacity-80">총 계정 수</p>
            <p className="text-2xl font-bold">{mccData?.summary?.total_accounts}</p>
          </div>
          <div>
            <p className="text-sm opacity-80">총 노출수</p>
            <p className="text-2xl font-bold">{mccData?.summary?.total_impressions?.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm opacity-80">총 클릭수</p>
            <p className="text-2xl font-bold">{mccData?.summary?.total_clicks?.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm opacity-80">총 전환수</p>
            <p className="text-2xl font-bold">{mccData?.summary?.total_conversions}</p>
          </div>
        </div>
      </div>
      
      {/* 계정별 성과 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mccData?.accounts?.map((account, index) => (
          <div 
            key={account.account_id} 
            className={`p-6 rounded-lg cursor-pointer transition-all ${
              index === 0 ? 'bg-red-50 border-red-200' :   // 마쓰구1 (예전)
              index === 1 ? 'bg-green-50 border-green-200' : // MASGOLF2 (현재)
              'bg-blue-50 border-blue-200'  // 싱싱골프
            } border-2 hover:shadow-lg`}
            onClick={() => setSelectedAccount(account)}
          >
            <h3 className="font-bold text-lg mb-2">{account.account_name}</h3>
            <p className="text-sm text-gray-600 mb-4">ID: {account.account_id}</p>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>노출수</span>
                <span className="font-semibold">{account.totals.impressions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>클릭수</span>
                <span className="font-semibold">{account.totals.clicks.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>비용</span>
                <span className="font-semibold">₩{Math.round(account.totals.cost).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>전환수</span>
                <span className="font-semibold">{account.totals.conversions}</span>
              </div>
            </div>
            
            {/* 계정별 특징 표시 */}
            {index === 0 && (
              <div className="mt-3 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                리타겟팅 데이터 풍부
              </div>
            )}
            {index === 1 && (
              <div className="mt-3 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                현재 메인 계정
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* 선택된 계정 세부 정보 */}
      {selectedAccount && (
        <AccountDetailView account={selectedAccount} />
      )}
    </div>
  );
}
```

---

## 🎯 활용 전략

### 1. 마쓰구1 (예전 계정)
- **리타겟팅 리스트 활용**: 기존 고객 데이터로 재마케팅
- **룩어라이크 오디언스**: 유사 고객 확장
- **데이터 분석**: 과거 성과 패턴 분석

### 2. MASGOLF2 (현재 계정)  
- **메인 광고 운영**: 신규 캠페인 집중
- **8월 퍼널 연동**: 현재 퍼널과 직접 연결
- **실시간 최적화**: 활성 캠페인 관리

### 3. 싱싱골프
- **별도 브랜드**: 독립적인 마케팅
- **교차 분석**: 브랜드간 성과 비교
- **시너지 효과**: 통합 프로모션 가능

---

## ✅ 최종 권장사항

**MCC 계정(광교골프)으로 API를 설정하는 것이 최적입니다!**

### 이유:
1. **통합 관리**: 3개 계정을 한번에 관리
2. **데이터 활용**: 마쓰구1의 리타겟팅 데이터 + MASGOLF2의 현재 성과
3. **효율성**: 하나의 API 설정으로 모든 데이터 접근
4. **확장성**: 향후 계정 추가 시 쉽게 연동

이렇게 설정하시면 모든 계정의 데이터를 통합적으로 분석하고 활용할 수 있습니다!