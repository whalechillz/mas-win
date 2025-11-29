require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
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

async function generateImageWithMasgolfAPI(prompt, brandTone = 'senior_emotional', imageType = 'feed', logoOption = 'full-brand') {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  // 1. 먼저 프롬프트 생성 API 호출
  const promptApiUrl = new URL(`${baseUrl}/api/kakao-content/generate-prompt`);
  const promptClient = promptApiUrl.protocol === 'https:' ? https : http;
  
  const promptRequestData = JSON.stringify({
    prompt: prompt,
    accountType: brandTone === 'senior_emotional' ? 'account1' : 'account2',
    type: imageType,
    useForImageGeneration: true // 365일 통용 이미지
  });
  
  const promptOptions = {
    hostname: promptApiUrl.hostname,
    port: promptApiUrl.port || (promptApiUrl.protocol === 'https:' ? 443 : 80),
    path: promptApiUrl.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(promptRequestData)
    }
  };
  
  const promptResponse = await new Promise((resolve, reject) => {
    const req = promptClient.request(promptOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          reject(new Error(`프롬프트 JSON 파싱 오류: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.write(promptRequestData);
    req.end();
  });
  
  if (promptResponse.status !== 200 || !promptResponse.data.success) {
    throw new Error(`프롬프트 생성 실패: ${promptResponse.data.message || 'Unknown error'}`);
  }
  
  const optimizedPrompt = promptResponse.data.prompt;
  console.log(`   ✅ 프롬프트 최적화 완료 (${optimizedPrompt.length}자)`);
  
  // 2. 이미지 생성 API 호출
  const imageApiUrl = new URL(`${baseUrl}/api/kakao-content/generate-images`);
  const imageClient = imageApiUrl.protocol === 'https:' ? https : http;
  
  const imageRequestData = JSON.stringify({
    prompts: [{ prompt: optimizedPrompt }],
    metadata: {
      account: brandTone === 'senior_emotional' ? 'account1' : 'account2',
      type: imageType,
      date: new Date().toISOString().split('T')[0]
    },
    logoOption: logoOption,
    imageCount: 1
  });
  
  const imageOptions = {
    hostname: imageApiUrl.hostname,
    port: imageApiUrl.port || (imageApiUrl.protocol === 'https:' ? 443 : 80),
    path: imageApiUrl.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(imageRequestData)
    }
  };
  
  const imageResponse = await new Promise((resolve, reject) => {
    const req = imageClient.request(imageOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          reject(new Error(`이미지 생성 JSON 파싱 오류: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.write(imageRequestData);
    req.end();
  });
  
  if (imageResponse.status !== 200 || !imageResponse.data.success) {
    throw new Error(`이미지 생성 실패: ${imageResponse.data.message || 'Unknown error'}`);
  }
  
  const images = imageResponse.data.images || [];
  if (images.length === 0) {
    throw new Error('생성된 이미지가 없습니다.');
  }
  
  return images[0].url || images[0]; // 첫 번째 이미지 URL 반환
}

async function generateAndAddImages() {
  try {
    console.log('🎨 블로그 글 302에 마쓰구 이미지 생성기로 이미지 생성 및 추가 시작...\n');
    
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
    
    // 2. 기존 AI 생성 이미지 제거
    let updatedContent = post.content || '';
    const aiImagePattern = /!\[([^\]]*)\]\([^)]*ai-generated[^)]+\)/g;
    const aiImageMatches = updatedContent.match(aiImagePattern);
    
    if (aiImageMatches) {
      console.log(`🗑️ 기존 AI 생성 이미지 제거: ${aiImageMatches.length}개`);
      updatedContent = updatedContent.replace(aiImagePattern, '');
    }
    
    // 3. 이미지 생성 프롬프트 정의
    const imagePrompts = [
      {
        prompt: '전문 피터가 골프 스튜디오에서 비공인 드라이버의 필요성을 설명하는 장면',
        brandTone: 'senior_emotional',
        alt: '비공인 드라이버의 필요성'
      },
      {
        prompt: '고반발 골프 드라이버를 손에 들고 있는 전문 골퍼의 모습',
        brandTone: 'senior_emotional',
        alt: '고반발 골프 드라이버'
      }
    ];
    
    const uploadedUrls = [];
    
    // 4. 이미지 생성 및 업로드
    for (let i = 0; i < imagePrompts.length; i++) {
      const promptData = imagePrompts[i];
      console.log(`\n🔄 이미지 ${i + 1}/${imagePrompts.length} 생성 중: ${promptData.alt}...`);
      
      try {
        const generatedImageUrl = await generateImageWithMasgolfAPI(
          promptData.prompt,
          promptData.brandTone,
          'feed',
          'full-brand'
        );
        
        console.log(`   ✅ 생성 완료: ${generatedImageUrl.substring(0, 80)}...`);
        
        // 이미지 다운로드 및 Supabase에 업로드
        console.log(`   📥 이미지 다운로드 및 업로드 중...`);
        const imageBuffer = await downloadImage(generatedImageUrl);
        const fileName = `masgolf-ai-${Date.now()}-${i + 1}.png`;
        const supabaseUrl = await uploadToSupabase(imageBuffer, fileName);
        uploadedUrls.push({ url: supabaseUrl, alt: promptData.alt });
        console.log(`   ✅ 업로드 완료: ${fileName}`);
        
        // API 호출 간격
        if (i < imagePrompts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (error) {
        console.error(`   ❌ 이미지 ${i + 1} 생성 실패: ${error.message}`);
      }
    }
    
    if (uploadedUrls.length === 0) {
      console.error('❌ 생성된 이미지가 없습니다.');
      return;
    }
    
    // 5. 블로그 콘텐츠에 이미지 추가
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
    if (uploadedUrls[0]) {
      lines.splice(insertIndex, 0, '', `![${uploadedUrls[0].alt}](${uploadedUrls[0].url})`, '');
    }
    
    // 두 번째 이미지가 있으면 본문 중간에 추가
    if (uploadedUrls[1]) {
      const midPoint = Math.floor(lines.length / 2);
      lines.splice(midPoint, 0, '', `![${uploadedUrls[1].alt}](${uploadedUrls[1].url})`, '');
    }
    
    updatedContent = lines.join('\n');
    
    // 6. 콘텐츠 업데이트
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
    uploadedUrls.forEach((img, i) => {
      console.log(`   ${i + 1}. [${img.alt}] ${img.url.substring(0, 80)}...`);
    });
    
    // 7. Storage 안정화 대기
    console.log('\n⏳ Storage 안정화 대기 중 (10초)...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // 8. 메타데이터 생성
    console.log('\n🏷️ 이미지 메타데이터 생성 중...');
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    for (let i = 0; i < uploadedUrls.length; i++) {
      try {
        const imageUrl = uploadedUrls[i].url;
        const alt = uploadedUrls[i].alt;
        
        console.log(`   메타데이터 ${i + 1}/${uploadedUrls.length} 생성 중...`);
        
        const apiUrl = new URL(`${baseUrl}/api/analyze-image-general`);
        const client = apiUrl.protocol === 'https:' ? https : http;
        
        const requestData = JSON.stringify({
          imageUrl: imageUrl,
          title: alt,
          excerpt: alt
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
            alt_text: metadata.alt_text || metadata.alt || alt,
            title: metadata.title || alt,
            description: metadata.description || alt,
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

