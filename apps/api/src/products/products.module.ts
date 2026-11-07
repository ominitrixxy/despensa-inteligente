import { Module } from '@nestjs/common';
import { OpenFoodFactsService } from './open-food-facts.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, OpenFoodFactsService],
  exports: [ProductsService],
})
export class ProductsModule {}
