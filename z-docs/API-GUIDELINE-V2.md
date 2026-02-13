# Guía para Crear APIs con Documentación Swagger v2

Esta es la versión mejorada y ampliada de la guía para crear APIs en el proyecto TuLealtApp Backend con documentación Swagger completa, mejores prácticas de seguridad, performance y escalabilidad.

## 📋 Tabla de Contenidos

1. [Estructura de Archivos](#estructura-de-archivos)
2. [Configuración de Swagger](#configuración-de-swagger)
3. [Versionado de APIs](#versionado-de-apis)
4. [Documentación de Controladores](#documentación-de-controladores)
5. [Documentación de DTOs](#documentación-de-dtos)
6. [Paginación, Filtrado y Ordenamiento](#paginación-filtrado-y-ordenamiento)
7. [Manejo de Archivos](#manejo-de-archivos)
8. [Rate Limiting y Throttling](#rate-limiting-y-throttling)
9. [Webhooks y Callbacks](#webhooks-y-callbacks)
10. [Seguridad (CORS, CSRF, XSS)](#seguridad)
11. [Exportar para Frontend](#exportar-para-frontend)
12. [Checklist de Implementación](#checklist-de-implementación)
13. [Mejores Prácticas](#mejores-prácticas)

---

## 📁 Estructura de Archivos

### Estructura Recomendada

```
apps/
  └── [nombre-api]/
      └── src/
          ├── main.ts                    # Bootstrap + Swagger config
          ├── [nombre-api].module.ts     # Módulo principal
          ├── auth/                      # Autenticación
          │   ├── [nombre]-auth.controller.ts
          │   ├── [nombre]-auth.module.ts
          │   └── strategies/
          │       └── [nombre]-jwt.strategy.ts
          ├── controllers/               # Controladores REST
          │   ├── v1/                    # Versión 1 de la API
          │   │   ├── users.controller.ts
          │   │   └── orders.controller.ts
          │   └── v2/                    # Versión 2 (si aplica)
          │       └── users.controller.ts
          ├── guards/                    # Guards específicos de la API
          ├── decorators/                # Decoradores custom
          └── interceptors/              # Interceptors específicos
```

---

## 🔧 Configuración de Swagger

### Plantilla Base Mejorada

```typescript
// apps/[nombre-api]/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { [NombreApi]Module } from './[nombre-api].module';
import { HttpExceptionFilter, AllExceptionsFilter } from '@libs/shared';

async function bootstrap() {
  const app = await NestFactory.create([NombreApi]Module);

  // Prefijo global para todas las rutas
  app.setGlobalPrefix('[prefijo]/api');

  // Habilitar versionado de API
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Filtros globales
  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new HttpExceptionFilter(),
  );

  // CORS configuration
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://app.tudominio.com', 'https://partner.tudominio.com']
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('[Nombre] API')
    .setDescription(`
# [Nombre] API Documentation

Esta API permite [descripción del propósito].

## Autenticación

Esta API utiliza JWT Bearer Token. Para obtener un token:

1. Haz POST a \`/auth/login\` con email y password
2. Copia el \`accessToken\` de la respuesta
3. Haz clic en "Authorize" (candado verde arriba)
4. Pega el token (sin "Bearer ")
5. Haz clic en "Authorize"

## Rate Limiting

- **Límite**: 100 requests por minuto por IP
- **Headers de respuesta**:
  - \`X-RateLimit-Limit\`: Límite total
  - \`X-RateLimit-Remaining\`: Requests restantes
  - \`X-RateLimit-Reset\`: Timestamp de reset

## Versionado

Esta API usa versionado en la URL: \`/api/v1/...\`, \`/api/v2/...\`

## Códigos de Estado

- \`200\` - OK (éxito)
- \`201\` - Created (recurso creado)
- \`204\` - No Content (éxito sin contenido)
- \`400\` - Bad Request (datos inválidos)
- \`401\` - Unauthorized (no autenticado)
- \`403\` - Forbidden (sin permisos)
- \`404\` - Not Found (recurso no encontrado)
- \`409\` - Conflict (conflicto, ej: email duplicado)
- \`422\` - Unprocessable Entity (validación de negocio)
- \`429\` - Too Many Requests (rate limit excedido)
- \`500\` - Internal Server Error (error del servidor)

## Paginación

Los endpoints de listado soportan paginación:

\`\`\`
GET /users?page=1&limit=10
\`\`\`

Respuesta incluye metadata:
\`\`\`json
{
  "data": [...],
  "metadata": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
\`\`\`

## Filtrado y Búsqueda

Usa query parameters para filtrar:

\`\`\`
GET /users?search=john&isActive=true&roles=ADMIN
\`\`\`

## Ordenamiento

Usa \`sortBy\` y \`sortOrder\`:

\`\`\`
GET /users?sortBy=createdAt&sortOrder=DESC
\`\`\`
    `)
    .setVersion('1.0')
    .addTag('Auth', 'Autenticación y autorización')
    .addTag('Users', 'Gestión de usuarios')
    .addTag('Orders', 'Gestión de órdenes')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa el token JWT obtenido del endpoint /auth/login',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer('http://localhost:[puerto]', 'Desarrollo')
    .addServer('https://api-staging.tudominio.com', 'Staging')
    .addServer('https://api.tudominio.com', 'Producción')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('[prefijo]/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      syntaxHighlight: {
        activate: true,
        theme: 'monokai',
      },
    },
    customSiteTitle: '[Nombre] API - Documentation',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0 }
    `,
  });

  const port = process.env.PORT || [puerto];
  await app.listen(port);

  console.log(`🚀 [Nombre] API running on: http://localhost:${port}/[prefijo]/api`);
  console.log(`📚 Swagger docs: http://localhost:${port}/[prefijo]/docs`);
  console.log(`📥 OpenAPI JSON: http://localhost:${port}/[prefijo]/docs-json`);
}

bootstrap();
```

---

## 🔢 Versionado de APIs

### ¿Por qué versionar?

- ✅ Cambios breaking sin afectar clientes existentes
- ✅ Migración gradual de clientes
- ✅ Experimentación con nuevas features

### Estrategias de Versionado

#### 1. URI Versioning (Recomendado)

```typescript
// main.ts
app.enableVersioning({
  type: VersioningType.URI,
  defaultVersion: '1',
});

// Controller v1
@Controller({
  path: 'users',
  version: '1',
})
export class UsersV1Controller {
  @Get(':id')
  getUserV1(@Param('id') id: number) {
    // Implementación v1
  }
}

// Controller v2
@Controller({
  path: 'users',
  version: '2',
})
export class UsersV2Controller {
  @Get(':id')
  getUserV2(@Param('id') id: number) {
    // Implementación v2 con nuevos campos
  }
}

// URLs resultantes:
// GET /api/v1/users/1
// GET /api/v2/users/1
```

#### 2. Header Versioning

```typescript
app.enableVersioning({
  type: VersioningType.HEADER,
  header: 'X-API-Version',
});

// Cliente debe enviar header:
// X-API-Version: 1
```

#### 3. Media Type Versioning

```typescript
app.enableVersioning({
  type: VersioningType.MEDIA_TYPE,
  key: 'v=',
});

// Cliente debe enviar header:
// Accept: application/json;v=1
```

### Deprecación de Versiones

```typescript
@ApiDeprecated() // ← Marca como deprecated en Swagger
@Controller({
  path: 'users',
  version: '1',
})
export class UsersV1Controller {
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener usuario (DEPRECATED)',
    description: `
      ⚠️ Este endpoint está DEPRECADO y será removido el 2024-12-31.
      
      Por favor migrar a v2:
      - GET /api/v2/users/:id
      
      Cambios en v2:
      - Campo \`fullName\` dividido en \`firstName\` y \`lastName\`
      - Nuevo campo \`avatar\`
    `,
  })
  @ApiHeader({
    name: 'X-Deprecated-Warning',
    description: 'Este endpoint está deprecated',
  })
  getUserV1(@Param('id') id: number) {
    // Agregar header de warning
    // response.setHeader('X-Deprecated-Warning', 'This endpoint is deprecated. Use v2.');
  }
}
```

---

## 📝 Documentación de Controladores

### Decoradores Principales

#### @ApiTags()

```typescript
@ApiTags('Users') // ← Agrupa endpoints en Swagger
@Controller('users')
export class UsersController {}
```

#### @ApiOperation()

```typescript
@ApiOperation({
  summary: 'Crear un nuevo usuario',
  description: `
    Crea un nuevo usuario en el sistema.
    
    **Requiere:**
    - Rol ADMIN
    - Email único
    - Contraseña de al menos 6 caracteres
    
    **Efecto:**
    - Crea usuario en BD
    - Envía email de bienvenida (asíncrono)
    - Registra en audit log
  `,
})
```

#### @ApiResponse() - Documentar TODAS las respuestas

```typescript
@ApiResponse({
  status: 201,
  description: 'Usuario creado exitosamente',
  type: CreateUserResponse,
  example: {
    id: 1,
    email: 'user@example.com',
    name: 'Jane Smith',
    createdAt: '2024-01-15T10:30:00.000Z',
  },
})
@ApiResponse({
  status: 400,
  description: 'Datos de entrada inválidos',
  example: {
    statusCode: 400,
    message: ['email must be an email', 'name should not be empty'],
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
  description: 'Sin permisos de administrador',
  example: {
    statusCode: 403,
    message: 'Forbidden resource',
    error: 'Forbidden',
  },
})
@ApiResponse({
  status: 409,
  description: 'El email ya está registrado',
  example: {
    statusCode: 409,
    message: 'User with email user@example.com already exists',
    error: 'Conflict',
  },
})
@ApiResponse({
  status: 429,
  description: 'Rate limit excedido',
  example: {
    statusCode: 429,
    message: 'Too many requests',
    error: 'Too Many Requests',
  },
})
@ApiResponse({
  status: 500,
  description: 'Error interno del servidor',
  example: {
    statusCode: 500,
    message: 'Internal server error',
    error: 'Internal Server Error',
  },
})
```

#### @ApiBody()

```typescript
@ApiBody({
  type: CreateUserRequest,
  description: 'Datos del usuario a crear',
  examples: {
    usuarioBasico: {
      summary: 'Usuario básico',
      description: 'Usuario con datos mínimos requeridos',
      value: {
        email: 'user@example.com',
        name: 'Jane Smith',
        firstName: 'Jane',
        lastName: 'Smith',
        password: 'SecurePass123!',
      },
    },
    usuarioCompleto: {
      summary: 'Usuario completo',
      description: 'Usuario con todos los campos opcionales',
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

#### @ApiParam() - Parámetros de ruta

```typescript
@ApiParam({
  name: 'id',
  description: 'ID único del usuario',
  type: Number,
  example: 1,
  required: true,
})
@Get(':id')
async getUserById(@Param('id', ParseIntPipe) id: number) {}
```

#### @ApiQuery() - Query parameters

```typescript
@ApiQuery({
  name: 'page',
  required: false,
  type: Number,
  description: 'Número de página (default: 1)',
  example: 1,
})
@ApiQuery({
  name: 'limit',
  required: false,
  type: Number,
  description: 'Elementos por página (default: 10, max: 100)',
  example: 10,
})
@ApiQuery({
  name: 'search',
  required: false,
  type: String,
  description: 'Término de búsqueda (busca en email, name)',
  example: 'john',
})
@ApiQuery({
  name: 'sortBy',
  required: false,
  enum: ['createdAt', 'name', 'email'],
  description: 'Campo por el cual ordenar',
  example: 'createdAt',
})
@ApiQuery({
  name: 'sortOrder',
  required: false,
  enum: ['ASC', 'DESC'],
  description: 'Dirección del ordenamiento',
  example: 'DESC',
})
@Get()
async getUsers(
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  @Query('search') search?: string,
  @Query('sortBy') sortBy?: string,
  @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
) {}
```

---

## 📦 Documentación de DTOs

### Decorador @ApiProperty()

**Siempre incluye:**
- `description`: Qué es el campo
- `example`: Ejemplo realista
- `type`: Tipo de dato explícito
- Constraints opcionales: `required`, `nullable`, `minLength`, etc.

### Tipos de Datos

#### String

```typescript
@ApiProperty({
  description: 'Email del usuario (debe ser único)',
  example: 'user@example.com',
  type: String,
  format: 'email',
  minLength: 5,
  maxLength: 255,
})
@IsEmail()
@IsNotEmpty()
email: string;
```

#### Number

```typescript
@ApiProperty({
  description: 'Edad del usuario',
  example: 25,
  type: Number,
  minimum: 18,
  maximum: 120,
})
@IsNumber()
@Min(18)
@Max(120)
age: number;
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
@IsOptional()
isActive?: boolean = true;
```

#### Date

```typescript
@ApiProperty({
  description: 'Fecha de nacimiento',
  example: '1990-01-15T00:00:00.000Z',
  type: Date,
  format: 'date-time',
})
@IsDate()
@Type(() => Date)
birthDate: Date;
```

#### Array de Primitivos

```typescript
@ApiProperty({
  description: 'Roles del usuario',
  example: ['CUSTOMER', 'PREMIUM'],
  type: [String],
  isArray: true,
})
@IsArray()
@IsString({ each: true })
roles: string[];
```

#### Array de Objetos (DTOs)

**⚠️ IMPORTANTE para Orval/OpenAPI Generator:**

```typescript
// ✅ CORRECTO
@ApiProperty({
  description: 'Lista de direcciones del usuario',
  type: AddressDto,  // ← Clase directamente
  isArray: true,      // ← isArray: true
  example: [
    {
      street: '123 Main St',
      city: 'New York',
      zipCode: '10001',
    },
  ],
})
addresses: AddressDto[];

// ❌ INCORRECTO - Causa error en Orval
@ApiProperty({
  type: [AddressDto],  // ❌ NO usar [ClassName]
  isArray: true,
})
addresses: AddressDto[];

// ❌ INCORRECTO - Falta items
@ApiProperty({
  type: Array,  // ❌ Array genérico sin items
  isArray: true,
})
addresses: AddressDto[];
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

#### Record/Object

```typescript
@ApiProperty({
  description: 'Preferencias del usuario (JSON flexible)',
  example: {
    language: 'es',
    notifications: true,
    theme: 'dark',
  },
  type: 'object',
  additionalProperties: true,
})
@IsObject()
@IsOptional()
preferences?: Record<string, any>;
```

#### Nested DTO

```typescript
class AddressDto {
  @ApiProperty({ example: '123 Main St' })
  street: string;

  @ApiProperty({ example: 'New York' })
  city: string;
}

class UserDto {
  @ApiProperty({
    description: 'Dirección del usuario',
    type: AddressDto,
  })
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}
```

---

## 📄 Paginación, Filtrado y Ordenamiento

### Patrón de Paginación Estándar

#### Query DTO

```typescript
// libs/shared/src/dtos/pagination.dto.ts
import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Número de página',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Elementos por página',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Campo por el cual ordenar',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Dirección del ordenamiento',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({
    description: 'Término de búsqueda',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
```

#### Response DTO

```typescript
// libs/shared/src/dtos/paginated-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetadata {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 10 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPrevPage: boolean;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true })
  data: T[];

  @ApiProperty({ type: PaginationMetadata })
  metadata: PaginationMetadata;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    
    const totalPages = Math.ceil(total / limit);
    
    this.metadata = {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }
}
```

#### Uso en Controller

```typescript
@Get()
@ApiOperation({ summary: 'Listar usuarios con paginación' })
@ApiResponse({
  status: 200,
  description: 'Lista de usuarios',
  type: PaginatedResponseDto<GetUserResponse>,
  example: {
    data: [
      {
        id: 1,
        email: 'user1@example.com',
        name: 'User One',
      },
      {
        id: 2,
        email: 'user2@example.com',
        name: 'User Two',
      },
    ],
    metadata: {
      page: 1,
      limit: 10,
      total: 100,
      totalPages: 10,
      hasNextPage: true,
      hasPrevPage: false,
    },
  },
})
async getUsers(
  @Query() query: PaginationQueryDto,
): Promise<PaginatedResponseDto<GetUserResponse>> {
  const { data, total } = await this.getUsersHandler.execute(query);
  
  return new PaginatedResponseDto(
    data,
    total,
    query.page,
    query.limit,
  );
}
```

### Filtrado Avanzado

```typescript
export class UserFiltersDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar por estado activo',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar por roles',
    example: ['CUSTOMER', 'ADMIN'],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];

  @ApiPropertyOptional({
    description: 'Fecha de creación desde',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdFrom?: Date;

  @ApiPropertyOptional({
    description: 'Fecha de creación hasta',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdTo?: Date;
}
```

---

## 📤 Manejo de Archivos

### Upload de Archivos

#### Controller

```typescript
import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';

@Controller('upload')
export class UploadController {
  // Upload de archivo único
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Archivo de imagen para avatar',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Avatar subido exitosamente',
    example: {
      url: 'https://s3.amazonaws.com/bucket/avatars/123.jpg',
      filename: '123.jpg',
      size: 45678,
    },
  })
  async uploadAvatar(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.uploadService.uploadAvatar(file);
  }

  // Upload de múltiples archivos
  @Post('documents')
  @UseInterceptors(FilesInterceptor('files', 10)) // Máximo 10 archivos
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Múltiples documentos',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  async uploadDocuments(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB por archivo
          new FileTypeValidator({ fileType: /(pdf|doc|docx)$/ }),
        ],
      }),
    )
    files: Express.Multer.File[],
  ) {
    return this.uploadService.uploadDocuments(files);
  }

  // Upload con campos adicionales
  @Post('profile')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Perfil con avatar',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john@example.com' },
        avatar: { type: 'string', format: 'binary' },
      },
    },
  })
  async uploadProfile(
    @Body() profileData: UpdateProfileDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    return this.profileService.update(profileData, avatar);
  }
}
```

#### Custom File Validator

```typescript
// libs/shared/src/validators/custom-file.validator.ts
import { FileValidator } from '@nestjs/common';

export class CustomFileValidator extends FileValidator {
  constructor(
    private readonly options: {
      maxSize?: number;
      allowedTypes?: string[];
      allowedExtensions?: string[];
    },
  ) {
    super({});
  }

  isValid(file: Express.Multer.File): boolean {
    // Validar tamaño
    if (this.options.maxSize && file.size > this.options.maxSize) {
      return false;
    }

    // Validar MIME type
    if (
      this.options.allowedTypes &&
      !this.options.allowedTypes.includes(file.mimetype)
    ) {
      return false;
    }

    // Validar extensión
    if (this.options.allowedExtensions) {
      const ext = file.originalname.split('.').pop()?.toLowerCase();
      if (!ext || !this.options.allowedExtensions.includes(ext)) {
        return false;
      }
    }

    return true;
  }

  buildErrorMessage(): string {
    return `File validation failed. Max size: ${this.options.maxSize}, Allowed types: ${this.options.allowedTypes?.join(', ')}`;
  }
}
```

### Download de Archivos

```typescript
import { StreamableFile } from '@nestjs/common';
import { createReadStream } from 'fs';
import { join } from 'path';

@Controller('download')
export class DownloadController {
  @Get('document/:id')
  @ApiOperation({ summary: 'Descargar documento' })
  @ApiParam({ name: 'id', description: 'ID del documento' })
  @ApiResponse({
    status: 200,
    description: 'Archivo descargado',
    content: {
      'application/pdf': {},
    },
  })
  async downloadDocument(
    @Param('id') id: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const document = await this.documentService.findById(id);
    
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const file = createReadStream(join(process.cwd(), document.filePath));

    res.set({
      'Content-Type': document.mimeType,
      'Content-Disposition': `attachment; filename="${document.filename}"`,
    });

    return new StreamableFile(file);
  }

  // Generar y descargar PDF
  @Get('invoice/:id/pdf')
  @ApiOperation({ summary: 'Generar y descargar invoice en PDF' })
  async downloadInvoicePDF(
    @Param('id') id: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const pdfBuffer = await this.invoiceService.generatePDF(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    return new StreamableFile(pdfBuffer);
  }
}
```

---

## 🚦 Rate Limiting y Throttling

### Configuración Global

```typescript
// main.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60, // 60 segundos
      limit: 100, // 100 requests
    }),
  ],
})
export class AppModule {}
```

### Rate Limiting por Endpoint

```typescript
import { Throttle, SkipThrottle } from '@nestjs/throttler';

@Controller('users')
export class UsersController {
  // Usar rate limit global (100 req/min)
  @Get()
  async getUsers() {}

  // Override: 10 req/min para este endpoint específico
  @Post()
  @Throttle(10, 60)
  @ApiOperation({
    summary: 'Crear usuario',
    description: 'Rate limit: 10 requests por minuto',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests',
    example: {
      statusCode: 429,
      message: 'ThrottlerException: Too Many Requests',
    },
  })
  async createUser() {}

  // Skip rate limiting para este endpoint
  @Get('health')
  @SkipThrottle()
  async healthCheck() {}

  // Rate limit por rol
  @Post('admin-action')
  @Throttle(50, 60) // 50 req/min para admins
  @Roles('ADMIN')
  async adminAction() {}
}
```

### Custom Throttler Guard

```typescript
// libs/shared/src/guards/custom-throttler.guard.ts
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Throttle por usuario autenticado (en lugar de IP)
    if (req.user && req.user.id) {
      return `user-${req.user.id}`;
    }

    // Fallback a IP
    return req.ip;
  }

  protected getErrorMessage(): string {
    return 'Too many requests. Please try again later.';
  }
}

// Uso
@UseGuards(CustomThrottlerGuard)
@Controller('protected')
export class ProtectedController {}
```

### Respuesta con Headers de Rate Limit

```typescript
// libs/shared/src/interceptors/rate-limit-header.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class RateLimitHeaderInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      tap(() => {
        // Agregar headers informativos
        response.setHeader('X-RateLimit-Limit', '100');
        response.setHeader('X-RateLimit-Remaining', '95');
        response.setHeader('X-RateLimit-Reset', Date.now() + 60000);
      }),
    );
  }
}

// Uso global
app.useGlobalInterceptors(new RateLimitHeaderInterceptor());
```

---

## 🔗 Webhooks y Callbacks

### Recibir Webhooks (de servicios externos)

```typescript
@Controller('webhooks')
export class WebhooksController {
  // Webhook de Stripe
  @Post('stripe')
  @ApiExcludeEndpoint() // ← No mostrar en Swagger (interno)
  @HttpCode(200)
  async stripeWebhook(
    @Body() payload: any,
    @Headers('stripe-signature') signature: string,
  ) {
    // 1. Verificar firma
    const isValid = await this.stripeService.verifySignature(
      payload,
      signature,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid signature');
    }

    // 2. Procesar evento
    switch (payload.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(payload.data.object);
        break;
      case 'payment_intent.failed':
        await this.handlePaymentFailure(payload.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${payload.type}`);
    }

    // 3. Responder 200 (Stripe requiere respuesta rápida)
    return { received: true };
  }

  // Webhook genérico con validación de token
  @Post('generic')
  @ApiOperation({ summary: 'Endpoint para webhooks externos' })
  @ApiHeader({
    name: 'X-Webhook-Token',
    description: 'Token de autenticación del webhook',
    required: true,
  })
  @ApiBody({
    description: 'Payload del webhook',
    examples: {
      orderCreated: {
        summary: 'Orden creada',
        value: {
          event: 'order.created',
          data: {
            orderId: 123,
            amount: 100.50,
          },
        },
      },
    },
  })
  async receiveWebhook(
    @Body() payload: any,
    @Headers('x-webhook-token') token: string,
  ) {
    // Validar token
    if (token !== process.env.WEBHOOK_SECRET_TOKEN) {
      throw new UnauthorizedException('Invalid webhook token');
    }

    // Procesar de forma asíncrona (no bloquear respuesta)
    this.eventEmitter.emit('webhook.received', payload);

    return { status: 'received' };
  }
}
```

### Enviar Webhooks (a clientes)

```typescript
// libs/application/src/webhooks/webhook-sender.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class WebhookSenderService {
  private readonly logger = new Logger(WebhookSenderService.name);

  constructor(private readonly httpService: HttpService) {}

  async sendWebhook(
    url: string,
    event: string,
    data: any,
    secret: string,
  ): Promise<boolean> {
    try {
      // 1. Crear payload
      const payload = {
        event,
        data,
        timestamp: Date.now(),
      };

      // 2. Generar firma HMAC
      const signature = this.generateSignature(payload, secret);

      // 3. Enviar request
      const response = await firstValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': event,
          },
          timeout: 5000, // 5 segundos
        }),
      );

      if (response.status === 200) {
        this.logger.log(`Webhook sent successfully to ${url}`);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Failed to send webhook to ${url}:`, error.message);
      
      // TODO: Guardar en cola de reintentos
      await this.saveForRetry(url, event, data, secret);
      
      return false;
    }
  }

  private generateSignature(payload: any, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  private async saveForRetry(
    url: string,
    event: string,
    data: any,
    secret: string,
  ): Promise<void> {
    // Guardar en BD para reintentar después
    // Implementar con estrategia de exponential backoff
  }
}

// Uso en handler
@Injectable()
export class ProcessOrderHandler {
  constructor(
    private readonly webhookSender: WebhookSenderService,
  ) {}

  async execute(request: ProcessOrderRequest) {
    // Procesar orden
    const order = await this.orderRepository.save(/* ... */);

    // Enviar webhook al cliente
    await this.webhookSender.sendWebhook(
      'https://cliente.com/webhooks',
      'order.processed',
      {
        orderId: order.id,
        status: order.status,
        amount: order.amount,
      },
      'cliente-webhook-secret',
    );

    return order;
  }
}
```

---

## 🔒 Seguridad

### CORS (Cross-Origin Resource Sharing)

```typescript
// main.ts
app.enableCors({
  origin: (origin, callback) => {
    // Permitir orígenes específicos en producción
    const allowedOrigins = [
      'https://app.tudominio.com',
      'https://partner.tudominio.com',
      'https://admin.tudominio.com',
    ];

    if (process.env.NODE_ENV === 'development') {
      // Permitir todos en desarrollo
      callback(null, true);
    } else if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Permitir cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  maxAge: 3600, // Cache preflight por 1 hora
});
```

### CSRF Protection

```typescript
// main.ts
import * as csurf from 'csurf';

app.use(csurf({ cookie: true }));

// Endpoint para obtener CSRF token
@Controller('csrf')
export class CsrfController {
  @Get('token')
  @ApiOperation({ summary: 'Obtener CSRF token' })
  @ApiResponse({
    status: 200,
    example: { csrfToken: 'abc123...' },
  })
  getCsrfToken(@Req() req: Request) {
    return { csrfToken: req.csrfToken() };
  }
}

// Cliente debe enviar token en header o body:
// Header: X-CSRF-Token: abc123...
// Body: _csrf: abc123...
```

### Helmet (Security Headers)

```typescript
// main.ts
import helmet from 'helmet';

app.use(helmet());

// O con configuración custom
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);
```

### Input Sanitization (XSS Prevention)

```typescript
// libs/shared/src/pipes/sanitize.pipe.ts
import { PipeTransform, Injectable } from '@nestjs/common';
import * as sanitizeHtml from 'sanitize-html';

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any) {
    if (typeof value === 'string') {
      return sanitizeHtml(value, {
        allowedTags: [], // No permitir HTML
        allowedAttributes: {},
      });
    }

    if (typeof value === 'object') {
      return this.sanitizeObject(value);
    }

    return value;
  }

  private sanitizeObject(obj: any): any {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeHtml(value, {
          allowedTags: [],
          allowedAttributes: {},
        });
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

// Uso
@Post()
async create(@Body(SanitizePipe) data: CreateUserDto) {
  // data está sanitizado
}
```

### SQL Injection Prevention

**TypeORM ya previene SQL injection automáticamente:**

```typescript
// ✅ SEGURO - TypeORM escapa automáticamente
const user = await this.userRepository.findOne({
  where: { email: userInput },
});

// ✅ SEGURO - Parámetros parametrizados
const users = await this.userRepository
  .createQueryBuilder('user')
  .where('user.email = :email', { email: userInput })
  .getMany();

// ❌ PELIGROSO - Raw query sin escapar
const users = await this.userRepository.query(
  `SELECT * FROM users WHERE email = '${userInput}'` // ⚠️ VULNERABLE
);

// ✅ SEGURO - Raw query con parámetros
const users = await this.userRepository.query(
  `SELECT * FROM users WHERE email = ?`,
  [userInput]
);
```

### API Key Authentication

```typescript
// libs/shared/src/guards/api-key.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key is missing');
    }

    // Validar API key (desde BD o variables de entorno)
    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];

    if (!validApiKeys.includes(apiKey)) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}

// Uso
@Controller('public-api')
@UseGuards(ApiKeyGuard)
@ApiHeader({
  name: 'X-API-Key',
  description: 'API key para autenticación',
  required: true,
})
export class PublicApiController {
  @Get('data')
  async getData() {
    // Endpoint protegido por API key
  }
}
```

---

## 📤 Exportar para Frontend

### URLs de Documentación

Una vez configurado Swagger:

- **Swagger UI**: `http://localhost:[puerto]/[prefijo]/docs`
- **OpenAPI JSON**: `http://localhost:[puerto]/[prefijo]/docs-json`
- **OpenAPI YAML**: `http://localhost:[puerto]/[prefijo]/docs-yaml`

### Generar Cliente TypeScript con Orval

**1. Instalar Orval:**

```bash
npm install --save-dev orval
```

**2. Crear configuración:**

```javascript
// orval.config.js
module.exports = {
  tulealtapp: {
    input: 'http://localhost:3000/admin/docs-json',
    output: {
      target: './src/api/generated/admin-api.ts',
      client: 'axios',
      mode: 'tags-split',
      mock: false,
      override: {
        mutator: {
          path: './src/api/custom-axios.ts',
          name: 'customAxios',
        },
      },
    },
  },
};
```

**3. Custom Axios (con interceptors):**

```typescript
// src/api/custom-axios.ts
import Axios, { AxiosRequestConfig } from 'axios';

export const AXIOS_INSTANCE = Axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
});

// Interceptor para agregar token
AXIOS_INSTANCE.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores
AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirigir a login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export const customAxios = <T>(config: AxiosRequestConfig): Promise<T> => {
  const source = Axios.CancelToken.source();
  const promise = AXIOS_INSTANCE({
    ...config,
    cancelToken: source.token,
  }).then(({ data }) => data);

  // @ts-ignore
  promise.cancel = () => {
    source.cancel('Query was cancelled');
  };

  return promise;
};
```

**4. Generar código:**

```bash
npx orval
```

**5. Usar en componentes:**

```typescript
// src/components/UsersList.tsx
import { useQuery } from '@tanstack/react-query';
import { getUsers } from './api/generated/admin-api';

function UsersList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', { page: 1, limit: 10 }],
    queryFn: () => getUsers({ page: 1, limit: 10 }),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.data.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

---

## ✅ Checklist de Implementación

### Antes de Crear la API

- [ ] Definir nombre y propósito
- [ ] Definir prefijo de rutas
- [ ] Definir puerto (si es diferente)
- [ ] Listar todos los endpoints
- [ ] Definir tags de Swagger
- [ ] Definir estrategia de versionado

### Configuración Inicial

- [ ] Crear estructura de carpetas
- [ ] Crear `main.ts` con Swagger
- [ ] Configurar CORS
- [ ] Configurar rate limiting
- [ ] Agregar helmet para security headers
- [ ] Configurar versionado
- [ ] Agregar todos los tags
- [ ] Configurar autenticación Bearer
- [ ] Agregar servidores (dev, staging, prod)

### Controladores

- [ ] Agregar `@ApiTags()` a cada controlador
- [ ] Agregar `@ApiOperation()` con summary y description
- [ ] Agregar `@ApiResponse()` para TODAS las respuestas
- [ ] Incluir ejemplos realistas en cada `@ApiResponse()`
- [ ] Agregar `@ApiBody()` con ejemplos
- [ ] Agregar `@ApiParam()` para parámetros de ruta
- [ ] Agregar `@ApiQuery()` para query parameters
- [ ] Agregar `@ApiBearerAuth()` si requiere auth
- [ ] Documentar rate limits por endpoint
- [ ] Documentar en comentarios JSDoc

### DTOs

- [ ] Agregar `@ApiProperty()` a TODAS las propiedades
- [ ] Incluir `description` y `example` en cada propiedad
- [ ] Especificar `type` explícitamente
- [ ] Marcar `required: false` si es opcional
- [ ] Agregar validaciones con class-validator
- [ ] Para arrays de objetos: usar `type: Clase` + `isArray: true`
- [ ] Documentar constraints (min, max, length)
- [ ] Crear DTOs separados para paginación

### Seguridad

- [ ] Configurar CORS correctamente
- [ ] Agregar helmet para security headers
- [ ] Implementar rate limiting
- [ ] Validar y sanitizar inputs
- [ ] Usar parámetros parametrizados en queries
- [ ] Implementar CSRF protection (si aplica)
- [ ] Validar file uploads (tipo, tamaño)
- [ ] Validar webhooks con firmas

### Testing

- [ ] Probar todos los endpoints desde Swagger UI
- [ ] Verificar que ejemplos funcionen
- [ ] Verificar autenticación en Swagger UI
- [ ] Exportar OpenAPI JSON y validar
- [ ] Probar importar en Postman/Insomnia
- [ ] Generar cliente con Orval y probar
- [ ] Testing de rate limits
- [ ] Testing de file uploads

---

## 🎯 Mejores Prácticas

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

### 2. Documentar Todas las Respuestas

✅ **Bueno:** Documentar 200, 400, 401, 403, 404, 409, 429, 500

❌ **Malo:** Solo documentar 200

### 3. Consistencia en Naming

- Usar `camelCase` para propiedades de DTOs
- Usar `PascalCase` para nombres de clases
- Usar `kebab-case` para rutas de endpoints

### 4. Versionado Temprano

- Versionar desde el principio (v1)
- Mantener v1 estable
- Introducir breaking changes en v2

### 5. Rate Limiting Granular

- Rate limit global para protección básica
- Rate limits específicos para endpoints críticos
- Rate limits más permisivos para clientes autenticados

### 6. Validación en Capas

- Formato: DTOs con class-validator
- Lógica de negocio: Handlers
- Unicidad/constraints: Repository

### 7. Paginación por Defecto

- Siempre paginar listas (default: limit=10, max=100)
- Incluir metadata de paginación
- Permitir sorting y filtering

### 8. Security Headers

- Usar helmet para security headers
- CORS restrictivo en producción
- HTTPS obligatorio en producción

---

## 📚 Recursos Adicionales

- [NestJS Swagger Documentation](https://docs.nestjs.com/openapi/introduction)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Orval Documentation](https://orval.dev/)
- [NestJS Security](https://docs.nestjs.com/security/helmet)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)

---

## 📝 Historial de Cambios

| Versión | Fecha | Cambios |
|---------|-------|---------|
| **v2.0** | 2026-02-06 | Versión mejorada con seguridad, rate limiting, webhooks, file uploads |
| **v1.0** | 2025-01-20 | Versión inicial |

---

**Última actualización**: 2026-02-06  
**Versión**: 2.0  
**Mantenedor**: Equipo de Desarrollo TuLealtApp

