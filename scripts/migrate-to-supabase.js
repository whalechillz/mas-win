const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateToSupabase() {
  try {
    console.log('🚀 JSON 데이터를 Supabase로 마이그레이션을 시작합니다...');
    
    // JSON 파일들 읽기
    const postsDir = path.join(__dirname, '..', 'mas9golf', 'migrated-posts');
    const files = fs.readdirSync(postsDir);
    const posts = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(postsDir, file);
        const postData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Supabase 형식으로 변환
        const supabasePost = {
          id: parseInt(postData.id),
          title: postData.title,
          slug: postData.slug,
          excerpt: postData.excerpt,
          content: postData.content,
          featured_image: postData.featured_image,
          published_at: postData.publishedAt || postData.published_at,
          created_at: postData.createdAt || postData.created_at,
          updated_at: postData.updatedAt || postData.updated_at,
          category: postData.category,
          tags: postData.tags || [],
          status: postData.status || 'published',
          meta_title: postData.meta_title,
          meta_description: postData.meta_description,
          meta_keywords: postData.meta_keywords,
          view_count: postData.view_count || 0,
          is_featured: postData.is_featured || false
        };
        
        posts.push(supabasePost);
        console.log(`📄 ${file} 파싱 완료: ${postData.title}`);
      }
    }

    console.log(`\n📊 총 ${posts.length}개의 포스트를 Supabase에 삽입합니다...`);

    // 기존 데이터 삭제 (선택사항)
    console.log('🗑️ 기존 데이터를 삭제합니다...');
    const { error: deleteError } = await supabase
      .from('blog_posts')
      .delete()
      .neq('id', 0); // 모든 데이터 삭제

    if (deleteError) {
      console.log('⚠️ 기존 데이터 삭제 중 오류 (무시 가능):', deleteError.message);
    } else {
      console.log('✅ 기존 데이터 삭제 완료');
    }

    // 새 데이터 삽입
    const { data, error } = await supabase
      .from('blog_posts')
      .insert(posts)
      .select();

    if (error) {
      console.error('❌ 데이터 삽입 실패:', error);
      return;
    }

    console.log('✅ 마이그레이션 완료!');
    console.log(`📊 ${data.length}개의 포스트가 성공적으로 삽입되었습니다.`);
    
    // 삽입된 데이터 확인
    console.log('\n📋 삽입된 포스트 목록:');
    data.forEach((post, index) => {
      console.log(`${index + 1}. ${post.title} (ID: ${post.id})`);
    });

    // 테이블 상태 확인
    console.log('\n🔍 테이블 상태 확인...');
    const { data: allPosts, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, title, status')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ 데이터 조회 실패:', fetchError);
    } else {
      console.log(`✅ 테이블에 총 ${allPosts.length}개의 포스트가 있습니다.`);
    }

  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error);
  }
}

// 실행
migrateToSupabase();
