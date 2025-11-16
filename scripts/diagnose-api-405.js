#!/usr/bin/env node
/**
 * API 405 에러 진단 스크립트
 * 배포된 환경에서 실제 API 경로가 어떻게 라우팅되는지 확인
 */

const https = require('https');
const http = require('http');

const API_URL = 'https://www.masgolf.co.kr/api/generate-paragraph-images-with-prompts';
const TEST_PATHS = [
  '/api/generate-paragraph-images-with-prompts',
  '/ko/api/generate-paragraph-images-with-prompts',
  '/ja/api/generate-paragraph-images-with-prompts',
];

function makeRequest(url, method = 'OPTIONS') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'User-Agent': 'API-405-Diagnostic-Script',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function diagnose() {
  console.log('🔍 API 405 에러 진단 시작...\n');
  console.log('='.repeat(80));
  
  for (const path of TEST_PATHS) {
    const fullUrl = `https://www.masgolf.co.kr${path}`;
    console.log(`\n📡 테스트: ${fullUrl}`);
    console.log('-'.repeat(80));
    
    try {
      const response = await makeRequest(fullUrl, 'OPTIONS');
      
      console.log(`✅ 상태 코드: ${response.statusCode}`);
      console.log('\n📋 응답 헤더:');
      
      // 중요한 헤더만 출력
      const importantHeaders = [
        'x-matched-path',
        'x-vercel-id',
        'x-vercel-cache',
        'content-type',
        'access-control-allow-methods',
        'access-control-allow-origin',
        'location',
      ];
      
      for (const headerName of importantHeaders) {
        const value = response.headers[headerName.toLowerCase()];
        if (value) {
          console.log(`  ${headerName}: ${value}`);
        }
      }
      
      // 모든 헤더 출력 (디버깅용)
      console.log('\n📋 모든 응답 헤더:');
      Object.entries(response.headers).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
      
      if (response.statusCode === 405) {
        console.log('\n❌ HTTP 405 에러 발생!');
        if (response.headers['x-matched-path']) {
          console.log(`⚠️  x-matched-path: ${response.headers['x-matched-path']}`);
          console.log('   → Next.js가 이 경로를 페이지 경로로 해석했습니다.');
        }
      } else if (response.statusCode === 200) {
        console.log('\n✅ 정상 응답!');
      }
      
    } catch (error) {
      console.log(`\n❌ 에러 발생: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(80));
  }
  
  // POST 요청도 테스트
  console.log('\n\n📡 POST 요청 테스트 (실제 API 호출 시뮬레이션)');
  console.log('='.repeat(80));
  
  try {
    const postUrl = 'https://www.masgolf.co.kr/api/generate-paragraph-images-with-prompts';
    const response = await makeRequest(postUrl, 'POST');
    
    console.log(`✅ 상태 코드: ${response.statusCode}`);
    console.log('\n📋 응답 헤더:');
    Object.entries(response.headers).forEach(([key, value]) => {
      if (key.startsWith('x-') || key.includes('matched') || key.includes('vercel')) {
        console.log(`  ${key}: ${value}`);
      }
    });
    
    if (response.statusCode === 405) {
      console.log('\n❌ HTTP 405 에러 발생!');
    }
  } catch (error) {
    console.log(`\n❌ 에러 발생: ${error.message}`);
  }
  
  console.log('\n\n💡 진단 완료!');
  console.log('\n📝 확인 사항:');
  console.log('  1. x-matched-path 헤더가 있는지 확인');
  console.log('  2. x-matched-path 값이 /ko/500 또는 다른 페이지 경로인지 확인');
  console.log('  3. Vercel Functions 탭에서 해당 API가 등록되어 있는지 확인');
  console.log('  4. Vercel 배포 로그에서 API 파일이 빌드되었는지 확인');
}

diagnose().catch(console.error);

