const { chromium } = require('playwright');

async function setupGoogleVisionAPI() {
  console.log('🚀 Google Vision API 키 발급 자동화 시작');
  console.log('=====================================');
  
  const browser = await chromium.launch({ 
    headless: false, // 브라우저 창을 보여줌
    slowMo: 2000 // 각 동작 사이에 2초 대기
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // 1단계: Google Cloud Console 접속
    console.log('📝 1단계: Google Cloud Console 접속 중...');
    await page.goto('https://console.cloud.google.com/', { waitUntil: 'networkidle' });
    
    // 로그인 대기 (수동으로 로그인 필요)
    console.log('⏳ Google 계정으로 로그인해주세요...');
    console.log('⏳ 로그인 완료 후 Enter 키를 눌러주세요...');
    
    // 사용자 입력 대기
    await new Promise(resolve => {
      process.stdin.once('data', () => {
        resolve();
      });
    });
    
    // 2단계: Cloud Vision API 활성화
    console.log('📝 2단계: Cloud Vision API 활성화 중...');
    
    // API 및 서비스 메뉴로 이동
    await page.goto('https://console.cloud.google.com/apis/library/vision.googleapis.com', { waitUntil: 'networkidle' });
    
    // API 활성화 버튼 클릭
    try {
      const enableBtn = await page.waitForSelector('button:has-text("사용 설정")', { timeout: 10000 });
      await enableBtn.click();
      console.log('✅ Cloud Vision API 활성화 완료');
    } catch (error) {
      console.log('⚠️ API가 이미 활성화되어 있거나 버튼을 찾을 수 없습니다.');
    }
    
    // 3단계: API 키 생성
    console.log('📝 3단계: API 키 생성 중...');
    
    // 사용자 인증 정보 페이지로 이동
    await page.goto('https://console.cloud.google.com/apis/credentials', { waitUntil: 'networkidle' });
    
    // 사용자 인증 정보 만들기 클릭
    const createCredentialsBtn = await page.waitForSelector('button:has-text("사용자 인증 정보 만들기")', { timeout: 10000 });
    await createCredentialsBtn.click();
    
    // API 키 선택
    const apiKeyOption = await page.waitForSelector('text="API 키"', { timeout: 5000 });
    await apiKeyOption.click();
    console.log('✅ API 키 옵션 선택됨');
    
    // API 키 생성 완료 대기
    await page.waitForSelector('input[readonly]', { timeout: 10000 });
    
    // 생성된 API 키 복사
    const apiKeyInput = await page.$('input[readonly]');
    const apiKey = await apiKeyInput.inputValue();
    console.log('🎉 API 키 생성 완료!');
    console.log(`🔑 API 키: ${apiKey}`);
    
    // 4단계: .env.local 파일 업데이트
    console.log('📝 4단계: .env.local 파일 업데이트 중...');
    
    const fs = require('fs');
    const path = require('path');
    
    const envPath = path.join(__dirname, '.env.local');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // 기존 GOOGLE_VISION_API_KEY 라인 제거
    envContent = envContent.replace(/GOOGLE_VISION_API_KEY=.*\n/g, '');
    
    // 새로운 API 키 추가
    envContent += `\n# Google Vision API\nGOOGLE_VISION_API_KEY="${apiKey}"\n`;
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env.local 파일 업데이트 완료');
    
    // 5단계: 설정 확인
    console.log('📝 5단계: 설정 확인 중...');
    
    // API 키 테스트
    try {
      const testResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' },
            features: [{ type: 'LABEL_DETECTION', maxResults: 1 }]
          }]
        })
      });
      
      if (testResponse.ok) {
        console.log('✅ API 키 테스트 성공!');
      } else {
        console.log('❌ API 키 테스트 실패:', await testResponse.text());
      }
    } catch (error) {
      console.log('⚠️ API 키 테스트 중 오류:', error.message);
    }
    
    console.log('\n🎉 Google Vision API 설정 완료!');
    console.log('=====================================');
    console.log('📋 설정된 내용:');
    console.log(`🔑 API 키: ${apiKey}`);
    console.log('📁 .env.local 파일 업데이트됨');
    console.log('\n📋 다음 단계:');
    console.log('1. 개발 서버 재시작: npm run dev');
    console.log('2. 이미지 AI 분석 테스트');
    console.log('3. Vercel 배포 시 환경 변수 설정');
    
    return apiKey;
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.log('\n🔧 수동 설정 방법:');
    console.log('1. https://console.cloud.google.com/ 접속');
    console.log('2. 프로젝트 선택 또는 생성');
    console.log('3. API 및 서비스 > 라이브러리 > Cloud Vision API 활성화');
    console.log('4. API 및 서비스 > 사용자 인증 정보 > API 키 생성');
    console.log('5. .env.local 파일에 GOOGLE_VISION_API_KEY 추가');
    
    throw error;
  } finally {
    console.log('\n⏳ 브라우저를 10초 후에 닫습니다...');
    setTimeout(async () => {
      await browser.close();
    }, 10000);
  }
}

// 중요사항 알림
function showImportantNotes() {
  console.log('\n🚨 중요사항:');
  console.log('=====================================');
  console.log('💰 비용 관리:');
  console.log('  - 무료 할당량: 월 1,000회 요청');
  console.log('  - 유료 요청: 1,000회 이후 $1.50/1,000회');
  console.log('  - 예상 비용: 월 10,000회 요청 시 약 $13.50');
  console.log('');
  console.log('🔒 보안 주의사항:');
  console.log('  - API 키를 공개 저장소에 커밋하지 마세요');
  console.log('  - .env.local 파일은 .gitignore에 포함되어 있습니다');
  console.log('  - Vercel 배포 시 별도로 환경 변수를 설정해야 합니다');
  console.log('');
  console.log('📊 사용량 모니터링:');
  console.log('  - Google Cloud Console에서 사용량 확인 가능');
  console.log('  - 예산 알림 설정 권장');
  console.log('  - API 키 제한사항으로 보안 강화');
  console.log('');
  console.log('🔄 대안 서비스:');
  console.log('  - AWS Rekognition: 월 5,000회 무료');
  console.log('  - Azure Computer Vision: 월 5,000회 무료');
  console.log('  - Hugging Face Transformers: 완전 무료');
  console.log('');
  console.log('⚠️ 주의사항:');
  console.log('  - 브라우저가 열리면 Google 계정으로 로그인해주세요');
  console.log('  - 로그인 완료 후 터미널에서 Enter 키를 눌러주세요');
  console.log('  - API 키 생성 후 자동으로 .env.local 파일이 업데이트됩니다');
}

// 실행
if (require.main === module) {
  showImportantNotes();
  
  setupGoogleVisionAPI()
    .then(apiKey => {
      console.log(`\n🎯 API 키 발급 성공: ${apiKey}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ API 키 발급 실패:', error.message);
      process.exit(1);
    });
}

module.exports = { setupGoogleVisionAPI, showImportantNotes };
