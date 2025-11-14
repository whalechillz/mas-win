/**
 * 캘린더 데이터 저장 API
 * Supabase 데이터베이스에 저장 (로컬/배포 모두 동기화)
 */

import { createServerSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { month, calendarData } = req.body;

    if (!month || !calendarData) {
      return res.status(400).json({ 
        success: false, 
        message: '필수 파라미터가 누락되었습니다' 
      });
    }

    const supabase = createServerSupabase();
    let savedCount = 0;
    let errors = [];

    // 프로필 콘텐츠 저장
    if (calendarData.profileContent) {
      for (const accountKey of ['account1', 'account2']) {
        const accountData = calendarData.profileContent[accountKey];
        if (!accountData || !accountData.dailySchedule) continue;

        for (const schedule of accountData.dailySchedule) {
          try {
            const profileData = {
              date: schedule.date,
              account: accountKey,
              background_image_url: schedule.background?.imageUrl || null,
              background_prompt: schedule.background?.prompt || null,
              background_base_prompt: schedule.background?.basePrompt || null,
              background_image: schedule.background?.image || null,
              profile_image_url: schedule.profile?.imageUrl || null,
              profile_prompt: schedule.profile?.prompt || null,
              profile_base_prompt: schedule.profile?.basePrompt || null,
              profile_image: schedule.profile?.image || null,
              message: schedule.message || null,
              status: schedule.status || 'planned',
              created: schedule.created || false,
              published_at: schedule.publishedAt || null
            };

            const { error, data } = await supabase
              .from('kakao_profile_content')
              .upsert(profileData, {
                onConflict: 'date,account',
                ignoreDuplicates: false
              });

            if (error) {
              console.error(`프로필 저장 오류 (${schedule.date} ${accountKey}):`, error);
              console.error('저장 시도한 데이터:', JSON.stringify(profileData, null, 2));
              errors.push({ 
                type: 'profile', 
                date: schedule.date, 
                account: accountKey, 
                error: error.message,
                details: error
              });
            } else {
              savedCount++;
            }
          } catch (error) {
            console.error(`프로필 저장 처리 오류 (${schedule.date} ${accountKey}):`, error);
            errors.push({ type: 'profile', date: schedule.date, account: accountKey, error: error.message });
          }
        }
      }
    }

    // 피드 콘텐츠 저장
    if (calendarData.kakaoFeed && calendarData.kakaoFeed.dailySchedule) {
      for (const feed of calendarData.kakaoFeed.dailySchedule) {
        for (const accountKey of ['account1', 'account2']) {
          const feedData = feed[accountKey];
          if (!feedData) continue;

          try {
            const feedRecord = {
              date: feed.date,
              account: accountKey,
              image_category: feedData.imageCategory || null,
              image_prompt: feedData.imagePrompt || null,
              base_prompt: feedData.basePrompt || null,
              caption: feedData.caption || null,
              image_url: feedData.imageUrl || null,
              url: feedData.url || null,
              status: feedData.status || 'planned',
              created: feedData.created || false
            };

            const { error, data } = await supabase
              .from('kakao_feed_content')
              .upsert(feedRecord, {
                onConflict: 'date,account',
                ignoreDuplicates: false
              });

            if (error) {
              console.error(`피드 저장 오류 (${feed.date} ${accountKey}):`, error);
              console.error('저장 시도한 데이터:', JSON.stringify(feedRecord, null, 2));
              errors.push({ 
                type: 'feed', 
                date: feed.date, 
                account: accountKey, 
                error: error.message,
                details: error
              });
            } else {
              savedCount++;
            }
          } catch (error) {
            console.error(`피드 저장 처리 오류 (${feed.date} ${accountKey}):`, error);
            errors.push({ type: 'feed', date: feed.date, account: accountKey, error: error.message });
          }
        }
      }
    }

    // 부분 성공도 허용 (일부 실패가 있어도 성공한 항목은 저장됨)
    if (errors.length > 0) {
      // 성공한 항목이 있으면 부분 성공으로 처리
      if (savedCount > 0) {
        return res.status(200).json({
          success: true,
          message: `캘린더 데이터 저장 완료 (${savedCount}개 성공, ${errors.length}개 실패)`,
          savedCount,
          errors,
          partialSuccess: true
        });
      } else {
        // 모두 실패한 경우만 에러로 처리
        return res.status(500).json({
          success: false,
          message: `데이터 저장 실패 (${errors.length}개 실패)`,
          errors,
          savedCount: 0
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `캘린더 데이터 저장 완료 (${savedCount}개 항목)`,
      savedCount
    });

  } catch (error) {
    console.error('캘린더 데이터 저장 오류:', error);
    return res.status(500).json({
      success: false,
      message: '저장 실패',
      error: error.message
    });
  }
}

