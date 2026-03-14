export type RoleType = 'ADMIN' | 'USER'

export const ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const

export const ROLE_HIERARCHY: RoleType[] = [
  'USER',
  'ADMIN',
]

export function hasRequiredRole(actorRole: RoleType, requiredRole: RoleType): boolean {
  const actorIndex = ROLE_HIERARCHY.indexOf(actorRole)
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole)
  return actorIndex >= requiredIndex
}
