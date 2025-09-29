// Kie AI 이미지 생성 테스트
const https = require('https');
const http = require('http');

// 간단한 fetch 함수 구현
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

async function testKieAI() {
  console.log('🧪 Kie AI 이미지 생성 테스트 시작...');
  
  try {
    // 1. 프롬프트 미리보기 테스트
    console.log('\n1️⃣ ChatGPT 프롬프트 생성 테스트...');
    const promptResponse = await fetch('http://localhost:3000/api/generate-smart-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title: '60대 시니어 골퍼의 비거리 25m 향상 비법',
        excerpt: '나이 들어도 골프 실력을 향상시킬 수 있는 방법들을 소개합니다.',
        contentType: 'information',
        brandStrategy: {
          customerPersona: 'competitive_maintainer',
          customerChannel: 'local_customers',
          brandWeight: 'medium'
        },
        model: 'kie'
      })
    });

    if (promptResponse.ok) {
      const { prompt } = await promptResponse.json();
      console.log('✅ 프롬프트 생성 성공:', prompt);
    } else {
      console.error('❌ 프롬프트 생성 실패:', await promptResponse.text());
      return;
    }

    // 2. Kie AI 이미지 생성 테스트
    console.log('\n2️⃣ Kie AI 이미지 생성 테스트...');
    const imageResponse = await fetch('http://localhost:3000/api/generate-blog-image-kie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title: '60대 시니어 골퍼의 비거리 25m 향상 비법',
        excerpt: '나이 들어도 골프 실력을 향상시킬 수 있는 방법들을 소개합니다.',
        contentType: 'information',
        brandStrategy: {
          customerPersona: 'competitive_maintainer',
          customerChannel: 'local_customers',
          brandWeight: 'medium'
        },
        imageCount: 2
      })
    });

    if (imageResponse.ok) {
      const result = await imageResponse.json();
      console.log('✅ Kie AI 이미지 생성 성공!');
      console.log('생성된 이미지 수:', result.imageCount);
      console.log('이미지 URL들:', result.imageUrls);
      console.log('사용된 모델:', result.model);
    } else {
      const error = await imageResponse.json();
      console.error('❌ Kie AI 이미지 생성 실패:', error);
    }

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
  }
}

// 테스트 실행
testKieAI();
