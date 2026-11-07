import { Injectable, NotFoundException } from '@nestjs/common';
import { addDays, getLocalParts, normalizeName, ymdToUtcDate } from '../common/date.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecipeDto, RecipeIngredientDto, UpdateRecipeDto } from './dto/recipes.dto';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sugere receitas priorizando ingredientes que vencem primeiro.
   * Peso por urgência: <=3 dias (ou vencido) = 3, <=7 dias = 2, demais = 1.
   */
  async suggestions(userId: string, limit = 10) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } });
    const today = ymdToUtcDate(getLocalParts(user?.timezone ?? 'America/Sao_Paulo').ymd);

    const products = await this.prisma.product.findMany({
      where: { userId, status: 'active', expiryDate: { lte: addDays(today, 60) } },
      orderBy: { expiryDate: 'asc' },
      take: 50,
      select: { name: true, expiryDate: true },
    });
    if (!products.length) return [];

    const pantry = products.map((p) => ({
      name: normalizeName(p.name),
      weight: this.urgencyWeight(Math.floor((p.expiryDate.getTime() - today.getTime()) / MS_PER_DAY)),
    }));

    const recipes = await this.prisma.recipe.findMany({
      where: { OR: [{ userId: null }, { userId }] },
      include: { ingredients: true },
    });

    return recipes
      .map((recipe) => {
        const matched: string[] = [];
        const missing: string[] = [];
        let score = 0;
        for (const ing of recipe.ingredients) {
          const hit = pantry.find((p) => p.name.includes(ing.ingredientName) || ing.ingredientName.includes(p.name));
          if (hit) {
            matched.push(ing.ingredientName);
            score += hit.weight;
          } else {
            missing.push(ing.ingredientName);
          }
        }
        return {
          id: recipe.id,
          title: recipe.title,
          prepMinutes: recipe.prepMinutes,
          imageUrl: recipe.imageUrl,
          score,
          matchedIngredients: matched,
          missingIngredients: missing,
        };
      })
      .filter((r) => r.matchedIngredients.length > 0)
      .sort((a, b) => b.score - a.score || a.missingIngredients.length - b.missingIngredients.length)
      .slice(0, limit);
  }

  async findOne(userId: string, id: string) {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id, OR: [{ userId: null }, { userId }] },
      include: { ingredients: true },
    });
    if (!recipe) throw new NotFoundException('Receita não encontrada');
    return recipe;
  }

  create(userId: string, dto: CreateRecipeDto) {
    const { ingredients, ...rest } = dto;
    return this.prisma.recipe.create({
      data: { ...rest, userId, source: 'internal', ingredients: { create: this.mapIngredients(ingredients) } },
      include: { ingredients: true },
    });
  }

  async update(userId: string, id: string, dto: UpdateRecipeDto) {
    await this.ensureOwned(userId, id);
    const { ingredients, ...rest } = dto;
    return this.prisma.recipe.update({
      where: { id },
      data: {
        ...rest,
        ...(ingredients
          ? { ingredients: { deleteMany: {}, create: this.mapIngredients(ingredients) } }
          : {}),
      },
      include: { ingredients: true },
    });
  }

  async remove(userId: string, id: string) {
    await this.ensureOwned(userId, id);
    await this.prisma.recipe.delete({ where: { id } });
    return { success: true };
  }

  private async ensureOwned(userId: string, id: string) {
    const recipe = await this.prisma.recipe.findFirst({ where: { id, userId } });
    if (!recipe) throw new NotFoundException('Receita não encontrada (ou não é sua)');
  }

  private mapIngredients(list: RecipeIngredientDto[]) {
    return list.map((i) => ({ ingredientName: normalizeName(i.name), quantity: i.quantity, unit: i.unit }));
  }

  private urgencyWeight(daysLeft: number) {
    if (daysLeft <= 3) return 3;
    if (daysLeft <= 7) return 2;
    return 1;
  }
}
