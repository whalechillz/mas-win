const fs = require('fs');
const path = require('path');
const axios = require('axios');

// API 키 설정
const FAL_API_KEY = 'b6ae9e4b-d592-4dee-a0ac-78a4a2be3486:5642c60bc1fd9b18402026df987a2123';

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

// VIP 이미지 재생성 함수
async function regenerateVIPImages() {
  console.log('🎨 VIP 멤버십 이미지 재생성 시작...');
  
  // 캠페인 폴더 생성
  const campaignDir = path.join(__dirname, '../public/campaigns/2025-09');
  if (!fs.existsSync(campaignDir)) {
    fs.mkdirSync(campaignDir, { recursive: true });
  }

  const images = [
    {
      name: 'vip-header-senior-v2.jpg',
      prompt: 'Luxury golf VIP membership header background, elegant gold and navy blue gradient, sophisticated design, premium country club atmosphere, senior-friendly elegant typography, high-end sports branding, professional photography style, ultra high quality',
      width: 1920,
      height: 1080,
      description: 'VIP 헤더 배경 (시니어) - v2'
    },
    {
      name: 'vip-header-modern-v2.jpg',
      prompt: 'Modern golf VIP membership header background, dynamic blue and purple gradient, contemporary design, premium sports atmosphere, modern typography, high-end branding, professional photography style, ultra high quality',
      width: 1920,
      height: 1080,
      description: 'VIP 헤더 배경 (모던) - v2'
    },
    {
      name: 'vip-product-gold-v2.jpg',
      prompt: 'Premium golf driver with golden titanium face, luxury design, professional studio lighting, black background, high-end sports equipment, 4K quality, product photography, ultra detailed',
      width: 800,
      height: 600,
      description: 'VIP 제품 이미지 (골드) - v2'
    },
    {
      name: 'vip-product-black-v2.jpg',
      prompt: 'Premium black golf driver with titanium face, luxury design, professional studio lighting, dark background, high-end sports equipment, 4K quality, product photography, ultra detailed',
      width: 800,
      height: 600,
      description: 'VIP 제품 이미지 (블랙) - v2'
    },
    {
      name: 'vip-product-silver-v2.jpg',
      prompt: 'Premium silver golf driver with titanium face, luxury design, professional studio lighting, white background, high-end sports equipment, 4K quality, product photography, ultra detailed',
      width: 800,
      height: 600,
      description: 'VIP 제품 이미지 (실버) - v2'
    },
    {
      name: 'vip-round-senior-v2.jpg',
      prompt: 'Elegant golf course at sunset, senior golfers in premium golf attire, VIP atmosphere, luxury country club, golden hour lighting, sophisticated composition, professional photography, ultra high quality',
      width: 1080,
      height: 1920,
      description: 'VIP 라운드 이미지 (시니어) - v2'
    },
    {
      name: 'vip-round-modern-v2.jpg',
      prompt: 'Modern golf course with dynamic lighting, 40-50s golfers in premium golf attire, VIP atmosphere, luxury country club, contemporary composition, professional photography, ultra high quality',
      width: 1080,
      height: 1920,
      description: 'VIP 라운드 이미지 (모던) - v2'
    },
    {
      name: 'vip-badge-senior-v2.jpg',
      prompt: 'Luxury VIP membership badge, gold and burgundy design, premium golf club logo, elegant typography, high-end jewelry style, 3D rendering, ultra detailed, square format',
      width: 400,
      height: 400,
      description: 'VIP 배지 (시니어) - v2'
    },
    {
      name: 'vip-badge-modern-v2.jpg',
      prompt: 'Modern VIP membership badge, blue and orange design, contemporary golf club logo, modern typography, premium style, 3D rendering, ultra detailed, square format',
      width: 400,
      height: 400,
      description: 'VIP 배지 (모던) - v2'
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
  
  console.log(`\n🎉 VIP 멤버십 이미지 재생성 완료!`);
  console.log(`📊 성공: ${successCount}/${totalCount} 이미지`);
  
  if (successCount > 0) {
    console.log(`📁 저장 위치: ${campaignDir}`);
    console.log(`🌐 웹사이트에서 확인: http://localhost:3000/versions/funnel-2025-09-dev-01.html`);
    console.log(`🌐 웹사이트에서 확인: http://localhost:3000/versions/funnel-2025-09-dev-02.html`);
  }
}

// 스크립트 실행
if (require.main === module) {
  regenerateVIPImages().catch(console.error);
}

module.exports = { regenerateVIPImages };
