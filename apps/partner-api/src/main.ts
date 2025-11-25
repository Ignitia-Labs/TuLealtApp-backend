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
