/**
 * 강석 글(ID 123)의 현재 이미지 URL 확인 스크립트
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

async function checkKangSeokPostImages() {
  try {
    console.log('🔍 강석 글(ID 123)의 이미지 URL 확인 중...\n');
    
    // 1. 강석 글 조회
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('id, title, content, featured_image')
      .eq('id', 123)
      .single();
    
    if (error || !post) {
      console.error('❌ 강석 글을 찾을 수 없습니다:', error);
      return;
    }
    
    console.log(`📝 글 제목: ${post.title}`);
    console.log(`📎 글 ID: ${post.id}\n`);
    
    // 2. content에서 이미지 URL 추출
    const imageUrls = [];
    
    if (post.content) {
      // HTML img 태그
      const htmlImgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
      let match;
      while ((match = htmlImgRegex.exec(post.content)) !== null) {
        const url = match[1].trim();
        if (url && !imageUrls.find(img => img.url === url)) {
          imageUrls.push({
            url: url,
            type: 'HTML',
            fileName: url.split('/').pop()
          });
        }
      }
      
      // 마크다운 이미지
      const markdownImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/gi;
      while ((match = markdownImgRegex.exec(post.content)) !== null) {
        const url = match[2].trim();
        const alt = match[1].trim();
        if (url && !imageUrls.find(img => img.url === url)) {
          imageUrls.push({
            url: url,
            type: 'Markdown',
            alt: alt,
            fileName: url.split('/').pop()
          });
        }
      }
    }
    
    console.log(`📊 추출된 이미지 URL: ${imageUrls.length}개\n`);
    
    // 3. 이미지 URL별 카운트
    const urlCounts = {};
    imageUrls.forEach(img => {
      const fileName = img.fileName;
      if (!urlCounts[fileName]) {
        urlCounts[fileName] = {
          url: img.url,
          count: 0,
          types: []
        };
      }
      urlCounts[fileName].count++;
      urlCounts[fileName].types.push(img.type);
    });
    
    console.log('📋 이미지별 사용 횟수:');
    console.log('='.repeat(60));
    Object.entries(urlCounts).forEach(([fileName, info]) => {
      console.log(`\n${fileName}`);
      console.log(`  URL: ${info.url}`);
      console.log(`  사용 횟수: ${info.count}번`);
      console.log(`  타입: ${info.types.join(', ')}`);
    });
    
    // 4. 예상 이미지 목록과 비교
    console.log('\n\n📋 예상 보존 이미지 목록:');
    console.log('='.repeat(60));
    const expectedImages = [
      'complete-migration-1757771589208-3.webp',
      'complete-migration-1757771590044-5.webp',
      'complete-migration-1757771590842-7.webp',
      'complete-migration-1757771591887-9.webp',
      'complete-migration-1757771592666-11.webp'
    ];
    
    expectedImages.forEach(fileName => {
      const found = urlCounts[fileName];
      if (found) {
        console.log(`✅ ${fileName} - ${found.count}번 사용됨`);
      } else {
        console.log(`❌ ${fileName} - 없음`);
      }
    });
    
    // 5. 삭제된 이미지가 여전히 있는지 확인
    console.log('\n\n📋 삭제되어야 할 이미지 확인:');
    console.log('='.repeat(60));
    const deletedImages = [
      'complete-migration-1757771589662-4.webp',
      'complete-migration-1757771590440-6.webp',
      'complete-migration-1757771591360-8.webp',
      'complete-migration-1757771592268-10.webp',
      'complete-migration-1757771593103-12.webp'
    ];
    
    deletedImages.forEach(fileName => {
      const found = urlCounts[fileName];
      if (found) {
        console.log(`⚠️ ${fileName} - 여전히 ${found.count}번 사용됨 (삭제 필요)`);
      } else {
        console.log(`✅ ${fileName} - 정상적으로 제거됨`);
      }
    });
    
    // 6. content 일부 출력
    console.log('\n\n📄 Content 일부 (이미지 부분):');
    console.log('='.repeat(60));
    const imageSection = post.content.match(/!\[.*?\]\([^)]+\)/g);
    if (imageSection) {
      imageSection.forEach((img, idx) => {
        console.log(`${idx + 1}. ${img.substring(0, 100)}...`);
      });
    }
    
    return {
      post,
      imageUrls,
      urlCounts,
      expectedImages,
      deletedImages
    };
    
  } catch (error) {
    console.error('❌ 확인 실패:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  checkKangSeokPostImages()
    .then(() => {
      console.log('\n✅ 확인 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { checkKangSeokPostImages };

