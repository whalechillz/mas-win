/**
 * 전문 피터 작업 이미지 자동 생성 스크립트
 * AI 이미지 생성 API를 사용하여 피팅 이미지를 생성합니다.
 */

const axios = require('axios');

async function generateFitterImage() {
  try {
    console.log('🎯 전문 피터 작업 이미지 생성 시작...');
    
    const response = await axios.post('http://localhost:3000/api/kakao-content/generate-images', {
      prompts: [{
        prompt: '한국인 전문 피터가 골프 스튜디오에서 스윙 데이터를 태블릿으로 분석하는 장면, 프리미엄 골프 클럽이 배경에 배치되어 있음, 고급스러운 골프 스튜디오 인테리어, 한국인 피터의 명확한 한국인 외모와 특징, 한국인 얼굴, 한국인 피부톤, 한국인 눈, 한국인 코, 한국인 얼굴 구조'
      }],
      metadata: {
        account: 'account1', // 시니어 중심 감성형
        type: 'feed', // 피드 이미지
        date: new Date().toISOString().split('T')[0]
      },
      logoOption: 'full-brand', // 전체 MASSGOO 브랜딩 포함
      imageCount: 1
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.images && response.data.images.length > 0) {
      const imageUrl = response.data.images[0].url;
      const imagePath = response.data.images[0].path;
      
      console.log('✅ 전문 피터 이미지 생성 완료!');
      console.log('📁 이미지 URL:', imageUrl);
      console.log('📁 저장 경로:', imagePath);
      console.log('\n💡 이 이미지 URL을 try-a-massgoo.tsx의 fitterImageUrl에 추가하세요.');
      
      return imageUrl;
    } else {
      console.error('❌ 이미지 생성 실패: 응답에 이미지가 없습니다.');
      console.log('응답 데이터:', response.data);
    }
  } catch (error) {
    console.error('❌ 이미지 생성 실패:', error.response?.data || error.message);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  generateFitterImage()
    .then(() => {
      console.log('\n✅ 스크립트 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 스크립트 실패:', error);
      process.exit(1);
    });
}

module.exports = { generateFitterImage };

