/**
 * 뮤직 관련 허브 콘텐츠 및 블로그 포스트 생성 스크립트
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createMusicHubAndBlog() {
  try {
    console.log('🎵 뮤직 관련 허브 콘텐츠 및 블로그 생성 시작...\n');

    // 오늘 날짜
    const today = new Date().toISOString().split('T')[0];

    // 허브 콘텐츠 데이터
    const hubContent = {
      title: '뮤직과 골프의 완벽한 조화, 마쓰구골프의 새로운 경험',
      summary: '골프 라운딩 중 음악을 즐기는 새로운 경험을 소개합니다. 마쓰구골프가 선사하는 특별한 골프 라이프스타일을 만나보세요.',
      content_body: `# 뮤직과 골프의 완벽한 조화

골프는 단순히 공을 치는 스포츠가 아닙니다. 자연 속에서의 여유, 집중의 순간, 그리고 완벽한 스윙을 만들어내는 그 모든 과정이 하나의 예술입니다. 

마쓰구골프는 이제 그 경험에 음악이라는 새로운 차원을 더합니다.

## 음악이 주는 리듬감

골프 스윙은 리듬이 중요합니다. 일정한 템포와 흐름을 유지하는 것이 좋은 스윙의 핵심입니다. 음악의 리듬감은 이러한 골프 스윙의 리듬을 자연스럽게 만들어줍니다.

많은 프로 골퍼들이 실제로 라운딩 중에 음악을 듣는 것을 즐깁니다. 집중력을 높이고, 긴장을 완화하며, 자신만의 페이스를 유지하는 데 도움이 되기 때문입니다.

## 마쓰구골프의 특별한 경험

마쓰구골프는 골프와 음악을 결합한 새로운 라이프스타일을 제안합니다. 

- **집중력 향상**: 적절한 음악은 외부 소음을 차단하고 집중력을 높여줍니다
- **스트레스 완화**: 라운딩 중의 긴장감을 음악으로 완화할 수 있습니다
- **개인화된 경험**: 자신만의 플레이리스트로 더욱 특별한 라운딩을 즐길 수 있습니다

## 골프와 음악의 시너지

골프와 음악은 모두 리듬과 흐름이 중요합니다. 좋은 골프 스윙은 마치 음악의 멜로디처럼 자연스럽고 아름답습니다. 

마쓰구골프는 이러한 두 예술의 만남을 통해 고객들에게 더욱 풍부한 경험을 제공하고자 합니다.

## 마무리

골프는 단순한 스포츠가 아닙니다. 그것은 하나의 라이프스타일입니다. 마쓰구골프는 음악과 함께하는 새로운 골프 경험을 통해 고객들의 골프 라이프를 더욱 풍요롭게 만들어가고 있습니다.

음악과 함께하는 골프, 마쓰구골프에서 경험해보세요.`,
      content_date: today,
      is_hub_content: true,
      hub_priority: 1,
      auto_derive_channels: ['blog', 'sms', 'naver_blog', 'kakao'],
      channel_status: {
        blog: { status: '미연결', post_id: null, created_at: null },
        sms: { status: '미발행', post_id: null, created_at: null },
        naver_blog: { status: '미발행', post_id: null, created_at: null },
        kakao: { status: '미발행', post_id: null, created_at: null }
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 1. 허브 콘텐츠 생성
    console.log('📝 허브 콘텐츠 생성 중...');
    const { data: createdHub, error: hubError } = await supabase
      .from('cc_content_calendar')
      .insert(hubContent)
      .select()
      .single();

    if (hubError) {
      console.error('❌ 허브 콘텐츠 생성 실패:', hubError);
      return;
    }

    console.log('✅ 허브 콘텐츠 생성 완료!');
    console.log(`   ID: ${createdHub.id}`);
    console.log(`   제목: ${createdHub.title}\n`);

    // 2. 블로그 포스트 생성
    console.log('📝 블로그 포스트 생성 중...');
    
    // 슬러그 생성
    const slug = hubContent.title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);

    const blogPost = {
      title: hubContent.title,
      slug: slug,
      excerpt: hubContent.summary,
      content: hubContent.content_body,
      category: '골프 라이프스타일',
      tags: ['뮤직', '골프 라이프스타일', '경험'],
      status: 'draft',
      author: '마쓰구골프',
      published_at: today,
      calendar_id: createdHub.id, // 허브 연결
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: createdBlog, error: blogError } = await supabase
      .from('blog_posts')
      .insert(blogPost)
      .select()
      .single();

    if (blogError) {
      console.error('❌ 블로그 포스트 생성 실패:', blogError);
      return;
    }

    console.log('✅ 블로그 포스트 생성 완료!');
    console.log(`   ID: ${createdBlog.id}`);
    console.log(`   제목: ${createdBlog.title}\n`);

    // 3. 허브와 블로그 연결 업데이트
    console.log('🔗 허브와 블로그 연결 중...');
    
    const updatedChannelStatus = {
      ...createdHub.channel_status,
      blog: {
        status: '연결됨',
        post_id: createdBlog.id.toString(),
        created_at: new Date().toISOString()
      }
    };

    const { error: updateError } = await supabase
      .from('cc_content_calendar')
      .update({
        blog_post_id: createdBlog.id,
        channel_status: updatedChannelStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', createdHub.id);

    if (updateError) {
      console.error('❌ 허브-블로그 연결 실패:', updateError);
      return;
    }

    console.log('✅ 허브와 블로그 연결 완료!\n');

    // 4. 결과 요약
    console.log('🎉 생성 완료!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 생성 결과:');
    console.log(`   허브 ID: ${createdHub.id}`);
    console.log(`   블로그 ID: ${createdBlog.id}`);
    console.log(`   제목: ${createdHub.title}`);
    console.log(`   날짜: ${today}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 다음 단계:');
    console.log(`   1. 허브 콘텐츠 편집: /admin/content-calendar-hub`);
    console.log(`   2. 블로그 포스트 편집: /admin/blog?edit=${createdBlog.id}&hub=${createdHub.id}`);
    console.log(`   3. 블로그 포스트 발행: 블로그 편집 화면에서 상태를 'published'로 변경\n`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 스크립트 실행
createMusicHubAndBlog();

