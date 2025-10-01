/**
 * 사용자 피드백 기반 학습 시스템
 * 사용자의 피드백을 수집하고 AI 모델을 개선
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS 헤더 추가
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action, feedback } = req.body;

    switch (action) {
      case 'submit-feedback':
        return await submitFeedback(feedback, res);
      
      case 'get-learning-stats':
        return await getLearningStats(res);
      
      case 'get-improvement-suggestions':
        return await getImprovementSuggestions(res);
      
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('학습 시스템 오류:', error);
    return res.status(500).json({ error: error.message });
  }
}

// 피드백 제출
async function submitFeedback(feedback, res) {
  try {
    const feedbackData = {
      id: `feedback_${Date.now()}`,
      content_title: feedback.title,
      predicted_category: feedback.predictedCategory,
      actual_category: feedback.actualCategory,
      user_feedback: feedback.feedback, // 'correct', 'incorrect', 'partially_correct'
      confidence_score: feedback.confidence,
      keywords: feedback.keywords || [],
      reasoning: feedback.reasoning || '',
      user_suggestions: feedback.suggestions || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('learning_feedback')
      .insert(feedbackData)
      .select()
      .single();

    if (error) throw error;

    // 피드백이 부정적이면 개선 제안 생성
    if (feedback.feedback === 'incorrect' || feedback.feedback === 'partially_correct') {
      await generateImprovementSuggestion(feedbackData);
    }

    return res.status(200).json({
      success: true,
      message: '피드백이 저장되었습니다.',
      feedbackId: data.id
    });

  } catch (error) {
    throw error;
  }
}

// 학습 통계 조회
async function getLearningStats(res) {
  try {
    const { data: feedbacks, error } = await supabase
      .from('learning_feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 통계 계산
    const stats = {
      totalFeedbacks: feedbacks.length,
      correctPredictions: feedbacks.filter(f => f.user_feedback === 'correct').length,
      incorrectPredictions: feedbacks.filter(f => f.user_feedback === 'incorrect').length,
      partiallyCorrect: feedbacks.filter(f => f.user_feedback === 'partially_correct').length,
      accuracy: 0,
      categoryAccuracy: {},
      recentImprovements: []
    };

    // 정확도 계산
    if (stats.totalFeedbacks > 0) {
      stats.accuracy = (stats.correctPredictions / stats.totalFeedbacks) * 100;
    }

    // 카테고리별 정확도
    const categories = [...new Set(feedbacks.map(f => f.predicted_category))];
    categories.forEach(category => {
      const categoryFeedbacks = feedbacks.filter(f => f.predicted_category === category);
      const correctCount = categoryFeedbacks.filter(f => f.user_feedback === 'correct').length;
      stats.categoryAccuracy[category] = categoryFeedbacks.length > 0 
        ? (correctCount / categoryFeedbacks.length) * 100 
        : 0;
    });

    // 최근 개선사항
    const { data: improvements } = await supabase
      .from('learning_improvements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    stats.recentImprovements = improvements || [];

    return res.status(200).json({
      success: true,
      stats
    });

  } catch (error) {
    throw error;
  }
}

// 개선 제안 조회
async function getImprovementSuggestions(res) {
  try {
    const { data, error } = await supabase
      .from('learning_improvements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      suggestions: data || []
    });

  } catch (error) {
    throw error;
  }
}

// 개선 제안 생성
async function generateImprovementSuggestion(feedbackData) {
  try {
    const improvement = {
      id: `improvement_${Date.now()}`,
      feedback_id: feedbackData.id,
      category: feedbackData.predicted_category,
      issue: `분류 오류: ${feedbackData.predicted_category} → ${feedbackData.actual_category}`,
      suggestion: `"${feedbackData.content_title}"와 같은 콘텐츠는 ${feedbackData.actual_category} 카테고리로 분류해야 합니다.`,
      keywords_to_add: feedbackData.keywords,
      confidence_threshold: Math.max(0.8, feedbackData.confidence_score + 0.1),
      created_at: new Date().toISOString()
    };

    await supabase
      .from('learning_improvements')
      .insert(improvement);

    console.log('✅ 개선 제안 생성:', improvement.suggestion);

  } catch (error) {
    console.error('개선 제안 생성 실패:', error);
  }
}
