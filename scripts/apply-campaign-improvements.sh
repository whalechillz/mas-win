#!/bin/bash
# chmod +x 이 스크립트를 실행하기 전에 실행하세요
# 캠페인 관리 시스템 개선을 위한 즉시 적용 가능한 수정 스크립트

echo "🚀 캠페인 관리 시스템 개선 시작..."

# 1. admin.tsx 백업
echo "📦 기존 파일 백업 중..."
cp /Users/m2/MASLABS/win.masgolf.co.kr/pages/admin.tsx /Users/m2/MASLABS/win.masgolf.co.kr/pages/admin.tsx.backup-$(date +%Y%m%d-%H%M%S)

# 2. admin.tsx 수정사항 적용
echo "✏️ admin.tsx 수정 중..."

# Live 표시 제거 및 애니메이션 제거
cat > /tmp/admin-fixes.txt << 'EOF'
# 다음 수정사항을 admin.tsx에 적용하세요:

1. Line 약 450-470 근처에서 "Live" 표시 제거:
   삭제할 코드:
   <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
     Live
   </span>

2. RefreshCw 아이콘의 animate-spin 제거:
   변경 전: className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
   변경 후: className="w-4 h-4"

3. tabs 배열에서 'versions' 탭 제거 (대략 Line 500-520):
   const tabs = [
     { id: 'overview', label: '대시보드', icon: Activity },
     { id: 'campaigns', label: '캠페인 관리', icon: Megaphone },
     { id: 'bookings', label: '예약 관리', icon: Calendar },
     { id: 'contacts', label: '문의 관리', icon: MessageSquare },
     // { id: 'versions', label: '버전 관리', icon: Layers }, // 이 줄 제거
   ];

4. versions 관련 코드 제거 또는 campaigns로 통합
   - versions 배열을 campaigns 배열에 통합
   - activeTab === 'versions' 조건문 블록 제거
EOF

echo "📝 수정 가이드가 /tmp/admin-fixes.txt에 생성되었습니다."

# 3. OP 메뉴얼 디렉토리 구조 생성
echo "📁 OP 메뉴얼 디렉토리 구조 생성 중..."
mkdir -p /Users/m2/MASLABS/win.masgolf.co.kr/docs/op-manuals/2025-05-가정의달
mkdir -p /Users/m2/MASLABS/win.masgolf.co.kr/docs/op-manuals/2025-06-프라임타임
mkdir -p /Users/m2/MASLABS/win.masgolf.co.kr/docs/op-manuals/2025-07-여름특별

# 4. OP 메뉴얼 템플릿 생성
echo "📄 OP 메뉴얼 템플릿 생성 중..."
cat > /Users/m2/MASLABS/win.masgolf.co.kr/docs/op-manuals/TEMPLATE.md << 'EOF'
# [캠페인명] 운영 메뉴얼

## 1. 캠페인 개요
- **기간**: 2025년 X월 X일 ~ X월 X일
- **목표**: 
- **타겟 고객**: 

## 2. 주요 설정값
- **전화번호**: 080-028-8888
- **운영 시간**: 09:00 ~ 18:00
- **이벤트 마감일**: X월 X일

## 3. 응대 스크립트

### 인사말
"안녕하세요, MASGOLF입니다. [캠페인명] 문의 주셔서 감사합니다."

### 주요 안내사항
- 무료 시타 체험
- 특별 할인 혜택
- 선착순 마감 안내

### 마무리 멘트
"추가 문의사항이 있으시면 언제든 연락 주세요. 감사합니다."

## 4. 자주 묻는 질문 (FAQ)

### Q: 시타 체험은 언제 가능한가요?
A: 

### Q: 할인율은 얼마인가요?
A: 

### Q: 남은 인원이 얼마나 되나요?
A: 

## 5. 긴급 상황 대응

### 시스템 오류 시
1. 고객에게 양해 구하기
2. 수동으로 정보 기록
3. 개발팀 연락

### 불만 접수 시
1. 경청하고 공감 표현
2. 문제 파악 및 기록
3. 해결 방안 제시 또는 상급자 연결
EOF

# 5. 캠페인 통합 데이터 구조 파일 생성
echo "🔧 통합 캠페인 데이터 구조 생성 중..."
cat > /Users/m2/MASLABS/win.masgolf.co.kr/lib/campaign-data.js << 'EOF'
// 통합된 캠페인 데이터 구조
export const campaigns = [
  {
    id: "2025-07",
    name: "여름 특별 캠페인",
    status: "active", // active, ended, planned
    period: {
      start: "2025-07-01",
      end: "2025-07-31"
    },
    files: {
      landingPage: "/versions/funnel-2025-07-complete.html",
      landingPageUrl: "/funnel-2025-07",
      opManual: "/docs/op-manuals/2025-07-여름특별/",
      googleAds: "/google_ads/2025.07.여름특별/"
    },
    settings: {
      phoneNumber: "080-028-8888",
      eventDate: "7월 31일",
      remainingSlots: 10,
      discountRate: 50
    },
    metrics: {
      views: 0,
      bookings: 0,
      inquiries: 0,
      conversionRate: 0
    }
  },
  {
    id: "2025-06",
    name: "프라임타임 캠페인",
    status: "ended",
    period: {
      start: "2025-06-01",
      end: "2025-06-30"
    },
    files: {
      landingPage: "/versions/funnel-2025-06.html",
      landingPageUrl: "/funnel-2025-06",
      opManual: "/docs/op-manuals/2025-06-프라임타임/",
      googleAds: "/google_ads/2025.06.11.프라임타임/"
    },
    settings: {
      phoneNumber: "080-028-8888",
      eventDate: "6월 30일",
      remainingSlots: 0,
      discountRate: 40
    }
  },
  {
    id: "2025-05",
    name: "가정의 달 캠페인",
    status: "ended",
    period: {
      start: "2025-05-01",
      end: "2025-05-31"
    },
    files: {
      landingPage: "/versions/funnel-2025-05.html",
      landingPageUrl: "/funnel-2025-05",
      opManual: "/docs/op-manuals/2025-05-가정의달/",
      googleAds: "/google_ads/2025.05.01.가정의달/"
    },
    settings: {
      phoneNumber: "080-028-8888",
      eventDate: "5월 31일",
      remainingSlots: 0,
      discountRate: 30
    }
  }
];

// 캠페인 생성 헬퍼 함수
export function createNewCampaign({ month, year, name, discountRate = 50 }) {
  const monthStr = String(month).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate();
  
  return {
    id: `${year}-${monthStr}`,
    name: name,
    status: "planned",
    period: {
      start: `${year}-${monthStr}-01`,
      end: `${year}-${monthStr}-${lastDay}`
    },
    files: {
      landingPage: `/versions/funnel-${year}-${monthStr}.html`,
      landingPageUrl: `/funnel-${year}-${monthStr}`,
      opManual: `/docs/op-manuals/${year}-${monthStr}-${name}/`,
      googleAds: null // 나중에 생성
    },
    settings: {
      phoneNumber: "080-028-8888",
      eventDate: `${month}월 ${lastDay}일`,
      remainingSlots: 30,
      discountRate: discountRate
    },
    metrics: {
      views: 0,
      bookings: 0,
      inquiries: 0,
      conversionRate: 0
    }
  };
}

// 현재 활성 캠페인 가져오기
export function getActiveCampaign() {
  return campaigns.find(c => c.status === "active");
}

// 캠페인 상태 업데이트
export function updateCampaignStatus() {
  const today = new Date();
  campaigns.forEach(campaign => {
    const endDate = new Date(campaign.period.end);
    if (endDate < today && campaign.status === "active") {
      campaign.status = "ended";
    }
  });
}
EOF

echo "✅ 캠페인 관리 시스템 개선 준비 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. /tmp/admin-fixes.txt 파일을 참고하여 admin.tsx 수정"
echo "2. /lib/campaign-data.js 파일을 import하여 사용"
echo "3. OP 메뉴얼 템플릿을 참고하여 각 캠페인별 메뉴얼 작성"
echo ""
echo "💡 추가 개선사항은 /docs/campaign-improvement/CAMPAIGN_IMPROVEMENT_PLAN.md 참조"
