import { SetMetadata } from '@nestjs/common';

export const USE_ENVELOPE_KEY = 'use_envelope';

export const UseEnvelope = () => SetMetadata(USE_ENVELOPE_KEY, true);
