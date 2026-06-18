import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AppConfig } from './common/config/configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService);
  const appCfg = config.get<AppConfig>('app') as AppConfig;

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: appCfg.isProduction ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // CORS — allow-listed origins (apps + admin dashboard)
  app.enableCors({
    origin: appCfg.corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Versioned routing under /api/v1
  app.setGlobalPrefix(appCfg.globalPrefix);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Global validation + sanitization
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableShutdownHooks();

  // OpenAPI / Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Kaw Kaw API')
    .setDescription('Multi-service hyperlocal delivery platform — REST API (v1)')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer(appCfg.apiUrl)
    .addTag('auth')
    .addTag('users')
    .addTag('addresses')
    .addTag('categories')
    .addTag('products')
    .addTag('inventory')
    .addTag('orders')
    .addTag('parcels')
    .addTag('prescriptions')
    .addTag('riders')
    .addTag('notifications')
    .addTag('coupons')
    .addTag('settings')
    .addTag('admin')
    .addTag('audit')
    .addTag('health')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${appCfg.globalPrefix}/docs`, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(appCfg.port, '0.0.0.0');
  const logger = app.get(Logger);
  logger.log(
    `Kaw Kaw API running on port ${appCfg.port} — base /${appCfg.globalPrefix}/v1, docs at /${appCfg.globalPrefix}/docs`,
    'Bootstrap',
  );
}

void bootstrap();
