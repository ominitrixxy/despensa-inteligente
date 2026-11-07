import { Controller, ForbiddenException, Post } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /**
   * Endpoint de desenvolvimento: força a verificação de validade (e o push) para o usuário logado,
   * ignorando a hora configurada. Desabilitado em produção.
   */
  @Post('run')
  run(@CurrentUser() user: AuthUser) {
    if (process.env.NODE_ENV === 'production') throw new ForbiddenException('Indisponível em produção');
    return this.notifications.runDailyCheck({ force: true, userId: user.id });
  }
}
