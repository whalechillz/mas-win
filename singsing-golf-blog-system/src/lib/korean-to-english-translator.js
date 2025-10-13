/**
 * 한글-영문 변환 라이브러리
 * 골프 관련 용어와 일반적인 단어들을 영문으로 변환
 */

const koreanToEnglishMap = {
  // 골프 관련
  '골프': 'golf',
  '드라이버': 'driver', 
  '아이언': 'iron',
  '퍼터': 'putter',
  '웨지': 'wedge',
  '우드': 'wood',
  '골프장': 'golf-course',
  '골프공': 'golf-ball',
  '골프백': 'golf-bag',
  '골프장갑': 'golf-glove',
  '골프화': 'golf-shoes',
  
  // 골프 기술
  '스윙': 'swing',
  '그립': 'grip',
  '스탠스': 'stance',
  '샷': 'shot',
  '라운드': 'round',
  '그린': 'green',
  '페어웨이': 'fairway',
  '벙커': 'bunker',
  '러프': 'rough',
  '티': 'tee',
  
  // 인물 관련
  '골퍼': 'golfer',
  '선수': 'player',
  '프로': 'pro',
  '아마추어': 'amateur',
  '남성': 'male',
  '여성': 'female',
  '성인': 'adult',
  '젊은': 'young',
  '나이든': 'senior',
  '미소': 'smile',
  '행복한': 'happy',
  '웃음': 'laughing',
  
  // 환경/장소
  '야외': 'outdoor',
  '스포츠': 'sport',
  '자연': 'nature',
  '하늘': 'sky',
  '구름': 'cloud',
  '일몰': 'sunset',
  '일출': 'sunrise',
  '잔디': 'grass',
  '나무': 'tree',
  '호수': 'lake',
  '산': 'mountain',
  '언덕': 'hill',
  
  // 색상
  '흰색': 'white',
  '검은색': 'black',
  '파란색': 'blue',
  '초록색': 'green',
  '빨간색': 'red',
  '노란색': 'yellow',
  '갈색': 'brown',
  '회색': 'gray',
  
  // 의류/장비
  '폴로셔츠': 'polo-shirt',
  '바지': 'pants',
  '모자': 'hat',
  '캡': 'cap',
  '바이저': 'visor',
  '장갑': 'glove',
  '신발': 'shoes',
  
  // 브랜드
  '아디다스': 'adidas',
  '나이키': 'nike',
  '푸마': 'puma',
  '타이틀리스트': 'titleist',
  '캘러웨이': 'callaway',
  '테일러메이드': 'taylormade',
  '핑': 'ping',
  '미즈노': 'mizuno',
  
  // 추가 골프 용어
  '백스윙': 'backswing',
  '다운스윙': 'downswing',
  '팔로스루': 'follow-through',
  '임팩트': 'impact',
  '피니시': 'finish',
  '포지션': 'position',
  '자세': 'posture',
  '기술': 'technique',
  '방법': 'method',
  '연습': 'practice',
  '레슨': 'lesson',
  '코치': 'coach',
  '강사': 'instructor',
  
  // 골프장 관련
  '코스': 'course',
  '홀': 'hole',
  '파': 'par',
  '버디': 'birdie',
  '이글': 'eagle',
  '보기': 'bogey',
  '더블보기': 'double-bogey',
  '트리플보기': 'triple-bogey',
  '알바트로스': 'albatross',
  '홀인원': 'hole-in-one',
  
  // 골프 용품
  '클럽': 'club',
  '헤드': 'head',
  '샤프트': 'shaft',
  '그립': 'grip',
  '티': 'tee',
  '마커': 'marker',
  '스코어카드': 'scorecard',
  '핸디캡': 'handicap',
  
  // 날씨/환경
  '맑음': 'sunny',
  '흐림': 'cloudy',
  '비': 'rain',
  '바람': 'wind',
  '안개': 'fog',
  '따뜻한': 'warm',
  '시원한': 'cool',
  '더운': 'hot',
  '추운': 'cold',
  
  // 시간
  '아침': 'morning',
  '오후': 'afternoon',
  '저녁': 'evening',
  '밤': 'night',
  '새벽': 'dawn',
  
  // 감정/상태
  '기쁜': 'joyful',
  '즐거운': 'fun',
  '편안한': 'comfortable',
  '자신감': 'confidence',
  '집중': 'focus',
  '긴장': 'tension',
  '여유': 'relaxed',
  
  // 동작
  '서다': 'standing',
  '앉다': 'sitting',
  '걷다': 'walking',
  '뛰다': 'running',
  '점프': 'jump',
  '돌다': 'turning',
  '휘두르다': 'swinging',
  
  // 품질/상태
  '좋은': 'good',
  '훌륭한': 'excellent',
  '완벽한': 'perfect',
  '아름다운': 'beautiful',
  '멋진': 'cool',
  '인상적인': 'impressive',
  '전문적인': 'professional',
  '고급': 'premium',
  '최고': 'best',
  '최신': 'latest',
  '인기': 'popular',
  '유명한': 'famous',
  '성공적인': 'successful'
};

/**
 * 한글 텍스트를 영문으로 변환
 * @param {string} text - 변환할 한글 텍스트
 * @returns {string} - 영문으로 변환된 텍스트
 */
function translateKoreanToEnglish(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  let result = text.trim();
  
  // 한글 단어를 영문으로 변환 (긴 단어부터 우선 처리)
  const sortedEntries = Object.entries(koreanToEnglishMap)
    .sort((a, b) => b[0].length - a[0].length);
  
  sortedEntries.forEach(([korean, english]) => {
    const regex = new RegExp(korean, 'g');
    result = result.replace(regex, english);
  });
  
  // 남은 한글 문자 제거 및 정리
  result = result
    .replace(/[가-힣]/g, '') // 남은 한글 제거
    .replace(/[^a-zA-Z0-9\-_\s]/g, '') // 영문, 숫자, 하이픈, 언더스코어, 공백만 유지
    .replace(/\s+/g, '-') // 공백을 하이픈으로
    .replace(/-+/g, '-') // 연속 하이픈을 하나로
    .replace(/^-|-$/g, '') // 앞뒤 하이픈 제거
    .toLowerCase(); // 소문자로 변환
    
  return result;
}

/**
 * SEO 최적화된 파일명 생성
 * @param {string} title - 이미지 제목
 * @param {string} keywords - 키워드 (쉼표로 구분)
 * @param {number} index - 인덱스 번호
 * @returns {string} - SEO 최적화된 파일명
 */
function generateSEOFileName(title, keywords, index = 1) {
  // 제목에서 영문 추출
  const titleWords = translateKoreanToEnglish(title)
    .split('-')
    .filter(word => word.length > 1)
    .slice(0, 3);
  
  // 키워드에서 영문 추출
  const keywordWords = keywords
    .split(',')
    .map(k => translateKoreanToEnglish(k.trim()))
    .filter(k => k.length > 1)
    .slice(0, 2);
  
  // 브랜드명 + 제목 + 키워드 조합
  const allWords = ['massgoo', ...titleWords, ...keywordWords];
  const uniqueWords = Array.from(new Set(allWords));
  
  const fileName = uniqueWords
    .join('-')
    .substring(0, 50) // 길이 제한
    + `-${String(index).padStart(3, '0')}`;
    
  return fileName;
}

module.exports = {
  translateKoreanToEnglish,
  generateSEOFileName,
  koreanToEnglishMap
};
