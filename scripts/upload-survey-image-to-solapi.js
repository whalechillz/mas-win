/**
 * 설문 조사 이미지를 Solapi에 업로드하고 메시지에 연결
 */

const { createClient } = require('@supabase/supabase-js');
const { createSolapiSignature } = require('../utils/solapiSignature');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || '';
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || '';

if (!supabaseUrl || !supabaseKey || !SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadImageToSolapi() {
  console.log('='.repeat(100));
  console.log('🖼️ 설문 조사 이미지 Solapi 업로드');
  console.log('='.repeat(100));
  console.log('');

  const imagePath = 'public/main/products/goods/good-reviews/bucket-hat-muziik-8.webp';
  const fullPath = path.join(process.cwd(), imagePath);

  // 1. 이미지 파일 확인
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ 이미지 파일을 찾을 수 없습니다: ${fullPath}`);
    process.exit(1);
  }

  console.log(`✅ 이미지 파일 발견: ${imagePath}`);
  const imageBuffer = fs.readFileSync(fullPath);
  console.log(`   파일 크기: ${(imageBuffer.length / 1024).toFixed(2)}KB\n`);

  // 2. Solapi에 업로드
  console.log('📤 Solapi Storage에 업로드 중...');
  const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);

  try {
    // FormData 생성
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', imageBuffer, {
      filename: 'bucket-hat-muziik-8.webp',
      contentType: 'image/webp'
    });

    const uploadResponse = await fetch('https://api.solapi.com/storage/v1/files', {
      method: 'POST',
      headers: {
        ...authHeaders,
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ Solapi 업로드 실패:', uploadResponse.status, errorText);
      process.exit(1);
    }

    const uploadResult = await uploadResponse.json();
    const imageId = uploadResult.fileId || uploadResult.id;

    if (!imageId) {
      console.error('❌ Solapi imageId를 찾을 수 없습니다.');
      console.log('응답:', JSON.stringify(uploadResult, null, 2));
      process.exit(1);
    }

    console.log(`✅ Solapi 업로드 성공!`);
    console.log(`   imageId: ${imageId}\n`);

    // 3. 모든 메시지에 imageId 업데이트
    console.log('💾 메시지에 imageId 업데이트 중...');
    const messageIds = [227, 228, 229, 230, 231, 232];

    for (const messageId of messageIds) {
      const { error: updateError } = await supabase
        .from('channel_sms')
        .update({
          image_url: imageId,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (updateError) {
        console.error(`   ❌ 메시지 ${messageId} 업데이트 실패:`, updateError.message);
      } else {
        console.log(`   ✅ 메시지 ${messageId} 업데이트 완료`);
      }
    }

    console.log('\n' + '='.repeat(100));
    console.log('✅ 완료!');
    console.log('='.repeat(100));
    console.log(`\n📋 Solapi imageId: ${imageId}`);
    console.log('💡 이제 모든 메시지가 MMS 발송 준비가 되었습니다.\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

uploadImageToSolapi()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });


