import { Module } from '@nestjs/common';

import { AuthModule } from '@/modules/auth/auth.module.js';
import { CacheModule } from '@/modules/cache/cache.module.js';
import { UserModule } from '@/modules/user/user.module.js';

import { ProfileController } from './profile.controller.js';
import { ProfileService } from './profile.service.js';

@Module({
  imports: [UserModule, AuthModule, CacheModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
