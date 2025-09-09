// 강석님 글을 이미지와 함께 직접 생성하는 스크립트
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const blogPostData = {
  title: "MBC 표준FM의 싱글벙글쇼 MC 강석, 시크리트웨폰 모델과 함께하다.",
  slug: "mbc-kang-seok-mc-experience-massgoo-secret-weapon-driver-22-years-tradition",
  excerpt: "MBC 표준FM의 싱글벙글쇼 남자 MC 강석님께서 마쓰구골프 시타 현장에 찾아주셨습니다.",
  content: `![MASSGOO 로고](https://static.wixstatic.com/media/abee05_627c6fec85f241e7a9458084a67e36b9~mv2.jpg/v1/crop/x_0,y_521,w_2400,h_928/fill/w_203,h_69,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/%EB%A7%88%EC%93%B0%EA%B5%AC.jpg)

# MBC 표준FM의 싱글벙글쇼 MC 강석, 시크리트웨폰 모델과 함께하다.

**마쓰구골프 2015년 8월 21일**

MBC 표준FM의 싱글벙글쇼 남자 MC 강석님을 알고 계신가요? 목소리는 굉장히 익숙하지만 실제 모습은 조금 낯선 분들도 많이 계실거예요.

![강석님 프로필](https://static.wixstatic.com/media/94f4be_a394473798764e3a8010db94d36b0ad4~mv2.jpg/v1/fill/w_120,h_170,al_c,q_80,usm_0.66_1.00_0.01,blur_2,enc_avif,quality_auto/94f4be_a394473798764e3a8010db94d36b0ad4~mv2.jpg)

오늘은 코미디언 강석님께서 마쓰구골프 시타 현장에 찾아주셨습니다. 마쓰구골프는 모든 제품을 시타해보시고, 구매하시는 것이 가능하십니다.

![골프 장비](https://static.wixstatic.com/media/94f4be_78c51b941ff84e15ae0224439323f180~mv2.jpg/v1/fill/w_147,h_98,al_c,q_80,usm_0.66_1.00_0.01,blur_2,enc_avif,quality_auto/94f4be_78c51b941ff84e15ae0224439323f180~mv2.jpg)

가장 큰 특징은 샤프트만 스펙별로 준비되어 있는 것이 아니라, 헤드 페이스의 두께까지 스펙 별로 준비되어 있다는 점이에요.

![드라이버 헤드](https://static.wixstatic.com/media/94f4be_68677951d32544c39809afc98c693277~mv2.jpg/v1/fill/w_220,h_330,fp_0.50_0.50,q_90/94f4be_68677951d32544c39809afc98c693277~mv2.jpg)

강석님께서 스윙하신 드라이버는 마쓰구골프의 시크리트웨폰 모델로, 현재 준비되어 있는 모델 중 가장 반발력이 높은 모델입니다.

![스윙 모습](https://static.wixstatic.com/media/94f4be_6ba406c468914150a13c6a8603d06f12~mv2.jpg/v1/fill/w_404,h_330,fp_0.50_0.50,q_90/94f4be_6ba406c468914150a13c6a8603d06f12~mv2.jpg)

실제 시타를 해보시고, 타구감과 타구음이 너무 좋다며 칭찬을 아끼지 않으셨어요.

![골프 클럽](https://static.wixstatic.com/media/94f4be_be5b4bf9040a48e3b4ed2a4cc309d3ad~mv2.jpg/v1/fill/w_323,h_323,fp_0.50_0.50,q_90/94f4be_be5b4bf9040a48e3b4ed2a4cc309d3ad~mv2.jpg)

나이가 들어가면서, 조금 편안한 스윙으로 골프를 즐기고 싶다는 말씀에 맞춰 제품을 추천드렸는데, 만족해하시니 너무 뿌듯하더라구요.

![골프 장비 세트](https://static.wixstatic.com/media/94f4be_6ceba23029f947c9941a1206181daec9~mv2.jpg/v1/fill/w_324,h_323,fp_0.50_0.50,q_90/94f4be_6ceba23029f947c9941a1206181daec9~mv2.jpg)

스윙은 편안하고 부드럽게 하지만 만족스러운 비거리가 나왔기에 만족하셨던 것 같아요.

![골프 공](https://static.wixstatic.com/media/94f4be_c760743db9604476a67e16bbfe894c90~mv2.jpg/v1/fill/w_323,h_323,fp_0.50_0.50,q_90/94f4be_c760743db9604476a67e16bbfe894c90~mv2.jpg)

> "저처럼 이제는 편하게 골프를 치고 싶으신 분들에게 많은 도움이 되겠네요."

여러분도 편하게 골프를 즐기시고 싶으시다면, 마쓰구골프를 찾아보시는 것은 어떨까요?

**태그:** 고반발드라이버, 마쓰구골프, 마쓰구, 마쓰구드라이버`,
  featured_image: "https://static.wixstatic.com/media/abee05_627c6fec85f241e7a9458084a67e36b9~mv2.jpg/v1/crop/x_0,y_521,w_2400,h_928/fill/w_203,h_69,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/%EB%A7%88%EC%93%B0%EA%B5%AC.jpg",
  category: "비거리 향상 드라이버",
  tags: ["고반발드라이버", "마쓰구골프", "마쓰구", "마쓰구드라이버", "강석", "MBC", "시크리트웨폰"],
  status: "published",
  meta_title: "MBC 강석 MC, 마쓰구골프 시크리트웨폰 드라이버 체험기",
  meta_description: "MBC 표준FM 싱글벙글쇼 MC 강석님이 마쓰구골프 시크리트웨폰 드라이버를 체험하고 편안한 스윙으로 만족스러운 비거리를 경험한 이야기입니다.",
  meta_keywords: "",
  view_count: 0,
  is_featured: false,
  is_scheduled: false,
  scheduled_at: null,
  author: "마쓰구골프",
  published_at: "2015-08-21T00:00:00.000Z",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

async function createBlogPost() {
  try {
    console.log('📝 강석님 글 생성 중...');
    
    // 기존 글 삭제
    const { error: deleteError } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', 11);
    
    if (deleteError) {
      console.log('⚠️ 기존 글 삭제 중 오류 (무시 가능):', deleteError.message);
    }
    
    // 새 글 생성
    const { data, error } = await supabase
      .from('blog_posts')
      .insert([blogPostData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ 블로그 포스트 생성 오류:', error);
      return;
    }
    
    console.log('✅ 강석님 글 생성 완료:', data.id);
    console.log('📸 포함된 이미지 수:', (data.content.match(/https:\/\/static\.wixstatic\.com/g) || []).length);
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

createBlogPost();
