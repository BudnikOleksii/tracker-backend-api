import { authProviderEnum } from '@/database/schemas/enums.js';

export type AuthProvider = (typeof authProviderEnum.enumValues)[number];
