import { authProviderEnum } from '@/database/schemas/enums.js';

export type AuthProvider = (typeof authProviderEnum.enumValues)[number];
export const AUTH_PROVIDERS = authProviderEnum.enumValues;
