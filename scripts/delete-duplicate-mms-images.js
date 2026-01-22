/**
 * 메시지에 연결된 이미지와 갤러리 중복 이미지 확인 및 삭제
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

async function deleteDuplicateImages() {
  console.log('🔍 중복 이미지 확인 및 삭제\n');
  console.log('='.repeat(60));

  try {
    // 1. 메시지 1의 6개 청크 확인 (452, 453, 454, 457, 459, 460)
    console.log('📋 1단계: 메시지 1 (50km 이내) 6개 청크 확인');
    console.log('-'.repeat(60));
    
    const message1Ids = [452, 453, 454, 457, 459, 460];
    const { data: messages, error: msgError } = await supabase
      .from('channel_sms')
      .select('id, image_url, status, sent_count')
      .in('id', message1Ids)
      .order('id', { ascending: true });

    if (msgError) {
      console.error('❌ 메시지 조회 실패:', msgError.message);
      process.exit(1);
    }

    // 실제 메시지에 연결된 이미지 URL 수집
    const connectedImages = new Map(); // messageId -> imageFileName
    const imageToMessages = new Map(); // imageFileName -> [messageIds]

    console.log(`✅ 조회된 메시지: ${messages.length}개\n`);
    for (const msg of messages) {
      if (msg.image_url) {
        const imageFileName = msg.image_url.split('/').pop();
        connectedImages.set(msg.id, imageFileName);
        
        if (!imageToMessages.has(imageFileName)) {
          imageToMessages.set(imageFileName, []);
        }
        imageToMessages.get(imageFileName).push(msg.id);
        
        console.log(`   메시지 ${msg.id}: ✅ ${imageFileName}`);
      } else {
        console.log(`   메시지 ${msg.id}: ❌ 이미지 없음`);
      }
    }

    // 2. 2026-01-20 폴더의 모든 하위 폴더 확인
    console.log('\n📋 2단계: 갤러리 이미지 확인');
    console.log('-'.repeat(60));
    
    const baseFolder = 'originals/mms/2026-01-20';
    
    // 먼저 하위 폴더 목록 확인
    const { data: folders, error: folderError } = await supabase.storage
      .from('blog-images')
      .list(baseFolder, {
        limit: 1000
      });

    if (folderError) {
      console.error('❌ 폴더 목록 조회 실패:', folderError.message);
      process.exit(1);
    }

    // 모든 이미지 파일 수집
    const allImageFiles = [];
    
    // 각 메시지 ID 폴더 확인
    for (const messageId of message1Ids) {
      const messageFolder = `${baseFolder}/${messageId}`;
      const { data: files, error: fileError } = await supabase.storage
        .from('blog-images')
        .list(messageFolder, {
          limit: 1000
        });

      if (!fileError && files) {
        files.forEach(file => {
          if (file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
            allImageFiles.push({
              messageId,
              name: file.name,
              fullPath: `${messageFolder}/${file.name}`,
              size: file.metadata?.size || 0,
              created: file.created_at
            });
          }
        });
      }
    }

    // 루트 폴더의 파일도 확인
    const { data: rootFiles, error: rootError } = await supabase.storage
      .from('blog-images')
      .list(baseFolder, {
        limit: 1000
      });

    if (!rootError && rootFiles) {
      rootFiles.forEach(file => {
        if (file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
          const match = file.name.match(/mms-(\d+)-/);
          if (match) {
            const msgId = parseInt(match[1]);
            if (message1Ids.includes(msgId)) {
              allImageFiles.push({
                messageId: msgId,
                name: file.name,
                fullPath: `${baseFolder}/${file.name}`,
                size: file.metadata?.size || 0,
                created: file.created_at
              });
            }
          }
        }
      });
    }

    console.log(`✅ 갤러리 이미지 파일: ${allImageFiles.length}개\n`);

    // 3. 삭제할 파일 식별
    console.log('📋 3단계: 삭제 대상 파일 식별');
    console.log('-'.repeat(60));
    
    const filesToDelete = [];
    const filesToKeep = [];

    for (const file of allImageFiles) {
      const connectedFileName = connectedImages.get(file.messageId);
      
      if (connectedFileName && file.name === connectedFileName) {
        // 메시지에 연결된 이미지 - 유지
        filesToKeep.push(file);
        console.log(`   ✅ 유지: ${file.fullPath} (메시지 ${file.messageId}에 연결됨)`);
      } else {
        // 연결되지 않은 이미지 또는 다른 파일명 - 삭제 대상
        filesToDelete.push(file);
        const reason = connectedFileName 
          ? `메시지 ${file.messageId}에 연결된 이미지가 아님 (연결됨: ${connectedFileName})`
          : `메시지 ${file.messageId}에 이미지가 연결되지 않음`;
        console.log(`   ❌ 삭제: ${file.fullPath}`);
        console.log(`      이유: ${reason}`);
      }
    }

    // 4. 삭제 실행
    console.log('\n📋 4단계: 중복 이미지 삭제');
    console.log('-'.repeat(60));
    
    if (filesToDelete.length === 0) {
      console.log('✅ 삭제할 중복 이미지가 없습니다.\n');
      return;
    }

    console.log(`\n⚠️ 삭제할 파일: ${filesToDelete.length}개\n`);
    
    let deletedCount = 0;
    let errorCount = 0;

    for (const file of filesToDelete) {
      console.log(`🗑️ 삭제 중: ${file.fullPath}...`);
      
      const { error: deleteError } = await supabase.storage
        .from('blog-images')
        .remove([file.fullPath]);

      if (deleteError) {
        console.error(`   ❌ 삭제 실패: ${deleteError.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ 삭제 완료`);
        deletedCount++;
      }
    }

    // 5. 최종 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 최종 요약');
    console.log('='.repeat(60));
    console.log(`\n✅ 유지할 이미지: ${filesToKeep.length}개`);
    filesToKeep.forEach(file => {
      const msgIds = imageToMessages.get(file.name) || [];
      console.log(`   - ${file.name} (메시지: ${msgIds.join(', ')})`);
    });

    console.log(`\n🗑️ 삭제된 이미지: ${deletedCount}개`);
    console.log(`❌ 삭제 실패: ${errorCount}개`);

    if (deletedCount > 0) {
      console.log('\n✅ 중복 이미지 삭제 완료!');
    }

  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

deleteDuplicateImages()
  .then(() => {
    console.log('\n✅ 모든 작업 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
