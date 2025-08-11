// scripts/manual-google-ads-setup.js
// Playwright가 실패할 경우 수동 설정 가이드

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class ManualSetup {
  constructor() {
    this.results = {};
  }

  async question(prompt) {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  }

  async collectCredentials() {
    console.log('🔧 Google Ads API 수동 설정 도구\n');
    console.log('📖 먼저 다음 단계를 완료해주세요:');
    console.log('1. https://console.cloud.google.com 에서 OAuth 클라이언트 ID 생성');
    console.log('2. https://ads.google.com 에서 Developer Token 신청');
    console.log('3. https://developers.google.com/oauthplayground 에서 Refresh Token 생성\n');

    // Client ID 입력
    this.results.clientId = await this.question('🔑 Google Ads Client ID를 입력하세요: ');
    
    // Client Secret 입력
    this.results.clientSecret = await this.question('🔐 Google Ads Client Secret을 입력하세요: ');
    
    // Developer Token 입력
    console.log('\n💡 Developer Token이 아직 승인되지 않았다면 "PENDING"을 입력하세요.');
    this.results.developerToken = await this.question('🎫 Developer Token을 입력하세요: ');
    
    // Refresh Token 입력
    this.results.refreshToken = await this.question('🔄 Refresh Token을 입력하세요: ');
  }

  async validateInputs() {
    console.log('\n✅ 입력 검증 중...');
    
    const validations = {
      clientId: this.results.clientId?.includes('.apps.googleusercontent.com'),
      clientSecret: this.results.clientSecret?.startsWith('GOCSPX-'),
      developerToken: this.results.developerToken?.length > 0,
      refreshToken: this.results.refreshToken?.startsWith('1//')
    };

    console.log('─'.repeat(40));
    console.log(`Client ID: ${validations.clientId ? '✅ 유효' : '⚠️  형식 확인 필요'}`);
    console.log(`Client Secret: ${validations.clientSecret ? '✅ 유효' : '⚠️  형식 확인 필요'}`);
    console.log(`Developer Token: ${validations.developerToken ? '✅ 입력됨' : '❌ 필수'}`);
    console.log(`Refresh Token: ${validations.refreshToken ? '✅ 유효' : '⚠️  형식 확인 필요'}`);
    console.log('─'.repeat(40));

    const proceed = await this.question('\n계속 진행하시겠습니까? (y/n): ');
    return proceed.toLowerCase() === 'y';
  }

  async saveToEnv() {
    console.log('\n💾 .env.local 파일에 저장 중...');
    
    const envContent = `
# Google Ads API 설정 (수동 입력)
GOOGLE_ADS_CLIENT_ID=${this.results.clientId}
GOOGLE_ADS_CLIENT_SECRET=${this.results.clientSecret}
GOOGLE_ADS_DEVELOPER_TOKEN=${this.results.developerToken}
GOOGLE_ADS_REFRESH_TOKEN=${this.results.refreshToken}
`;

    const envPath = path.join(process.cwd(), '.env.local');
    fs.appendFileSync(envPath, envContent);
    
    console.log('✅ .env.local 파일에 저장 완료!');
  }

  async generateVercelCommands() {
    console.log('\n📤 Vercel 환경변수 설정 명령어:');
    console.log('─'.repeat(50));
    console.log(`vercel env add GOOGLE_ADS_CLIENT_ID`);
    console.log(`# 값: ${this.results.clientId}`);
    console.log('');
    console.log(`vercel env add GOOGLE_ADS_CLIENT_SECRET`);
    console.log(`# 값: ${this.results.clientSecret}`);
    console.log('');
    console.log(`vercel env add GOOGLE_ADS_DEVELOPER_TOKEN`);
    console.log(`# 값: ${this.results.developerToken}`);
    console.log('');
    console.log(`vercel env add GOOGLE_ADS_REFRESH_TOKEN`);
    console.log(`# 값: ${this.results.refreshToken}`);
    console.log('─'.repeat(50));
  }

  async testConnection() {
    console.log('\n🧪 연결 테스트 중...');
    
    try {
      const { spawn } = require('child_process');
      
      // 로컬 서버가 실행 중인지 확인
      const testProcess = spawn('curl', ['-s', 'http://localhost:3000/api/test-google-ads-connection']);
      
      testProcess.stdout.on('data', (data) => {
        try {
          const result = JSON.parse(data.toString());
          console.log('📊 테스트 결과:', result.status);
          console.log(`📈 설정 진행률: ${result.setupProgress}`);
        } catch (error) {
          console.log('⚠️  로컬 서버를 먼저 실행하세요: npm run dev');
        }
      });

      testProcess.on('error', () => {
        console.log('⚠️  연결 테스트 실패 - 로컬 서버를 먼저 실행하세요: npm run dev');
      });

    } catch (error) {
      console.log('⚠️  연결 테스트를 수동으로 실행하세요:');
      console.log('   npm run dev');
      console.log('   curl http://localhost:3000/api/test-google-ads-connection');
    }
  }

  async showNextSteps() {
    console.log('\n🎯 다음 단계:');
    console.log('1. npm run dev 로 로컬 서버 실행');
    console.log('2. http://localhost:3000/api/test-google-ads-connection 에서 연결 확인');
    console.log('3. Developer Token이 승인되면 .env.local에서 업데이트');
    console.log('4. Vercel에 환경변수 설정 (위의 명령어 사용)');
    console.log('5. win.masgolf.co.kr/admin 에서 실시간 데이터 확인\n');
  }

  async run() {
    try {
      await this.collectCredentials();
      
      const isValid = await this.validateInputs();
      if (!isValid) {
        console.log('❌ 설정이 취소되었습니다.');
        return;
      }
      
      await this.saveToEnv();
      await this.generateVercelCommands();
      await this.testConnection();
      await this.showNextSteps();
      
    } catch (error) {
      console.error('❌ 오류 발생:', error.message);
    } finally {
      rl.close();
    }
  }
}

// 실행
if (require.main === module) {
  const setup = new ManualSetup();
  setup.run().catch(console.error);
}

module.exports = ManualSetup;