import { Module } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module.js'

import { ScheduledTasksService } from './scheduled-tasks.service.js'

@Module({
  imports: [AuthModule],
  providers: [ScheduledTasksService],
})
export class ScheduledTasksModule {}
