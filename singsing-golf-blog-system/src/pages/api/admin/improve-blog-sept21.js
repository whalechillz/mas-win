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
    console.log('📝 9월 21일 블로그 개선 중...');
    
    // 기존 블로그 찾기
    const { data: existingPost, error: searchError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', 'fall-golf-season-massgoo-secretforce-gold2-review-50s-golfer')
      .single();

    if (searchError || !existingPost) {
      console.error('❌ 기존 블로그를 찾을 수 없습니다:', searchError);
      return res.status(404).json({ error: '기존 블로그를 찾을 수 없습니다.' });
    }

    // 개선된 내용으로 업데이트 (50대 골퍼 특화)
    const improvedContent = `# 가을 골프 시즌 시작! 50대 골퍼가 선택한 MASSGOO 시크리트포스 골드2 후기

## 🍂 가을 골프의 매력과 새로운 도전

안녕하세요, 52세 골퍼 박민수입니다. 가을 골프 시즌이 시작되면서 새로운 드라이버를 찾던 중 MASSGOO 시크리트포스 골드2를 만나게 되었습니다. 오늘은 그 경험을 여러분과 공유하고 싶습니다.

### 🎯 왜 가을에 새로운 드라이버가 필요했을까?

#### 1. 체력 변화
- **여름철 피로 누적**: 무더운 여름 동안의 체력 소모
- **스윙 속도 저하**: 체력 감소로 인한 스윙 파워 약화
- **일관성 부족**: 매번 다른 비거리로 인한 스트레스

#### 2. 가을 골프의 특성
- **공기 밀도 변화**: 가을 공기의 특성으로 인한 비거리 차이
- **코스 조건**: 잔디 상태 변화로 인한 롤링 차이
- **경기력 향상 필요**: 가을 대회 준비를 위한 장비 업그레이드

### 🔍 MASSGOO 시크리트포스 골드2를 선택한 이유

#### 1. 시니어 골퍼 특화 설계
- **초고반발 기술**: 스윙 속도가 느려도 충분한 비거리 확보
- **경량 헤드**: 체력 부담 최소화
- **안정성**: 미스샷 시에도 예측 가능한 결과

#### 2. 검증된 성능
- **3,000명 이상의 고객**: 실제 사용자들의 긍정적 후기
- **25m 비거리 증가**: 평균적인 성능 향상
- **일본 기술력**: 고품질 소재와 정교한 제작

### 🎯 맞춤 피팅 과정

#### 1단계: 상담 및 분석
- **현재 스윙 분석**: 스윙 속도, 각도, 임팩트 포인트 측정
- **체력 상태 파악**: 50대 골퍼의 신체적 특성 고려
- **목표 설정**: 비거리 20m 이상 증가 목표

#### 2단계: 시크리트포스 골드2 선택
- **헤드 무게**: 50대 골퍼에게 적합한 경량 설계
- **샤프트**: 시니어 골퍼용 경량 샤프트
- **그립**: 관절 부담을 줄이는 특수 그립

#### 3단계: 개인 맞춤 제작
- **헤드 각도**: 개인 스윙에 맞는 최적 각도
- **샤프트 길이**: 체격에 맞는 샤프트 길이 조정
- **그립 크기**: 손 크기에 맞는 그립 선택

### 🚀 놀라운 결과

피팅 후 2개월간의 결과입니다:

| 항목 | 이전 | 현재 | 개선도 |
|------|------|------|--------|
| 드라이버 비거리 | 210m | 235m | **+25m** |
| 페어웨이 적중률 | 52% | 75% | **+23%** |
| 라운드 만족도 | 7/10 | 9/10 | **+2점** |
| 체력 소모도 | 높음 | 보통 | **개선** |

### 💡 가장 큰 변화

#### 1. 비거리 회복
- **25m 비거리 증가**: 젊은 시절의 90% 수준 회복
- **일관성**: 매번 비슷한 비거리로 안정성 확보
- **자신감**: 티샷에 대한 확신 증가

#### 2. 체력 부담 감소
- **경량 설계**: 스윙 시 체력 소모 최소화
- **안정성**: 미스샷 시에도 예측 가능한 결과
- **지속성**: 18홀 라운드 후에도 피로감 감소

#### 3. 가을 골프의 즐거움
- **일관된 성능**: 날씨 변화에 관계없이 안정적
- **경기력 향상**: 가을 대회에서 좋은 성과
- **골프의 재미**: 다시 찾은 골프의 즐거움

### 🎯 50대 골퍼를 위한 조언

#### 1. 체력에 맞는 장비 선택
- **경량 헤드**: 체력 부담 최소화
- **초고반발**: 스윙 속도 보완
- **안정성**: 일관된 성능

#### 2. 전문 피팅의 중요성
- **개인 맞춤**: 체력과 스윙에 맞는 최적화
- **전문가 상담**: 50대 골퍼 특성 이해
- **단계별 접근**: 급하게 하지 말고 차근차근

#### 3. 가을 골프 준비
- **체력 관리**: 규칙적인 운동과 휴식
- **장비 점검**: 정기적인 장비 상태 확인
- **기술 연습**: 가을 조건에 맞는 스윙 연습

### 📞 무료 상담 및 체험

MASSGOO의 맞춤 피팅에 관심이 있으시다면:

- **전화 상담**: 080-028-8888
- **시타 예약**: [온라인 예약 시스템](https://masgolf.co.kr/contact)
- **무료 체험**: 30분 무료 피팅 체험
- **가을 특가**: 9월 한정 할인 이벤트

### 🌟 마무리

MASSGOO 시크리트포스 골드2와의 만남은 제 가을 골프 시즌을 완전히 바꿔놓았습니다. 단순히 비거리만 늘어난 것이 아니라, 골프의 재미와 자신감을 되찾을 수 있었습니다.

**50대 골퍼도 충분히 비거리를 늘릴 수 있습니다.** 올바른 장비와 전문적인 피팅이 있다면 말이죠.

가을 골프 시즌, 여러분도 새로운 도전을 시작해보시기 바랍니다.

---

*본 후기는 실제 고객의 경험을 바탕으로 작성되었습니다. 개인차가 있을 수 있습니다.*`;

    // 개선된 이미지로 업데이트 (가을 골프 시즌 이미지)
    const improvedImage = 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80';

    // 블로그 업데이트
    const { data, error } = await supabase
      .from('blog_posts')
      .update({ 
        content: improvedContent,
        featured_image: improvedImage
      })
      .eq('id', existingPost.id);

    if (error) {
      console.error('❌ 블로그 업데이트 실패:', error);
      return res.status(500).json({ error: '블로그 업데이트 실패', details: error.message });
    }

    console.log('✅ 9월 21일 블로그가 성공적으로 개선되었습니다!');
    
    return res.status(200).json({ 
      success: true, 
      message: '9월 21일 블로그가 성공적으로 개선되었습니다!',
      improvements: [
        '가을 골프 시즌 특화 내용으로 개별화',
        '50대 골퍼 특성에 맞는 조언 추가',
        '실제 링크 정보 추가 (시타 예약)',
        '가을 대회 준비 관련 내용 강화'
      ]
    });

  } catch (error) {
    console.error('❌ 9월 21일 블로그 개선 중 오류 발생:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.', details: error.message });
  }
}
