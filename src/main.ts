import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  /**
   * =========================================================
   * PREFIJO GLOBAL SOLO PARA API
   * ---------------------------------------------------------
   * Excluimos las rutas SSR públicas del frontend:
   * - /
   * - /login
   * - /admin
   * - /supervisor
   * - /vendor
   *
   * Así:
   * - la API sigue bajo /api/*
   * - las páginas SSR quedan en sus rutas normales
   * =========================================================
   */
  app.setGlobalPrefix('api', {
    exclude: [
      { path: '', method: RequestMethod.GET },
      { path: '/', method: RequestMethod.GET },
      { path: 'login', method: RequestMethod.GET },
      { path: 'admin', method: RequestMethod.GET },
      { path: 'supervisor', method: RequestMethod.GET },
      { path: 'vendor', method: RequestMethod.GET },
    ],
  });

  /**
   * =========================================================
   * VALIDACIÓN GLOBAL
   * =========================================================
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  /**
   * =========================================================
   * ASSETS ESTÁTICOS
   * ---------------------------------------------------------
   * Solo assets:
   * - /assets/css/*
   * - /assets/js/*
   * - /img/*
   * =========================================================
   */
  app.useStaticAssets(join(process.cwd(), 'public'));

  /**
   * =========================================================
   * VISTAS SSR
   * =========================================================
   */
  app.setBaseViewsDir(join(process.cwd(), 'src/views'));
  app.setViewEngine('hbs');

  await app.listen(process.env.PORT || 3000);
}
bootstrap();