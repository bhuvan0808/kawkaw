import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { UserRole } from '../src/common/enums';
import { PrismaService } from '../src/prisma/prisma.service';
import { TokenService } from '../src/modules/auth/token.service';

export interface TestContext {
  app: INestApplication;
  prisma: PrismaService;
  tokens: TokenService;
}

/** Boots the Nest app with the same global config as production bootstrap. */
export async function createTestApp(): Promise<TestContext> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.init();
  return { app, prisma: app.get(PrismaService), tokens: app.get(TokenService) };
}

/** Removes all rows from the (isolated) test schema in FK-safe order. */
export async function resetDb(prisma: PrismaService): Promise<void> {
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.prescriptionUpload.deleteMany();
  await prisma.order.deleteMany();
  await prisma.parcelOrder.deleteMany();
  await prisma.riderLocation.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.rider.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
}

export async function accessTokenFor(
  ctx: TestContext,
  user: { id: string; phone: string; role: UserRole },
): Promise<string> {
  const issued = await ctx.tokens.issueTokens(user);
  return issued.accessToken;
}
