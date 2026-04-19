import type { UserRole } from '@/shared/enums/role.enum.js';

export interface UserIdentity {
  id: string;
  email: string;
  role: UserRole;
}
