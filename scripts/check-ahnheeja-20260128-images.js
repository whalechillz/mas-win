/**
 * 안희자 고객의 2026-01-28 이미지 확인 스크립트
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

async function checkAhnheeja20260128Images() {
  console.log('🔍 안희자 고객의 2026-01-28 이미지 확인...\n');

  try {
    // 1. 안희자 고객 정보 조회
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name, folder_name')
      .ilike('name', '%안희자%')
      .limit(5);

    if (!customers || customers.length === 0) {
      console.error('❌ 안희자 고객을 찾을 수 없습니다.');
      return;
    }

    console.log(`✅ 안희자 고객 ${customers.length}명 발견:\n`);
    customers.forEach((c, idx) => {
      console.log(`   [${idx + 1}] ID: ${c.id}, 이름: ${c.name}, 폴더: ${c.folder_name || '없음'}`);
    });
    console.log('');

    // 각 고객별로 확인
    for (const customer of customers) {
      const customerTag = `customer-${customer.id}`;
      const folderName = customer.folder_name || `customer-${String(customer.id).padStart(3, '0')}`;
      
      console.log(`\n📹 고객 "${customer.name}" (ID: ${customer.id}, 폴더: ${folderName})의 2026-01-28 이미지 확인:`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // 2. 2026-01-28 관련 이미지 조회 (여러 방법)
      console.log('🔍 2026-01-28 관련 이미지 조회 중...\n');
      
      // 방법 1: file_path로 조회
      const expectedPath = `originals/customers/${folderName}/2026-01-28`;
      const { data: imagesByPath, error: pathError } = await supabase
        .from('image_assets')
        .select('id, filename, file_path, cdn_url, ai_tags, created_at')
        .ilike('file_path', `${expectedPath}%`)
        .order('created_at', { ascending: false });

      // 방법 2: customer 태그로 조회
      const { data: imagesByTag, error: tagError } = await supabase
        .from('image_assets')
        .select('id, filename, file_path, cdn_url, ai_tags, created_at')
        .contains('ai_tags', [customerTag])
        .order('created_at', { ascending: false });

      // 방법 3: filename으로 조회
      const { data: imagesByFilename, error: filenameError } = await supabase
        .from('image_assets')
        .select('id, filename, file_path, cdn_url, ai_tags, created_at')
        .or(`filename.ilike.%20260128%,filename.ilike.%2026-01-28%`)
        .order('created_at', { ascending: false });

      console.log(`📊 조회 결과:`);
      console.log(`   - file_path로 조회: ${imagesByPath?.length || 0}개`);
      console.log(`   - customer 태그로 조회: ${imagesByTag?.length || 0}개`);
      console.log(`   - filename으로 조회: ${imagesByFilename?.length || 0}개\n`);

      // 3. 2026-01-28 이미지 필터링
      const allImages = new Map();
      
      // file_path로 조회한 이미지
      if (imagesByPath && imagesByPath.length > 0) {
        imagesByPath.forEach(img => {
          const dateFromPath = img.file_path?.match(/(\d{4}-\d{2}-\d{2})/)?.[1];
          if (dateFromPath === '2026-01-28') {
            allImages.set(img.id, { ...img, source: 'file_path' });
          }
        });
      }

      // customer 태그로 조회한 이미지
      if (imagesByTag && imagesByTag.length > 0) {
        imagesByTag.forEach(img => {
          const dateFromPath = img.file_path?.match(/(\d{4}-\d{2}-\d{2})/)?.[1];
          const dateFromFilename = img.filename?.match(/(\d{4})(\d{2})(\d{2})/)?.[0];
          const dateFromFilenameFormatted = dateFromFilename ? `${dateFromFilename.substring(0,4)}-${dateFromFilename.substring(4,6)}-${dateFromFilename.substring(6,8)}` : null;
          const date = dateFromPath || dateFromFilenameFormatted;
          
          if (date === '2026-01-28') {
            if (!allImages.has(img.id)) {
              allImages.set(img.id, { ...img, source: 'customer_tag' });
            } else {
              allImages.get(img.id).source += ', customer_tag';
            }
          }
        });
      }

      // filename으로 조회한 이미지
      if (imagesByFilename && imagesByFilename.length > 0) {
        imagesByFilename.forEach(img => {
          const dateFromPath = img.file_path?.match(/(\d{4}-\d{2}-\d{2})/)?.[1];
          const dateFromFilename = img.filename?.match(/(\d{4})(\d{2})(\d{2})/)?.[0];
          const dateFromFilenameFormatted = dateFromFilename ? `${dateFromFilename.substring(0,4)}-${dateFromFilename.substring(4,6)}-${dateFromFilename.substring(6,8)}` : null;
          const date = dateFromPath || dateFromFilenameFormatted;
          
          if (date === '2026-01-28') {
            if (!allImages.has(img.id)) {
              allImages.set(img.id, { ...img, source: 'filename' });
            } else {
              allImages.get(img.id).source += ', filename';
            }
          }
        });
      }

      const filteredImages = Array.from(allImages.values());
      console.log(`✅ 2026-01-28 이미지 ${filteredImages.length}개 발견:\n`);

      if (filteredImages.length === 0) {
        console.log('   ⚠️ 2026-01-28 이미지가 없습니다.\n');
        continue;
      }

      // 4. 각 이미지 상세 정보 출력
      for (const img of filteredImages) {
        console.log(`📸 ${img.filename || '파일명 없음'}`);
        console.log(`   ID: ${img.id}`);
        console.log(`   file_path: ${img.file_path || '없음'}`);
        console.log(`   cdn_url: ${img.cdn_url ? img.cdn_url.substring(0, 100) + '...' : '없음'}`);
        console.log(`   ai_tags: ${JSON.stringify(img.ai_tags || [])}`);
        
        // 날짜 추출
        const dateFromPath = img.file_path?.match(/(\d{4}-\d{2}-\d{2})/)?.[1];
        const dateFromFilename = img.filename?.match(/(\d{4})(\d{2})(\d{2})/)?.[0];
        const dateFromFilenameFormatted = dateFromFilename ? `${dateFromFilename.substring(0,4)}-${dateFromFilename.substring(4,6)}-${dateFromFilename.substring(6,8)}` : null;
        console.log(`   추출된 날짜: ${dateFromPath || dateFromFilenameFormatted || '없음'}`);
        
        // 고객 태그 확인
        const hasCustomerTag = Array.isArray(img.ai_tags) && img.ai_tags.includes(customerTag);
        console.log(`   고객 태그 (${customerTag}): ${hasCustomerTag ? '✅ 있음' : '❌ 없음'}`);
        console.log(`   조회 소스: ${img.source}`);
        console.log('');
      }

      // 5. customer 태그가 없는 이미지 확인
      const imagesWithoutTag = filteredImages.filter(img => {
        const tags = Array.isArray(img.ai_tags) ? img.ai_tags : [];
        return !tags.includes(customerTag);
      });

      if (imagesWithoutTag.length > 0) {
        console.log(`⚠️ customer 태그가 없는 이미지 ${imagesWithoutTag.length}개:\n`);
        imagesWithoutTag.forEach(img => {
          console.log(`   - ${img.filename || '파일명 없음'} (ID: ${img.id})`);
        });
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

checkAhnheeja20260128Images().catch(console.error);
