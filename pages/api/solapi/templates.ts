import type { NextApiRequest, NextApiResponse } from 'next';
import { createSolapiSignature } from '../../../utils/solapiSignature.js';

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY;
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET;
const KAKAO_PLUS_FRIEND_ID = process.env.KAKAO_PLUS_FRIEND_ID;

/**
 * Solapi 알림톡 템플릿 목록 조회 API
 * 
 * GET /api/solapi/templates
 * Query Parameters:
 *   - channelId: 카카오 채널 ID (pfId) - 선택사항
 *   - status: 템플릿 상태 필터 (APPROVED, PENDING 등) - 선택사항
 *   - search: 템플릿 이름 검색 - 선택사항
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
    return res.status(500).json({
      success: false,
      message: 'Solapi API 키가 설정되지 않았습니다.'
    });
  }

  try {
    const { channelId, status, search } = req.query;

    // Solapi API 인증 헤더 생성
    const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);

    // 쿼리 파라미터 구성
    const queryParams = new URLSearchParams();
    
    // 발송 가능한 템플릿만 조회 (sendable 엔드포인트 사용)
    let apiUrl = 'https://api.solapi.com/kakao/v2/templates/sendable';
    
    if (channelId) {
      queryParams.append('channelId', channelId as string);
    } else if (KAKAO_PLUS_FRIEND_ID) {
      // 환경 변수에 채널 ID가 있으면 자동으로 사용
      queryParams.append('channelId', KAKAO_PLUS_FRIEND_ID);
    }
    
    if (status) {
      queryParams.append('status', status as string);
    } else {
      // 기본값: 승인된 템플릿만
      queryParams.append('status', 'APPROVED');
    }

    if (search) {
      queryParams.append('name', search as string);
    }

    // limit 추가 (최대 100개)
    queryParams.append('limit', '100');

    const fullUrl = `${apiUrl}?${queryParams.toString()}`;

    console.log('🔍 Solapi 템플릿 목록 조회:', fullUrl);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: authHeaders,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Solapi 템플릿 목록 조회 실패:', response.status, errorText);
      
      return res.status(response.status).json({
        success: false,
        message: `Solapi 템플릿 목록 조회 실패: ${response.status}`,
        error: errorText.substring(0, 500)
      });
    }

    const data = await response.json();

    // 템플릿 목록 정리
    const templates = (data.templates || []).map((template: any) => ({
      templateId: template.templateId || template.template_id,
      name: template.name || template.templateName,
      content: template.content || template.message,
      status: template.status || 'APPROVED',
      channelId: template.channelId || template.pfId,
      variables: template.variables || extractVariables(template.content || template.message),
      createdAt: template.dateCreated || template.createdAt,
      updatedAt: template.dateUpdated || template.updatedAt,
    }));

    // 검색어가 있으면 이름으로 필터링
    let filteredTemplates = templates;
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      filteredTemplates = templates.filter((t: any) =>
        t.name?.toLowerCase().includes(searchLower) ||
        t.templateId?.toLowerCase().includes(searchLower)
      );
    }

    return res.status(200).json({
      success: true,
      templates: filteredTemplates,
      total: filteredTemplates.length,
      channelId: channelId || KAKAO_PLUS_FRIEND_ID || null
    });

  } catch (error: any) {
    console.error('❌ Solapi 템플릿 목록 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '템플릿 목록 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}

/**
 * 템플릿 내용에서 변수 추출 (#{변수명} 형식)
 */
function extractVariables(content: string): string[] {
  if (!content) return [];
  
  const variableRegex = /#\{([^}]+)\}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = variableRegex.exec(content)) !== null) {
    const varName = match[1].trim();
    if (varName && !variables.includes(varName)) {
      variables.push(varName);
    }
  }
  
  return variables;
}
