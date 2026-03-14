import { userRoleEnum } from '@/database/schemas/enums.js';

export type UserRole = (typeof userRoleEnum.enumValues)[number];

export const ROLES = userRoleEnum.enumValues;

export const ROLE_HIERARCHY: UserRole[] = ['USER', 'ADMIN', 'SUPER_ADMIN'];

export function hasRequiredRole(actorRole: UserRole, requiredRole: UserRole): boolean {
  const actorIndex = ROLE_HIERARCHY.indexOf(actorRole);
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole);

  return actorIndex >= requiredIndex;
}
