/**
 * 전유근 고객의 존재하지 않는 비디오 메타데이터 정리 스크립트
 * 
 * 목적:
 * 1. Storage에 실제 파일이 없는 비디오 메타데이터 확인
 * 2. 존재하지 않는 비디오 메타데이터 삭제 또는 is_deleted 플래그 설정
 * 3. 실제 Storage 파일 목록과 메타데이터 비교
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

async function cleanupJeonyugunVideos() {
  console.log('🧹 전유근 고객의 비디오 메타데이터 정리 시작...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 1. 전유근 고객 정보 조회
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, name, folder_name')
      .ilike('name', '%전유근%')
      .limit(1);

    if (customerError || !customers || customers.length === 0) {
      console.error('❌ 전유근 고객을 찾을 수 없습니다.');
      return;
    }

    const customer = customers[0];
    const folderName = customer.folder_name || `customer-${String(customer.id).padStart(3, '0')}`;
    console.log(`✅ 고객 확인: ${customer.name} (ID: ${customer.id}, 폴더: ${folderName})\n`);

    // 2. Storage에서 실제 파일 목록 확인
    console.log('📁 Storage에서 실제 파일 목록 확인 중...');
    const basePath = `customers/${folderName}`;
    
    // 모든 날짜 폴더 확인
    const { data: dateFolders, error: foldersError } = await supabase.storage
      .from('originals')
      .list(basePath, { limit: 100 });

    if (foldersError) {
      console.error('❌ 폴더 목록 조회 오류:', foldersError);
      return;
    }

    const actualFiles = new Set();
    const actualVideos = [];
    const actualImages = [];
    const actualDocuments = [];

    // 각 날짜 폴더의 파일 확인
    if (dateFolders && dateFolders.length > 0) {
      for (const folder of dateFolders) {
        if (folder.name === 'videos') {
          // videos 폴더 확인
          const videosPath = `${basePath}/videos`;
          const { data: videoFiles } = await supabase.storage
            .from('originals')
            .list(videosPath, { limit: 1000 });
          
          if (videoFiles) {
            videoFiles.forEach(file => {
              const fullPath = `${videosPath}/${file.name}`;
              actualFiles.add(fullPath);
              actualVideos.push({ path: fullPath, name: file.name });
            });
          }
        } else if (folder.name.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // 날짜 폴더 확인
          const datePath = `${basePath}/${folder.name}`;
          const { data: dateFiles } = await supabase.storage
            .from('originals')
            .list(datePath, { limit: 1000 });
          
          if (dateFiles) {
            dateFiles.forEach(file => {
              const fullPath = `${datePath}/${file.name}`;
              actualFiles.add(fullPath);
              
              const ext = file.name.toLowerCase().split('.').pop();
              if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext)) {
                actualVideos.push({ path: fullPath, name: file.name });
              } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext)) {
                actualImages.push({ path: fullPath, name: file.name });
              } else {
                actualDocuments.push({ path: fullPath, name: file.name });
              }
            });
          }
        }
      }
    }

    console.log(`✅ 실제 파일 확인 완료:`);
    console.log(`   - 동영상: ${actualVideos.length}개`);
    console.log(`   - 이미지: ${actualImages.length}개`);
    console.log(`   - 서류: ${actualDocuments.length}개`);
    console.log(`   - 총 파일: ${actualFiles.size}개\n`);

    // 3. 데이터베이스의 비디오 메타데이터 조회
    console.log('📹 데이터베이스의 비디오 메타데이터 확인 중...');
    const expectedPath = `originals/customers/${folderName}/`;
    
    const { data: videoMetadata, error: videoError } = await supabase
      .from('image_assets')
      .select('id, file_path, cdn_url, filename, created_at')
      .or(`file_path.ilike.${expectedPath}%,file_path.ilike.${expectedPath}videos/%`)
      .or('file_path.ilike.%.mp4,file_path.ilike.%.mov,file_path.ilike.%.avi,file_path.ilike.%.webm,file_path.ilike.%.mkv,cdn_url.ilike.%.mp4,cdn_url.ilike.%.mov,cdn_url.ilike.%.avi,cdn_url.ilike.%.webm,cdn_url.ilike.%.mkv')
      .order('created_at', { ascending: false });

    if (videoError) {
      console.error('❌ 비디오 메타데이터 조회 오류:', videoError);
      return;
    }

    console.log(`✅ 비디오 메타데이터 ${videoMetadata?.length || 0}개 발견\n`);

    // 4. 존재하지 않는 비디오 메타데이터 확인
    const videosToDelete = [];
    
    if (videoMetadata && videoMetadata.length > 0) {
      console.log('🔍 존재하지 않는 비디오 메타데이터 확인 중...\n');
      
      for (const video of videoMetadata) {
        const fileName = video.filename || '';
        let exists = false;
        
        // file_path에서 파일명 추출 시도
        let expectedFilePath = null;
        if (video.file_path) {
          // file_path가 디렉토리 경로만 있는 경우
          if (!video.file_path.includes(fileName) && fileName) {
            // videos 폴더 확인
            const videosPath = `${video.file_path}/videos/${fileName}`;
            const datePath = `${video.file_path}/${fileName}`;
            
            // 실제 파일 목록과 비교
            for (const actualVideo of actualVideos) {
              if (actualVideo.name === fileName || 
                  actualVideo.path.includes(fileName) ||
                  actualVideo.name.toLowerCase() === fileName.toLowerCase()) {
                exists = true;
                expectedFilePath = `originals/${actualVideo.path}`;
                break;
              }
            }
          } else {
            // file_path에 파일명이 포함된 경우
            const fullPath = `originals/${video.file_path}`;
            if (actualFiles.has(video.file_path.replace('originals/', ''))) {
              exists = true;
              expectedFilePath = fullPath;
            }
          }
        }
        
        // cdn_url 접근 가능 여부 확인
        if (!exists && video.cdn_url) {
          try {
            const response = await fetch(video.cdn_url, { method: 'HEAD' });
            if (response.ok) {
              exists = true;
              console.log(`   ✅ cdn_url 접근 가능: ${video.filename || '파일명 없음'}`);
            }
          } catch (e) {
            // 접근 불가
          }
        }
        
        if (!exists) {
          videosToDelete.push(video);
          console.log(`   ❌ 존재하지 않음: ${video.filename || '파일명 없음'} (ID: ${video.id})`);
        } else {
          console.log(`   ✅ 존재함: ${video.filename || '파일명 없음'} (ID: ${video.id})`);
        }
      }
    }

    console.log(`\n📊 정리 대상: ${videosToDelete.length}개\n`);

    // 5. 존재하지 않는 비디오 메타데이터 삭제
    if (videosToDelete.length > 0) {
      console.log('🗑️ 존재하지 않는 비디오 메타데이터 삭제 중...\n');
      
      for (const video of videosToDelete) {
        const { error: deleteError } = await supabase
          .from('image_assets')
          .delete()
          .eq('id', video.id);
        
        if (deleteError) {
          console.error(`   ❌ 삭제 실패 (ID: ${video.id}):`, deleteError.message);
        } else {
          console.log(`   ✅ 삭제 완료: ${video.filename || '파일명 없음'} (ID: ${video.id})`);
        }
      }
    } else {
      console.log('✅ 삭제할 비디오 메타데이터가 없습니다.\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 정리 완료');
    console.log(`   - 실제 파일: 동영상 ${actualVideos.length}개, 이미지 ${actualImages.length}개, 서류 ${actualDocuments.length}개`);
    console.log(`   - 삭제된 메타데이터: ${videosToDelete.length}개`);
  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

cleanupJeonyugunVideos().catch(console.error);
