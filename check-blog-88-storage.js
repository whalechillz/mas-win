// ID 88 게시물의 이미지 Storage 확인 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStorage() {
  try {
    console.log('🔍 Storage에서 ID 88 게시물 이미지 찾기...\n');

    // 찾아야 할 파일명들
    const targetFiles = [
      'hero-summer-golf-mas.jpg',
      'SALUTE21-01.jpg',
      'cooling-sleeves.jpg',
      'golfer_avatar_512x512_01.jpg',
      'golfer_avatar_512x512_02.jpg',
      'golfer_avatar_512x512_03.jpg',
      'hero-summer-golf-mas-wide.jpg'
    ];

    console.log(`📋 찾을 파일: ${targetFiles.length}개\n`);

    // 1. originals/blog/2025-07/88 폴더 확인
    console.log('1️⃣ originals/blog/2025-07/88 폴더 확인...');
    const { data: folder88, error: folder88Error } = await supabase.storage
      .from('blog-images')
      .list('originals/blog/2025-07/88', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (folder88Error) {
      console.log(`  ❌ 폴더 조회 실패: ${folder88Error.message}`);
    } else {
      console.log(`  📁 폴더 내 파일: ${folder88?.length || 0}개`);
      if (folder88 && folder88.length > 0) {
        folder88.forEach((file, i) => {
          console.log(`    ${i + 1}. ${file.name}`);
        });
      }
    }
    console.log('');

    // 2. originals/blog/2025-07 폴더 확인
    console.log('2️⃣ originals/blog/2025-07 폴더 확인...');
    const { data: folder07, error: folder07Error } = await supabase.storage
      .from('blog-images')
      .list('originals/blog/2025-07', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (folder07Error) {
      console.log(`  ❌ 폴더 조회 실패: ${folder07Error.message}`);
    } else {
      console.log(`  📁 폴더 내 항목: ${folder07?.length || 0}개`);
      if (folder07 && folder07.length > 0) {
        folder07.forEach((item, i) => {
          console.log(`    ${i + 1}. ${item.name} ${item.id ? '(파일)' : '(폴더)'}`);
        });
      }
    }
    console.log('');

    // 3. campaigns 폴더 확인
    console.log('3️⃣ campaigns 폴더 확인...');
    const { data: campaigns, error: campaignsError } = await supabase.storage
      .from('blog-images')
      .list('campaigns', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (campaignsError) {
      console.log(`  ❌ 폴더 조회 실패: ${campaignsError.message}`);
    } else {
      console.log(`  📁 폴더 내 항목: ${campaigns?.length || 0}개`);
      if (campaigns && campaigns.length > 0) {
        campaigns.forEach((item, i) => {
          console.log(`    ${i + 1}. ${item.name} ${item.id ? '(파일)' : '(폴더)'}`);
        });
      }
    }
    console.log('');

    // 4. campaigns/2025-07 폴더 확인
    console.log('4️⃣ campaigns/2025-07 폴더 확인...');
    const { data: campaigns07, error: campaigns07Error } = await supabase.storage
      .from('blog-images')
      .list('campaigns/2025-07', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (campaigns07Error) {
      console.log(`  ❌ 폴더 조회 실패: ${campaigns07Error.message}`);
    } else {
      console.log(`  📁 폴더 내 파일: ${campaigns07?.length || 0}개`);
      if (campaigns07 && campaigns07.length > 0) {
        campaigns07.forEach((file, i) => {
          console.log(`    ${i + 1}. ${file.name}`);
        });
      }
    }
    console.log('');

    // 5. 파일명으로 전체 검색
    console.log('5️⃣ 파일명으로 전체 검색...');
    for (const fileName of targetFiles) {
      console.log(`\n  🔍 "${fileName}" 검색 중...`);
      
      // 루트에서 검색
      const { data: allFiles, error: searchError } = await supabase.storage
        .from('blog-images')
        .list('', {
          limit: 1000,
          search: fileName
        });
      
      if (searchError) {
        console.log(`    ❌ 검색 실패: ${searchError.message}`);
      } else if (allFiles && allFiles.length > 0) {
        console.log(`    ✅ 발견: ${allFiles.length}개`);
        allFiles.forEach((file, i) => {
          const fullPath = file.name.includes('/') ? file.name : `(경로 불명)/${file.name}`;
          console.log(`      ${i + 1}. ${fullPath}`);
        });
      } else {
        console.log(`    ❌ 발견되지 않음`);
      }
    }
    console.log('');

    // 6. originals 폴더 전체 검색
    console.log('6️⃣ originals 폴더 전체 검색...');
    const { data: originals, error: originalsError } = await supabase.storage
      .from('blog-images')
      .list('originals', {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (originalsError) {
      console.log(`  ❌ 폴더 조회 실패: ${originalsError.message}`);
    } else {
      console.log(`  📁 originals 폴더 내 항목: ${originals?.length || 0}개`);
      // 파일명이 포함된 항목만 표시
      const matching = originals?.filter(item => 
        targetFiles.some(fileName => item.name.includes(fileName))
      );
      
      if (matching && matching.length > 0) {
        console.log(`  ✅ 일치하는 항목: ${matching.length}개`);
        matching.forEach((item, i) => {
          console.log(`    ${i + 1}. ${item.name} ${item.id ? '(파일)' : '(폴더)'}`);
        });
      } else {
        console.log(`  ❌ 일치하는 항목 없음`);
      }
    }
    console.log('');

    console.log('✅ 확인 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkStorage().catch(console.error);

