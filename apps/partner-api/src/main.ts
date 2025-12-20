import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { PartnerApiModule } from './partner-api.module';
import { HttpExceptionFilter, AllExceptionsFilter } from '@libs/shared';

/**
 * Bootstrap de la aplicación Partner API
 */
async function bootstrap() {
  const app = await NestFactory.create(PartnerApiModule);

  // Configuración de CORS
  app.enableCors({
    origin: [
      'http://localhost:4000', // Angular default
      'http://localhost:8080',
      'http://127.0.0.1:4000',
      'http://127.0.0.1:8080',
      ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : []),
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  // Prefijo global para todas las rutas
  app.setGlobalPrefix('partner');

  // Validación global usando class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Filtros globales de excepciones
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Partner API')
    .setDescription('API para partners del sistema')
    .setVersion('1.0')
    .addTag('Orders', 'Gestión de pedidos')
    .addTag('Products', 'Gestión de productos')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('partner/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 Partner API running on: http://localhost:${port}/partner`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/partner/docs`);
}

bootstrap();
