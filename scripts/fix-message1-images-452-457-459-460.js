/**
 * 메시지 1 이미지 정리 및 연결 스크립트
 * 
 * 작업:
 * 1. 452, 453, 454 폴더 삭제 (이미지 누락, LMS로 발송됨)
 * 2. 457, 459, 460에 이미지1 연결 (MMS로 발송되어야 함)
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkMessageStatus(messageIds) {
  console.log('\n📋 메시지 상태 확인 중...\n');
  
  const { data: messages, error } = await supabase
    .from('channel_sms')
    .select('id, message_type, image_url, status, sent_at')
    .in('id', messageIds)
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ 메시지 조회 실패:', error);
    return null;
  }

  messages.forEach(msg => {
    console.log(`메시지 #${msg.id}:`);
    console.log(`  - 타입: ${msg.message_type}`);
    console.log(`  - 상태: ${msg.status}`);
    console.log(`  - 이미지: ${msg.image_url ? '✅ 있음' : '❌ 없음'}`);
    if (msg.image_url) {
      console.log(`    URL: ${msg.image_url}`);
    }
    console.log('');
  });

  return messages;
}

async function deleteImageFolders(messageIds, dateFolder) {
  console.log('\n🗑️  이미지 폴더 삭제 중...\n');
  
  for (const messageId of messageIds) {
    const folderPath = `originals/mms/${dateFolder}/${messageId}`;
    console.log(`📁 메시지 #${messageId} 폴더 삭제: ${folderPath}`);
    
    try {
      // 폴더 내 파일 목록 조회
      const { data: files, error: listError } = await supabase.storage
        .from('blog-images')
        .list(folderPath);

      if (listError) {
        console.log(`   ⚠️  폴더 조회 실패 (이미 없을 수 있음): ${listError.message}`);
        continue;
      }

      if (!files || files.length === 0) {
        console.log(`   ✅ 폴더가 비어있음 (삭제할 파일 없음)`);
        continue;
      }

      // 파일 경로 생성
      const filePaths = files.map(file => `${folderPath}/${file.name}`);
      console.log(`   📄 삭제할 파일: ${files.length}개`);

      // 파일 삭제
      const { error: deleteError } = await supabase.storage
        .from('blog-images')
        .remove(filePaths);

      if (deleteError) {
        console.error(`   ❌ 삭제 실패: ${deleteError.message}`);
      } else {
        console.log(`   ✅ 삭제 완료`);
      }
    } catch (error) {
      console.error(`   ❌ 오류: ${error.message}`);
    }
  }
}

async function findImage1ForMessage1() {
  console.log('\n🔍 이미지1 찾는 중...\n');
  
  // 메시지 1에 사용된 이미지를 찾기 위해 457, 459, 460의 이미지 확인
  // 또는 2026-01-20 폴더에서 메시지 1 관련 이미지 찾기
  const dateFolder = '2026-01-20';
  
  // 457 폴더에서 이미지 찾기
  const folder457 = `originals/mms/${dateFolder}/457`;
  const { data: files457, error: error457 } = await supabase.storage
    .from('blog-images')
    .list(folder457);

  if (!error457 && files457 && files457.length > 0) {
    const imageFile = files457[0];
    const imagePath = `${folder457}/${imageFile.name}`;
    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(imagePath);
    
    console.log(`✅ 이미지1 발견: ${imagePath}`);
    console.log(`   URL: ${urlData.publicUrl}`);
    return { path: imagePath, url: urlData.publicUrl, buffer: null };
  }

  // 457에 이미지가 없으면 다른 곳에서 찾기
  console.log('⚠️  457 폴더에 이미지가 없습니다. 다른 경로에서 찾는 중...');
  
  // channel_sms에서 457의 image_url 확인
  const { data: message457, error: msgError } = await supabase
    .from('channel_sms')
    .select('image_url')
    .eq('id', 457)
    .single();

  if (!msgError && message457 && message457.image_url) {
    console.log(`✅ 메시지 457의 이미지 URL 발견: ${message457.image_url}`);
    // URL에서 경로 추출
    const urlParts = message457.image_url.split('/');
    const pathIndex = urlParts.findIndex(part => part === 'blog-images');
    if (pathIndex !== -1) {
      const storagePath = urlParts.slice(pathIndex + 1).join('/');
      console.log(`   Storage 경로: ${storagePath}`);
      return { path: storagePath, url: message457.image_url, buffer: null };
    }
  }

  return null;
}

async function copyImageToMessage(messageId, sourceImage, dateFolder) {
  console.log(`\n📋 메시지 #${messageId}에 이미지 연결 중...`);
  
  try {
    // 1. 현재 메시지 상태 확인
    const { data: message, error: msgError } = await supabase
      .from('channel_sms')
      .select('id, image_url, message_type')
      .eq('id', messageId)
      .single();

    if (msgError || !message) {
      console.error(`   ❌ 메시지 ${messageId} 조회 실패`);
      return { success: false };
    }

    console.log(`   현재 타입: ${message.message_type}`);
    console.log(`   현재 이미지: ${message.image_url ? '있음' : '없음'}`);

    // 2. 소스 이미지 다운로드
    let imageBuffer;
    if (sourceImage.buffer) {
      imageBuffer = sourceImage.buffer;
    } else {
      console.log(`   소스 이미지 다운로드: ${sourceImage.path}`);
      const { data: imageData, error: downloadError } = await supabase.storage
        .from('blog-images')
        .download(sourceImage.path);

      if (downloadError) {
        console.error(`   ❌ 이미지 다운로드 실패: ${downloadError.message}`);
        return { success: false, error: downloadError };
      }

      imageBuffer = Buffer.from(await imageData.arrayBuffer());
      console.log(`   ✅ 이미지 다운로드 완료 (${(imageBuffer.length / 1024).toFixed(2)}KB)`);
    }

    // 3. 목적지 경로 설정
    const folderPath = `originals/mms/${dateFolder}/${messageId}`;
    const timestamp = Date.now();
    const fileName = `mms-${messageId}-titanium-shaft-sita-message1-${timestamp}.jpg`;
    const storagePath = `${folderPath}/${fileName}`;

    console.log(`   목적지: ${storagePath}`);

    // 4. 이미지 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      console.error(`   ❌ 업로드 실패: ${uploadError.message}`);
      return { success: false, error: uploadError };
    }

    console.log(`   ✅ 이미지 업로드 완료`);

    // 5. 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    console.log(`   ✅ 공개 URL: ${publicUrl}`);

    // 6. image_metadata 업데이트 또는 생성
    const { data: existingMeta, error: metaCheckError } = await supabase
      .from('image_metadata')
      .select('id')
      .eq('image_url', publicUrl)
      .single();

    if (metaCheckError && metaCheckError.code !== 'PGRST116') {
      // PGRST116은 "not found" 에러이므로 무시
      console.warn(`   ⚠️  메타데이터 확인 실패 (계속 진행): ${metaCheckError.message}`);
    }

    if (!existingMeta) {
      const { error: metaError } = await supabase
        .from('image_metadata')
        .insert({
          image_url: publicUrl,
          folder_path: folderPath,
          original_path: storagePath,
          file_name: fileName,
          source: 'mms',
          channel: 'sms',
          date_folder: dateFolder,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (metaError) {
        console.warn(`   ⚠️  메타데이터 생성 실패 (계속 진행): ${metaError.message}`);
      } else {
        console.log(`   ✅ 메타데이터 생성 완료`);
      }
    }

    // 7. channel_sms 업데이트
    const { error: updateError } = await supabase
      .from('channel_sms')
      .update({
        image_url: publicUrl,
        message_type: 'MMS', // MMS로 변경
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId);

    if (updateError) {
      console.error(`   ❌ channel_sms 업데이트 실패: ${updateError.message}`);
      return { success: false, error: updateError };
    }

    console.log(`   ✅ channel_sms 업데이트 완료 (MMS로 변경)`);

    return { success: true, imageUrl: publicUrl };
  } catch (error) {
    console.error(`   ❌ 오류: ${error.message}`);
    return { success: false, error };
  }
}

async function main() {
  console.log('🚀 메시지 1 이미지 정리 및 연결\n');
  console.log('='.repeat(60));

  const dateFolder = '2026-01-20';
  const messagesToDelete = [452, 453, 454]; // 이미지 누락, LMS로 발송
  const messagesToLink = [457, 459, 460]; // MMS로 발송, 이미지 필요

  try {
    // 1. 현재 상태 확인
    await checkMessageStatus([...messagesToDelete, ...messagesToLink]);

    // 2. 452, 453, 454 폴더 삭제
    await deleteImageFolders(messagesToDelete, dateFolder);

    // 3. 이미지1 찾기
    const image1 = await findImage1ForMessage1();
    
    if (!image1) {
      console.error('\n❌ 이미지1을 찾을 수 없습니다.');
      console.log('💡 메시지 457의 이미지를 확인하거나, 수동으로 이미지 경로를 지정해주세요.');
      process.exit(1);
    }

    // 4. 457, 459, 460에 이미지 연결
    console.log('\n' + '='.repeat(60));
    console.log('📎 이미지 연결 중...\n');

    let successCount = 0;
    let failCount = 0;

    for (const messageId of messagesToLink) {
      const result = await copyImageToMessage(messageId, image1, dateFolder);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    // 최종 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 최종 요약');
    console.log('='.repeat(60));
    console.log(`\n🗑️  삭제된 폴더: ${messagesToDelete.length}개 (452, 453, 454)`);
    console.log(`✅ 이미지 연결 성공: ${successCount}개`);
    console.log(`❌ 이미지 연결 실패: ${failCount}개`);
    console.log(`\n💡 메시지 457, 459, 460은 이제 MMS로 발송 준비 완료되었습니다.\n`);

  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('✅ 모든 작업 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
