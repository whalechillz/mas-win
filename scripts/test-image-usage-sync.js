const https = require('https');
const http = require('http');

function fetch(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(JSON.parse(data))
          });
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// 테스트할 이미지 URL (golfer_avatar_512x512_02.jpg)
const testImageUrl = 'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/originals/campaigns/2025-05/842b4045-55b3-4e81-940d-245b51e0801b-golferavatar512x51202.jpg';

async function testImageUsage() {
  try {
    console.log('🔍 이미지 사용 현황 확인 중...');
    console.log(`이미지: ${testImageUrl}\n`);
    
    const response = await fetch(
      `http://localhost:3000/api/admin/image-usage-tracker?imageUrl=${encodeURIComponent(testImageUrl)}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ 사용 현황 결과:');
    console.log(`   총 사용 횟수: ${data.summary.totalUsage}회`);
    console.log(`   블로그: ${data.summary.blogPosts}개`);
    console.log(`   퍼널: ${data.summary.funnelPages}개`);
    console.log(`   정적 페이지: ${data.summary.staticPages}개`);
    console.log(`   홈페이지: ${data.summary.homepage}개`);
    console.log(`   MUZIIK: ${data.summary.muziik}개`);
    
    console.log('\n📋 상세 사용 위치:');
    if (data.usage.used_in && data.usage.used_in.length > 0) {
      data.usage.used_in.forEach((usage, idx) => {
        console.log(`   ${idx + 1}. ${usage.type}: ${usage.title} (${usage.url})`);
        if (usage.source === 'html_file') {
          console.log(`      → HTML 파일: ${usage.htmlFile}`);
        }
      });
    } else {
      console.log('   사용 위치 없음');
    }
    
    // 퍼널 페이지 확인
    if (data.usage.funnelPages && data.usage.funnelPages.length > 0) {
      console.log('\n🎯 퍼널 페이지 상세:');
      data.usage.funnelPages.forEach((page, idx) => {
        console.log(`   ${idx + 1}. ${page.title} (${page.url})`);
        if (page.source === 'html_file') {
          console.log(`      → HTML 파일: ${page.htmlFile}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

testImageUsage();







