import { countryCodeEnum } from '@/database/schemas/enums.js';

export const COUNTRY_CODES = countryCodeEnum.enumValues;

export type CountryCode = (typeof COUNTRY_CODES)[number];
