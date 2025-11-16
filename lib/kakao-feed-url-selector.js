// lib/kakao-feed-url-selector.js
// 카카오 피드 URL 자동 선택 로직

/**
 * 이미지 카테고리와 계정 타입에 따라 적절한 URL을 자동으로 선택합니다.
 * @param {string} imageCategory - 이미지 카테고리 (예: '시니어 골퍼의 스윙', '젊은 골퍼의 스윙')
 * @param {string} accountType - 계정 타입 ('account1' 또는 'account2')
 * @param {string} date - 날짜 (YYYY-MM-DD 형식)
 * @returns {string} 선택된 URL
 */
function getFeedUrl(imageCategory, accountType, date) {
  // 기본 URL 리스트
  const urls = {
    home: 'https://masgolf.co.kr',
    oldHome: 'https://www.mas9golf.com',
    muziik: 'https://masgolf.co.kr/muziik',
    stores: 'https://www.masgolf.co.kr/contact',
    testDrive: 'https://www.mas9golf.com/try-a-massgo',
    smartstore: 'https://smartstore.naver.com/mas9golf'
  };

  // account1 (시니어/골드톤) - 시타 매장 및 예약 관련 URL 우선
  if (accountType === 'account1') {
    const category = imageCategory?.toLowerCase() || '';
    
    if (category.includes('매장') || category.includes('인테리어') || category.includes('익스테리어')) {
      return urls.stores;
    }
    if (category.includes('시타') || category.includes('예약') || category.includes('상담')) {
      return urls.testDrive;
    }
    if (category.includes('뮤직') || category.includes('muziik')) {
      return urls.muziik;
    }
    
    // 기본값: 신규 홈페이지
    return urls.home;
  }

  // account2 (테크/실버톤) - 온라인 상점 및 기술 관련 URL 우선
  if (accountType === 'account2') {
    const category = imageCategory?.toLowerCase() || '';
    
    if (category.includes('제품') || category.includes('구매') || category.includes('상점')) {
      return urls.smartstore;
    }
    if (category.includes('뮤직') || category.includes('muziik')) {
      return urls.muziik;
    }
    if (category.includes('시타') || category.includes('예약')) {
      return urls.testDrive;
    }
    
    // 기본값: 기존 홈페이지
    return urls.oldHome;
  }

  // 기본값
  return urls.home;
}

module.exports = { getFeedUrl };

