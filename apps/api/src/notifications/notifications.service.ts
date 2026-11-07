import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { addDays, getLocalParts, ymdToUtcDate } from '../common/date.util';
import { PrismaService } from '../prisma/prisma.service';

export interface PushJobData {
  userId: string;
  alertIds: string[];
  title: string;
  body: string;
}

export interface DailyCheckSummary {
  usersChecked: number;
  usersNotified: number;
  alertsCreated: number;
  jobsEnqueued: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @InjectQueue('push') private readonly pushQueue: Queue<PushJobData>,
  ) {}

  /**
   * Roda a cada hora cheia. Em cada execução só processa usuários cuja hora LOCAL
   * (no fuso configurado) coincide com notifyHour, então cada usuário recebe 1 push por dia
   * no horário que escolheu. Habilite RUN_SCHEDULER=true em apenas UM processo.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyCron() {
    if (this.config.get<string>('RUN_SCHEDULER') !== 'true') return;
    const summary = await this.runDailyCheck();
    this.logger.log(`Verificação horária concluída: ${JSON.stringify(summary)}`);
  }

  /**
   * @param opts.force  ignora a checagem de hora local (útil para testes manuais)
   * @param opts.userId restringe a um usuário
   * @param opts.now    injeta o "agora" (testes)
   */
  async runDailyCheck(opts: { force?: boolean; userId?: string; now?: Date } = {}): Promise<DailyCheckSummary> {
    const now = opts.now ?? new Date();
    const summary: DailyCheckSummary = { usersChecked: 0, usersNotified: 0, alertsCreated: 0, jobsEnqueued: 0 };

    // MVP: varre os usuários e filtra pela hora local em memória.
    // Para escalar: particionar por timezone (coluna indexada) ou paginar em lotes.
    const users = await this.prisma.user.findMany({
      where: opts.userId ? { id: opts.userId } : {},
      select: {
        id: true,
        timezone: true,
        notifyHour: true,
        notifyDaysBefore: true,
        _count: { select: { deviceTokens: true } },
      },
    });

    for (const user of users) {
      const { hour, ymd } = getLocalParts(user.timezone, now);
      if (!opts.force && hour !== user.notifyHour) continue;
      summary.usersChecked++;

      const today = ymdToUtcDate(ymd);
      const limit = addDays(today, user.notifyDaysBefore);

      const [expiring, expired] = await Promise.all([
        this.prisma.product.findMany({
          where: { userId: user.id, status: 'active', expiryDate: { gte: today, lte: limit } },
          select: { id: true, name: true },
          orderBy: { expiryDate: 'asc' },
        }),
        this.prisma.product.findMany({
          where: { userId: user.id, status: 'active', expiryDate: { lt: today } },
          select: { id: true, name: true, expiryDate: true },
          orderBy: { expiryDate: 'asc' },
        }),
      ]);
      if (!expiring.length && !expired.length) continue;

      // Idempotência: UNIQUE(productId, type, scheduledFor) + skipDuplicates.
      // 'expiring_soon' é diário (scheduledFor = hoje); 'expired' é emitido uma única vez (scheduledFor = data de validade).
      const created = await this.prisma.alert.createMany({
        data: [
          ...expiring.map((p) => ({
            userId: user.id,
            productId: p.id,
            type: 'expiring_soon' as const,
            scheduledFor: today,
          })),
          ...expired.map((p) => ({
            userId: user.id,
            productId: p.id,
            type: 'expired' as const,
            scheduledFor: p.expiryDate,
          })),
        ],
        skipDuplicates: true,
      });
      summary.alertsCreated += created.count;

      if (user._count.deviceTokens === 0) continue;

      const pending = await this.prisma.alert.findMany({
        where: { userId: user.id, sentAt: null, productId: { in: [...expiring, ...expired].map((p) => p.id) } },
        select: { id: true },
      });
      if (!pending.length) continue;

      const { title, body } = this.buildMessage(
        expiring.map((p) => p.name),
        expired.map((p) => p.name),
      );

      // jobId único por usuário/dia: reexecuções do cron não duplicam o push.
      await this.pushQueue.add(
        'send-push',
        { userId: user.id, alertIds: pending.map((a) => a.id), title, body },
        {
          jobId: `push-${user.id}-${ymd}`,
          attempts: 5,
          backoff: { type: 'exponential', delay: 30_000 },
          removeOnComplete: 1000,
          removeOnFail: 5000,
        },
      );
      summary.jobsEnqueued++;
      summary.usersNotified++;
    }

    return summary;
  }

  private buildMessage(expiring: string[], expired: string[]) {
    const parts: string[] = [];
    if (expiring.length) {
      const sample = expiring.slice(0, 2).join(', ');
      const extra = expiring.length > 2 ? ` e mais ${expiring.length - 2}` : '';
      parts.push(`${expiring.length} ${expiring.length === 1 ? 'item vence' : 'itens vencem'} em breve (${sample}${extra})`);
    }
    if (expired.length) {
      parts.push(`${expired.length} ${expired.length === 1 ? 'item já venceu' : 'itens já venceram'}`);
    }
    return { title: 'Hora de usar o que você tem 🥕', body: parts.join(' · ') };
  }
}
