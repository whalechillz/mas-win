/**
 * 카카오 콘텐츠 중복 확인 스크립트
 * 11월 22일~30일 account2(마스텍) 프로필/피드 중복 확인
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDuplicates() {
  console.log('🔍 카카오 콘텐츠 중복 확인 시작...\n');
  console.log('📅 기간: 2025-11-22 ~ 2025-11-30');
  console.log('👤 계정: account2 (MASGOLF Tech)\n');

  try {
    // 프로필 데이터 조회
    const { data: profileData, error: profileError } = await supabase
      .from('kakao_profile_content')
      .select('date, message, background_prompt, profile_prompt, background_image_url, profile_image_url')
      .eq('account', 'account2')
      .gte('date', '2025-11-22')
      .lte('date', '2025-11-30')
      .order('date', { ascending: true });

    if (profileError) {
      console.error('❌ 프로필 데이터 조회 오류:', profileError);
      return;
    }

    // 피드 데이터 조회
    const { data: feedData, error: feedError } = await supabase
      .from('kakao_feed_content')
      .select('date, caption, image_prompt, image_url')
      .eq('account', 'account2')
      .gte('date', '2025-11-22')
      .lte('date', '2025-11-30')
      .order('date', { ascending: true });

    if (feedError) {
      console.error('❌ 피드 데이터 조회 오류:', feedError);
      return;
    }

    console.log(`📊 프로필 데이터: ${profileData.length}개`);
    console.log(`📊 피드 데이터: ${feedData.length}개\n`);

    // 프로필 메시지 중복 확인
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 프로필 메시지 중복 확인');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const messageMap = new Map();
    profileData.forEach(item => {
      if (item.message && item.message.trim()) {
        const key = item.message.trim();
        if (!messageMap.has(key)) {
          messageMap.set(key, []);
        }
        messageMap.get(key).push(item.date);
      }
    });

    const duplicateMessages = Array.from(messageMap.entries())
      .filter(([_, dates]) => dates.length > 1)
      .sort((a, b) => b[1].length - a[1].length);

    if (duplicateMessages.length > 0) {
      console.log(`⚠️  중복된 메시지: ${duplicateMessages.length}개\n`);
      duplicateMessages.forEach(([message, dates]) => {
        console.log(`📌 "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
        console.log(`   날짜: ${dates.join(', ')} (${dates.length}회)\n`);
      });
    } else {
      console.log('✅ 중복된 메시지 없음\n');
    }

    // 프로필 프롬프트 중복 확인
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎨 프로필 프롬프트 중복 확인');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const backgroundPromptMap = new Map();
    const profilePromptMap = new Map();
    
    profileData.forEach(item => {
      if (item.background_prompt && item.background_prompt.trim()) {
        const key = item.background_prompt.trim();
        if (!backgroundPromptMap.has(key)) {
          backgroundPromptMap.set(key, []);
        }
        backgroundPromptMap.get(key).push(item.date);
      }
      
      if (item.profile_prompt && item.profile_prompt.trim()) {
        const key = item.profile_prompt.trim();
        if (!profilePromptMap.has(key)) {
          profilePromptMap.set(key, []);
        }
        profilePromptMap.get(key).push(item.date);
      }
    });

    const duplicateBackgroundPrompts = Array.from(backgroundPromptMap.entries())
      .filter(([_, dates]) => dates.length > 1)
      .sort((a, b) => b[1].length - a[1].length);
    
    const duplicateProfilePrompts = Array.from(profilePromptMap.entries())
      .filter(([_, dates]) => dates.length > 1)
      .sort((a, b) => b[1].length - a[1].length);

    if (duplicateBackgroundPrompts.length > 0) {
      console.log(`⚠️  중복된 배경 프롬프트: ${duplicateBackgroundPrompts.length}개\n`);
      duplicateBackgroundPrompts.slice(0, 5).forEach(([prompt, dates]) => {
        console.log(`📌 "${prompt.substring(0, 80)}${prompt.length > 80 ? '...' : ''}"`);
        console.log(`   날짜: ${dates.join(', ')} (${dates.length}회)\n`);
      });
    } else {
      console.log('✅ 중복된 배경 프롬프트 없음\n');
    }

    if (duplicateProfilePrompts.length > 0) {
      console.log(`⚠️  중복된 프로필 프롬프트: ${duplicateProfilePrompts.length}개\n`);
      duplicateProfilePrompts.slice(0, 5).forEach(([prompt, dates]) => {
        console.log(`📌 "${prompt.substring(0, 80)}${prompt.length > 80 ? '...' : ''}"`);
        console.log(`   날짜: ${dates.join(', ')} (${dates.length}회)\n`);
      });
    } else {
      console.log('✅ 중복된 프로필 프롬프트 없음\n');
    }

    // 프로필 이미지 URL 중복 확인
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🖼️  프로필 이미지 URL 중복 확인');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const backgroundImageMap = new Map();
    const profileImageMap = new Map();
    
    profileData.forEach(item => {
      if (item.background_image_url) {
        if (!backgroundImageMap.has(item.background_image_url)) {
          backgroundImageMap.set(item.background_image_url, []);
        }
        backgroundImageMap.get(item.background_image_url).push(item.date);
      }
      
      if (item.profile_image_url) {
        if (!profileImageMap.has(item.profile_image_url)) {
          profileImageMap.set(item.profile_image_url, []);
        }
        profileImageMap.get(item.profile_image_url).push(item.date);
      }
    });

    const duplicateBackgroundImages = Array.from(backgroundImageMap.entries())
      .filter(([_, dates]) => dates.length > 1)
      .sort((a, b) => b[1].length - a[1].length);
    
    const duplicateProfileImages = Array.from(profileImageMap.entries())
      .filter(([_, dates]) => dates.length > 1)
      .sort((a, b) => b[1].length - a[1].length);

    if (duplicateBackgroundImages.length > 0) {
      console.log(`⚠️  중복된 배경 이미지: ${duplicateBackgroundImages.length}개\n`);
      duplicateBackgroundImages.slice(0, 3).forEach(([url, dates]) => {
        console.log(`📌 ${url.substring(0, 80)}${url.length > 80 ? '...' : ''}`);
        console.log(`   날짜: ${dates.join(', ')} (${dates.length}회)\n`);
      });
    } else {
      console.log('✅ 중복된 배경 이미지 없음\n');
    }

    if (duplicateProfileImages.length > 0) {
      console.log(`⚠️  중복된 프로필 이미지: ${duplicateProfileImages.length}개\n`);
      duplicateProfileImages.slice(0, 3).forEach(([url, dates]) => {
        console.log(`📌 ${url.substring(0, 80)}${url.length > 80 ? '...' : ''}`);
        console.log(`   날짜: ${dates.join(', ')} (${dates.length}회)\n`);
      });
    } else {
      console.log('✅ 중복된 프로필 이미지 없음\n');
    }

    // 피드 캡션 중복 확인
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 피드 캡션 중복 확인');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const captionMap = new Map();
    feedData.forEach(item => {
      if (item.caption && item.caption.trim()) {
        const key = item.caption.trim();
        if (!captionMap.has(key)) {
          captionMap.set(key, []);
        }
        captionMap.get(key).push(item.date);
      }
    });

    const duplicateCaptions = Array.from(captionMap.entries())
      .filter(([_, dates]) => dates.length > 1)
      .sort((a, b) => b[1].length - a[1].length);

    if (duplicateCaptions.length > 0) {
      console.log(`⚠️  중복된 캡션: ${duplicateCaptions.length}개\n`);
      duplicateCaptions.forEach(([caption, dates]) => {
        console.log(`📌 "${caption.substring(0, 50)}${caption.length > 50 ? '...' : ''}"`);
        console.log(`   날짜: ${dates.join(', ')} (${dates.length}회)\n`);
      });
    } else {
      console.log('✅ 중복된 캡션 없음\n');
    }

    // 피드 프롬프트 중복 확인
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎨 피드 프롬프트 중복 확인');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const feedPromptMap = new Map();
    feedData.forEach(item => {
      if (item.image_prompt && item.image_prompt.trim()) {
        const key = item.image_prompt.trim();
        if (!feedPromptMap.has(key)) {
          feedPromptMap.set(key, []);
        }
        feedPromptMap.get(key).push(item.date);
      }
    });

    const duplicateFeedPrompts = Array.from(feedPromptMap.entries())
      .filter(([_, dates]) => dates.length > 1)
      .sort((a, b) => b[1].length - a[1].length);

    if (duplicateFeedPrompts.length > 0) {
      console.log(`⚠️  중복된 피드 프롬프트: ${duplicateFeedPrompts.length}개\n`);
      duplicateFeedPrompts.slice(0, 5).forEach(([prompt, dates]) => {
        console.log(`📌 "${prompt.substring(0, 80)}${prompt.length > 80 ? '...' : ''}"`);
        console.log(`   날짜: ${dates.join(', ')} (${dates.length}회)\n`);
      });
    } else {
      console.log('✅ 중복된 피드 프롬프트 없음\n');
    }

    // 피드 이미지 URL 중복 확인
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🖼️  피드 이미지 URL 중복 확인');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const feedImageMap = new Map();
    feedData.forEach(item => {
      if (item.image_url) {
        if (!feedImageMap.has(item.image_url)) {
          feedImageMap.set(item.image_url, []);
        }
        feedImageMap.get(item.image_url).push(item.date);
      }
    });

    const duplicateFeedImages = Array.from(feedImageMap.entries())
      .filter(([_, dates]) => dates.length > 1)
      .sort((a, b) => b[1].length - a[1].length);

    if (duplicateFeedImages.length > 0) {
      console.log(`⚠️  중복된 피드 이미지: ${duplicateFeedImages.length}개\n`);
      duplicateFeedImages.slice(0, 3).forEach(([url, dates]) => {
        console.log(`📌 ${url.substring(0, 80)}${url.length > 80 ? '...' : ''}`);
        console.log(`   날짜: ${dates.join(', ')} (${dates.length}회)\n`);
      });
    } else {
      console.log('✅ 중복된 피드 이미지 없음\n');
    }

    // 요약
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 중복 요약');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`프로필 메시지 중복: ${duplicateMessages.length}개`);
    console.log(`프로필 배경 프롬프트 중복: ${duplicateBackgroundPrompts.length}개`);
    console.log(`프로필 프로필 프롬프트 중복: ${duplicateProfilePrompts.length}개`);
    console.log(`프로필 배경 이미지 중복: ${duplicateBackgroundImages.length}개`);
    console.log(`프로필 프로필 이미지 중복: ${duplicateProfileImages.length}개`);
    console.log(`피드 캡션 중복: ${duplicateCaptions.length}개`);
    console.log(`피드 프롬프트 중복: ${duplicateFeedPrompts.length}개`);
    console.log(`피드 이미지 중복: ${duplicateFeedImages.length}개\n`);

    const totalDuplicates = 
      duplicateMessages.length +
      duplicateBackgroundPrompts.length +
      duplicateProfilePrompts.length +
      duplicateBackgroundImages.length +
      duplicateProfileImages.length +
      duplicateCaptions.length +
      duplicateFeedPrompts.length +
      duplicateFeedImages.length;

    if (totalDuplicates > 0) {
      console.log(`⚠️  총 ${totalDuplicates}개의 중복 항목이 발견되었습니다.`);
      console.log('💡 수정이 필요할 수 있습니다.\n');
    } else {
      console.log('✅ 중복 항목이 없습니다.\n');
    }

    // 실제 데이터 출력 (상세 확인용)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 실제 데이터 상세 확인');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n📝 프로필 메시지:');
    profileData.forEach(item => {
      console.log(`  ${item.date}: ${item.message ? `"${item.message.substring(0, 60)}${item.message.length > 60 ? '...' : ''}"` : '(없음)'}`);
    });

    console.log('\n📝 피드 캡션:');
    feedData.forEach(item => {
      console.log(`  ${item.date}: ${item.caption ? `"${item.caption.substring(0, 60)}${item.caption.length > 60 ? '...' : ''}"` : '(없음)'}`);
    });

    console.log('\n🎨 프로필 배경 프롬프트 (처음 100자):');
    profileData.forEach(item => {
      const prompt = item.background_prompt || '(없음)';
      console.log(`  ${item.date}: ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}`);
    });

    console.log('\n🎨 피드 프롬프트 (처음 100자):');
    feedData.forEach(item => {
      const prompt = item.image_prompt || '(없음)';
      console.log(`  ${item.date}: ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}`);
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkDuplicates();

