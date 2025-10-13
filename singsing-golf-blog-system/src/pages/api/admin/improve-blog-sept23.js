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
    console.log('📝 9월 23일 블로그 개선 중...');
    
    // 기존 블로그 찾기
    const { data: existingPost, error: searchError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', 'intermediate-golfer-performance-maintenance-massgoo-secretforce-pro3-review')
      .single();

    if (searchError || !existingPost) {
      console.error('❌ 기존 블로그를 찾을 수 없습니다:', searchError);
      return res.status(404).json({ error: '기존 블로그를 찾을 수 없습니다.' });
    }

    // 개선된 내용으로 업데이트 (중상급 골퍼 특화)
    const improvedContent = `# 중상급 골퍼의 경기력 유지 비법! MASSGOO 시크리트포스 PRO3 후기

## 🏆 경기력 유지의 새로운 패러다임

안녕하세요, 45세 중상급 골퍼 정민호입니다. 20년간 골프를 해오면서 가장 큰 고민은 '경기력 유지'였습니다. 나이가 들수록 떨어지는 체력과 비거리, 하지만 MASSGOO 시크리트포스 PRO3와의 만남으로 모든 것이 바뀌었습니다.

### 🎯 중상급 골퍼의 현실적 고민

#### 1. 체력 저하의 현실
- **스윙 속도 감소**: 40대 후반부터 체감되는 파워 저하
- **지속력 문제**: 18홀 후반부 체력 소모로 인한 성적 저하
- **관절 부담**: 무릎과 허리의 누적 피로

#### 2. 경기력 유지의 어려움
- **일관성 부족**: 매 라운드마다 다른 결과
- **비거리 감소**: 젊은 시절 대비 20-30m 비거리 감소
- **정확도 저하**: 체력 소모로 인한 정확도 하락

### 🔍 MASSGOO 시크리트포스 PRO3를 선택한 이유

#### 1. 중상급 골퍼 특화 설계
- **고반발 기술**: 스윙 속도 보완으로 비거리 확보
- **안정성**: 미스샷 시에도 예측 가능한 결과
- **정확도**: 일관된 방향성과 거리감

#### 2. 경기력 향상에 특화
- **일관성**: 매번 비슷한 결과로 안정성 확보
- **정확도**: 정교한 샷 메이킹 지원
- **신뢰성**: 경기 상황에서의 안정적 성능

### 🎯 맞춤 피팅 과정

#### 1단계: 상담 및 분석
- **현재 스윙 분석**: 중상급 골퍼 수준의 스윙 측정
- **체력 상태 파악**: 40대 후반 골퍼의 신체적 특성 고려
- **목표 설정**: 경기력 유지 및 향상 목표

#### 2단계: 시크리트포스 PRO3 선택
- **헤드 무게**: 중상급 골퍼에게 적합한 균형잡힌 설계
- **샤프트**: 경기력 향상을 위한 고성능 샤프트
- **그립**: 정확한 샷 메이킹을 위한 그립

#### 3단계: 개인 맞춤 제작
- **헤드 각도**: 개인 스윙에 맞는 최적 각도
- **샤프트 길이**: 체격과 스윙에 맞는 샤프트 길이
- **그립 크기**: 정확한 컨트롤을 위한 그립 선택

### 🚀 놀라운 결과

피팅 후 3개월간의 결과입니다:

| 항목 | 이전 | 현재 | 개선도 |
|------|------|------|--------|
| 드라이버 비거리 | 240m | 265m | **+25m** |
| 페어웨이 적중률 | 65% | 82% | **+17%** |
| 라운드 평균 스코어 | 85 | 78 | **-7타** |
| 체력 소모도 | 높음 | 보통 | **개선** |

### 💡 가장 큰 변화

#### 1. 비거리 회복
- **25m 비거리 증가**: 젊은 시절의 95% 수준 회복
- **일관성**: 매번 비슷한 비거리로 안정성 확보
- **자신감**: 티샷에 대한 확신 증가

#### 2. 정확도 향상
- **페어웨이 적중률**: 17% 향상으로 안정성 확보
- **방향성**: 일관된 방향성으로 코스 관리 개선
- **거리감**: 정확한 거리감으로 샷 선택 개선

#### 3. 경기력 향상
- **평균 스코어**: 7타 개선으로 실력 향상
- **일관성**: 매 라운드 안정적인 성적
- **자신감**: 경기 상황에서의 확신 증가

### 🎯 중상급 골퍼를 위한 조언

#### 1. 체력에 맞는 장비 선택
- **고반발 헤드**: 스윙 속도 보완
- **안정성**: 일관된 성능
- **정확도**: 정교한 샷 메이킹 지원

#### 2. 전문 피팅의 중요성
- **개인 맞춤**: 체력과 스윙에 맞는 최적화
- **전문가 상담**: 중상급 골퍼 특성 이해
- **단계별 접근**: 체계적인 장비 업그레이드

#### 3. 경기력 유지 방법
- **체력 관리**: 규칙적인 운동과 휴식
- **기술 연습**: 기본기에 충실한 연습
- **장비 관리**: 정기적인 장비 점검

### 📞 무료 상담 및 체험

MASSGOO의 맞춤 피팅에 관심이 있으시다면:

- **전화 상담**: 080-028-8888
- **시타 예약**: [온라인 예약 시스템](https://masgolf.co.kr/contact)
- **무료 체험**: 30분 무료 피팅 체험
- **중상급 골퍼 특가**: 경기력 향상 특별 할인

### 🌟 마무리

MASSGOO 시크리트포스 PRO3와의 만남은 제 골프 인생을 완전히 바꿔놓았습니다. 단순히 비거리만 늘어난 것이 아니라, 경기력 유지와 향상에 대한 새로운 가능성을 보여주었습니다.

**나이와 체력의 한계를 뛰어넘을 수 있습니다.** 올바른 장비와 전문적인 피팅이 있다면 말이죠.

여러분도 경기력 유지의 새로운 방법을 경험해보시기 바랍니다.

---

*본 후기는 실제 고객의 경험을 바탕으로 작성되었습니다. 개인차가 있을 수 있습니다.*`;

    // 개선된 이미지로 업데이트 (중상급 골퍼 이미지)
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

    console.log('✅ 9월 23일 블로그가 성공적으로 개선되었습니다!');
    
    return res.status(200).json({ 
      success: true, 
      message: '9월 23일 블로그가 성공적으로 개선되었습니다!',
      improvements: [
        '중상급 골퍼 특화 내용으로 개별화',
        '경기력 유지에 특화된 조언 추가',
        '실제 링크 정보 추가 (시타 예약)',
        '경기 상황에서의 성능 강조'
      ]
    });

  } catch (error) {
    console.error('❌ 9월 23일 블로그 개선 중 오류 발생:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.', details: error.message });
  }
}
