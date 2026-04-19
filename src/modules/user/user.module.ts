import { Module } from '@nestjs/common';

import { IdentityRepository } from './identity.repository.js';
import { UserController } from './user.controller.js';
import { UserRepository } from './user.repository.js';
import { UserService } from './user.service.js';

@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository, IdentityRepository],
  exports: [UserService],
})
export class UserModule {}
