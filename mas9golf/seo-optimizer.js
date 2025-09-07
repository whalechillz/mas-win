const { chromium } = require('playwright');
const fs = require('fs').promises;

// 마쓰구골프 핵심 키워드 및 SEO 최적화 템플릿
const SEO_TEMPLATES = {
  // 고반발 드라이버 관련
  '고반발': {
    keywords: ['고반발 드라이버', '비거리 향상', '골프 드라이버', '남성 드라이버'],
    titleTemplate: '{제목} | 마쓰구골프 고반발 드라이버 전문',
    metaTemplate: '마쓰구골프 고반발 드라이버로 비거리를 늘려보세요. {핵심내용} 전문 피팅과 맞춤 제작으로 골프 실력을 향상시키세요.'
  },
  
  // 시니어 관련
  '시니어': {
    keywords: ['시니어 드라이버', '시니어 골프', '고반발 드라이버', '골프 피팅'],
    titleTemplate: '{제목} | 마쓰구골프 시니어 드라이버 전문',
    metaTemplate: '마쓰구골프 시니어 드라이버로 편안하고 멀리 보내세요. {핵심내용} 시니어 골퍼를 위한 전문 피팅 서비스입니다.'
  },
  
  // 후기/리뷰 관련
  '후기': {
    keywords: ['골프 드라이버 후기', '마쓰구골프 후기', '고반발 드라이버 리뷰', '골프 피팅 후기'],
    titleTemplate: '{제목} | 마쓰구골프 드라이버 실제 후기',
    metaTemplate: '마쓰구골프 드라이버 실제 사용 후기입니다. {핵심내용} 비거리 향상과 만족도를 확인해보세요.'
  },
  
  // 이벤트/혜택 관련
  '이벤트': {
    keywords: ['골프 드라이버 이벤트', '마쓰구골프 할인', '고반발 드라이버 특가', '골프 피팅 혜택'],
    titleTemplate: '{제목} | 마쓰구골프 특별 이벤트',
    metaTemplate: '마쓰구골프 특별 이벤트로 고반발 드라이버를 만나보세요. {핵심내용} 한정 기간 특가 혜택을 놓치지 마세요.'
  },
  
  // 기본 템플릿
  'default': {
    keywords: ['골프 드라이버', '고반발 드라이버', '마쓰구골프', '골프 피팅'],
    titleTemplate: '{제목} | 마쓰구골프 골프 드라이버 전문',
    metaTemplate: '마쓰구골프에서 {핵심내용} 골프 드라이버를 만나보세요. 전문 피팅과 맞춤 제작으로 골프 실력을 향상시키세요.'
  }
};

// 한글을 영문으로 변환하는 함수
function koreanToEnglish(text) {
  const translations = {
    '골프': 'golf',
    '드라이버': 'driver',
    '아이언': 'iron',
    '웨지': 'wedge',
    '퍼터': 'putter',
    '샤프트': 'shaft',
    '그립': 'grip',
    '볼': 'ball',
    '티': 'tee',
    '백': 'bag',
    '장갑': 'glove',
    '신발': 'shoes',
    '모자': 'cap',
    '선글라스': 'sunglasses',
    '고객': 'customer',
    '후기': 'review',
    '리뷰': 'review',
    '추천': 'recommendation',
    '만족': 'satisfaction',
    '경험': 'experience',
    '이용': 'use',
    '구매': 'purchase',
    '주문': 'order',
    '배송': 'delivery',
    '서비스': 'service',
    '시니어': 'senior',
    '노인': 'elderly',
    '어르신': 'senior',
    '50대': '50s',
    '60대': '60s',
    '70대': '70s',
    '80대': '80s',
    '나이': 'age',
    '연령': 'age',
    '고반발': 'high-rebound',
    '초고반발': 'ultra-high-rebound',
    '롱기스트': 'longest',
    '거리': 'distance',
    '정확도': 'accuracy',
    '안정성': 'stability',
    '편안함': 'comfort',
    '가벼움': 'lightweight',
    '무게': 'weight',
    '길이': 'length',
    '크기': 'size',
    '이벤트': 'event',
    '혜택': 'benefit',
    '할인': 'discount',
    '특가': 'special-price',
    '세일': 'sale',
    '프로모션': 'promotion',
    '증정': 'gift',
    '선물': 'gift',
    '무료': 'free',
    '특별': 'special',
    '한정': 'limited',
    '신상품': 'new-product',
    '신제품': 'new-product',
    '봄': 'spring',
    '여름': 'summer',
    '가을': 'autumn',
    '겨울': 'winter',
    '뜨거운': 'hot',
    '시원한': 'cool',
    '따뜻한': 'warm',
    '추운': 'cold',
    '완벽한': 'perfect',
    '최고의': 'best',
    '최적의': 'optimal',
    '프리미엄': 'premium',
    '고급': 'premium',
    '럭셔리': 'luxury',
    '프로': 'pro',
    '전문': 'professional',
    '아마추어': 'amateur',
    '초보': 'beginner',
    '중급': 'intermediate',
    '고급': 'advanced',
    '마스터': 'master',
    '챔피언': 'champion',
    '영웅': 'hero',
    '레전드': 'legend',
    '스타': 'star',
    '베스트': 'best',
    '톱': 'top',
    '넘버원': 'number-one',
    '1위': 'first-place',
    '우승': 'victory',
    '성공': 'success',
    '도전': 'challenge',
    '꿈': 'dream',
    '목표': 'goal',
    '희망': 'hope',
    '기대': 'expectation',
    '만족': 'satisfaction',
    '행복': 'happiness',
    '즐거움': 'joy',
    '재미': 'fun',
    '즐거운': 'enjoyable',
    '신나는': 'exciting',
    '멋진': 'awesome',
    '훌륭한': 'excellent',
    '대단한': 'amazing',
    '놀라운': 'amazing',
    '인상적인': 'impressive',
    '기억에': 'memorable',
    '남는': 'lasting',
    '특별한': 'special',
    '유니크한': 'unique',
    '독특한': 'unique',
    '새로운': 'new',
    '신선한': 'fresh',
    '혁신적인': 'innovative',
    '창의적인': 'creative',
    '독창적인': 'original',
    '자연스러운': 'natural',
    '부드러운': 'smooth',
    '편안한': 'comfortable',
    '안전한': 'safe',
    '신뢰할': 'trustworthy',
    '믿을': 'reliable',
    '확실한': 'certain',
    '정확한': 'accurate',
    '정밀한': 'precise',
    '세심한': 'careful',
    '꼼꼼한': 'thorough',
    '성실한': 'sincere',
    '진실한': 'genuine',
    '솔직한': 'honest',
    '투명한': 'transparent',
    '깨끗한': 'clean',
    '깔끔한': 'neat',
    '단정한': 'tidy',
    '우아한': 'elegant',
    '세련된': 'sophisticated',
    '모던한': 'modern',
    '클래식한': 'classic',
    '빈티지': 'vintage',
    '레트로': 'retro',
    '트렌디한': 'trendy',
    '스타일리시한': 'stylish',
    '패셔너블한': 'fashionable',
    '멋있는': 'cool',
    '세련된': 'refined',
    '고급스러운': 'luxurious',
    '품격있는': 'classy',
    '격조있는': 'tasteful',
    '품질': 'quality',
    '수준': 'level',
    '표준': 'standard',
    '기준': 'criteria',
    '조건': 'condition',
    '요구사항': 'requirement',
    '필요': 'need',
    '요구': 'demand',
    '기대': 'expectation',
    '희망': 'hope',
    '바람': 'wish',
    '소망': 'desire',
    '꿈': 'dream',
    '목표': 'goal',
    '계획': 'plan',
    '전략': 'strategy',
    '방법': 'method',
    '방식': 'way',
    '기법': 'technique',
    '기술': 'technology',
    '노하우': 'know-how',
    '경험': 'experience',
    '지식': 'knowledge',
    '정보': 'information',
    '데이터': 'data',
    '분석': 'analysis',
    '연구': 'research',
    '개발': 'development',
    '혁신': 'innovation',
    '개선': 'improvement',
    '업그레이드': 'upgrade',
    '진화': 'evolution',
    '발전': 'progress',
    '성장': 'growth',
    '확장': 'expansion',
    '발전': 'advancement',
    '향상': 'enhancement',
    '최적화': 'optimization',
    '효율성': 'efficiency',
    '생산성': 'productivity',
    '성과': 'performance',
    '결과': 'result',
    '성공': 'success',
    '성취': 'achievement',
    '달성': 'accomplishment',
    '완성': 'completion',
    '완료': 'finish',
    '마무리': 'finish',
    '끝': 'end',
    '시작': 'start',
    '시작점': 'starting-point',
    '출발점': 'starting-point',
    '기점': 'starting-point',
    '첫': 'first',
    '처음': 'first',
    '초기': 'initial',
    '초반': 'early',
    '중반': 'mid',
    '후반': 'late',
    '마지막': 'last',
    '최종': 'final',
    '완전한': 'complete',
    '전체': 'whole',
    '모든': 'all',
    '전부': 'all',
    '모든것': 'everything',
    '전체적인': 'overall',
    '종합적인': 'comprehensive',
    '포괄적인': 'inclusive',
    '통합적인': 'integrated',
    '연결된': 'connected',
    '관련된': 'related',
    '연관된': 'associated',
    '연계된': 'linked',
    '결합된': 'combined',
    '통합된': 'unified',
    '일체화된': 'integrated',
    '하나로': 'as-one',
    '통일된': 'unified',
    '일관된': 'consistent',
    '일치하는': 'matching',
    '동일한': 'identical',
    '같은': 'same',
    '비슷한': 'similar',
    '유사한': 'similar',
    '닮은': 'alike',
    '같은': 'same',
    '동일한': 'same',
    '일치하는': 'matching',
    '일관된': 'consistent',
    '통일된': 'unified',
    '하나의': 'one',
    '단일': 'single',
    '개별': 'individual',
    '독립적인': 'independent',
    '자립적인': 'self-reliant',
    '자율적인': 'autonomous',
    '자유로운': 'free',
    '자유': 'freedom',
    '독립': 'independence',
    '자립': 'self-reliance',
    '자율': 'autonomy',
    '자주': 'frequently',
    '자주': 'often',
    '항상': 'always',
    '언제나': 'always',
    '계속': 'continue',
    '지속': 'sustain',
    '유지': 'maintain',
    '보존': 'preserve',
    '보호': 'protect',
    '지키다': 'keep',
    '유지하다': 'maintain',
    '보존하다': 'preserve',
    '보호하다': 'protect',
    '지키다': 'guard',
    '방어하다': 'defend',
    '막다': 'block',
    '차단하다': 'block',
    '방지하다': 'prevent',
    '예방하다': 'prevent',
    '피하다': 'avoid',
    '회피하다': 'evade',
    '도피하다': 'escape',
    '탈출하다': 'escape',
    '벗어나다': 'break-free',
    '해방되다': 'liberate',
    '자유로워지다': 'become-free',
    '독립하다': 'become-independent',
    '자립하다': 'become-self-reliant',
    '자율하다': 'become-autonomous'
  };

  let result = text;
  
  // 한글 단어를 영문으로 변환
  for (const [korean, english] of Object.entries(translations)) {
    const regex = new RegExp(korean, 'g');
    result = result.replace(regex, english);
  }
  
  // 남은 한글 문자들을 제거하고 공백을 하이픈으로 변경
  result = result.replace(/[가-힣]/g, '');
  result = result.replace(/\s+/g, '-');
  result = result.replace(/[^a-zA-Z0-9-]/g, '');
  result = result.replace(/-+/g, '-');
  result = result.replace(/^-|-$/g, '');
  
  return result.toLowerCase();
}

// SEO 최적화 함수
function optimizeSEO(title, content = '') {
  // 제목에서 키워드 추출
  let template = SEO_TEMPLATES.default;
  
  if (title.includes('고반발') || title.includes('드라이버')) {
    template = SEO_TEMPLATES.고반발;
  } else if (title.includes('시니어') || title.includes('어르신')) {
    template = SEO_TEMPLATES.시니어;
  } else if (title.includes('후기') || title.includes('리뷰')) {
    template = SEO_TEMPLATES.후기;
  } else if (title.includes('이벤트') || title.includes('혜택') || title.includes('할인')) {
    template = SEO_TEMPLATES.이벤트;
  }
  
  // URL 슬러그 생성
  const englishSlug = koreanToEnglish(title);
  const newUrl = `/post/${englishSlug}`;
  
  // 제목 태그 생성
  const newTitle = template.titleTemplate.replace('{제목}', title);
  
  // 메타 설명 생성
  const coreContent = content || title;
  const newMeta = template.metaTemplate.replace('{핵심내용}', coreContent);
  
  return {
    url: newUrl,
    keywords: template.keywords,
    title: newTitle,
    meta: newMeta
  };
}

async function getBlogPostsList() {
  console.log('🔍 블로그 게시물 목록 가져오기...');
  
  try {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const context = browser.contexts()[0];
    const page = context.pages()[0];
    
    console.log(`📍 현재 페이지: ${page.url()}`);
    console.log(`📝 페이지 제목: ${await page.title()}`);
    
    // 페이지 새로고침
    console.log('🔄 페이지 새로고침...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // 블로그 게시물 목록 가져오기
    const blogPosts = await page.evaluate(() => {
      const posts = [];
      const rows = document.querySelectorAll('tbody tr');
      
      rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 3) {
          const titleElement = cells[1]; // 두 번째 셀 (게시물 제목)
          const urlElement = cells[2];   // 세 번째 셀 (페이지 URL)
          const keywordsElement = cells[3]; // 네 번째 셀 (핵심 키워드)
          const titleTagElement = cells[4]; // 다섯 번째 셀 (제목 태그)
          const metaElement = cells[5]; // 여섯 번째 셀 (메타 설명)
          
          if (titleElement && urlElement) {
            const title = titleElement.textContent.trim();
            const url = urlElement.textContent.trim();
            const keywords = keywordsElement ? keywordsElement.textContent.trim() : '';
            const titleTag = titleTagElement ? titleTagElement.textContent.trim() : '';
            const meta = metaElement ? metaElement.textContent.trim() : '';
            
            posts.push({
              index: index + 1,
              title,
              url,
              keywords,
              titleTag,
              meta
            });
          }
        }
      });
      
      return posts;
    });
    
    console.log(`📊 총 ${blogPosts.length}개의 블로그 게시물 발견!`);
    
    // SEO 최적화 적용
    const optimizedPosts = blogPosts.map(post => {
      const optimized = optimizeSEO(post.title, post.meta);
      return {
        ...post,
        optimized: {
          url: optimized.url,
          keywords: optimized.keywords.join(', '),
          title: optimized.title,
          meta: optimized.meta
        }
      };
    });
    
    // 결과 저장
    await fs.writeFile('mas9golf/blog-posts-seo-optimized.json', JSON.stringify(optimizedPosts, null, 2));
    
    console.log('\n🎉 SEO 최적화 완료!');
    console.log('📁 결과 파일 저장: mas9golf/blog-posts-seo-optimized.json');
    
    // 첫 5개 게시물 미리보기
    console.log('\n📋 첫 5개 게시물 SEO 최적화 미리보기:');
    optimizedPosts.slice(0, 5).forEach((post, index) => {
      console.log(`\n${index + 1}. ${post.title}`);
      console.log(`   📍 현재 URL: ${post.url}`);
      console.log(`   🔗 최적화 URL: ${post.optimized.url}`);
      console.log(`   🏷️ 핵심 키워드: ${post.optimized.keywords}`);
      console.log(`   📝 제목 태그: ${post.optimized.title}`);
      console.log(`   📄 메타 설명: ${post.optimized.meta.substring(0, 100)}...`);
    });
    
    return optimizedPosts;
    
  } catch (error) {
    console.error('❌ 블로그 게시물 목록 가져오기 중 오류:', error.message);
    return [];
  }
}

// 특정 게시물의 SEO 최적화 정보 반환
function getPostSEOOptimization(title, content = '') {
  return optimizeSEO(title, content);
}

// 메인 함수 실행
if (require.main === module) {
  getBlogPostsList();
}

module.exports = {
  getBlogPostsList,
  getPostSEOOptimization,
  optimizeSEO
};
