#!/bin/bash
# chmod +x complete-dialog1.sh && ./complete-dialog1.sh

# 대화창1 작업 완료 후 실행 스크립트

echo "🚀 대화창1 작업 완료 후 실행 스크립트"
echo ""

# 1. 스크립트 실행 권한 부여
echo "📋 스크립트 실행 권한 부여 중..."
chmod +x setup-integrated-marketing-schema.sh

# 2. 데이터베이스 스키마 실행
echo ""
echo "🗄️ 데이터베이스 스키마를 생성하시겠습니까? (y/n)"
read -r response

if [[ "$response" == "y" || "$response" == "Y" ]]; then
    echo "📊 데이터베이스 스키마 생성 시작..."
    ./setup-integrated-marketing-schema.sh
else
    echo "⏭️ 데이터베이스 스키마 생성을 건너뛰었습니다."
    echo "💡 나중에 './setup-integrated-marketing-schema.sh'를 실행하여 스키마를 생성할 수 있습니다."
fi

echo ""
echo "✅ 대화창1 작업이 완료되었습니다!"
echo ""
echo "📋 생성된 파일들:"
echo "  - database/integrated-marketing-schema.sql (데이터베이스 스키마)"
echo "  - pages/api/integrated/funnel-plans-v2.ts"
echo "  - pages/api/integrated/generate-content-v2.ts"
echo "  - pages/api/integrated/validate-content-v2.ts"
echo "  - pages/api/integrated/kpi-v2.ts"
echo "  - pages/api/integrated/employee-quota-v2.ts"
echo "  - pages/api/integrated/kpi-sync-v2.ts"
echo ""
echo "🎯 다음 단계:"
echo "  새 대화창을 만들어 대화창2 작업(KPIManager 컴포넌트 구현)을 시작하세요!"
