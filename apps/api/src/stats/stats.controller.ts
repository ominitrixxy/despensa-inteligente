import { Controller, Get, Query } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('waste')
  waste(@CurrentUser() user: AuthUser, @Query('days') days?: string) {
    const parsed = Math.min(Math.max(Number(days) || 30, 1), 365);
    return this.stats.waste(user.id, parsed);
  }
}
