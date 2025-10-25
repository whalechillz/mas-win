import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { blogPostId, hubContentId, title, content, excerpt } = req.body;

    if (!blogPostId || !hubContentId || !title || !content) {
      return res.status(400).json({
        success: false,
        message: '필수 파라미터가 누락되었습니다.'
      });
    }

    console.log('🤖 AI 허브 동기화 시작:', { blogPostId, hubContentId, title });

    // 1. 블로그 포스트 정보 조회
    const { data: blogPost, error: blogError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', blogPostId)
      .single();

    if (blogError || !blogPost) {
      console.error('❌ 블로그 포스트 조회 실패:', blogError);
      return res.status(404).json({
        success: false,
        message: '블로그 포스트를 찾을 수 없습니다.'
      });
    }

    // 2. 허브 콘텐츠 정보 조회
    const { data: hubContent, error: hubError } = await supabase
      .from('cc_content_calendar')
      .select('*')
      .eq('id', hubContentId)
      .single();

    if (hubError || !hubContent) {
      console.error('❌ 허브 콘텐츠 조회 실패:', hubError);
      return res.status(404).json({
        success: false,
        message: '허브 콘텐츠를 찾을 수 없습니다.'
      });
    }

    // 3. AI로 허브용 요약 생성
    const summaryPrompt = `
다음 블로그 글을 허브 시스템용 요약으로 변환해주세요.

**원본 제목**: ${title}
**원본 내용**: ${content.substring(0, 2000)}...

**요구사항**:
1. 100-150자 간결한 요약
2. 핵심 혜택과 솔루션 강조
3. 자연스러운 대화체 톤앤매너
4. 마쓰구프 브랜드 자연스럽게 언급

**요약**:
`;

    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: summaryPrompt }],
      max_tokens: 200,
      temperature: 0.7
    });

    const aiSummary = summaryResponse.choices[0].message.content.trim();

    // 4. AI로 허브용 상세 개요 생성
    const overviewPrompt = `
다음 블로그 글을 허브 시스템용 상세 개요로 변환해주세요.

**원본 제목**: ${title}
**원본 내용**: ${content.substring(0, 2000)}...

**요구사항**:
1. 300-400자 상세 개요
2. 구체적이고 현실적인 사례
3. 고객 관점에서의 혜택 강조
4. 자연스러운 대화체 톤앤매너
5. 마쓰구프 브랜드 자연스럽게 언급

**상세 개요**:
`;

    const overviewResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: overviewPrompt }],
      max_tokens: 500,
      temperature: 0.7
    });

    const aiOverview = overviewResponse.choices[0].message.content.trim();

    // 5. 허브 콘텐츠 업데이트
    const { error: updateError } = await supabase
      .from('cc_content_calendar')
      .update({
        title: title,
        summary: aiSummary,
        content_body: aiOverview,
        updated_at: new Date().toISOString()
      })
      .eq('id', hubContentId);

    if (updateError) {
      console.error('❌ 허브 콘텐츠 업데이트 실패:', updateError);
      return res.status(500).json({
        success: false,
        message: '허브 콘텐츠 업데이트에 실패했습니다.',
        error: updateError.message
      });
    }

    // 6. 채널 상태 업데이트
    const { error: statusError } = await supabase
      .from('cc_content_calendar')
      .update({
        channel_status: {
          ...hubContent.channel_status,
          blog: {
            status: '연결됨',
            post_id: blogPostId,
            updated_at: new Date().toISOString()
          }
        }
      })
      .eq('id', hubContentId);

    if (statusError) {
      console.error('⚠️ 채널 상태 업데이트 실패:', statusError);
      // 상태 업데이트 실패는 치명적이지 않으므로 경고만 로그
    }

    console.log('✅ AI 허브 동기화 완료:', { hubContentId, aiSummary, aiOverview });

    return res.status(200).json({
      success: true,
      message: 'AI로 허브 콘텐츠가 성공적으로 동기화되었습니다.',
      data: {
        hubContentId,
        title,
        summary: aiSummary,
        overview: aiOverview
      }
    });

  } catch (error) {
    console.error('❌ AI 허브 동기화 오류:', error);
    return res.status(500).json({
      success: false,
      message: 'AI 허브 동기화 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}
