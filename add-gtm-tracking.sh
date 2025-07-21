#!/bin/bash

echo "📊 GA4 추적 코드를 HTML에 추가하기"
echo "================================="
echo ""
echo "🎯 추가해야 할 파일:"
echo "  public/versions/funnel-2025-07-complete.html"
echo ""
echo "📝 <head> 태그 안에 추가:"
cat << 'HEAD_CODE'
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WPBX97JG');</script>
<!-- End Google Tag Manager -->

<!-- GA4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-SMJWL2TRM7"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-SMJWL2TRM7');
</script>
HEAD_CODE
echo ""
echo "📝 </body> 태그 직전에 추가:"
cat << 'BODY_CODE'
<!-- 캠페인 추적 스크립트 -->
<script src="/campaign-tracking.js"></script>
BODY_CODE
echo ""
echo "================================="
echo ""
echo "✅ 추가 완료 후:"
echo "  1. http://localhost:3000/funnel-2025-07 접속"
echo "  2. http://localhost:3000/admin 에서 실시간 데이터 확인"
