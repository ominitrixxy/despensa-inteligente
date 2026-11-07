import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Consumidos x descartados nos últimos N dias (por updatedAt, que muda quando o status muda). */
  async waste(userId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [consumed, discarded, active] = await Promise.all([
      this.prisma.product.count({ where: { userId, status: 'consumed', updatedAt: { gte: since } } }),
      this.prisma.product.count({ where: { userId, status: 'discarded', updatedAt: { gte: since } } }),
      this.prisma.product.count({ where: { userId, status: 'active' } }),
    ]);

    const closed = consumed + discarded;
    return {
      periodDays: days,
      consumed,
      discarded,
      active,
      wasteRate: closed === 0 ? 0 : Number((discarded / closed).toFixed(4)),
    };
  }
}
