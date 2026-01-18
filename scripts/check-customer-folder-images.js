/**
 * 고객 폴더에 이미지가 있는지 확인하는 스크립트
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

async function checkCustomerFolderImages(customerFolderName) {
  console.log(`\n🔍 고객 폴더 이미지 확인: ${customerFolderName}\n`);
  
  const folderPath = `originals/customers/${customerFolderName}`;
  console.log(`📁 폴더 경로: ${folderPath}\n`);

  try {
    // 1. Storage에서 직접 조회
    console.log('1️⃣ Storage에서 직접 조회...');
    let allFiles = [];
    let offset = 0;
    const batchSize = 1000;

    while (true) {
      const { data: files, error } = await supabase.storage
        .from('blog-images')
        .list(folderPath, {
          limit: batchSize,
          offset: offset,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        if (error.message && error.message.includes('not found')) {
          console.log(`   ❌ 폴더를 찾을 수 없습니다: ${folderPath}`);
          break;
        }
        throw error;
      }

      if (!files || files.length === 0) {
        break;
      }

      allFiles = allFiles.concat(files);
      offset += batchSize;

      if (files.length < batchSize) {
        break;
      }
    }

    console.log(`   📊 Storage 파일 수: ${allFiles.length}개`);

    // 이미지/동영상 파일 필터링
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.heic', '.heif'];
    const videoExtensions = ['.mp4', '.avi', '.mov', '.webm', '.mkv', '.flv', '.m4v', '.3gp', '.wmv'];
    const mediaExtensions = [...imageExtensions, ...videoExtensions];
    
    const mediaFiles = allFiles.filter(file => {
      if (!file.id) return false; // 폴더 제외
      const isMedia = mediaExtensions.some(ext => 
        file.name.toLowerCase().endsWith(ext)
      );
      const isKeepFile = file.name.toLowerCase() === '.keep.png';
      return isMedia && !isKeepFile;
    });

    console.log(`   📸 미디어 파일 수: ${mediaFiles.length}개`);
    
    if (mediaFiles.length > 0) {
      console.log(`\n   📋 파일 목록 (최대 10개):`);
      mediaFiles.slice(0, 10).forEach((file, idx) => {
        const filePath = `${folderPath}/${file.name}`;
        const { data: { publicUrl } } = supabase.storage
          .from('blog-images')
          .getPublicUrl(filePath);
        console.log(`   ${idx + 1}. ${file.name}`);
        console.log(`      URL: ${publicUrl}`);
      });
      if (mediaFiles.length > 10) {
        console.log(`   ... 외 ${mediaFiles.length - 10}개 파일`);
      }
    }

    // 2. image_metadata에서 조회
    console.log(`\n2️⃣ image_metadata에서 조회...`);
    
    // 고객 ID 찾기
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name, folder_name')
      .ilike('folder_name', `%${customerFolderName.split('-')[0]}%`)
      .limit(5);

    if (customers && customers.length > 0) {
      console.log(`   ✅ 고객 정보 찾음: ${customers.length}명`);
      customers.forEach(c => {
        console.log(`      - ID: ${c.id}, 이름: ${c.name}, 폴더: ${c.folder_name}`);
      });

      const customerIds = customers.map(c => c.id);
      
      // image_metadata에서 조회
      let images = [];
      const { data: imageData, error: imageError } = await supabase
        .from('image_metadata')
        .select('id, image_url, folder_path, english_filename, story_scene, is_scene_representative')
        .in('customer_id', customerIds)
        .order('created_at', { ascending: false })
        .limit(20);

      if (imageError) {
        console.error(`   ❌ 이미지 메타데이터 조회 오류:`, imageError);
      } else {
        images = imageData || [];
        console.log(`   📊 image_metadata 레코드 수: ${images.length}개`);
        
        if (images.length > 0) {
          console.log(`\n   📋 이미지 메타데이터 (최대 10개):`);
          images.slice(0, 10).forEach((img, idx) => {
            console.log(`   ${idx + 1}. ${img.english_filename || '파일명 없음'}`);
            console.log(`      URL: ${img.image_url}`);
            console.log(`      폴더: ${img.folder_path || '없음'}`);
            console.log(`      장면: ${img.story_scene || '없음'}, 대표: ${img.is_scene_representative ? '⭐' : '○'}`);
          });
        }
      }
    } else {
      console.log(`   ⚠️ 고객 정보를 찾을 수 없습니다.`);
    }

    // 3. 하위 폴더 확인 (날짜별)
    console.log(`\n3️⃣ 하위 폴더 확인...`);
    const dateFolders = allFiles.filter(f => !f.id); // 폴더만
    if (dateFolders.length > 0) {
      console.log(`   📁 하위 폴더 수: ${dateFolders.length}개`);
      dateFolders.forEach(folder => {
        console.log(`      - ${folder.name}`);
      });
    } else {
      console.log(`   📁 하위 폴더 없음 (직접 파일만 있음)`);
    }

    // 4. 하위 폴더의 이미지 확인
    if (dateFolders.length > 0) {
      console.log(`\n4️⃣ 하위 폴더의 이미지 확인...`);
      for (const dateFolder of dateFolders.slice(0, 5)) {
        const subFolderPath = `${folderPath}/${dateFolder.name}`;
        const { data: subFiles } = await supabase.storage
          .from('blog-images')
          .list(subFolderPath, {
            limit: 100,
            sortBy: { column: 'created_at', order: 'desc' }
          });
        
        if (subFiles && subFiles.length > 0) {
          const subMediaFiles = subFiles.filter(file => {
            if (!file.id) return false;
            const isMedia = mediaExtensions.some(ext => 
              file.name.toLowerCase().endsWith(ext)
            );
            return isMedia && file.name.toLowerCase() !== '.keep.png';
          });
          
          console.log(`   📁 ${dateFolder.name}: ${subMediaFiles.length}개 미디어 파일`);
          if (subMediaFiles.length > 0) {
            subMediaFiles.slice(0, 3).forEach(file => {
              console.log(`      - ${file.name}`);
            });
          }
        }
      }
    }

    // 5. 요약
    let totalSubMediaFiles = 0;
    if (dateFolders.length > 0) {
      for (const dateFolder of dateFolders) {
        const subFolderPath = `${folderPath}/${dateFolder.name}`;
        const { data: subFiles } = await supabase.storage
          .from('blog-images')
          .list(subFolderPath, { limit: 1000 });
        if (subFiles) {
          const subMedia = subFiles.filter(f => f.id && mediaExtensions.some(ext => f.name.toLowerCase().endsWith(ext)));
          totalSubMediaFiles += subMedia.length;
        }
      }
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 요약:`);
    console.log(`   Storage 파일 (직접): ${allFiles.length}개`);
    console.log(`   미디어 파일 (직접): ${mediaFiles.length}개`);
    console.log(`   미디어 파일 (하위 폴더): ${totalSubMediaFiles}개`);
    console.log(`   image_metadata: ${images?.length || 0}개`);
    console.log(`   하위 폴더: ${dateFolders.length}개`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 실행
const customerFolderName = process.argv[2] || 'limtaehui-0506';
checkCustomerFolderImages(customerFolderName).catch(console.error);
