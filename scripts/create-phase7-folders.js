/**
 * Phase 7-3 폴더 구조 생성 스크립트
 * 
 * 실행 방법:
 * node scripts/create-phase7-folders.js
 */

const https = require('https');
const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:3000/api/admin/create-phase7-folders';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = client.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function main() {
  console.log('🚀 Phase 7-3 폴더 구조 생성 시작...\n');
  console.log(`📡 API URL: ${API_URL}\n`);

  try {
    const response = await makeRequest(API_URL);

    if (response.status === 200) {
      console.log('✅ 성공!\n');
      console.log('📋 결과:');
      console.log(JSON.stringify(response.data, null, 2));

      if (response.data.results) {
        console.log('\n📁 생성된 폴더:');
        response.data.results.forEach((result) => {
          const icon = result.status === 'created' ? '✅' : 'ℹ️';
          console.log(`  ${icon} ${result.folder} - ${result.message}`);
        });
      }

      if (response.data.verification) {
        console.log('\n🔍 폴더 검증 결과:');
        response.data.verification.forEach((verify) => {
          const icon = verify.exists ? '✅' : '❌';
          console.log(`  ${icon} ${verify.folder} - ${verify.exists ? '존재함' : '없음'}`);
          if (verify.fileCount !== undefined) {
            console.log(`     파일 수: ${verify.fileCount}`);
          }
        });
      }

      if (response.data.errors && response.data.errors.length > 0) {
        console.log('\n⚠️ 오류:');
        response.data.errors.forEach((error) => {
          console.log(`  ❌ ${error.folder}: ${error.error}`);
        });
      }
    } else {
      console.error('❌ 실패!');
      console.error(`상태 코드: ${response.status}`);
      console.error('응답:', response.data);
    }
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('\n💡 개발 서버가 실행 중인지 확인하세요:');
    console.error('   npm run dev');
  }
}

main();

