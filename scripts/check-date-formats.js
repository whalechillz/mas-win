/**
 * 데이터베이스와 Storage에서 사용되는 날짜 형식 확인
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDateFormats() {
  console.log('🔍 날짜 형식 확인 중...\n');

  try {
    // 1. file_path에서 날짜 형식 확인
    const { data: images, error: imagesError } = await supabase
      .from('image_assets')
      .select('file_path, ai_tags')
      .ilike('file_path', 'originals/customers/%')
      .limit(5000);

    if (imagesError) {
      console.error('❌ 이미지 조회 실패:', imagesError);
      return;
    }

    const dateFormats = {
      dotFormat: new Set(), // YYYY.MM.DD
      dashFormat: new Set(), // YYYY-MM-DD
      other: new Set()
    };

    const aiTagFormats = {
      dotFormat: new Set(), // visit-YYYY.MM.DD
      dashFormat: new Set(), // visit-YYYY-MM-DD
      other: new Set()
    };

    images.forEach((img) => {
      const filePath = img.file_path || '';
      
      // file_path에서 날짜 추출
      const dotMatch = filePath.match(/\/(\d{4}\.\d{2}\.\d{2})\//);
      const dashMatch = filePath.match(/\/(\d{4}-\d{2}-\d{2})\//);
      const dotEndMatch = filePath.match(/\/(\d{4}\.\d{2}\.\d{2})$/);
      const dashEndMatch = filePath.match(/\/(\d{4}-\d{2}-\d{2})$/);

      if (dotMatch || dotEndMatch) {
        const date = dotMatch ? dotMatch[1] : dotEndMatch[1];
        dateFormats.dotFormat.add(date);
      } else if (dashMatch || dashEndMatch) {
        const date = dashMatch ? dashMatch[1] : dashEndMatch[1];
        dateFormats.dashFormat.add(date);
      }

      // ai_tags에서 visit- 날짜 추출
      const tags = img.ai_tags || [];
      if (Array.isArray(tags)) {
        tags.forEach((tag) => {
          if (typeof tag === 'string' && tag.startsWith('visit-')) {
            const dateStr = tag.replace('visit-', '');
            if (/^\d{4}\.\d{2}\.\d{2}$/.test(dateStr)) {
              aiTagFormats.dotFormat.add(dateStr);
            } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
              aiTagFormats.dashFormat.add(dateStr);
            } else {
              aiTagFormats.other.add(tag);
            }
          }
        });
      }
    });

    console.log('📊 file_path 날짜 형식:');
    console.log(`   점 형식 (YYYY.MM.DD): ${dateFormats.dotFormat.size}개 고유 날짜`);
    if (dateFormats.dotFormat.size > 0) {
      console.log(`   예시: ${Array.from(dateFormats.dotFormat).slice(0, 5).join(', ')}`);
    }
    console.log(`   대시 형식 (YYYY-MM-DD): ${dateFormats.dashFormat.size}개 고유 날짜`);
    if (dateFormats.dashFormat.size > 0) {
      console.log(`   예시: ${Array.from(dateFormats.dashFormat).slice(0, 5).join(', ')}`);
    }
    console.log(`   기타: ${dateFormats.other.size}개\n`);

    console.log('📊 ai_tags visit- 날짜 형식:');
    console.log(`   점 형식 (visit-YYYY.MM.DD): ${aiTagFormats.dotFormat.size}개 고유 날짜`);
    if (aiTagFormats.dotFormat.size > 0) {
      console.log(`   예시: ${Array.from(aiTagFormats.dotFormat).slice(0, 5).join(', ')}`);
    }
    console.log(`   대시 형식 (visit-YYYY-MM-DD): ${aiTagFormats.dashFormat.size}개 고유 날짜`);
    if (aiTagFormats.dashFormat.size > 0) {
      console.log(`   예시: ${Array.from(aiTagFormats.dashFormat).slice(0, 5).join(', ')}`);
    }
    console.log(`   기타: ${aiTagFormats.other.size}개\n`);

    // 2. Storage 폴더 구조 확인 (샘플)
    console.log('📦 Storage 폴더 구조 확인 (샘플)...\n');
    const { data: folders, error: foldersError } = await supabase.storage
      .from('blog-images')
      .list('originals/customers', {
        limit: 10,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (!foldersError && folders) {
      for (const folder of folders.slice(0, 3)) {
        if (folder.name) {
          const { data: subFolders } = await supabase.storage
            .from('blog-images')
            .list(`originals/customers/${folder.name}`, {
              limit: 10
            });
          
          if (subFolders) {
            const dateFolders = subFolders.filter(f => 
              /^\d{4}[.-]\d{2}[.-]\d{2}$/.test(f.name)
            );
            if (dateFolders.length > 0) {
              console.log(`   ${folder.name}:`);
              dateFolders.slice(0, 5).forEach(f => {
                console.log(`     - ${f.name}`);
              });
            }
          }
        }
      }
    }

    // 3. 마이그레이션 필요성 판단
    console.log('\n📋 마이그레이션 필요성:');
    if (dateFormats.dotFormat.size > 0 || aiTagFormats.dotFormat.size > 0) {
      console.log('   ✅ 마이그레이션 필요: 점 형식(YYYY.MM.DD)이 사용 중입니다.');
      console.log(`   - file_path: ${dateFormats.dotFormat.size}개 고유 날짜`);
      console.log(`   - ai_tags: ${aiTagFormats.dotFormat.size}개 고유 날짜`);
    } else {
      console.log('   ℹ️  모든 날짜가 대시 형식(YYYY-MM-DD)으로 통일되어 있습니다.');
    }

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

checkDateFormats().catch(console.error);
