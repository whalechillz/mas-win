#!/usr/bin/env node

/**
 * 강석님 글을 모바일 친화적이고 고급스러운 폰트로 개선하는 스크립트
 * - MASSGOO 로고 제거
 * - 모바일 친화적인 레이아웃
 * - 고급스럽고 큰 폰트 적용
 * - 반응형 디자인
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 개선된 강석님 글 content (로고 제거, 모바일 친화적, 고급스러운 폰트)
const IMPROVED_CONTENT = `
<div class="blog-post-container">
  <div class="blog-header">
    <h1 class="blog-title">MBC 표준FM의 싱글벙글쇼 MC 강석, 시크리트웨폰 모델과 함께하다.</h1>
    <div class="blog-meta">
      <span class="blog-date">마쓰구골프 2015년 8월 21일</span>
      <span class="blog-author">마쓰구골프</span>
    </div>
  </div>

  <div class="blog-content">
    <div class="intro-section">
      <p class="intro-text">MBC 표준FM의 싱글벙글쇼 남자 MC 강석님을 알고 계신가요? 목소리는 굉장히 익숙하지만 실제 모습은 조금 낯선 분들도 많이 계실거예요.</p>
    </div>

    <div class="image-section">
      <img src="https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/kang-seok-profile-94f4be_a394473798764e3a8010db94d36b0ad4-1757426972465.webp" 
           alt="강석님 프로필" 
           class="profile-image">
      <p class="image-caption">MBC 표준FM 싱글벙글쇼 MC 강석님</p>
    </div>

    <div class="content-section">
      <p class="content-text">오늘은 코미디언 강석님께서 마쓰구골프 시타 현장에 찾아주셨습니다. 마쓰구골프는 모든 제품을 시타해보시고, 구매하시는 것이 가능하십니다.</p>
    </div>

    <div class="image-section">
      <img src="https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/kang-seok-equipment-94f4be_78c51b941ff84e15ae0224439323f180-1757426974556.webp" 
           alt="골프 장비" 
           class="content-image">
    </div>

    <div class="content-section">
      <p class="content-text">가장 큰 특징은 샤프트만 스펙별로 준비되어 있는 것이 아니라, 헤드 페이스의 두께까지 스펙 별로 준비되어 있다는 점이에요.</p>
    </div>

    <div class="image-section">
      <img src="https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/kang-seok-driver-94f4be_68677951d32544c39809afc98c693277-1757426976728.webp" 
           alt="드라이버 헤드" 
           class="content-image">
    </div>

    <div class="content-section">
      <p class="content-text">강석님께서 스윙하신 드라이버는 마쓰구골프의 시크리트웨폰 모델로, 현재 준비되어 있는 모델 중 가장 반발력이 높은 모델입니다.</p>
    </div>

    <div class="image-section">
      <img src="https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/kang-seok-swing-94f4be_6ba406c468914150a13c6a8603d06f12-1757426978871.webp" 
           alt="스윙 모습" 
           class="content-image">
    </div>

    <div class="content-section">
      <p class="content-text">실제 시타를 해보시고, 타구감과 타구음이 너무 좋다며 칭찬을 아끼지 않으셨어요.</p>
    </div>

    <div class="image-section">
      <img src="https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/kang-seok-club-94f4be_be5b4bf9040a48e3b4ed2a4cc309d3ad-1757426981002.webp" 
           alt="골프 클럽" 
           class="content-image">
    </div>

    <div class="content-section">
      <p class="content-text">나이가 들어가면서, 조금 편안한 스윙으로 골프를 즐기고 싶다는 말씀에 맞춰 제품을 추천드렸는데, 만족해하시니 너무 뿌듯하더라구요.</p>
    </div>

    <div class="image-section">
      <img src="https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/kang-seok-equipment-set-94f4be_6ceba23029f947c9941a1206181daec9-1757426983111.webp" 
           alt="골프 장비 세트" 
           class="content-image">
    </div>

    <div class="content-section">
      <p class="content-text">스윙은 편안하고 부드럽게 하지만 만족스러운 비거리가 나왔기에 만족하셨던 것 같아요.</p>
    </div>

    <div class="image-section">
      <img src="https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/kang-seok-ball-94f4be_c760743db9604476a67e16bbfe894c90-1757426985249.webp" 
           alt="골프 공" 
           class="content-image">
    </div>

    <div class="quote-section">
      <blockquote class="testimonial-quote">
        "저처럼 이제는 편하게 골프를 치고 싶으신 분들에게 많은 도움이 되겠네요."
      </blockquote>
      <p class="quote-author">- 강석님</p>
    </div>

    <div class="conclusion-section">
      <p class="conclusion-text">여러분도 편하게 골프를 즐기시고 싶으시다면, 마쓰구골프를 찾아보시는 것은 어떨까요?</p>
    </div>

    <div class="tags-section">
      <div class="tags-label">태그</div>
      <div class="tags">
        <span class="tag">고반발드라이버</span>
        <span class="tag">마쓰구골프</span>
        <span class="tag">마쓰구</span>
        <span class="tag">마쓰구드라이버</span>
      </div>
    </div>
  </div>
</div>

<style>
  .blog-post-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.8;
    color: #2c3e50;
    background: #ffffff;
  }

  .blog-header {
    text-align: center;
    margin-bottom: 40px;
    padding-bottom: 30px;
    border-bottom: 2px solid #f8f9fa;
  }

  .blog-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 20px;
    line-height: 1.3;
    letter-spacing: -0.02em;
  }

  .blog-meta {
    display: flex;
    justify-content: center;
    gap: 20px;
    font-size: 1.1rem;
    color: #6c757d;
    font-weight: 500;
  }

  .blog-date {
    position: relative;
  }

  .blog-date::after {
    content: "•";
    position: absolute;
    right: -10px;
    color: #dee2e6;
  }

  .blog-content {
    font-size: 1.2rem;
    line-height: 1.8;
  }

  .intro-section {
    margin-bottom: 40px;
  }

  .intro-text {
    font-size: 1.3rem;
    font-weight: 500;
    color: #495057;
    text-align: center;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 12px;
    border-left: 4px solid #007bff;
  }

  .image-section {
    margin: 40px 0;
    text-align: center;
  }

  .profile-image {
    width: 100%;
    max-width: 400px;
    height: auto;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    margin-bottom: 15px;
  }

  .content-image {
    width: 100%;
    max-width: 600px;
    height: auto;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    margin-bottom: 15px;
  }

  .image-caption {
    font-size: 1rem;
    color: #6c757d;
    font-style: italic;
    margin-top: 10px;
  }

  .content-section {
    margin: 30px 0;
  }

  .content-text {
    font-size: 1.2rem;
    line-height: 1.8;
    color: #2c3e50;
    margin-bottom: 20px;
  }

  .quote-section {
    margin: 50px 0;
    text-align: center;
    padding: 40px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20px;
    color: white;
  }

  .testimonial-quote {
    font-size: 1.4rem;
    font-weight: 600;
    font-style: italic;
    margin: 0;
    line-height: 1.6;
    position: relative;
  }

  .testimonial-quote::before {
    content: """;
    font-size: 3rem;
    position: absolute;
    top: -20px;
    left: -10px;
    opacity: 0.3;
  }

  .quote-author {
    font-size: 1.1rem;
    margin-top: 15px;
    opacity: 0.9;
  }

  .conclusion-section {
    margin: 40px 0;
    text-align: center;
  }

  .conclusion-text {
    font-size: 1.3rem;
    font-weight: 600;
    color: #007bff;
    padding: 20px;
    background: #e3f2fd;
    border-radius: 12px;
    border: 2px solid #bbdefb;
  }

  .tags-section {
    margin-top: 50px;
    padding-top: 30px;
    border-top: 2px solid #f8f9fa;
  }

  .tags-label {
    font-size: 1.1rem;
    font-weight: 600;
    color: #6c757d;
    margin-bottom: 15px;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .tag {
    background: #007bff;
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;
  }

  /* 모바일 반응형 */
  @media (max-width: 768px) {
    .blog-post-container {
      padding: 15px;
    }

    .blog-title {
      font-size: 2rem;
      line-height: 1.2;
    }

    .blog-meta {
      flex-direction: column;
      gap: 10px;
    }

    .blog-date::after {
      display: none;
    }

    .blog-content {
      font-size: 1.1rem;
    }

    .intro-text {
      font-size: 1.2rem;
      padding: 15px;
    }

    .content-text {
      font-size: 1.1rem;
    }

    .testimonial-quote {
      font-size: 1.2rem;
    }

    .conclusion-text {
      font-size: 1.2rem;
      padding: 15px;
    }

    .profile-image {
      max-width: 300px;
    }

    .content-image {
      max-width: 100%;
    }
  }

  @media (max-width: 480px) {
    .blog-title {
      font-size: 1.8rem;
    }

    .blog-content {
      font-size: 1rem;
    }

    .intro-text {
      font-size: 1.1rem;
    }

    .content-text {
      font-size: 1rem;
    }

    .testimonial-quote {
      font-size: 1.1rem;
    }

    .conclusion-text {
      font-size: 1.1rem;
    }
  }
</style>
`;

// 강석님 글 개선 함수
async function improveKangSeokPost() {
  try {
    console.log('🎨 강석님 글 모바일 친화적 개선 시작...');
    
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
    console.log(`📸 기존 이미지 수: ${(currentPost.content.match(/https:\/\/yyytjudftvpmcnppaymw\.supabase\.co/g) || []).length}개`);
    
    // 2. 새로운 featured_image (강석님 프로필 이미지로 변경)
    const newFeaturedImage = 'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/kang-seok-profile-94f4be_a394473798764e3a8010db94d36b0ad4-1757426972465.webp';
    
    // 3. 데이터베이스 업데이트
    const { data: updatedPost, error: updateError } = await supabase
      .from('blog_posts')
      .update({
        content: IMPROVED_CONTENT,
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
    
    console.log('\n🎉 강석님 글 모바일 친화적 개선 완료!');
    console.log('✅ MASSGOO 로고 제거 완료');
    console.log('✅ 모바일 친화적 레이아웃 적용');
    console.log('✅ 고급스럽고 큰 폰트 적용');
    console.log('✅ 반응형 디자인 적용');
    console.log('✅ Featured Image를 강석님 프로필로 변경');
    
    // 4. 결과 요약
    console.log('\n📊 개선 결과:');
    console.log(`✅ Content 개선: 완료`);
    console.log(`✅ Featured Image 변경: 완료`);
    console.log(`✅ 모바일 최적화: 완료`);
    console.log(`✅ 폰트 개선: 완료`);
    console.log(`✅ 로고 제거: 완료`);
    
    return updatedPost;
    
  } catch (error) {
    console.error('❌ 개선 실패:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  improveKangSeokPost()
    .then(result => {
      console.log('\n🎉 강석님 글 모바일 친화적 개선 성공!');
      console.log('이제 모바일에서도 고급스럽고 읽기 쉬운 글을 확인할 수 있습니다.');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 개선 실패:', error);
      process.exit(1);
    });
}

module.exports = { improveKangSeokPost };
