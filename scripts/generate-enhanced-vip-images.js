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

// 향상된 VIP 이미지 생성 함수
async function generateEnhancedVIPImages() {
  console.log('🎨 향상된 VIP 이미지 생성 시작...');
  
  // 캠페인 폴더 생성
  const campaignDir = path.join(__dirname, '../public/campaigns/2025-09');
  if (!fs.existsSync(campaignDir)) {
    fs.mkdirSync(campaignDir, { recursive: true });
  }

  const images = [
    {
      name: 'vip-warranty-senior.jpg',
      prompt: 'Luxury golf club warranty certificate, elegant gold seal, premium golf equipment with lifetime guarantee stamp, professional document design, senior-friendly elegant typography',
      width: 800,
      height: 600,
      description: '평생 보증 서비스 (시니어)'
    },
    {
      name: 'vip-warranty-modern.jpg',
      prompt: 'Modern golf club warranty certificate, contemporary design, premium golf equipment with lifetime guarantee badge, professional document layout, modern typography',
      width: 800,
      height: 600,
      description: '평생 보증 서비스 (모던)'
    },
    {
      name: 'vip-swing-analysis-senior.jpg',
      prompt: 'Senior golfer receiving swing analysis from professional coach, golf simulator screen showing swing trajectory data, elegant golf club fitting session, premium coaching environment',
      width: 800,
      height: 600,
      description: '분기별 스윙 점검 (시니어)'
    },
    {
      name: 'vip-swing-analysis-modern.jpg',
      prompt: 'Modern golf swing analysis session, professional coach analyzing swing data on high-tech simulator, contemporary golf fitting studio, advanced coaching technology',
      width: 800,
      height: 600,
      description: '분기별 스윙 점검 (모던)'
    },
    {
      name: 'vip-gifts-senior.jpg',
      prompt: 'Luxury VIP golf gift collection, premium golf bag, high-end golf balls, designer golf gloves, elegant gift packaging, senior-friendly premium presentation',
      width: 800,
      height: 600,
      description: 'VIP 전용 사은품 (시니어)'
    },
    {
      name: 'vip-gifts-modern.jpg',
      prompt: 'Modern VIP golf gift collection, contemporary premium golf accessories, designer golf equipment, sophisticated gift presentation, modern luxury packaging',
      width: 800,
      height: 600,
      description: 'VIP 전용 사은품 (모던)'
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
  
  console.log(`\n🎉 향상된 VIP 이미지 생성 완료!`);
  console.log(`📊 성공: ${successCount}/${totalCount} 이미지`);
  
  if (successCount > 0) {
    console.log(`📁 저장 위치: ${campaignDir}`);
    console.log(`🌐 웹사이트에서 확인: http://localhost:3000/versions/funnel-2025-09-dev-01.html`);
    console.log(`🌐 웹사이트에서 확인: http://localhost:3000/versions/funnel-2025-09-dev-02.html`);
  }
}

// 스크립트 실행
if (require.main === module) {
  generateEnhancedVIPImages().catch(console.error);
}

module.exports = { generateEnhancedVIPImages };
