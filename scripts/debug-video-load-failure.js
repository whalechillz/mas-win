/**
 * 비디오 로드 실패 원인 확인 스크립트
 * 
 * 문제: MediaRenderer.tsx:59에서 "비디오 로드 실패" 오류 발생
 * 원인 확인: 비디오 URL이 유효한지, 파일이 실제로 존재하는지 확인
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugVideoLoadFailure() {
  console.log('🔍 비디오 로드 실패 원인 확인 시작...\n');
  
  // 1. image_assets에서 비디오 파일 조회
  console.log('1️⃣ image_assets에서 비디오 파일 조회...');
  const { data: videoAssets, error: videoError } = await supabase
    .from('image_assets')
    .select('id, cdn_url, file_path, created_at')
    .or('cdn_url.ilike.%.mp4%,cdn_url.ilike.%.mov%,cdn_url.ilike.%.avi%,cdn_url.ilike.%.webm%,cdn_url.ilike.%.mkv%,file_path.ilike.%.mp4%,file_path.ilike.%.mov%,file_path.ilike.%.avi%,file_path.ilike.%.webm%,file_path.ilike.%.mkv%')
    .limit(50);
  
  if (videoError) {
    console.error('❌ 비디오 조회 오류:', videoError);
    return;
  }
  
  console.log(`✅ ${videoAssets?.length || 0}개의 비디오 파일 발견\n`);
  
  if (!videoAssets || videoAssets.length === 0) {
    console.log('⚠️ 비디오 파일이 없습니다.');
    return;
  }
  
  // 2. cdn_url이 NULL인 비디오 확인
  console.log('2️⃣ cdn_url이 NULL인 비디오 확인...');
  const videosWithoutCdnUrl = videoAssets.filter(v => !v.cdn_url && v.file_path);
  console.log(`⚠️ cdn_url이 NULL인 비디오: ${videosWithoutCdnUrl.length}개\n`);
  
  if (videosWithoutCdnUrl.length > 0) {
    console.log('   📋 샘플 레코드 (최대 5개):');
    videosWithoutCdnUrl.slice(0, 5).forEach((v, idx) => {
      console.log(`      [${idx + 1}] ID: ${v.id}`);
      console.log(`          file_path: ${v.file_path?.substring(0, 100)}...`);
      console.log(`          cdn_url: ${v.cdn_url || 'NULL'}`);
    });
    console.log('');
  }
  
  // 3. 비디오 URL 샘플 확인
  console.log('3️⃣ 비디오 URL 샘플 확인...');
  const sampleVideos = videoAssets.slice(0, 10);
  
  for (const video of sampleVideos) {
    const videoUrl = video.cdn_url;
    const filePath = video.file_path;
    
    console.log(`   📹 비디오: ${video.id}`);
    console.log(`      cdn_url: ${videoUrl ? videoUrl.substring(0, 100) + '...' : 'NULL'}`);
    console.log(`      file_path: ${filePath ? filePath.substring(0, 100) + '...' : 'NULL'}`);
    
    // URL이 있으면 실제 파일 존재 여부 확인
    if (videoUrl) {
      try {
        // URL에서 파일 경로 추출
        const urlMatch = videoUrl.match(/\/blog-images\/(.+)$/);
        if (urlMatch) {
          const storagePath = urlMatch[1];
          console.log(`      Storage 경로: ${storagePath.substring(0, 80)}...`);
          
          // Storage에서 파일 존재 여부 확인
          const { data: fileInfo, error: fileError } = await supabase.storage
            .from('blog-images')
            .list(storagePath.substring(0, storagePath.lastIndexOf('/')), {
              limit: 1000,
              search: storagePath.split('/').pop()
            });
          
          if (fileError) {
            console.log(`      ⚠️ Storage 조회 오류: ${fileError.message}`);
          } else {
            const fileName = storagePath.split('/').pop();
            const fileExists = fileInfo?.some(f => f.name === fileName);
            console.log(`      ${fileExists ? '✅' : '❌'} Storage에 파일 ${fileExists ? '존재' : '없음'}`);
          }
        }
      } catch (error) {
        console.log(`      ⚠️ URL 파싱 오류: ${error.message}`);
      }
    } else if (filePath) {
      console.log(`      ⚠️ cdn_url이 없어 file_path로부터 URL 생성 필요`);
    }
    console.log('');
  }
  
  // 4. customers 폴더의 비디오 확인
  console.log('4️⃣ customers 폴더의 비디오 확인...');
  const { data: customerVideos, error: customerVideoError } = await supabase
    .from('image_assets')
    .select('id, cdn_url, file_path')
    .ilike('file_path', 'originals/customers/%')
    .or('file_path.ilike.%.mp4%,file_path.ilike.%.mov%,file_path.ilike.%.avi%,file_path.ilike.%.webm%,file_path.ilike.%.mkv%')
    .limit(20);
  
  if (!customerVideoError && customerVideos) {
    console.log(`✅ customers 폴더의 비디오: ${customerVideos.length}개`);
    
    const videosWithCdnUrl = customerVideos.filter(v => v.cdn_url);
    const videosWithoutCdnUrl = customerVideos.filter(v => !v.cdn_url);
    
    console.log(`   - cdn_url 있음: ${videosWithCdnUrl.length}개`);
    console.log(`   - cdn_url 없음: ${videosWithoutCdnUrl.length}개\n`);
    
    if (videosWithoutCdnUrl.length > 0) {
      console.log('   ⚠️ cdn_url이 없는 비디오 (최대 5개):');
      videosWithoutCdnUrl.slice(0, 5).forEach((v, idx) => {
        console.log(`      [${idx + 1}] ${v.file_path?.substring(0, 100)}...`);
      });
      console.log('');
    }
  }
  
  // 5. 원인 분석
  console.log('🔍 원인 분석:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (videosWithoutCdnUrl.length > 0) {
    console.log('❌ 주요 원인: cdn_url이 NULL인 비디오');
    console.log(`   - cdn_url이 NULL인 비디오: ${videosWithoutCdnUrl.length}개`);
    console.log('   ⚠️ file_path는 있지만 cdn_url이 없어 URL을 생성할 수 없음');
    console.log('   ⚠️ MediaRenderer가 빈 URL이나 잘못된 URL로 비디오를 로드하려고 시도');
  }
  
  const videosWithInvalidUrl = videoAssets.filter(v => {
    if (!v.cdn_url) return false;
    return !v.cdn_url.startsWith('http://') && !v.cdn_url.startsWith('https://');
  });
  
  if (videosWithInvalidUrl.length > 0) {
    console.log('❌ 주요 원인: 잘못된 URL 형식');
    console.log(`   - 잘못된 URL 형식: ${videosWithInvalidUrl.length}개`);
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('✅ 확인 완료');
}

debugVideoLoadFailure().catch(console.error);
