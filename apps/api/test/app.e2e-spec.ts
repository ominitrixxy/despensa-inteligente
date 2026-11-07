import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * E2E: precisa de Postgres e Redis rodando (docker compose up -d) e DATABASE_URL apontando para um banco migrado.
 * Fluxo: registrar -> login -> criar produto -> listar por validade -> consumir -> estatísticas.
 */
describe('Despensa Inteligente (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const email = `e2e-${Date.now()}@teste.dev`;
  let accessToken: string;
  let productId: string;

  beforeAll(async () => {
    process.env.RUN_SCHEDULER = 'false';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('GET /health é público', async () => {
    await request(app.getHttpServer()).get('/api/v1/health').expect(200);
  });

  it('bloqueia rotas protegidas sem token', async () => {
    await request(app.getHttpServer()).get('/api/v1/products').expect(401);
  });

  it('registra e autentica o usuário', async () => {
    const reg = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ name: 'Teste E2E', email, password: 'senha-segura-123' })
      .expect(201);
    expect(reg.body.accessToken).toBeDefined();

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'senha-segura-123' })
      .expect(200);
    accessToken = login.body.accessToken;
  });

  it('cria um produto que vence amanhã', async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const res = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Iogurte natural', quantity: 2, unit: 'un', expiryDate: tomorrow, location: 'geladeira' })
      .expect(201);
    productId = res.body.id;
    expect(res.body.name).toBe('Iogurte natural');
  });

  it('lista produtos que vencem em até 3 dias', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/products?expiringIn=3&sort=expiry_date')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0].id).toBe(productId);
  });

  it('força o cron e gera alerta', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/notifications/run')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);
    expect(res.body.alertsCreated).toBeGreaterThanOrEqual(1);

    // idempotência: segunda execução não cria alertas duplicados
    const again = await request(app.getHttpServer())
      .post('/api/v1/notifications/run')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);
    expect(again.body.alertsCreated).toBe(0);
  });

  it('marca como consumido e reflete nas estatísticas', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/products/${productId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'consumed' })
      .expect(200);

    const stats = await request(app.getHttpServer())
      .get('/api/v1/stats/waste')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(stats.body.consumed).toBe(1);
    expect(stats.body.wasteRate).toBe(0);
  });
});
