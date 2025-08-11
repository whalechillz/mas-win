import { NextApiRequest, NextApiResponse } from 'next';

export default async function validate-seo(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { content, title, keywords } = req.body;

    console.log('SEO 검증 시작:', { title, keywords });

    let seoScore = 100;
    const suggestions = [];

    if (!title || title.length < 10) {
      seoScore -= 20;
      suggestions.push('제목을 10자 이상으로 작성하세요.');
    } else if (title.length > 50) {
      seoScore -= 10;
      suggestions.push('제목을 50자 이하로 줄이세요.');
    }

    if (keywords && keywords.length > 0) {
      const keywordInTitle = keywords.some(keyword => 
        title.toLowerCase().includes(keyword.toLowerCase())
      );
      if (!keywordInTitle) {
        seoScore -= 15;
        suggestions.push('제목에 주요 키워드를 포함하세요.');
      }
    }

    if (!content || content.length < 500) {
      seoScore -= 25;
      suggestions.push('콘텐츠를 500자 이상으로 작성하세요.');
    } else if (content.length > 3000) {
      seoScore -= 10;
      suggestions.push('콘텐츠를 3000자 이하로 줄이세요.');
    }

    const imageCount = (content.match(/!\[.*?\]\(.*?\)/g) || []).length;
    if (imageCount < 2) {
      seoScore -= 10;
      suggestions.push('이미지를 2개 이상 추가하세요.');
    }

    const linkCount = (content.match(/\[.*?\]\(.*?\)/g) || []).length;
    if (linkCount < 1) {
      seoScore -= 10;
      suggestions.push('관련 링크를 1개 이상 추가하세요.');
    }

    seoScore = Math.max(0, seoScore);

    const result = {
      seoScore,
      grade: seoScore >= 80 ? 'A' : seoScore >= 60 ? 'B' : seoScore >= 40 ? 'C' : 'D',
      suggestions,
      details: {
        titleLength: title?.length || 0,
        contentLength: content?.length || 0,
        imageCount,
        linkCount,
        keywordInTitle: keywords && keywords.length > 0 ? 
          keywords.some(keyword => title?.toLowerCase().includes(keyword.toLowerCase())) : true
      }
    };

    return res.status(200).json(result);

  } catch (error) {
    console.error('SEO 검증 오류:', error);
    return res.status(500).json({ error: 'SEO 검증 중 오류가 발생했습니다.' });
  }
}
