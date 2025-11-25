import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { CustomerApiModule } from './customer-api.module';
import { HttpExceptionFilter, AllExceptionsFilter } from '@libs/shared';

/**
 * Bootstrap de la aplicación Customer API
 */
async function bootstrap() {
  const app = await NestFactory.create(CustomerApiModule);

  // Prefijo global para todas las rutas
  app.setGlobalPrefix('customer');

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
    .setTitle('Customer API')
    .setDescription('API para clientes del sistema')
    .setVersion('1.0')
    .addTag('Auth', 'Autenticación y registro')
    .addTag('Users', 'Gestión de perfil de usuario')
    .addTag('Orders', 'Gestión de pedidos del cliente')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('customer/docs', app, document);

  const port = process.env.PORT || 3002;
  await app.listen(port);

  console.log(`🚀 Customer API running on: http://localhost:${port}/customer`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/customer/docs`);
}

bootstrap();
