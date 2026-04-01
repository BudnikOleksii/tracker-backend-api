import { recurringFrequencyEnum } from '@/database/schemas/enums.js';

export const RECURRING_FREQUENCIES = recurringFrequencyEnum.enumValues;

export type RecurringFrequency = (typeof RECURRING_FREQUENCIES)[number];
