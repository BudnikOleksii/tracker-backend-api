import type { UserRole } from '@/shared/enums/role.enum.js';

export interface DeviceContext {
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  sessionId: string;
}

export type AuthenticatedRequest = Express.Request & { user: AuthUser };

export type GetRefreshTokenParams = AuthUser;

export interface RevokeRefreshTokenParams {
  sessionId: string;
  userId: string;
  currentSessionId: string;
}

export interface GenerateTokensParams {
  userId: string;
  email: string;
  role: UserRole;
  deviceContext?: DeviceContext;
}

export interface GenerateTokensResult {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
  user: { id: string; email: string; role: UserRole };
}
