import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { CustomerApiModule } from './customer-api.module';
import { HttpExceptionFilter, AllExceptionsFilter, FileLoggerService } from '@libs/shared';

/**
 * Bootstrap de la aplicación Customer API
 */
async function bootstrap() {
  const app = await NestFactory.create(CustomerApiModule);

  // Obtener FileLoggerService del contenedor de la aplicación
  let fileLogger: FileLoggerService | undefined;
  try {
    fileLogger = app.get(FileLoggerService, { strict: false });
  } catch (error) {
    // Si no está disponible, continuar sin logging a archivo
    console.warn('FileLoggerService no disponible, usando logging en consola');
  }

  // Configuración de CORS
  app.enableCors({
    origin: [
      'http://localhost:4000', // Angular default
      'http://localhost:4003', // Angular alternative port
      'http://localhost:8080',
      'http://127.0.0.1:4000',
      'http://127.0.0.1:4003',
      'http://127.0.0.1:8080',
      ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : []),
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

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

  // Filtros globales de excepciones con FileLoggerService
  app.useGlobalFilters(new AllExceptionsFilter(fileLogger), new HttpExceptionFilter(fileLogger));

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Customer API')
    .setDescription('API para clientes del sistema')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa el token JWT obtenido del endpoint de login',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('customer/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = process.env.PORT || 3002;
  await app.listen(port);

  console.log(`🚀 Customer API running on: http://localhost:${port}/customer`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/customer/docs`);
}

bootstrap();
