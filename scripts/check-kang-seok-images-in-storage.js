/**
 * 강석 글의 이미지가 Storage에 실제로 존재하는지 확인
 */

require('dotenv').config({ path: require('path').join(process.cwd(), '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkKangSeokImagesInStorage() {
  try {
    console.log('🔍 강석 글(ID 123)의 이미지 Storage 확인 중...\n');
    
    // 1. 강석 글 조회
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('id, title, content')
      .eq('id', 123)
      .single();
    
    if (error || !post) {
      console.error('❌ 강석 글을 찾을 수 없습니다:', error);
      return;
    }
    
    // 2. content에서 이미지 URL 추출
    const imageUrls = [];
    if (post.content) {
      const markdownImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/gi;
      let match;
      while ((match = markdownImgRegex.exec(post.content)) !== null) {
        const url = match[2].trim();
        const alt = match[1].trim();
        if (url && !imageUrls.find(img => img.url === url)) {
          imageUrls.push({ url, alt });
        }
      }
    }
    
    console.log(`📊 확인할 이미지: ${imageUrls.length}개\n`);
    console.log('='.repeat(80));
    
    // 3. 각 이미지 파일이 Storage에 있는지 확인
    for (let i = 0; i < imageUrls.length; i++) {
      const img = imageUrls[i];
      const fileName = img.url.split('/').pop();
      const path = `blog-images/${fileName}`;
      
      console.log(`\n${i + 1}. [${img.alt}]`);
      console.log(`   파일명: ${fileName}`);
      console.log(`   경로: ${path}`);
      console.log(`   URL: ${img.url}`);
      
      // Storage에서 파일 확인
      const { data: fileData, error: fileError } = await supabase
        .storage
        .from('blog-images')
        .list('', {
          search: fileName
        });
      
      if (fileError) {
        console.log(`   ❌ Storage 조회 오류: ${fileError.message}`);
      } else if (fileData && fileData.length > 0) {
        const file = fileData.find(f => f.name === fileName);
        if (file) {
          console.log(`   ✅ Storage에 존재함`);
          console.log(`   크기: ${file.metadata?.size || file.metadata?.size || '알 수 없음'} bytes`);
          console.log(`   수정일: ${file.updated_at || file.created_at || '알 수 없음'}`);
        } else {
          console.log(`   ❌ Storage에 파일 없음`);
        }
      } else {
        console.log(`   ❌ Storage에 파일 없음`);
      }
      
      // HTTP 요청으로 파일 접근 가능한지 확인
      try {
        const response = await fetch(img.url, { method: 'HEAD' });
        if (response.ok) {
          console.log(`   ✅ HTTP 접근 가능 (${response.status})`);
          const contentType = response.headers.get('content-type');
          const contentLength = response.headers.get('content-length');
          console.log(`   Content-Type: ${contentType || '알 수 없음'}`);
          console.log(`   Content-Length: ${contentLength || '알 수 없음'} bytes`);
        } else {
          console.log(`   ❌ HTTP 접근 불가 (${response.status})`);
        }
      } catch (fetchError) {
        console.log(`   ❌ HTTP 요청 실패: ${fetchError.message}`);
      }
    }
    
    return {
      post,
      imageUrls
    };
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  checkKangSeokImagesInStorage()
    .then(() => {
      console.log('\n\n✅ 확인 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { checkKangSeokImagesInStorage };

