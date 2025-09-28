const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function updateGoogleVisionKey() {
  console.log('🔑 Google Vision API 키 설정');
  console.log('============================');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  try {
    // API 키 입력 받기
    const apiKey = await new Promise((resolve) => {
      rl.question('생성된 Google Vision API 키를 입력해주세요: ', (answer) => {
        resolve(answer.trim());
      });
    });
    
    if (!apiKey) {
      console.log('❌ API 키가 입력되지 않았습니다.');
      return;
    }
    
    // .env.local 파일 경로
    const envPath = path.join(__dirname, '.env.local');
    let envContent = '';
    
    // 기존 .env.local 파일 읽기
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // 기존 GOOGLE_VISION_API_KEY 라인 제거
    envContent = envContent.replace(/GOOGLE_VISION_API_KEY=.*\n/g, '');
    
    // 새로운 API 키 추가
    envContent += `\n# Google Vision API\nGOOGLE_VISION_API_KEY="${apiKey}"\n`;
    
    // 파일 저장
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env.local 파일 업데이트 완료');
    
    // API 키 테스트
    console.log('📝 API 키 테스트 중...');
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
        console.log('\n🎉 Google Vision API 설정 완료!');
        console.log('============================');
        console.log('📋 설정된 내용:');
        console.log(`🔑 API 키: ${apiKey}`);
        console.log('📁 .env.local 파일 업데이트됨');
        console.log('\n📋 다음 단계:');
        console.log('1. 개발 서버 재시작: npm run dev');
        console.log('2. 이미지 AI 분석 테스트');
        console.log('3. Vercel 배포 시 환경 변수 설정');
      } else {
        console.log('❌ API 키 테스트 실패:', await testResponse.text());
      }
    } catch (error) {
      console.log('⚠️ API 키 테스트 중 오류:', error.message);
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    rl.close();
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
}

// 실행
if (require.main === module) {
  showImportantNotes();
  updateGoogleVisionKey();
}

module.exports = { updateGoogleVisionKey, showImportantNotes };
