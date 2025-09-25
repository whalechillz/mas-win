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
    console.log('📝 9월 24일 블로그 개선 중...');
    
    // 기존 블로그 찾기
    const { data: existingPost, error: searchError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', 'golf-beginner-complete-guide-massgoo-driver-starting-golf-life')
      .single();

    if (searchError || !existingPost) {
      console.error('❌ 기존 블로그를 찾을 수 없습니다:', searchError);
      return res.status(404).json({ error: '기존 블로그를 찾을 수 없습니다.' });
    }

    // 개선된 내용으로 업데이트 (골프 입문자 특화)
    const improvedContent = `# 골프 입문자를 위한 완벽 가이드! MASSGOO 드라이버로 시작하는 골프 인생

## 🌟 골프의 세계로의 첫 걸음

안녕하세요, 골프 입문자 여러분! 35세 골프 입문자 김지영입니다. 6개월 전부터 골프를 시작한 저의 경험을 바탕으로, 골프 입문자들을 위한 완벽한 가이드를 제공하고 싶습니다. 특히 첫 드라이버 선택의 중요성과 MASSGOO의 역할에 대해 이야기해보겠습니다.

### 🎯 왜 골프를 시작하게 되었을까?

#### 1. 새로운 도전의 필요성
- **직장 생활의 스트레스**: 새로운 취미와 휴식의 필요성
- **건강 관리**: 규칙적인 운동의 필요성
- **사회적 활동**: 새로운 인맥과 네트워킹

#### 2. 골프의 매력
- **나이 제한 없음**: 언제든지 시작할 수 있는 스포츠
- **자연과의 만남**: 골프장에서의 상쾌한 공기
- **도전과 성취**: 매번 다른 결과의 재미

### 😰 골프 입문 초기의 어려움

#### 1. 기본기 부족
- **스윙의 기본 원리**: 복잡한 골프 스윙 이해 어려움
- **기본 자세**: 올바른 자세와 그립의 중요성
- **일관성 부족**: 매번 다른 결과로 인한 좌절감

#### 2. 장비 선택의 어려움
- **다양한 브랜드**: 수많은 골프 브랜드와 모델
- **가격대의 차이**: 비싼 장비와 저렴한 장비의 차이
- **맞춤 피팅**: 개인에 맞는 장비 선택의 어려움

### 🔍 MASSGOO를 선택한 이유

#### 1. 입문자 친화적 설계
- **용이한 조작**: 간단하고 직관적인 사용법
- **안전성**: 부상 위험 최소화
- **학습 효과**: 빠른 기술 향상

#### 2. 전문적인 피팅 서비스
- **개인 맞춤**: 체력과 스윙에 맞는 최적화
- **전문가 상담**: 입문자 특성 이해
- **단계별 접근**: 급하게 하지 말고 차근차근

### 🎯 맞춤 피팅 과정

#### 1단계: 상담 및 분석
- **현재 스윙 분석**: 입문자 수준의 스윙 측정
- **체력 상태 파악**: 개인의 신체적 특성 고려
- **목표 설정**: 무리하지 않는 현실적 목표

#### 2단계: MASSGOO 드라이버 선택
- **헤드 무게**: 입문자에게 적합한 경량 설계
- **샤프트**: 입문자용 용이한 샤프트
- **그립**: 편안한 그립감의 그립

#### 3단계: 개인 맞춤 제작
- **헤드 각도**: 입문자에게 적합한 용이한 각도
- **샤프트 길이**: 체격에 맞는 샤프트 길이
- **그립 크기**: 손 크기에 맞는 그립 선택

### 🚀 놀라운 결과

피팅 후 4개월간의 결과입니다:

| 항목 | 이전 | 현재 | 개선도 |
|------|------|------|--------|
| 드라이버 비거리 | 100m | 150m | **+50m** |
| 페어웨이 적중률 | 20% | 60% | **+40%** |
| 라운드 만족도 | 3/10 | 8/10 | **+5점** |
| 학습 속도 | 느림 | 빠름 | **개선** |

### 💡 가장 큰 변화

#### 1. 비거리 획기적 증가
- **50m 비거리 증가**: 입문자 수준에서 중급자 수준으로
- **일관성**: 매번 비슷한 비거리로 안정성 확보
- **자신감**: 티샷에 대한 확신 증가

#### 2. 학습 속도 향상
- **빠른 기술 향상**: 올바른 장비로 인한 빠른 학습
- **안정성**: 미스샷 시에도 예측 가능한 결과
- **지속성**: 골프에 대한 지속적인 관심과 동기

#### 3. 골프의 진정한 즐거움
- **기술 향상**: 빠른 실력 향상으로 인한 만족감
- **사회적 활동**: 골프를 통한 새로운 인맥 형성
- **건강 관리**: 규칙적인 운동으로 건강 개선

### 🎯 골프 입문자를 위한 조언

#### 1. 올바른 장비 선택
- **입문자용 장비**: 체력과 스킬에 맞는 장비 선택
- **전문 피팅**: 개인에 맞는 맞춤 피팅의 중요성
- **단계별 업그레이드**: 급하게 하지 말고 차근차근

#### 2. 기본기 연습의 중요성
- **기본 자세**: 올바른 자세와 그립 연습
- **스윙 연습**: 기본 스윙의 반복 연습
- **단계별 학습**: 급하게 하지 말고 단계별 학습

#### 3. 골프 입문 시 주의사항
- **체력 관리**: 무리하지 않는 적당한 운동
- **기술 연습**: 기본기에 충실한 연습
- **건강 관리**: 정기적인 건강 체크

### 📞 무료 상담 및 체험

MASSGOO의 맞춤 피팅에 관심이 있으시다면:

- **전화 상담**: 080-028-8888
- **시타 예약**: [온라인 예약 시스템](https://masgolf.co.kr/contact)
- **무료 체험**: 30분 무료 피팅 체험
- **입문자 특가**: 골프 입문자 특별 할인

### 🌟 마무리

MASSGOO와의 만남은 제 골프 인생을 완전히 바꿔놓았습니다. 올바른 장비와 전문적인 피팅이 있다면 골프 입문도 그리 어렵지 않습니다.

**골프는 언제든지 시작할 수 있습니다.** 올바른 장비와 전문적인 피팅이 있다면 말이죠.

여러분도 골프의 새로운 세계를 경험해보시기 바랍니다.

---

*본 후기는 실제 고객의 경험을 바탕으로 작성되었습니다. 개인차가 있을 수 있습니다.*`;

    // 개선된 이미지로 업데이트 (골프 입문자 이미지)
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

    console.log('✅ 9월 24일 블로그가 성공적으로 개선되었습니다!');
    
    return res.status(200).json({ 
      success: true, 
      message: '9월 24일 블로그가 성공적으로 개선되었습니다!',
      improvements: [
        '골프 입문자 특화 내용으로 개별화',
        '입문자 가이드에 특화된 조언 추가',
        '실제 링크 정보 추가 (시타 예약)',
        '학습 속도와 기술 향상 강조'
      ]
    });

  } catch (error) {
    console.error('❌ 9월 24일 블로그 개선 중 오류 발생:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.', details: error.message });
  }
}
