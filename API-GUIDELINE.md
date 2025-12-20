# Guideline para Crear APIs con Documentación Swagger

Este documento proporciona una guía completa y genérica para crear nuevas APIs en el proyecto con documentación Swagger completa, incluyendo ejemplos en los datos y toda la información necesaria para importar la API desde el frontend.

## Tabla de Contenidos

1. [Estructura de Archivos](#estructura-de-archivos)
2. [Configuración de Swagger en main.ts](#configuración-de-swagger-en-maints)
3. [Documentación de Controladores](#documentación-de-controladores)
4. [Documentación de DTOs/Requests/Responses](#documentación-de-dtosrequestsresponses)
5. [Ejemplos Completos](#ejemplos-completos)
6. [Exportar/Importar desde Frontend](#exportarimportar-desde-frontend)
7. [Checklist de Implementación](#checklist-de-implementación)
8. [Mejores Prácticas](#mejores-prácticas)

---

## Estructura de Archivos

Para crear una nueva API, sigue esta estructura:

```
apps/
  └── [nombre-api]/
      └── src/
          ├── main.ts                    # Configuración de Swagger aquí
          ├── [nombre-api].module.ts     # Módulo principal
          ├── auth/                      # Autenticación (si aplica)
          │   ├── [nombre]-auth.controller.ts
          │   ├── [nombre]-auth.module.ts
          │   └── strategies/
          └── controllers/               # Controladores de la API
              └── [recurso].controller.ts
```

---

## Configuración de Swagger en main.ts

### Plantilla Base

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { [NombreApi]Module } from './[nombre-api].module';
import { HttpExceptionFilter, AllExceptionsFilter } from '@libs/shared';

/**
 * Bootstrap de la aplicación [Nombre] API
 */
async function bootstrap() {
  const app = await NestFactory.create([NombreApi]Module);

  // Prefijo global para todas las rutas
  app.setGlobalPrefix('[prefijo]');

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
    .setTitle('[Nombre] API')
    .setDescription('[Descripción detallada de la API]')
    .setVersion('1.0')
    .addTag('[Tag1]', '[Descripción del tag]')
    .addTag('[Tag2]', '[Descripción del tag]')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa el token JWT',
        in: 'header',
      },
      'JWT-auth', // Este nombre se usará en los controladores
    )
    .addServer('http://localhost:[puerto]', 'Servidor de desarrollo')
    .addServer('https://api.produccion.com', 'Servidor de producción')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('[prefijo]/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Mantiene el token en sesión
      tagsSorter: 'alpha', // Ordena tags alfabéticamente
      operationsSorter: 'alpha', // Ordena operaciones alfabéticamente
    },
  });

  const port = process.env.PORT || [puerto];
  await app.listen(port);

  console.log(`🚀 [Nombre] API running on: http://localhost:${port}/[prefijo]`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/[prefijo]/docs`);
  console.log(`📥 OpenAPI JSON: http://localhost:${port}/[prefijo]/docs-json`);
}

bootstrap();
```

### Ejemplo Real (Admin API)

```typescript
const config = new DocumentBuilder()
  .setTitle('Admin API')
  .setDescription('API para administración del sistema. Permite gestionar usuarios, roles y configuraciones del sistema.')
  .setVersion('1.0')
  .addTag('Users', 'Gestión de usuarios')
  .addTag('Auth', 'Autenticación y autorización')
  .addBearerAuth()
  .build();
```

---

## Documentación de Controladores

### Decoradores Principales

#### 1. `@ApiTags()` - Agrupar endpoints

```typescript
@ApiTags('Users')
@Controller('users')
export class UsersController {
  // ...
}
```

#### 2. `@ApiOperation()` - Descripción del endpoint

```typescript
@ApiOperation({
  summary: 'Crear un nuevo usuario',
  description: 'Crea un nuevo usuario en el sistema. Requiere permisos de administrador.'
})
```

#### 3. `@ApiResponse()` - Documentar respuestas

**Siempre documenta TODAS las respuestas posibles:**

```typescript
@ApiResponse({
  status: 201,
  description: 'Usuario creado exitosamente',
  type: CreateUserResponse,
  example: {
    id: 1,
    email: 'user@example.com',
    name: 'Jane Smith',
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '+1234567890',
    profile: { preferences: { language: 'es', notifications: true } },
    roles: ['CUSTOMER'],
    isActive: true,
    createdAt: '2024-01-15T10:30:00.000Z',
  },
})
@ApiResponse({
  status: 400,
  description: 'Datos de entrada inválidos',
  example: {
    statusCode: 400,
    message: [
      'email must be an email',
      'name should not be empty',
      'password must be longer than or equal to 6 characters'
    ],
    error: 'Bad Request',
  },
})
@ApiResponse({
  status: 401,
  description: 'No autenticado',
  example: {
    statusCode: 401,
    message: 'Unauthorized',
    error: 'Unauthorized',
  },
})
@ApiResponse({
  status: 403,
  description: 'No tiene permisos suficientes',
  example: {
    statusCode: 403,
    message: 'Forbidden resource',
    error: 'Forbidden',
  },
})
@ApiResponse({
  status: 409,
  description: 'El usuario ya existe',
  example: {
    statusCode: 409,
    message: 'El email ya está registrado',
    error: 'Conflict',
  },
})
```

#### 4. `@ApiBody()` - Documentar body del request

```typescript
@ApiBody({
  type: CreateUserRequest,
  description: 'Datos del usuario a crear',
  examples: {
    ejemplo1: {
      summary: 'Usuario básico',
      description: 'Ejemplo de creación de usuario con datos mínimos',
      value: {
        email: 'user@example.com',
        name: 'Jane Smith',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1234567890',
        password: 'SecurePass123!',
      },
    },
    ejemplo2: {
      summary: 'Usuario con roles y perfil',
      description: 'Ejemplo de creación de usuario con roles y preferencias',
      value: {
        email: 'premium@example.com',
        name: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        password: 'SecurePass123!',
        roles: ['CUSTOMER', 'PREMIUM'],
        profile: {
          preferences: {
            language: 'es',
            notifications: true,
            theme: 'dark',
          },
        },
      },
    },
  },
})
```

#### 5. `@ApiParam()` - Documentar parámetros de ruta

```typescript
@ApiParam({
  name: 'id',
  description: 'ID único del usuario',
  type: Number,
  example: 1,
  required: true,
})
```

#### 6. `@ApiQuery()` - Documentar query parameters

```typescript
@ApiQuery({
  name: 'page',
  required: false,
  type: Number,
  description: 'Número de página',
  example: 1,
})
@ApiQuery({
  name: 'limit',
  required: false,
  type: Number,
  description: 'Cantidad de elementos por página',
  example: 10,
})
@ApiQuery({
  name: 'search',
  required: false,
  type: String,
  description: 'Término de búsqueda',
  example: 'john',
})
```

#### 7. `@ApiBearerAuth()` - Autenticación requerida

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
```

### Ejemplo Completo de Controlador

```typescript
import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { CreateUserHandler, CreateUserRequest, CreateUserResponse } from '@libs/application';
import { JwtAuthGuard, RolesGuard, Roles } from '@libs/shared';

/**
 * Controlador de usuarios
 *
 * Endpoints disponibles:
 * - POST /users - Crear usuario (requiere ADMIN)
 * - GET /users/:id - Obtener usuario por ID (requiere ADMIN)
 */
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserHandler: CreateUserHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear un nuevo usuario',
    description: 'Crea un nuevo usuario en el sistema. Requiere permisos de administrador.'
  })
  @ApiBody({
    type: CreateUserRequest,
    description: 'Datos del usuario a crear',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado exitosamente',
    type: CreateUserResponse,
    example: {
      id: 1,
      email: 'user@example.com',
      name: 'Jane Smith',
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+1234567890',
      profile: { preferences: { language: 'es', notifications: true } },
      roles: ['CUSTOMER'],
      isActive: true,
      createdAt: '2024-01-15T10:30:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    example: {
      statusCode: 400,
      message: ['email must be an email'],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos de administrador',
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  async createUser(@Body() request: CreateUserRequest): Promise<CreateUserResponse> {
    return this.createUserHandler.execute(request);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil de usuario por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario',
    type: Number,
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil de usuario encontrado',
    type: GetUserProfileResponse,
    example: {
      id: 1,
      email: 'user@example.com',
      name: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      profile: { preferences: { language: 'es', theme: 'light' } },
      roles: ['CUSTOMER'],
      isActive: true,
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-20T14:45:00.000Z',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
    example: {
      statusCode: 404,
      message: 'Usuario no encontrado',
      error: 'Not Found',
    },
  })
  async getUserProfile(@Param('id', ParseIntPipe) id: number): Promise<GetUserProfileResponse> {
    const request = new GetUserProfileRequest();
    request.userId = id;
    return this.getUserProfileHandler.execute(request);
  }
}
```

---

## Documentación de DTOs/Requests/Responses

### Decorador `@ApiProperty()`

**Siempre incluye estos campos en cada propiedad:**

```typescript
@ApiProperty({
  description: '[Descripción clara de qué es el campo]',
  example: '[Ejemplo realista del valor]',
  type: [Tipo de dato], // String, Number, Boolean, Date, Array, etc.
  required: true/false, // Solo si es opcional
  nullable: true/false, // Si puede ser null
  minLength: [número], // Para strings
  maxLength: [número], // Para strings
  minimum: [número], // Para números
  maximum: [número], // Para números
  enum: [Enum], // Si es un enum
  isArray: true, // Si es un array
})
```

### Ejemplos por Tipo de Dato

#### String

```typescript
@ApiProperty({
  description: 'Email del usuario',
  example: 'user@example.com',
  type: String,
})
@IsEmail()
@IsNotEmpty()
email: string;
```

#### Number

```typescript
@ApiProperty({
  description: 'ID único del usuario',
  example: 1,
  type: Number,
  minimum: 1,
})
@IsNumber()
@IsNotEmpty()
id: number;
```

#### Boolean

```typescript
@ApiProperty({
  description: 'Indica si el usuario está activo',
  example: true,
  type: Boolean,
  default: true,
})
@IsBoolean()
isActive: boolean;
```

#### Date

```typescript
@ApiProperty({
  description: 'Fecha de creación del usuario',
  example: '2024-01-15T10:30:00.000Z',
  type: Date,
})
createdAt: Date;
```

#### Array

```typescript
@ApiProperty({
  description: 'Roles del usuario',
  example: ['CUSTOMER', 'PREMIUM'],
  type: [String],
  isArray: true,
})
@IsString({ each: true })
roles: string[];
```

#### Enum

```typescript
enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

@ApiProperty({
  description: 'Estado del usuario',
  example: UserStatus.ACTIVE,
  enum: UserStatus,
  enumName: 'UserStatus',
})
@IsEnum(UserStatus)
status: UserStatus;
```

#### Objeto/Record

```typescript
@ApiProperty({
  description: 'Perfil adicional del usuario (objeto JSON)',
  example: {
    preferences: {
      language: 'es',
      notifications: true,
      theme: 'dark',
    },
    metadata: {
      lastLogin: '2024-01-20T14:45:00.000Z',
    },
  },
  type: Object,
  required: false,
  nullable: true,
})
@IsObject()
@IsOptional()
profile?: Record<string, any>;
```

#### Opcional

```typescript
@ApiProperty({
  description: 'Teléfono del usuario',
  example: '+1234567890',
  required: false,
})
@IsString()
@IsOptional()
phone?: string;
```

### Ejemplo Completo de Request DTO

```typescript
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsObject, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para crear un usuario
 */
export class CreateUserRequest {
  @ApiProperty({
    description: 'Email del usuario (debe ser único)',
    example: 'user@example.com',
    type: String,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Jane Smith',
    type: String,
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Jane',
    type: String,
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  firstName: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Smith',
    type: String,
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastName: string;

  @ApiProperty({
    description: 'Teléfono del usuario en formato internacional',
    example: '+1234567890',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Contraseña del usuario (mínimo 6 caracteres)',
    example: 'SecurePass123!',
    type: String,
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Roles del usuario',
    example: ['CUSTOMER'],
    type: [String],
    isArray: true,
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  roles?: string[];

  @ApiProperty({
    description: 'Perfil adicional del usuario (objeto JSON)',
    example: {
      preferences: {
        language: 'es',
        notifications: true,
        theme: 'light',
      },
    },
    type: Object,
    required: false,
    nullable: true,
  })
  @IsObject()
  @IsOptional()
  profile?: Record<string, any>;
}
```

### Ejemplo Completo de Response DTO

```typescript
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para crear un usuario
 */
export class CreateUserResponse {
  @ApiProperty({
    description: 'ID único del usuario creado',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'user@example.com',
    type: String,
  })
  email: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Jane Smith',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Jane',
    type: String,
  })
  firstName: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Smith',
    type: String,
  })
  lastName: string;

  @ApiProperty({
    description: 'Teléfono del usuario',
    example: '+1234567890',
    type: String,
    nullable: true,
  })
  phone: string | null;

  @ApiProperty({
    description: 'Perfil adicional del usuario',
    example: {
      preferences: {
        language: 'es',
        notifications: true,
      },
    },
    type: Object,
    nullable: true,
  })
  profile: Record<string, any> | null;

  @ApiProperty({
    description: 'Roles del usuario',
    example: ['CUSTOMER'],
    type: [String],
    isArray: true,
  })
  roles: string[];

  @ApiProperty({
    description: 'Indica si el usuario está activo',
    example: true,
    type: Boolean,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Fecha de creación del usuario',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  createdAt: Date;

  constructor(
    id: number,
    email: string,
    name: string,
    firstName: string,
    lastName: string,
    phone: string | null,
    profile: Record<string, any> | null,
    roles: string[],
    isActive: boolean,
    createdAt: Date,
  ) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.profile = profile;
    this.roles = roles;
    this.isActive = isActive;
    this.createdAt = createdAt;
  }
}
```

---

## Exportar/Importar desde Frontend

### URLs de Documentación

Una vez configurado Swagger, las siguientes URLs estarán disponibles:

- **Swagger UI**: `http://localhost:[puerto]/[prefijo]/docs`
- **OpenAPI JSON**: `http://localhost:[puerto]/[prefijo]/docs-json`
- **OpenAPI YAML**: `http://localhost:[puerto]/[prefijo]/docs-yaml`

### Configuración para Exportar

Agrega estas opciones en `main.ts` para facilitar la exportación:

```typescript
const document = SwaggerModule.createDocument(app, config);

// Opciones adicionales para mejor exportación
SwaggerModule.setup('[prefijo]/docs', app, document, {
  swaggerOptions: {
    persistAuthorization: true,
    tagsSorter: 'alpha',
    operationsSorter: 'alpha',
    docExpansion: 'none', // 'none', 'list', 'full'
    filter: true, // Permite filtrar endpoints
    showRequestDuration: true, // Muestra duración de requests
  },
  customSiteTitle: '[Nombre] API Documentation',
  customfavIcon: '/favicon.ico',
  customCss: '.swagger-ui .topbar { display: none }', // Ocultar topbar si quieres
});
```

### Información para el Frontend

Incluye esta información en la descripción de la API:

```typescript
.setDescription(`
API para [descripción].

## Información para Frontend

- **Base URL**: \`http://localhost:[puerto]/[prefijo]\`
- **OpenAPI JSON**: \`http://localhost:[puerto]/[prefijo]/docs-json\`
- **OpenAPI YAML**: \`http://localhost:[puerto]/[prefijo]/docs-yaml\`

### Autenticación

Esta API utiliza JWT Bearer Token. Para autenticarte:

1. Obtén un token mediante el endpoint \`POST /auth/login\`
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
- **OpenAPI Generator**: \`openapi-generator-cli generate -i http://localhost:[puerto]/[prefijo]/docs-json -g typescript-axios -o ./src/api\`
- **Swagger Codegen**: Similar proceso
- **Postman**: Importar desde la URL del JSON
`)
```

### Ejemplo de Configuración Completa para Frontend

```typescript
const config = new DocumentBuilder()
  .setTitle('[Nombre] API')
  .setDescription(`
    API para [descripción detallada].

    ## Información para Desarrollo Frontend

    - **Base URL Desarrollo**: \`http://localhost:3000/[prefijo]\`
    - **Base URL Producción**: \`https://api.produccion.com/[prefijo]\`
    - **OpenAPI JSON**: \`http://localhost:3000/[prefijo]/docs-json\`

    ### Generar Cliente TypeScript

    \`\`\`bash
    # Instalar OpenAPI Generator
    npm install -g @openapitools/openapi-generator-cli

    # Generar cliente TypeScript
    openapi-generator-cli generate \\
      -i http://localhost:3000/[prefijo]/docs-json \\
      -g typescript-axios \\
      -o ./src/api/[nombre-api] \\
      --additional-properties=supportsES6=true,withInterfaces=true
    \`\`\`
  `)
  .setVersion('1.0')
  .addTag('Users', 'Gestión de usuarios')
  .addTag('Auth', 'Autenticación y autorización')
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
  .addServer('http://localhost:3000', 'Servidor de desarrollo')
  .addServer('https://api.produccion.com', 'Servidor de producción')
  .build();
```

---

## Checklist de Implementación

### Antes de Crear la API

- [ ] Definir el nombre y propósito de la API
- [ ] Definir el prefijo de rutas (ej: `admin`, `customer`, `partner`)
- [ ] Definir el puerto (si es diferente al estándar)
- [ ] Listar todos los endpoints que tendrá
- [ ] Definir los tags de Swagger

### Configuración Inicial

- [ ] Crear estructura de carpetas
- [ ] Crear `main.ts` con configuración de Swagger
- [ ] Configurar `DocumentBuilder` con título, descripción y versión
- [ ] Agregar todos los tags necesarios
- [ ] Configurar autenticación Bearer si aplica
- [ ] Agregar servidores (desarrollo y producción)
- [ ] Configurar `SwaggerModule.setup()` con opciones

### Controladores

- [ ] Agregar `@ApiTags()` a cada controlador
- [ ] Agregar `@ApiOperation()` a cada endpoint con summary y description
- [ ] Agregar `@ApiResponse()` para TODAS las respuestas posibles (200, 201, 400, 401, 403, 404, 409, 500)
- [ ] Incluir ejemplos realistas en cada `@ApiResponse()`
- [ ] Agregar `@ApiBody()` con ejemplos si el endpoint recibe body
- [ ] Agregar `@ApiParam()` para parámetros de ruta
- [ ] Agregar `@ApiQuery()` para query parameters
- [ ] Agregar `@ApiBearerAuth()` si requiere autenticación
- [ ] Documentar en comentarios JSDoc el propósito del controlador

### DTOs/Requests/Responses

- [ ] Agregar `@ApiProperty()` a TODAS las propiedades
- [ ] Incluir `description` en cada `@ApiProperty()`
- [ ] Incluir `example` realista en cada `@ApiProperty()`
- [ ] Especificar `type` explícitamente
- [ ] Marcar `required: false` si es opcional
- [ ] Marcar `nullable: true` si puede ser null
- [ ] Agregar validaciones con `class-validator` (IsEmail, IsNotEmpty, etc.)
- [ ] Agregar constraints (minLength, maxLength, minimum, maximum)
- [ ] Documentar en comentarios JSDoc el propósito del DTO

### Validación y Ejemplos

- [ ] Verificar que todos los ejemplos sean realistas y consistentes
- [ ] Verificar que los ejemplos coincidan con las validaciones
- [ ] Probar que Swagger UI muestre correctamente todos los ejemplos
- [ ] Verificar que los códigos de estado estén documentados
- [ ] Verificar que los mensajes de error sean claros

### Documentación para Frontend

- [ ] Incluir URLs de OpenAPI JSON/YAML en la descripción
- [ ] Incluir instrucciones de autenticación
- [ ] Incluir lista de códigos de estado
- [ ] Incluir instrucciones para generar cliente (si aplica)
- [ ] Verificar que la URL `/docs-json` funcione correctamente

### Testing

- [ ] Probar todos los endpoints desde Swagger UI
- [ ] Verificar que los ejemplos funcionen correctamente
- [ ] Verificar que la autenticación funcione en Swagger UI
- [ ] Exportar OpenAPI JSON y verificar que sea válido
- [ ] Probar importar el JSON en Postman/Insomnia

---

## Mejores Prácticas

### 1. Ejemplos Realistas

✅ **Bueno:**
```typescript
@ApiProperty({
  description: 'Email del usuario',
  example: 'jane.smith@example.com',
})
```

❌ **Malo:**
```typescript
@ApiProperty({
  description: 'Email',
  example: 'email',
})
```

### 2. Descripciones Claras

✅ **Bueno:**
```typescript
@ApiProperty({
  description: 'Teléfono del usuario en formato internacional (E.164)',
  example: '+1234567890',
})
```

❌ **Malo:**
```typescript
@ApiProperty({
  description: 'Teléfono',
  example: '123',
})
```

### 3. Documentar Todas las Respuestas

✅ **Bueno:**
```typescript
@ApiResponse({ status: 200, ... })
@ApiResponse({ status: 400, ... })
@ApiResponse({ status: 401, ... })
@ApiResponse({ status: 403, ... })
@ApiResponse({ status: 404, ... })
```

❌ **Malo:**
```typescript
@ApiResponse({ status: 200, ... })
// Solo documenta el éxito
```

### 4. Consistencia en Ejemplos

✅ **Bueno:** Usar el mismo usuario de ejemplo en todos los endpoints relacionados
```typescript
// En CreateUserResponse
example: { id: 1, email: 'user@example.com', name: 'Jane Smith' }

// En GetUserProfileResponse
example: { id: 1, email: 'user@example.com', name: 'Jane Smith' }
```

❌ **Malo:** Usar diferentes usuarios en cada endpoint

### 5. Tipos Explícitos

✅ **Bueno:**
```typescript
@ApiProperty({
  type: [String],
  isArray: true,
})
roles: string[];
```

❌ **Malo:**
```typescript
@ApiProperty()
roles: string[]; // Swagger puede inferir mal el tipo
```

### 6. Validaciones Consistentes

✅ **Bueno:** Las validaciones en `@ApiProperty()` deben coincidir con `class-validator`
```typescript
@ApiProperty({
  minLength: 6,
  maxLength: 50,
})
@MinLength(6)
@MaxLength(50)
password: string;
```

### 7. Documentar Opcionales Correctamente

✅ **Bueno:**
```typescript
@ApiProperty({
  description: 'Teléfono del usuario',
  example: '+1234567890',
  required: false,
})
@IsOptional()
phone?: string;
```

### 8. Fechas en Formato ISO

✅ **Bueno:**
```typescript
@ApiProperty({
  description: 'Fecha de creación',
  example: '2024-01-15T10:30:00.000Z',
  type: Date,
})
createdAt: Date;
```

### 9. Enums Documentados

✅ **Bueno:**
```typescript
@ApiProperty({
  description: 'Estado del usuario',
  example: UserStatus.ACTIVE,
  enum: UserStatus,
  enumName: 'UserStatus',
})
@IsEnum(UserStatus)
status: UserStatus;
```

### 10. Objetos Complejos con Ejemplos Detallados

✅ **Bueno:**
```typescript
@ApiProperty({
  description: 'Perfil adicional del usuario',
  example: {
    preferences: {
      language: 'es',
      notifications: true,
      theme: 'dark',
    },
    metadata: {
      lastLogin: '2024-01-20T14:45:00.000Z',
    },
  },
  type: Object,
})
```

---

## Plantillas Rápidas

### Plantilla de Controlador POST

```typescript
@Post()
@HttpCode(HttpStatus.CREATED)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
@ApiOperation({
  summary: '[Resumen del endpoint]',
  description: '[Descripción detallada]'
})
@ApiBody({ type: [RequestDTO] })
@ApiResponse({
  status: 201,
  description: '[Descripción de éxito]',
  type: [ResponseDTO],
  example: { /* ejemplo completo */ },
})
@ApiResponse({
  status: 400,
  description: 'Datos de entrada inválidos',
  example: { statusCode: 400, message: [], error: 'Bad Request' },
})
@ApiResponse({
  status: 401,
  description: 'No autenticado',
  example: { statusCode: 401, message: 'Unauthorized', error: 'Unauthorized' },
})
@ApiResponse({
  status: 403,
  description: 'Sin permisos',
  example: { statusCode: 403, message: 'Forbidden resource', error: 'Forbidden' },
})
async create(@Body() request: [RequestDTO]): Promise<[ResponseDTO]> {
  return this.[handler].execute(request);
}
```

### Plantilla de Controlador GET con Parámetro

```typescript
@Get(':id')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: '[Resumen]' })
@ApiParam({
  name: 'id',
  description: '[Descripción del parámetro]',
  type: Number,
  example: 1
})
@ApiResponse({
  status: 200,
  description: '[Descripción de éxito]',
  type: [ResponseDTO],
  example: { /* ejemplo completo */ },
})
@ApiResponse({
  status: 404,
  description: '[Recurso] no encontrado',
  example: { statusCode: 404, message: '[Mensaje]', error: 'Not Found' },
})
async getById(@Param('id', ParseIntPipe) id: number): Promise<[ResponseDTO]> {
  // implementación
}
```

### Plantilla de DTO Request

```typescript
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class [Nombre]Request {
  @ApiProperty({
    description: '[Descripción]',
    example: '[Ejemplo]',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  campo: string;
}
```

### Plantilla de DTO Response

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class [Nombre]Response {
  @ApiProperty({
    description: '[Descripción]',
    example: '[Ejemplo]',
    type: Number,
  })
  id: number;

  // ... más campos
}
```

---

## Recursos Adicionales

- [NestJS Swagger Documentation](https://docs.nestjs.com/openapi/introduction)
- [OpenAPI Specification](https://swagger.io/specification/)
- [OpenAPI Generator](https://openapi-generator.tech/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)

---

## Notas Finales

- **Siempre** documenta todos los endpoints antes de considerar la API completa
- **Siempre** incluye ejemplos realistas y consistentes
- **Siempre** documenta todas las respuestas posibles (éxito y errores)
- **Verifica** que la documentación sea útil para desarrolladores frontend
- **Mantén** la consistencia entre diferentes APIs del proyecto
- **Actualiza** la documentación cuando cambies los endpoints

---

**Última actualización:** 2024-01-20
**Versión del guideline:** 1.0

