/**
 * 카카오 콘텐츠 월별 일괄 생성 API
 * Phase 4.1: 월별 모든 날짜의 basePrompt 자동 생성
 * 요일별 템플릿 자동 선택, 주차별 테마 반영, 베리에이션 자동 적용
 */

import { createServerSupabase } from '../../../lib/supabase';
const { generateBasePrompt } = require('../../../lib/kakao-base-prompt-templates');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { 
      year,           // YYYY 형식 (예: 2025)
      month,          // MM 형식 (예: 11)
      accountType,    // 'account1' | 'account2' | 'both'
      types,          // ['background', 'profile', 'feed'] 또는 생략 시 모두
      forceRegenerate = false // 기존 basePrompt가 있어도 재생성할지 여부
    } = req.body;

    // 필수 파라미터 검증
    if (!year || !month) {
      return res.status(400).json({ 
        success: false, 
        message: '필수 파라미터가 누락되었습니다 (year, month)' 
      });
    }

    // accountType 검증
    const accountTypes = accountType === 'both' ? ['account1', 'account2'] : [accountType || 'account1'];
    for (const accType of accountTypes) {
      if (accType !== 'account1' && accType !== 'account2') {
        return res.status(400).json({ 
          success: false, 
          message: 'accountType은 account1, account2, 또는 both여야 합니다' 
        });
      }
    }

    // types 검증
    const contentTypes = types || ['background', 'profile', 'feed'];
    for (const type of contentTypes) {
      if (!['background', 'profile', 'feed'].includes(type)) {
        return res.status(400).json({ 
          success: false, 
          message: 'types는 background, profile, feed 중 하나 이상이어야 합니다' 
        });
      }
    }

    // 월의 첫날과 마지막날 계산
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();

    const supabase = createServerSupabase();
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;

    // 주차별 테마 가져오기
    let weeklyThemes = {};
    try {
      const { data: calendarData } = await supabase
        .from('kakao_calendar')
        .select('profile_content')
        .eq('month', monthStr)
        .single();
      
      if (calendarData?.profile_content) {
        for (const accType of accountTypes) {
          if (calendarData.profile_content[accType]?.weeklyThemes) {
            weeklyThemes[accType] = calendarData.profile_content[accType].weeklyThemes;
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ 주차별 테마 로드 실패, 기본값 사용:', error.message);
    }

    const results = {
      totalDates: daysInMonth,
      generated: 0,
      skipped: 0,
      errors: 0,
      details: []
    };

    // 각 날짜에 대해 basePrompt 생성
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      for (const accType of accountTypes) {
        // 주차별 테마 가져오기
        const weekNumber = Math.ceil(day / 7);
        const weekKey = `week${Math.min(weekNumber, 4)}`;
        const weeklyTheme = weeklyThemes[accType]?.[weekKey] || '비거리의 감성 – 스윙과 마음의 연결';

        for (const type of contentTypes) {
          try {
            // 기존 데이터 확인
            let existingData = null;
            if (type === 'feed') {
              const { data } = await supabase
                .from('kakao_feed_content')
                .select('base_prompt')
                .eq('date', dateStr)
                .eq('account', accType)
                .single();
              existingData = data;
            } else {
              const { data } = await supabase
                .from('kakao_profile_content')
                .select(`${type}_base_prompt`)
                .eq('date', dateStr)
                .eq('account', accType)
                .single();
              existingData = data;
            }

            // 기존 basePrompt가 있고 forceRegenerate가 false면 건너뛰기
            const existingBasePrompt = type === 'feed' 
              ? existingData?.base_prompt 
              : existingData?.[`${type}_base_prompt`];

            if (existingBasePrompt && !forceRegenerate) {
              results.skipped++;
              results.details.push({
                date: dateStr,
                accountType: accType,
                type,
                status: 'skipped',
                reason: '기존 basePrompt 존재'
              });
              continue;
            }

            // basePrompt 생성
            const basePrompt = generateBasePrompt(dateStr, accType, type, weeklyTheme);

            // Supabase에 저장
            if (type === 'feed') {
              const { error } = await supabase
                .from('kakao_feed_content')
                .upsert({
                  date: dateStr,
                  account: accType,
                  base_prompt: basePrompt,
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: 'date,account'
                });

              if (error) throw error;
            } else {
              const updateField = `${type}_base_prompt`;
              const { error } = await supabase
                .from('kakao_profile_content')
                .upsert({
                  date: dateStr,
                  account: accType,
                  [updateField]: basePrompt,
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: 'date,account'
                });

              if (error) throw error;
            }

            results.generated++;
            results.details.push({
              date: dateStr,
              accountType: accType,
              type,
              status: 'success',
              basePrompt
            });

            console.log(`✅ ${dateStr} ${accType} ${type} basePrompt 생성: ${basePrompt.substring(0, 50)}...`);

          } catch (error) {
            results.errors++;
            results.details.push({
              date: dateStr,
              accountType: accType,
              type,
              status: 'error',
              error: error.message
            });
            console.error(`❌ ${dateStr} ${accType} ${type} basePrompt 생성 실패:`, error.message);
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      month: monthStr,
      accountTypes,
      contentTypes,
      results
    });

  } catch (error) {
    console.error('❌ 월별 일괄 생성 오류:', error);
    return res.status(500).json({
      success: false,
      message: '월별 일괄 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}





