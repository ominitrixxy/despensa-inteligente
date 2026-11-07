import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDeviceDto, UpdateProfileDto } from './dto/users.dto';

const PROFILE_SELECT = {
  id: true,
  name: true,
  email: true,
  timezone: true,
  notifyHour: true,
  notifyDaysBefore: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: PROFILE_SELECT });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({ where: { id: userId }, data: dto, select: PROFILE_SELECT });
  }

  async registerDevice(userId: string, dto: RegisterDeviceDto) {
    // Um token pertence a um único usuário: se trocar de conta no mesmo aparelho, reatribui.
    return this.prisma.deviceToken.upsert({
      where: { token: dto.token },
      create: { userId, token: dto.token, platform: dto.platform },
      update: { userId, platform: dto.platform, lastSeenAt: new Date() },
    });
  }

  async removeDevice(userId: string, token: string) {
    await this.prisma.deviceToken.deleteMany({ where: { userId, token } });
    return { success: true };
  }
}
