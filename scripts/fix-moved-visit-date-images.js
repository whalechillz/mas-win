/**
 * 방문일자 수정으로 인해 메타데이터만 업데이트되고 실제 파일이 이동되지 않은 이미지 복구 스크립트
 * file_path와 실제 Storage 파일 위치를 동기화
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

async function fixMovedVisitDateImages() {
  console.log('🔧 방문일자 수정으로 인한 파일 위치 불일치 복구...\n');

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

    // 해당 고객의 이미지 조회 (file_path에 고객 폴더가 포함된 것)
    const { data: images, error: imagesError } = await supabase
      .from('image_assets')
      .select('id, filename, file_path, cdn_url, ai_tags')
      .ilike('file_path', `%customers/${folderName}%`)
      .limit(100);

    if (imagesError) {
      console.error('❌ 이미지 조회 실패:', imagesError);
      return;
    }

    console.log(`✅ 총 ${images.length}개 이미지 발견\n`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const img of images) {
      if (!img.file_path) {
        continue;
      }

      // file_path에서 날짜 추출
      const dateMatch = img.file_path.match(/\/(\d{4}-\d{2}-\d{2})\//);
      const dateInPath = dateMatch ? dateMatch[1] : null;

      // ai_tags에서 visit-{date} 추출
      const visitTag = Array.isArray(img.ai_tags) ? img.ai_tags.find((tag) => tag.startsWith('visit-')) : null;
      const dateInTag = visitTag ? visitTag.replace('visit-', '') : null;

      // 날짜가 다르면 불일치
      if (dateInPath && dateInTag && dateInPath !== dateInTag) {
        console.log(`📸 ${img.filename || '파일명 없음'}`);
        console.log(`   ID: ${img.id}`);
        console.log(`   file_path 날짜: ${dateInPath}`);
        console.log(`   ai_tags 날짜: ${dateInTag}`);
        console.log(`   현재 file_path: ${img.file_path?.substring(0, 100)}`);

        // 실제 파일이 어디에 있는지 확인
        const oldPath = img.file_path.replace(`/${dateInPath}/`, `/${dateInTag}/`);
        const newPath = img.file_path;

        console.log(`   예상 기존 경로: ${oldPath.substring(0, 100)}`);
        console.log(`   예상 새 경로: ${newPath.substring(0, 100)}`);

        // 기존 경로에 파일이 있는지 확인
        const { data: oldFile, error: oldFileError } = await supabase.storage
          .from('blog-images')
          .list(oldPath.split('/').slice(0, -1).join('/'), {
            search: oldPath.split('/').pop()
          });

        // 새 경로에 파일이 있는지 확인
        const { data: newFile, error: newFileError } = await supabase.storage
          .from('blog-images')
          .list(newPath.split('/').slice(0, -1).join('/'), {
            search: newPath.split('/').pop()
          });

        const oldFileExists = !oldFileError && oldFile && oldFile.length > 0;
        const newFileExists = !newFileError && newFile && newFile.length > 0;

        console.log(`   기존 경로 파일 존재: ${oldFileExists}`);
        console.log(`   새 경로 파일 존재: ${newFileExists}`);

        if (oldFileExists && !newFileExists) {
          // 파일을 새 경로로 이동
          console.log(`   📁 파일 이동 시작...`);

          // 목표 폴더 생성
          const targetFolder = newPath.split('/').slice(0, -1).join('/');
          const { error: listError } = await supabase.storage
            .from('blog-images')
            .list(targetFolder);

          if (listError) {
            const markerPath = `${targetFolder}/.folder`;
            await supabase.storage
              .from('blog-images')
              .upload(markerPath, new Blob(['folder marker'], { type: 'text/plain' }), {
                upsert: true,
                contentType: 'text/plain'
              });
            console.log(`   ✅ 폴더 생성: ${targetFolder}`);
          }

          // 파일 이동
          const { data: moveData, error: moveError } = await supabase.storage
            .from('blog-images')
            .move(oldPath, newPath);

          if (moveError) {
            console.error(`   ❌ 파일 이동 실패:`, moveError);
            errorCount++;
          } else {
            console.log(`   ✅ 파일 이동 완료`);
            fixedCount++;
          }
        } else if (newFileExists) {
          console.log(`   ✅ 파일이 이미 새 경로에 있음`);
          fixedCount++;
        } else if (!oldFileExists && !newFileExists) {
          console.warn(`   ⚠️ 파일을 찾을 수 없음 (기존 경로와 새 경로 모두)`);
          errorCount++;
        }

        console.log('');
      }
    }

    console.log(`✅ 작업 완료:`);
    console.log(`   - 복구 완료: ${fixedCount}개`);
    console.log(`   - 오류: ${errorCount}개`);
  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

fixMovedVisitDateImages().catch(console.error);
