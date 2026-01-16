/**
 * 동영상 변환 API 직접 테스트 스크립트
 * Playwright 없이 API를 직접 호출하여 ffmpeg 오류를 재현
 */

const https = require('https');
const http = require('http');

// 테스트할 동영상 URL (실제 Supabase URL로 변경 필요)
const TEST_VIDEO_URL = 'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/originals/customers/joseotdae-7010/2023-06-20/joseotdae_s3_swing-video_01.mp4';
const TEST_FOLDER_PATH = 'originals/customers/joseotdae-7010/2023-06-20';
const TEST_FILE_NAME = 'joseotdae_s3_swing-video_01.mp4';

console.log('🎬 동영상 변환 API 직접 테스트 시작...\n');

// 1. GIF 변환 테스트
async function testGifConversion() {
  console.log('1️⃣ GIF 변환 API 테스트...');
  
  const testData = {
    videoUrl: TEST_VIDEO_URL,
    folderPath: TEST_FOLDER_PATH,
    fileName: TEST_FILE_NAME,
    fps: 10,
    duration: 5,
    width: 320
  };
  
  console.log('   📤 요청 데이터:', JSON.stringify(testData, null, 2));
  
  try {
    const response = await fetch('http://localhost:3000/api/admin/convert-video-to-gif', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const responseText = await response.text();
    console.log(`   📥 응답 상태: ${response.status} ${response.statusText}`);
    console.log(`   📥 응답 본문: ${responseText.substring(0, 1000)}`);
    
    if (response.status >= 400) {
      try {
        const errorJson = JSON.parse(responseText);
        console.log('   ❌ 에러 상세:', JSON.stringify(errorJson, null, 2));
        
        if (errorJson.error && errorJson.error.includes('ffmpeg')) {
          console.log('   🔍 원인: ffmpeg가 설치되어 있지 않거나 PATH에 없습니다.');
        }
        if (errorJson.isVercel) {
          console.log('   🔍 원인: Vercel 환경에서는 ffmpeg를 사용할 수 없습니다.');
        }
      } catch (e) {
        console.log('   ⚠️ JSON 파싱 실패:', e.message);
      }
    }
    
    return { success: response.ok, status: response.status, body: responseText };
  } catch (error) {
    console.error('   ❌ 요청 실패:', error.message);
    return { success: false, error: error.message };
  }
}

// 2. 압축 테스트
async function testCompression() {
  console.log('\n2️⃣ 동영상 압축 API 테스트...');
  
  const testData = {
    videoUrl: TEST_VIDEO_URL,
    folderPath: TEST_FOLDER_PATH,
    fileName: TEST_FILE_NAME,
    crf: 23
  };
  
  console.log('   📤 요청 데이터:', JSON.stringify(testData, null, 2));
  
  try {
    const response = await fetch('http://localhost:3000/api/admin/compress-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const responseText = await response.text();
    console.log(`   📥 응답 상태: ${response.status} ${response.statusText}`);
    console.log(`   📥 응답 본문: ${responseText.substring(0, 1000)}`);
    
    if (response.status >= 400) {
      try {
        const errorJson = JSON.parse(responseText);
        console.log('   ❌ 에러 상세:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.log('   ⚠️ JSON 파싱 실패:', e.message);
      }
    }
    
    return { success: response.ok, status: response.status, body: responseText };
  } catch (error) {
    console.error('   ❌ 요청 실패:', error.message);
    return { success: false, error: error.message };
  }
}

// 3. 구간 추출 테스트
async function testSegmentExtraction() {
  console.log('\n3️⃣ 동영상 구간 추출 API 테스트...');
  
  const testData = {
    videoUrl: TEST_VIDEO_URL,
    folderPath: TEST_FOLDER_PATH,
    fileName: TEST_FILE_NAME,
    startTime: 0,
    duration: 5
  };
  
  console.log('   📤 요청 데이터:', JSON.stringify(testData, null, 2));
  
  try {
    const response = await fetch('http://localhost:3000/api/admin/extract-video-segment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const responseText = await response.text();
    console.log(`   📥 응답 상태: ${response.status} ${response.statusText}`);
    console.log(`   📥 응답 본문: ${responseText.substring(0, 1000)}`);
    
    if (response.status >= 400) {
      try {
        const errorJson = JSON.parse(responseText);
        console.log('   ❌ 에러 상세:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.log('   ⚠️ JSON 파싱 실패:', e.message);
      }
    }
    
    return { success: response.ok, status: response.status, body: responseText };
  } catch (error) {
    console.error('   ❌ 요청 실패:', error.message);
    return { success: false, error: error.message };
  }
}

// 4. ffmpeg 설치 확인
async function checkFfmpeg() {
  console.log('\n4️⃣ ffmpeg 설치 확인...');
  
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  try {
    const { stdout, stderr } = await execAsync('which ffmpeg');
    console.log('   ✅ ffmpeg 경로:', stdout.trim());
    
    const { stdout: version } = await execAsync('ffmpeg -version | head -1');
    console.log('   ✅ ffmpeg 버전:', version.trim());
    
    return true;
  } catch (error) {
    console.log('   ❌ ffmpeg가 설치되어 있지 않거나 PATH에 없습니다.');
    console.log('   💡 해결 방법:');
    console.log('      - macOS: brew install ffmpeg');
    console.log('      - Ubuntu: sudo apt-get install ffmpeg');
    console.log('      - Windows: https://ffmpeg.org/download.html');
    return false;
  }
}

// 메인 실행
(async () => {
  console.log('🔍 환경 확인...');
  console.log(`   - Node.js 버전: ${process.version}`);
  console.log(`   - 플랫폼: ${process.platform}`);
  console.log(`   - Vercel 환경: ${process.env.VERCEL === '1' ? '예' : '아니오'}`);
  
  // ffmpeg 확인
  const hasFfmpeg = await checkFfmpeg();
  
  if (!hasFfmpeg) {
    console.log('\n⚠️ ffmpeg가 없으면 동영상 변환 기능을 사용할 수 없습니다.');
    console.log('   하지만 API 오류 메시지를 확인하기 위해 테스트를 계속 진행합니다.\n');
  }
  
  // API 테스트 실행
  const results = {
    gif: await testGifConversion(),
    compress: await testCompression(),
    extract: await testSegmentExtraction()
  };
  
  // 결과 요약
  console.log('\n📊 테스트 결과 요약:');
  console.log(`   - GIF 변환: ${results.gif.success ? '✅ 성공' : '❌ 실패'} (${results.gif.status || 'N/A'})`);
  console.log(`   - 압축: ${results.compress.success ? '✅ 성공' : '❌ 실패'} (${results.compress.status || 'N/A'})`);
  console.log(`   - 구간 추출: ${results.extract.success ? '✅ 성공' : '❌ 실패'} (${results.extract.status || 'N/A'})`);
  
  // 공통 오류 패턴 분석
  const allErrors = [results.gif, results.compress, results.extract]
    .filter(r => !r.success && r.body)
    .map(r => r.body);
  
  if (allErrors.length > 0) {
    console.log('\n🔍 공통 오류 패턴 분석:');
    
    const ffmpegErrors = allErrors.filter(e => e.includes('ffmpeg') || e.includes('command not found'));
    if (ffmpegErrors.length > 0) {
      console.log('   ❌ ffmpeg 관련 오류 발견:');
      ffmpegErrors.forEach((error, index) => {
        console.log(`      ${index + 1}. ${error.substring(0, 200)}`);
      });
      console.log('\n   💡 해결 방법:');
      console.log('      1. 로컬 환경: ffmpeg 설치 필요');
      console.log('      2. Vercel 환경: ffmpeg를 사용할 수 없음 (서버리스 제한)');
      console.log('      3. 대안: 클라이언트 사이드 변환 또는 외부 서비스 사용');
    }
    
    const vercelErrors = allErrors.filter(e => e.includes('Vercel') || e.includes('서버리스'));
    if (vercelErrors.length > 0) {
      console.log('   ⚠️ Vercel 환경 제한 발견:');
      console.log('      - Vercel 서버리스 환경에서는 ffmpeg를 실행할 수 없습니다.');
      console.log('      - 대안: 로컬 환경에서만 사용하거나, 외부 API 사용');
    }
  }
  
  console.log('\n✅ 테스트 완료!');
})();
