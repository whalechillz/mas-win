/**
 * 12월 17일(수요일) 비거리 비법 시리즈 1편 생성 스크립트
 * 주제: 스윙 속도 향상의 5가지 비법
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createWednesdayDistanceTips() {
  console.log('📝 12월 17일(수요일) 비거리 비법 시리즈 1편 생성 시작...\n');

  const title = '[비거리 비법 시리즈 1편] 스윙 속도 향상의 5가지 비법';
  const summary = '스윙 속도를 높이면 비거리가 자동으로 늘어납니다. 전문 피터가 알려주는 5가지 실전 비법을 공개합니다.';
  
  const contentBody = `# 스윙 속도 향상의 5가지 비법

## 들어가며

비거리 향상은 모든 골퍼의 꿈입니다. 특히 시니어 골퍼들이나 비거리에 자신이 없는 골퍼들에게는 더욱 그렇습니다. 많은 골퍼들이 비거리를 늘리기 위해 새로운 드라이버를 찾거나, 강한 힘으로 스윙하려고 하지만, 실제로는 **스윙 속도**를 높이는 것이 가장 효과적인 방법입니다.

스윙 속도가 1mph만 증가해도 비거리는 약 2-3야드 늘어납니다. 이는 단순히 힘을 더 주는 것보다 훨씬 효율적이고 지속 가능한 방법입니다.

## 스윙 속도 향상의 5가지 비법

### 1. 백스윙에서 타이밍 잡기

백스윙은 단순히 클럽을 뒤로 가져가는 것이 아닙니다. **몸의 회전과 팔의 움직임이 조화롭게 이루어져야** 합니다.

**핵심 포인트**:
- 어깨는 90도 회전, 골반은 45도 회전
- 왼팔을 곧게 유지하며 자연스럽게 들어올리기
- 백스윙 탑에서 잠시 멈춤 (코킹 유지)

**실전 팁**: 백스윙 탑에서 멈추는 순간, 몸의 탄성이 최대가 됩니다. 이 탄성을 이용해 다운스윙을 시작하면 자연스럽게 속도가 증가합니다.

### 2. 다운스윙 가속화 기술

다운스윙은 백스윙의 역순이 아닙니다. **몸의 회전을 먼저 시작하고, 팔과 클럽이 따라오는 순서**가 중요합니다.

**핵심 포인트**:
- 골반 회전으로 다운스윙 시작
- 몸의 회전이 팔의 움직임보다 먼저
- 임팩트 순간에 최대 속도 달성

**실전 팁**: "몸을 먼저 돌리고, 팔은 따라오게"라는 느낌으로 스윙하면 자연스럽게 속도가 증가합니다. 팔로만 스윙하려고 하면 오히려 속도가 느려집니다.

### 3. 체중 이동 활용하기

골프 스윙은 체중 이동이 핵심입니다. **백스윙에서 오른쪽으로, 다운스윙에서 왼쪽으로** 체중이 이동해야 합니다.

**핵심 포인트**:
- 백스윙: 체중의 70%가 오른발에
- 다운스윙: 체중을 왼발로 이동
- 임팩트: 체중의 80%가 왼발에

**실전 팁**: 체중 이동이 제대로 되면 몸의 회전 속도가 자연스럽게 증가합니다. 체중 이동 없이 팔만 움직이면 속도가 느려집니다.

### 4. 릴리스 타이밍 최적화

릴리스는 임팩트 직전에 이루어져야 합니다. **너무 일찍 릴리스하면 속도가 감소**하고, 너무 늦으면 방향성이 나빠집니다.

**핵심 포인트**:
- 임팩트 직전에 손목 코킹 해제
- 클럽헤드가 공을 맞추는 순간 최대 속도
- 팔로우스로 자연스럽게 완성

**실전 팁**: "공을 때리는 순간 손목이 풀린다"는 느낌으로 연습하면 릴리스 타이밍을 잡을 수 있습니다.

### 5. 유연성과 근력 균형

스윙 속도를 높이려면 **유연성과 근력의 균형**이 중요합니다. 유연성만 있으면 힘이 부족하고, 근력만 있으면 속도가 느립니다.

**핵심 포인트**:
- 골프 전 준비 운동으로 유연성 확보
- 코어 근력 강화로 회전력 증가
- 어깨와 허리 유연성 유지

**실전 팁**: 라운딩 전 10분 정도 스트레칭을 하고, 평소 코어 근력 운동을 꾸준히 하면 스윙 속도가 자연스럽게 증가합니다.

## 시니어 골퍼를 위한 특별 팁

50대 이상의 시니어 골퍼들은 체력과 유연성의 한계가 있습니다. 하지만 **올바른 기술과 적절한 장비**를 사용하면 충분히 비거리를 늘릴 수 있습니다.

**시니어 골퍼 추천 사항**:
- 가벼운 샤프트 선택 (40g대)
- 적절한 플렉스 (R 또는 A 플렉스)
- 헤드 로프트 조정 (12-13도)
- 정기적인 스트레칭과 근력 운동

## 마무리

스윙 속도 향상은 하루아침에 이루어지지 않습니다. 하지만 위의 5가지 비법을 꾸준히 연습하면 **2-3개월 안에 눈에 띄는 변화**를 경험할 수 있습니다.

특히 시니어 골퍼들은 힘보다는 **기술과 타이밍**에 집중하면 더 큰 효과를 볼 수 있습니다. 올바른 스윙 메커니즘을 익히고, 자신에게 맞는 장비를 선택하는 것이 중요합니다.

마쓰구골프에서는 전문 피터가 직접 여러분의 스윙을 분석하고, 최적의 드라이버와 샤프트를 추천해드립니다. 시타 체험을 통해 자신에게 맞는 비거리 향상 솔루션을 찾아보세요.

[시타 체험 예약하기](https://www.masgolf.co.kr/booking) | [문의하기](https://www.masgolf.co.kr/contact)

---

**다음 편 예고**: [비거리 비법 시리즈 2편] 임팩트 포인트 최적화로 비거리 20m 늘리기`;

  const contentDate = '2025-12-17';

  try {
    console.log('📝 허브 콘텐츠 생성 중...');
    
    // 최신 hub_order 확인
    const { data: latestHub, error: orderError } = await supabase
      .from('cc_content_calendar')
      .select('hub_order')
      .eq('is_hub_content', true)
      .order('hub_order', { ascending: false })
      .limit(1)
      .single();

    const nextHubOrder = latestHub?.hub_order ? latestHub.hub_order + 1 : 1;

    const { data: newHubContent, error: hubError } = await supabase
      .from('cc_content_calendar')
      .insert({
        title,
        summary,
        content_body: contentBody,
        content_date: contentDate,
        is_hub_content: true,
        hub_priority: 1,
        hub_order: nextHubOrder,
        auto_derive_channels: ['blog', 'sms', 'naver_blog', 'kakao'],
        channel_status: {
          blog: { status: '미연결', post_id: null, created_at: null },
          sms: { status: '미발행', post_id: null, created_at: null },
          naver_blog: { status: '미발행', post_id: null, created_at: null },
          kakao: { status: '미발행', post_id: null, created_at: null }
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (hubError) throw hubError;

    console.log('✅ 허브 콘텐츠 생성 완료!');
    console.log(`   ID: ${newHubContent.id}`);
    console.log(`   제목: ${newHubContent.title}`);
    console.log(`   순번: ${newHubContent.hub_order}`);
    console.log(`   날짜: ${contentDate}\n`);

    console.log('📝 블로그 포스트 생성 중...');
    
    const slug = title.toLowerCase()
      .replace(/\[|\]/g, '')
      .replace(/비거리 비법 시리즈 \d+편\s*/g, '')
      .replace(/[^a-z0-9가-힣\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);

    const { data: newBlogPost, error: blogError } = await supabase
      .from('blog_posts')
      .insert({
        title,
        slug,
        content: contentBody,
        excerpt: summary,
        status: 'draft',
        category: '골프 가이드',
        tags: ['비거리 향상', '스윙 속도', '골프 가이드', '시니어 골퍼'],
        published_at: contentDate,
        calendar_id: newHubContent.id,
        author: '마쓰구골프',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (blogError) throw blogError;

    console.log('✅ 블로그 포스트 생성 완료!');
    console.log(`   ID: ${newBlogPost.id}`);
    console.log(`   제목: ${newBlogPost.title}\n`);

    console.log('🔗 허브와 블로그 연결 중...');
    
    const { error: updateHubError } = await supabase
      .from('cc_content_calendar')
      .update({
        blog_post_id: newBlogPost.id,
        channel_status: {
          ...newHubContent.channel_status,
          blog: {
            status: '연결됨',
            post_id: newBlogPost.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', newHubContent.id);

    if (updateHubError) throw updateHubError;

    console.log('✅ 허브와 블로그 연결 완료!\n');

    console.log('🎉 생성 완료!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 생성 결과:');
    console.log(`   허브 ID: ${newHubContent.id}`);
    console.log(`   블로그 ID: ${newBlogPost.id}`);
    console.log(`   제목: ${title}`);
    console.log(`   날짜: ${contentDate}`);
    console.log(`   순번: ${newHubContent.hub_order}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 다음 단계:');
    console.log(`   1. 허브 콘텐츠 편집: /admin/content-calendar-hub`);
    console.log(`   2. 블로그 포스트 편집: /admin/blog?edit=${newBlogPost.id}&hub=${newHubContent.id}`);
    console.log(`   3. 블로그 포스트 발행: 블로그 편집 화면에서 상태를 'published'로 변경`);

  } catch (error) {
    console.error('❌ 생성 중 오류 발생:', error);
    process.exit(1);
  }
}

createWednesdayDistanceTips();

