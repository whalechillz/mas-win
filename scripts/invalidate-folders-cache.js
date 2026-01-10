/**
 * 폴더 목록 캐시 무효화 스크립트
 */

require('dotenv').config({ path: '.env.local' });

async function invalidateCache() {
  try {
    const response = await fetch('http://localhost:3000/api/admin/invalidate-folders-cache', {
      method: 'POST',
    });

    if (response.ok) {
      console.log('✅ 폴더 목록 캐시 무효화 완료');
    } else {
      console.error('❌ 캐시 무효화 실패:', response.statusText);
    }
  } catch (error) {
    console.error('❌ 캐시 무효화 오류:', error.message);
    console.log('\n💡 서버가 실행 중이 아닐 수 있습니다.');
    console.log('   서버를 재시작하면 캐시가 자동으로 무효화됩니다.');
  }
}

invalidateCache();
