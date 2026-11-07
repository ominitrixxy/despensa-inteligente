import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { CreateProductDto, ListProductsQueryDto, UpdateProductDto, UpdateStatusDto } from './dto/products.dto';
import { OpenFoodFactsService } from './open-food-facts.service';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly products: ProductsService,
    private readonly openFoodFacts: OpenFoodFactsService,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListProductsQueryDto) {
    return this.products.list(user.id, query);
  }

  // Atenção: rota estática antes de ':id'
  @Get('barcode/:ean')
  barcode(@Param('ean') ean: string) {
    return this.openFoodFacts.lookup(ean);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProductDto) {
    return this.products.create(user.id, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.products.findOne(user.id, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(user.id, id, dto);
  }

  @Patch(':id/status')
  updateStatus(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStatusDto) {
    return this.products.updateStatus(user.id, id, dto.status);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.products.remove(user.id, id);
  }
}
