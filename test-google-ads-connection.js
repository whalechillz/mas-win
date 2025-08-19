// Google Ads API 연결 테스트 스크립트
// localhost:3000/admin 페이지의 브라우저 콘솔에서 실행하세요

// 1. 환경변수 및 연결 상태 확인
async function checkGoogleAdsConnection() {
  console.log('🔍 Google Ads 환경변수 및 연결 상태 확인...');
  
  try {
    const response = await fetch('/api/debug/google-ads-connection');
    const data = await response.json();
    
    console.log('📊 환경변수 상태:');
    console.log('====================================');
    
    // Google Ads 환경변수 상태
    console.log('🎯 Google Ads 설정:');
    data.googleAds.variables.forEach(v => {
      console.log(`  ${v.valid ? '✅' : '❌'} ${v.name}: ${v.masked}`);
    });
    console.log(`  총 ${data.googleAds.total}개 중 ${data.googleAds.set}개 설정됨`);
    console.log(`  패키지 설치: ${data.googleAds.packageAvailable ? '✅' : '❌'}`);
    
    console.log('\n📈 GA4 설정:');
    data.ga4.variables.forEach(v => {
      console.log(`  ${v.valid ? '✅' : '❌'} ${v.name}: ${v.masked}`);
    });
    
    console.log('====================================');
    console.log(`전체 상태: ${data.summary.googleAdsReady ? '✅ 준비됨' : '❌ 설정 필요'}`);
    
    return data.summary.googleAdsReady;
  } catch (error) {
    console.error('❌ 연결 확인 실패:', error);
    return false;
  }
}

// 2. Google Ads API 실제 테스트
async function testGoogleAdsAPI() {
  console.log('\n🚀 Google Ads API 실제 연결 테스트...');
  
  try {
    const response = await fetch('/api/debug/google-ads-test');
    const data = await response.json();
    
    console.log('====================================');
    console.log(`단계: ${data.step}`);
    console.log(`상태: ${data.status === '성공' ? '✅' : '❌'} ${data.status}`);
    console.log(`메시지: ${data.message}`);
    
    if (data.customerInfo) {
      console.log(`고객 ID: ${data.customerInfo.id}`);
    }
    
    if (data.error) {
      console.error('오류 상세:', data.error);
      
      if (data.errorDetails) {
        console.log('\n🔧 디버깅 정보:');
        console.log('오류 이름:', data.errorDetails.name);
        console.log('전체 오류:', data.errorDetails.fullError);
      }
    }
    
    console.log('\n💡 다음 단계:', data.nextStep);
    console.log('====================================');
    
    return data.status === '성공';
  } catch (error) {
    console.error('❌ API 테스트 실패:', error);
    return false;
  }
}

// 3. 상세 API 테스트 (캠페인 데이터 가져오기)
async function testGoogleAdsDetailed() {
  console.log('\n📊 Google Ads 상세 데이터 테스트...');
  
  try {
    const response = await fetch('/api/debug/google-ads-detailed');
    const data = await response.json();
    
    console.log('====================================');
    console.log(`상태: ${data.success ? '✅ 성공' : '❌ 실패'}`);
    
    if (data.data) {
      console.log('\n📈 계정 정보:');
      console.log(`- 이름: ${data.data.accountName}`);
      console.log(`- ID: ${data.data.accountId}`);
      console.log(`- 통화: ${data.data.currency}`);
      
      if (data.data.campaigns && data.data.campaigns.length > 0) {
        console.log('\n📢 캠페인 목록:');
        data.data.campaigns.forEach((campaign, index) => {
          console.log(`${index + 1}. ${campaign.name} (${campaign.status})`);
          console.log(`   - 노출수: ${campaign.impressions}`);
          console.log(`   - 클릭수: ${campaign.clicks}`);
          console.log(`   - 비용: ${campaign.cost}`);
        });
      } else {
        console.log('\n⚠️ 활성 캠페인이 없습니다.');
      }
    }
    
    if (data.error) {
      console.error('\n❌ 오류:', data.error);
    }
    
    console.log('====================================');
    
    return data.success;
  } catch (error) {
    console.error('❌ 상세 테스트 실패:', error);
    return false;
  }
}

// 4. 전체 테스트 실행
async function runFullGoogleAdsTest() {
  console.log('🎯 Google Ads API 전체 테스트 시작...\n');
  
  // Step 1: 환경변수 확인
  const envReady = await checkGoogleAdsConnection();
  if (!envReady) {
    console.log('\n❌ 환경변수 설정이 완료되지 않았습니다.');
    showSetupGuide();
    return;
  }
  
  // Step 2: API 연결 테스트
  const apiConnected = await testGoogleAdsAPI();
  if (!apiConnected) {
    console.log('\n❌ API 연결에 실패했습니다.');
    showTroubleshootingGuide();
    return;
  }
  
  // Step 3: 상세 데이터 테스트 (선택사항)
  console.log('\n상세 데이터도 테스트하시겠습니까? (선택사항)');
  console.log('testGoogleAdsDetailed() 를 실행하세요.');
  
  console.log('\n✅ 기본 테스트 완료!');
}

// 5. 설정 가이드
function showSetupGuide() {
  console.log('\n📖 Google Ads API 설정 가이드');
  console.log('====================================');
  console.log('1. Google Ads 계정 확인:');
  console.log('   - MCC ID: 7571427013');
  console.log('   - Customer ID: 6412482148');
  console.log('');
  console.log('2. 개발자 토큰 확인:');
  console.log('   - https://ads.google.com/aw/apicenter 접속');
  console.log('   - 토큰 상태가 "승인됨"인지 확인');
  console.log('');
  console.log('3. OAuth 설정 확인:');
  console.log('   - https://console.cloud.google.com 접속');
  console.log('   - OAuth 2.0 클라이언트 ID 확인');
  console.log('====================================');
}

// 6. 문제 해결 가이드
function showTroubleshootingGuide() {
  console.log('\n🔧 문제 해결 가이드');
  console.log('====================================');
  console.log('1. "PERMISSION_DENIED" 오류:');
  console.log('   - MCC 계정이 고객 계정에 접근 권한이 있는지 확인');
  console.log('   - Google Ads 웹사이트에서 계정 연결 상태 확인');
  console.log('');
  console.log('2. "INVALID_GRANT" 오류:');
  console.log('   - Refresh Token이 만료되었을 수 있음');
  console.log('   - OAuth 재인증 필요');
  console.log('');
  console.log('3. "DEVELOPER_TOKEN_NOT_APPROVED" 오류:');
  console.log('   - API Center에서 개발자 토큰 승인 상태 확인');
  console.log('   - 승인 대기 중이면 Google 지원팀에 문의');
  console.log('====================================');
}

// 사용법 안내
console.log('💡 Google Ads API 테스트 도구');
console.log('====================================');
console.log('사용 가능한 명령:');
console.log('');
console.log('runFullGoogleAdsTest()    - 전체 테스트 실행');
console.log('checkGoogleAdsConnection() - 환경변수 확인');
console.log('testGoogleAdsAPI()        - API 연결 테스트');
console.log('testGoogleAdsDetailed()   - 상세 데이터 테스트');
console.log('showSetupGuide()          - 설정 가이드 보기');
console.log('showTroubleshootingGuide() - 문제 해결 가이드');
console.log('====================================');
console.log('시작하려면 runFullGoogleAdsTest() 를 실행하세요.');
