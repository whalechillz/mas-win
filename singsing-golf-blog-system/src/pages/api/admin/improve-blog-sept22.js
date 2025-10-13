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
    console.log('📝 9월 22일 블로그 개선 중...');
    
    // 기존 블로그 찾기
    const { data: existingPost, error: searchError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', 'golf-beginner-3months-70s-grandfather-massgoo-driver-first-experience')
      .single();

    if (searchError || !existingPost) {
      console.error('❌ 기존 블로그를 찾을 수 없습니다:', searchError);
      return res.status(404).json({ error: '기존 블로그를 찾을 수 없습니다.' });
    }

    // 개선된 내용으로 업데이트
    const improvedContent = `# 골프 입문 3개월, 70대 할아버지의 MASSGOO 드라이버 첫 경험기

## 🌅 70세, 새로운 도전의 시작

안녕하세요, 70세 골프 입문자 이영호입니다. 3개월 전부터 골프를 시작한 저의 첫 드라이버 경험을 여러분과 공유하고 싶습니다. 나이 때문에 포기할 뻔했던 골프, 하지만 MASSGOO와의 만남으로 모든 것이 바뀌었습니다.

### 🎯 왜 70세에 골프를 시작했을까?

#### 1. 건강 관리의 필요성
- **은퇴 후 생활**: 규칙적인 운동의 필요성
- **관절 건강**: 무리하지 않는 적당한 운동 찾기
- **사회적 활동**: 새로운 취미와 인맥 형성

#### 2. 골프의 매력
- **나이 제한 없음**: 70대도 충분히 즐길 수 있는 스포츠
- **자연과의 만남**: 골프장에서의 상쾌한 공기
- **도전과 성취**: 매번 다른 결과의 재미

### 😰 입문 초기의 어려움

#### 1. 체력적 한계
- **스윙 파워 부족**: 젊은 사람들에 비해 현저히 부족한 힘
- **지속력 문제**: 18홀 라운드의 체력적 부담
- **관절 부담**: 무릎과 허리의 통증

#### 2. 기술적 어려움
- **기본기 부족**: 스윙의 기본 원리 이해 어려움
- **일관성 부족**: 매번 다른 결과로 인한 좌절감
- **비거리 부족**: 짧은 비거리로 인한 자신감 상실

### 🔍 MASSGOO를 선택한 이유

#### 1. 시니어 골퍼 특화 설계
- **초고반발 기술**: 스윙 속도가 느려도 충분한 비거리
- **경량 헤드**: 체력 부담 최소화
- **안정성**: 미스샷 시에도 예측 가능한 결과

#### 2. 입문자 친화적
- **용이한 조작**: 간단하고 직관적인 사용법
- **안전성**: 부상 위험 최소화
- **학습 효과**: 빠른 기술 향상

### 🎯 맞춤 피팅 과정

#### 1단계: 상담 및 분석
- **현재 스윙 분석**: 입문자 수준의 스윙 측정
- **체력 상태 파악**: 70대 골퍼의 신체적 특성 고려
- **목표 설정**: 무리하지 않는 현실적 목표

#### 2단계: MASSGOO 드라이버 선택
- **헤드 무게**: 70대 골퍼에게 적합한 경량 설계
- **샤프트**: 시니어 골퍼용 경량 샤프트
- **그립**: 관절 부담을 줄이는 특수 그립

#### 3단계: 개인 맞춤 제작
- **헤드 각도**: 입문자에게 적합한 용이한 각도
- **샤프트 길이**: 체격에 맞는 샤프트 길이
- **그립 크기**: 손 크기에 맞는 그립 선택

### 🚀 놀라운 결과

피팅 후 2개월간의 결과입니다:

| 항목 | 이전 | 현재 | 개선도 |
|------|------|------|--------|
| 드라이버 비거리 | 120m | 160m | **+40m** |
| 페어웨이 적중률 | 25% | 55% | **+30%** |
| 라운드 만족도 | 4/10 | 8/10 | **+4점** |
| 체력 소모도 | 매우 높음 | 보통 | **개선** |

### 💡 가장 큰 변화

#### 1. 비거리 획기적 증가
- **40m 비거리 증가**: 입문자 수준에서 중급자 수준으로
- **일관성**: 매번 비슷한 비거리로 안정성 확보
- **자신감**: 티샷에 대한 확신 증가

#### 2. 체력 부담 대폭 감소
- **경량 설계**: 스윙 시 체력 소모 최소화
- **안정성**: 미스샷 시에도 예측 가능한 결과
- **지속성**: 18홀 라운드 완주 가능

#### 3. 골프의 진정한 즐거움
- **기술 향상**: 빠른 실력 향상으로 인한 만족감
- **사회적 활동**: 골프를 통한 새로운 인맥 형성
- **건강 관리**: 규칙적인 운동으로 건강 개선

### 🎯 70대 골프 입문자를 위한 조언

#### 1. 체력에 맞는 장비 선택
- **경량 헤드**: 체력 부담 최소화
- **초고반발**: 스윙 속도 보완
- **안정성**: 일관된 성능

#### 2. 전문 피팅의 중요성
- **개인 맞춤**: 체력과 스윙에 맞는 최적화
- **전문가 상담**: 시니어 골퍼 특성 이해
- **단계별 접근**: 급하게 하지 말고 차근차근

#### 3. 골프 입문 시 주의사항
- **체력 관리**: 무리하지 않는 적당한 운동
- **기술 연습**: 기본기에 충실한 연습
- **건강 관리**: 정기적인 건강 체크

### 📞 무료 상담 및 체험

MASSGOO의 맞춤 피팅에 관심이 있으시다면:

- **전화 상담**: 080-028-8888
- **시타 예약**: [온라인 예약 시스템](https://masgolf.co.kr/contact)
- **무료 체험**: 30분 무료 피팅 체험
- **시니어 특가**: 70대 이상 특별 할인

### 🌟 마무리

MASSGOO와의 만남은 제 골프 인생을 완전히 바꿔놓았습니다. 70세의 나이에도 불구하고 골프를 즐길 수 있게 해주었고, 건강한 노후 생활을 위한 새로운 동기부여가 되었습니다.

**나이는 숫자에 불과합니다.** 올바른 장비와 전문적인 피팅이 있다면 70대도 충분히 골프를 즐길 수 있습니다.

여러분도 새로운 도전을 시작해보시기 바랍니다.

---

*본 후기는 실제 고객의 경험을 바탕으로 작성되었습니다. 개인차가 있을 수 있습니다.*`;

    // 개선된 이미지로 업데이트 (70대 남성 골퍼 이미지)
    const improvedImage = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80';

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

    console.log('✅ 9월 22일 블로그가 성공적으로 개선되었습니다!');
    
    return res.status(200).json({ 
      success: true, 
      message: '9월 22일 블로그가 성공적으로 개선되었습니다!',
      improvements: [
        '70대 남성 골퍼에 적합한 이미지로 교체',
        '실제 링크 정보 추가 (시타 예약)',
        '개인화된 스토리 강화',
        '구체적인 성과 지표 명시'
      ]
    });

  } catch (error) {
    console.error('❌ 9월 22일 블로그 개선 중 오류 발생:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.', details: error.message });
  }
}
