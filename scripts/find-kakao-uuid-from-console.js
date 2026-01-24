const { chromium } = require('playwright');
require('dotenv').config({ path: '.env.local' });

const TARGET_PHONE = '01066699000';
const KAKAO_DEV_CONSOLE = 'https://developers.kakao.com';

async function findKakaoUuid() {
  console.log('🔍 카카오 개발자 콘솔에서 UUID 찾기 시작...');
  console.log(`📞 대상 전화번호: ${TARGET_PHONE}\n`);

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    // 네트워크 요청 모니터링 (카카오 API 호출 캡처)
    page.on('response', async (response) => {
      const url = response.url();
      
      // 카카오 API 응답 캡처
      if (url.includes('kapi.kakao.com') && url.includes('friends')) {
        const status = response.status();
        console.log(`\n📡 카카오 API 응답 발견: ${url}`);
        console.log(`   Status: ${status}`);
        
        if (status === 200) {
          try {
            const data = await response.json();
            console.log(`   ✅ API 응답 데이터:`, JSON.stringify(data, null, 2));
            
            if (data.elements && Array.isArray(data.elements)) {
              const friend = data.elements.find((f: any) => 
                f.phone_number && f.phone_number.replace(/[^0-9]/g, '') === TARGET_PHONE.replace(/[^0-9]/g, '')
              );
              
              if (friend) {
                console.log(`\n🎉 UUID 찾기 성공!`);
                console.log(`   UUID: ${friend.uuid}`);
                console.log(`   전화번호: ${friend.phone_number || '-'}`);
                console.log(`   닉네임: ${friend.profile_nickname || '-'}`);
              } else {
                console.log(`   ⚠️ 해당 전화번호의 친구를 찾을 수 없습니다.`);
              }
            }
          } catch (e) {
            console.log(`   ⚠️ JSON 파싱 실패:`, e.message);
          }
        }
      }
    });

    console.log('1️⃣ 카카오 개발자 콘솔로 이동...');
    await page.goto(KAKAO_DEV_CONSOLE, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log('   💡 수동으로 로그인하고 친구 목록 API를 호출해주세요.');
    console.log('   💡 또는 카카오 비즈니스 파트너센터에서 확인할 수 있습니다.');
    console.log('\n⏸️  브라우저를 열어두었습니다. 수동으로 확인해주세요.');
    console.log('   - 카카오 개발자 콘솔: https://developers.kakao.com');
    console.log('   - 카카오 비즈니스 파트너센터: https://business.kakao.com');
    console.log('\n   API 엔드포인트: GET https://kapi.kakao.com/v1/api/talk/friends');
    console.log('   (OAuth 2.0 Access Token 필요)\n');

    // 30초 대기 (사용자가 수동으로 확인할 시간)
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    console.log('\n✅ 스크립트 종료');
    // 브라우저를 닫지 않고 열어둠
    // await browser.close();
  }
}

// 실행
findKakaoUuid().catch(console.error);
