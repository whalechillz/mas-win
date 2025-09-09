#!/usr/bin/env node

/**
 * 강석님 글의 이미지를 새로운 Supabase Storage URL로 업데이트하는 스크립트
 * 마이그레이션된 고화질 WebP 이미지로 교체
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 마이그레이션된 새로운 이미지 URL 매핑
const NEW_IMAGE_URLS = {
  // MASSGOO 로고
  'https://static.wixstatic.com/media/abee05_627c6fec85f241e7a9458084a67e36b9~mv2.jpg/v1/crop/x_0,y_521,w_2400,h_928/fill/w_203,h_69,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/%EB%A7%88%EC%93%B0%EA%B5%AC.jpg': 'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/kang-seok-logo--EB-A7-88-EC-93-B0-EA-B5-AC-jpg-1757426970124.webp',
  
  // 강석님 프로필
  'https://static.wixstatic.com/media/94f4be_a394473798764e3a8010db94d36b0ad4~mv2.jpg/v1/fill/w_120,h_170,al_c,q_80,usm_0.66_1.00_0.01,blur_2,enc_avif,quality_auto/94f4be_a394473798764e3a8010db94d36b0ad4~mv2.jpg': 'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/kang-seok-profile-94f4be_a394473798764e3a8010db94d36b0ad4-1757426972465.webp',
  
  // 골프 장비
  'https://static.wixstatic.com/media/94f4be_78c51b941ff84e15ae0224439323f180~mv2.jpg/v1/fill/w_147,h_98,al_c,q_80,usm_0.66_1.00_0.01,blur_2,enc_avif,quality_auto/94f4be_78c51b941ff84e15ae0224439323f180~mv2.jpg': 'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/kang-seok-equipment-94f4be_78c51b941ff84e15ae0224439323f180-1757426974556.webp',
  
  // 드라이버 헤드
  'https://static.wixstatic.com/media/94f4be_68677951d32544c39809afc98c693277~mv2.jpg/v1/fill/w_220,h_330,fp_0.50_0.50,q_90/94f4be_68677951d32544c39809afc98c693277~mv2.jpg': 'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/kang-seok-driver-94f4be_68677951d32544c39809afc98c693277-1757426976728.webp',
  
  // 스윙 모습
  'https://static.wixstatic.com/media/94f4be_6ba406c468914150a13c6a8603d06f12~mv2.jpg/v1/fill/w_404,h_330,fp_0.50_0.50,q_90/94f4be_6ba406c468914150a13c6a8603d06f12~mv2.jpg': 'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/kang-seok-swing-94f4be_6ba406c468914150a13c6a8603d06f12-1757426978871.webp',
  
  // 골프 클럽
  'https://static.wixstatic.com/media/94f4be_be5b4bf9040a48e3b4ed2a4cc309d3ad~mv2.jpg/v1/fill/w_323,h_323,fp_0.50_0.50,q_90/94f4be_be5b4bf9040a48e3b4ed2a4cc309d3ad~mv2.jpg': 'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/kang-seok-club-94f4be_be5b4bf9040a48e3b4ed2a4cc309d3ad-1757426981002.webp',
  
  // 골프 장비 세트
  'https://static.wixstatic.com/media/94f4be_6ceba23029f947c9941a1206181daec9~mv2.jpg/v1/fill/w_324,h_323,fp_0.50_0.50,q_90/94f4be_6ceba23029f947c9941a1206181daec9~mv2.jpg': 'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/kang-seok-equipment-set-94f4be_6ceba23029f947c9941a1206181daec9-1757426983111.webp',
  
  // 골프 공
  'https://static.wixstatic.com/media/94f4be_c760743db9604476a67e16bbfe894c90~mv2.jpg/v1/fill/w_323,h_323,fp_0.50_0.50,q_90/94f4be_c760743db9604476a67e16bbfe894c90~mv2.jpg': 'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/kang-seok-ball-94f4be_c760743db9604476a67e16bbfe894c90-1757426985249.webp'
};

// 강석님 글의 새로운 content (고화질 WebP 이미지로 업데이트)
const UPDATED_CONTENT = `![MASSGOO 로고](https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/kang-seok-logo--EB-A7-88-EC-93-B0-EA-B5-AC-jpg-1757426970124.webp)

# MBC 표준FM의 싱글벙글쇼 MC 강석, 시크리트웨폰 모델과 함께하다.

**마쓰구골프 2015년 8월 21일**

MBC 표준FM의 싱글벙글쇼 남자 MC 강석님을 알고 계신가요? 목소리는 굉장히 익숙하지만 실제 모습은 조금 낯선 분들도 많이 계실거예요.

![강석님 프로필](https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/kang-seok-profile-94f4be_a394473798764e3a8010db94d36b0ad4-1757426972465.webp)

오늘은 코미디언 강석님께서 마쓰구골프 시타 현장에 찾아주셨습니다. 마쓰구골프는 모든 제품을 시타해보시고, 구매하시는 것이 가능하십니다.

![골프 장비](https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/kang-seok-equipment-94f4be_78c51b941ff84e15ae0224439323f180-1757426974556.webp)

가장 큰 특징은 샤프트만 스펙별로 준비되어 있는 것이 아니라, 헤드 페이스의 두께까지 스펙 별로 준비되어 있다는 점이에요.

![드라이버 헤드](https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/kang-seok-driver-94f4be_68677951d32544c39809afc98c693277-1757426976728.webp)

강석님께서 스윙하신 드라이버는 마쓰구골프의 시크리트웨폰 모델로, 현재 준비되어 있는 모델 중 가장 반발력이 높은 모델입니다.

![스윙 모습](https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/kang-seok-swing-94f4be_6ba406c468914150a13c6a8603d06f12-1757426978871.webp)

실제 시타를 해보시고, 타구감과 타구음이 너무 좋다며 칭찬을 아끼지 않으셨어요.

![골프 클럽](https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/kang-seok-club-94f4be_be5b4bf9040a48e3b4ed2a4cc309d3ad-1757426981002.webp)

나이가 들어가면서, 조금 편안한 스윙으로 골프를 즐기고 싶다는 말씀에 맞춰 제품을 추천드렸는데, 만족해하시니 너무 뿌듯하더라구요.

![골프 장비 세트](https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/kang-seok-equipment-set-94f4be_6ceba23029f947c9941a1206181daec9-1757426983111.webp)

스윙은 편안하고 부드럽게 하지만 만족스러운 비거리가 나왔기에 만족하셨던 것 같아요.

![골프 공](https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/kang-seok-ball-94f4be_c760743db9604476a67e16bbfe894c90-1757426985249.webp)

> "저처럼 이제는 편하게 골프를 치고 싶으신 분들에게 많은 도움이 되겠네요."

여러분도 편하게 골프를 즐기시고 싶으시다면, 마쓰구골프를 찾아보시는 것은 어떨까요?

**태그:** 고반발드라이버, 마쓰구골프, 마쓰구, 마쓰구드라이버`;

// 강석님 글 업데이트 함수
async function updateKangSeokPost() {
  try {
    console.log('🔄 강석님 글 이미지 업데이트 시작...');
    
    // 1. 현재 강석님 글 조회
    const { data: currentPost, error: fetchError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', 'mbc-kang-seok-mc-experience-massgoo-secret-weapon-driver-22-years-tradition')
      .single();
    
    if (fetchError) {
      console.error('❌ 강석님 글 조회 실패:', fetchError);
      return;
    }
    
    console.log(`📄 현재 글 ID: ${currentPost.id}`);
    console.log(`📸 기존 이미지 수: ${(currentPost.content.match(/https:\/\/static\.wixstatic\.com/g) || []).length}개`);
    
    // 2. 이미지 URL 교체
    let updatedContent = currentPost.content;
    let replacedCount = 0;
    
    for (const [oldUrl, newUrl] of Object.entries(NEW_IMAGE_URLS)) {
      if (updatedContent.includes(oldUrl)) {
        updatedContent = updatedContent.replace(new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newUrl);
        replacedCount++;
        console.log(`✅ 이미지 교체: ${oldUrl.split('/').pop().substring(0, 30)}... → ${newUrl.split('/').pop()}`);
      }
    }
    
    // 3. featured_image도 업데이트
    const newFeaturedImage = NEW_IMAGE_URLS['https://static.wixstatic.com/media/abee05_627c6fec85f241e7a9458084a67e36b9~mv2.jpg/v1/crop/x_0,y_521,w_2400,h_928/fill/w_203,h_69,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/%EB%A7%88%EC%93%B0%EA%B5%AC.jpg'];
    
    // 4. 데이터베이스 업데이트
    const { data: updatedPost, error: updateError } = await supabase
      .from('blog_posts')
      .update({
        content: updatedContent,
        featured_image: newFeaturedImage,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentPost.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ 글 업데이트 실패:', updateError);
      return;
    }
    
    console.log('\n🎉 강석님 글 이미지 업데이트 완료!');
    console.log(`📸 교체된 이미지 수: ${replacedCount}개`);
    console.log(`🆕 새로운 이미지 수: ${(updatedPost.content.match(/https:\/\/yyytjudftvpmcnppaymw\.supabase\.co/g) || []).length}개`);
    console.log(`🔗 새로운 featured_image: ${updatedPost.featured_image}`);
    
    // 5. 결과 요약
    console.log('\n📊 업데이트 결과:');
    console.log(`✅ Content 업데이트: 완료`);
    console.log(`✅ Featured Image 업데이트: 완료`);
    console.log(`✅ 모든 Wix 이미지 → Supabase Storage WebP 이미지로 교체 완료`);
    
    return updatedPost;
    
  } catch (error) {
    console.error('❌ 업데이트 실패:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  updateKangSeokPost()
    .then(result => {
      console.log('\n🎉 강석님 글 이미지 업데이트 성공!');
      console.log('이제 블로그에서 고화질 WebP 이미지를 확인할 수 있습니다.');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 업데이트 실패:', error);
      process.exit(1);
    });
}

module.exports = { updateKangSeokPost };
