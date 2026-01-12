import { getServerSession } from 'next-auth';
import { authOptions } from '../pages/api/auth/[...nextauth]';
import type { NextApiRequest, NextApiResponse } from 'next';
import { ROLES } from './auth';

export interface AuthResult {
  user: {
    id: string;
    role: string;
    name: string;
    phone: string;
    permissions?: {
      categories?: string[];
      menus?: Record<string, boolean>;
    };
  };
  isAdmin: boolean;
  isEditor: boolean;
}

/**
 * API 핸들러에서 사용할 인증 체크 함수
 */
export async function requireAuth(
  req: NextApiRequest,
  res: NextApiResponse,
  options?: {
    requireAdmin?: boolean;
    requireEditor?: boolean;
  }
): Promise<AuthResult> {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user) {
    res.status(401).json({
      success: false,
      message: '인증이 필요합니다. 로그인해주세요.'
    });
    throw new Error('Unauthorized');
  }

  const user = session.user;
  const isAdmin = user.role === ROLES.ADMIN;
  const isEditor = user.role === ROLES.EDITOR || isAdmin;

  // 관리자 권한이 필요한 경우
  if (options?.requireAdmin && !isAdmin) {
    res.status(403).json({
      success: false,
      message: '관리자 권한이 필요합니다.'
    });
    throw new Error('Forbidden');
  }

  // 에디터 이상 권한이 필요한 경우
  if (options?.requireEditor && !isEditor) {
    res.status(403).json({
      success: false,
      message: '에디터 이상의 권한이 필요합니다.'
    });
    throw new Error('Forbidden');
  }

  // permissions 정보 가져오기 (세션에 포함되어 있다고 가정)
  const permissions = (user as any).permissions || {};

  return {
    user: {
      id: user.id || '',
      role: user.role || '',
      name: user.name || '',
      phone: user.phone || '',
      permissions
    },
    isAdmin,
    isEditor
  };
}

/**
 * 카테고리별 권한 체크 함수
 */
export async function requireCategoryPermission(
  req: NextApiRequest,
  res: NextApiResponse,
  categoryId: string
): Promise<AuthResult> {
  const auth = await requireAuth(req, res, { requireEditor: true });
  
  // admin은 모든 권한 허용
  if (auth.isAdmin) {
    return auth;
  }
  
  // editor는 permissions 확인
  const userPermissions = auth.user.permissions?.categories || [];
  if (!userPermissions.includes(categoryId)) {
    res.status(403).json({
      success: false,
      message: `${categoryId} 카테고리에 대한 접근 권한이 없습니다.`
    });
    throw new Error('Forbidden');
  }
  
  return auth;
}

/**
 * 메뉴별 권한 체크 함수 (선택사항)
 */
export async function requireMenuPermission(
  req: NextApiRequest,
  res: NextApiResponse,
  categoryId: string,
  menuId?: string
): Promise<AuthResult> {
  const auth = await requireCategoryPermission(req, res, categoryId);
  
  // admin은 모든 권한 허용
  if (auth.isAdmin) {
    return auth;
  }
  
  // 메뉴별 권한이 지정된 경우 체크
  if (menuId && auth.user.permissions?.menus) {
    const menuKey = `${categoryId}:${menuId}`;
    if (auth.user.permissions.menus[menuKey] === false) {
      res.status(403).json({
        success: false,
        message: `${menuId} 메뉴에 대한 접근 권한이 없습니다.`
      });
      throw new Error('Forbidden');
    }
  }
  
  return auth;
}
