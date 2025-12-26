/**
 * Chrome 버전 체크 유틸리티
 * 문제가 있는 Chrome 버전을 감지하여 테스트를 스킵하거나 경고
 */

/**
 * 브라우저 버전 확인
 * @param {Page} page - Playwright Page 객체
 * @returns {Promise<string|null>} Chrome 버전 문자열 (예: "143.0.7499.147") 또는 null
 */
async function getChromeVersion(page) {
  try {
    const userAgent = await page.evaluate(() => navigator.userAgent);
    // User Agent 예: "Mozilla/5.0 ... Chrome/143.0.7499.147 Safari/537.36"
    const match = userAgent.match(/Chrome\/([\d.]+)/);
    return match ? match[1] : null;
  } catch (error) {
    console.warn('⚠️  Chrome 버전 확인 실패:', error.message);
    return null;
  }
}

/**
 * 문제가 있는 Chrome 버전 목록
 */
const PROBLEMATIC_VERSIONS = [
  '143.0.7499.147', // 로그인 에러 발생 버전
  // 향후 추가 문제 버전을 여기에 추가
];

/**
 * 문제가 있는 버전인지 확인
 * @param {string} version - Chrome 버전 문자열
 * @returns {boolean} 문제가 있는 버전이면 true
 */
function isProblematicVersion(version) {
  if (!version) return false;
  return PROBLEMATIC_VERSIONS.some(problematic => version.startsWith(problematic));
}

/**
 * 브라우저 버전 체크 및 경고/스킵
 * @param {Page} page - Playwright Page 객체
 * @param {Object} options - 옵션
 * @param {boolean} options.skipTest - 문제 버전이면 테스트 스킵 여부 (기본: false)
 * @returns {Promise<{version: string|null, isProblematic: boolean, shouldSkip: boolean}>}
 */
async function checkBrowserVersion(page, options = {}) {
  const { skipTest = false } = options;
  const version = await getChromeVersion(page);
  const isProblematic = isProblematicVersion(version);
  const shouldSkip = skipTest && isProblematic;

  if (version) {
    console.log(`🌐 브라우저 버전: Chrome ${version}`);
  }

  if (isProblematic) {
    const message = `⚠️  경고: Chrome ${version}은(는) 알려진 문제가 있는 버전입니다.`;
    console.warn(message);
    console.warn('   - 로그인 기능에서 CLIENT_FETCH_ERROR가 발생할 수 있습니다.');
    console.warn('   - 권장: Chrome을 다운그레이드하거나 다른 브라우저를 사용하세요.');
    
    if (shouldSkip) {
      console.error(`❌ 테스트를 스킵합니다. (문제 버전: ${version})`);
    }
  }

  return { version, isProblematic, shouldSkip };
}

module.exports = {
  getChromeVersion,
  isProblematicVersion,
  checkBrowserVersion,
  PROBLEMATIC_VERSIONS,
};


