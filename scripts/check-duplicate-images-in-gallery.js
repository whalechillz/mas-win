/**
 * 갤러리에서 중복 이미지 확인 및 정리
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

async function checkDuplicateImages() {
  console.log('🔍 갤러리 중복 이미지 확인\n');
  console.log('='.repeat(60));

  try {
    // 1. 2026-01-20 폴더의 모든 이미지 조회
    const folderPath = 'originals/mms/2026-01-20';
    console.log(`📁 폴더 경로: ${folderPath}\n`);

    const { data: files, error: listError } = await supabase.storage
      .from('blog-images')
      .list(folderPath, {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (listError) {
      console.error('❌ 파일 목록 조회 실패:', listError.message);
      process.exit(1);
    }

    console.log(`✅ 총 파일 수: ${files.length}개\n`);

    // 2. 메시지 ID별로 그룹화
    const messageGroups = {};
    const allFiles = [];

    for (const file of files) {
      // 파일명에서 메시지 ID 추출 (예: mms-457-titanium-shaft-sita-1768877867735.jpg)
      const match = file.name.match(/mms-(\d+)-/);
      if (match) {
        const messageId = match[1];
        if (!messageGroups[messageId]) {
          messageGroups[messageId] = [];
        }
        messageGroups[messageId].push({
          name: file.name,
          path: `${folderPath}/${file.name}`,
          size: file.metadata?.size || 0,
          created: file.created_at
        });
        allFiles.push({
          messageId,
          name: file.name,
          path: `${folderPath}/${file.name}`,
          size: file.metadata?.size || 0,
          created: file.created_at
        });
      }
    }

    // 3. 메시지별 이미지 개수 확인
    console.log('📊 메시지별 이미지 파일 개수:');
    console.log('-'.repeat(60));
    for (const [messageId, fileList] of Object.entries(messageGroups)) {
      console.log(`   메시지 ${messageId}: ${fileList.length}개 파일`);
      fileList.forEach(file => {
        console.log(`      - ${file.name}`);
      });
    }
    console.log('');

    // 4. 실제 메시지와 비교
    console.log('📋 실제 메시지 상태 확인:');
    console.log('-'.repeat(60));
    
    const messageIds = Object.keys(messageGroups).map(id => parseInt(id));
    const { data: messages, error: msgError } = await supabase
      .from('channel_sms')
      .select('id, message_text, image_url, status, sent_count, message_category')
      .in('id', messageIds)
      .order('id', { ascending: true });

    if (msgError) {
      console.error('❌ 메시지 조회 실패:', msgError.message);
    } else {
      console.log(`✅ 조회된 메시지: ${messages.length}개\n`);
      
      for (const msg of messages) {
        const fileCount = messageGroups[msg.id.toString()]?.length || 0;
        const imageStatus = msg.image_url ? '✅ 연결됨' : '❌ 없음';
        const imageName = msg.image_url ? msg.image_url.split('/').pop() : '-';
        
        console.log(`   메시지 ${msg.id}:`);
        console.log(`      상태: ${msg.status}`);
        console.log(`      수신자: ${msg.sent_count || 0}명`);
        console.log(`      이미지 연결: ${imageStatus}`);
        console.log(`      연결된 이미지: ${imageName}`);
        console.log(`      갤러리 파일 수: ${fileCount}개`);
        
        if (fileCount > 1) {
          console.log(`      ⚠️ 중복 파일 발견: ${fileCount}개`);
        }
        console.log('');
      }
    }

    // 5. 중복 파일 정리 제안
    console.log('='.repeat(60));
    console.log('💡 중복 파일 정리 제안');
    console.log('='.repeat(60));
    
    const duplicates = [];
    for (const [messageId, fileList] of Object.entries(messageGroups)) {
      if (fileList.length > 1) {
        // 가장 최근 파일을 제외하고 나머지는 중복으로 간주
        const sorted = fileList.sort((a, b) => 
          new Date(b.created) - new Date(a.created)
        );
        duplicates.push({
          messageId,
          keep: sorted[0],
          remove: sorted.slice(1)
        });
      }
    }

    if (duplicates.length > 0) {
      console.log(`\n⚠️ 중복 파일이 있는 메시지: ${duplicates.length}개\n`);
      duplicates.forEach(dup => {
        console.log(`메시지 ${dup.messageId}:`);
        console.log(`   ✅ 유지: ${dup.keep.name}`);
        dup.remove.forEach(file => {
          console.log(`   ❌ 삭제 제안: ${file.name}`);
        });
        console.log('');
      });
    } else {
      console.log('\n✅ 중복 파일이 없습니다.\n');
    }

    // 6. 메시지 1의 6개 청크 확인
    console.log('='.repeat(60));
    console.log('📋 메시지 1 (50km 이내) 청크 확인');
    console.log('='.repeat(60));
    
    const message1Ids = [452, 453, 454, 457, 459, 460];
    const { data: message1List, error: m1Error } = await supabase
      .from('channel_sms')
      .select('id, image_url, status, sent_count')
      .in('id', message1Ids)
      .order('id', { ascending: true });

    if (!m1Error && message1List) {
      console.log(`\n✅ 메시지 1 청크: ${message1List.length}개\n`);
      message1List.forEach(msg => {
        const hasImage = msg.image_url ? '✅' : '❌';
        const imageName = msg.image_url ? msg.image_url.split('/').pop() : '-';
        console.log(`   메시지 ${msg.id}: ${hasImage} 이미지 (${msg.sent_count || 0}명, ${msg.status})`);
        if (msg.image_url) {
          console.log(`      이미지: ${imageName}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

checkDuplicateImages()
  .then(() => {
    console.log('\n✅ 확인 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
