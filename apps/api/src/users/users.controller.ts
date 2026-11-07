import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { RegisterDeviceDto, UpdateProfileDto } from './dto/users.dto';
import { UsersService } from './users.service';

@Controller('users/me')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  me(@CurrentUser() user: AuthUser) {
    return this.users.getProfile(user.id);
  }

  @Patch()
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }

  @Post('devices')
  registerDevice(@CurrentUser() user: AuthUser, @Body() dto: RegisterDeviceDto) {
    return this.users.registerDevice(user.id, dto);
  }

  @Delete('devices/:token')
  removeDevice(@CurrentUser() user: AuthUser, @Param('token') token: string) {
    return this.users.removeDevice(user.id, decodeURIComponent(token));
  }
}
