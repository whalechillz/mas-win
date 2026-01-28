/**
 * "이미지가 있는 고객만" 필터 확인 스크립트
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

async function checkCustomersWithImagesFilter() {
  console.log('🔍 "이미지가 있는 고객만" 필터 확인...\n');

  try {
    // 테스트할 고객들
    const testCustomers = ['이남구', '김종철'];
    
    for (const customerName of testCustomers) {
      console.log(`\n📋 ${customerName} 고객 확인:\n`);
      
      // 고객 정보 조회
      const { data: customers } = await supabase
        .from('customers')
        .select('id, name, folder_name')
        .ilike('name', `%${customerName}%`)
        .limit(1);

      if (!customers || customers.length === 0) {
        console.log(`❌ ${customerName} 고객을 찾을 수 없습니다.`);
        continue;
      }

      const customer = customers[0];
      const folderName = customer.folder_name;
      
      if (!folderName) {
        console.log(`⚠️ ${customerName} 고객의 folder_name이 없습니다.`);
        continue;
      }

      console.log(`✅ 고객: ${customer.name} (ID: ${customer.id}, 폴더: ${folderName})\n`);

      // 1. file_path로 이미지 조회 (필터 로직과 동일)
      const { data: customerImagesByPath, error: pathError } = await supabase
        .from('image_assets')
        .select('file_path, cdn_url, filename')
        .ilike('file_path', `originals/customers/${folderName}/%`)
        // 동영상 확장자 제외
        .not('file_path', 'ilike', '%.mp4%')
        .not('file_path', 'ilike', '%.mov%')
        .not('file_path', 'ilike', '%.avi%')
        .not('file_path', 'ilike', '%.webm%')
        .not('file_path', 'ilike', '%.mkv%');

      if (pathError) {
        console.error(`❌ 이미지 조회 실패:`, pathError);
        continue;
      }

      console.log(`📦 file_path로 조회된 이미지: ${customerImagesByPath?.length || 0}개\n`);

      // 2. 썸네일 조회 로직 확인 (대표 이미지 우선)
      // 대표 이미지 조회
      let representativeQuery = supabase
        .from('image_assets')
        .select('cdn_url, file_path, filename')
        .ilike('file_path', `originals/customers/${folderName}/%`)
        .eq('is_customer_representative', true);

      // 동영상 제외
      representativeQuery = representativeQuery
        .not('file_path', 'ilike', '%.mp4%')
        .not('file_path', 'ilike', '%.mov%')
        .not('file_path', 'ilike', '%.avi%')
        .not('file_path', 'ilike', '%.webm%')
        .not('file_path', 'ilike', '%.mkv%')
        .not('cdn_url', 'ilike', '%.mp4%')
        .not('cdn_url', 'ilike', '%.mov%')
        .not('cdn_url', 'ilike', '%.avi%')
        .not('cdn_url', 'ilike', '%.webm%')
        .not('cdn_url', 'ilike', '%.mkv%');

      const { data: representativeImage, error: repError } = await representativeQuery
        .maybeSingle();

      if (repError) {
        console.warn(`⚠️ 대표 이미지 조회 오류:`, repError.message);
      }

      console.log(`📸 대표 이미지: ${representativeImage ? '✅ 있음' : '❌ 없음'}`);
      if (representativeImage) {
        console.log(`   file_path: ${representativeImage.file_path?.substring(0, 100) || '없음'}`);
        console.log(`   cdn_url: ${representativeImage.cdn_url ? representativeImage.cdn_url.substring(0, 100) + '...' : '없음'}`);
      }

      // 3. 최신 이미지 조회 (대표 이미지가 없을 때)
      let query = supabase
        .from('image_assets')
        .select('cdn_url, file_path, filename')
        .ilike('file_path', `originals/customers/${folderName}/%`)
        .not('file_path', 'ilike', '%.mp4%')
        .not('file_path', 'ilike', '%.mov%')
        .not('file_path', 'ilike', '%.avi%')
        .not('file_path', 'ilike', '%.webm%')
        .not('file_path', 'ilike', '%.mkv%')
        .not('cdn_url', 'ilike', '%.mp4%')
        .not('cdn_url', 'ilike', '%.mov%')
        .not('cdn_url', 'ilike', '%.avi%')
        .not('cdn_url', 'ilike', '%.webm%')
        .not('cdn_url', 'ilike', '%.mkv%')
        .order('created_at', { ascending: false })
        .limit(1);

      const { data: latestImages, error: queryError } = await query;

      if (queryError) {
        console.error(`❌ 최신 이미지 조회 실패:`, queryError);
        continue;
      }

      console.log(`\n📸 최신 이미지: ${latestImages?.length || 0}개`);
      if (latestImages && latestImages.length > 0) {
        const img = latestImages[0];
        console.log(`   file_path: ${img.file_path?.substring(0, 100) || '없음'}`);
        console.log(`   cdn_url: ${img.cdn_url ? img.cdn_url.substring(0, 100) + '...' : '없음'}`);
        
        // file_path에 파일명이 있는지 확인
        if (img.file_path) {
          const pathParts = img.file_path.split('/');
          const lastPart = pathParts[pathParts.length - 1];
          const isDateFolder = /^\d{4}[.-]\d{2}[.-]\d{2}$/.test(lastPart);
          const hasFilename = lastPart.includes('.') && !isDateFolder;
          
          console.log(`   file_path에 파일명: ${hasFilename ? '✅' : '❌'}`);
          
          if (!hasFilename && img.filename) {
            const correctedPath = `${img.file_path}/${img.filename}`;
            console.log(`   수정된 file_path: ${correctedPath.substring(0, 100)}...`);
            
            // URL 생성 테스트
            const { data: { publicUrl } } = supabase.storage
              .from('blog-images')
              .getPublicUrl(correctedPath);
            console.log(`   생성된 URL: ${publicUrl.substring(0, 100)}...`);
          }
        }
      }

      // 4. 최종 썸네일 URL 결정
      let thumbnailUrl = null;
      if (representativeImage?.cdn_url) {
        const url = representativeImage.cdn_url;
        if (url && 
            typeof url === 'string' && 
            url.trim() !== '' && 
            (url.startsWith('http://') || url.startsWith('https://'))) {
          thumbnailUrl = url;
        }
      } else if (latestImages && latestImages.length > 0) {
        const img = latestImages[0];
        if (img.cdn_url) {
          thumbnailUrl = img.cdn_url;
        } else if (img.file_path) {
          // file_path로부터 URL 생성
          let actualFilePath = img.file_path;
          const pathParts = img.file_path.split('/');
          const lastPart = pathParts[pathParts.length - 1];
          const isDateFolder = /^\d{4}[.-]\d{2}[.-]\d{2}$/.test(lastPart);
          
          if (isDateFolder && img.filename) {
            actualFilePath = `${img.file_path}/${img.filename}`;
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from('blog-images')
            .getPublicUrl(actualFilePath);
          thumbnailUrl = publicUrl;
        }
      }

      console.log(`\n✅ 최종 썸네일 URL: ${thumbnailUrl ? thumbnailUrl.substring(0, 100) + '...' : '❌ 없음'}`);
      console.log(`   이미지가 있는 고객으로 인식: ${thumbnailUrl ? '✅' : '❌'}`);
    }

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

checkCustomersWithImagesFilter().catch(console.error);
