import { menuCategories, type MenuCategory } from './admin-menu-structure';

/**
 * 사용자 권한에 따라 메뉴 필터링
 */
export function filterMenusByPermission(
  menus: MenuCategory[],
  userPermissions?: {
    categories?: string[];
    menus?: Record<string, boolean>;
  },
  userRole?: string
): MenuCategory[] {
  // admin은 모든 메뉴 접근 가능
  if (userRole === 'admin') {
    return menus;
  }

  // permissions가 없으면 빈 배열 반환
  if (!userPermissions || !userPermissions.categories) {
    return [];
  }

  const allowedCategories = userPermissions.categories || [];

  // 카테고리 필터링
  return menus
    .filter(category => allowedCategories.includes(category.id))
    .map(category => ({
      ...category,
      menus: category.menus // 카테고리 권한이 있으면 모든 메뉴 접근 가능
    }));
}

/**
 * 특정 카테고리에 접근 권한이 있는지 확인
 */
export function hasCategoryPermission(
  categoryId: string,
  userPermissions?: {
    categories?: string[];
  },
  userRole?: string
): boolean {
  // admin은 모든 권한 허용
  if (userRole === 'admin') {
    return true;
  }

  if (!userPermissions || !userPermissions.categories) {
    return false;
  }

  return userPermissions.categories.includes(categoryId);
}

/**
 * 특정 메뉴에 접근 권한이 있는지 확인
 */
export function hasMenuPermission(
  categoryId: string,
  menuId: string,
  userPermissions?: {
    categories?: string[];
    menus?: Record<string, boolean>;
  },
  userRole?: string
): boolean {
  // 카테고리 권한 먼저 확인
  if (!hasCategoryPermission(categoryId, userPermissions, userRole)) {
    return false;
  }

  // admin은 모든 권한 허용
  if (userRole === 'admin') {
    return true;
  }

  // 메뉴별 권한이 지정된 경우 체크
  if (userPermissions?.menus) {
    const menuKey = `${categoryId}:${menuId}`;
    return userPermissions.menus[menuKey] !== false;
  }

  // 카테고리 권한이 있으면 메뉴 접근 가능
  return true;
}

/**
 * 기본 메뉴 카테고리 목록 반환 (권한 필터링 없이)
 */
export function getAllMenuCategories(): MenuCategory[] {
  return menuCategories;
}
