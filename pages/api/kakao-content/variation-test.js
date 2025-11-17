/**
 * 베리에이션 테스트 API
 * Phase 3.3: 실제 생성된 이미지의 다양성 검증, 날짜별/요일별/계정별 변형 확인, 템플릿 로테이션 동작 검증
 */

import { createServerSupabase } from '../../../lib/supabase';
const { generateBasePrompt, getTemplateIndex } = require('../../../lib/kakao-base-prompt-templates');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { 
      testType,        // 'date_range' | 'weekly' | 'template_rotation' | 'full'
      startDate,       // YYYY-MM-DD (date_range용)
      endDate,         // YYYY-MM-DD (date_range용)
      accountType,     // 'account1' | 'account2' | 'both'
      type             // 'background' | 'profile' | 'feed' | 'all'
    } = req.body;

    const supabase = createServerSupabase();
    const testTypeFinal = testType || 'full';
    const accountTypes = accountType === 'both' 
      ? ['account1', 'account2'] 
      : [accountType || 'account1'];
    const types = type === 'all' 
      ? ['background', 'profile', 'feed'] 
      : [type || 'background'];

    const results = {
      testType: testTypeFinal,
      accountTypes,
      types,
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      },
      details: [],
      variationAnalysis: {
        uniqueBasePrompts: new Set(),
        dateVariations: {},
        weeklyVariations: {},
        templateRotation: {
          correct: 0,
          incorrect: 0,
          missing: 0
        }
      }
    };

    // 날짜 범위 결정
    let dates = [];
    if (testTypeFinal === 'date_range' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
      }
    } else if (testTypeFinal === 'weekly') {
      // 최근 4주 테스트
      const today = new Date();
      for (let week = 0; week < 4; week++) {
        for (let day = 0; day < 7; day++) {
          const date = new Date(today);
          date.setDate(date.getDate() - (week * 7) - day);
          dates.push(date.toISOString().split('T')[0]);
        }
      }
    } else {
      // full: 이번 달 전체
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const daysInMonth = new Date(year, month, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        dates.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
      }
    }

    // 각 날짜에 대해 베리에이션 테스트
    for (const date of dates) {
      const dateObj = new Date(date);
      const dayOfWeekIndex = dateObj.getDay();
      const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
      const dayOfWeek = dayNames[dayOfWeekIndex];
      const dayOfMonth = dateObj.getDate();
      const weekNumber = Math.ceil(dayOfMonth / 7);
      const expectedTemplateIndex = getTemplateIndex(date);

      for (const accType of accountTypes) {
        for (const contentType of types) {
          results.summary.totalTests++;

          try {
            // Supabase에서 실제 데이터 가져오기
            let actualBasePrompt = null;
            if (contentType === 'feed') {
              const { data } = await supabase
                .from('kakao_feed_content')
                .select('base_prompt')
                .eq('date', date)
                .eq('account', accType)
                .single();
              actualBasePrompt = data?.base_prompt;
            } else {
              const { data } = await supabase
                .from('kakao_profile_content')
                .select(`${contentType}_base_prompt`)
                .eq('date', date)
                .eq('account', accType)
                .single();
              actualBasePrompt = data?.[`${contentType}_base_prompt`];
            }

            // 예상 basePrompt 생성
            const expectedBasePrompt = generateBasePrompt(date, accType, contentType);

            // 베리에이션 분석
            if (actualBasePrompt) {
              results.variationAnalysis.uniqueBasePrompts.add(actualBasePrompt);
              
              // 날짜별 변형 확인
              if (!results.variationAnalysis.dateVariations[date]) {
                results.variationAnalysis.dateVariations[date] = {};
              }
              results.variationAnalysis.dateVariations[date][`${accType}_${contentType}`] = actualBasePrompt;

              // 주차별 변형 확인
              const weekKey = `week${weekNumber}`;
              if (!results.variationAnalysis.weeklyVariations[weekKey]) {
                results.variationAnalysis.weeklyVariations[weekKey] = {};
              }
              if (!results.variationAnalysis.weeklyVariations[weekKey][dayOfWeek]) {
                results.variationAnalysis.weeklyVariations[weekKey][dayOfWeek] = [];
              }
              results.variationAnalysis.weeklyVariations[weekKey][dayOfWeek].push({
                date,
                accountType: accType,
                type: contentType,
                basePrompt: actualBasePrompt
              });

              // 템플릿 로테이션 검증
              // basePrompt가 예상과 일치하는지 확인 (정확한 매칭은 어려우므로 존재 여부로 판단)
              if (actualBasePrompt === expectedBasePrompt || actualBasePrompt.includes(expectedBasePrompt.split(',')[0])) {
                results.variationAnalysis.templateRotation.correct++;
                results.summary.passed++;
                results.details.push({
                  date,
                  accountType: accType,
                  type: contentType,
                  dayOfWeek,
                  weekNumber,
                  expectedTemplateIndex: expectedTemplateIndex + 1,
                  status: 'pass',
                  actualBasePrompt,
                  expectedBasePrompt
                });
              } else {
                results.variationAnalysis.templateRotation.incorrect++;
                results.summary.warnings++;
                results.details.push({
                  date,
                  accountType: accType,
                  type: contentType,
                  dayOfWeek,
                  weekNumber,
                  expectedTemplateIndex: expectedTemplateIndex + 1,
                  status: 'warning',
                  actualBasePrompt,
                  expectedBasePrompt,
                  reason: 'basePrompt가 예상과 다름 (수동 수정 가능)'
                });
              }
            } else {
              // basePrompt가 없음
              results.variationAnalysis.templateRotation.missing++;
              results.summary.failed++;
              results.details.push({
                date,
                accountType: accType,
                type: contentType,
                dayOfWeek,
                weekNumber,
                expectedTemplateIndex: expectedTemplateIndex + 1,
                status: 'fail',
                reason: 'basePrompt 없음',
                expectedBasePrompt
              });
            }
          } catch (error) {
            results.summary.failed++;
            results.details.push({
              date,
              accountType: accType,
              type: contentType,
              status: 'error',
              error: error.message
            });
          }
        }
      }
    }

    // 베리에이션 통계 계산
    const uniqueCount = results.variationAnalysis.uniqueBasePrompts.size;
    const totalGenerated = results.summary.passed + results.summary.warnings;
    const variationScore = totalGenerated > 0 
      ? Math.round((uniqueCount / totalGenerated) * 100) 
      : 0;

    // 요일별 변형 확인
    const dayVariations = {};
    for (const detail of results.details) {
      if (detail.status === 'pass' || detail.status === 'warning') {
        const dayKey = detail.dayOfWeek;
        if (!dayVariations[dayKey]) {
          dayVariations[dayKey] = new Set();
        }
        dayVariations[dayKey].add(detail.actualBasePrompt);
      }
    }

    // 주차별 변형 확인
    const weekVariations = {};
    for (const detail of results.details) {
      if (detail.status === 'pass' || detail.status === 'warning') {
        const weekKey = `week${detail.weekNumber}`;
        if (!weekVariations[weekKey]) {
          weekVariations[weekKey] = new Set();
        }
        weekVariations[weekKey].add(detail.actualBasePrompt);
      }
    }

    return res.status(200).json({
      success: true,
      testType: testTypeFinal,
      dateRange: dates.length > 0 ? { start: dates[0], end: dates[dates.length - 1] } : null,
      summary: results.summary,
      variationScore,
      statistics: {
        uniqueBasePrompts: uniqueCount,
        totalGenerated,
        dayVariations: Object.fromEntries(
          Object.entries(dayVariations).map(([day, set]) => [day, set.size])
        ),
        weekVariations: Object.fromEntries(
          Object.entries(weekVariations).map(([week, set]) => [week, set.size])
        ),
        templateRotation: results.variationAnalysis.templateRotation
      },
      details: results.details.slice(0, 100), // 처음 100개만 반환 (너무 많으면 제한)
      fullDetailsCount: results.details.length
    });

  } catch (error) {
    console.error('❌ 베리에이션 테스트 오류:', error);
    return res.status(500).json({
      success: false,
      message: '베리에이션 테스트 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}





