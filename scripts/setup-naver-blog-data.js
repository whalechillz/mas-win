// 네이버 블로그 데이터 정리 및 연결 스크립트
// /scripts/setup-naver-blog-data.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yyytjudftrvpmcnppaymw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHJ2cG1jbnBwYXltdyIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3NTE0NDcxMTksImV4cCI6MjA2NzAyMzExOX0.1X23B7AANAg_g2Q1AAYl_kIHdd_OQap8YxElvvJn1io';

const supabase = createClient(supabaseUrl, supabaseKey);

// 작성자 매핑
const authorMapping = {
  'J': '제이',
  '미': '미',
  '싸': '스테피',
  '조': '조'
};

// 플랫폼 매핑
const platformMapping = {
  'mas9golf': '네이버 블로그 - 조',
  'massgoogolf': '네이버 블로그 - 미',
  'massgoogolfkorea': '네이버 블로그 - 싸'
};

async function setupBlogData() {
  console.log('🚀 네이버 블로그 데이터 정리 시작...\n');

  // 1. blog_contents의 네이버 콘텐츠 확인
  const { data: contents, error: contentsError } = await supabase
    .from('blog_contents')
    .select('*')
    .eq('content_type', 'blog')
    .order('scheduled_date', { ascending: false });

  if (contentsError) {
    console.error('❌ 콘텐츠 조회 오류:', contentsError);
    return;
  }

  console.log(`📊 총 ${contents.length}개의 블로그 콘텐츠 발견\n`);

  // 2. 각 콘텐츠에 대해 네이버 URL 매핑 (예시 데이터)
  const sampleUrls = {
    '구글 광고': 'https://blog.naver.com/mas9golf/sample1',
    '네이버 블로그 - 사이트': 'https://blog.naver.com/massgoogolf/sample2',
    '네이버 블로그 3 - 제티': 'https://blog.naver.com/massgoogolfkorea/sample3'
  };

  // 3. 작성자 정보 업데이트
  for (const content of contents) {
    // 작성자 추정 (content 내용에서 추출하거나 기본값 설정)
    const authorName = content.author_id || '미지정';
    
    const { error: updateError } = await supabase
      .from('blog_contents')
      .update({ 
        author_name: authorName,
        // 샘플 URL 추가 (실제 데이터로 교체 필요)
        naver_url: sampleUrls[content.title] || null
      })
      .eq('id', content.id);

    if (updateError) {
      console.error(`❌ 업데이트 오류 (${content.title}):`, updateError);
    } else {
      console.log(`✅ 업데이트 완료: ${content.title}`);
    }
  }

  console.log('\n✨ 데이터 정리 완료!');
}

// 실행
setupBlogData().catch(console.error);
