/**
 * Supabase에서 카카오톡 캘린더 데이터 로드
 * Supabase 실패 시 JSON 파일로 폴백
 */

import { createServerSupabase } from '../../../lib/supabase';
import fs from 'fs';
import path from 'path';

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

    // 1. Supabase 시도
    try {
      const supabase = createServerSupabase();

      // 프로필 콘텐츠 로드
      const { data: profileData, error: profileError } = await supabase
        .from('kakao_profile_content')
        .select('*')
        .gte('date', `${month}-01`)
        .lt('date', getNextMonth(month))
        .order('date', { ascending: true })
        .order('account', { ascending: true });

      // 피드 콘텐츠 로드
      const { data: feedData, error: feedError } = await supabase
        .from('kakao_feed_content')
        .select('*')
        .gte('date', `${month}-01`)
        .lt('date', getNextMonth(month))
        .order('date', { ascending: true })
        .order('account', { ascending: true });

      // Supabase 에러가 없고 데이터가 있으면 사용
      if (!profileError && !feedError && profileData && profileData.length > 0) {
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

        // 프로필 데이터 변환
        const profileByDate = {};
        profileData.forEach(item => {
          if (!profileByDate[item.date]) {
            profileByDate[item.date] = { account1: null, account2: null };
          }
          
          const scheduleItem = {
            date: item.date,
            background: {
              image: item.background_image || '',
              prompt: item.background_prompt || '',
              basePrompt: item.background_base_prompt || null,
              status: item.status || 'planned',
              imageUrl: item.background_image_url || undefined
            },
            profile: {
              image: item.profile_image || '',
              prompt: item.profile_prompt || '',
              basePrompt: item.profile_base_prompt || null,
              status: item.status || 'planned',
              imageUrl: item.profile_image_url || undefined
            },
            message: item.message || '',
            status: item.status || 'planned',
            created: item.created || false,
            publishedAt: item.published_at || undefined,
            createdAt: item.created_at || undefined
          };

          profileByDate[item.date][item.account] = scheduleItem;
        });

        // account1과 account2로 분리
        Object.keys(profileByDate).forEach(date => {
          if (profileByDate[date].account1) {
            calendarData.profileContent.account1.dailySchedule.push(profileByDate[date].account1);
          }
          if (profileByDate[date].account2) {
            calendarData.profileContent.account2.dailySchedule.push(profileByDate[date].account2);
          }
        });

        // 피드 데이터 변환
        const feedByDate = {};
        if (feedData) {
          feedData.forEach(item => {
            if (!feedByDate[item.date]) {
              feedByDate[item.date] = { date: item.date, account1: null, account2: null };
            }
            
            feedByDate[item.date][item.account] = {
              imageCategory: item.image_category || '',
              imagePrompt: item.image_prompt || '',
              caption: item.caption || '',
              status: item.status || 'planned',
              created: item.created || false,
              imageUrl: item.image_url || undefined,
              url: item.url || undefined,
              createdAt: item.created_at || undefined
            };
          });
        }

        calendarData.kakaoFeed.dailySchedule = Object.values(feedByDate);

        return res.status(200).json({
          success: true,
          calendarData
        });
      }
    } catch (supabaseError) {
      console.log('Supabase 로드 실패, JSON 파일로 폴백:', supabaseError.message);
    }

    // 2. JSON 파일로 폴백
    const filePath = path.join(process.cwd(), 'docs', 'content-calendar', `${month}.json`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: `${month}.json 파일을 찾을 수 없습니다` 
      });
    }

    // 파일 읽기
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const calendar = JSON.parse(fileContent);

    return res.status(200).json({
      success: true,
      calendarData: calendar
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
