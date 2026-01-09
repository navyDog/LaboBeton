import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Sécurité (Helmet)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"], 
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // Préfixe API global
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:8080', process.env.FRONTEND_URL || ''],
    credentials: true,
  });

  // Validation globale (DTOs)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = process.env.PORT || 8080;
  // Écoute explicite sur 0.0.0.0 pour Docker
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Serveur NestJS démarré sur le port ${port}`);
}
bootstrap();