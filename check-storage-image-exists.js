// Storage에 이미지 파일이 실제로 존재하는지 확인하는 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkImageExists(imagePath) {
  try {
    console.log(`\n🔍 이미지 확인: ${imagePath}`);
    
    // 1. getPublicUrl로 URL 생성
    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(imagePath);
    
    console.log(`  URL: ${urlData.publicUrl}`);
    
    // 2. HEAD 요청으로 파일 존재 확인
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(urlData.publicUrl, { 
        method: 'HEAD',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const contentLength = response.headers.get('content-length');
        const contentType = response.headers.get('content-type');
        console.log(`  ✅ 파일 존재`);
        console.log(`  크기: ${contentLength} bytes`);
        console.log(`  타입: ${contentType}`);
        return true;
      } else {
        console.log(`  ❌ 파일 없음 (HTTP ${response.status})`);
        return false;
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.log(`  ⚠️ 타임아웃`);
      } else {
        console.log(`  ❌ 오류: ${fetchError.message}`);
      }
      return false;
    }
  } catch (error) {
    console.error(`  ❌ 확인 실패: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Storage 이미지 파일 존재 확인 시작...\n');
  
  // ID 309 게시물의 이미지 경로들
  const imagePaths = [
    'originals/blog/2025-09/309/september-funnel-1757899192753-secret-weapon-4-1.webp',
    'originals/blog/2025-09/309/september-funnel-1757899192933-secret-weapon-black.webp',
    'originals/blog/2025-09/309/september-funnel-1757899193551-vip-consultation-modern.webp',
    'originals/blog/2025-09/309/september-funnel-1757899193866-vip-swing-analysis-modern.webp',
    'originals/blog/2025-09/309/september-funnel-1757899193709-vip-discount-modern.webp',
    // 정상 작동하는 이미지도 확인
    'originals/blog/2025-09/309/1762700092329_image.jpeg',
    'originals/blog/2025-09/309/september-funnel-1757859192181-secret-force-gold-2.webp',
  ];
  
  const results = [];
  
  for (const imagePath of imagePaths) {
    const exists = await checkImageExists(imagePath);
    results.push({ path: imagePath, exists });
  }
  
  console.log('\n📊 결과 요약:');
  const existing = results.filter(r => r.exists);
  const missing = results.filter(r => !r.exists);
  
  console.log(`\n✅ 존재하는 파일: ${existing.length}개`);
  existing.forEach(r => {
    console.log(`  - ${r.path}`);
  });
  
  console.log(`\n❌ 없는 파일: ${missing.length}개`);
  missing.forEach(r => {
    console.log(`  - ${r.path}`);
  });
  
  // Storage에서 직접 파일 목록 확인
  console.log('\n🔍 Storage 폴더 목록 확인...');
  try {
    const { data: files, error } = await supabase.storage
      .from('blog-images')
      .list('originals/blog/2025-09/309', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (error) {
      console.error(`❌ 폴더 목록 조회 실패: ${error.message}`);
    } else {
      console.log(`📁 폴더 내 파일 개수: ${files?.length || 0}개`);
      if (files && files.length > 0) {
        console.log('\n📋 파일 목록:');
        files.forEach((file, i) => {
          console.log(`  ${i + 1}. ${file.name} (${file.metadata?.size || 0} bytes)`);
        });
      }
    }
  } catch (error) {
    console.error(`❌ 폴더 목록 조회 오류: ${error.message}`);
  }
  
  console.log('\n✅ 확인 완료!');
}

main().catch(console.error);



