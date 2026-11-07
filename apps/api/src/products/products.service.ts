import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { addDays, getLocalParts, ymdToUtcDate } from '../common/date.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, ListProductsQueryDto, UpdateProductDto } from './dto/products.dto';

type ProductWithCategory = Prisma.ProductGetPayload<{ include: { category: true } }>;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, query: ListProductsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    const where: Prisma.ProductWhereInput = {
      userId,
      status: query.status ?? 'active',
      ...(query.category ? { categoryId: query.category } : {}),
      ...(query.location ? { location: query.location } : {}),
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
    };

    if (query.expiringIn !== undefined) {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } });
      const today = ymdToUtcDate(getLocalParts(user?.timezone ?? 'America/Sao_Paulo').ymd);
      where.expiryDate = { lte: addDays(today, query.expiringIn) };
    }

    const sortField = { expiry_date: 'expiryDate', name: 'name', created_at: 'createdAt' }[query.sort ?? 'expiry_date'];
    const orderBy = { [sortField]: query.order ?? 'asc' } as Prisma.ProductOrderByWithRelationInput;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { category: true },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data: items.map((p) => this.serialize(p)), meta: { page, limit, total } };
  }

  async create(userId: string, dto: CreateProductDto) {
    let categoryShelfLife: number | null = null;
    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, OR: [{ userId: null }, { userId }] },
      });
      if (!category) throw new BadRequestException('Categoria inválida');
      categoryShelfLife = category.defaultShelfLifeDays;
    }

    let expiry: Date;
    if (dto.expiryDate) {
      expiry = this.toDateOnly(dto.expiryDate);
    } else if (categoryShelfLife) {
      const base = dto.purchaseDate ? this.toDateOnly(dto.purchaseDate) : await this.todayFor(userId);
      expiry = addDays(base, categoryShelfLife);
    } else {
      throw new BadRequestException('Informe expiryDate ou uma categoria com validade padrão');
    }

    const product = await this.prisma.product.create({
      data: {
        userId,
        name: dto.name.trim(),
        brand: dto.brand,
        barcode: dto.barcode,
        categoryId: dto.categoryId,
        quantity: dto.quantity ?? 1,
        unit: dto.unit ?? 'un',
        purchaseDate: dto.purchaseDate ? this.toDateOnly(dto.purchaseDate) : undefined,
        expiryDate: expiry,
        location: dto.location ?? 'armario',
        notes: dto.notes,
        imageUrl: dto.imageUrl,
      },
      include: { category: true },
    });
    return this.serialize(product);
  }

  async findOne(userId: string, id: string) {
    const product = await this.prisma.product.findFirst({ where: { id, userId }, include: { category: true } });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return this.serialize(product);
  }

  async update(userId: string, id: string, dto: UpdateProductDto) {
    await this.findOne(userId, id);
    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, OR: [{ userId: null }, { userId }] },
      });
      if (!category) throw new BadRequestException('Categoria inválida');
    }
    const { purchaseDate, expiryDate, ...rest } = dto;
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...rest,
        ...(purchaseDate ? { purchaseDate: this.toDateOnly(purchaseDate) } : {}),
        ...(expiryDate ? { expiryDate: this.toDateOnly(expiryDate) } : {}),
      },
      include: { category: true },
    });
    return this.serialize(product);
  }

  async updateStatus(userId: string, id: string, status: 'active' | 'consumed' | 'discarded') {
    await this.findOne(userId, id);
    const product = await this.prisma.product.update({
      where: { id },
      data: { status },
      include: { category: true },
    });
    return this.serialize(product);
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.product.delete({ where: { id } });
    return { success: true };
  }

  private async todayFor(userId: string): Promise<Date> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } });
    return ymdToUtcDate(getLocalParts(user?.timezone ?? 'America/Sao_Paulo').ymd);
  }

  /** Aceita 'YYYY-MM-DD' ou ISO completo e devolve Date UTC à meia-noite do dia informado. */
  private toDateOnly(value: string): Date {
    return ymdToUtcDate(value.slice(0, 10));
  }

  private serialize(p: ProductWithCategory) {
    return { ...p, quantity: Number(p.quantity) };
  }
}
