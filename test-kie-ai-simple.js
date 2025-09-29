// Kie AI API 직접 테스트
const https = require('https');
const http = require('http');

// 간단한 fetch 함수
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: () => Promise.resolve(JSON.parse(data)),
          text: () => Promise.resolve(data)
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testKieAIAPI() {
  console.log('🧪 Kie AI API 직접 테스트 시작...');
  
  try {
    // 1. 로컬 API 테스트
    console.log('1️⃣ 로컬 Kie AI API 테스트...');
    const response = await fetch('http://localhost:3000/api/generate-blog-image-kie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Kie AI 테스트',
        excerpt: '테스트용 게시물',
        contentType: 'information',
        brandStrategy: {
          customerPersona: 'competitive_maintainer',
          customerChannel: 'local_customers',
          brandWeight: 'medium'
        },
        imageCount: 1
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Kie AI API 성공:', result);
    } else {
      const error = await response.text();
      console.log('❌ Kie AI API 실패:', response.status, error);
    }

  } catch (error) {
    console.error('❌ 테스트 중 오류:', error.message);
  }
}

// 테스트 실행
testKieAIAPI();
