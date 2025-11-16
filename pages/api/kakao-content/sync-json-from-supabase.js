/**
 * Supabase 데이터를 JSON 파일로 동기화하는 API
 * 슬랙 알림이 최신 이미지 URL을 사용하도록 JSON 파일을 업데이트
 */

import fs from 'fs';
import path from 'path';
import { createServerSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { date } = req.body; // YYYY-MM-DD 형식 (선택사항, 없으면 전체 월)

    const supabase = createServerSupabase();
    const monthStr = date ? date.substring(0, 7) : new Date().toISOString().substring(0, 7);
    
    console.log(`🔄 JSON 파일 동기화 시작 (월: ${monthStr})`);

    // JSON 파일 경로
    const calendarPath = path.join(process.cwd(), 'docs', 'content-calendar', `${monthStr}.json`);
    
    if (!fs.existsSync(calendarPath)) {
      return res.status(404).json({
        success: false,
        message: `캘린더 파일이 없습니다: ${calendarPath}`
      });
    }

    // 기존 JSON 파일 읽기
    const calendarData = JSON.parse(fs.readFileSync(calendarPath, 'utf8'));
    
    // 월의 시작일과 종료일 계산
    const year = parseInt(monthStr.substring(0, 4));
    const month = parseInt(monthStr.substring(5, 7));
    const startDate = `${monthStr}-01`;
    // 월의 마지막 날짜 계산
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${monthStr}-${String(lastDay).padStart(2, '0')}`;

    // Supabase에서 프로필 데이터 조회
    const { data: profileData, error: profileError } = await supabase
      .from('kakao_profile_content')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (profileError) {
      throw profileError;
    }

    // Supabase에서 피드 데이터 조회
    const { data: feedData, error: feedError } = await supabase
      .from('kakao_feed_content')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (feedError) {
      throw feedError;
    }

    const updatedDates = [];
    const errors = [];

    // 프로필 데이터 업데이트
    for (const profile of profileData || []) {
      const date = profile.date;
      const account = profile.account;
      
      // account1 또는 account2의 dailySchedule 찾기
      const accountKey = account === 'account1' ? 'account1' : 'account2';
      const dailySchedule = calendarData.profileContent?.[accountKey]?.dailySchedule || [];
      const scheduleItem = dailySchedule.find(item => item.date === date);

      if (scheduleItem) {
        let updated = false;

        // 배경 이미지 URL 업데이트
        if (profile.background_image_url && scheduleItem.background?.imageUrl !== profile.background_image_url) {
          if (!scheduleItem.background) {
            scheduleItem.background = {};
          }
          scheduleItem.background.imageUrl = profile.background_image_url;
          updated = true;
        }

        // 프로필 이미지 URL 업데이트
        if (profile.profile_image_url && scheduleItem.profile?.imageUrl !== profile.profile_image_url) {
          if (!scheduleItem.profile) {
            scheduleItem.profile = {};
          }
          scheduleItem.profile.imageUrl = profile.profile_image_url;
          updated = true;
        }

        // 메시지 업데이트
        if (profile.message && scheduleItem.message !== profile.message) {
          scheduleItem.message = profile.message;
          updated = true;
        }

        // 상태 업데이트
        if (profile.status && scheduleItem.status !== profile.status) {
          scheduleItem.status = profile.status;
          updated = true;
        }

        if (updated) {
          updatedDates.push({ date, account, type: 'profile' });
        }
      } else {
        errors.push({ date, account, type: 'profile', error: 'JSON에서 해당 날짜를 찾을 수 없음' });
      }
    }

    // 피드 데이터 업데이트
    for (const feed of feedData || []) {
      const date = feed.date;
      const account = feed.account;
      
      const dailySchedule = calendarData.kakaoFeed?.dailySchedule || [];
      const scheduleItem = dailySchedule.find(item => item.date === date);

      if (scheduleItem) {
        let updated = false;

        // 피드 이미지 URL 업데이트
        if (feed.image_url && scheduleItem[account]?.imageUrl !== feed.image_url) {
          if (!scheduleItem[account]) {
            scheduleItem[account] = {};
          }
          scheduleItem[account].imageUrl = feed.image_url;
          updated = true;
        }

        // 캡션 업데이트
        if (feed.caption && scheduleItem[account]?.caption !== feed.caption) {
          if (!scheduleItem[account]) {
            scheduleItem[account] = {};
          }
          scheduleItem[account].caption = feed.caption;
          updated = true;
        }

        // URL 업데이트
        if (feed.url && scheduleItem[account]?.url !== feed.url) {
          if (!scheduleItem[account]) {
            scheduleItem[account] = {};
          }
          scheduleItem[account].url = feed.url;
          updated = true;
        }

        // 상태 업데이트
        if (feed.status && scheduleItem[account]?.status !== feed.status) {
          if (!scheduleItem[account]) {
            scheduleItem[account] = {};
          }
          scheduleItem[account].status = feed.status;
          updated = true;
        }

        if (updated) {
          updatedDates.push({ date, account, type: 'feed' });
        }
      } else {
        errors.push({ date, account, type: 'feed', error: 'JSON에서 해당 날짜를 찾을 수 없음' });
      }
    }

    // JSON 파일 저장
    if (updatedDates.length > 0) {
      fs.writeFileSync(calendarPath, JSON.stringify(calendarData, null, 2), 'utf8');
      console.log(`✅ JSON 파일 업데이트 완료: ${updatedDates.length}개 항목`);
    }

    return res.status(200).json({
      success: true,
      month: monthStr,
      updatedDates,
      errors,
      summary: {
        updated: updatedDates.length,
        errors: errors.length
      }
    });

  } catch (error) {
    console.error('JSON 동기화 오류:', error);
    return res.status(500).json({
      success: false,
      message: 'JSON 동기화 실패',
      error: error.message
    });
  }
}

