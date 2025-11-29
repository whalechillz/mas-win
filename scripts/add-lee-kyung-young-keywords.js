/**
 * 이경영 글의 이미지에 연예인 관련 키워드 추가
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

async function addLeeKyungYoungKeywords(blogPostId) {
  console.log(`🏷️ 블로그 글(ID: ${blogPostId}) 이미지 키워드 추가 시작...\n`);
  console.log('='.repeat(80));
  
  // 추가할 키워드
  const keywordsToAdd = ['이경영', '연예인', '배우', '이경영님'];
  
  // 1. 블로그 글 정보 조회
  const { data: post, error: postError } = await supabase
    .from('blog_posts')
    .select('id, title, featured_image, content')
    .eq('id', blogPostId)
    .single();
  
  if (postError || !post) {
    console.error('❌ 블로그 글을 찾을 수 없습니다:', postError);
    return;
  }
  
  console.log(`📝 블로그 글: ${post.title}\n`);
  
  // 2. 이미지 URL 추출
  const images = [];
  if (post.featured_image) {
    images.push({ url: post.featured_image, type: 'featured', alt: '대표 이미지' });
  }
  
  const contentMatches = [...post.content.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)];
  contentMatches.forEach(m => {
    images.push({ url: m[2], alt: m[1], type: 'content' });
  });
  
  console.log(`📊 발견된 이미지: ${images.length}개\n`);
  
  // 3. 각 이미지의 메타데이터에 키워드 추가
  let updatedCount = 0;
  
  for (const image of images) {
    try {
      // 기존 메타데이터 조회
      const { data: existing, error: fetchError } = await supabase
        .from('image_metadata')
        .select('id, tags')
        .eq('image_url', image.url)
        .single();
      
      if (fetchError || !existing) {
        console.log(`⚠️ [${image.alt || '대표 이미지'}] 메타데이터가 없습니다. 건너뜁니다.`);
        continue;
      }
      
      // 기존 키워드 가져오기
      const currentTags = Array.isArray(existing.tags) 
        ? existing.tags 
        : (existing.tags ? [existing.tags] : []);
      
      // 중복 제거하며 새 키워드 추가
      const updatedTags = Array.from(new Set([...currentTags, ...keywordsToAdd]));
      
      // 키워드가 변경되었는지 확인
      if (updatedTags.length === currentTags.length) {
        console.log(`✅ [${image.alt || '대표 이미지'}] 이미 키워드가 포함되어 있습니다.`);
        continue;
      }
      
      // 메타데이터 업데이트
      const { error: updateError } = await supabase
        .from('image_metadata')
        .update({
          tags: updatedTags,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      
      if (updateError) {
        console.error(`❌ [${image.alt || '대표 이미지'}] 업데이트 실패: ${updateError.message}`);
        continue;
      }
      
      console.log(`✅ [${image.alt || '대표 이미지'}] 키워드 추가 완료`);
      console.log(`   기존: ${currentTags.join(', ') || '(없음)'}`);
      console.log(`   추가: ${keywordsToAdd.join(', ')}`);
      console.log(`   최종: ${updatedTags.join(', ')}\n`);
      
      updatedCount++;
      
    } catch (error) {
      console.error(`❌ 오류: ${error.message}`);
    }
  }
  
  console.log('='.repeat(80));
  console.log('✅ 키워드 추가 완료');
  console.log('='.repeat(80));
  console.log(`업데이트된 이미지: ${updatedCount}개`);
  console.log(`추가된 키워드: ${keywordsToAdd.join(', ')}`);
  console.log('='.repeat(80));
}

// 스크립트 실행
if (require.main === module) {
  const blogPostId = process.argv[2] ? parseInt(process.argv[2]) : 305;
  
  addLeeKyungYoungKeywords(blogPostId)
    .then(() => {
      console.log('\n✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { addLeeKyungYoungKeywords };

