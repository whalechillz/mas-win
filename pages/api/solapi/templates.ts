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
 *   - search: 템플릿 이름 검색 - 선택사항
 * 
 * 참고: Solapi API는 channelId, status를 쿼리 파라미터로 지원하지 않을 수 있습니다.
 * 클라이언트 측에서 필터링하거나, 응답 데이터에서 필터링합니다.
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
    
    // Solapi 템플릿 목록 조회 엔드포인트
    // 참고: Solapi API 문서에 따르면 기본 엔드포인트 사용
    let apiUrl = 'https://api.solapi.com/kakao/v2/templates';
    
    // limit 추가 (최대 100개)
    queryParams.append('limit', '100');
    
    // offset 추가 (페이지네이션, 0부터 시작)
    queryParams.append('offset', '0');

    // search 파라미터 (템플릿 이름 검색)
    if (search && typeof search === 'string') {
      queryParams.append('name', search);
    }

    const fullUrl = queryParams.toString() 
      ? `${apiUrl}?${queryParams.toString()}`
      : apiUrl;

    console.log('🔍 Solapi 템플릿 목록 조회:', fullUrl);
    console.log('📋 요청 헤더:', JSON.stringify(authHeaders, null, 2));

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: authHeaders,
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('❌ Solapi 템플릿 목록 조회 실패:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText.substring(0, 1000)
      });
      
      // JSON 파싱 시도
      let errorData: any = {};
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText };
      }
      
      return res.status(response.status).json({
        success: false,
        message: `Solapi 템플릿 목록 조회 실패: ${response.status}`,
        error: errorData,
        details: responseText.substring(0, 500)
      });
    }

    // 응답 파싱
    let data: any = {};
    try {
      data = JSON.parse(responseText);
      console.log('✅ Solapi 응답 파싱 성공:', {
        templateCount: data.templates?.length || 0,
        totalCount: data.totalCount || data.total || 0
      });
    } catch (parseError) {
      console.error('❌ 응답 JSON 파싱 실패:', parseError);
      return res.status(500).json({
        success: false,
        message: 'Solapi 응답을 파싱할 수 없습니다.',
        error: responseText.substring(0, 500)
      });
    }

    // 템플릿 목록 정리
    const allTemplates = data.templates || data.list || [];
    const templates = allTemplates.map((template: any) => ({
      templateId: template.templateId || template.template_id || template.id,
      name: template.name || template.templateName || template.title,
      content: template.content || template.message || template.text,
      status: template.status || template.approvalStatus || 'APPROVED',
      channelId: template.channelId || template.pfId || template.channel_id,
      variables: template.variables || extractVariables(template.content || template.message || template.text),
      createdAt: template.dateCreated || template.createdAt || template.createDate,
      updatedAt: template.dateUpdated || template.updatedAt || template.updateDate,
    }));

    // 승인된 템플릿만 필터링 (status가 없으면 모두 포함)
    let filteredTemplates = templates;
    if (!status || status === 'APPROVED') {
      filteredTemplates = templates.filter((t: any) => 
        !t.status || t.status === 'APPROVED' || t.status === '승인'
      );
    } else if (status) {
      filteredTemplates = templates.filter((t: any) => 
        t.status === status || t.status?.toLowerCase() === (status as string).toLowerCase()
      );
    }

    // 검색어가 있으면 이름으로 필터링
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      filteredTemplates = filteredTemplates.filter((t: any) =>
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
