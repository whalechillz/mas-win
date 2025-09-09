/**
 * Wix 이미지 URL 고화질 변환 유틸리티
 * Wix의 이미지 URL을 최고 화질로 변환하고 최적화하는 함수들
 */

/**
 * Wix 이미지 URL을 고화질로 변환
 * @param {string} wixUrl - 원본 Wix 이미지 URL
 * @returns {string} 고화질 변환된 URL
 */
function convertWixToHighQuality(wixUrl) {
  if (!wixUrl || !wixUrl.includes('static.wixstatic.com')) {
    return wixUrl;
  }

  try {
    // 현재 URL 예시:
    // https://static.wixstatic.com/media/94f4be_a394473798764e3a8010db94d36b0ad4~mv2.jpg/v1/fill/w_120,h_170,al_c,q_80,usm_0.66_1.00_0.01,blur_2,enc_avif,quality_auto/94f4be_a394473798764e3a8010db94d36b0ad4~mv2.jpg
    
    // 고화질 변환:
    // https://static.wixstatic.com/media/94f4be_a394473798764e3a8010db94d36b0ad4~mv2.jpg/v1/fill/w_2000,h_2000,al_c,q_95/94f4be_a394473798764e3a8010db94d36b0ad4~mv2.jpg
    
    const baseUrl = wixUrl.split('/v1/')[0];
    const fileName = wixUrl.split('/').pop();
    
    return `${baseUrl}/v1/fill/w_2000,h_2000,al_c,q_95/${fileName}`;
  } catch (error) {
    console.error('Wix URL 변환 실패:', error);
    return wixUrl;
  }
}

/**
 * Wix 이미지 URL에서 원본 파일명 추출
 * @param {string} wixUrl - Wix 이미지 URL
 * @returns {string} 원본 파일명
 */
function extractWixFileName(wixUrl) {
  if (!wixUrl || !wixUrl.includes('static.wixstatic.com')) {
    return 'unknown-image';
  }

  try {
    const fileName = wixUrl.split('/').pop();
    const baseName = fileName.split('~')[0] || fileName.split('.')[0];
    return baseName.replace(/[^a-zA-Z0-9-_]/g, '-');
  } catch (error) {
    console.error('파일명 추출 실패:', error);
    return 'unknown-image';
  }
}

/**
 * Wix 이미지 URL에서 메타데이터 추출
 * @param {string} wixUrl - Wix 이미지 URL
 * @returns {object} 메타데이터 객체
 */
function extractWixImageMetadata(wixUrl) {
  if (!wixUrl || !wixUrl.includes('static.wixstatic.com')) {
    return { source: 'unknown', quality: 'unknown' };
  }

  try {
    const urlParts = wixUrl.split('/v1/');
    if (urlParts.length < 2) {
      return { source: 'wix', quality: 'unknown' };
    }

    const params = urlParts[1];
    const qualityMatch = params.match(/q_(\d+)/);
    const widthMatch = params.match(/w_(\d+)/);
    const heightMatch = params.match(/h_(\d+)/);

    return {
      source: 'wix',
      quality: qualityMatch ? parseInt(qualityMatch[1]) : 'unknown',
      width: widthMatch ? parseInt(widthMatch[1]) : 'unknown',
      height: heightMatch ? parseInt(heightMatch[1]) : 'unknown',
      originalUrl: wixUrl,
      highQualityUrl: convertWixToHighQuality(wixUrl)
    };
  } catch (error) {
    console.error('메타데이터 추출 실패:', error);
    return { source: 'wix', quality: 'unknown' };
  }
}

/**
 * Wix 이미지 URL이 유효한지 확인
 * @param {string} wixUrl - Wix 이미지 URL
 * @returns {boolean} 유효성 여부
 */
function isValidWixUrl(wixUrl) {
  if (!wixUrl || typeof wixUrl !== 'string') {
    return false;
  }

  return wixUrl.includes('static.wixstatic.com') && 
         wixUrl.includes('/media/') && 
         wixUrl.includes('/v1/');
}

/**
 * Wix 이미지 URL 목록을 고화질로 일괄 변환
 * @param {Array} wixUrls - Wix 이미지 URL 배열
 * @returns {Array} 고화질 변환된 URL 배열
 */
function convertWixUrlsToHighQuality(wixUrls) {
  if (!Array.isArray(wixUrls)) {
    return [];
  }

  return wixUrls.map(url => ({
    original: url,
    highQuality: convertWixToHighQuality(url),
    fileName: extractWixFileName(url),
    metadata: extractWixImageMetadata(url)
  }));
}

module.exports = {
  convertWixToHighQuality,
  extractWixFileName,
  extractWixImageMetadata,
  isValidWixUrl,
  convertWixUrlsToHighQuality
};
