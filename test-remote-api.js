const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testRemoteAPI() {
  console.log('🚀 원격 네이버 블로그 스크래퍼 API 테스트 시작...');
  
  const testCases = [
    {
      name: '원격 블로그 ID 테스트',
      requestBody: {
        blogId: 'massgoogolf',
        options: {
          includeImages: true,
          includeContent: true
        }
      }
    },
    {
      name: '원격 URL 직접 입력 테스트',
      requestBody: {
        postUrls: [
          'https://blog.naver.com/massgoogolf/223958579134'
        ],
        options: {
          includeImages: true,
          includeContent: true
        }
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n🔍 테스트: ${testCase.name}`);
    
    try {
      const response = await fetch('https://masgolf.co.kr/api/admin/naver-blog-scraper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.requestBody)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log(`✅ 성공: ${result.successfulPosts}개 포스트 성공, ${result.failedPosts}개 실패`);
        console.log(`📝 메시지: ${result.message}`);
        
        if (result.posts && result.posts.length > 0) {
          console.log('📄 스크래핑된 포스트들:');
          result.posts.slice(0, 3).forEach((post, index) => {
            console.log(`  ${index + 1}. ${post.title || '제목 없음'}`);
            console.log(`     URL: ${post.originalUrl}`);
            if (post.images && post.images.length > 0) {
              console.log(`     이미지: ${post.images.length}개`);
            }
            if (post.error) {
              console.log(`     오류: ${post.error}`);
            }
          });
          if (result.posts.length > 3) {
            console.log(`  ... 및 ${result.posts.length - 3}개 더`);
          }
        }
        
      } else {
        console.log(`❌ 실패: ${result.error || '알 수 없는 오류'}`);
        if (result.details) {
          console.log(`📝 상세 정보: ${result.details}`);
        }
        if (result.originalError) {
          console.log(`🔍 원본 오류: ${result.originalError}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ 네트워크 오류: ${error.message}`);
    }
    
    console.log('─'.repeat(60));
  }
  
  console.log('\n🎉 원격 API 테스트 완료!');
}

testRemoteAPI().catch(console.error);
