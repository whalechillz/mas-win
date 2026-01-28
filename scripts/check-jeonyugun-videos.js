/**
 * 전유근 고객의 비디오 파일 존재 여부 확인 스크립트
 * 
 * 목적:
 * 1. 데이터베이스에 메타데이터가 있는 비디오 파일 확인
 * 2. Supabase Storage에 실제 파일이 존재하는지 확인
 * 3. cdn_url, file_path, 실제 파일 존재 여부 비교
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkJeonyugunVideos() {
  console.log('🔍 전유근 고객의 비디오 파일 확인 시작...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 1. 전유근 고객 정보 조회
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, name, folder_name')
      .ilike('name', '%전유근%')
      .limit(10);

    if (customerError) {
      console.error('❌ 고객 조회 오류:', customerError);
      return;
    }

    if (!customers || customers.length === 0) {
      console.log('❌ 전유근 고객을 찾을 수 없습니다.');
      return;
    }

    console.log(`✅ 전유근 고객 ${customers.length}명 발견:`);
    customers.forEach((c, idx) => {
      console.log(`   [${idx + 1}] ID: ${c.id}, 이름: ${c.name}, 폴더명: ${c.folder_name || '없음'}`);
    });
    console.log('');

    // 2. 각 고객의 비디오 메타데이터 조회
    for (const customer of customers) {
      console.log(`\n📹 고객 "${customer.name}" (ID: ${customer.id})의 비디오 확인:`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const folderName = customer.folder_name || `customer-${String(customer.id).padStart(3, '0')}`;
      const expectedPath = `originals/customers/${folderName}/`;

      // image_assets 테이블에서 비디오 파일 조회 (videos 폴더 포함)
      const { data: videos, error: videoError } = await supabase
        .from('image_assets')
        .select('id, file_path, cdn_url, filename, created_at')
        .or(`file_path.ilike.${expectedPath}%,file_path.ilike.${expectedPath}videos/%`)
        .or('file_path.ilike.%.mp4,file_path.ilike.%.mov,file_path.ilike.%.avi,file_path.ilike.%.webm,file_path.ilike.%.mkv,cdn_url.ilike.%.mp4,cdn_url.ilike.%.mov,cdn_url.ilike.%.avi,cdn_url.ilike.%.webm,cdn_url.ilike.%.mkv')
        .order('created_at', { ascending: false });

      if (videoError) {
        console.error(`   ❌ 비디오 조회 오류:`, videoError);
        continue;
      }

      if (!videos || videos.length === 0) {
        console.log(`   ⚠️ 비디오 메타데이터가 없습니다.`);
        continue;
      }

      console.log(`   ✅ 비디오 메타데이터 ${videos.length}개 발견\n`);

      // 3. 각 비디오 파일의 실제 존재 여부 확인
      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        console.log(`   [${i + 1}] ${video.filename || '파일명 없음'}`);
        console.log(`       ID: ${video.id}`);
        console.log(`       file_path: ${video.file_path || '없음'}`);
        console.log(`       cdn_url: ${video.cdn_url ? video.cdn_url.substring(0, 80) + '...' : '없음'}`);
        console.log(`       created_at: ${video.created_at || '없음'}`);

        // file_path가 있으면 Storage에서 파일 존재 여부 확인
        if (video.file_path) {
          try {
            // 파일 경로에서 버킷명과 파일 경로 분리
            const pathParts = video.file_path.split('/');
            const bucketName = pathParts[0] || 'originals';
            const filePath = pathParts.slice(1).join('/');

            // file_path가 디렉토리 경로만 있는 경우, 해당 디렉토리의 모든 파일 목록 확인
            const directoryPath = filePath.includes('.') ? filePath.substring(0, filePath.lastIndexOf('/')) : filePath;
            const fileName = video.filename || (filePath.includes('.') ? filePath.substring(filePath.lastIndexOf('/') + 1) : null);

            console.log(`       🔍 Storage 확인: 버킷=${bucketName}, 디렉토리=${directoryPath}, 파일명=${fileName || '파일명 없음'}`);

            // 디렉토리의 모든 파일 목록 가져오기
            const { data: fileList, error: listError } = await supabase.storage
              .from(bucketName)
              .list(directoryPath, {
                limit: 1000
              });

            if (listError) {
              console.log(`       ❌ Storage 목록 조회 오류: ${listError.message}`);
            } else if (fileList && fileList.length > 0) {
              console.log(`       📁 디렉토리에 파일 ${fileList.length}개 발견:`);
              
              // 파일명으로 매칭 시도
              if (fileName) {
                const matchedFile = fileList.find(f => 
                  f.name === fileName || 
                  f.name.toLowerCase() === fileName.toLowerCase() ||
                  f.name.includes(fileName) ||
                  fileName.includes(f.name)
                );
                
                if (matchedFile) {
                  console.log(`       ✅ 매칭된 파일 발견: ${matchedFile.name} (크기: ${matchedFile.metadata?.size || '알 수 없음'} bytes)`);
                  
                  // Public URL 생성
                  const fullPath = `${directoryPath}/${matchedFile.name}`;
                  const { data: { publicUrl } } = supabase.storage
                    .from(bucketName)
                    .getPublicUrl(fullPath);

                  if (publicUrl) {
                    console.log(`       📎 Public URL: ${publicUrl.substring(0, 100)}...`);
                    
                    // URL 접근 가능 여부 확인
                    try {
                      const response = await fetch(publicUrl, { method: 'HEAD' });
                      if (response.ok) {
                        console.log(`       ✅ URL 접근 가능 (HTTP ${response.status})`);
                      } else {
                        console.log(`       ❌ URL 접근 실패 (HTTP ${response.status})`);
                      }
                    } catch (fetchError) {
                      console.log(`       ⚠️ URL 접근 확인 실패: ${fetchError.message}`);
                    }
                  }
                } else {
                  console.log(`       ⚠️ 파일명 "${fileName}"과 매칭되는 파일이 없습니다.`);
                  console.log(`       📋 디렉토리 내 파일 목록 (최대 10개):`);
                  fileList.slice(0, 10).forEach((f, idx) => {
                    console.log(`          [${idx + 1}] ${f.name}`);
                  });
                }
              } else {
                console.log(`       ⚠️ 파일명이 없어 매칭할 수 없습니다.`);
                console.log(`       📋 디렉토리 내 파일 목록 (최대 10개):`);
                fileList.slice(0, 10).forEach((f, idx) => {
                  console.log(`          [${idx + 1}] ${f.name}`);
                });
              }
            } else {
              console.log(`       ❌ Storage 디렉토리에 파일이 없습니다.`);
              
              // videos 폴더도 확인
              const videosPath = `${directoryPath}/videos`;
              console.log(`       🔍 videos 폴더 확인: ${videosPath}`);
              const { data: videosList, error: videosListError } = await supabase.storage
                .from(bucketName)
                .list(videosPath, { limit: 1000 });
              
              if (videosListError) {
                console.log(`       ⚠️ videos 폴더 조회 오류: ${videosListError.message}`);
              } else if (videosList && videosList.length > 0) {
                console.log(`       📁 videos 폴더에 파일 ${videosList.length}개 발견:`);
                videosList.slice(0, 10).forEach((f, idx) => {
                  console.log(`          [${idx + 1}] ${f.name}`);
                });
                
                // 파일명으로 매칭 시도
                if (fileName) {
                  const matchedFile = videosList.find(f => 
                    f.name === fileName || 
                    f.name.toLowerCase() === fileName.toLowerCase() ||
                    f.name.includes(fileName) ||
                    fileName.includes(f.name)
                  );
                  
                  if (matchedFile) {
                    console.log(`       ✅ videos 폴더에서 매칭된 파일 발견: ${matchedFile.name}`);
                    const fullPath = `${videosPath}/${matchedFile.name}`;
                    const { data: { publicUrl } } = supabase.storage
                      .from(bucketName)
                      .getPublicUrl(fullPath);
                    if (publicUrl) {
                      console.log(`       📎 Public URL: ${publicUrl.substring(0, 100)}...`);
                    }
                  }
                }
              } else {
                console.log(`       ❌ videos 폴더에도 파일이 없습니다.`);
              }
            }
          } catch (error) {
            console.log(`       ❌ Storage 확인 중 오류: ${error.message}`);
          }
        } else {
          console.log(`       ⚠️ file_path가 없어 Storage 확인 불가`);
        }

        // cdn_url이 있으면 접근 가능 여부 확인
        if (video.cdn_url) {
          try {
            const response = await fetch(video.cdn_url, { method: 'HEAD' });
            if (response.ok) {
              console.log(`       ✅ cdn_url 접근 가능 (HTTP ${response.status})`);
            } else {
              console.log(`       ❌ cdn_url 접근 실패 (HTTP ${response.status})`);
            }
          } catch (fetchError) {
            console.log(`       ⚠️ cdn_url 접근 확인 실패: ${fetchError.message}`);
          }
        }

        console.log('');
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 확인 완료');
  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

checkJeonyugunVideos().catch(console.error);
