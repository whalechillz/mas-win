/**
 * 이남구 고객 Storage 파일 기반으로 DB 메타데이터 재생성
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

async function restoreLeenamguMetadata() {
  console.log('🔧 이남구 고객 DB 메타데이터 재생성...\n');

  const DRY_RUN = !process.argv.includes('--execute');

  if (DRY_RUN) {
    console.log('🔍 DRY RUN 모드: 실제 생성 없이 시뮬레이션만 수행합니다.\n');
  } else {
    console.log('🚀 실제 메타데이터 생성을 시작합니다...\n');
  }

  try {
    // 1. 고객 정보 확인
    const { data: customer } = await supabase
      .from('customers')
      .select('id, name, folder_name')
      .eq('folder_name', 'leenamgu-8768')
      .single();

    if (!customer) {
      console.error('❌ 이남구 고객을 찾을 수 없습니다.');
      return;
    }

    console.log(`✅ 고객: ${customer.name} (ID: ${customer.id})\n`);

    // 2. Storage 파일 확인
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('blog-images')
      .list('originals/customers/leenamgu-8768/2024-10-29', {
        limit: 1000
      });

    if (storageError) {
      console.error('❌ Storage 조회 실패:', storageError);
      return;
    }

    const files = (storageFiles || []).filter(f => f.id);
    console.log(`📦 Storage 실제 파일: ${files.length}개\n`);

    // 3. 각 파일에 대해 DB 메타데이터 생성
    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
      const filePath = `originals/customers/${customer.folder_name}/2024-10-29/${file.name}`;
      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath);

      const customerTag = `customer-${customer.id}`;
      const visitDateTag = 'visit-2024-10-29';
      const fileSize = file.metadata?.size || 0;
      
      // MIME 타입 및 format 추론
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const mimeTypes = {
        'webp': 'image/webp',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'mov': 'video/quicktime',
        'mp4': 'video/mp4',
        'avi': 'video/x-msvideo',
        'heic': 'image/heic'
      };
      const mimeType = mimeTypes[ext] || 'application/octet-stream';
      const format = ext.toUpperCase();

      console.log(`📝 처리 중: ${file.name}`);
      console.log(`   file_path: ${filePath}`);
      console.log(`   file_size: ${fileSize} bytes`);
      console.log(`   mime_type: ${mimeType}`);

      if (!DRY_RUN) {
        const { error: insertError } = await supabase
          .from('image_assets')
          .insert({
            filename: file.name,
            original_filename: file.name,
            file_path: filePath,
            file_size: fileSize,
            mime_type: mimeType,
            format: format,
            cdn_url: publicUrl,
            ai_tags: [customerTag, visitDateTag],
            created_at: new Date().toISOString()
          });

        if (insertError) {
          console.error(`   ❌ 생성 실패: ${insertError.message}\n`);
          errorCount++;
        } else {
          console.log(`   ✅ 메타데이터 생성 완료\n`);
          successCount++;
        }
      } else {
        console.log(`   (DRY RUN) 메타데이터 생성 예정\n`);
        successCount++;
      }
    }

    console.log('📊 결과:\n');
    console.log(`   ✅ 성공: ${successCount}개`);
    console.log(`   ❌ 실패: ${errorCount}개`);

    if (DRY_RUN) {
      console.log('\n💡 실제 메타데이터 생성을 실행하려면:');
      console.log('   node scripts/restore-leenamgu-images-metadata.js --execute');
    }

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

restoreLeenamguMetadata().catch(console.error);
