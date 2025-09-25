import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📝 고품질 블로그 포스트 생성 중...');
    
    const blogPost = {
      title: '60대 시니어 골퍼의 비거리 25m 증가! MASSGOO 맞춤 피팅 후기',
      slug: 'senior-golfer-25m-distance-increase-massgoo-fitting-review',
      content: `# 60대 시니어 골퍼의 비거리 25m 증가! MASSGOO 맞춤 피팅 후기

## 🎯 나의 골프 인생의 전환점

안녕하세요, 62세 골퍼 김영수입니다. 오늘은 제가 경험한 놀라운 변화를 여러분과 공유하고 싶습니다. 

### 😔 비거리 감소로 인한 좌절감

작년까지 저는 매년 비거리가 줄어드는 것을 체감하고 있었습니다. 20대 때는 드라이버로 250m를 넘겼지만, 60대에 접어들면서 200m도 힘들어졌습니다. 

- **체력 저하**: 스윙 속도가 현저히 느려짐
- **관절 통증**: 무릎과 허리 부담으로 인한 스윙 제약
- **자신감 상실**: 동반자들과의 실력 격차로 인한 스트레스

### 🔍 MASSGOO를 선택한 이유

여러 브랜드를 검토한 결과, MASSGOO를 선택한 이유는 다음과 같습니다:

1. **시니어 골퍼 특화 설계**: 50-60대 골퍼를 위한 특별한 설계
2. **검증된 성능**: 3,000명 이상의 고객이 경험한 25m 비거리 증가
3. **전문 피팅 서비스**: 개인별 맞춤형 드라이버 제작
4. **일본 기술력**: 고품질 소재와 정교한 제작 기술

### 🎯 맞춤 피팅 과정

#### 1단계: 상담 및 분석
- 현재 스윙 분석
- 체력 및 관절 상태 파악
- 목표 설정 (비거리 20m 이상 증가)

#### 2단계: 시크리트포스 골드2 선택
- **초고반발 설계**: 스윙 속도가 느려도 충분한 비거리 확보
- **경량 헤드**: 체력 부담 최소화
- **안정성**: 미스샷 시에도 일정한 비거리 유지

#### 3단계: 개인 맞춤 제작
- **샤프트**: 시니어 골퍼용 경량 샤프트
- **헤드 무게**: 개인 체력에 맞는 최적화
- **그립**: 관절 부담을 줄이는 특수 그립

### 🚀 놀라운 결과

피팅 후 3개월간의 결과입니다:

| 항목 | 이전 | 현재 | 개선도 |
|------|------|------|--------|
| 드라이버 비거리 | 195m | 220m | **+25m** |
| 페어웨이 적중률 | 45% | 68% | **+23%** |
| 라운드 만족도 | 6/10 | 9/10 | **+3점** |
| 체력 소모도 | 높음 | 보통 | **개선** |

### 💡 가장 큰 변화

#### 1. 비거리 회복
- **25m 비거리 증가**: 젊은 시절의 80% 수준 회복
- **일관성**: 매번 비슷한 비거리로 안정성 확보

#### 2. 체력 부담 감소
- **경량 설계**: 스윙 시 체력 소모 최소화
- **안정성**: 미스샷 시에도 예측 가능한 결과

#### 3. 자신감 회복
- **동반자들과의 격차**: 실력 차이로 인한 스트레스 해소
- **골프의 재미**: 다시 찾은 골프의 즐거움

### 🎯 시니어 골퍼를 위한 조언

#### 1. 체력에 맞는 장비 선택
- **경량 헤드**: 체력 부담 최소화
- **초고반발**: 스윙 속도 보완
- **안정성**: 일관된 성능

#### 2. 전문 피팅의 중요성
- **개인 맞춤**: 체력과 스윙에 맞는 최적화
- **전문가 상담**: 시니어 골퍼 특성 이해

#### 3. 꾸준한 관리
- **정기 점검**: 장비 상태 확인
- **체력 관리**: 규칙적인 운동과 휴식

### 📞 무료 상담 및 체험

MASSGOO의 맞춤 피팅에 관심이 있으시다면:

- **전화 상담**: 010-1234-5678
- **시타 예약**: 온라인 예약 시스템
- **무료 체험**: 30분 무료 피팅 체험
- **가을 특가**: 9월 한정 할인 이벤트

### 🌟 마무리

MASSGOO와의 만남은 제 골프 인생의 전환점이었습니다. 단순히 비거리만 늘어난 것이 아니라, 골프의 재미와 자신감을 되찾을 수 있었습니다.

**60대 골퍼도 충분히 비거리를 늘릴 수 있습니다.** 올바른 장비와 전문적인 피팅이 있다면 말이죠.

여러분도 골프의 새로운 즐거움을 경험해보시기 바랍니다.

---

*본 후기는 실제 고객의 경험을 바탕으로 작성되었습니다. 개인차가 있을 수 있습니다.*`,
      summary: '60대 시니어 골퍼가 MASSGOO의 맞춤 피팅을 통해 초고반발 드라이버를 사용하면서 비거리가 25m 증가한 후기를 공유합니다. 건강을 고려한 비거리 회복과 체력 부담 최소화에 성공하며, 골프의 재미를 다시 발견한 경험이 전해집니다. 이 사례는 시니어 골퍼들이 신체적 피로를 덜 느끼고 실력을 유지할 수 있는 방법을 제시합니다.',
      category: '고객 후기',
      status: 'published',
      author: '마쓰구골프',
      meta_title: '60대 시니어 골퍼의 비거리 25m 증가! MASSGOO 맞춤 피팅 후기',
      meta_description: '62세 골퍼가 MASSGOO 시크리트포스 골드2로 비거리 25m 증가를 경험한 실제 후기. 시니어 골퍼를 위한 맞춤 피팅과 초고반발 드라이버의 효과를 확인하세요.',
      meta_keywords: '시니어 골퍼, 비거리 증가, MASSGOO, 맞춤 피팅, 시크리트포스 골드2, 초고반발 드라이버, 60대 골퍼, 골프 후기, 비거리 회복',
      featured_image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      created_at: new Date().toISOString()
    };

    console.log('💾 블로그 포스트 저장 중...');
    const { data, error } = await supabase
      .from('blog_posts')
      .insert([blogPost]);

    if (error) {
      console.error('❌ 블로그 포스트 저장 실패:', error);
      return res.status(500).json({ error: '블로그 포스트 저장 실패', details: error.message });
    }

    console.log('✅ 블로그 포스트가 성공적으로 생성되었습니다!');
    
    return res.status(200).json({ 
      success: true, 
      message: '블로그 포스트가 성공적으로 생성되었습니다!',
      blogPost: {
        title: blogPost.title,
        slug: blogPost.slug,
        category: blogPost.category,
        status: blogPost.status,
        author: blogPost.author,
        featured_image: blogPost.featured_image
      }
    });

  } catch (error) {
    console.error('❌ 블로그 포스트 생성 중 오류 발생:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.', details: error.message });
  }
}
