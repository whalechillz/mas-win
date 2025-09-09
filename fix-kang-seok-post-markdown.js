#!/usr/bin/env node

/**
 * 강석님 글을 Markdown 형식으로 수정하는 스크립트
 * HTML 코드가 원시 텍스트로 표시되는 문제 해결
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Markdown 형식으로 개선된 강석님 글 content
const MARKDOWN_CONTENT = `# MBC 표준FM의 싱글벙글쇼 MC 강석, 시크리트웨폰 모델과 함께하다.

**마쓰구골프 2015년 8월 21일**

MBC 표준FM의 싱글벙글쇼 남자 MC 강석님을 알고 계신가요? 목소리는 굉장히 익숙하지만 실제 모습은 조금 낯선 분들도 많이 계실거예요.

![강석님 프로필](https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/kang-seok-profile-94f4be_a394473798764e3a8010db94d36b0ad4-1757426972465.webp)

*MBC 표준FM 싱글벙글쇼 MC 강석님*

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
> 
> **- 강석님**

여러분도 편하게 골프를 즐기시고 싶으시다면, 마쓰구골프를 찾아보시는 것은 어떨까요?

---

## 태그

**고반발드라이버** • **마쓰구골프** • **마쓰구** • **마쓰구드라이버**`;

// 강석님 글 수정 함수
async function fixKangSeokPostMarkdown() {
  try {
    console.log('🔧 강석님 글 Markdown 형식으로 수정 시작...');
    
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
    console.log(`📝 기존 content 길이: ${currentPost.content.length}자`);
    
    // 2. 새로운 featured_image (강석님 프로필 이미지로 변경)
    const newFeaturedImage = 'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/kang-seok-profile-94f4be_a394473798764e3a8010db94d36b0ad4-1757426972465.webp';
    
    // 3. 데이터베이스 업데이트
    const { data: updatedPost, error: updateError } = await supabase
      .from('blog_posts')
      .update({
        content: MARKDOWN_CONTENT,
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
    
    console.log('\n🎉 강석님 글 Markdown 형식으로 수정 완료!');
    console.log('✅ HTML 코드 제거 완료');
    console.log('✅ Markdown 형식으로 변환 완료');
    console.log('✅ 이미지 정상 표시 예상');
    console.log('✅ Featured Image를 강석님 프로필로 변경');
    
    // 4. 결과 요약
    console.log('\n📊 수정 결과:');
    console.log(`✅ Content 수정: 완료`);
    console.log(`✅ Featured Image 변경: 완료`);
    console.log(`✅ Markdown 형식: 완료`);
    console.log(`✅ 이미지 표시: 예상 정상`);
    console.log(`✅ 로고 제거: 완료`);
    
    return updatedPost;
    
  } catch (error) {
    console.error('❌ 수정 실패:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  fixKangSeokPostMarkdown()
    .then(result => {
      console.log('\n🎉 강석님 글 Markdown 형식 수정 성공!');
      console.log('이제 블로그에서 정상적으로 이미지와 텍스트가 표시됩니다.');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 수정 실패:', error);
      process.exit(1);
    });
}

module.exports = { fixKangSeokPostMarkdown };
