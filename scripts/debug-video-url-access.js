/**
 * 비디오 URL 접근성 확인 스크립트
 * 
 * Storage에 파일이 있다면, 실제 URL 접근성과 CORS/Content-Type 확인
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * URL의 HTTP 헤더 확인
 */
function checkUrlHeaders(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      method: 'HEAD',
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      },
      timeout: 10000
    };
    
    const req = client.request(options, (res) => {
      const headers = res.headers;
      resolve({
        statusCode: res.statusCode,
        headers: {
          'content-type': headers['content-type'],
          'content-length': headers['content-length'],
          'access-control-allow-origin': headers['access-control-allow-origin'],
          'access-control-allow-methods': headers['access-control-allow-methods'],
          'access-control-allow-headers': headers['access-control-allow-headers'],
          'cache-control': headers['cache-control']
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

/**
 * 실제 파일 다운로드 테스트 (첫 1KB만)
 */
function testVideoDownload(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      method: 'GET',
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Range': 'bytes=0-1023' // 첫 1KB만
      },
      timeout: 10000
    };
    
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          contentLength: data.length,
          headers: res.headers
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

async function debugVideoUrlAccess() {
  console.log('🔍 비디오 URL 접근성 확인 시작...\n');
  
  // 1. customers 폴더의 비디오 조회
  console.log('1️⃣ customers 폴더의 비디오 조회...');
  const { data: customerVideos, error: customerVideoError } = await supabase
    .from('image_assets')
    .select('id, cdn_url, file_path, created_at')
    .ilike('file_path', 'originals/customers/%')
    .or('file_path.ilike.%.mp4%,file_path.ilike.%.mov%,file_path.ilike.%.avi%,file_path.ilike.%.webm%,file_path.ilike.%.mkv%')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (customerVideoError) {
    console.error('❌ 비디오 조회 오류:', customerVideoError);
    return;
  }
  
  if (!customerVideos || customerVideos.length === 0) {
    console.log('⚠️ customers 폴더에 비디오가 없습니다.');
    return;
  }
  
  console.log(`✅ ${customerVideos.length}개의 비디오 발견\n`);
  
  // 2. 각 비디오 URL 접근성 확인
  console.log('2️⃣ 비디오 URL 접근성 확인...\n');
  
  for (let i = 0; i < customerVideos.length; i++) {
    const video = customerVideos[i];
    const videoUrl = video.cdn_url;
    const filePath = video.file_path;
    
    console.log(`📹 비디오 [${i + 1}/${customerVideos.length}]:`);
    console.log(`   ID: ${video.id}`);
    console.log(`   file_path: ${filePath?.substring(0, 80)}...`);
    console.log(`   cdn_url: ${videoUrl ? videoUrl.substring(0, 100) + '...' : 'NULL'}`);
    
    if (!videoUrl) {
      console.log(`   ⚠️ cdn_url이 NULL입니다.\n`);
      continue;
    }
    
    // URL 헤더 확인
    try {
      console.log(`   🔍 URL 헤더 확인 중...`);
      const headers = await checkUrlHeaders(videoUrl);
      
      console.log(`   ✅ HTTP Status: ${headers.statusCode}`);
      console.log(`   📋 Headers:`);
      console.log(`      - Content-Type: ${headers.headers['content-type'] || 'N/A'}`);
      console.log(`      - Content-Length: ${headers.headers['content-length'] || 'N/A'}`);
      console.log(`      - Access-Control-Allow-Origin: ${headers.headers['access-control-allow-origin'] || 'N/A'}`);
      console.log(`      - Access-Control-Allow-Methods: ${headers.headers['access-control-allow-methods'] || 'N/A'}`);
      console.log(`      - Cache-Control: ${headers.headers['cache-control'] || 'N/A'}`);
      
      // Content-Type 확인
      const contentType = headers.headers['content-type'] || '';
      if (!contentType.includes('video/') && !contentType.includes('application/octet-stream')) {
        console.log(`   ⚠️ Content-Type이 비디오가 아닙니다: ${contentType}`);
      }
      
      // CORS 확인
      const corsOrigin = headers.headers['access-control-allow-origin'];
      if (!corsOrigin || (corsOrigin !== '*' && !corsOrigin.includes('localhost'))) {
        console.log(`   ⚠️ CORS 설정이 부족할 수 있습니다: ${corsOrigin || 'N/A'}`);
      }
      
      // 실제 다운로드 테스트
      if (headers.statusCode === 200 || headers.statusCode === 206) {
        console.log(`   🔍 실제 다운로드 테스트 중...`);
        try {
          const downloadTest = await testVideoDownload(videoUrl);
          console.log(`   ✅ 다운로드 가능: ${downloadTest.contentLength} bytes`);
        } catch (downloadError) {
          console.log(`   ❌ 다운로드 실패: ${downloadError.message}`);
        }
      } else {
        console.log(`   ❌ HTTP Status가 200/206이 아닙니다: ${headers.statusCode}`);
      }
      
    } catch (error) {
      console.log(`   ❌ URL 접근 실패: ${error.message}`);
      if (error.code === 'ENOTFOUND') {
        console.log(`      ⚠️ DNS 조회 실패 - 도메인을 찾을 수 없습니다`);
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`      ⚠️ 연결 거부 - 서버가 응답하지 않습니다`);
      } else if (error.message === 'Request timeout') {
        console.log(`      ⚠️ 요청 시간 초과 - 서버 응답이 느립니다`);
      }
    }
    
    console.log('');
  }
  
  // 3. Storage에서 직접 파일 확인
  console.log('3️⃣ Storage에서 직접 파일 확인...\n');
  
  const sampleVideo = customerVideos[0];
  if (sampleVideo && sampleVideo.file_path) {
    const filePath = sampleVideo.file_path;
    const pathParts = filePath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const folderPath = pathParts.slice(0, -1).join('/');
    
    console.log(`   📁 폴더 경로: ${folderPath}`);
    console.log(`   📄 파일명: ${fileName}`);
    
    try {
      const { data: files, error: listError } = await supabase.storage
        .from('blog-images')
        .list(folderPath, {
          limit: 100,
          search: fileName
        });
      
      if (listError) {
        console.log(`   ❌ Storage 조회 오류: ${listError.message}`);
      } else {
        const foundFile = files?.find(f => f.name === fileName);
        if (foundFile) {
          console.log(`   ✅ Storage에 파일 존재:`);
          console.log(`      - 이름: ${foundFile.name}`);
          console.log(`      - 크기: ${foundFile.metadata?.size || foundFile.metadata?.size || 'N/A'} bytes`);
          console.log(`      - Content-Type: ${foundFile.metadata?.mimetype || 'N/A'}`);
          console.log(`      - 수정일: ${foundFile.updated_at || 'N/A'}`);
          
          // Public URL 생성
          const { data: publicUrlData } = supabase.storage
            .from('blog-images')
            .getPublicUrl(filePath);
          
          if (publicUrlData?.publicUrl) {
            console.log(`      - Public URL: ${publicUrlData.publicUrl.substring(0, 100)}...`);
            
            // 생성된 URL과 cdn_url 비교
            if (publicUrlData.publicUrl !== sampleVideo.cdn_url) {
              console.log(`   ⚠️ 생성된 Public URL과 cdn_url이 다릅니다!`);
              console.log(`      - cdn_url: ${sampleVideo.cdn_url?.substring(0, 100)}...`);
              console.log(`      - Public URL: ${publicUrlData.publicUrl.substring(0, 100)}...`);
            }
          }
        } else {
          console.log(`   ❌ Storage에 파일을 찾을 수 없습니다`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Storage 조회 중 오류: ${error.message}`);
    }
  }
  
  console.log('\n✅ 확인 완료');
}

debugVideoUrlAccess().catch(console.error);
