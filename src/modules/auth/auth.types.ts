import type { AuthProvider } from '@/shared/enums/auth-provider.enum.js';
import type { UserRole } from '@/shared/enums/role.enum.js';

export interface DeviceContext {
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  sessionId: string;
  jti: string;
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

export interface RefreshTokenInfo {
  user: { id: string; email: string; role: UserRole };
  refreshToken: {
    id: string;
    expiresAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
  };
}

export interface RefreshTokenListItem {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
}

export interface RefreshTokenListResult {
  refreshTokens: RefreshTokenListItem[];
}

export interface SocialLoginParams {
  provider: AuthProvider;
  providerId: string;
  email: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  deviceContext?: DeviceContext;
}

export interface SocialLoginResult extends GenerateTokensResult {
  isNewUser: boolean;
}
