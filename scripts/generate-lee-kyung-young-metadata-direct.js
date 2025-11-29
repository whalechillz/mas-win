/**
 * 이경영 글의 이미지 메타데이터 직접 생성
 * 일반 메타 생성 사용 (골프 AI 생성 아님)
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

async function generateMetadataDirect(blogPostId) {
  console.log(`🏷️ 블로그 글(ID: ${blogPostId}) 이미지 메타데이터 직접 생성 시작...\n`);
  console.log('='.repeat(80));
  
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
    images.push({
      url: post.featured_image,
      type: 'featured',
      alt: '대표 이미지'
    });
  }
  
  const contentMatches = [...post.content.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)];
  contentMatches.forEach(m => {
    images.push({
      url: m[2],
      alt: m[1],
      type: 'content'
    });
  });
  
  console.log(`📊 발견된 이미지: ${images.length}개\n`);
  
  // 3. 각 이미지에 대해 메타데이터 생성 (일반 메타 생성 사용)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  let processedCount = 0;
  let errorCount = 0;
  
  for (const image of images) {
    try {
      console.log(`🔄 [${image.alt}] 메타데이터 생성 중...`);
      console.log(`   URL: ${image.url.substring(0, 80)}...`);
      
      // 일반 메타 생성 API 호출
      const response = await fetch(`${baseUrl}/api/analyze-image-general`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageUrl: image.url,
          title: post.title || '이미지',
          excerpt: image.alt || '일반 이미지'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`   ❌ API 호출 실패: ${errorData.message || response.status}`);
        errorCount++;
        continue;
      }
      
      const metadata = await response.json();
      
      // 메타데이터 저장
      const metadataToSave = {
        image_url: image.url,
        alt_text: metadata.alt_text || metadata.alt || '',
        title: metadata.title || '',
        description: metadata.description || '',
        tags: Array.isArray(metadata.keywords) 
          ? metadata.keywords 
          : (metadata.keywords ? metadata.keywords.split(',').map(k => k.trim()) : []),
        updated_at: new Date().toISOString()
      };
      
      // 기존 메타데이터 확인
      const { data: existing } = await supabase
        .from('image_metadata')
        .select('id')
        .eq('image_url', image.url)
        .single();
      
      if (existing) {
        // 업데이트
        const { error: updateError } = await supabase
          .from('image_metadata')
          .update(metadataToSave)
          .eq('id', existing.id);
        
        if (updateError) {
          console.error(`   ❌ 업데이트 실패: ${updateError.message}`);
          errorCount++;
          continue;
        }
        console.log(`   ✅ 메타데이터 업데이트 완료`);
      } else {
        // 새로 생성
        const { error: insertError } = await supabase
          .from('image_metadata')
          .insert({
            ...metadataToSave,
            created_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error(`   ❌ 생성 실패: ${insertError.message}`);
          errorCount++;
          continue;
        }
        console.log(`   ✅ 메타데이터 생성 완료`);
      }
      
      console.log(`   ALT: ${metadataToSave.alt_text.substring(0, 50)}...`);
      console.log(`   Title: ${metadataToSave.title}`);
      console.log(`   Keywords: ${metadataToSave.tags.join(', ')}\n`);
      
      processedCount++;
      
      // API 호출 간격 (너무 빠르게 호출하지 않도록)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`   ❌ 오류: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log('='.repeat(80));
  console.log('✅ 메타데이터 생성 완료');
  console.log('='.repeat(80));
  console.log(`처리된 이미지: ${processedCount}개`);
  console.log(`오류: ${errorCount}개`);
  console.log('='.repeat(80));
}

// 스크립트 실행
if (require.main === module) {
  const blogPostId = process.argv[2] ? parseInt(process.argv[2]) : 305;
  
  generateMetadataDirect(blogPostId)
    .then(() => {
      console.log('\n✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { generateMetadataDirect };

