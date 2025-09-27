const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixBlogPostContent() {
  try {
    console.log('🔍 블로그 포스트 검색 중...');
    
    // 해당 슬러그의 블로그 포스트 찾기
    const { data: posts, error: searchError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', 'golf-holiday-essential-masgolf-driver');
    
    if (searchError) {
      console.error('❌ 블로그 포스트 검색 에러:', searchError);
      return;
    }
    
    if (!posts || posts.length === 0) {
      console.log('❌ 해당 블로그 포스트를 찾을 수 없습니다.');
      return;
    }
    
    const post = posts[0];
    console.log('✅ 블로그 포스트 발견:', post.title);
    
    // 현재 콘텐츠에서 $1 플레이스홀더 찾기
    if (post.content.includes('$1')) {
      console.log('🔧 $1 플레이스홀더 발견, 수정 중...');
      
      // $1 플레이스홀더를 실제 내용으로 교체
      const updatedContent = post.content
        .replace(/\$1/g, '')
        .replace(/🤔 왜 MASGOLF 드라이버를 선택해야 할까요\?/g, '왜 MASGOLF 드라이버를 선택해야 할까요?')
        .replace(/\n\s*\n\s*\n/g, '\n\n'); // 연속된 줄바꿈 정리
      
      // 실제 내용 추가
      const finalContent = updatedContent.replace(
        '왜 MASGOLF 드라이버를 선택해야 할까요?',
        `왜 MASGOLF 드라이버를 선택해야 할까요?

1. **검증된 성능**: 3,000명 이상의 고객이 경험한 25m 비거리 증가
2. **시니어 친화적**: 50-60대 골퍼를 위한 특별 설계
3. **프리미엄 품질**: 일본 기술력과 한국 혁신의 만남
4. **전문 피팅**: 개인별 맞춤형 드라이버 제작 서비스`
      );
      
      // 데이터베이스 업데이트
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({ 
          content: finalContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id);
      
      if (updateError) {
        console.error('❌ 블로그 포스트 업데이트 에러:', updateError);
        return;
      }
      
      console.log('✅ 블로그 포스트 수정 완료!');
      console.log('📝 수정된 내용:');
      console.log('- $1 플레이스홀더 제거');
      console.log('- 🤔 이모지 제거');
      console.log('- 실제 선택 이유 4가지 추가');
      
    } else {
      console.log('ℹ️ $1 플레이스홀더가 없습니다. 이미 수정되었을 수 있습니다.');
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 스크립트 실행
fixBlogPostContent();
