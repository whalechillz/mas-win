#!/bin/bash

echo "🔍 Supabase 서비스 롤 키 가져오기"
echo "=================================="
echo ""
echo "Supabase 대시보드에서 서비스 롤 키를 가져오는 방법:"
echo ""
echo "1. https://supabase.com/dashboard 접속"
echo "2. 프로젝트 선택 (yyytjudftvpmcnppaymw)"
echo "3. 왼쪽 메뉴에서 'Settings' 클릭"
echo "4. 'API' 섹션 클릭"
echo "5. 'Service role key' 섹션에서 'Reveal' 클릭"
echo "6. 키 복사"
echo ""
echo "키를 복사한 후 .env.local 파일에 추가:"
echo "SUPABASE_SERVICE_ROLE_KEY=복사한_키_여기에_붙여넣기"
echo ""
echo "⚠️  주의: 서비스 롤 키는 절대 공개하지 마세요!"
echo ""

# .env.local 파일에 서비스 롤 키가 있는지 확인
if [ -f ".env.local" ]; then
    if grep -q "SUPABASE_SERVICE_ROLE_KEY=" .env.local; then
        echo "✅ .env.local 파일에 SUPABASE_SERVICE_ROLE_KEY가 설정되어 있습니다."
        
        # 값이 비어있는지 확인
        if grep -q "SUPABASE_SERVICE_ROLE_KEY=$" .env.local || grep -q "SUPABASE_SERVICE_ROLE_KEY=\"\"" .env.local; then
            echo "❌ 하지만 값이 비어있습니다. 위의 단계를 따라 키를 추가하세요."
        else
            echo "✅ 값이 설정되어 있습니다."
        fi
    else
        echo "❌ .env.local 파일에 SUPABASE_SERVICE_ROLE_KEY가 없습니다."
        echo ""
        echo "다음 라인을 .env.local에 추가하세요:"
        echo "SUPABASE_SERVICE_ROLE_KEY=여기에_서비스_롤_키_입력"
    fi
else
    echo "❌ .env.local 파일이 없습니다."
    echo "파일을 생성하고 환경변수를 추가하세요."
fi