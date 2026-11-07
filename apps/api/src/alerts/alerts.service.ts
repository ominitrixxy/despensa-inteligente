import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string, unreadOnly = false) {
    return this.prisma.alert.findMany({
      where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { product: { select: { id: true, name: true, expiryDate: true, status: true } } },
    });
  }

  async markRead(userId: string, id: string) {
    const alert = await this.prisma.alert.findFirst({ where: { id, userId } });
    if (!alert) throw new NotFoundException('Alerta não encontrado');
    return this.prisma.alert.update({ where: { id }, data: { readAt: new Date() } });
  }
}
