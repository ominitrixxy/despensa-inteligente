import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  notifyHour?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  notifyDaysBefore?: number;
}

export class RegisterDeviceDto {
  @IsString()
  token: string;

  @IsIn(['ios', 'android'])
  platform: 'ios' | 'android';
}
