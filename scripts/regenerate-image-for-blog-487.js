/**
 * 487 블로그의 특정 이미지 재생성
 * - ai-generated-1766559316717-1-1.jpg 이미지 재생성
 * - 전신 풀샷 강화 옵션 활성화
 * - 인물 앞 장애물 제거 옵션 활성화
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
          enhanceFullShot: promptData.enhanceFullShot || false,
          removeForegroundObstruction: promptData.removeForegroundObstruction || false,
        },
        logoOption: promptData.logoOption || 'full-brand',
        imageCount: 1,
        targetFolder: targetFolder,
        selectedLocation: promptData.selectedLocation,
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
 * 487 블로그의 특정 이미지 재생성
 */
async function regenerateImageForBlog487() {
  try {
    console.log('🚀 487 블로그 이미지 재생성 시작...\n');
    
    // 1. 487 블로그 포스트 확인
    const { data: blog487, error: blogError } = await supabase
      .from('blog_posts')
      .select('id, title, published_at')
      .eq('id', 487)
      .single();
    
    if (blogError || !blog487) {
      console.error('❌ 487 블로그를 찾을 수 없습니다:', blogError);
      return;
    }
    
    console.log('✅ 487 블로그 확인:');
    console.log(`   제목: ${blog487.title}\n`);
    
    const contentDate = blog487.published_at ? blog487.published_at.split('T')[0] : '2025-12-16';
    
    // 2. ai-generated-1766559316717-1-1.jpg 이미지 정보 확인
    // 이 이미지는 장면6 (성공 회복) 이미지로 추정
    const targetImageName = 'ai-generated-1766559316717-1-1.jpg';
    
    console.log(`🎨 이미지 재생성: ${targetImageName}\n`);
    console.log('📝 재생성 설정:');
    console.log('   - 장면: 6 (성공 회복)');
    console.log('   - 장소: 골프장 코스');
    console.log('   - 전신 풀샷 강화: 활성화');
    console.log('   - 인물 앞 장애물 제거: 활성화\n');
    
    // 3. 이미지 재생성 프롬프트
    const promptData = {
      prompt: '골드 톤, 60대 한국인 골퍼 2~4명이 골프장 코스에서 성취감과 만족감을 표현하는 전신 풀샷, 자연스러운 상호작용과 긍정적인 분위기, 성공을 함께 나누는 모습, 밝은 미소, MASSGOO 로고 명확',
      brandTone: 'senior_emotional',
      imageType: 'feed',
      logoOption: 'full-brand',
      sceneStep: 6,
      selectedLocation: 'golf-course', // 골프장 코스
      enhanceFullShot: true, // 전신 풀샷 강화 활성화
      removeForegroundObstruction: true, // 인물 앞 장애물 제거 활성화
    };
    
    console.log('🎨 AI 이미지 생성 중...\n');
    
    const images = await generateAIImages(promptData, blog487.id, contentDate);
    
    if (!images || images.length === 0) {
      console.error('❌ 이미지 생성 실패');
      return;
    }
    
    console.log('✅ 이미지 생성 완료!');
    console.log(`   생성된 이미지: ${images[0].path || images[0].url}\n`);
    
    // 4. 기존 이미지 삭제 (선택사항)
    const folderPath = `originals/blog/${contentDate.substring(0, 7)}/${blog487.id}`;
    const oldImagePath = `${folderPath}/${targetImageName}`;
    
    console.log(`🗑️ 기존 이미지 삭제 시도: ${oldImagePath}`);
    
    const { error: deleteError } = await supabase.storage
      .from('blog-images')
      .remove([oldImagePath]);
    
    if (deleteError) {
      console.warn('⚠️ 기존 이미지 삭제 실패 (무시):', deleteError.message);
    } else {
      console.log('✅ 기존 이미지 삭제 완료\n');
    }
    
    console.log('🎉 이미지 재생성 완료!');
    console.log(`\n📊 재생성 결과:`);
    console.log(`   새 이미지 경로: ${images[0].path || images[0].url}`);
    console.log(`   기존 이미지: ${targetImageName} (삭제됨)\n`);
    
  } catch (error) {
    console.error('❌ 이미지 재생성 오류:', error);
  }
}

// 스크립트 실행
regenerateImageForBlog487();

