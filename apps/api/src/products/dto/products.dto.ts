import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const UNITS = ['un', 'kg', 'g', 'l', 'ml'] as const;
export const LOCATIONS = ['geladeira', 'freezer', 'armario'] as const;
export const STATUSES = ['active', 'consumed', 'discarded'] as const;

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  barcode?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  quantity?: number;

  @IsOptional()
  @IsIn(UNITS as unknown as string[])
  unit?: (typeof UNITS)[number];

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  /** Opcional: se omitido, usa purchaseDate/hoje + defaultShelfLifeDays da categoria. */
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsIn(LOCATIONS as unknown as string[])
  location?: (typeof LOCATIONS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  barcode?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  quantity?: number;

  @IsOptional()
  @IsIn(UNITS as unknown as string[])
  unit?: (typeof UNITS)[number];

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsIn(LOCATIONS as unknown as string[])
  location?: (typeof LOCATIONS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}

export class UpdateStatusDto {
  @IsIn(STATUSES as unknown as string[])
  status: (typeof STATUSES)[number];
}

export class ListProductsQueryDto {
  @IsOptional()
  @IsIn(STATUSES as unknown as string[])
  status?: (typeof STATUSES)[number];

  @IsOptional()
  @IsUUID()
  category?: string;

  @IsOptional()
  @IsIn(LOCATIONS as unknown as string[])
  location?: (typeof LOCATIONS)[number];

  /** Itens que vencem em até N dias (inclui já vencidos quando status=active). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(365)
  expiringIn?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['expiry_date', 'name', 'created_at'])
  sort?: 'expiry_date' | 'name' | 'created_at';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
