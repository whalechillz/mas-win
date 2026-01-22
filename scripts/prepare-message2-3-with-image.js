/**
 * 메시지 2, 3 준비 스크립트
 * 
 * 작업:
 * 1. WebP 이미지를 JPG로 변환
 * 2. 메시지 2 (463, 464, 465)에 이미지 연결 및 템플릿 업데이트
 * 3. 메시지 3 (472-482)에 이미지 연결 및 템플릿 업데이트
 * 4. 변수 검증
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
const SOURCE_IMAGE_PATH = 'originals/daily-branding/kakao/2026-01-12/account1/profile/nanobanana-variation-1768888665149-dg4z8b.webp';

// 메시지 템플릿
const MESSAGE_2_TEMPLATE = `[마쓰구골프] {province} 고객님을 위한 특별 제안!

{name}님, {province} 지역 고객님을 위한 온라인 특별 혜택입니다!

[원거리 특별 혜택]
• 마쓰구 티타늄 샤프트 (뮤직 장착) 신제품
• 온라인 구매 특별 할인
• 온라인 상담 및 맞춤 피팅 서비스

힘 빼고 휘둘러도, 거리는 충분합니다
{province}에서도 온라인으로 편리하게 구매하세요!

▶ 온라인 상담: https://www.masgolf.co.kr/contact
▶ 네이버 구매: https://smartstore.naver.com/mas9golf
☎ 무료 상담: 080-028-8888
☎ 매장 문의: 031-215-0013

KGFA 1급 피팅 전문 상담을 통해 최적의 솔루션을 제안해드리겠습니다.

마쓰구 수원본점
수원시 영통구 법조로149번길 200`;

const MESSAGE_3_TEMPLATE = `[마쓰구골프] {name}님, 특별 혜택 안내!

{name}님, 마쓰구 티타늄 샤프트 신제품을 만나보세요!

[특별 혜택]
• 마쓰구 티타늄 샤프트 (뮤직 장착) 신제품
• 온라인 구매 특별 할인
• 시타 예약 및 맞춤 피팅 서비스

힘 빼고 휘둘러도, 거리는 충분합니다
온라인으로 편리하게 구매하거나 직접 방문하여 체험해보세요!

▶ 온라인 상담: https://www.masgolf.co.kr/contact
▶ 네이버 구매: https://smartstore.naver.com/mas9golf
▶ 시타 예약: https://www.masgolf.co.kr/try-a-massgoo
☎ 무료 상담: 080-028-8888
☎ 매장 문의: 031-215-0013

KGFA 1급 피팅 전문 상담을 통해 최적의 솔루션을 제안해드리겠습니다.

마쓰구 수원본점
수원시 영통구 법조로149번길 200`;

async function convertAndUploadImage(messageId, dateFolder) {
  console.log(`\n📋 메시지 #${messageId} 이미지 처리 중...`);
  
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

    // 2. WebP → JPG 변환 (Solapi 호환성)
    console.log(`   🔄 WebP → JPG 변환 중...`);
    const jpgBuffer = await sharp(imageBuffer)
      .jpeg({ quality: 90 })
      .toBuffer();
    console.log(`   ✅ JPG 변환 완료 (${(jpgBuffer.length / 1024).toFixed(2)}KB)`);

    // 3. 목적지 경로 설정
    const folderPath = `originals/mms/${dateFolder}/${messageId}`;
    const timestamp = Date.now();
    const fileName = `mms-${messageId}-titanium-shaft-sita-message2-3-${timestamp}.jpg`;
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
      upload_source: 'mms-message2-3',
      file_size: jpgBuffer.length,
      format: 'jpg',
      tags: [`sms-${messageId}`, 'mms', dateFolder, 'titanium-shaft-sita', 'message2-3'],
      title: `MMS 이미지 (메시지 #${messageId}) - 타이타늄 샤프트 메시지 2/3`,
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

    return { success: true, publicUrl, storagePath };
  } catch (error) {
    console.error(`   ❌ 오류: ${error.message}`);
    return { success: false, error };
  }
}

async function updateMessage(messageId, messageText, messageCategory, messageSubcategory, imageUrl) {
  console.log(`\n📝 메시지 #${messageId} 업데이트 중...`);
  
  const updateData = {
    message_text: messageText,
    message_type: 'MMS',
    image_url: imageUrl,
    message_category: messageCategory,
    message_subcategory: messageSubcategory,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('channel_sms')
    .update(updateData)
    .eq('id', messageId)
    .select()
    .single();

  if (error) {
    console.error(`   ❌ 업데이트 실패: ${error.message}`);
    return { success: false, error };
  }

  console.log(`   ✅ 메시지 업데이트 완료`);
  return { success: true, data };
}

async function verifyMessage(messageId, expectedTemplate) {
  const { data: message, error } = await supabase
    .from('channel_sms')
    .select('id, message_text, image_url, message_category, message_subcategory, status, sent_count, recipient_numbers')
    .eq('id', messageId)
    .single();

  if (error) {
    console.error(`   ❌ 조회 실패: ${error.message}`);
    return null;
  }

  // 변수 검증
  const issues = [];
  
  if (expectedTemplate === 'message2') {
    // 메시지 2: {name}, {province} 변수 필요
    if (!message.message_text || !message.message_text.includes('{name}')) {
      issues.push('{name} 변수 없음');
    }
    if (!message.message_text || !message.message_text.includes('{province}')) {
      issues.push('{province} 변수 없음');
    }
    if (message.message_text && message.message_text.includes('시타 예약')) {
      issues.push('메시지 2에는 시타 예약 링크가 없어야 함 (온라인 구매 중심)');
    }
  } else if (expectedTemplate === 'message3') {
    // 메시지 3: {name} 변수 필요, 시타 예약 링크 필요
    if (!message.message_text || !message.message_text.includes('{name}')) {
      issues.push('{name} 변수 없음');
    }
    if (message.message_text && message.message_text.includes('{province}')) {
      issues.push('메시지 3에는 {province} 변수가 없어야 함');
    }
    if (!message.message_text || !message.message_text.includes('시타 예약')) {
      issues.push('시타 예약 링크 없음');
    }
  }

  return { message, issues };
}

async function testVariableReplacement(messageId, messageText) {
  console.log(`\n🔍 메시지 #${messageId} 변수 치환 테스트`);
  
  // 테스트 데이터
  const testCustomer = {
    name: '홍길동',
    province: '제주'
  };

  let testMessage = messageText;
  
  // {name} 변수 치환
  if (testMessage.includes('{name}')) {
    testMessage = testMessage.replace(/{name}/g, testCustomer.name);
    console.log(`   ✅ {name} → ${testCustomer.name}`);
  }
  
  // {province} 변수 치환
  if (testMessage.includes('{province}')) {
    testMessage = testMessage.replace(/{province}/g, testCustomer.province);
    console.log(`   ✅ {province} → ${testCustomer.province}`);
  }

  // 치환 후 결과 확인
  if (testMessage.includes('{') || testMessage.includes('}')) {
    const remainingVars = testMessage.match(/{[^}]+}/g);
    if (remainingVars) {
      console.log(`   ⚠️ 치환되지 않은 변수: ${remainingVars.join(', ')}`);
    }
  } else {
    console.log(`   ✅ 모든 변수 치환 완료`);
  }

  console.log(`\n   📄 치환 결과 (처음 200자):`);
  console.log(`   ${testMessage.substring(0, 200)}...`);
}

async function main() {
  console.log('🚀 메시지 2, 3 준비 및 검증 시작...\n');
  console.log('='.repeat(60));

  const dateFolder = '2026-01-20';
  const message2Ids = [463, 464, 465];
  const message3Ids = [472, 473, 474, 475, 476, 477, 478, 479, 480, 481, 482];

  try {
    // 1. 메시지 2 처리
    console.log('\n📋 1단계: 메시지 2 (50km 이상) 처리');
    console.log('-'.repeat(60));
    
    for (const messageId of message2Ids) {
      // 이미지 변환 및 업로드
      const imageResult = await convertAndUploadImage(messageId, dateFolder);
      if (!imageResult.success) {
        console.error(`   ⚠️ 메시지 ${messageId} 이미지 처리 실패, 건너뜀`);
        continue;
      }

      // 메시지 업데이트
      await updateMessage(
        messageId,
        MESSAGE_2_TEMPLATE,
        'titanium-shaft-sita',
        '50km-plus-customers',
        imageResult.publicUrl
      );

      // 변수 치환 테스트
      await testVariableReplacement(messageId, MESSAGE_2_TEMPLATE);
    }

    // 2. 메시지 3 처리
    console.log('\n📋 2단계: 메시지 3 (주소 없음) 처리');
    console.log('-'.repeat(60));
    
    for (const messageId of message3Ids) {
      // 이미지 변환 및 업로드
      const imageResult = await convertAndUploadImage(messageId, dateFolder);
      if (!imageResult.success) {
        console.error(`   ⚠️ 메시지 ${messageId} 이미지 처리 실패, 건너뜀`);
        continue;
      }

      // 메시지 업데이트
      await updateMessage(
        messageId,
        MESSAGE_3_TEMPLATE,
        'titanium-shaft-sita',
        'no-address-customers-all',
        imageResult.publicUrl
      );

      // 변수 치환 테스트
      await testVariableReplacement(messageId, MESSAGE_3_TEMPLATE);
    }

    // 3. 검증
    console.log('\n📋 3단계: 최종 검증');
    console.log('-'.repeat(60));
    
    console.log('\n✅ 메시지 2 (50km 이상) 검증:');
    const message2Issues = [];
    for (const messageId of message2Ids) {
      const result = await verifyMessage(messageId, 'message2');
      if (result) {
        const { message, issues } = result;
        const hasImage = message.image_url ? '✅' : '❌';
        const hasTemplate = message.message_text ? '✅' : '❌';
        console.log(`   메시지 ${messageId}: 이미지 ${hasImage} / 템플릿 ${hasTemplate} / ${message.sent_count || 0}명`);
        
        if (issues.length > 0) {
          console.log(`      ⚠️ 문제점: ${issues.join(', ')}`);
          message2Issues.push({ messageId, issues });
        } else {
          console.log(`      ✅ 템플릿 검증 통과`);
        }
      }
    }

    console.log('\n✅ 메시지 3 (주소 없음) 검증:');
    const message3Issues = [];
    for (const messageId of message3Ids) {
      const result = await verifyMessage(messageId, 'message3');
      if (result) {
        const { message, issues } = result;
        const hasImage = message.image_url ? '✅' : '❌';
        const hasTemplate = message.message_text ? '✅' : '❌';
        console.log(`   메시지 ${messageId}: 이미지 ${hasImage} / 템플릿 ${hasTemplate} / ${message.sent_count || 0}명`);
        
        if (issues.length > 0) {
          console.log(`      ⚠️ 문제점: ${issues.join(', ')}`);
          message3Issues.push({ messageId, issues });
        } else {
          console.log(`      ✅ 템플릿 검증 통과`);
        }
      }
    }

    // 4. 최종 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 최종 요약');
    console.log('='.repeat(60));
    
    const totalIssues = message2Issues.length + message3Issues.length;
    
    console.log(`\n✅ 메시지 2 (50km 이상): ${message2Ids.length}개`);
    console.log(`   메시지 ID: ${message2Ids.join(', ')}`);
    console.log(`   템플릿: {name}, {province} 변수 포함`);
    console.log(`   이미지: nanobanana-variation-1768888665149-dg4z8b.webp (JPG 변환)`);
    if (message2Issues.length > 0) {
      console.log(`   ⚠️ 문제: ${message2Issues.length}개 메시지에 문제 발견`);
    } else {
      console.log(`   ✅ 모든 메시지 검증 통과`);
    }
    
    console.log(`\n✅ 메시지 3 (주소 없음): ${message3Ids.length}개`);
    console.log(`   메시지 ID: ${message3Ids.join(', ')}`);
    console.log(`   템플릿: {name} 변수 포함, 시타 예약 링크 포함`);
    console.log(`   이미지: nanobanana-variation-1768888665149-dg4z8b.webp (JPG 변환)`);
    if (message3Issues.length > 0) {
      console.log(`   ⚠️ 문제: ${message3Issues.length}개 메시지에 문제 발견`);
    } else {
      console.log(`   ✅ 모든 메시지 검증 통과`);
    }
    
    if (totalIssues === 0) {
      console.log(`\n🎉 모든 메시지가 완벽하게 준비되었습니다!`);
    } else {
      console.log(`\n⚠️ 총 ${totalIssues}개 메시지에 문제가 있습니다. 위의 문제점을 확인하세요.`);
    }
    
    console.log(`\n💡 다음 단계:`);
    console.log(`   1. 관리자 페이지에서 각 메시지 확인: /admin/sms-list`);
    console.log(`   2. 메시지 템플릿 변수({name}, {province}) 자동 치환 확인`);
    console.log(`   3. 이미지 미리보기 확인`);
    console.log(`   4. 테스트 발송 후 순차적으로 발송 실행\n`);

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
