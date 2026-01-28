/**
 * Google Vision API 키 테스트 스크립트
 * API 키 유효성 및 Vision API 활성화 상태 확인
 */

require('dotenv').config({ path: '.env.local' });

const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY;

async function testGoogleVisionAPI() {
  console.log('🔍 Google Vision API 키 테스트 시작\n');

  // 1. API 키 존재 확인
  if (!GOOGLE_VISION_API_KEY) {
    console.error('❌ GOOGLE_VISION_API_KEY 환경 변수가 설정되지 않았습니다.');
    console.log('💡 .env.local 파일에 GOOGLE_VISION_API_KEY를 추가하세요.');
    return;
  }

  console.log('✅ API 키 발견:', {
    keyPrefix: GOOGLE_VISION_API_KEY.substring(0, 20) + '...',
    keyLength: GOOGLE_VISION_API_KEY.length
  });

  // 2. 간단한 테스트 이미지 (1x1 픽셀 PNG) Base64
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  // 3. Google Vision API 호출 테스트
  console.log('\n📤 Google Vision API 호출 테스트...');
  
  const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`;
  
  const requestBody = {
    requests: [
      {
        image: {
          content: testImageBase64
        },
        features: [
          {
            type: 'DOCUMENT_TEXT_DETECTION',
            maxResults: 1
          }
        ]
      }
    ]
  };

  try {
    console.log('📡 API 요청 전송 중...');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('\n📥 API 응답:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    const responseText = await response.text();
    let responseJson = null;
    
    try {
      responseJson = JSON.parse(responseText);
    } catch (e) {
      // JSON 파싱 실패
    }

    if (!response.ok) {
      console.error('\n❌ API 호출 실패!');
      console.error('응답 상태:', response.status, response.statusText);
      console.error('응답 본문:', responseText.substring(0, 1000));
      
      if (response.status === 401) {
        console.error('\n🔴 401 Unauthorized 오류 원인 가능성:');
        console.error('1. API 키가 잘못되었거나 만료됨');
        console.error('2. Google Cloud 프로젝트에서 Vision API가 활성화되지 않음');
        console.error('3. API 키에 Vision API 권한이 없음');
        console.error('4. API 키에 IP/Referrer 제한이 설정되어 있음');
        console.error('\n💡 해결 방법:');
        console.error('1. Google Cloud Console (https://console.cloud.google.com/) 접속');
        console.error('2. APIs & Services > Credentials에서 API 키 확인');
        console.error('3. APIs & Services > Library에서 "Cloud Vision API" 검색 후 활성화 확인');
        console.error('4. API 키 제한 설정 확인 (Application restrictions, API restrictions)');
      } else if (response.status === 403) {
        console.error('\n🔴 403 Forbidden 오류 원인 가능성:');
        console.error('1. Vision API가 활성화되지 않음');
        console.error('2. 프로젝트에 결제 정보가 없음');
        console.error('3. API 키에 Vision API가 제한되어 있음');
      }
      
      if (responseJson && responseJson.error) {
        console.error('\n📋 상세 오류 정보:');
        console.error(JSON.stringify(responseJson.error, null, 2));
      }
      
      return;
    }

    console.log('\n✅ API 호출 성공!');
    console.log('응답 데이터:', JSON.stringify(responseJson, null, 2).substring(0, 500));

  } catch (error) {
    console.error('\n❌ 네트워크 오류:', error.message);
    console.error('스택:', error.stack);
  }
}

testGoogleVisionAPI();
