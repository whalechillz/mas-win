// scripts/playwright-google-ads-setup.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 설정 파일
const CONFIG = {
  googleAccount: {
    email: 'taksoo.kim@gmail.com', // 실제 관리자 계정
    // password는 수동 로그인
  },
  project: {
    name: 'MASGOLF-API-Project',
    description: 'MASGOLF Google Ads API Integration'
  },
  oauth: {
    name: 'MASGOLF Google Ads API',
    redirectUris: [
      'http://localhost:3000/auth/google/callback',
      'https://win.masgolf.co.kr/auth/google/callback'
    ]
  }
};

class GoogleAdsAPISetup {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      clientId: null,
      clientSecret: null,
      developerToken: null,
      refreshToken: null
    };
  }

  async init() {
    console.log('🚀 Playwright로 Google Ads API 자동 설정 시작...\n');
    
    this.browser = await chromium.launch({ 
      headless: false, // 브라우저 화면 표시
      slowMo: 1000 // 1초 지연으로 과정 확인
    });
    this.page = await this.browser.newPage();
    
    // 브라우저 크기 설정
    await this.page.setViewportSize({ width: 1200, height: 800 });
  }

  async loginToGoogle() {
    console.log('🔐 Google 계정 로그인 중...');
    
    await this.page.goto('https://accounts.google.com/signin');
    await this.page.waitForTimeout(2000);
    
    try {
      // 이메일 입력 시도
      const emailInput = await this.page.$('input[type="email"]');
      if (emailInput) {
        await emailInput.fill(CONFIG.googleAccount.email);
        await this.page.waitForTimeout(1000);
        
        const nextButton = await this.page.$('#identifierNext, button:has-text("다음")');
        if (nextButton) {
          await nextButton.click();
          await this.page.waitForTimeout(2000);
        }
      }
    } catch (error) {
      console.log('📝 이메일 자동 입력 실패 - 수동으로 입력해주세요');
    }
    
    // 수동 로그인 완료 대기
    console.log('⏳ 브라우저에서 로그인을 완료해주세요...');
    console.log(`📧 계정: ${CONFIG.googleAccount.email}`);
    console.log('💡 2단계 인증이 있다면 완료해주세요.');
    console.log('🔄 로그인 완료 후 Enter를 눌러주세요...');
    
    // 사용자 입력 대기
    await this.waitForUserConfirmation();
    
    console.log('✅ Google 로그인 완료!');
  }

  async waitForUserConfirmation() {
    return new Promise((resolve) => {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('로그인이 완료되었으면 Enter를 눌러주세요...', () => {
        rl.close();
        resolve();
      });
    });
  }

  async setupGoogleCloudProject() {
    console.log('☁️ Google Cloud Console 프로젝트 설정 중...');
    
    await this.page.goto('https://console.cloud.google.com/');
    
    // 프로젝트 선택/생성 대기
    await this.page.waitForTimeout(3000);
    
    try {
      // 새 프로젝트 생성 시도
      const newProjectButton = await this.page.$('text=새 프로젝트');
      if (newProjectButton) {
        await newProjectButton.click();
        await this.page.fill('[data-test-id="input-field"]', CONFIG.project.name);
        await this.page.click('text=만들기');
        
        // 프로젝트 생성 완료 대기
        await this.page.waitForTimeout(10000);
        console.log('✅ 새 프로젝트 생성 완료!');
      } else {
        console.log('📝 기존 프로젝트 사용');
      }
    } catch (error) {
      console.log('⚠️ 프로젝트 설정 수동 확인 필요:', error.message);
    }
  }

  async enableGoogleAdsAPI() {
    console.log('🔌 Google Ads API 활성화 중...');
    
    // API 라이브러리로 이동
    await this.page.goto('https://console.cloud.google.com/apis/library');
    await this.page.waitForTimeout(2000);
    
    // Google Ads API 검색
    await this.page.fill('input[placeholder*="검색"]', 'Google Ads API');
    await this.page.press('input[placeholder*="검색"]', 'Enter');
    await this.page.waitForTimeout(2000);
    
    // Google Ads API 클릭
    try {
      await this.page.click('text=Google Ads API');
      await this.page.waitForTimeout(2000);
      
      // 사용 설정 버튼 클릭
      const enableButton = await this.page.$('text=사용');
      if (enableButton) {
        await enableButton.click();
        await this.page.waitForTimeout(5000);
        console.log('✅ Google Ads API 활성화 완료!');
      } else {
        console.log('📝 Google Ads API 이미 활성화됨');
      }
    } catch (error) {
      console.log('⚠️ Google Ads API 활성화 수동 확인 필요');
    }
  }

  async createOAuthCredentials() {
    console.log('🔑 OAuth 2.0 클라이언트 ID 생성 중...');
    
    // Credentials 페이지로 이동
    await this.page.goto('https://console.cloud.google.com/apis/credentials');
    await this.page.waitForTimeout(3000);
    
    try {
      // Create Credentials 클릭
      await this.page.click('text=사용자 인증 정보 만들기');
      await this.page.waitForTimeout(1000);
      
      // OAuth client ID 선택
      await this.page.click('text=OAuth 클라이언트 ID');
      await this.page.waitForTimeout(2000);
      
      // Application type 선택
      await this.page.selectOption('select', 'web');
      
      // 이름 입력
      await this.page.fill('input[name="displayName"]', CONFIG.oauth.name);
      
      // Authorized redirect URIs 추가
      for (let i = 0; i < CONFIG.oauth.redirectUris.length; i++) {
        if (i > 0) {
          await this.page.click('text=URI 추가');
        }
        await this.page.fill(`input[name="redirectUris[${i}]"]`, CONFIG.oauth.redirectUris[i]);
      }
      
      // 생성 버튼 클릭
      await this.page.click('text=만들기');
      await this.page.waitForTimeout(3000);
      
      // 생성된 클라이언트 ID와 시크릿 복사
      try {
        await this.page.waitForSelector('text=OAuth 클라이언트가 생성되었습니다', { timeout: 10000 });
        
        // 클라이언트 ID 복사
        const clientIdElement = await this.page.$('input[readonly]:nth-of-type(1)');
        if (clientIdElement) {
          this.results.clientId = await clientIdElement.inputValue();
        }
        
        // 클라이언트 시크릿 복사
        const clientSecretElement = await this.page.$('input[readonly]:nth-of-type(2)');
        if (clientSecretElement) {
          this.results.clientSecret = await clientSecretElement.inputValue();
        }
        
        console.log('✅ OAuth 클라이언트 ID 생성 완료!');
        console.log(`🔑 Client ID: ${this.results.clientId?.substring(0, 20)}...`);
        console.log(`🔐 Client Secret: ${this.results.clientSecret?.substring(0, 10)}...`);
        
        // 다운로드 버튼 클릭 (JSON 파일)
        await this.page.click('text=JSON 다운로드');
        
      } catch (error) {
        console.log('⚠️ OAuth 정보 수동 복사 필요');
      }
      
    } catch (error) {
      console.log('⚠️ OAuth 생성 수동 진행 필요:', error.message);
    }
  }

  async requestDeveloperToken() {
    console.log('🎫 Google Ads Developer Token 신청 중...');
    
    await this.page.goto('https://ads.google.com/');
    await this.page.waitForTimeout(3000);
    
    try {
      // 도구 및 설정 메뉴 찾기
      const toolsButton = await this.page.$('text=도구');
      if (toolsButton) {
        await toolsButton.click();
        await this.page.waitForTimeout(1000);
        
        // API 센터 클릭
        await this.page.click('text=API 센터');
        await this.page.waitForTimeout(3000);
        
        // Developer Token 섹션 찾기
        const tokenSection = await this.page.$('text=Developer token');
        if (tokenSection) {
          // 토큰 요청 또는 기존 토큰 확인
          const requestButton = await this.page.$('text=토큰 요청');
          if (requestButton) {
            await requestButton.click();
            console.log('📝 Developer Token 신청 완료! (승인까지 1-2일 소요)');
          } else {
            // 기존 토큰 있는지 확인
            const tokenValue = await this.page.$eval('code', el => el.textContent).catch(() => null);
            if (tokenValue) {
              this.results.developerToken = tokenValue;
              console.log(`✅ 기존 Developer Token 확인: ${tokenValue.substring(0, 10)}...`);
            }
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Developer Token 수동 확인 필요:', error.message);
    }
  }

  async generateRefreshToken() {
    console.log('🔄 Refresh Token 생성 중...');
    
    if (!this.results.clientId || !this.results.clientSecret) {
      console.log('❌ Client ID 또는 Client Secret이 없어 Refresh Token 생성 불가');
      return;
    }
    
    await this.page.goto('https://developers.google.com/oauthplayground/');
    await this.page.waitForTimeout(2000);
    
    try {
      // Settings 클릭
      await this.page.click('button[aria-label="Settings"]');
      await this.page.waitForTimeout(1000);
      
      // Use your own OAuth credentials 체크
      await this.page.check('input[type="checkbox"]');
      
      // Client ID와 Secret 입력
      await this.page.fill('input[placeholder="OAuth Client ID"]', this.results.clientId);
      await this.page.fill('input[placeholder="OAuth Client secret"]', this.results.clientSecret);
      
      // Close settings
      await this.page.click('button[aria-label="Close"]');
      
      // Scope 입력
      await this.page.fill('input[placeholder="Input your own scopes"]', 'https://www.googleapis.com/auth/adwords');
      await this.page.click('text=Authorize APIs');
      
      // Google 인증 페이지에서 승인 (자동으로 진행)
      await this.page.waitForTimeout(5000);
      
      // Exchange authorization code for tokens
      await this.page.click('text=Exchange authorization code for tokens');
      await this.page.waitForTimeout(3000);
      
      // Refresh token 복사
      const refreshTokenElement = await this.page.$('textarea[placeholder*="refresh_token"]');
      if (refreshTokenElement) {
        this.results.refreshToken = await refreshTokenElement.inputValue();
        console.log(`✅ Refresh Token 생성 완료: ${this.results.refreshToken.substring(0, 20)}...`);
      }
      
    } catch (error) {
      console.log('⚠️ Refresh Token 수동 생성 필요:', error.message);
    }
  }

  async saveResults() {
    console.log('💾 설정 결과 저장 중...');
    
    // .env.local에 추가할 내용 생성
    const envContent = `
# Google Ads API 설정 (Playwright 자동 생성)
GOOGLE_ADS_CLIENT_ID=${this.results.clientId || 'MANUAL_INPUT_REQUIRED'}
GOOGLE_ADS_CLIENT_SECRET=${this.results.clientSecret || 'MANUAL_INPUT_REQUIRED'}
GOOGLE_ADS_DEVELOPER_TOKEN=${this.results.developerToken || 'PENDING_APPROVAL'}
GOOGLE_ADS_REFRESH_TOKEN=${this.results.refreshToken || 'MANUAL_INPUT_REQUIRED'}
`;

    // .env.local 파일에 추가
    const envPath = path.join(process.cwd(), '.env.local');
    fs.appendFileSync(envPath, envContent);
    
    // 결과 JSON 파일 저장
    const resultPath = path.join(process.cwd(), 'google-ads-api-setup-results.json');
    fs.writeFileSync(resultPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      results: this.results,
      status: {
        clientId: this.results.clientId ? '✅ 완료' : '❌ 수동 입력 필요',
        clientSecret: this.results.clientSecret ? '✅ 완료' : '❌ 수동 입력 필요',
        developerToken: this.results.developerToken ? '✅ 완료' : '⏳ 승인 대기',
        refreshToken: this.results.refreshToken ? '✅ 완료' : '❌ 수동 입력 필요'
      }
    }, null, 2));
    
    console.log(`📄 결과 저장 완료: ${resultPath}`);
  }

  async displayResults() {
    console.log('\n🎉 Google Ads API 설정 완료!\n');
    console.log('📋 설정 결과:');
    console.log('─'.repeat(50));
    console.log(`Client ID: ${this.results.clientId ? '✅ 생성 완료' : '❌ 수동 입력 필요'}`);
    console.log(`Client Secret: ${this.results.clientSecret ? '✅ 생성 완료' : '❌ 수동 입력 필요'}`);
    console.log(`Developer Token: ${this.results.developerToken ? '✅ 확인 완료' : '⏳ 승인 대기 (1-2일)'}`);
    console.log(`Refresh Token: ${this.results.refreshToken ? '✅ 생성 완료' : '❌ 수동 입력 필요'}`);
    console.log('─'.repeat(50));
    
    if (this.results.clientId && this.results.clientSecret && this.results.refreshToken) {
      console.log('🎯 다음 단계:');
      console.log('1. Developer Token 승인 대기 (Google Ads에서 확인)');
      console.log('2. 승인 완료 후 .env.local에서 PENDING_APPROVAL을 실제 토큰으로 교체');
      console.log('3. npm run dev로 테스트');
    } else {
      console.log('⚠️  수동 완료 필요한 항목들이 있습니다.');
      console.log('📖 자세한 가이드: docs/GOOGLE_ADS_API_SETUP_GUIDE.md');
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.init();
      await this.loginToGoogle();
      await this.setupGoogleCloudProject();
      await this.enableGoogleAdsAPI();
      await this.createOAuthCredentials();
      await this.requestDeveloperToken();
      await this.generateRefreshToken();
      await this.saveResults();
      await this.displayResults();
    } catch (error) {
      console.error('❌ 오류 발생:', error.message);
      console.log('🔄 일부 단계는 수동으로 진행해야 할 수 있습니다.');
    } finally {
      await this.cleanup();
    }
  }
}

// 실행
if (require.main === module) {
  const setup = new GoogleAdsAPISetup();
  setup.run().catch(console.error);
}

module.exports = GoogleAdsAPISetup;