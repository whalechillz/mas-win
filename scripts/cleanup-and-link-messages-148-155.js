/**
 * 148-155번 메시지 이미지 정리 및 링크 설정
 * - 중복 이미지 삭제
 * - 128번 이미지로 링크 설정
 * - 메타데이터 생성/업데이트
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

// 128번 메시지의 이미지 URL (링크 대상)
let message128ImageUrl = null;

async function getMessage128ImageUrl() {
  console.log('🔍 128번 메시지 이미지 URL 조회...\n');
  
  const { data: message, error } = await supabase
    .from('channel_sms')
    .select('image_url')
    .eq('id', 128)
    .single();

  if (error || !message || !message.image_url) {
    console.error('❌ 128번 메시지 이미지를 찾을 수 없습니다.');
    process.exit(1);
  }

  message128ImageUrl = message.image_url;
  console.log(`✅ 128번 이미지 URL: ${message128ImageUrl}\n`);
  return message128ImageUrl;
}

async function cleanupAndLinkMessage(messageId, dateFolder, shouldLinkTo128 = false) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 메시지 ${messageId} 처리 중...`);
  console.log(`${'='.repeat(60)}\n`);

  const folderPath = `originals/mms/${dateFolder}/${messageId}`;

  try {
    // 1. Storage에서 파일 조회
    console.log(`📁 폴더 경로: ${folderPath}`);
    const { data: files, error: listError } = await supabase.storage
      .from('blog-images')
      .list(folderPath, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      console.error(`❌ 파일 목록 조회 실패: ${listError.message}`);
      return { deleted: 0, linked: false, error: true };
    }

    if (!files || files.length === 0) {
      console.log(`⚠️ 폴더에 파일이 없습니다.`);
      // 이미지가 없어도 .keep.png 생성
      if (shouldLinkTo128) {
        console.log('📌 .keep.png 파일 생성 중...');
        const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2e+8kAAAAASUVORK5CYII=';
        const content = Buffer.from(pngBase64, 'base64');
        const keepFilePath = `${folderPath}/.keep.png`;
        
        const { error: keepError } = await supabase.storage
          .from('blog-images')
          .upload(keepFilePath, content, {
            contentType: 'image/png',
            upsert: true
          });
        
        if (keepError) {
          console.error(`❌ .keep.png 생성 실패: ${keepError.message}`);
        } else {
          console.log('✅ .keep.png 생성 완료\n');
        }
      }
      return { deleted: 0, linked: false, error: false };
    }

    // 이미지 파일 필터링 (.keep.png 제외)
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const imageFiles = files.filter(file => {
      const ext = file.name.toLowerCase();
      return imageExtensions.some(extName => ext.endsWith(extName)) && file.name !== '.keep.png';
    });

    console.log(`📸 발견된 이미지 파일: ${imageFiles.length}개\n`);

    if (imageFiles.length === 0) {
      // 이미지가 없으면 .keep.png 생성
      if (shouldLinkTo128) {
        console.log('📌 .keep.png 파일 생성 중...');
        const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2e+8kAAAAASUVORK5CYII=';
        const content = Buffer.from(pngBase64, 'base64');
        const keepFilePath = `${folderPath}/.keep.png`;
        
        const { error: keepError } = await supabase.storage
          .from('blog-images')
          .upload(keepFilePath, content, {
            contentType: 'image/png',
            upsert: true
          });
        
        if (keepError) {
          console.error(`❌ .keep.png 생성 실패: ${keepError.message}`);
        } else {
          console.log('✅ .keep.png 생성 완료\n');
        }
      }
      return { deleted: 0, linked: false, error: false };
    }

    // 2. 모든 이미지 파일 삭제
    let deletedCount = 0;
    for (const file of imageFiles) {
      const filePath = `${folderPath}/${file.name}`;
      console.log(`🗑️  삭제 중: ${file.name}`);
      
      const { error: deleteError } = await supabase.storage
        .from('blog-images')
        .remove([filePath]);

      if (deleteError) {
        console.error(`   ❌ 삭제 실패: ${deleteError.message}`);
      } else {
        console.log(`   ✅ 삭제 완료`);
        deletedCount++;
      }
    }

    // 3. .keep.png 파일 생성
    console.log('\n📌 .keep.png 파일 생성 중...');
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2e+8kAAAAASUVORK5CYII=';
    const content = Buffer.from(pngBase64, 'base64');
    const keepFilePath = `${folderPath}/.keep.png`;
    
    const { error: keepError } = await supabase.storage
      .from('blog-images')
      .upload(keepFilePath, content, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (keepError) {
      console.error(`❌ .keep.png 생성 실패: ${keepError.message}`);
    } else {
      console.log('✅ .keep.png 생성 완료\n');
    }

    // 4. 128번 이미지로 링크 설정 (필요한 경우)
    if (shouldLinkTo128 && message128ImageUrl) {
      console.log('🔗 128번 이미지로 링크 설정 중...\n');
      
      // image_metadata에서 128번 이미지 찾기
      const { data: image128Meta, error: meta128Error } = await supabase
        .from('image_metadata')
        .select('*')
        .eq('image_url', message128ImageUrl)
        .maybeSingle();

      if (meta128Error) {
        console.error(`❌ 128번 이미지 메타데이터 조회 실패: ${meta128Error.message}`);
      } else if (image128Meta) {
        // 128번 이미지의 tags에 현재 메시지 ID 추가
        const currentTags = image128Meta.tags || [];
        const newTag = `sms-${messageId}`;
        
        if (!currentTags.includes(newTag)) {
          const updatedTags = [...currentTags, newTag];
          
          const { error: updateError } = await supabase
            .from('image_metadata')
            .update({
              tags: updatedTags,
              updated_at: new Date().toISOString()
            })
            .eq('id', image128Meta.id);

          if (updateError) {
            console.error(`❌ 태그 업데이트 실패: ${updateError.message}`);
          } else {
            console.log(`✅ 태그 업데이트 완료: ${JSON.stringify(updatedTags)}\n`);
          }
        } else {
          console.log(`ℹ️  태그가 이미 존재합니다: ${newTag}\n`);
        }
      } else {
        // 128번 이미지 메타데이터가 없으면 생성
        console.log('📝 128번 이미지 메타데이터 생성 중...');
        const fileName = message128ImageUrl.split('/').pop();
        const urlParts = message128ImageUrl.split('/');
        const urlPath = urlParts.slice(0, -1).join('/');
        const folderPath128 = urlPath.replace('https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/', '');
        
        const metadataPayload = {
          image_url: message128ImageUrl,
          folder_path: folderPath128,
          source: 'mms',
          channel: 'sms',
          upload_source: 'mms-link-creation',
          tags: ['sms-128', `sms-${messageId}`, 'mms'],
          title: `MMS 이미지 (메시지 #128, #${messageId})`,
          alt_text: `MMS 이미지`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: newMeta, error: insertError } = await supabase
          .from('image_metadata')
          .insert(metadataPayload)
          .select()
          .single();

        if (insertError) {
          console.error(`❌ 메타데이터 생성 실패: ${insertError.message}`);
        } else {
          console.log(`✅ 메타데이터 생성 완료 (ID: ${newMeta.id})\n`);
        }
      }

      // channel_sms.image_url 업데이트
      const { error: updateError } = await supabase
        .from('channel_sms')
        .update({
          image_url: message128ImageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (updateError) {
        console.error(`❌ channel_sms.image_url 업데이트 실패: ${updateError.message}`);
      } else {
        console.log(`✅ channel_sms.image_url 업데이트 완료\n`);
      }
    }

    return { deleted: deletedCount, linked: shouldLinkTo128, error: false };

  } catch (error) {
    console.error(`❌ 오류 발생: ${error.message}`);
    return { deleted: 0, linked: false, error: true };
  }
}

async function main() {
  console.log('🔧 148-155번 메시지 이미지 정리 및 링크 설정 시작...\n');
  console.log('='.repeat(60));

  // 128번 이미지 URL 조회
  await getMessage128ImageUrl();

  // 작업 정의: [messageId, dateFolder, shouldLinkTo128]
  const tasks = [
    [148, '2025-12-04', true],  // 4개 삭제, 128 링크
    [149, '2025-12-05', true],  // 3개 삭제, 128 링크
    [150, '2025-12-05', true],  // 1개 삭제, 128 링크
    [151, '2025-12-05', true],  // 3개 삭제, 128 링크
    [152, '2025-12-05', true],  // 2개 삭제, 128 링크
    [153, '2025-12-05', true],  // 1개 삭제, 128 링크
    [154, '2025-12-04', true],  // 1개 삭제, 128 링크
    [155, '2025-12-05', true],  // 이미 128 링크, keep.png만
  ];

  const results = {
    total: tasks.length,
    success: 0,
    failed: 0,
    totalDeleted: 0,
    totalLinked: 0
  };

  for (const [messageId, dateFolder, shouldLink] of tasks) {
    const result = await cleanupAndLinkMessage(messageId, dateFolder, shouldLink);
    
    if (result.error) {
      results.failed++;
    } else {
      results.success++;
      results.totalDeleted += result.deleted;
      if (result.linked) {
        results.totalLinked++;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 최종 결과:');
  console.log(`   총 처리: ${results.total}개`);
  console.log(`   성공: ${results.success}개`);
  console.log(`   실패: ${results.failed}개`);
  console.log(`   삭제된 이미지: ${results.totalDeleted}개`);
  console.log(`   링크 설정: ${results.totalLinked}개`);
  console.log('='.repeat(60));
  console.log('✅ 작업 완료!\n');
}

main();

 * 148-155번 메시지 이미지 정리 및 링크 설정
 * - 중복 이미지 삭제
 * - 128번 이미지로 링크 설정
 * - 메타데이터 생성/업데이트
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

// 128번 메시지의 이미지 URL (링크 대상)
let message128ImageUrl = null;

async function getMessage128ImageUrl() {
  console.log('🔍 128번 메시지 이미지 URL 조회...\n');
  
  const { data: message, error } = await supabase
    .from('channel_sms')
    .select('image_url')
    .eq('id', 128)
    .single();

  if (error || !message || !message.image_url) {
    console.error('❌ 128번 메시지 이미지를 찾을 수 없습니다.');
    process.exit(1);
  }

  message128ImageUrl = message.image_url;
  console.log(`✅ 128번 이미지 URL: ${message128ImageUrl}\n`);
  return message128ImageUrl;
}

async function cleanupAndLinkMessage(messageId, dateFolder, shouldLinkTo128 = false) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 메시지 ${messageId} 처리 중...`);
  console.log(`${'='.repeat(60)}\n`);

  const folderPath = `originals/mms/${dateFolder}/${messageId}`;

  try {
    // 1. Storage에서 파일 조회
    console.log(`📁 폴더 경로: ${folderPath}`);
    const { data: files, error: listError } = await supabase.storage
      .from('blog-images')
      .list(folderPath, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      console.error(`❌ 파일 목록 조회 실패: ${listError.message}`);
      return { deleted: 0, linked: false, error: true };
    }

    if (!files || files.length === 0) {
      console.log(`⚠️ 폴더에 파일이 없습니다.`);
      // 이미지가 없어도 .keep.png 생성
      if (shouldLinkTo128) {
        console.log('📌 .keep.png 파일 생성 중...');
        const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2e+8kAAAAASUVORK5CYII=';
        const content = Buffer.from(pngBase64, 'base64');
        const keepFilePath = `${folderPath}/.keep.png`;
        
        const { error: keepError } = await supabase.storage
          .from('blog-images')
          .upload(keepFilePath, content, {
            contentType: 'image/png',
            upsert: true
          });
        
        if (keepError) {
          console.error(`❌ .keep.png 생성 실패: ${keepError.message}`);
        } else {
          console.log('✅ .keep.png 생성 완료\n');
        }
      }
      return { deleted: 0, linked: false, error: false };
    }

    // 이미지 파일 필터링 (.keep.png 제외)
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const imageFiles = files.filter(file => {
      const ext = file.name.toLowerCase();
      return imageExtensions.some(extName => ext.endsWith(extName)) && file.name !== '.keep.png';
    });

    console.log(`📸 발견된 이미지 파일: ${imageFiles.length}개\n`);

    if (imageFiles.length === 0) {
      // 이미지가 없으면 .keep.png 생성
      if (shouldLinkTo128) {
        console.log('📌 .keep.png 파일 생성 중...');
        const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2e+8kAAAAASUVORK5CYII=';
        const content = Buffer.from(pngBase64, 'base64');
        const keepFilePath = `${folderPath}/.keep.png`;
        
        const { error: keepError } = await supabase.storage
          .from('blog-images')
          .upload(keepFilePath, content, {
            contentType: 'image/png',
            upsert: true
          });
        
        if (keepError) {
          console.error(`❌ .keep.png 생성 실패: ${keepError.message}`);
        } else {
          console.log('✅ .keep.png 생성 완료\n');
        }
      }
      return { deleted: 0, linked: false, error: false };
    }

    // 2. 모든 이미지 파일 삭제
    let deletedCount = 0;
    for (const file of imageFiles) {
      const filePath = `${folderPath}/${file.name}`;
      console.log(`🗑️  삭제 중: ${file.name}`);
      
      const { error: deleteError } = await supabase.storage
        .from('blog-images')
        .remove([filePath]);

      if (deleteError) {
        console.error(`   ❌ 삭제 실패: ${deleteError.message}`);
      } else {
        console.log(`   ✅ 삭제 완료`);
        deletedCount++;
      }
    }

    // 3. .keep.png 파일 생성
    console.log('\n📌 .keep.png 파일 생성 중...');
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2e+8kAAAAASUVORK5CYII=';
    const content = Buffer.from(pngBase64, 'base64');
    const keepFilePath = `${folderPath}/.keep.png`;
    
    const { error: keepError } = await supabase.storage
      .from('blog-images')
      .upload(keepFilePath, content, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (keepError) {
      console.error(`❌ .keep.png 생성 실패: ${keepError.message}`);
    } else {
      console.log('✅ .keep.png 생성 완료\n');
    }

    // 4. 128번 이미지로 링크 설정 (필요한 경우)
    if (shouldLinkTo128 && message128ImageUrl) {
      console.log('🔗 128번 이미지로 링크 설정 중...\n');
      
      // image_metadata에서 128번 이미지 찾기
      const { data: image128Meta, error: meta128Error } = await supabase
        .from('image_metadata')
        .select('*')
        .eq('image_url', message128ImageUrl)
        .maybeSingle();

      if (meta128Error) {
        console.error(`❌ 128번 이미지 메타데이터 조회 실패: ${meta128Error.message}`);
      } else if (image128Meta) {
        // 128번 이미지의 tags에 현재 메시지 ID 추가
        const currentTags = image128Meta.tags || [];
        const newTag = `sms-${messageId}`;
        
        if (!currentTags.includes(newTag)) {
          const updatedTags = [...currentTags, newTag];
          
          const { error: updateError } = await supabase
            .from('image_metadata')
            .update({
              tags: updatedTags,
              updated_at: new Date().toISOString()
            })
            .eq('id', image128Meta.id);

          if (updateError) {
            console.error(`❌ 태그 업데이트 실패: ${updateError.message}`);
          } else {
            console.log(`✅ 태그 업데이트 완료: ${JSON.stringify(updatedTags)}\n`);
          }
        } else {
          console.log(`ℹ️  태그가 이미 존재합니다: ${newTag}\n`);
        }
      } else {
        // 128번 이미지 메타데이터가 없으면 생성
        console.log('📝 128번 이미지 메타데이터 생성 중...');
        const fileName = message128ImageUrl.split('/').pop();
        const urlParts = message128ImageUrl.split('/');
        const urlPath = urlParts.slice(0, -1).join('/');
        const folderPath128 = urlPath.replace('https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/', '');
        
        const metadataPayload = {
          image_url: message128ImageUrl,
          folder_path: folderPath128,
          source: 'mms',
          channel: 'sms',
          upload_source: 'mms-link-creation',
          tags: ['sms-128', `sms-${messageId}`, 'mms'],
          title: `MMS 이미지 (메시지 #128, #${messageId})`,
          alt_text: `MMS 이미지`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: newMeta, error: insertError } = await supabase
          .from('image_metadata')
          .insert(metadataPayload)
          .select()
          .single();

        if (insertError) {
          console.error(`❌ 메타데이터 생성 실패: ${insertError.message}`);
        } else {
          console.log(`✅ 메타데이터 생성 완료 (ID: ${newMeta.id})\n`);
        }
      }

      // channel_sms.image_url 업데이트
      const { error: updateError } = await supabase
        .from('channel_sms')
        .update({
          image_url: message128ImageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (updateError) {
        console.error(`❌ channel_sms.image_url 업데이트 실패: ${updateError.message}`);
      } else {
        console.log(`✅ channel_sms.image_url 업데이트 완료\n`);
      }
    }

    return { deleted: deletedCount, linked: shouldLinkTo128, error: false };

  } catch (error) {
    console.error(`❌ 오류 발생: ${error.message}`);
    return { deleted: 0, linked: false, error: true };
  }
}

async function main() {
  console.log('🔧 148-155번 메시지 이미지 정리 및 링크 설정 시작...\n');
  console.log('='.repeat(60));

  // 128번 이미지 URL 조회
  await getMessage128ImageUrl();

  // 작업 정의: [messageId, dateFolder, shouldLinkTo128]
  const tasks = [
    [148, '2025-12-04', true],  // 4개 삭제, 128 링크
    [149, '2025-12-05', true],  // 3개 삭제, 128 링크
    [150, '2025-12-05', true],  // 1개 삭제, 128 링크
    [151, '2025-12-05', true],  // 3개 삭제, 128 링크
    [152, '2025-12-05', true],  // 2개 삭제, 128 링크
    [153, '2025-12-05', true],  // 1개 삭제, 128 링크
    [154, '2025-12-04', true],  // 1개 삭제, 128 링크
    [155, '2025-12-05', true],  // 이미 128 링크, keep.png만
  ];

  const results = {
    total: tasks.length,
    success: 0,
    failed: 0,
    totalDeleted: 0,
    totalLinked: 0
  };

  for (const [messageId, dateFolder, shouldLink] of tasks) {
    const result = await cleanupAndLinkMessage(messageId, dateFolder, shouldLink);
    
    if (result.error) {
      results.failed++;
    } else {
      results.success++;
      results.totalDeleted += result.deleted;
      if (result.linked) {
        results.totalLinked++;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 최종 결과:');
  console.log(`   총 처리: ${results.total}개`);
  console.log(`   성공: ${results.success}개`);
  console.log(`   실패: ${results.failed}개`);
  console.log(`   삭제된 이미지: ${results.totalDeleted}개`);
  console.log(`   링크 설정: ${results.totalLinked}개`);
  console.log('='.repeat(60));
  console.log('✅ 작업 완료!\n');
}

main();

 * 148-155번 메시지 이미지 정리 및 링크 설정
 * - 중복 이미지 삭제
 * - 128번 이미지로 링크 설정
 * - 메타데이터 생성/업데이트
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

// 128번 메시지의 이미지 URL (링크 대상)
let message128ImageUrl = null;

async function getMessage128ImageUrl() {
  console.log('🔍 128번 메시지 이미지 URL 조회...\n');
  
  const { data: message, error } = await supabase
    .from('channel_sms')
    .select('image_url')
    .eq('id', 128)
    .single();

  if (error || !message || !message.image_url) {
    console.error('❌ 128번 메시지 이미지를 찾을 수 없습니다.');
    process.exit(1);
  }

  message128ImageUrl = message.image_url;
  console.log(`✅ 128번 이미지 URL: ${message128ImageUrl}\n`);
  return message128ImageUrl;
}

async function cleanupAndLinkMessage(messageId, dateFolder, shouldLinkTo128 = false) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 메시지 ${messageId} 처리 중...`);
  console.log(`${'='.repeat(60)}\n`);

  const folderPath = `originals/mms/${dateFolder}/${messageId}`;

  try {
    // 1. Storage에서 파일 조회
    console.log(`📁 폴더 경로: ${folderPath}`);
    const { data: files, error: listError } = await supabase.storage
      .from('blog-images')
      .list(folderPath, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      console.error(`❌ 파일 목록 조회 실패: ${listError.message}`);
      return { deleted: 0, linked: false, error: true };
    }

    if (!files || files.length === 0) {
      console.log(`⚠️ 폴더에 파일이 없습니다.`);
      // 이미지가 없어도 .keep.png 생성
      if (shouldLinkTo128) {
        console.log('📌 .keep.png 파일 생성 중...');
        const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2e+8kAAAAASUVORK5CYII=';
        const content = Buffer.from(pngBase64, 'base64');
        const keepFilePath = `${folderPath}/.keep.png`;
        
        const { error: keepError } = await supabase.storage
          .from('blog-images')
          .upload(keepFilePath, content, {
            contentType: 'image/png',
            upsert: true
          });
        
        if (keepError) {
          console.error(`❌ .keep.png 생성 실패: ${keepError.message}`);
        } else {
          console.log('✅ .keep.png 생성 완료\n');
        }
      }
      return { deleted: 0, linked: false, error: false };
    }

    // 이미지 파일 필터링 (.keep.png 제외)
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const imageFiles = files.filter(file => {
      const ext = file.name.toLowerCase();
      return imageExtensions.some(extName => ext.endsWith(extName)) && file.name !== '.keep.png';
    });

    console.log(`📸 발견된 이미지 파일: ${imageFiles.length}개\n`);

    if (imageFiles.length === 0) {
      // 이미지가 없으면 .keep.png 생성
      if (shouldLinkTo128) {
        console.log('📌 .keep.png 파일 생성 중...');
        const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2e+8kAAAAASUVORK5CYII=';
        const content = Buffer.from(pngBase64, 'base64');
        const keepFilePath = `${folderPath}/.keep.png`;
        
        const { error: keepError } = await supabase.storage
          .from('blog-images')
          .upload(keepFilePath, content, {
            contentType: 'image/png',
            upsert: true
          });
        
        if (keepError) {
          console.error(`❌ .keep.png 생성 실패: ${keepError.message}`);
        } else {
          console.log('✅ .keep.png 생성 완료\n');
        }
      }
      return { deleted: 0, linked: false, error: false };
    }

    // 2. 모든 이미지 파일 삭제
    let deletedCount = 0;
    for (const file of imageFiles) {
      const filePath = `${folderPath}/${file.name}`;
      console.log(`🗑️  삭제 중: ${file.name}`);
      
      const { error: deleteError } = await supabase.storage
        .from('blog-images')
        .remove([filePath]);

      if (deleteError) {
        console.error(`   ❌ 삭제 실패: ${deleteError.message}`);
      } else {
        console.log(`   ✅ 삭제 완료`);
        deletedCount++;
      }
    }

    // 3. .keep.png 파일 생성
    console.log('\n📌 .keep.png 파일 생성 중...');
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2e+8kAAAAASUVORK5CYII=';
    const content = Buffer.from(pngBase64, 'base64');
    const keepFilePath = `${folderPath}/.keep.png`;
    
    const { error: keepError } = await supabase.storage
      .from('blog-images')
      .upload(keepFilePath, content, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (keepError) {
      console.error(`❌ .keep.png 생성 실패: ${keepError.message}`);
    } else {
      console.log('✅ .keep.png 생성 완료\n');
    }

    // 4. 128번 이미지로 링크 설정 (필요한 경우)
    if (shouldLinkTo128 && message128ImageUrl) {
      console.log('🔗 128번 이미지로 링크 설정 중...\n');
      
      // image_metadata에서 128번 이미지 찾기
      const { data: image128Meta, error: meta128Error } = await supabase
        .from('image_metadata')
        .select('*')
        .eq('image_url', message128ImageUrl)
        .maybeSingle();

      if (meta128Error) {
        console.error(`❌ 128번 이미지 메타데이터 조회 실패: ${meta128Error.message}`);
      } else if (image128Meta) {
        // 128번 이미지의 tags에 현재 메시지 ID 추가
        const currentTags = image128Meta.tags || [];
        const newTag = `sms-${messageId}`;
        
        if (!currentTags.includes(newTag)) {
          const updatedTags = [...currentTags, newTag];
          
          const { error: updateError } = await supabase
            .from('image_metadata')
            .update({
              tags: updatedTags,
              updated_at: new Date().toISOString()
            })
            .eq('id', image128Meta.id);

          if (updateError) {
            console.error(`❌ 태그 업데이트 실패: ${updateError.message}`);
          } else {
            console.log(`✅ 태그 업데이트 완료: ${JSON.stringify(updatedTags)}\n`);
          }
        } else {
          console.log(`ℹ️  태그가 이미 존재합니다: ${newTag}\n`);
        }
      } else {
        // 128번 이미지 메타데이터가 없으면 생성
        console.log('📝 128번 이미지 메타데이터 생성 중...');
        const fileName = message128ImageUrl.split('/').pop();
        const urlParts = message128ImageUrl.split('/');
        const urlPath = urlParts.slice(0, -1).join('/');
        const folderPath128 = urlPath.replace('https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/', '');
        
        const metadataPayload = {
          image_url: message128ImageUrl,
          folder_path: folderPath128,
          source: 'mms',
          channel: 'sms',
          upload_source: 'mms-link-creation',
          tags: ['sms-128', `sms-${messageId}`, 'mms'],
          title: `MMS 이미지 (메시지 #128, #${messageId})`,
          alt_text: `MMS 이미지`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: newMeta, error: insertError } = await supabase
          .from('image_metadata')
          .insert(metadataPayload)
          .select()
          .single();

        if (insertError) {
          console.error(`❌ 메타데이터 생성 실패: ${insertError.message}`);
        } else {
          console.log(`✅ 메타데이터 생성 완료 (ID: ${newMeta.id})\n`);
        }
      }

      // channel_sms.image_url 업데이트
      const { error: updateError } = await supabase
        .from('channel_sms')
        .update({
          image_url: message128ImageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (updateError) {
        console.error(`❌ channel_sms.image_url 업데이트 실패: ${updateError.message}`);
      } else {
        console.log(`✅ channel_sms.image_url 업데이트 완료\n`);
      }
    }

    return { deleted: deletedCount, linked: shouldLinkTo128, error: false };

  } catch (error) {
    console.error(`❌ 오류 발생: ${error.message}`);
    return { deleted: 0, linked: false, error: true };
  }
}

async function main() {
  console.log('🔧 148-155번 메시지 이미지 정리 및 링크 설정 시작...\n');
  console.log('='.repeat(60));

  // 128번 이미지 URL 조회
  await getMessage128ImageUrl();

  // 작업 정의: [messageId, dateFolder, shouldLinkTo128]
  const tasks = [
    [148, '2025-12-04', true],  // 4개 삭제, 128 링크
    [149, '2025-12-05', true],  // 3개 삭제, 128 링크
    [150, '2025-12-05', true],  // 1개 삭제, 128 링크
    [151, '2025-12-05', true],  // 3개 삭제, 128 링크
    [152, '2025-12-05', true],  // 2개 삭제, 128 링크
    [153, '2025-12-05', true],  // 1개 삭제, 128 링크
    [154, '2025-12-04', true],  // 1개 삭제, 128 링크
    [155, '2025-12-05', true],  // 이미 128 링크, keep.png만
  ];

  const results = {
    total: tasks.length,
    success: 0,
    failed: 0,
    totalDeleted: 0,
    totalLinked: 0
  };

  for (const [messageId, dateFolder, shouldLink] of tasks) {
    const result = await cleanupAndLinkMessage(messageId, dateFolder, shouldLink);
    
    if (result.error) {
      results.failed++;
    } else {
      results.success++;
      results.totalDeleted += result.deleted;
      if (result.linked) {
        results.totalLinked++;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 최종 결과:');
  console.log(`   총 처리: ${results.total}개`);
  console.log(`   성공: ${results.success}개`);
  console.log(`   실패: ${results.failed}개`);
  console.log(`   삭제된 이미지: ${results.totalDeleted}개`);
  console.log(`   링크 설정: ${results.totalLinked}개`);
  console.log('='.repeat(60));
  console.log('✅ 작업 완료!\n');
}

main();

 * 148-155번 메시지 이미지 정리 및 링크 설정
 * - 중복 이미지 삭제
 * - 128번 이미지로 링크 설정
 * - 메타데이터 생성/업데이트
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

// 128번 메시지의 이미지 URL (링크 대상)
let message128ImageUrl = null;

async function getMessage128ImageUrl() {
  console.log('🔍 128번 메시지 이미지 URL 조회...\n');
  
  const { data: message, error } = await supabase
    .from('channel_sms')
    .select('image_url')
    .eq('id', 128)
    .single();

  if (error || !message || !message.image_url) {
    console.error('❌ 128번 메시지 이미지를 찾을 수 없습니다.');
    process.exit(1);
  }

  message128ImageUrl = message.image_url;
  console.log(`✅ 128번 이미지 URL: ${message128ImageUrl}\n`);
  return message128ImageUrl;
}

async function cleanupAndLinkMessage(messageId, dateFolder, shouldLinkTo128 = false) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 메시지 ${messageId} 처리 중...`);
  console.log(`${'='.repeat(60)}\n`);

  const folderPath = `originals/mms/${dateFolder}/${messageId}`;

  try {
    // 1. Storage에서 파일 조회
    console.log(`📁 폴더 경로: ${folderPath}`);
    const { data: files, error: listError } = await supabase.storage
      .from('blog-images')
      .list(folderPath, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      console.error(`❌ 파일 목록 조회 실패: ${listError.message}`);
      return { deleted: 0, linked: false, error: true };
    }

    if (!files || files.length === 0) {
      console.log(`⚠️ 폴더에 파일이 없습니다.`);
      // 이미지가 없어도 .keep.png 생성
      if (shouldLinkTo128) {
        console.log('📌 .keep.png 파일 생성 중...');
        const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2e+8kAAAAASUVORK5CYII=';
        const content = Buffer.from(pngBase64, 'base64');
        const keepFilePath = `${folderPath}/.keep.png`;
        
        const { error: keepError } = await supabase.storage
          .from('blog-images')
          .upload(keepFilePath, content, {
            contentType: 'image/png',
            upsert: true
          });
        
        if (keepError) {
          console.error(`❌ .keep.png 생성 실패: ${keepError.message}`);
        } else {
          console.log('✅ .keep.png 생성 완료\n');
        }
      }
      return { deleted: 0, linked: false, error: false };
    }

    // 이미지 파일 필터링 (.keep.png 제외)
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const imageFiles = files.filter(file => {
      const ext = file.name.toLowerCase();
      return imageExtensions.some(extName => ext.endsWith(extName)) && file.name !== '.keep.png';
    });

    console.log(`📸 발견된 이미지 파일: ${imageFiles.length}개\n`);

    if (imageFiles.length === 0) {
      // 이미지가 없으면 .keep.png 생성
      if (shouldLinkTo128) {
        console.log('📌 .keep.png 파일 생성 중...');
        const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2e+8kAAAAASUVORK5CYII=';
        const content = Buffer.from(pngBase64, 'base64');
        const keepFilePath = `${folderPath}/.keep.png`;
        
        const { error: keepError } = await supabase.storage
          .from('blog-images')
          .upload(keepFilePath, content, {
            contentType: 'image/png',
            upsert: true
          });
        
        if (keepError) {
          console.error(`❌ .keep.png 생성 실패: ${keepError.message}`);
        } else {
          console.log('✅ .keep.png 생성 완료\n');
        }
      }
      return { deleted: 0, linked: false, error: false };
    }

    // 2. 모든 이미지 파일 삭제
    let deletedCount = 0;
    for (const file of imageFiles) {
      const filePath = `${folderPath}/${file.name}`;
      console.log(`🗑️  삭제 중: ${file.name}`);
      
      const { error: deleteError } = await supabase.storage
        .from('blog-images')
        .remove([filePath]);

      if (deleteError) {
        console.error(`   ❌ 삭제 실패: ${deleteError.message}`);
      } else {
        console.log(`   ✅ 삭제 완료`);
        deletedCount++;
      }
    }

    // 3. .keep.png 파일 생성
    console.log('\n📌 .keep.png 파일 생성 중...');
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2e+8kAAAAASUVORK5CYII=';
    const content = Buffer.from(pngBase64, 'base64');
    const keepFilePath = `${folderPath}/.keep.png`;
    
    const { error: keepError } = await supabase.storage
      .from('blog-images')
      .upload(keepFilePath, content, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (keepError) {
      console.error(`❌ .keep.png 생성 실패: ${keepError.message}`);
    } else {
      console.log('✅ .keep.png 생성 완료\n');
    }

    // 4. 128번 이미지로 링크 설정 (필요한 경우)
    if (shouldLinkTo128 && message128ImageUrl) {
      console.log('🔗 128번 이미지로 링크 설정 중...\n');
      
      // image_metadata에서 128번 이미지 찾기
      const { data: image128Meta, error: meta128Error } = await supabase
        .from('image_metadata')
        .select('*')
        .eq('image_url', message128ImageUrl)
        .maybeSingle();

      if (meta128Error) {
        console.error(`❌ 128번 이미지 메타데이터 조회 실패: ${meta128Error.message}`);
      } else if (image128Meta) {
        // 128번 이미지의 tags에 현재 메시지 ID 추가
        const currentTags = image128Meta.tags || [];
        const newTag = `sms-${messageId}`;
        
        if (!currentTags.includes(newTag)) {
          const updatedTags = [...currentTags, newTag];
          
          const { error: updateError } = await supabase
            .from('image_metadata')
            .update({
              tags: updatedTags,
              updated_at: new Date().toISOString()
            })
            .eq('id', image128Meta.id);

          if (updateError) {
            console.error(`❌ 태그 업데이트 실패: ${updateError.message}`);
          } else {
            console.log(`✅ 태그 업데이트 완료: ${JSON.stringify(updatedTags)}\n`);
          }
        } else {
          console.log(`ℹ️  태그가 이미 존재합니다: ${newTag}\n`);
        }
      } else {
        // 128번 이미지 메타데이터가 없으면 생성
        console.log('📝 128번 이미지 메타데이터 생성 중...');
        const fileName = message128ImageUrl.split('/').pop();
        const urlParts = message128ImageUrl.split('/');
        const urlPath = urlParts.slice(0, -1).join('/');
        const folderPath128 = urlPath.replace('https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/', '');
        
        const metadataPayload = {
          image_url: message128ImageUrl,
          folder_path: folderPath128,
          source: 'mms',
          channel: 'sms',
          upload_source: 'mms-link-creation',
          tags: ['sms-128', `sms-${messageId}`, 'mms'],
          title: `MMS 이미지 (메시지 #128, #${messageId})`,
          alt_text: `MMS 이미지`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: newMeta, error: insertError } = await supabase
          .from('image_metadata')
          .insert(metadataPayload)
          .select()
          .single();

        if (insertError) {
          console.error(`❌ 메타데이터 생성 실패: ${insertError.message}`);
        } else {
          console.log(`✅ 메타데이터 생성 완료 (ID: ${newMeta.id})\n`);
        }
      }

      // channel_sms.image_url 업데이트
      const { error: updateError } = await supabase
        .from('channel_sms')
        .update({
          image_url: message128ImageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (updateError) {
        console.error(`❌ channel_sms.image_url 업데이트 실패: ${updateError.message}`);
      } else {
        console.log(`✅ channel_sms.image_url 업데이트 완료\n`);
      }
    }

    return { deleted: deletedCount, linked: shouldLinkTo128, error: false };

  } catch (error) {
    console.error(`❌ 오류 발생: ${error.message}`);
    return { deleted: 0, linked: false, error: true };
  }
}

async function main() {
  console.log('🔧 148-155번 메시지 이미지 정리 및 링크 설정 시작...\n');
  console.log('='.repeat(60));

  // 128번 이미지 URL 조회
  await getMessage128ImageUrl();

  // 작업 정의: [messageId, dateFolder, shouldLinkTo128]
  const tasks = [
    [148, '2025-12-04', true],  // 4개 삭제, 128 링크
    [149, '2025-12-05', true],  // 3개 삭제, 128 링크
    [150, '2025-12-05', true],  // 1개 삭제, 128 링크
    [151, '2025-12-05', true],  // 3개 삭제, 128 링크
    [152, '2025-12-05', true],  // 2개 삭제, 128 링크
    [153, '2025-12-05', true],  // 1개 삭제, 128 링크
    [154, '2025-12-04', true],  // 1개 삭제, 128 링크
    [155, '2025-12-05', true],  // 이미 128 링크, keep.png만
  ];

  const results = {
    total: tasks.length,
    success: 0,
    failed: 0,
    totalDeleted: 0,
    totalLinked: 0
  };

  for (const [messageId, dateFolder, shouldLink] of tasks) {
    const result = await cleanupAndLinkMessage(messageId, dateFolder, shouldLink);
    
    if (result.error) {
      results.failed++;
    } else {
      results.success++;
      results.totalDeleted += result.deleted;
      if (result.linked) {
        results.totalLinked++;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 최종 결과:');
  console.log(`   총 처리: ${results.total}개`);
  console.log(`   성공: ${results.success}개`);
  console.log(`   실패: ${results.failed}개`);
  console.log(`   삭제된 이미지: ${results.totalDeleted}개`);
  console.log(`   링크 설정: ${results.totalLinked}개`);
  console.log('='.repeat(60));
  console.log('✅ 작업 완료!\n');
}

main();

 * 148-155번 메시지 이미지 정리 및 링크 설정
 * - 중복 이미지 삭제
 * - 128번 이미지로 링크 설정
 * - 메타데이터 생성/업데이트
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

// 128번 메시지의 이미지 URL (링크 대상)
let message128ImageUrl = null;

async function getMessage128ImageUrl() {
  console.log('🔍 128번 메시지 이미지 URL 조회...\n');
  
  const { data: message, error } = await supabase
    .from('channel_sms')
    .select('image_url')
    .eq('id', 128)
    .single();

  if (error || !message || !message.image_url) {
    console.error('❌ 128번 메시지 이미지를 찾을 수 없습니다.');
    process.exit(1);
  }

  message128ImageUrl = message.image_url;
  console.log(`✅ 128번 이미지 URL: ${message128ImageUrl}\n`);
  return message128ImageUrl;
}

async function cleanupAndLinkMessage(messageId, dateFolder, shouldLinkTo128 = false) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 메시지 ${messageId} 처리 중...`);
  console.log(`${'='.repeat(60)}\n`);

  const folderPath = `originals/mms/${dateFolder}/${messageId}`;

  try {
    // 1. Storage에서 파일 조회
    console.log(`📁 폴더 경로: ${folderPath}`);
    const { data: files, error: listError } = await supabase.storage
      .from('blog-images')
      .list(folderPath, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      console.error(`❌ 파일 목록 조회 실패: ${listError.message}`);
      return { deleted: 0, linked: false, error: true };
    }

    if (!files || files.length === 0) {
      console.log(`⚠️ 폴더에 파일이 없습니다.`);
      // 이미지가 없어도 .keep.png 생성
      if (shouldLinkTo128) {
        console.log('📌 .keep.png 파일 생성 중...');
        const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2e+8kAAAAASUVORK5CYII=';
        const content = Buffer.from(pngBase64, 'base64');
        const keepFilePath = `${folderPath}/.keep.png`;
        
        const { error: keepError } = await supabase.storage
          .from('blog-images')
          .upload(keepFilePath, content, {
            contentType: 'image/png',
            upsert: true
          });
        
        if (keepError) {
          console.error(`❌ .keep.png 생성 실패: ${keepError.message}`);
        } else {
          console.log('✅ .keep.png 생성 완료\n');
        }
      }
      return { deleted: 0, linked: false, error: false };
    }

    // 이미지 파일 필터링 (.keep.png 제외)
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const imageFiles = files.filter(file => {
      const ext = file.name.toLowerCase();
      return imageExtensions.some(extName => ext.endsWith(extName)) && file.name !== '.keep.png';
    });

    console.log(`📸 발견된 이미지 파일: ${imageFiles.length}개\n`);

    if (imageFiles.length === 0) {
      // 이미지가 없으면 .keep.png 생성
      if (shouldLinkTo128) {
        console.log('📌 .keep.png 파일 생성 중...');
        const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2e+8kAAAAASUVORK5CYII=';
        const content = Buffer.from(pngBase64, 'base64');
        const keepFilePath = `${folderPath}/.keep.png`;
        
        const { error: keepError } = await supabase.storage
          .from('blog-images')
          .upload(keepFilePath, content, {
            contentType: 'image/png',
            upsert: true
          });
        
        if (keepError) {
          console.error(`❌ .keep.png 생성 실패: ${keepError.message}`);
        } else {
          console.log('✅ .keep.png 생성 완료\n');
        }
      }
      return { deleted: 0, linked: false, error: false };
    }

    // 2. 모든 이미지 파일 삭제
    let deletedCount = 0;
    for (const file of imageFiles) {
      const filePath = `${folderPath}/${file.name}`;
      console.log(`🗑️  삭제 중: ${file.name}`);
      
      const { error: deleteError } = await supabase.storage
        .from('blog-images')
        .remove([filePath]);

      if (deleteError) {
        console.error(`   ❌ 삭제 실패: ${deleteError.message}`);
      } else {
        console.log(`   ✅ 삭제 완료`);
        deletedCount++;
      }
    }

    // 3. .keep.png 파일 생성
    console.log('\n📌 .keep.png 파일 생성 중...');
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2e+8kAAAAASUVORK5CYII=';
    const content = Buffer.from(pngBase64, 'base64');
    const keepFilePath = `${folderPath}/.keep.png`;
    
    const { error: keepError } = await supabase.storage
      .from('blog-images')
      .upload(keepFilePath, content, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (keepError) {
      console.error(`❌ .keep.png 생성 실패: ${keepError.message}`);
    } else {
      console.log('✅ .keep.png 생성 완료\n');
    }

    // 4. 128번 이미지로 링크 설정 (필요한 경우)
    if (shouldLinkTo128 && message128ImageUrl) {
      console.log('🔗 128번 이미지로 링크 설정 중...\n');
      
      // image_metadata에서 128번 이미지 찾기
      const { data: image128Meta, error: meta128Error } = await supabase
        .from('image_metadata')
        .select('*')
        .eq('image_url', message128ImageUrl)
        .maybeSingle();

      if (meta128Error) {
        console.error(`❌ 128번 이미지 메타데이터 조회 실패: ${meta128Error.message}`);
      } else if (image128Meta) {
        // 128번 이미지의 tags에 현재 메시지 ID 추가
        const currentTags = image128Meta.tags || [];
        const newTag = `sms-${messageId}`;
        
        if (!currentTags.includes(newTag)) {
          const updatedTags = [...currentTags, newTag];
          
          const { error: updateError } = await supabase
            .from('image_metadata')
            .update({
              tags: updatedTags,
              updated_at: new Date().toISOString()
            })
            .eq('id', image128Meta.id);

          if (updateError) {
            console.error(`❌ 태그 업데이트 실패: ${updateError.message}`);
          } else {
            console.log(`✅ 태그 업데이트 완료: ${JSON.stringify(updatedTags)}\n`);
          }
        } else {
          console.log(`ℹ️  태그가 이미 존재합니다: ${newTag}\n`);
        }
      } else {
        // 128번 이미지 메타데이터가 없으면 생성
        console.log('📝 128번 이미지 메타데이터 생성 중...');
        const fileName = message128ImageUrl.split('/').pop();
        const urlParts = message128ImageUrl.split('/');
        const urlPath = urlParts.slice(0, -1).join('/');
        const folderPath128 = urlPath.replace('https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/', '');
        
        const metadataPayload = {
          image_url: message128ImageUrl,
          folder_path: folderPath128,
          source: 'mms',
          channel: 'sms',
          upload_source: 'mms-link-creation',
          tags: ['sms-128', `sms-${messageId}`, 'mms'],
          title: `MMS 이미지 (메시지 #128, #${messageId})`,
          alt_text: `MMS 이미지`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: newMeta, error: insertError } = await supabase
          .from('image_metadata')
          .insert(metadataPayload)
          .select()
          .single();

        if (insertError) {
          console.error(`❌ 메타데이터 생성 실패: ${insertError.message}`);
        } else {
          console.log(`✅ 메타데이터 생성 완료 (ID: ${newMeta.id})\n`);
        }
      }

      // channel_sms.image_url 업데이트
      const { error: updateError } = await supabase
        .from('channel_sms')
        .update({
          image_url: message128ImageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (updateError) {
        console.error(`❌ channel_sms.image_url 업데이트 실패: ${updateError.message}`);
      } else {
        console.log(`✅ channel_sms.image_url 업데이트 완료\n`);
      }
    }

    return { deleted: deletedCount, linked: shouldLinkTo128, error: false };

  } catch (error) {
    console.error(`❌ 오류 발생: ${error.message}`);
    return { deleted: 0, linked: false, error: true };
  }
}

async function main() {
  console.log('🔧 148-155번 메시지 이미지 정리 및 링크 설정 시작...\n');
  console.log('='.repeat(60));

  // 128번 이미지 URL 조회
  await getMessage128ImageUrl();

  // 작업 정의: [messageId, dateFolder, shouldLinkTo128]
  const tasks = [
    [148, '2025-12-04', true],  // 4개 삭제, 128 링크
    [149, '2025-12-05', true],  // 3개 삭제, 128 링크
    [150, '2025-12-05', true],  // 1개 삭제, 128 링크
    [151, '2025-12-05', true],  // 3개 삭제, 128 링크
    [152, '2025-12-05', true],  // 2개 삭제, 128 링크
    [153, '2025-12-05', true],  // 1개 삭제, 128 링크
    [154, '2025-12-04', true],  // 1개 삭제, 128 링크
    [155, '2025-12-05', true],  // 이미 128 링크, keep.png만
  ];

  const results = {
    total: tasks.length,
    success: 0,
    failed: 0,
    totalDeleted: 0,
    totalLinked: 0
  };

  for (const [messageId, dateFolder, shouldLink] of tasks) {
    const result = await cleanupAndLinkMessage(messageId, dateFolder, shouldLink);
    
    if (result.error) {
      results.failed++;
    } else {
      results.success++;
      results.totalDeleted += result.deleted;
      if (result.linked) {
        results.totalLinked++;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 최종 결과:');
  console.log(`   총 처리: ${results.total}개`);
  console.log(`   성공: ${results.success}개`);
  console.log(`   실패: ${results.failed}개`);
  console.log(`   삭제된 이미지: ${results.totalDeleted}개`);
  console.log(`   링크 설정: ${results.totalLinked}개`);
  console.log('='.repeat(60));
  console.log('✅ 작업 완료!\n');
}

main();









