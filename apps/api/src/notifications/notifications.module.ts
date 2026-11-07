import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushProcessor } from './push.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'push' })],
  controllers: [NotificationsController],
  providers: [NotificationsService, PushProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {}
