import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  /**
   * =========================================================
   * PREFIJO GLOBAL DE API
   * =========================================================
   */
  app.setGlobalPrefix('api');

  /**
   * =========================================================
   * VALIDACIÓN GLOBAL
   * ---------------------------------------------------------
   * whitelist: elimina campos no definidos en los DTOs
   * forbidNonWhitelisted: lanza error si mandan campos extra
   * transform: transforma tipos cuando es posible
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
   * FRONTEND ESTÁTICO
   * ---------------------------------------------------------
   * Si no es ruta /api, servimos index.html
   * =========================================================
   */
  app.useStaticAssets(join(process.cwd(), 'public'));

  app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }

    return res.sendFile(join(process.cwd(), 'public', 'index.html'));
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();