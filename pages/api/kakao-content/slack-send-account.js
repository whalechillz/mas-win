// pages/api/kakao-content/slack-send-account.js
// 계정별 카카오톡 콘텐츠를 슬랙으로 전송하는 API
// Supabase에서 직접 데이터를 읽어옵니다
import { createServerSupabase } from '../../../lib/supabase';
import { sendSlackNotification, formatKakaoContentSlackMessage } from '../../../lib/slack-notification';

// 다음 달 계산 헬퍼 함수
function getNextMonth(month) {
  const [year, monthNum] = month.split('-').map(Number);
  const nextMonth = monthNum === 12 ? `${year + 1}-01` : `${year}-${String(monthNum + 1).padStart(2, '0')}`;
  return `${nextMonth}-01`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { account, date } = req.body;

    if (!account || !date) {
      return res.status(400).json({ 
        error: 'account and date are required',
        details: '계정(account1 또는 account2)과 날짜(YYYY-MM-DD)를 제공해주세요.'
      });
    }

    if (account !== 'account1' && account !== 'account2') {
      return res.status(400).json({ 
        error: 'Invalid account',
        details: 'account는 account1 또는 account2여야 합니다.'
      });
    }

    // 날짜 형식 검증
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ 
        error: 'Invalid date format',
        details: '날짜는 YYYY-MM-DD 형식이어야 합니다.'
      });
    }

    // 월 문자열 추출
    const monthStr = date.substring(0, 7); // YYYY-MM
    
    console.log(`📅 요청된 날짜: ${date}, 월: ${monthStr}, 계정: ${account}`);
    
    // Supabase에서 직접 데이터 로드 (API 호출 대신)
    const supabase = createServerSupabase();

    // 프로필 콘텐츠 로드
    const { data: profileData, error: profileError } = await supabase
      .from('kakao_profile_content')
      .select('*')
      .eq('account', account)
      .eq('date', date)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('프로필 데이터 로드 오류:', profileError);
      throw profileError;
    }

    // 피드 콘텐츠 로드
    const { data: feedData, error: feedError } = await supabase
      .from('kakao_feed_content')
      .select('*')
      .eq('account', account)
      .eq('date', date)
      .single();

    if (feedError && feedError.code !== 'PGRST116') { // PGRST116 = not found
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
      const profile = profileData;
      const scheduleItem = {
        date: profile.date,
        background: {
          image: profile.background_image || '',
          prompt: profile.background_prompt || '',
          basePrompt: profile.background_base_prompt || null,
          status: profile.status || 'planned',
          imageUrl: profile.background_image_url || undefined
        },
        profile: {
          image: profile.profile_image || '',
          prompt: profile.profile_prompt || '',
          basePrompt: profile.profile_base_prompt || null,
          status: profile.status || 'planned',
          imageUrl: profile.profile_image_url || undefined
        },
        message: profile.message || '',
        status: profile.status || 'planned',
        created: profile.created || false,
        publishedAt: profile.published_at || undefined,
        createdAt: profile.created_at || undefined
      };
      calendarData.profileContent[account].dailySchedule.push(scheduleItem);
    }

    // 피드 데이터 변환
    if (feedData) {
      const feed = feedData;
      const feedItem = {
        date: feed.date,
        account1: account === 'account1' ? {
          imageCategory: feed.image_category || '',
          imagePrompt: feed.image_prompt || '',
          caption: feed.caption || '',
          status: feed.status || 'planned',
          created: feed.created || false,
          imageUrl: feed.image_url || undefined,
          url: feed.url || undefined,
          createdAt: feed.created_at || undefined
        } : null,
        account2: account === 'account2' ? {
          imageCategory: feed.image_category || '',
          imagePrompt: feed.image_prompt || '',
          caption: feed.caption || '',
          status: feed.status || 'planned',
          created: feed.created || false,
          imageUrl: feed.image_url || undefined,
          url: feed.url || undefined,
          createdAt: feed.created_at || undefined
        } : null
      };
      calendarData.kakaoFeed.dailySchedule.push(feedItem);
    }
    
    // 해당 날짜의 콘텐츠 찾기
    const accountData = calendarData.profileContent?.[account]?.dailySchedule?.find(d => d.date === date);
    const feedDataItem = calendarData.kakaoFeed?.dailySchedule?.find(d => d.date === date);
    
    if (!accountData) {
      return res.status(404).json({ 
        error: 'Account data not found',
        details: `${date} 날짜의 ${account} 데이터를 찾을 수 없습니다.`
      });
    }

    if (!feedDataItem) {
      return res.status(404).json({ 
        error: 'Feed data not found',
        details: `${date} 날짜의 피드 데이터를 찾을 수 없습니다.`
      });
    }

    // 계정별 피드 데이터 준비
    const accountFeedData = {
      account1: account === 'account1' ? feedDataItem.account1 : null,
      account2: account === 'account2' ? feedDataItem.account2 : null
    };

    // 슬랙 메시지 생성 (해당 계정만 포함)
    const slackMessage = await formatKakaoContentSlackMessage({
      date: date,
      account1Data: account === 'account1' ? accountData : null,
      account2Data: account === 'account2' ? accountData : null,
      feedData: accountFeedData,
      calendarData,
      includeNotCreated: false // created: true인 항목만 전송
    });
    
    console.log('📤 슬랙 메시지 전송 시작...');
    console.log('메시지 내용:', JSON.stringify(slackMessage, null, 2));
    
    // 슬랙으로 전송
    await sendSlackNotification(slackMessage);
    
    console.log('✅ 슬랙 알림 전송 완료');
    
    res.status(200).json({ 
      success: true, 
      date: date,
      account: account,
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

