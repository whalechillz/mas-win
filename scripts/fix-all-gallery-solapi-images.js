/**
 * 갤러리에서 보이는 모든 Solapi 이미지 확인 및 수정
 * 
 * 1. image_metadata 전체 스캔
 * 2. image_url이 Solapi imageId인 항목 찾기
 * 3. 실제 파일 찾기 및 URL 업데이트
 * 4. 파일이 없으면 get-image-preview API로 생성
 */

const { createClient } = require('@supabase/supabase-js');
const { createSolapiSignature } = require('../utils/solapiSignature');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || '';
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || '';

async function fixAllGallerySolapiImages() {
  console.log('='.repeat(100));
  console.log('🔍 갤러리에서 보이는 모든 Solapi 이미지 확인 및 수정');
  console.log('='.repeat(100));
  console.log('');

  // 1. image_metadata 전체에서 image_url이 ST01FZ로 시작하는 항목 찾기
  console.log('📋 image_metadata 전체 스캔 중...\n');
  
  let offset = 0;
  const batchSize = 1000;
  const allSolapiMetadata = [];

  while (true) {
    const { data: metadata, error } = await supabase
      .from('image_metadata')
      .select('id, image_url, folder_path, tags, source, channel')
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error('❌ image_metadata 조회 실패:', error.message);
      break;
    }

    if (!metadata || metadata.length === 0) break;

    // Solapi imageId인 항목 찾기
    metadata.forEach(meta => {
      if (meta.image_url && meta.image_url.startsWith('ST01FZ')) {
        allSolapiMetadata.push(meta);
      }
    });

    offset += batchSize;
    if (metadata.length < batchSize) break;
  }

  console.log(`✅ 발견된 항목: ${allSolapiMetadata.length}개\n`);

  if (allSolapiMetadata.length === 0) {
    console.log('ℹ️  image_metadata에 Solapi imageId가 없습니다.');
    return;
  }

  // 2. originals/mms/solapi에서 모든 파일 조회
  const { data: solapiFiles, error: filesError } = await supabase.storage
    .from('blog-images')
    .list('originals/mms/solapi', { limit: 1000 });

  if (filesError) {
    console.error('❌ 파일 조회 실패:', filesError.message);
    return;
  }

  // imageId로 파일 매핑
  const fileMap = new Map();
  solapiFiles?.forEach(file => {
    const match = file.name.match(/solapi-(ST01FZ[A-Z0-9a-z]+)/);
    if (match) {
      const imageId = match[1];
      const filePath = `originals/mms/solapi/${file.name}`;
      const { data: urlData } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath);
      
      if (urlData?.publicUrl) {
        fileMap.set(imageId, {
          name: file.name,
          path: filePath,
          url: urlData.publicUrl
        });
      }
    }
  });

  console.log(`📁 originals/mms/solapi 파일: ${fileMap.size}개\n`);

  // 3. 각 메타데이터 처리
  console.log('='.repeat(100));
  console.log('📋 메타데이터 수정 중...');
  console.log('='.repeat(100));
  console.log('');

  let updatedCount = 0;
  let createdCount = 0;
  let notFoundCount = 0;

  for (const meta of allSolapiMetadata) {
    const imageId = meta.image_url;
    console.log(`📋 imageId: ${imageId.substring(0, 30)}...`);

    const fileInfo = fileMap.get(imageId);

    if (fileInfo) {
      console.log(`   ✅ 파일 발견: ${fileInfo.name}`);
      
      // 기존 태그 유지
      const existingTags = meta.tags || [];
      const newTags = [...new Set([...existingTags, `solapi-${imageId}`, 'solapi-permanent', 'mms'])];

      // image_metadata 업데이트
      const { error: updateError } = await supabase
        .from('image_metadata')
        .update({
          image_url: fileInfo.url,
          folder_path: 'originals/mms/solapi',
          tags: newTags,
          source: 'mms',
          channel: 'sms',
          upload_source: 'solapi-permanent',
          updated_at: new Date().toISOString()
        })
        .eq('id', meta.id);

      if (updateError) {
        console.error(`   ❌ 업데이트 실패:`, updateError.message);
      } else {
        console.log(`   ✅ 업데이트 완료`);
        updatedCount++;
      }
    } else {
      console.log(`   ⚠️  파일을 찾을 수 없음 - Solapi에서 다운로드 시도...`);
      
      // Solapi에서 다운로드 시도
      if (SOLAPI_API_KEY && SOLAPI_API_SECRET) {
        try {
          const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
          const downloadUrl = `https://api.solapi.com/storage/v1/files/${imageId}/download`;
          
          const downloadResponse = await fetch(downloadUrl, {
            method: 'GET',
            headers: authHeaders
          });

          if (downloadResponse.ok) {
            const arrayBuffer = await downloadResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            const fileName = `solapi-${imageId}.jpg`;
            const storagePath = `originals/mms/solapi/${fileName}`;

            // Supabase에 업로드
            const { error: uploadError } = await supabase.storage
              .from('blog-images')
              .upload(storagePath, buffer, {
                contentType: 'image/jpeg',
                upsert: true
              });

            if (uploadError) {
              console.error(`      ❌ 업로드 실패:`, uploadError.message);
              notFoundCount++;
              continue;
            }

            const { data: urlData } = supabase.storage
              .from('blog-images')
              .getPublicUrl(storagePath);

            if (urlData?.publicUrl) {
              // image_metadata 업데이트
              const existingTags = meta.tags || [];
              const newTags = [...new Set([...existingTags, `solapi-${imageId}`, 'solapi-permanent', 'mms'])];

              const { error: updateError } = await supabase
                .from('image_metadata')
                .update({
                  image_url: urlData.publicUrl,
                  folder_path: 'originals/mms/solapi',
                  tags: newTags,
                  source: 'mms',
                  channel: 'sms',
                  upload_source: 'solapi-permanent',
                  updated_at: new Date().toISOString()
                })
                .eq('id', meta.id);

              if (updateError) {
                console.error(`      ❌ 업데이트 실패:`, updateError.message);
              } else {
                console.log(`      ✅ 다운로드 및 업데이트 완료`);
                createdCount++;
              }
            }
          } else {
            console.log(`      ⚠️  Solapi 다운로드 실패: ${downloadResponse.status}`);
            notFoundCount++;
          }
        } catch (error) {
          console.error(`      ❌ 다운로드 오류:`, error.message);
          notFoundCount++;
        }
      } else {
        console.log(`      ⚠️  Solapi API 키가 없어 다운로드 불가`);
        notFoundCount++;
      }
    }
    console.log('');
  }

  // 4. 최종 정리
  console.log('='.repeat(100));
  console.log('✅ 정리 완료!');
  console.log('='.repeat(100));
  console.log(`📋 image_metadata 업데이트: ${updatedCount}개`);
  console.log(`📥 Solapi에서 다운로드 및 생성: ${createdCount}개`);
  console.log(`⚠️  파일 없음: ${notFoundCount}개`);
  console.log('');
}

fixAllGallerySolapiImages()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });

