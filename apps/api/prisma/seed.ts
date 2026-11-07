import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { name: 'Laticínios', icon: '🥛', defaultShelfLifeDays: 10 },
  { name: 'Carnes', icon: '🥩', defaultShelfLifeDays: 4 },
  { name: 'Peixes e frutos do mar', icon: '🐟', defaultShelfLifeDays: 2 },
  { name: 'Frutas', icon: '🍎', defaultShelfLifeDays: 7 },
  { name: 'Verduras e legumes', icon: '🥬', defaultShelfLifeDays: 6 },
  { name: 'Padaria', icon: '🍞', defaultShelfLifeDays: 4 },
  { name: 'Ovos', icon: '🥚', defaultShelfLifeDays: 28 },
  { name: 'Grãos e cereais', icon: '🌾', defaultShelfLifeDays: 180 },
  { name: 'Enlatados e conservas', icon: '🥫', defaultShelfLifeDays: 365 },
  { name: 'Congelados', icon: '🧊', defaultShelfLifeDays: 90 },
  { name: 'Bebidas', icon: '🥤', defaultShelfLifeDays: 120 },
  { name: 'Molhos e temperos', icon: '🧂', defaultShelfLifeDays: 180 },
  { name: 'Outros', icon: '📦', defaultShelfLifeDays: null },
];

const recipes = [
  {
    title: 'Omelete de legumes',
    prepMinutes: 15,
    instructions:
      '1. Pique os legumes em cubos pequenos.\n2. Bata os ovos com sal e pimenta.\n3. Refogue os legumes por 3 minutos.\n4. Adicione os ovos e cozinhe em fogo baixo até firmar. Dobre e sirva.',
    ingredients: ['ovo', 'tomate', 'cebola', 'queijo'],
  },
  {
    title: 'Arroz de forno com frango e legumes',
    prepMinutes: 50,
    instructions:
      '1. Refogue o frango temperado com cebola e alho.\n2. Misture arroz cozido, legumes e queijo.\n3. Leve ao forno a 200°C por 25 minutos até dourar.',
    ingredients: ['frango', 'arroz', 'cenoura', 'cebola', 'queijo'],
  },
  {
    title: 'Vitamina de banana com leite',
    prepMinutes: 5,
    instructions: '1. Bata no liquidificador a banana, o leite e gelo.\n2. Adoce a gosto e sirva gelado.',
    ingredients: ['banana', 'leite'],
  },
  {
    title: 'Sopa de legumes',
    prepMinutes: 40,
    instructions:
      '1. Refogue cebola e alho.\n2. Adicione cenoura, batata e abobrinha em cubos.\n3. Cubra com água e cozinhe por 25 minutos.\n4. Bata parte da sopa para dar cremosidade.',
    ingredients: ['cenoura', 'batata', 'abobrinha', 'cebola', 'alho'],
  },
  {
    title: 'Pão perdido (rabanada assada)',
    prepMinutes: 30,
    instructions:
      '1. Misture leite, ovo e açúcar.\n2. Embeba fatias de pão amanhecido.\n3. Asse a 200°C por 15 minutos virando na metade. Finalize com canela.',
    ingredients: ['pao', 'leite', 'ovo'],
  },
  {
    title: 'Iogurte com frutas e granola',
    prepMinutes: 5,
    instructions: '1. Corte as frutas.\n2. Monte em camadas com iogurte e granola.',
    ingredients: ['iogurte', 'morango', 'banana', 'maca'],
  },
  {
    title: 'Macarrão ao molho de tomate caseiro',
    prepMinutes: 30,
    instructions:
      '1. Refogue alho e cebola.\n2. Adicione tomates picados e cozinhe até desmanchar.\n3. Misture ao macarrão cozido e finalize com manjericão.',
    ingredients: ['macarrao', 'tomate', 'cebola', 'alho'],
  },
  {
    title: 'Bolo de banana',
    prepMinutes: 55,
    instructions:
      '1. Amasse as bananas maduras.\n2. Misture com ovos, açúcar, óleo e farinha.\n3. Adicione fermento e asse a 180°C por 40 minutos.',
    ingredients: ['banana', 'ovo', 'farinha', 'acucar'],
  },
];

async function main() {
  // Categorias globais (userId = null)
  for (const c of categories) {
    const exists = await prisma.category.findFirst({ where: { userId: null, name: c.name } });
    if (!exists) await prisma.category.create({ data: { ...c, userId: null } });
  }

  // Receitas globais
  for (const r of recipes) {
    const exists = await prisma.recipe.findFirst({ where: { userId: null, title: r.title } });
    if (exists) continue;
    await prisma.recipe.create({
      data: {
        title: r.title,
        instructions: r.instructions,
        prepMinutes: r.prepMinutes,
        source: 'internal',
        ingredients: { create: r.ingredients.map((name) => ({ ingredientName: name })) },
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Seed concluído: ${categories.length} categorias, ${recipes.length} receitas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
