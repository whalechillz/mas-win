/**
 * 전유근 고객의 file_path에 파일명 추가
 * file_path가 폴더 경로만 있고 파일명이 없는 경우 수정
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

async function fixFilePaths() {
  console.log('🔧 전유근 고객의 file_path 수정...\n');

  try {
    // 전유근 고객 정보 조회
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
    const folderName = customer.folder_name || `customer-${String(customer.id).padStart(3, '0')}`;
    console.log(`✅ 고객: ${customer.name} (ID: ${customer.id}, 폴더: ${folderName})\n`);

    // 해당 고객의 이미지 조회
    const { data: images, error: imagesError } = await supabase
      .from('image_assets')
      .select('id, filename, file_path, cdn_url, ai_tags')
      .ilike('file_path', `%customers/${folderName}%`)
      .limit(50);

    if (imagesError) {
      console.error('❌ 이미지 조회 실패:', imagesError);
      return;
    }

    console.log(`✅ 총 ${images.length}개 이미지 발견\n`);

    let fixedCount = 0;

    for (const img of images) {
      if (!img.file_path) {
        continue;
      }

      // file_path에 파일명이 있는지 확인
      const pathParts = img.file_path.split('/');
      const lastPart = pathParts[pathParts.length - 1];
      
      // 파일명이 없거나 날짜 형식(YYYY-MM-DD)인 경우
      const isDateFolder = /^\d{4}-\d{2}-\d{2}$/.test(lastPart);
      
      if (isDateFolder || !lastPart.includes('.')) {
        // file_path가 폴더 경로만 있고 파일명이 없음
        console.log(`📸 ${img.filename || '파일명 없음'}`);
        console.log(`   ID: ${img.id}`);
        console.log(`   현재 file_path: ${img.file_path}`);
        
        // filename에서 파일명 추출
        const fileName = img.filename || 'unknown';
        
        // file_path에 파일명 추가
        const newFilePath = `${img.file_path}/${fileName}`;
        
        console.log(`   새 file_path: ${newFilePath}`);
        
        // cdn_url에서 파일명 추출 시도
        let actualFileName = fileName;
        if (img.cdn_url) {
          const urlParts = img.cdn_url.split('/');
          const urlFileName = urlParts[urlParts.length - 1]?.split('?')[0];
          if (urlFileName && urlFileName.includes('.')) {
            actualFileName = urlFileName;
            const correctedFilePath = `${img.file_path}/${actualFileName}`;
            console.log(`   cdn_url에서 파일명 추출: ${actualFileName}`);
            console.log(`   수정된 file_path: ${correctedFilePath}`);
            
            // 실제 파일 존재 확인
            const { data: files, error: listError } = await supabase.storage
              .from('blog-images')
              .list(img.file_path, {
                search: actualFileName
              });
            
            const fileExists = !listError && files && files.length > 0;
            console.log(`   Storage 파일 존재: ${fileExists ? '✅' : '❌'}`);
            
            if (fileExists) {
              // file_path 업데이트
              const { data: { publicUrl } } = supabase.storage
                .from('blog-images')
                .getPublicUrl(correctedFilePath);
              
              const { data: updatedImage, error: updateError } = await supabase
                .from('image_assets')
                .update({
                  file_path: correctedFilePath,
                  cdn_url: publicUrl,
                  updated_at: new Date().toISOString()
                })
                .eq('id', img.id)
                .select()
                .single();
              
              if (updateError) {
                console.error(`   ❌ 업데이트 실패:`, updateError);
              } else {
                console.log(`   ✅ 업데이트 완료!`);
                fixedCount++;
              }
            }
          }
        }
        
        console.log('');
      }
    }

    console.log(`✅ 작업 완료: ${fixedCount}개 이미지 file_path 수정`);
  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

fixFilePaths().catch(console.error);
