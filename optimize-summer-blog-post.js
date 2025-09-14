require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 퍼널 페이지에서 추출한 고품질 콘텐츠
const optimizedContent = `# 뜨거운 여름, 품격 있는 완벽한 스윙을 위한 준비

## 7월 한정 썸머 스페셜! 최대 21년 로얄살루트 증정

여름 골프의 새로운 기준을 제시하는 MASGOLF의 특별한 이벤트가 시작되었습니다. 이번 7월, 최대 21년 로얄살루트 700ml를 증정하는 한정 이벤트와 함께 완벽한 스윙을 경험해보세요.

![여름 골프 메인 이미지](/campaigns/2025-07/hero-summer-golf-mas.jpg)

## 당신의 여름 스윙 스타일은?

### 3가지 질문으로 찾는 나만의 맞춤 클럽

여름 골프를 더욱 특별하게 만들어줄 맞춤형 드라이버를 찾아보세요. MASGOLF의 전문 피팅 시스템을 통해 당신만의 완벽한 스윙을 완성할 수 있습니다.

#### Q1. 당신의 스윙 스타일은?

- **안정형**: 일관된 스윙, 정확한 타구
- **파워형**: 강력한 임팩트, 긴 비거리  
- **복합형**: 균형잡힌 플레이

#### Q2. 클럽 선택 시 가장 중요한 것은?

- **비거리**: 더 멀리, 더 강하게
- **방향성**: 정확한 목표 지점
- **편안함**: 부드러운 스윙감

#### Q3. 현재 평균 비거리는?

MASGOLF 드라이버로 평균 **25m 이상의 추가 비거리**를 경험하실 수 있습니다.

## 특별한 사은품과 혜택

### 가격대별 프리미엄 사은품

![로얄살루트 21년](/campaigns/2025-07/SALUTE21-01.jpg)

#### 50만원 이상 구매 시
- **로얄살루트 21년 700ml** (최고급 위스키)
- **쿨링 슬리브** (여름 골프 필수 아이템)
- **쿨링 타월** (프리미엄 골프 타월)

![쿨링 슬리브](/campaigns/2025-07/cooling-sleeves.jpg)

#### 30만원 이상 구매 시  
- **쿨링 슬리브** (여름 골프 필수 아이템)
- **쿨링 타월** (프리미엄 골프 타월)

![쿨링 타월](/campaigns/2025-07/cooling-towel.jpeg)

### 한정 수량 및 기간

- **이벤트 기간**: 2025년 7월 7일 ~ 7월 31일
- **로얄살루트 증정**: 선착순 20명
- **전체 사은품**: 한정 수량

## MASGOLF 드라이버의 혁신적 성능

### 시크리트포스 시리즈

![골퍼 아바타 1](/campaigns/2025-07/golfer_avatar_512x512_01.jpg)

#### 주요 특징
- **초고반발 페이스**: 반발계수 0.87로 최대 비거리 구현
- **일본산 JFE/DAIDO 티타늄**: 2.2mm 초박형 페이스
- **NGS 프라임 샤프트**: 30년 경력의 스윙 특성 분석
- **10년 무료 교체 보증**: 평생 신뢰할 수 있는 파트너

![골퍼 아바타 2](/campaigns/2025-07/golfer_avatar_512x512_02.jpg)

### 고객 성공 사례

> **"35년 골프를 쳤지만, MASGOLF로 바꾸고 나서야 진짜 인생 황금기가 시작된 것 같습니다."** - 최○○님 (68세, 35년 경력)

> **"임원 모임에서 제가 가장 멀리 치게 되었습니다. 32년 골프 인생 중 최고 순간입니다."** - 정○○님 (65세, 32년 경력)

![골퍼 아바타 3](/campaigns/2025-07/golfer_avatar_512x512_03.jpg)

## 여름 골프를 위한 특별한 팁

### 더위 속에서도 완벽한 스윙을 위한 준비

1. **충분한 수분 섭취**: 라운드 전후 물 섭취 필수
2. **쿨링 아이템 활용**: 쿨링 슬리브와 타월로 체온 관리
3. **적절한 휴식**: 더위로 인한 피로 관리
4. **맞춤형 클럽**: 체력에 맞는 드라이버 선택

## 지금 바로 시작하세요!

### 무료 피팅 상담 및 시타 체험

- **전화 상담**: 080-028-8888
- **매장 방문**: 경기도 수원시 갤러리아 백화점 광교 인근
- **무료 시타**: 전문 피터와 1:1 스윙 분석
- **맞춤 피팅**: 개인별 최적 클럽 추천

![여름 골프 와이드 이미지](/campaigns/2025-07/hero-summer-golf-mas-wide.jpg)

### 특별 혜택

- **리무진 골프투어 증정**: 매장 방문 시타 고객 중 최장 비거리 기록자
- **동반자 인정 프로그램**: 추천인과 피추천인 모두 15% 할인
- **골든아워 시타회**: 오후 4~6시, 하루 3명 한정

## 마무리

이번 여름, MASGOLF와 함께 완벽한 스윙을 완성하고 최고급 사은품까지 받아가세요. 7월 한정 이벤트는 선착순으로 진행되니 서둘러 신청하시기 바랍니다.

**지금 바로 080-028-8888로 전화하거나 매장을 방문해보세요!**

### 태그
여름골프, MASGOLF, 드라이버, 비거리증가, 로얄살루트, 썸머스페셜, 맞춤피팅, 골프이벤트`;

async function optimizeSummerBlogPost() {
  console.log('🌞 여름 블로그 포스트 최적화 시작...');
  
  try {
    // 1. 현재 블로그 포스트 조회
    const { data: currentPost, error: fetchError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', '뜨거운-여름-완벽한-스윙-로얄살루트-증정-행사')
      .single();
    
    if (fetchError) {
      console.error('❌ 블로그 포스트 조회 실패:', fetchError);
      return;
    }
    
    console.log('📄 현재 포스트 ID:', currentPost.id);
    console.log('📄 현재 제목:', currentPost.title);
    
    // 2. 최적화된 콘텐츠로 업데이트
    const { data: updatedPost, error: updateError } = await supabase
      .from('blog_posts')
      .update({
        title: '뜨거운 여름, 품격 있는 완벽한 스윙을 위한 준비 - 7월 한정 로얄살루트 증정',
        content: optimizedContent,
        excerpt: '7월 한정 썸머 스페셜! 최대 21년 로얄살루트 증정. MAS 드라이버로 평균 25m 비거리 증가. 50-60대 골퍼 맞춤 설계.',
        meta_title: '뜨거운 여름, 품격 있는 완벽한 스윙을 위한 준비 | MASGOLF',
        meta_description: '7월 한정 썸머 스페셜! 최대 21년 로얄살루트 증정. MAS 드라이버로 평균 25m 비거리 증가. 50-60대 골퍼 맞춤 설계.',
        meta_keywords: '여름골프, MASGOLF, 드라이버, 비거리증가, 로얄살루트, 썸머스페셜, 맞춤피팅, 골프이벤트, 시크리트포스',
        updated_at: new Date().toISOString()
      })
      .eq('id', currentPost.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ 블로그 포스트 업데이트 실패:', updateError);
      return;
    }
    
    console.log('✅ 블로그 포스트 최적화 완료!');
    console.log('📄 업데이트된 제목:', updatedPost.title);
    console.log('📄 콘텐츠 길이:', updatedPost.content.length, '자');
    console.log('📄 메타 설명:', updatedPost.meta_description);
    
    // 3. 업데이트된 포스트 정보 출력
    console.log('\n📊 최적화 결과:');
    console.log('   - 제목: 더 구체적이고 SEO 친화적으로 개선');
    console.log('   - 콘텐츠: 퍼널 페이지의 고품질 콘텐츠로 대폭 개선');
    console.log('   - 이미지: 캠페인 이미지로 고품질 교체');
    console.log('   - 메타데이터: SEO 최적화 완료');
    console.log('   - 구조: 체계적인 섹션 구성으로 가독성 향상');
    
    return updatedPost;
    
  } catch (error) {
    console.error('❌ 블로그 포스트 최적화 중 오류:', error);
    return null;
  }
}

// 실행
optimizeSummerBlogPost().then(result => {
  if (result) {
    console.log('\n🎉 여름 블로그 포스트 최적화 완료!');
    console.log('📱 이제 https://masgolf.co.kr/blog/뜨거운-여름-완벽한-스윙-로얄살루트-증정-행사 에서 확인하세요!');
  } else {
    console.log('❌ 블로그 포스트 최적화에 실패했습니다.');
  }
});
