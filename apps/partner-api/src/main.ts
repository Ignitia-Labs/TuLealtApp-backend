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
      'http://localhost:4001', // Partner frontend
      'http://localhost:8080',
      'http://127.0.0.1:4000',
      'http://127.0.0.1:4001', // Partner frontend
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
    .setDescription(
      `API para partners del sistema. Permite gestionar operaciones y consultar información del sistema.

## Información para Frontend

- **Base URL Desarrollo**: \`http://localhost:3001/partner\`
- **Base URL Producción**: \`https://api.produccion.com/partner\`
- **OpenAPI JSON**: \`http://localhost:3001/partner/docs-json\`
- **OpenAPI YAML**: \`http://localhost:3001/partner/docs-yaml\`

### Autenticación

Esta API utiliza JWT Bearer Token. Para autenticarte:

1. Obtén un token mediante el endpoint \`POST /partner/auth/login\`
2. Incluye el token en el header: \`Authorization: Bearer <token>\`

### Códigos de Estado

- \`200\` - Éxito
- \`201\` - Creado exitosamente
- \`400\` - Error de validación
- \`401\` - No autenticado
- \`403\` - Sin permisos
- \`404\` - No encontrado
- \`409\` - Conflicto (recurso duplicado)
- \`500\` - Error del servidor

### Importar en Frontend

Puedes usar herramientas como:
- **OpenAPI Generator**: \`openapi-generator-cli generate -i http://localhost:3001/partner/docs-json -g typescript-axios -o ./src/api/partner\`
- **Swagger Codegen**: Similar proceso
- **Postman**: Importar desde la URL del JSON`,
    )
    .setVersion('1.0')
    .addTag('Partner', 'Información y gestión del partner autenticado')
    .addTag('Partner Pricing', 'Consulta de planes de precios')
    .addTag('Partner Profiles', 'Gestión de perfiles del partner')
    .addTag('Partner User Profiles', 'Gestión de asignación de perfiles a usuarios')
    .addTag('Partner Users', 'Gestión de usuarios del partner (PARTNER y PARTNER_STAFF)')
    .addTag('Partner User Permissions', 'Consulta de permisos de usuarios del partner')
    .addTag('Partner Catalogs', 'Consulta de catálogos del sistema')
    .addTag('Partner Rewards', 'Gestión de recompensas de los tenants del partner')
    .addTag('Partner Customers', 'Gestión de customers del partner')
    .addTag('Partner Customer Tiers', 'Gestión de tiers de customers')
    .addTag('Partner Points Rules', 'Gestión de reglas de puntos')
    .addTag('Branches', 'Gestión de branches de los tenants')
    .addTag('Tenants', 'Gestión de tenants del partner')
    .addTag('Currencies & Countries', 'Consulta de monedas y países')
    .addTag('Rate Exchange', 'Consulta de tasas de cambio')
    .addTag('Contact Inquiry', 'Gestión de consultas de contacto')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa el token JWT obtenido del endpoint de login',
        in: 'header',
      },
      'JWT-auth', // Este nombre se usará en los controladores
    )
    .addServer('http://localhost:3001', 'Servidor de desarrollo')
    .addServer('https://api.produccion.com', 'Servidor de producción')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('partner/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Mantiene el token en sesión
      tagsSorter: 'alpha', // Ordena tags alfabéticamente
      operationsSorter: 'alpha', // Ordena operaciones alfabéticamente
    },
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 Partner API running on: http://localhost:${port}/partner`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/partner/docs`);
  console.log(`📥 OpenAPI JSON: http://localhost:${port}/partner/docs-json`);
}

bootstrap();
