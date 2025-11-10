// ID 88 게시물의 본문 내용 확인
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkContent() {
  try {
    console.log('🔍 ID 88 게시물의 본문 내용 확인...\n');

    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('id, title, content, featured_image')
      .eq('id', 88)
      .single();

    if (postError || !post) {
      console.error('❌ 게시물을 찾을 수 없습니다:', postError?.message);
      return;
    }

    console.log(`📝 게시물: ${post.title}\n`);

    // featured_image 확인
    console.log('📸 Featured Image:');
    console.log(`  ${post.featured_image || '(없음)'}\n`);

    // content에서 이미지 URL 추출 및 표시
    console.log('📝 Content에서 이미지 URL 추출:\n');
    
    if (post.content) {
      // HTML img 태그
      const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
      const imgMatches = [...post.content.matchAll(imgRegex)];
      
      if (imgMatches.length > 0) {
        console.log('HTML img 태그:');
        imgMatches.forEach((match, i) => {
          console.log(`  ${i + 1}. ${match[1]}`);
        });
        console.log('');
      }
      
      // 마크다운 이미지
      const markdownImgRegex = /!\[.*?\]\(([^)]+)\)/gi;
      const markdownMatches = [...post.content.matchAll(markdownImgRegex)];
      
      if (markdownMatches.length > 0) {
        console.log('마크다운 이미지:');
        markdownMatches.forEach((match, i) => {
          console.log(`  ${i + 1}. ${match[1]}`);
        });
        console.log('');
      }
      
      // 전체 content 일부 표시 (이미지 URL 주변)
      console.log('📄 Content 일부 (이미지 URL 주변):');
      const contentLines = post.content.split('\n');
      let foundImageContext = false;
      
      for (let i = 0; i < contentLines.length; i++) {
        const line = contentLines[i];
        if (line.includes('campaigns') || line.includes('img') || line.includes('![')) {
          foundImageContext = true;
          // 앞뒤 2줄씩 표시
          const start = Math.max(0, i - 2);
          const end = Math.min(contentLines.length, i + 3);
          for (let j = start; j < end; j++) {
            console.log(`  ${j + 1}: ${contentLines[j]}`);
          }
          console.log('');
        }
      }
      
      if (!foundImageContext) {
        console.log('  (이미지 URL 주변 컨텍스트를 찾을 수 없음)');
        console.log('  Content 처음 500자:');
        console.log(`  ${post.content.substring(0, 500)}...`);
      }
    } else {
      console.log('  Content가 비어있습니다.');
    }

    console.log('\n✅ 확인 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkContent().catch(console.error);

