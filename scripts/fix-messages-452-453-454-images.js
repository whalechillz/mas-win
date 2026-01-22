/**
 * 452, 453, 454번 메시지 이미지 복구 및 근거리 고객 메시지 생성 스크립트
 * 
 * 작업:
 * 1. 452, 453, 454번 메시지에 이미지 추가
 * 2. 근거리 고객 대상 새 메시지 생성 준비
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 원본 이미지 정보
const SOURCE_IMAGE_PATH = 'originals/daily-branding/kakao/2026-01-12/account1/profile/nanobanana-variation-1768872481679-9rs7tr.webp';

async function copyImageToMessage(messageId, dateFolder) {
  console.log(`\n📋 메시지 #${messageId} 이미지 복사 중...`);
  
  try {
    // 1. 원본 이미지 다운로드
    console.log(`   원본 이미지: ${SOURCE_IMAGE_PATH}`);
    const { data: sourceImage, error: downloadError } = await supabase.storage
      .from('blog-images')
      .download(SOURCE_IMAGE_PATH);

    if (downloadError) {
      console.error(`   ❌ 원본 이미지 다운로드 실패: ${downloadError.message}`);
      return { success: false, error: downloadError };
    }

    const imageBuffer = Buffer.from(await sourceImage.arrayBuffer());
    console.log(`   ✅ 원본 이미지 다운로드 완료 (${(imageBuffer.length / 1024).toFixed(2)}KB)`);

    // 2. WebP → JPG 변환 (MMS 호환성)
    console.log(`   🔄 WebP → JPG 변환 중...`);
    const jpgBuffer = await sharp(imageBuffer)
      .jpeg({ quality: 90 })
      .toBuffer();
    console.log(`   ✅ JPG 변환 완료 (${(jpgBuffer.length / 1024).toFixed(2)}KB)`);

    // 3. 목적지 경로 설정
    const folderPath = `originals/mms/${dateFolder}/${messageId}`;
    const timestamp = Date.now();
    const fileName = `mms-${messageId}-titanium-shaft-sita-${timestamp}.jpg`;
    const storagePath = `${folderPath}/${fileName}`;

    console.log(`   📁 목적지: ${storagePath}`);

    // 4. Supabase Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(storagePath, jpgBuffer, {
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

    // 6. image_metadata에 메타데이터 저장
    const metadataPayload = {
      image_url: publicUrl,
      folder_path: folderPath,
      original_path: storagePath,
      source: 'mms',
      channel: 'sms',
      upload_source: 'mms-image-recovery',
      file_size: jpgBuffer.length,
      format: 'jpg',
      tags: [`sms-${messageId}`, 'mms', dateFolder, 'titanium-shaft-sita', 'recovered'],
      title: `MMS 이미지 (메시지 #${messageId}) - 타이타늄 샤프트 시타`,
      alt_text: `MMS 이미지`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: metadata, error: metaError } = await supabase
      .from('image_metadata')
      .upsert(metadataPayload, { onConflict: 'image_url' })
      .select()
      .single();

    if (metaError) {
      console.warn(`   ⚠️ 메타데이터 저장 실패 (계속 진행): ${metaError.message}`);
    } else {
      console.log(`   ✅ 메타데이터 저장 완료 (ID: ${metadata.id})`);
    }

    // 7. channel_sms.image_url 업데이트
    const { error: updateError } = await supabase
      .from('channel_sms')
      .update({
        image_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId);

    if (updateError) {
      console.error(`   ❌ channel_sms 업데이트 실패: ${updateError.message}`);
      return { success: false, error: updateError };
    }

    console.log(`   ✅ channel_sms.image_url 업데이트 완료\n`);

    return { success: true, imageUrl: publicUrl, storagePath };

  } catch (error) {
    console.error(`   ❌ 오류: ${error.message}`);
    return { success: false, error };
  }
}

async function createNearbyCustomerMessage() {
  console.log('\n📝 근거리 고객 대상 새 메시지 생성 준비...\n');

  try {
    // 1. 근거리 고객 수 확인 (50km 이내)
    const { data: customers, error: customerError } = await supabase
      .from('customer_address_cache')
      .select('customer_id, distance_km')
      .lt('distance_km', 50)
      .not('customer_id', 'is', null);

    if (customerError) {
      console.error('❌ 고객 조회 실패:', customerError.message);
      return { success: false, error: customerError };
    }

    const customerCount = customers?.length || 0;
    console.log(`✅ 근거리 고객 (50km 이내): ${customerCount}명`);

    if (customerCount === 0) {
      console.log('⚠️ 근거리 고객이 없습니다.');
      return { success: false, error: 'No nearby customers' };
    }

    // 2. 고객 전화번호 조회
    const customerIds = [...new Set(customers.map(c => c.customer_id))];
    const { data: customerPhones, error: phoneError } = await supabase
      .from('customers')
      .select('id, phone')
      .in('id', customerIds)
      .not('phone', 'is', null);

    if (phoneError) {
      console.error('❌ 전화번호 조회 실패:', phoneError.message);
      return { success: false, error: phoneError };
    }

    const phoneNumbers = customerPhones
      .map(c => c.phone)
      .filter(phone => phone && phone.trim().length > 0);

    console.log(`✅ 유효한 전화번호: ${phoneNumbers.length}개`);

    // 3. 메시지 템플릿 (타이타늄 샤프트 시타 - 메시지 1)
    const messageText = `안녕하세요 {name}님!

타이타늄 샤프트 시타 예약이 가능합니다! 🎯

📍 거리: {distance_km}km
⏰ 예약: 평일 09:00 - 17:00

지금 바로 예약하세요!
👉 https://www.masgolf.co.kr/sita`;

    // 4. 이미지 경로 (오늘 날짜)
    const today = new Date().toISOString().split('T')[0];
    const imageFolderPath = `originals/mms/${today}`;
    
    // 5. 새 메시지 생성 (draft 상태)
    const newMessage = {
      message_text: messageText,
      message_type: 'MMS',
      status: 'draft',
      recipient_numbers: phoneNumbers,
      sent_count: phoneNumbers.length, // recipient_count 대신 sent_count 사용
      message_category: 'titanium-shaft-sita',
      message_subcategory: 'nearby-customers',
      note: '타이타늄 샤프트 시타 - 근거리 고객 (50km 이내) 전체 발송',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: createdMessage, error: createError } = await supabase
      .from('channel_sms')
      .insert(newMessage)
      .select()
      .single();

    if (createError) {
      console.error('❌ 메시지 생성 실패:', createError.message);
      return { success: false, error: createError };
    }

    console.log(`✅ 새 메시지 생성 완료 (ID: ${createdMessage.id})`);
    console.log(`   수신자 수: ${phoneNumbers.length}명`);
    console.log(`   상태: draft`);

    // 6. 이미지 복사 (새 메시지용)
    const imageResult = await copyImageToMessage(createdMessage.id, today);
    
    if (imageResult.success) {
      // image_url 업데이트
      await supabase
        .from('channel_sms')
        .update({ image_url: imageResult.imageUrl })
        .eq('id', createdMessage.id);
      
      console.log(`✅ 이미지 연결 완료`);
    }

    console.log(`\n📋 메시지 정보:`);
    console.log(`   ID: ${createdMessage.id}`);
    console.log(`   수신자 수: ${phoneNumbers.length}명`);
    console.log(`   상태: draft`);
    console.log(`   이미지: ${imageResult.success ? '✅ 연결됨' : '❌ 실패'}`);
    console.log(`\n💡 관리자 페이지에서 확인: /admin/sms?id=${createdMessage.id}`);

    return { 
      success: true, 
      messageId: createdMessage.id,
      recipientCount: phoneNumbers.length,
      imageUrl: imageResult.imageUrl
    };

  } catch (error) {
    console.error('❌ 오류:', error);
    return { success: false, error };
  }
}

async function main() {
  console.log('🚀 452, 453, 454번 메시지 이미지 복구 및 근거리 고객 메시지 생성 시작\n');
  console.log('='.repeat(60));

  try {
    // 1. 452, 453, 454번 메시지 정보 조회
    const { data: messages, error: msgError } = await supabase
      .from('channel_sms')
      .select('id, sent_at, created_at, image_url')
      .in('id', [452, 453, 454])
      .order('id', { ascending: true });

    if (msgError) {
      console.error('❌ 메시지 조회 실패:', msgError.message);
      process.exit(1);
    }

    if (!messages || messages.length === 0) {
      console.error('❌ 메시지를 찾을 수 없습니다.');
      process.exit(1);
    }

    console.log(`✅ ${messages.length}개 메시지 조회 완료\n`);

    // 2. 각 메시지에 이미지 복사
    const results = [];
    for (const message of messages) {
      // 발송일 또는 생성일에서 날짜 추출
      const date = message.sent_at || message.created_at;
      const dateFolder = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      
      const result = await copyImageToMessage(message.id, dateFolder);
      results.push({ messageId: message.id, ...result });
    }

    // 3. 결과 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 이미지 복구 결과 요약:');
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    console.log(`   ✅ 성공: ${successCount}개`);
    console.log(`   ❌ 실패: ${failCount}개`);

    // 4. 근거리 고객 메시지 생성
    console.log('\n' + '='.repeat(60));
    const newMessageResult = await createNearbyCustomerMessage();

    // 5. 최종 요약
    console.log('\n' + '='.repeat(60));
    console.log('🎉 작업 완료 요약:');
    console.log(`   ✅ 이미지 복구: ${successCount}/${messages.length}개 성공`);
    if (newMessageResult.success) {
      console.log(`   ✅ 새 메시지 생성: ID ${newMessageResult.messageId} (${newMessageResult.recipientCount}명)`);
      console.log(`   💡 발송 준비 완료! 관리자 페이지에서 확인 후 발송하세요.`);
    } else {
      console.log(`   ⚠️ 새 메시지 생성 실패: ${newMessageResult.error?.message || '알 수 없는 오류'}`);
    }

  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('\n✅ 모든 작업 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
