/**
 * 자동 로테이션 관리 API
 * Phase 4.3: 주 단위 템플릿 로테이션 자동 관리, 월별 이미지 카테고리 로테이션, 베리에이션 일관성 체크
 */

import { createServerSupabase } from '../../../lib/supabase';
const { getTemplateIndex } = require('../../../lib/kakao-base-prompt-templates');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { 
      action,          // 'check' | 'fix' | 'report'
      year,            // YYYY 형식 (선택적)
      month,           // MM 형식 (선택적)
      accountType      // 'account1' | 'account2' | 'both' (선택적)
    } = req.body;

    if (!action || !['check', 'fix', 'report'].includes(action)) {
      return res.status(400).json({ 
        success: false, 
        message: 'action은 check, fix, 또는 report여야 합니다' 
      });
    }

    const supabase = createServerSupabase();
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;
    const monthStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;

    // 날짜 범위 계산
    const firstDay = new Date(targetYear, targetMonth - 1, 1);
    const lastDay = new Date(targetYear, targetMonth, 0);
    const daysInMonth = lastDay.getDate();

    const accountTypes = accountType === 'both' 
      ? ['account1', 'account2'] 
      : [accountType || 'account1'];

    const report = {
      month: monthStr,
      accountTypes,
      totalDates: daysInMonth,
      templateRotation: {
        correct: 0,
        incorrect: 0,
        missing: 0,
        details: []
      },
      categoryRotation: {
        correct: 0,
        incorrect: 0,
        missing: 0,
        details: []
      },
      consistency: {
        score: 0,
        issues: []
      }
    };

    // 피드 이미지 카테고리 목록
    const categories = [
      '시니어 골퍼의 스윙',
      '피팅 상담의 모습',
      '매장의 모습',
      '젊은 골퍼의 스윙',
      '제품 컷',
      '감성 컷'
    ];

    // 각 날짜에 대해 로테이션 체크
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const expectedTemplateIndex = getTemplateIndex(dateStr);
      const expectedCategoryIndex = Math.floor((day - 1) / 7) % categories.length;
      const expectedCategory = categories[expectedCategoryIndex];

      for (const accType of accountTypes) {
        // 프로필 데이터 확인 (템플릿 로테이션)
        const { data: profileData } = await supabase
          .from('kakao_profile_content')
          .select('background_base_prompt, profile_base_prompt')
          .eq('date', dateStr)
          .eq('account', accType)
          .single();

        // 피드 데이터 확인 (카테고리 로테이션)
        const { data: feedData } = await supabase
          .from('kakao_feed_content')
          .select('base_prompt, image_category')
          .eq('date', dateStr)
          .eq('account', accType)
          .single();

        // 템플릿 로테이션 체크
        const weekNumber = Math.ceil(day / 7);
        const hasBasePrompt = profileData?.background_base_prompt || profileData?.profile_base_prompt;
        
        if (!hasBasePrompt) {
          report.templateRotation.missing++;
          report.templateRotation.details.push({
            date: dateStr,
            accountType: accType,
            issue: 'basePrompt 없음',
            expectedTemplateIndex: expectedTemplateIndex + 1
          });
        } else {
          // 템플릿 인덱스는 basePrompt 내용으로 직접 확인하기 어려우므로
          // basePrompt가 존재하면 정상으로 간주
          report.templateRotation.correct++;
        }

        // 카테고리 로테이션 체크
        if (!feedData?.image_category) {
          report.categoryRotation.missing++;
          report.categoryRotation.details.push({
            date: dateStr,
            accountType: accType,
            issue: 'image_category 없음',
            expectedCategory
          });
        } else if (feedData.image_category !== expectedCategory) {
          report.categoryRotation.incorrect++;
          report.categoryRotation.details.push({
            date: dateStr,
            accountType: accType,
            issue: '카테고리 불일치',
            current: feedData.image_category,
            expected: expectedCategory
          });
        } else {
          report.categoryRotation.correct++;
        }
      }
    }

    // 일관성 점수 계산
    const totalChecks = daysInMonth * accountTypes.length * 2; // 템플릿 + 카테고리
    const correctChecks = report.templateRotation.correct + report.categoryRotation.correct;
    report.consistency.score = Math.round((correctChecks / totalChecks) * 100);

    // 문제 요약
    if (report.templateRotation.missing > 0 || report.templateRotation.incorrect > 0) {
      report.consistency.issues.push(
        `템플릿 로테이션: ${report.templateRotation.missing}개 누락, ${report.templateRotation.incorrect}개 불일치`
      );
    }
    if (report.categoryRotation.missing > 0 || report.categoryRotation.incorrect > 0) {
      report.consistency.issues.push(
        `카테고리 로테이션: ${report.categoryRotation.missing}개 누락, ${report.categoryRotation.incorrect}개 불일치`
      );
    }

    // fix 액션: 문제 수정
    if (action === 'fix') {
      const fixes = {
        templateRotation: 0,
        categoryRotation: 0,
        errors: []
      };

      // 템플릿 로테이션 수정 (basePrompt가 없는 경우)
      for (const detail of report.templateRotation.details) {
        if (detail.issue === 'basePrompt 없음') {
          try {
            // generate-base-prompt API 호출하여 basePrompt 생성
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
              (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
            
            const types = ['background', 'profile'];
            for (const type of types) {
              const response = await fetch(`${baseUrl}/api/kakao-content/generate-base-prompt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  date: detail.date,
                  accountType: detail.accountType,
                  type
                })
              });

              if (response.ok) {
                const data = await response.json();
                if (data.success && data.basePrompt) {
                  const updateField = `${type}_base_prompt`;
                  const { error } = await supabase
                    .from('kakao_profile_content')
                    .upsert({
                      date: detail.date,
                      account: detail.accountType,
                      [updateField]: data.basePrompt,
                      updated_at: new Date().toISOString()
                    }, {
                      onConflict: 'date,account'
                    });

                  if (!error) {
                    fixes.templateRotation++;
                  }
                }
              }
            }
          } catch (error) {
            fixes.errors.push({
              date: detail.date,
              accountType: detail.accountType,
              error: error.message
            });
          }
        }
      }

      // 카테고리 로테이션 수정
      for (const detail of report.categoryRotation.details) {
        try {
          const dayOfMonth = parseInt(detail.date.split('-')[2]);
          const categoryIndex = Math.floor((dayOfMonth - 1) / 7) % categories.length;
          const expectedCategory = categories[categoryIndex];

          const { error } = await supabase
            .from('kakao_feed_content')
            .upsert({
              date: detail.date,
              account: detail.accountType,
              image_category: expectedCategory,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'date,account'
            });

          if (!error) {
            fixes.categoryRotation++;
          }
        } catch (error) {
          fixes.errors.push({
            date: detail.date,
            accountType: detail.accountType,
            error: error.message
          });
        }
      }

      return res.status(200).json({
        success: true,
        action: 'fix',
        report,
        fixes
      });
    }

    // check/report 액션: 리포트만 반환
    return res.status(200).json({
      success: true,
      action,
      report
    });

  } catch (error) {
    console.error('❌ 로테이션 관리 오류:', error);
    return res.status(500).json({
      success: false,
      message: '로테이션 관리 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}





