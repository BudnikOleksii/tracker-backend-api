import type { AuthProvider } from '@/shared/enums/auth-provider.enum.js';
import type { DeviceContext } from '@/shared/types/device-context.js';
import type { UserIdentity } from '@/shared/types/user-identity.js';

export interface AuthUser extends UserIdentity {
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
  role: UserIdentity['role'];
  deviceContext?: DeviceContext;
}

export interface GenerateTokensResult {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
  user: UserIdentity;
}

export interface RefreshTokenInfo {
  user: UserIdentity;
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
