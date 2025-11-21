/**
 * Supabase에서 카카오톡 캘린더 데이터 로드
 * 월별 데이터를 가져와서 기존 JSON 형식으로 변환
 */

import { createServerSupabase } from '../../../lib/supabase';

// 이미지 존재 여부 확인 함수 (HTTP HEAD 요청만 사용 - 가장 간단하고 확실함)
async function checkImageExists(supabase, imageUrl) {
  if (!imageUrl) return false;
  
  try {
    // HTTP HEAD 요청으로 실제 파일 존재 여부 확인
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2초 타임아웃 (5초 → 2초로 단축)
    
    const response = await fetch(imageUrl, { 
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    return response.ok; // 200-299 상태 코드면 true
  } catch (error) {
    // 타임아웃이나 네트워크 오류 시 false 반환 (로그 생략하여 성능 향상)
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { month } = req.query; // YYYY-MM 형식

    if (!month) {
      return res.status(400).json({ 
        success: false, 
        message: 'month 파라미터가 필요합니다 (YYYY-MM 형식)' 
      });
    }

    const supabase = createServerSupabase();

    // 프로필 콘텐츠 로드
    const { data: profileData, error: profileError } = await supabase
      .from('kakao_profile_content')
      .select('*')
      .gte('date', `${month}-01`)
      .lt('date', getNextMonth(month))
      .order('date', { ascending: true })
      .order('account', { ascending: true });

    if (profileError) {
      console.error('프로필 데이터 로드 오류:', profileError);
      throw profileError;
    }

    // 피드 콘텐츠 로드
    const { data: feedData, error: feedError } = await supabase
      .from('kakao_feed_content')
      .select('*')
      .gte('date', `${month}-01`)
      .lt('date', getNextMonth(month))
      .order('date', { ascending: true })
      .order('account', { ascending: true });

    if (feedError) {
      console.error('피드 데이터 로드 오류:', feedError);
      throw feedError;
    }

    // JSON 형식으로 변환
    const calendarData = {
      month,
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

    // 프로필 데이터 변환 (이미지 존재 여부 확인 - 병렬 처리)
    const profileByDate = {};
    
    // 모든 이미지 URL 수집 및 병렬 확인
    const profileImageChecks = [];
    for (const item of profileData) {
      if (!profileByDate[item.date]) {
        profileByDate[item.date] = { account1: null, account2: null };
      }
      
      if (item.background_image_url) {
        profileImageChecks.push({
          key: `${item.date}_${item.account}_background`,
          url: item.background_image_url
        });
      }
      
      if (item.profile_image_url) {
        profileImageChecks.push({
          key: `${item.date}_${item.account}_profile`,
          url: item.profile_image_url
        });
      }
    }
    
    // 모든 이미지 확인을 병렬로 실행
    const profileImageResults = await Promise.all(
      profileImageChecks.map(async ({ key, url }) => ({
        key,
        exists: await checkImageExists(supabase, url),
        url
      }))
    );
    
    // 결과를 Map으로 변환하여 빠른 조회
    const profileImageMap = new Map(
      profileImageResults.map(r => [r.key, r.exists ? r.url : undefined])
    );
    
    // 프로필 데이터 변환 (확인된 결과 사용)
    for (const item of profileData) {
      const backgroundKey = `${item.date}_${item.account}_background`;
      const profileKey = `${item.date}_${item.account}_profile`;
      
      const scheduleItem = {
        date: item.date,
        background: {
          image: item.background_image || '',
          prompt: item.background_prompt || '',
          basePrompt: item.background_base_prompt || null,
          status: item.status || 'planned',
          imageUrl: profileImageMap.get(backgroundKey)
        },
        profile: {
          image: item.profile_image || '',
          prompt: item.profile_prompt || '',
          basePrompt: item.profile_base_prompt || null,
          status: item.status || 'planned',
          imageUrl: profileImageMap.get(profileKey)
        },
        message: item.message || '',
        status: item.status || 'planned',
        created: item.created || false,
        publishedAt: item.published_at || undefined,
        createdAt: item.created_at || undefined
      };

      profileByDate[item.date][item.account] = scheduleItem;
    }

    // account1과 account2로 분리
    Object.keys(profileByDate).forEach(date => {
      if (profileByDate[date].account1) {
        calendarData.profileContent.account1.dailySchedule.push(profileByDate[date].account1);
      }
      if (profileByDate[date].account2) {
        calendarData.profileContent.account2.dailySchedule.push(profileByDate[date].account2);
      }
    });

    // 피드 데이터 변환 (이미지 존재 여부 확인 - 병렬 처리)
    const feedByDate = {};
    
    // 모든 피드 이미지 URL 수집 및 병렬 확인
    const feedImageChecks = [];
    for (const item of feedData) {
      if (!feedByDate[item.date]) {
        feedByDate[item.date] = { date: item.date, account1: null, account2: null };
      }
      
      if (item.image_url) {
        feedImageChecks.push({
          key: `${item.date}_${item.account}`,
          url: item.image_url
        });
      }
    }
    
    // 모든 피드 이미지 확인을 병렬로 실행
    const feedImageResults = await Promise.all(
      feedImageChecks.map(async ({ key, url }) => ({
        key,
        exists: await checkImageExists(supabase, url),
        url
      }))
    );
    
    // 결과를 Map으로 변환하여 빠른 조회
    const feedImageMap = new Map(
      feedImageResults.map(r => [r.key, r.exists ? r.url : undefined])
    );
    
    // 피드 데이터 변환 (확인된 결과 사용)
    for (const item of feedData) {
      const feedKey = `${item.date}_${item.account}`;
      
      feedByDate[item.date][item.account] = {
        imageCategory: item.image_category || '',
        imagePrompt: item.image_prompt || '',
        caption: item.caption || '',
        status: item.status || 'planned',
        created: item.created || false,
        imageUrl: feedImageMap.get(feedKey),
        url: item.url || undefined,
        createdAt: item.created_at || undefined
      };
    }

    calendarData.kakaoFeed.dailySchedule = Object.values(feedByDate);

    return res.status(200).json({
      success: true,
      calendarData
    });

  } catch (error) {
    console.error('캘린더 데이터 로드 오류:', error);
    return res.status(500).json({
      success: false,
      message: '데이터 로드 실패',
      error: error.message
    });
  }
}

// 다음 달 계산 헬퍼 함수
function getNextMonth(month) {
  const [year, monthNum] = month.split('-').map(Number);
  const nextMonth = monthNum === 12 ? `${year + 1}-01` : `${year}-${String(monthNum + 1).padStart(2, '0')}`;
  return `${nextMonth}-01`;
}

