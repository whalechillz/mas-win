const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testIndividualPostAPI() {
  console.log('🚀 개별 포스트 API 테스트 시작...');
  
  const testUrls = [
    'https://blog.naver.com/massgoogolf/223958579134',
    'https://blog.naver.com/massgoogolf/223996487636',
    'https://blog.naver.com/massgoogolf/223975792658'
  ];
  
  for (const testUrl of testUrls) {
    console.log(`\n🔍 테스트 URL: ${testUrl}`);
    
    try {
      const response = await fetch('http://localhost:3001/api/admin/naver-blog-scraper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postUrls: [testUrl],
          options: {
            includeImages: true,
            includeContent: true
          }
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log(`✅ 성공: ${result.successfulPosts}개 포스트 성공, ${result.failedPosts}개 실패`);
        
        if (result.posts && result.posts.length > 0) {
          const post = result.posts[0];
          console.log(`📄 포스트 정보:`);
          console.log(`  제목: ${post.title || '제목 없음'}`);
          console.log(`  URL: ${post.originalUrl}`);
          console.log(`  발행일: ${post.publishDate || '날짜 없음'}`);
          console.log(`  이미지 수: ${post.images ? post.images.length : 0}개`);
          if (post.error) {
            console.log(`  오류: ${post.error}`);
          }
        }
        
      } else {
        console.log(`❌ 실패: ${result.error || '알 수 없는 오류'}`);
        if (result.details) {
          console.log(`📝 상세 정보: ${result.details}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ 네트워크 오류: ${error.message}`);
    }
    
    console.log('─'.repeat(60));
    
    // 요청 간격을 두어 429 오류 방지
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log('\n🎉 개별 포스트 API 테스트 완료!');
}

testIndividualPostAPI().catch(console.error);
