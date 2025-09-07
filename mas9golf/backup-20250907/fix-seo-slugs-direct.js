const { chromium } = require('playwright');
const fs = require('fs').promises;

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

async function fixSEOSlugsDirect() {
  console.log('🔧 개별 블로그 게시물 URL 슬러그 영문 변환 시작...');
  
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
    
    // 블로그 게시물 목록에서 한글 URL이 있는 게시물 찾기
    console.log('🔍 한글 URL이 있는 블로그 게시물 찾기...');
    
    const blogPosts = await page.evaluate(() => {
      const posts = [];
      const rows = document.querySelectorAll('tbody tr');
      
      rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 3) {
          const titleElement = cells[1]; // 두 번째 셀 (게시물 제목)
          const urlElement = cells[2];   // 세 번째 셀 (페이지 URL)
          
          if (titleElement && urlElement) {
            const title = titleElement.textContent.trim();
            const url = urlElement.textContent.trim();
            const hasKorean = /[가-힣]/.test(url);
            
            if (hasKorean) {
              posts.push({
                index,
                title,
                url,
                hasKorean
              });
            }
          }
        }
      });
      
      return posts;
    });
    
    console.log(`📊 한글 URL이 있는 게시물: ${blogPosts.length}개`);
    
    if (blogPosts.length === 0) {
      console.log('✅ 한글 URL이 있는 게시물이 없습니다!');
      return;
    }
    
    // 첫 3개 게시물만 처리 (테스트용)
    const postsToProcess = blogPosts.slice(0, 3);
    console.log(`🎯 처리할 게시물: ${postsToProcess.length}개`);
    
    const results = [];
    
    for (let i = 0; i < postsToProcess.length; i++) {
      const post = postsToProcess[i];
      console.log(`\n📝 ${i + 1}/${postsToProcess.length} 처리 중: ${post.title}`);
      console.log(`🔗 현재 URL: ${post.url}`);
      
      try {
        // 게시물 편집 버튼 클릭 (세 번째 셀의 편집 버튼)
        const editButton = await page.locator(`tbody tr:nth-child(${post.index + 1}) td:nth-child(3) button`).or(
          page.locator(`tbody tr:nth-child(${post.index + 1}) button`).first()
        );
        
        if (await editButton.isVisible()) {
          await editButton.click();
          await page.waitForTimeout(3000);
          
          // SEO 설정 모달이 열릴 때까지 대기
          await page.waitForSelector('input[placeholder*="URL"], input[data-hook*="url"], input[aria-label*="URL"]', { timeout: 10000 });
          
          // URL 슬러그 필드 찾기
          const urlField = await page.locator('input[placeholder*="URL"], input[data-hook*="url"], input[aria-label*="URL"]').first();
          
          if (await urlField.isVisible()) {
            // 현재 URL 슬러그 가져오기
            const currentSlug = await urlField.inputValue();
            console.log(`📝 현재 슬러그: ${currentSlug}`);
            
            // 영문 슬러그 생성
            const englishSlug = koreanToEnglish(post.title);
            const newSlug = `/post/${englishSlug}`;
            
            console.log(`🔄 새 슬러그: ${newSlug}`);
            
            // URL 슬러그 변경
            await urlField.clear();
            await urlField.fill(newSlug);
            await page.waitForTimeout(1000);
            
            // 저장 버튼 클릭
            const saveButton = await page.locator('button:has-text("게시")').or(
              page.locator('button:has-text("저장")').or(
                page.locator('button:has-text("Save")')
              )
            );
            
            if (await saveButton.isVisible()) {
              await saveButton.click();
              await page.waitForTimeout(3000);
              
              console.log(`✅ ${post.title} URL 슬러그 변경 완료!`);
              results.push({
                title: post.title,
                oldUrl: post.url,
                newSlug: newSlug,
                status: 'success'
              });
            } else {
              console.log(`❌ 저장 버튼을 찾을 수 없습니다.`);
              results.push({
                title: post.title,
                oldUrl: post.url,
                newSlug: newSlug,
                status: 'save-button-not-found'
              });
            }
          } else {
            console.log(`❌ URL 슬러그 필드를 찾을 수 없습니다.`);
            results.push({
              title: post.title,
              oldUrl: post.url,
              newSlug: '',
              status: 'url-field-not-found'
            });
          }
          
          // 모달 닫기 (취소 버튼 클릭)
          const cancelButton = await page.locator('button:has-text("취소")').or(
            page.locator('button:has-text("Cancel")')
          );
          
          if (await cancelButton.isVisible()) {
            await cancelButton.click();
            await page.waitForTimeout(1000);
          }
          
        } else {
          console.log(`❌ 편집 버튼을 찾을 수 없습니다.`);
          results.push({
            title: post.title,
            oldUrl: post.url,
            newSlug: '',
            status: 'edit-button-not-found'
          });
        }
        
      } catch (error) {
        console.log(`❌ ${post.title} 처리 중 오류: ${error.message}`);
        results.push({
          title: post.title,
          oldUrl: post.url,
          newSlug: '',
          status: 'error',
          error: error.message
        });
      }
    }
    
    // 결과 저장
    await fs.writeFile('mas9golf/seo-slug-fix-results.json', JSON.stringify(results, null, 2));
    
    console.log('\n🎉 URL 슬러그 영문 변환 완료!');
    console.log('📊 결과 요약:');
    results.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.title}`);
      console.log(`     상태: ${result.status}`);
      if (result.newSlug) {
        console.log(`     새 슬러그: ${result.newSlug}`);
      }
    });
    
    console.log('\n📁 결과 파일 저장: mas9golf/seo-slug-fix-results.json');
    
  } catch (error) {
    console.error('❌ URL 슬러그 변환 중 오류:', error.message);
  }
}

fixSEOSlugsDirect();
