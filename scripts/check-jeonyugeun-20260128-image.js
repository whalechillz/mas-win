/**
 * 전유근 고객의 2026-01-28 이미지 확인 스크립트
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

async function checkJeonyugeun20260128Image() {
  console.log('🔍 전유근 고객의 2026-01-28 이미지 확인...\n');

  try {
    // 1. 전유근 고객 정보 조회
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name, folder_name')
      .ilike('name', '%전유근%')
      .limit(1);

    if (!customers || customers.length === 0) {
      console.error('❌ 전유근 고객을 찾을 수 없습니다.');
      return;
    }

    const customer = customers[0];
    const customerTag = `customer-${customer.id}`;
    console.log(`✅ 고객: ${customer.name} (ID: ${customer.id}, 폴더: ${customer.folder_name})\n`);

    // 2. jeonyugeun-S1-20260128-01.webp 이미지 조회
    console.log('📹 jeonyugeun-S1-20260128-01.webp 이미지 조회 중...\n');
    
    const { data: images, error: imageError } = await supabase
      .from('image_assets')
      .select('id, filename, file_path, cdn_url, ai_tags, created_at')
      .or(`filename.ilike.%jeonyugeun-S1-20260128-01.webp%,filename.ilike.%jeonyugeun_s1_20260128_01.webp%,cdn_url.ilike.%jeonyugeun-S1-20260128-01.webp%,cdn_url.ilike.%jeonyugeun_s1_20260128_01.webp%`)
      .limit(10);

    if (imageError) {
      console.error('❌ 이미지 조회 오류:', imageError);
      return;
    }

    if (!images || images.length === 0) {
      console.log('❌ jeonyugeun-S1-20260128-01.webp 이미지를 찾을 수 없습니다.\n');
      
      // 파일명 패턴으로 다시 검색
      console.log('🔍 파일명 패턴으로 재검색 중...\n');
      const { data: allImages } = await supabase
        .from('image_assets')
        .select('id, filename, file_path, cdn_url, ai_tags')
        .or('filename.ilike.%20260128%,cdn_url.ilike.%20260128%,file_path.ilike.%20260128%')
        .limit(20);
      
      if (allImages && allImages.length > 0) {
        console.log(`✅ 20260128 관련 이미지 ${allImages.length}개 발견:\n`);
        allImages.forEach((img, idx) => {
          console.log(`   [${idx + 1}] ${img.filename || '파일명 없음'}`);
          console.log(`       ID: ${img.id}`);
          console.log(`       file_path: ${img.file_path || '없음'}`);
          console.log(`       ai_tags: ${JSON.stringify(img.ai_tags || [])}`);
          console.log(`       customer 태그 포함: ${Array.isArray(img.ai_tags) && img.ai_tags.includes(customerTag)}`);
          
          // 날짜 추출
          const dateFromPath = img.file_path ? img.file_path.match(/(\d{4}-\d{2}-\d{2})/)?.[1] : null;
          const dateFromFilename = img.filename ? img.filename.match(/(\d{4})(\d{2})(\d{2})/)?.[0] : null;
          const dateFromFilenameFormatted = dateFromFilename ? `${dateFromFilename.substring(0,4)}-${dateFromFilename.substring(4,6)}-${dateFromFilename.substring(6,8)}` : null;
          console.log(`       추출된 날짜: ${dateFromPath || dateFromFilenameFormatted || '없음'}`);
          console.log('');
        });
      }
      return;
    }

    console.log(`✅ 이미지 ${images.length}개 발견:\n`);

    for (const img of images) {
      console.log(`📸 ${img.filename || '파일명 없음'}`);
      console.log(`   ID: ${img.id}`);
      console.log(`   file_path: ${img.file_path || '없음'}`);
      console.log(`   cdn_url: ${img.cdn_url ? img.cdn_url.substring(0, 100) + '...' : '없음'}`);
      console.log(`   ai_tags: ${JSON.stringify(img.ai_tags || [])}`);
      
      // 날짜 추출 확인
      const dateFromPath = img.file_path ? img.file_path.match(/(\d{4}-\d{2}-\d{2})/)?.[1] : null;
      const dateFromUrl = img.cdn_url ? img.cdn_url.match(/(\d{4}-\d{2}-\d{2})/)?.[1] : null;
      const dateFromFilename = img.filename ? img.filename.match(/(\d{4})(\d{2})(\d{2})/)?.[0] : null;
      const dateFromFilenameFormatted = dateFromFilename ? `${dateFromFilename.substring(0,4)}-${dateFromFilename.substring(4,6)}-${dateFromFilename.substring(6,8)}` : null;
      
      console.log(`   날짜 추출:`);
      console.log(`     - file_path에서: ${dateFromPath || '없음'}`);
      console.log(`     - cdn_url에서: ${dateFromUrl || '없음'}`);
      console.log(`     - filename에서: ${dateFromFilenameFormatted || '없음'}`);
      console.log(`     - 최종 날짜: ${dateFromPath || dateFromUrl || dateFromFilenameFormatted || '없음'}`);
      
      // 고객 태그 확인
      const hasCustomerTag = Array.isArray(img.ai_tags) && img.ai_tags.includes(customerTag);
      console.log(`   고객 태그 (${customerTag}): ${hasCustomerTag ? '✅ 있음' : '❌ 없음'}`);
      
      // file_path로 고객 폴더 확인
      const folderName = customer.folder_name || `customer-${String(customer.id).padStart(3, '0')}`;
      const expectedPath = `originals/customers/${folderName}/`;
      const isInCustomerFolder = img.file_path?.includes(expectedPath);
      console.log(`   고객 폴더 (${expectedPath}): ${isInCustomerFolder ? '✅ 있음' : '❌ 없음'}`);
      
      console.log('');
    }

    // 3. 고객의 모든 이미지에서 날짜 목록 확인
    console.log('📅 고객의 모든 이미지에서 날짜 목록 확인 중...\n');
    
    const { data: allCustomerImages } = await supabase
      .from('image_assets')
      .select('id, filename, file_path, ai_tags')
      .contains('ai_tags', [customerTag])
      .limit(100);

    if (allCustomerImages && allCustomerImages.length > 0) {
      const dates = new Set();
      
      allCustomerImages.forEach(img => {
        // date_folder가 있으면 사용
        if (img.date_folder) {
          dates.add(img.date_folder);
        } else {
          // file_path에서 날짜 추출
          const dateMatch = img.file_path?.match(/(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) {
            dates.add(dateMatch[1]);
          } else {
            // filename에서 날짜 추출 (YYYYMMDD 형식)
            const filenameMatch = img.filename?.match(/(\d{4})(\d{2})(\d{2})/);
            if (filenameMatch) {
              const dateStr = `${filenameMatch[1]}-${filenameMatch[2]}-${filenameMatch[3]}`;
              dates.add(dateStr);
            }
          }
        }
      });
      
      const sortedDates = Array.from(dates).sort().reverse();
      console.log(`✅ 발견된 날짜 목록 (${sortedDates.length}개):`);
      sortedDates.forEach(date => {
        console.log(`   - ${date}${date === '2026-01-28' ? ' ⭐ (찾는 날짜)' : ''}`);
      });
      console.log('');
      
      if (!dates.has('2026-01-28')) {
        console.log('❌ 2026-01-28 날짜가 목록에 없습니다.');
        console.log('   원인: 이미지의 date_folder가 없거나, file_path/filename에서 날짜 추출 실패');
      }
    }

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

checkJeonyugeun20260128Image().catch(console.error);
