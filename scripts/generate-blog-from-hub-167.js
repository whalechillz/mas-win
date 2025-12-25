/**
 * 167번 허브 콘텐츠를 이용해서 새로운 블로그 글 생성
 * - AI 이미지 생성 기능 활용 (고품질 이미지)
 * - golfdistillery.com 스타일 참고
 * - originals/blog/YYYY-MM/{blog-id}/ 경로에 저장
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * AI 이미지 생성 (generate-images API 사용)
 */
async function generateAIImages(promptData, blogId, dateStr) {
  try {
    const yearMonth = dateStr.substring(0, 7); // YYYY-MM
    const targetFolder = `originals/blog/${yearMonth}/${blogId}`;
    
    const response = await fetch('http://localhost:3000/api/kakao-content/generate-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompts: [{ prompt: promptData.prompt }],
        metadata: {
          account: promptData.brandTone === 'senior_emotional' ? 'account1' : 'account2',
          type: promptData.imageType || 'feed',
          date: dateStr,
          sceneStep: promptData.sceneStep,
        },
        logoOption: promptData.logoOption || 'full-brand',
        imageCount: 1,
        targetFolder: targetFolder,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '이미지 생성 실패');
    }

    const result = await response.json();
    
    return result.images || [];
  } catch (error) {
    console.error('❌ AI 이미지 생성 오류:', error);
    throw error;
  }
}

/**
 * 167번 허브 콘텐츠를 이용한 블로그 글 생성
 */
async function generateBlogFromHub167() {
  try {
    console.log('🚀 167번 허브 콘텐츠 기반 블로그 글 생성 시작...\n');
    
    // 1. 167번 허브 콘텐츠 찾기
    const { data: hub167, error: hubError } = await supabase
      .from('cc_content_calendar')
      .select('*')
      .eq('hub_order', 167)
      .eq('is_hub_content', true)
      .single();
    
    if (hubError || !hub167) {
      console.error('❌ 167번 허브 콘텐츠를 찾을 수 없습니다:', hubError);
      return;
    }
    
    console.log('✅ 167번 허브 콘텐츠 확인:');
    console.log(`   ID: ${hub167.id}`);
    console.log(`   제목: ${hub167.title}`);
    console.log(`   날짜: ${hub167.content_date || '없음'}\n`);
    
    // 2. 새로운 블로그 포스트 생성
    const contentDate = hub167.content_date || new Date().toISOString().split('T')[0];
    const yearMonth = contentDate.substring(0, 7); // YYYY-MM
    
    const slug = hub167.title.toLowerCase()
      .replace(/[^a-z0-9가-힣\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);
    
    console.log('📝 새로운 블로그 포스트 생성 중...');
    
    const { data: newBlogPost, error: blogError } = await supabase
      .from('blog_posts')
      .insert({
        title: hub167.title,
        slug: slug,
        content: hub167.content_body || '',
        excerpt: hub167.summary || '',
        status: 'draft',
        category: '골프 가이드',
        tags: ['비거리 향상', '골프 가이드'],
        published_at: contentDate,
        calendar_id: hub167.id,
        author: '마쓰구골프',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (blogError) {
      console.error('❌ 블로그 포스트 생성 실패:', blogError);
      return;
    }
    
    console.log('✅ 블로그 포스트 생성 완료!');
    console.log(`   블로그 ID: ${newBlogPost.id}`);
    console.log(`   제목: ${newBlogPost.title}\n`);
    
    // 3. AI 이미지 생성 (golfdistillery.com 스타일 참고)
    // 메인 이미지 1개 + 챕터 이미지 4개
    const imagePrompts = [
      {
        prompt: '골드 톤, 60대 한국인 시니어 골퍼가 골프장 코스에서 스윙하는 장면, 전신 풀샷, 자연스러운 포즈, 모자·상의·배경에 MASSGOO 로고 자연스럽게 2~3곳 노출, 프리미엄 골프 장비와 조명, 자연스러운 즐거운 분위기',
        brandTone: 'senior_emotional',
        imageType: 'feed',
        logoOption: 'full-brand',
        sceneStep: 1,
      },
      {
        prompt: '골드 톤, 50~70대 한국인 골퍼 2~4명이 골프장에서 웃으며 대화하는 장면, 전신 풀샷, 자연스러운 그룹 포즈, 따뜻한 조명, 배경에 MASSGOO 브랜딩, 자연스러운 일상 분위기',
        brandTone: 'senior_emotional',
        imageType: 'feed',
        logoOption: 'full-brand',
        sceneStep: 2,
      },
      {
        prompt: '골드 톤, 60대 한국인 골퍼가 골프 스윙 연습을 하며 깊이 고민하는 전신 풀샷, 허리·어깨 통증과 비거리 문제를 암시, MASSGOO 브랜딩은 은은히',
        brandTone: 'senior_emotional',
        imageType: 'feed',
        logoOption: 'full-brand',
        sceneStep: 3,
      },
      {
        prompt: '골드 톤, 50~60대 한국인 피터가 시니어 골퍼에게 태블릿 스윙 데이터를 설명하는 장면, 자연스러운 대화 포즈, 모자·상의·배경에 MASSGOO 로고 명확, 따뜻한 피팅 스튜디오',
        brandTone: 'senior_emotional',
        imageType: 'feed',
        logoOption: 'full-brand',
        sceneStep: 4,
      },
      {
        prompt: '골드 톤, 60대 한국인 골퍼 2~4명이 골프장 코스에서 성취감과 만족감을 표현하는 전신 풀샷, 자연스러운 상호작용과 긍정적인 분위기, 성공을 함께 나누는 모습, 밝은 미소, MASSGOO 로고 명확',
        brandTone: 'senior_emotional',
        imageType: 'feed',
        logoOption: 'full-brand',
        sceneStep: 6,
      },
    ];
    
    console.log('🎨 AI 이미지 생성 중... (5개 이미지)\n');
    
    const generatedImages = [];
    
    for (let i = 0; i < imagePrompts.length; i++) {
      const promptData = imagePrompts[i];
      console.log(`📸 이미지 ${i + 1}/5 생성 중: ${promptData.prompt.substring(0, 50)}...`);
      
      try {
        const images = await generateAIImages(promptData, newBlogPost.id, contentDate);
        if (images && images.length > 0) {
          generatedImages.push({
            ...images[0],
            imageType: i === 0 ? 'main' : `chapter-${i}`,
            sceneStep: promptData.sceneStep,
          });
          console.log(`   ✅ 이미지 ${i + 1} 생성 완료\n`);
        }
      } catch (error) {
        console.error(`   ❌ 이미지 ${i + 1} 생성 실패:`, error.message);
      }
    }
    
    // 4. 메인 이미지를 featured_image로 설정
    if (generatedImages.length > 0) {
      const mainImage = generatedImages.find(img => img.imageType === 'main') || generatedImages[0];
      
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({
          featured_image: mainImage.url || mainImage.path,
          updated_at: new Date().toISOString()
        })
        .eq('id', newBlogPost.id);
      
      if (updateError) {
        console.error('⚠️ featured_image 업데이트 실패:', updateError);
      } else {
        console.log('✅ featured_image 업데이트 완료\n');
      }
    }
    
    // 5. 허브 콘텐츠의 channel_status 업데이트
    const currentChannels = hub167.channel_status || {};
    const currentBlogChannel = currentChannels.blog || {};
    const existingPosts = currentBlogChannel.posts || [];
    
    const updatedPosts = [...new Set([...existingPosts, newBlogPost.id])];
    
    const updatedChannels = {
      ...currentChannels,
      blog: {
        status: '연결됨',
        post_id: newBlogPost.id,
        primary_post_id: newBlogPost.id,
        posts: updatedPosts,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
    
    const { error: channelUpdateError } = await supabase
      .from('cc_content_calendar')
      .update({
        channel_status: updatedChannels,
        updated_at: new Date().toISOString()
      })
      .eq('id', hub167.id);
    
    if (channelUpdateError) {
      console.error('⚠️ channel_status 업데이트 실패:', channelUpdateError);
    } else {
      console.log('✅ channel_status 업데이트 완료\n');
    }
    
    // 6. 블로그 포스트의 calendar_id 업데이트
    const { error: calendarUpdateError } = await supabase
      .from('blog_posts')
      .update({
        calendar_id: hub167.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', newBlogPost.id);
    
    if (calendarUpdateError) {
      console.error('⚠️ calendar_id 업데이트 실패:', calendarUpdateError);
    } else {
      console.log('✅ calendar_id 업데이트 완료\n');
    }
    
    console.log('🎉 블로그 글 생성 완료!');
    console.log(`\n📊 생성 결과:`);
    console.log(`   블로그 ID: ${newBlogPost.id}`);
    console.log(`   제목: ${newBlogPost.title}`);
    console.log(`   생성된 이미지: ${generatedImages.length}개`);
    console.log(`   이미지 경로: originals/blog/${yearMonth}/${newBlogPost.id}/`);
    console.log(`   허브 ID: ${hub167.id}`);
    console.log(`   허브 순번: ${hub167.hub_order}\n`);
    
  } catch (error) {
    console.error('❌ 블로그 글 생성 오류:', error);
  }
}

// 스크립트 실행
generateBlogFromHub167();

