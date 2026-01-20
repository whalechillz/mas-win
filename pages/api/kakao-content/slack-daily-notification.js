// pages/api/kakao-content/slack-daily-notification.js
// 매일 아침 8시 30분에 카카오톡 콘텐츠를 슬랙으로 전송하는 API
// Supabase에서 직접 데이터를 읽어옵니다
import { createServerSupabase } from '../../../lib/supabase';
import { sendSlackNotification, formatKakaoContentSlackMessage } from '../../../lib/slack-notification';

export default async function handler(req, res) {
  // Vercel Cron Job 또는 cron-job.org에서 호출하는 경우 Authorization 헤더 확인
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET?.trim();
  
  // Vercel Cron Job인지 확인 (x-vercel-cron 헤더가 있으면 Vercel에서 호출)
  const vercelCronHeader = req.headers['x-vercel-cron'];
  const isVercelCron = vercelCronHeader === '1';
  
  // 크론 실행 여부 로깅 (디버깅용)
  const requestSource = isVercelCron ? '🔄 Vercel Cron (자동 실행)' : '👤 수동 호출 또는 cron-job.org';
  console.log(`\n${requestSource} - ${new Date().toISOString()}`);
  console.log(`   x-vercel-cron 헤더: ${vercelCronHeader || '없음'}`);
  console.log(`   요청 메서드: ${req.method}`);
  console.log(`   요청 호스트: ${req.headers.host || '알 수 없음'}`);
  
  // Vercel Cron은 자동으로 x-vercel-cron 헤더를 추가하므로 인증 불필요
  // cron-job.org에서 호출할 때는 Authorization 헤더가 있으면 검증, 없으면 허용 (긴급 상황 대응)
  if (!isVercelCron && cronSecret) {
    // CRON_SECRET이 설정되어 있고, Authorization 헤더가 있으면 검증
    if (authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // CRON_SECRET이 설정되어 있지만 Authorization 헤더가 없으면 허용 (cron-job.org 대응)
  }

  try {
    // 오늘 날짜
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    console.log(`📅 오늘 날짜: ${todayStr}, 월: ${monthStr}`);
    
    // ✅ Supabase에서 직접 데이터 로드 (calendar-load API 호출 제거)
    const supabase = createServerSupabase();

    // 프로필 콘텐츠 로드 (account1, account2)
    const { data: profileData, error: profileError } = await supabase
      .from('kakao_profile_content')
      .select('*')
      .eq('date', todayStr);

    if (profileError) {
      console.error('프로필 데이터 로드 오류:', profileError);
      throw profileError;
    }

    // 피드 콘텐츠 로드
    const { data: feedData, error: feedError } = await supabase
      .from('kakao_feed_content')
      .select('*')
      .eq('date', todayStr);

    if (feedError) {
      console.error('피드 데이터 로드 오류:', feedError);
      throw feedError;
    }

    // JSON 형식으로 변환
    const calendarData = {
      month: monthStr,
      profileContent: {
        account1: {
          account: '010-6669-9000',
          name: 'MAS GOLF ProWhale',
          persona: '시니어 중심 감성형 브랜딩',
          tone: '따뜻한 톤 (골드·브라운)',
          dailySchedule: []
        },
        account2: {
          account: '010-5704-0013',
          name: 'MASGOLF Tech',
          persona: '하이테크 중심 혁신형 브랜딩',
          tone: '블랙톤 젊은 매너',
          dailySchedule: []
        }
      },
      kakaoFeed: {
        dailySchedule: []
      }
    };

    // 프로필 데이터 변환
    if (profileData) {
      for (const profile of profileData) {
        const account = profile.account === '010-6669-9000' ? 'account1' : 'account2';
        const scheduleItem = {
          date: profile.date,
          background: {
            image: profile.background_image || '',
            prompt: profile.background_prompt || '',
            basePrompt: profile.background_base_prompt || null,
            status: profile.status || 'planned',
            imageUrl: profile.background_image_url || undefined // ✅ 이미지 URL 그대로 사용
          },
          profile: {
            image: profile.profile_image || '',
            prompt: profile.profile_prompt || '',
            basePrompt: profile.profile_base_prompt || null,
            status: profile.status || 'planned',
            imageUrl: profile.profile_image_url || undefined // ✅ 이미지 URL 그대로 사용
          },
          message: profile.message || '',
          status: profile.status || 'planned',
          created: profile.created || false,
          publishedAt: profile.published_at || undefined,
          createdAt: profile.created_at || undefined
        };
        calendarData.profileContent[account].dailySchedule.push(scheduleItem);
      }
    }

    // 피드 데이터 변환
    if (feedData) {
      const feedByDate = {};
      for (const feed of feedData) {
        if (!feedByDate[feed.date]) {
          feedByDate[feed.date] = { date: feed.date, account1: null, account2: null };
        }
        const account = feed.account === '010-6669-9000' ? 'account1' : 'account2';
        feedByDate[feed.date][account] = {
          imageCategory: feed.image_category || '',
          imagePrompt: feed.image_prompt || '',
          basePrompt: feed.base_prompt || null,
          caption: feed.caption || '',
          status: feed.status || 'planned',
          created: feed.created || false,
          imageUrl: feed.image_url || undefined, // ✅ 이미지 URL 그대로 사용
          url: feed.url || undefined,
          createdAt: feed.created_at || undefined
        };
      }
      calendarData.kakaoFeed.dailySchedule = Object.values(feedByDate);
    }

    // 오늘 날짜의 콘텐츠 찾기
    const account1Data = calendarData.profileContent?.account1?.dailySchedule?.find(d => d.date === todayStr);
    const account2Data = calendarData.profileContent?.account2?.dailySchedule?.find(d => d.date === todayStr);
    const feedDataItem = calendarData.kakaoFeed?.dailySchedule?.find(d => d.date === todayStr);
    
    // 슬랙 메시지 생성 (유틸리티 함수 사용, created: false도 포함)
    const slackMessage = await formatKakaoContentSlackMessage({
      date: todayStr,
      account1Data,
      account2Data,
      feedData: feedDataItem,
      calendarData,
      includeNotCreated: true // created: false인 항목도 포함
    });
    
    console.log('📤 슬랙 메시지 전송 시작...');
    console.log('메시지 내용:', JSON.stringify(slackMessage, null, 2));
    
    // 슬랙으로 전송
    await sendSlackNotification(slackMessage);
    
    console.log('✅ 슬랙 알림 전송 완료');
    
    res.status(200).json({ 
      success: true, 
      date: todayStr,
      accounts: {
        account1: !!account1Data?.created,
        account2: !!account2Data?.created
      },
      sent: true 
    });
    
  } catch (error) {
    console.error('❌ 슬랙 알림 에러:', error);
    res.status(500).json({ 
      error: 'Failed to send Slack notification', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
