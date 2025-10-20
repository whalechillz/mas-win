const fs = require('fs');
const path = require('path');
const axios = require('axios');

// API 키 설정 (환경변수에서 가져오기)
const FAL_API_KEY = process.env.FAL_API_KEY || process.env.FAL_AI_KEY;

// 이미지 생성 요청 함수
async function generateImage(prompt, width, height, model = 'flux') {
  try {
    console.log(`🔄 이미지 생성 중: ${prompt.substring(0, 50)}... (${width}x${height})`);
    
    const response = await axios.post('https://fal.run/fal-ai/flux', {
      prompt: prompt,
      width: width,
      height: height,
      model: model,
      num_images: 1
    }, {
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error(`❌ 이미지 생성 실패:`, error.response?.data || error.message);
    return null;
  }
}

// 이미지 다운로드 함수
async function downloadImage(url, filepath) {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`✅ 이미지 다운로드 완료: ${path.basename(filepath)}`);
        resolve(filepath);
      });
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`❌ 이미지 다운로드 실패:`, error.message);
    return null;
  }
}

// 누락된 VIP 이미지 생성 함수
async function generateMissingVIPImages() {
  console.log('🎨 누락된 VIP 이미지 생성 시작...');
  
  // 캠페인 폴더 생성
  const campaignDir = path.join(__dirname, '../public/campaigns/2025-09');
  if (!fs.existsSync(campaignDir)) {
    fs.mkdirSync(campaignDir, { recursive: true });
  }

  const images = [
    {
      name: 'vip-consultation-senior.jpg',
      prompt: 'Professional golf consultation service, senior-friendly design, elegant office setting, golf equipment display, premium customer service atmosphere',
      width: 800,
      height: 600,
      description: 'VIP 상담 (시니어)'
    },
    {
      name: 'vip-consultation-modern.jpg',
      prompt: 'Modern golf consultation service, contemporary office design, professional atmosphere, golf equipment showcase, premium customer service',
      width: 800,
      height: 600,
      description: 'VIP 상담 (모던)'
    },
    {
      name: 'vip-discount-senior.jpg',
      prompt: 'Luxury golf discount benefits, elegant discount cards, premium golf equipment with price tags, senior-friendly design, exclusive membership benefits',
      width: 800,
      height: 600,
      description: 'VIP 할인 혜택 (시니어)'
    },
    {
      name: 'vip-discount-modern.jpg',
      prompt: 'Modern golf discount benefits, contemporary discount cards, premium golf equipment with price tags, modern design, exclusive membership benefits',
      width: 800,
      height: 600,
      description: 'VIP 할인 혜택 (모던)'
    }
  ];

  let successCount = 0;
  let totalCount = images.length;

  for (const image of images) {
    try {
      console.log(`\n🔄 ${image.description} 생성 중...`);
      
      const result = await generateImage(image.prompt, image.width, image.height);
      
      if (result && result.images && result.images[0]) {
        const imageUrl = result.images[0].url;
        const filepath = path.join(campaignDir, image.name);
        
        const downloadResult = await downloadImage(imageUrl, filepath);
        if (downloadResult) {
          successCount++;
          console.log(`✅ ${image.name} 생성 완료!`);
        }
      } else {
        console.log(`❌ ${image.description} 생성 실패: 이미지 URL 없음`);
      }
      
      // API 호출 간격 조절
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.log(`❌ ${image.description} 생성 실패:`, error.message);
    }
  }
  
  console.log(`\n🎉 누락된 VIP 이미지 생성 완료!`);
  console.log(`📊 성공: ${successCount}/${totalCount} 이미지`);
  
  if (successCount > 0) {
    console.log(`📁 저장 위치: ${campaignDir}`);
    console.log(`🌐 웹사이트에서 확인: http://localhost:3000/versions/funnel-2025-09-dev-01.html`);
    console.log(`🌐 웹사이트에서 확인: http://localhost:3000/versions/funnel-2025-09-dev-02.html`);
  }
}

// 스크립트 실행
if (require.main === module) {
  generateMissingVIPImages().catch(console.error);
}

module.exports = { generateMissingVIPImages };
