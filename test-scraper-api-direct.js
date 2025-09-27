const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testScraperAPI() {
  console.log('🚀 웹페이지 스크래퍼 API 직접 테스트 시작...');
  
  const testUrls = [
    {
      name: '네이버 블로그 (실패 예상)',
      url: 'https://blog.naver.com/massgoogolf/223958579134',
      expectedResult: 'fail'
    },
    {
      name: '골프 디스틸러리 (실패 예상)', 
      url: 'https://www.golfdistillery.com/swing-tips/setup-address/ball-position/',
      expectedResult: 'fail'
    },
    {
      name: '네이버 뉴스 (성공 예상)',
      url: 'https://n.news.naver.com/article/050/0000096697',
      expectedResult: 'success'
    }
  ];
  
  for (const testCase of testUrls) {
    console.log(`\n🔍 테스트: ${testCase.name}`);
    console.log(`📄 URL: ${testCase.url}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/admin/scrape-webpage-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webpageUrl: testCase.url,
          options: {
            minWidth: 100,
            minHeight: 100,
            allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            excludeExternal: false
          }
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log(`✅ 성공: ${result.totalImages}개의 이미지 발견`);
        console.log(`📝 메시지: ${result.message}`);
        
        if (result.images && result.images.length > 0) {
          console.log('🖼️ 발견된 이미지들:');
          result.images.slice(0, 3).forEach((img, index) => {
            console.log(`  ${index + 1}. ${img.fileName} (${img.fileExtension}) - ${img.src.substring(0, 80)}...`);
          });
          if (result.images.length > 3) {
            console.log(`  ... 및 ${result.images.length - 3}개 더`);
          }
        }
        
        if (testCase.expectedResult === 'success') {
          console.log('✅ 예상 결과와 일치: 성공');
        } else {
          console.log('⚠️ 예상과 다름: 실패 예상이었지만 성공');
        }
        
      } else {
        console.log(`❌ 실패: ${result.error || '알 수 없는 오류'}`);
        if (result.details) {
          console.log(`📝 상세 정보: ${result.details}`);
        }
        if (result.originalError) {
          console.log(`🔍 원본 오류: ${result.originalError}`);
        }
        
        if (testCase.expectedResult === 'fail') {
          console.log('✅ 예상 결과와 일치: 실패');
        } else {
          console.log('⚠️ 예상과 다름: 성공 예상이었지만 실패');
        }
      }
      
    } catch (error) {
      console.log(`❌ 네트워크 오류: ${error.message}`);
    }
    
    console.log('─'.repeat(60));
  }
  
  console.log('\n🎉 API 직접 테스트 완료!');
}

testScraperAPI().catch(console.error);
