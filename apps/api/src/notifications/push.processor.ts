import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { PushJobData } from './notifications.service';

@Processor('push')
export class PushProcessor extends WorkerHost {
  private readonly logger = new Logger(PushProcessor.name);
  private readonly expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN || undefined });

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<PushJobData>) {
    const { userId, alertIds, title, body } = job.data;

    const devices = await this.prisma.deviceToken.findMany({ where: { userId } });
    const invalidFormat = devices.filter((d) => !Expo.isExpoPushToken(d.token)).map((d) => d.token);
    if (invalidFormat.length) {
      await this.prisma.deviceToken.deleteMany({ where: { token: { in: invalidFormat } } });
    }
    const valid = devices.filter((d) => Expo.isExpoPushToken(d.token));
    if (!valid.length) return { sent: 0 };

    const messages: ExpoPushMessage[] = valid.map((d) => ({
      to: d.token,
      sound: 'default',
      title,
      body,
      data: { type: 'expiry', alertIds },
    }));

    let sent = 0;
    const deadTokens: string[] = [];

    for (const chunk of this.expo.chunkPushNotifications(messages)) {
      const tickets = await this.expo.sendPushNotificationsAsync(chunk);
      tickets.forEach((ticket, idx) => {
        if (ticket.status === 'ok') {
          sent++;
        } else if (ticket.details?.error === 'DeviceNotRegistered') {
          deadTokens.push(String(chunk[idx].to));
        } else {
          this.logger.warn(`Falha no push para usuário ${userId}: ${ticket.message}`);
        }
      });
    }

    if (deadTokens.length) {
      await this.prisma.deviceToken.deleteMany({ where: { token: { in: deadTokens } } });
    }
    if (sent > 0) {
      await this.prisma.alert.updateMany({ where: { id: { in: alertIds } }, data: { sentAt: new Date() } });
    } else if (!deadTokens.length) {
      // Nenhum envio e nenhum token morto = erro transitório: deixa o BullMQ fazer retry.
      throw new Error('Push não enviado; nova tentativa será agendada');
    }

    return { sent, removed: deadTokens.length };
  }
}
