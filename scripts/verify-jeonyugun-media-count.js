/**
 * 전유근 고객의 실제 미디어 파일 개수 확인 및 정리
 * 사용자 확인: 동영상 1개, 이미지 12개, 서류 1개
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

async function verifyJeonyugunMediaCount() {
  console.log('🔍 전유근 고객의 미디어 파일 개수 확인 및 정리...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 1. 전유근 고객 정보 조회
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name, folder_name')
      .ilike('name', '%전유근%')
      .limit(1);

    if (!customers || customers.length === 0) {
      console.error('❌ 전유근 고객을 찾을 수 없습니다.');
      return;
    }

    const customer = customers[0];
    const folderName = customer.folder_name || `customer-${String(customer.id).padStart(3, '0')}`;
    console.log(`✅ 고객: ${customer.name} (ID: ${customer.id}, 폴더: ${folderName})\n`);

    // 2. 데이터베이스의 모든 미디어 메타데이터 조회
    const expectedPath = `originals/customers/${folderName}/`;
    const customerTag = `customer-${customer.id}`;
    
    const { data: allMedia, error: mediaError } = await supabase
      .from('image_assets')
      .select('id, file_path, cdn_url, filename, is_scanned_document, document_type, created_at')
      .ilike('file_path', `${expectedPath}%`)
      .order('created_at', { ascending: false });

    if (mediaError) {
      console.error('❌ 미디어 조회 오류:', mediaError);
      return;
    }

    if (!allMedia || allMedia.length === 0) {
      console.log('⚠️ 미디어 메타데이터가 없습니다.');
      return;
    }

    console.log(`✅ 미디어 메타데이터 ${allMedia.length}개 발견\n`);

    // 3. 파일 타입별 분류
    const videos = [];
    const images = [];
    const documents = [];

    for (const media of allMedia) {
      const url = media.cdn_url || media.file_path || '';
      const filename = media.filename || '';
      
      // 비디오 확인
      const isVideo = /\.(mp4|mov|avi|webm|mkv)$/i.test(url) || /\.(mp4|mov|avi|webm|mkv)$/i.test(filename);
      // 서류 확인
      const isDocument = media.is_scanned_document === true || 
                        (media.document_type !== null && media.document_type !== undefined && media.document_type !== '');
      
      if (isVideo) {
        videos.push(media);
      } else if (isDocument) {
        documents.push(media);
      } else {
        images.push(media);
      }
    }

    console.log('📊 현재 메타데이터 개수:');
    console.log(`   - 동영상: ${videos.length}개`);
    console.log(`   - 이미지: ${images.length}개`);
    console.log(`   - 서류: ${documents.length}개`);
    console.log(`   - 총계: ${allMedia.length}개\n`);

    // 4. 사용자 확인 개수와 비교
    const expectedVideos = 1;
    const expectedImages = 12;
    const expectedDocuments = 1;

    console.log('🎯 목표 개수 (사용자 확인):');
    console.log(`   - 동영상: ${expectedVideos}개`);
    console.log(`   - 이미지: ${expectedImages}개`);
    console.log(`   - 서류: ${expectedDocuments}개\n`);

    // 5. 각 파일의 실제 존재 여부 확인
    console.log('🔍 파일 존재 여부 확인 중...\n');

    const validVideos = [];
    const validImages = [];
    const validDocuments = [];
    const invalidMedia = [];

    // 동영상 확인
    for (const video of videos) {
      const exists = await checkFileExists(video);
      if (exists) {
        validVideos.push(video);
        console.log(`   ✅ 동영상: ${video.filename || '파일명 없음'}`);
      } else {
        invalidMedia.push(video);
        console.log(`   ❌ 동영상 (삭제 대상): ${video.filename || '파일명 없음'}`);
      }
    }

    // 이미지 확인
    for (const image of images) {
      const exists = await checkFileExists(image);
      if (exists) {
        validImages.push(image);
        console.log(`   ✅ 이미지: ${image.filename || '파일명 없음'}`);
      } else {
        invalidMedia.push(image);
        console.log(`   ❌ 이미지 (삭제 대상): ${image.filename || '파일명 없음'}`);
      }
    }

    // 서류 확인
    for (const doc of documents) {
      const exists = await checkFileExists(doc);
      if (exists) {
        validDocuments.push(doc);
        console.log(`   ✅ 서류: ${doc.filename || '파일명 없음'}`);
      } else {
        invalidMedia.push(doc);
        console.log(`   ❌ 서류 (삭제 대상): ${doc.filename || '파일명 없음'}`);
      }
    }

    console.log(`\n📊 확인 결과:`);
    console.log(`   - 유효한 동영상: ${validVideos.length}개`);
    console.log(`   - 유효한 이미지: ${validImages.length}개`);
    console.log(`   - 유효한 서류: ${validDocuments.length}개`);
    console.log(`   - 삭제 대상: ${invalidMedia.length}개\n`);

    // 6. 삭제 대상이 있으면 삭제
    if (invalidMedia.length > 0) {
      console.log('🗑️ 존재하지 않는 메타데이터 삭제 중...\n');
      
      for (const media of invalidMedia) {
        const { error: deleteError } = await supabase
          .from('image_assets')
          .delete()
          .eq('id', media.id);
        
        if (deleteError) {
          console.error(`   ❌ 삭제 실패 (ID: ${media.id}):`, deleteError.message);
        } else {
          console.log(`   ✅ 삭제 완료: ${media.filename || '파일명 없음'} (ID: ${media.id})`);
        }
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 정리 완료');
    console.log(`   - 최종 동영상: ${validVideos.length}개 (목표: ${expectedVideos}개)`);
    console.log(`   - 최종 이미지: ${validImages.length}개 (목표: ${expectedImages}개)`);
    console.log(`   - 최종 서류: ${validDocuments.length}개 (목표: ${expectedDocuments}개)`);
    console.log(`   - 삭제된 메타데이터: ${invalidMedia.length}개`);
  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

async function checkFileExists(media) {
  // cdn_url 접근 가능 여부 확인
  if (media.cdn_url) {
    try {
      const response = await fetch(media.cdn_url, { method: 'HEAD' });
      if (response.ok) {
        return true;
      }
    } catch (e) {
      // 접근 불가
    }
  }

  // file_path로 URL 생성 시도
  if (media.file_path) {
    try {
      const pathParts = media.file_path.split('/');
      const bucketName = pathParts[0] || 'originals';
      const filePath = pathParts.slice(1).join('/');
      
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      if (publicUrl) {
        const response = await fetch(publicUrl, { method: 'HEAD' });
        if (response.ok) {
          return true;
        }
      }
    } catch (e) {
      // 확인 실패
    }
  }

  return false;
}

verifyJeonyugunMediaCount().catch(console.error);
