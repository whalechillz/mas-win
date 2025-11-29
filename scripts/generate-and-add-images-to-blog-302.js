require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const https = require('https');
const http = require('http');
const url = require('url');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function downloadImage(imageUrl) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(imageUrl);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    client.get(parsedUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`이미지 다운로드 실패: ${response.statusCode}`));
        return;
      }
      
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function uploadToSupabase(imageBuffer, fileName) {
  const folderPath = 'originals/blog/2017-03/302';
  const filePath = `${folderPath}/${fileName}`;
  
  const { data, error } = await supabase.storage
    .from('blog-images')
    .upload(filePath, imageBuffer, {
      contentType: 'image/png',
      upsert: true
    });
  
  if (error) {
    throw new Error(`Supabase 업로드 실패: ${error.message}`);
  }
  
  const { data: urlData } = supabase.storage
    .from('blog-images')
    .getPublicUrl(filePath);
  
  return urlData.publicUrl;
}

async function generateImage(title, excerpt, imageNumber) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const apiUrl = new URL(`${baseUrl}/api/generate-blog-image`);
  const client = apiUrl.protocol === 'https:' ? https : http;
  
  const requestData = JSON.stringify({
    title: title,
    excerpt: excerpt || '',
    contentType: 'information',
    imageCount: 1
  });
  
  const options = {
    hostname: apiUrl.hostname,
    port: apiUrl.port || (apiUrl.protocol === 'https:' ? 443 : 80),
    path: apiUrl.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestData)
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode === 200 && result.success) {
            resolve(result.imageUrl);
          } else {
            reject(new Error(`이미지 생성 실패: ${result.message || 'Unknown error'}`));
          }
        } catch (e) {
          reject(new Error(`JSON 파싱 오류: ${e.message}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(requestData);
    req.end();
  });
}

async function generateAndAddImages() {
  try {
    console.log('🎨 블로그 글 302에 AI 이미지 생성 및 추가 시작...\n');
    
    // 1. 블로그 글 정보 가져오기
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('id, title, content')
      .eq('id', 302)
      .single();
    
    if (postError || !post) {
      console.error('❌ 블로그 글을 찾을 수 없습니다:', postError?.message);
      return;
    }
    
    console.log(`📝 블로그 글: ${post.title}\n`);
    
    // 2. 이미지 생성 (2장)
    const imagePrompts = [
      {
        title: '비공인 드라이버의 필요성',
        excerpt: '골프를 즐기는 분들에게 특히 유용한 비공인 드라이버의 필요성과 중요성'
      },
      {
        title: '고반발 골프 드라이버',
        excerpt: '고반발 골프 드라이버 추천, 비거리 향상을 위한 드라이버 선택'
      }
    ];
    
    const imageUrls = [];
    
    for (let i = 0; i < imagePrompts.length; i++) {
      const prompt = imagePrompts[i];
      console.log(`🔄 이미지 ${i + 1}/2 생성 중: ${prompt.title}...`);
      
      try {
        const generatedImageUrl = await generateImage(prompt.title, prompt.excerpt, i + 1);
        console.log(`   ✅ 생성 완료: ${generatedImageUrl.substring(0, 80)}...`);
        imageUrls.push(generatedImageUrl);
        
        // API 호출 간격 (너무 빠르게 호출하지 않도록)
        if (i < imagePrompts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`   ❌ 이미지 ${i + 1} 생성 실패: ${error.message}`);
      }
    }
    
    if (imageUrls.length === 0) {
      console.error('❌ 생성된 이미지가 없습니다.');
      return;
    }
    
    console.log(`\n📥 생성된 이미지 ${imageUrls.length}개를 Supabase Storage에 업로드 중...\n`);
    
    // 3. 이미지를 Supabase Storage에 업로드
    const uploadedUrls = [];
    for (let i = 0; i < imageUrls.length; i++) {
      try {
        console.log(`📤 이미지 ${i + 1}/${imageUrls.length} 업로드 중...`);
        const imageBuffer = await downloadImage(imageUrls[i]);
        const fileName = `ai-generated-${Date.now()}-${i + 1}.png`;
        const supabaseUrl = await uploadToSupabase(imageBuffer, fileName);
        uploadedUrls.push(supabaseUrl);
        console.log(`   ✅ 업로드 완료: ${fileName}`);
      } catch (error) {
        console.error(`   ❌ 업로드 실패: ${error.message}`);
      }
    }
    
    if (uploadedUrls.length === 0) {
      console.error('❌ 업로드된 이미지가 없습니다.');
      return;
    }
    
    // 4. 블로그 콘텐츠에 이미지 추가
    let updatedContent = post.content || '';
    
    // 첫 번째 이미지는 본문 시작 부분에, 두 번째 이미지는 본문 중간에 추가
    const firstImageMarkdown = `![${imagePrompts[0].title}](${uploadedUrls[0]})`;
    const secondImageMarkdown = uploadedUrls[1] ? `![${imagePrompts[1].title}](${uploadedUrls[1]})` : '';
    
    // 첫 번째 이미지를 본문 시작 부분에 추가
    const lines = updatedContent.split('\n');
    let insertIndex = 0;
    
    // 첫 번째 제목이나 본문 시작 부분 찾기
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('#')) {
        insertIndex = i + 1;
        break;
      }
    }
    
    // 첫 번째 이미지 추가
    lines.splice(insertIndex, 0, '', firstImageMarkdown, '');
    
    // 두 번째 이미지가 있으면 본문 중간에 추가 (대략 중간 지점)
    if (secondImageMarkdown) {
      const midPoint = Math.floor(lines.length / 2);
      lines.splice(midPoint, 0, '', secondImageMarkdown, '');
    }
    
    updatedContent = lines.join('\n');
    
    // 5. 콘텐츠 업데이트
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ content: updatedContent })
      .eq('id', 302);
    
    if (updateError) {
      console.error('❌ 콘텐츠 업데이트 실패:', updateError.message);
      return;
    }
    
    console.log(`\n✅ 이미지 추가 완료`);
    console.log(`📝 업데이트된 content 길이: ${updatedContent.length}자 (기존: ${post.content?.length || 0}자)`);
    console.log(`\n📊 추가된 이미지:`);
    uploadedUrls.forEach((url, i) => {
      console.log(`   ${i + 1}. ${url.substring(0, 80)}...`);
    });
    
    // 6. Storage 안정화 대기
    console.log('\n⏳ Storage 안정화 대기 중 (10초)...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // 7. 메타데이터 생성
    console.log('\n🏷️ 이미지 메타데이터 생성 중...');
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    for (let i = 0; i < uploadedUrls.length; i++) {
      try {
        const imageUrl = uploadedUrls[i];
        const prompt = imagePrompts[i];
        
        console.log(`   메타데이터 ${i + 1}/${uploadedUrls.length} 생성 중...`);
        
        const apiUrl = new URL(`${baseUrl}/api/analyze-image-general`);
        const client = apiUrl.protocol === 'https:' ? https : http;
        
        const requestData = JSON.stringify({
          imageUrl: imageUrl,
          title: prompt.title,
          excerpt: prompt.excerpt
        });
        
        const options = {
          hostname: apiUrl.hostname,
          port: apiUrl.port || (apiUrl.protocol === 'https:' ? 443 : 80),
          path: apiUrl.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestData)
          }
        };
        
        const response = await new Promise((resolve, reject) => {
          const req = client.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              try {
                resolve({ status: res.statusCode, data: JSON.parse(data) });
              } catch (e) {
                reject(new Error(`JSON 파싱 오류: ${e.message}`));
              }
            });
          });
          req.on('error', reject);
          req.write(requestData);
          req.end();
        });
        
        if (response.status === 200) {
          const metadata = response.data;
          
          const metadataToSave = {
            image_url: imageUrl,
            alt_text: metadata.alt_text || metadata.alt || prompt.title,
            title: metadata.title || prompt.title,
            description: metadata.description || prompt.excerpt,
            tags: Array.isArray(metadata.keywords) 
              ? metadata.keywords 
              : (metadata.keywords ? metadata.keywords.split(',').map(k => k.trim()) : []),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // 기존 메타데이터 확인
          const { data: existing } = await supabase
            .from('image_metadata')
            .select('id')
            .eq('image_url', imageUrl)
            .single();
          
          if (existing) {
            await supabase
              .from('image_metadata')
              .update(metadataToSave)
              .eq('id', existing.id);
          } else {
            await supabase
              .from('image_metadata')
              .insert(metadataToSave);
          }
          
          console.log(`   ✅ 메타데이터 생성 완료`);
        } else {
          console.error(`   ❌ 메타데이터 생성 실패: ${response.status}`);
        }
        
        // API 호출 간격
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`   ❌ 메타데이터 생성 오류: ${error.message}`);
      }
    }
    
    console.log('\n✅ 모든 작업 완료!');
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

generateAndAddImages();

