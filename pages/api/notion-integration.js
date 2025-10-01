/**
 * Notion API 연동 시스템
 * 블로그 데이터, AI 사용량, 학습 데이터를 Notion에 저장
 */

export default async function handler(req, res) {
  // CORS 헤더 추가
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action, data } = req.body;

    switch (action) {
      case 'save-blog-post':
        return await saveBlogPost(data, res);
      
      case 'save-ai-usage':
        return await saveAIUsage(data, res);
      
      case 'save-learning-feedback':
        return await saveLearningFeedback(data, res);
      
      case 'save-batch-results':
        return await saveBatchResults(data, res);
      
      case 'get-notion-pages':
        return await getNotionPages(res);
      
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('Notion API 오류:', error);
    return res.status(500).json({ error: error.message });
  }
}

// 블로그 포스트 저장
async function saveBlogPost(data, res) {
  try {
    const { title, content, images, contentType, aiAnalysis } = data;

    const response = await fetch(`https://api.notion.com/v1/pages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: {
          database_id: process.env.NOTION_BLOG_DATABASE_ID
        },
        properties: {
          '제목': {
            title: [
              {
                text: {
                  content: title
                }
              }
            ]
          },
          '콘텐츠 유형': {
            select: {
              name: contentType || 'general'
            }
          },
          'AI 분석 신뢰도': {
            number: aiAnalysis?.confidence || 0
          },
          '생성된 이미지 수': {
            number: images?.length || 0
          },
          '생성일': {
            date: {
              start: new Date().toISOString().split('T')[0]
            }
          },
          '상태': {
            select: {
              name: '생성됨'
            }
          }
        },
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: content?.substring(0, 2000) || '내용 없음'
                  }
                }
              ]
            }
          },
          ...(images?.map(image => ({
            object: 'block',
            type: 'image',
            image: {
              type: 'external',
              external: {
                url: image.publicUrl || image.url
              }
            }
          })) || [])
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Notion API 오류: ${response.status} - ${errorData}`);
    }

    const result = await response.json();

    return res.status(200).json({
      success: true,
      message: '블로그 포스트가 Notion에 저장되었습니다.',
      notionPageId: result.id,
      notionUrl: result.url
    });

  } catch (error) {
    throw error;
  }
}

// AI 사용량 저장
async function saveAIUsage(data, res) {
  try {
    const { model, tokens, cost, success, details } = data;

    const response = await fetch(`https://api.notion.com/v1/pages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: {
          database_id: process.env.NOTION_AI_USAGE_DATABASE_ID
        },
        properties: {
          'AI 모델': {
            select: {
              name: model
            }
          },
          '토큰 수': {
            number: tokens
          },
          '비용': {
            number: cost
          },
          '성공 여부': {
            checkbox: success
          },
          '사용일': {
            date: {
              start: new Date().toISOString().split('T')[0]
            }
          },
          '시간': {
            created_time: new Date().toISOString()
          }
        },
        children: details ? [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: `상세 정보: ${JSON.stringify(details, null, 2)}`
                  }
                }
              ]
            }
          }
        ] : []
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Notion API 오류: ${response.status} - ${errorData}`);
    }

    const result = await response.json();

    return res.status(200).json({
      success: true,
      message: 'AI 사용량이 Notion에 저장되었습니다.',
      notionPageId: result.id
    });

  } catch (error) {
    throw error;
  }
}

// 학습 피드백 저장
async function saveLearningFeedback(data, res) {
  try {
    const { contentTitle, predictedCategory, actualCategory, userFeedback, confidence, reasoning } = data;

    const response = await fetch(`https://api.notion.com/v1/pages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: {
          database_id: process.env.NOTION_LEARNING_DATABASE_ID
        },
        properties: {
          '콘텐츠 제목': {
            title: [
              {
                text: {
                  content: contentTitle
                }
              }
            ]
          },
          '예측 카테고리': {
            select: {
              name: predictedCategory
            }
          },
          '실제 카테고리': {
            select: {
              name: actualCategory || '미분류'
            }
          },
          '사용자 피드백': {
            select: {
              name: userFeedback
            }
          },
          '신뢰도': {
            number: confidence
          },
          '피드백일': {
            date: {
              start: new Date().toISOString().split('T')[0]
            }
          }
        },
        children: reasoning ? [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: `분석 이유: ${reasoning}`
                  }
                }
              ]
            }
          }
        ] : []
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Notion API 오류: ${response.status} - ${errorData}`);
    }

    const result = await response.json();

    return res.status(200).json({
      success: true,
      message: '학습 피드백이 Notion에 저장되었습니다.',
      notionPageId: result.id
    });

  } catch (error) {
    throw error;
  }
}

// 배치 결과 저장
async function saveBatchResults(data, res) {
  try {
    const { batchName, totalUrls, successCount, failedCount, results } = data;

    const response = await fetch(`https://api.notion.com/v1/pages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: {
          database_id: process.env.NOTION_BATCH_DATABASE_ID
        },
        properties: {
          '배치 이름': {
            title: [
              {
                text: {
                  content: batchName
                }
              }
            ]
          },
          '총 URL 수': {
            number: totalUrls
          },
          '성공 수': {
            number: successCount
          },
          '실패 수': {
            number: failedCount
          },
          '성공률': {
            number: totalUrls > 0 ? (successCount / totalUrls) * 100 : 0
          },
          '처리일': {
            date: {
              start: new Date().toISOString().split('T')[0]
            }
          }
        },
        children: [
          {
            object: 'block',
            type: 'heading_2',
            heading_2: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: '처리 결과'
                  }
                }
              ]
            }
          },
          ...results.map(result => ({
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: `${result.title} (${result.status})`
                  }
                }
              ]
            }
          }))
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Notion API 오류: ${response.status} - ${errorData}`);
    }

    const result = await response.json();

    return res.status(200).json({
      success: true,
      message: '배치 결과가 Notion에 저장되었습니다.',
      notionPageId: result.id
    });

  } catch (error) {
    throw error;
  }
}

// Notion 페이지 목록 조회
async function getNotionPages(res) {
  try {
    const response = await fetch(`https://api.notion.com/v1/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        query: '',
        filter: {
          property: 'object',
          value: 'page'
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Notion API 오류: ${response.status} - ${errorData}`);
    }

    const result = await response.json();

    return res.status(200).json({
      success: true,
      pages: result.results.map(page => ({
        id: page.id,
        title: page.properties?.title?.title?.[0]?.text?.content || '제목 없음',
        url: page.url,
        createdTime: page.created_time,
        lastEditedTime: page.last_edited_time
      }))
    });

  } catch (error) {
    throw error;
  }
}
