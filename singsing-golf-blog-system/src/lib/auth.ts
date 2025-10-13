import { getServerSession } from 'next-auth'
import { authOptions } from '../pages/api/auth/[...nextauth]'

export const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor'
} as const

export const PERMISSIONS = {
  admin: [
    'content:read', 'content:write', 'content:delete',
    'user:read', 'user:write', 'user:delete',
    'system:read', 'system:write', 'system:delete',
    'multichannel:create', 'multichannel:manage'
  ],
  editor: [
    'content:read', 'content:write',
    'user:read',
    'multichannel:create'
  ]
} as const

export type UserRole = keyof typeof PERMISSIONS
export type Permission = string

// 권한 체크 함수
export function hasPermission(userRole: string, permission: Permission): boolean {
  return PERMISSIONS[userRole as UserRole]?.includes(permission) || false
}

// 서버사이드에서 현재 사용자 세션 가져오기
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user || null
}

// 관리자 권한 체크
export async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== ROLES.ADMIN) {
    throw new Error('관리자 권한이 필요합니다.')
  }
  return user
}

// 에디터 이상 권한 체크
export async function requireEditor() {
  const user = await getCurrentUser()
  if (!user || (user.role !== ROLES.ADMIN && user.role !== ROLES.EDITOR)) {
    throw new Error('에디터 이상의 권한이 필요합니다.')
  }
  return user
}

// 특정 권한 체크
export async function requirePermission(permission: Permission) {
  const user = await getCurrentUser()
  if (!user || !hasPermission(user.role, permission)) {
    throw new Error(`${permission} 권한이 필요합니다.`)
  }
  return user
}

// 전화번호 형식 검증
export function validatePhoneNumber(phone: string): boolean {
  const cleanPhone = phone.replace(/[^0-9]/g, '')
  return /^010\d{8}$/.test(cleanPhone)
}

// 전화번호 정리 (하이픈 제거)
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, '')
}

// 전화번호 포맷팅 (하이픈 추가)
export function formatPhoneNumber(phone: string): string {
  const clean = cleanPhoneNumber(phone)
  if (clean.length === 11) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7)}`
  }
  return phone
}
