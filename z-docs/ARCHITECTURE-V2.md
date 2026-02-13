# Arquitectura del Proyecto TuLealtApp Backend v2

Esta es la versión mejorada y ampliada de la documentación de arquitectura del proyecto TuLealtApp Backend, basada en **Domain-Driven Design (DDD)** y **Arquitectura Hexagonal (Ports & Adapters)**.

## 📋 Tabla de Contenidos

1. [Introducción](#-introducción)
2. [Principios de Arquitectura](#-principios-de-arquitectura)
3. [Capas de la Arquitectura](#-capas-de-la-arquitectura)
4. [Flujo de Datos](#-flujo-de-datos)
5. [Componentes Detallados](#-componentes-detallados)
6. [Patrones de Implementación](#-patrones-de-implementación)
7. [Testing Strategies](#-testing-strategies)
8. [Manejo de Transacciones](#-manejo-de-transacciones)
9. [Eventos y Side Effects](#-eventos-y-side-effects)
10. [Sistema de Puntos y Ledger](#-sistema-de-puntos-y-ledger)
11. [Migraciones y Evolución](#-migraciones-y-evolución)
12. [Performance y Optimización](#-performance-y-optimización)
13. [Troubleshooting Arquitectónico](#-troubleshooting-arquitectónico)
14. [Mejores Prácticas](#-mejores-prácticas)
15. [Recursos Adicionales](#-recursos-adicionales)

---

## 🎯 Introducción

### ¿Qué es Arquitectura Hexagonal?

La **Arquitectura Hexagonal** (también conocida como **Ports & Adapters** o **Clean Architecture**) es un patrón arquitectónico que separa la lógica de negocio de los detalles técnicos. El objetivo es hacer que la aplicación sea **independiente de frameworks**, **fácil de testear** y **fácil de mantener**.

### ¿Por qué usar esta arquitectura?

1. **Independencia**: El dominio no depende de frameworks (TypeORM, NestJS, etc.)
2. **Testabilidad**: Fácil de testear sin necesidad de base de datos o frameworks
3. **Mantenibilidad**: Cambios en infraestructura no afectan la lógica de negocio
4. **Escalabilidad**: Fácil agregar nuevas funcionalidades sin romper código existente
5. **Claridad**: Separación clara de responsabilidades
6. **Evolución**: Permite cambiar tecnologías sin reescribir todo

### El Hexágono

```
                    ┌────────────────┐
                    │   HTTP REST    │
                    │  Controllers   │
                    └───────┬────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
     ┌──────▼─────┐  ┌─────▼──────┐  ┌────▼─────┐
     │  Partner   │  │   Admin    │  │ Customer │
     │    API     │  │    API     │  │   API    │
     └──────┬─────┘  └─────┬──────┘  └────┬─────┘
            │               │               │
            └───────────────┼───────────────┘
                            │
                    ┌───────▼────────┐
                    │  Application   │
                    │    Handlers    │
                    └───────┬────────┘
                            │
                    ┌───────▼────────┐
                    │     Domain     │
                    │ (Pure Business │
                    │     Logic)     │
                    └───────┬────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
     ┌──────▼─────┐  ┌─────▼──────┐  ┌────▼─────┐
     │  TypeORM   │  │   S3/MinIO │  │  Stripe  │
     │ Repository │  │   Storage  │  │ Payments │
     └────────────┘  └────────────┘  └──────────┘
```

Los puertos (interfaces) están en el centro (Domain), y los adaptadores (implementaciones) en los bordes.

---

## 🏛️ Principios de Arquitectura

### Regla de Dependencias

```
APIs → Application → Domain ← Infrastructure
```

**La regla fundamental**: Las dependencias siempre apuntan **hacia adentro**, hacia el dominio. El dominio **nunca** depende de capas externas.

- ✅ **Domain** no depende de nada
- ✅ **Application** depende solo de **Domain**
- ✅ **Infrastructure** depende de **Domain** y **Application**
- ✅ **APIs** dependen de **Application** e **Infrastructure**

### Inversión de Dependencias (DIP)

```typescript
// ❌ MAL: Application depende de implementación concreta
import { UserRepository } from '@libs/infrastructure';

class CreateUserHandler {
  constructor(private repo: UserRepository) {} // ❌ Dependencia concreta
}

// ✅ BIEN: Application depende de abstracción (interfaz)
import { IUserRepository } from '@libs/domain';

class CreateUserHandler {
  constructor(
    @Inject('IUserRepository')
    private repo: IUserRepository // ✅ Dependencia de interfaz
  ) {}
}
```

### Separación de Responsabilidades (SRP)

Cada capa tiene una responsabilidad específica:

| Capa | Responsabilidad | No Debe |
|------|----------------|---------|
| **Domain** | Lógica de negocio pura | Saber de HTTP, DB, frameworks |
| **Application** | Orquestación de casos de uso | Contener lógica de negocio compleja |
| **Infrastructure** | Implementaciones técnicas | Contener lógica de negocio |
| **APIs** | Puntos de entrada HTTP | Contener lógica de negocio o acceso a datos |

### Open/Closed Principle (OCP)

El código debe estar:
- ✅ **Abierto para extensión** (agregar nuevas features)
- ✅ **Cerrado para modificación** (no cambiar código existente)

**Ejemplo:**

```typescript
// ✅ BIEN: Agregar nuevo tipo de transacción sin modificar código existente
enum TransactionType {
  EARNING = 'EARNING',
  REDEEM = 'REDEEM',
  ADJUSTMENT = 'ADJUSTMENT',
  REVERSAL = 'REVERSAL',
  EXPIRATION = 'EXPIRATION',
  BONUS = 'BONUS', // ← Nuevo tipo agregado sin modificar lógica existente
}

// La lógica en el dominio maneja todos los tipos genéricamente
class PointsTransaction {
  constructor(
    public readonly type: TransactionType, // Acepta cualquier tipo
    // ...
  ) {}
}
```

---

## 🏗️ Capas de la Arquitectura

### Diagrama de Capas

```
┌─────────────────────────────────────────────────────────────┐
│                    APPS LAYER (APIs)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Admin API  │  │ Partner API │  │Customer API │         │
│  │  Port 3000  │  │  Port 3001  │  │  Port 3002  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│  Responsabilidad:                                           │
│  - Recibir HTTP requests                                    │
│  - Autenticación y autorización (Guards)                    │
│  - Validación de entrada (DTOs + ValidationPipe)            │
│  - Documentación (Swagger)                                  │
│  - Manejo de errores HTTP                                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Llama a
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              APPLICATION LAYER (Casos de Uso)               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Handlers: CreateUser, ProcessLoyalty, GetRewards   │  │
│  │  DTOs: Request/Response objects                      │  │
│  │  Validations: class-validator decorators             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Responsabilidad:                                           │
│  - Orquestar casos de uso específicos                       │
│  - Coordinar entre domain y infrastructure                  │
│  - Validar reglas de negocio de alto nivel                  │
│  - Manejar transacciones de base de datos                   │
│  - Transformar entre DTOs y entidades de dominio            │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Usa
                            ▼
┌─────────────────────────────────────────────────────────────┐
│           DOMAIN LAYER (Lógica de Negocio Pura)            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Entities: User, Partner, Reward, Transaction        │  │
│  │  Repository Interfaces: IUserRepository, ...         │  │
│  │  Business Rules: Métodos de dominio                  │  │
│  │  Value Objects: Email, Money, Points                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Responsabilidad:                                           │
│  - Definir entidades de negocio (sin frameworks)            │
│  - Contener lógica de negocio pura                          │
│  - Definir contratos (interfaces) de repositorios           │
│  - Validaciones de dominio                                  │
│  - Invariantes del negocio                                  │
│                                                              │
│  Características:                                           │
│  - ✅ Sin dependencias externas (TypeScript puro)           │
│  - ✅ Campos readonly (inmutabilidad)                       │
│  - ✅ Factory methods para creación                         │
│  - ✅ Métodos de negocio que retornan nuevas instancias     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Implementado por
                            ▼
┌─────────────────────────────────────────────────────────────┐
│       INFRASTRUCTURE LAYER (Detalles Técnicos)             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  TypeORM Entities: @Entity, @Column decorators       │  │
│  │  Repositories: Implementaciones concretas             │  │
│  │  Mappers: Domain ↔ Persistence                        │  │
│  │  Storage: S3/MinIO integration                        │  │
│  │  External APIs: Stripe, Email, etc.                  │  │
│  │  Migrations: Database schema changes                 │  │
│  │  Seeds: Initial data                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Responsabilidad:                                           │
│  - Implementar interfaces de repositorios                   │
│  - Persistir datos en base de datos (TypeORM)               │
│  - Integrar con servicios externos (S3, Stripe, SMTP)       │
│  - Manejar detalles de infraestructura                      │
│  - Convertir entre dominio y persistencia (Mappers)         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Persiste en
                            ▼
                   ┌──────────────────┐
                   │     MariaDB      │
                   │    Database      │
                   │  (Persistence)   │
                   └──────────────────┘
```

---

## 🔄 Flujo de Datos

### Ejemplo Completo: Crear un Usuario

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Cliente HTTP                                              │
│    POST /admin/users                                         │
│    Body: { email, name, password }                           │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. UsersController (API Layer)                               │
│    @Post()                                                   │
│    @UseGuards(JwtAuthGuard, RolesGuard)                     │
│    @Roles('ADMIN')                                           │
│                                                              │
│    Acciones:                                                 │
│    - Validar JWT token (JwtAuthGuard)                       │
│    - Verificar rol ADMIN (RolesGuard)                       │
│    - Validar DTO con class-validator                        │
│    - Llamar a CreateUserHandler                             │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. CreateUserHandler (Application Layer)                     │
│                                                              │
│    async execute(request: CreateUserRequest) {              │
│      // 3.1. Validar que email no exista                    │
│      const existing = await this.userRepository             │
│        .findByEmail(request.email);                         │
│      if (existing) throw new ConflictException();           │
│                                                              │
│      // 3.2. Hash de password (usando bcrypt)               │
│      const hashedPassword = await bcrypt.hash(              │
│        request.password, 10                                 │
│      );                                                      │
│                                                              │
│      // 3.3. Crear entidad de dominio (factory method)      │
│      const user = User.create(                              │
│        request.email,                                       │
│        request.name,                                        │
│        hashedPassword,                                      │
│        request.roles || ['CUSTOMER']                        │
│      );                                                      │
│                                                              │
│      // 3.4. Guardar usando repositorio                     │
│      const savedUser = await this.userRepository.save(user);│
│                                                              │
│      // 3.5. Crear y retornar DTO de respuesta              │
│      return new CreateUserResponse(                         │
│        savedUser.id,                                        │
│        savedUser.email,                                     │
│        savedUser.name,                                      │
│        // ... más campos                                    │
│      );                                                      │
│    }                                                         │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. User Entity (Domain Layer)                                │
│                                                              │
│    static create(email, name, password, roles): User {      │
│      // Validaciones de dominio                             │
│      if (!email.includes('@')) {                            │
│        throw new Error('Invalid email');                    │
│      }                                                       │
│      if (name.length < 2) {                                 │
│        throw new Error('Name too short');                   │
│      }                                                       │
│                                                              │
│      return new User(                                       │
│        0, // ID asignado por BD                             │
│        email,                                               │
│        name,                                                │
│        password, // Ya hasheado                             │
│        roles,                                               │
│        true, // isActive                                    │
│        new Date(), // createdAt                             │
│      );                                                      │
│    }                                                         │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. UserRepository (Infrastructure Layer)                     │
│                                                              │
│    async save(user: User): Promise<User> {                  │
│      // 5.1. Convertir dominio → persistencia (Mapper)      │
│      const entityData = UserMapper.toPersistence(user);     │
│                                                              │
│      // 5.2. Guardar en BD usando TypeORM                   │
│      const savedEntity = await this.typeormRepo.save(       │
│        entityData                                           │
│      );                                                      │
│                                                              │
│      // 5.3. Convertir persistencia → dominio (Mapper)      │
│      return UserMapper.toDomain(savedEntity);               │
│    }                                                         │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. MariaDB Database                                          │
│    INSERT INTO users (email, name, password, ...) VALUES (...│
│                                                              │
│    - Valida constraints (UNIQUE email)                      │
│    - Asigna auto-increment ID                               │
│    - Inserta registro                                       │
│    - Retorna registro insertado con ID                      │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 7. Response sube por las capas                              │
│    SavedEntity → Domain Entity → Response DTO → HTTP JSON   │
│                                                              │
│    HTTP 201 Created                                         │
│    {                                                         │
│      "id": 42,                                              │
│      "email": "user@example.com",                           │
│      "name": "John Doe",                                    │
│      "roles": ["CUSTOMER"],                                 │
│      "isActive": true,                                      │
│      "createdAt": "2024-01-15T10:30:00.000Z"               │
│    }                                                         │
└──────────────────────────────────────────────────────────────┘
```

### Flujo Simplificado (Diagrama)

```
HTTP Request
     │
     ▼
Controller (validate, authenticate)
     │
     ▼
Handler (orchestrate use case)
     │
     ├─→ Domain Entity (business logic)
     │        ↓
     └─→ Repository Interface
              │
              ▼
         Repository Implementation
              │
              ▼
         Mapper (domain ↔ persistence)
              │
              ▼
         TypeORM Entity
              │
              ▼
         Database (MariaDB)
              │
              ▼
         Response (back up through layers)
              │
              ▼
         HTTP Response
```

---

## 🧩 Componentes Detallados

### 1. Domain Layer

#### Entidades de Dominio

**Características:**
- ✅ Sin decoradores de frameworks
- ✅ Campos `readonly` (inmutabilidad)
- ✅ Factory methods para creación
- ✅ Métodos de negocio que retornan nuevas instancias
- ✅ Validaciones de dominio en constructores/factories

**Ejemplo Completo:**

```typescript
// libs/domain/src/entities/user.entity.ts
export class User {
  constructor(
    public readonly id: number,
    public readonly email: string,
    public readonly name: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly password: string,
    public readonly phone: string | null,
    public readonly profile: Record<string, any> | null,
    public readonly roles: string[],
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear un nuevo usuario
   * Incluye validaciones de dominio
   */
  static create(
    email: string,
    name: string,
    firstName: string,
    lastName: string,
    password: string,
    roles: string[] = ['CUSTOMER'],
    phone?: string,
    profile?: Record<string, any>,
  ): User {
    // Validaciones de dominio
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email format');
    }
    if (!name || name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    if (roles.length === 0) {
      throw new Error('User must have at least one role');
    }

    return new User(
      0, // ID será asignado por la BD
      email.toLowerCase().trim(),
      name.trim(),
      firstName.trim(),
      lastName.trim(),
      password, // Ya debe estar hasheado
      phone || null,
      profile || null,
      roles,
      true, // Usuarios nuevos están activos por defecto
      new Date(),
      new Date(),
    );
  }

  /**
   * Método de dominio: suspender usuario
   * Retorna nueva instancia (inmutabilidad)
   */
  suspend(): User {
    if (!this.isActive) {
      throw new Error('User is already suspended');
    }

    return new User(
      this.id,
      this.email,
      this.name,
      this.firstName,
      this.lastName,
      this.password,
      this.phone,
      this.profile,
      this.roles,
      false, // isActive = false
      this.createdAt,
      new Date(), // updatedAt actualizado
    );
  }

  /**
   * Método de dominio: reactivar usuario
   */
  activate(): User {
    if (this.isActive) {
      throw new Error('User is already active');
    }

    return new User(
      this.id,
      this.email,
      this.name,
      this.firstName,
      this.lastName,
      this.password,
      this.phone,
      this.profile,
      this.roles,
      true, // isActive = true
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio: cambiar email
   */
  changeEmail(newEmail: string): User {
    if (!newEmail || !newEmail.includes('@')) {
      throw new Error('Invalid email format');
    }

    return new User(
      this.id,
      newEmail.toLowerCase().trim(),
      this.name,
      this.firstName,
      this.lastName,
      this.password,
      this.phone,
      this.profile,
      this.roles,
      this.isActive,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio: verificar si tiene un rol específico
   */
  hasRole(role: string): boolean {
    return this.roles.includes(role);
  }

  /**
   * Método de dominio: verificar si es admin
   */
  isAdmin(): boolean {
    return this.roles.includes('ADMIN') || this.roles.includes('SUPERADMIN');
  }
}
```

#### Interfaces de Repositorios

**Características:**
- ✅ Definen contratos (qué métodos debe tener)
- ✅ Retornan siempre entidades de dominio
- ✅ Parámetros son tipos primitivos o entidades de dominio
- ✅ No contienen lógica, solo definición

**Ejemplo:**

```typescript
// libs/domain/src/repositories/user.repository.interface.ts
import { User } from '../entities/user.entity';

export interface IUserRepository {
  // Búsqueda
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(filters?: {
    isActive?: boolean;
    roles?: string[];
    page?: number;
    limit?: number;
  }): Promise<{ users: User[]; total: number }>;

  // Persistencia
  save(user: User): Promise<User>;
  update(user: User): Promise<User>;
  delete(id: number): Promise<void>;

  // Queries específicas de negocio
  findActiveAdmins(): Promise<User[]>;
  countByRole(role: string): Promise<number>;
  existsByEmail(email: string): Promise<boolean>;
}
```

---

### 2. Application Layer

#### Handlers (Casos de Uso)

**Características:**
- ✅ Un handler = un caso de uso específico
- ✅ Orquesta llamadas a repositorios y servicios
- ✅ Maneja transacciones
- ✅ Transforma entre DTOs y entidades de dominio
- ✅ Validaciones de alto nivel

**Ejemplo Completo:**

```typescript
// libs/application/src/users/create-user/create-user.handler.ts
import { Injectable, Inject, ConflictException, BadRequestException } from '@nestjs/common';
import { IUserRepository, User } from '@libs/domain';
import { CreateUserRequest } from './create-user.request';
import { CreateUserResponse } from './create-user.response';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CreateUserHandler {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: CreateUserRequest): Promise<CreateUserResponse> {
    // 1. Validar que el email no exista
    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      throw new ConflictException(
        `User with email ${request.email} already exists`
      );
    }

    // 2. Validar roles permitidos
    const allowedRoles = ['CUSTOMER', 'PARTNER', 'ADMIN'];
    const invalidRoles = (request.roles || []).filter(
      role => !allowedRoles.includes(role)
    );
    if (invalidRoles.length > 0) {
      throw new BadRequestException(
        `Invalid roles: ${invalidRoles.join(', ')}`
      );
    }

    // 3. Hash de password
    const hashedPassword = await bcrypt.hash(request.password, 10);

    // 4. Crear entidad de dominio usando factory method
    const user = User.create(
      request.email,
      request.name,
      request.firstName,
      request.lastName,
      hashedPassword,
      request.roles || ['CUSTOMER'],
      request.phone,
      request.profile,
    );

    // 5. Guardar usando repositorio
    const savedUser = await this.userRepository.save(user);

    // 6. Crear y retornar DTO de respuesta
    return new CreateUserResponse(
      savedUser.id,
      savedUser.email,
      savedUser.name,
      savedUser.firstName,
      savedUser.lastName,
      savedUser.phone,
      savedUser.profile,
      savedUser.roles,
      savedUser.isActive,
      savedUser.createdAt,
    );
  }
}
```

#### DTOs (Data Transfer Objects)

**Request DTO:**

```typescript
// libs/application/src/users/create-user/create-user.request.ts
import { 
  IsEmail, 
  IsNotEmpty, 
  IsString, 
  MinLength, 
  IsOptional, 
  IsArray,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserRequest {
  @ApiProperty({
    description: 'Email del usuario (debe ser único)',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Jane Smith',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Jane',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  firstName: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Smith',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastName: string;

  @ApiProperty({
    description: 'Contraseña (mínimo 6 caracteres)',
    example: 'SecurePass123!',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Teléfono en formato internacional',
    example: '+1234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Roles del usuario',
    example: ['CUSTOMER'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  roles?: string[];

  @ApiProperty({
    description: 'Perfil adicional (JSON)',
    example: { preferences: { language: 'es' } },
    required: false,
  })
  @IsObject()
  @IsOptional()
  profile?: Record<string, any>;
}
```

**Response DTO:**

```typescript
// libs/application/src/users/create-user/create-user.response.ts
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'Jane Smith' })
  name: string;

  @ApiProperty({ example: 'Jane' })
  firstName: string;

  @ApiProperty({ example: 'Smith' })
  lastName: string;

  @ApiProperty({ example: '+1234567890', nullable: true })
  phone: string | null;

  @ApiProperty({ example: { preferences: { language: 'es' } }, nullable: true })
  profile: Record<string, any> | null;

  @ApiProperty({ example: ['CUSTOMER'] })
  roles: string[];

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
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

### 3. Infrastructure Layer

#### Entidades de Persistencia

**Características:**
- ✅ Decoradores de TypeORM
- ✅ Estructura optimizada para BD
- ✅ Relaciones lazy/eager según necesidad
- ✅ Índices para performance

**Ejemplo:**

```typescript
// libs/infrastructure/src/persistence/entities/user.entity.ts
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['isActive'])
@Index(['roles'])
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 255, unique: true })
  email: string;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('varchar', { length: 255 })
  firstName: string;

  @Column('varchar', { length: 255 })
  lastName: string;

  @Column('varchar', { length: 255 })
  password: string;

  @Column('varchar', { length: 50, nullable: true })
  phone: string | null;

  @Column('json', { nullable: true })
  profile: Record<string, any> | null;

  @Column('simple-array')
  roles: string[];

  @Column('boolean', { default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
```

#### Mappers

**Características:**
- ✅ Conversión bidireccional (domain ↔ persistence)
- ✅ Métodos estáticos
- ✅ Manejo de tipos null/undefined
- ✅ Transformación de tipos (JSON, arrays, etc.)

**Ejemplo:**

```typescript
// libs/infrastructure/src/persistence/mappers/user.mapper.ts
import { User } from '@libs/domain';
import { UserEntity } from '../entities/user.entity';

export class UserMapper {
  /**
   * Convierte entidad de persistencia → entidad de dominio
   */
  static toDomain(entity: UserEntity): User {
    if (!entity) {
      throw new Error('Cannot map null entity to domain');
    }

    return new User(
      entity.id,
      entity.email,
      entity.name,
      entity.firstName,
      entity.lastName,
      entity.password,
      entity.phone,
      entity.profile,
      entity.roles || [],
      entity.isActive,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  /**
   * Convierte entidad de dominio → entidad de persistencia
   */
  static toPersistence(domain: User): Partial<UserEntity> {
    if (!domain) {
      throw new Error('Cannot map null domain to persistence');
    }

    return {
      id: domain.id || undefined, // undefined = auto-increment
      email: domain.email,
      name: domain.name,
      firstName: domain.firstName,
      lastName: domain.lastName,
      password: domain.password,
      phone: domain.phone,
      profile: domain.profile,
      roles: domain.roles,
      isActive: domain.isActive,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  /**
   * Convierte múltiples entidades de persistencia → dominio
   */
  static toDomainMany(entities: UserEntity[]): User[] {
    return entities.map(entity => this.toDomain(entity));
  }
}
```

#### Repositorios (Implementaciones)

**Características:**
- ✅ Implementan interfaces de domain
- ✅ Usan TypeORM para acceso a BD
- ✅ Siempre convierten con mappers
- ✅ Manejo de errores de BD

**Ejemplo:**

```typescript
// libs/infrastructure/src/persistence/repositories/user.repository.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { IUserRepository, User } from '@libs/domain';
import { UserEntity } from '../entities/user.entity';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findById(id: number): Promise<User | null> {
    try {
      const entity = await this.userRepository.findOne({ where: { id } });
      return entity ? UserMapper.toDomain(entity) : null;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error finding user by id: ${error.message}`
      );
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const entity = await this.userRepository.findOne({ 
        where: { email: email.toLowerCase() } 
      });
      return entity ? UserMapper.toDomain(entity) : null;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error finding user by email: ${error.message}`
      );
    }
  }

  async findAll(filters?: {
    isActive?: boolean;
    roles?: string[];
    page?: number;
    limit?: number;
  }): Promise<{ users: User[]; total: number }> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      const [entities, total] = await this.userRepository.findAndCount({
        where,
        skip,
        take: limit,
        order: { createdAt: 'DESC' },
      });

      return {
        users: UserMapper.toDomainMany(entities),
        total,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Error finding users: ${error.message}`
      );
    }
  }

  async save(user: User): Promise<User> {
    try {
      const entityData = UserMapper.toPersistence(user);
      const savedEntity = await this.userRepository.save(entityData);
      return UserMapper.toDomain(savedEntity);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Email already exists');
      }
      throw new InternalServerErrorException(
        `Error saving user: ${error.message}`
      );
    }
  }

  async update(user: User): Promise<User> {
    try {
      if (!user.id) {
        throw new Error('Cannot update user without ID');
      }

      const entityData = UserMapper.toPersistence(user);
      await this.userRepository.update(user.id, entityData);
      
      const updatedEntity = await this.userRepository.findOne({ 
        where: { id: user.id } 
      });
      
      if (!updatedEntity) {
        throw new Error('User not found after update');
      }

      return UserMapper.toDomain(updatedEntity);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error updating user: ${error.message}`
      );
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await this.userRepository.delete(id);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error deleting user: ${error.message}`
      );
    }
  }

  async findActiveAdmins(): Promise<User[]> {
    try {
      const entities = await this.userRepository
        .createQueryBuilder('user')
        .where('user.isActive = :isActive', { isActive: true })
        .andWhere('user.roles LIKE :role', { role: '%ADMIN%' })
        .getMany();

      return UserMapper.toDomainMany(entities);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error finding active admins: ${error.message}`
      );
    }
  }

  async countByRole(role: string): Promise<number> {
    try {
      return await this.userRepository
        .createQueryBuilder('user')
        .where('user.roles LIKE :role', { role: `%${role}%` })
        .getCount();
    } catch (error) {
      throw new InternalServerErrorException(
        `Error counting users by role: ${error.message}`
      );
    }
  }

  async existsByEmail(email: string): Promise<boolean> {
    try {
      const count = await this.userRepository.count({ 
        where: { email: email.toLowerCase() } 
      });
      return count > 0;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error checking email existence: ${error.message}`
      );
    }
  }
}
```

---

### 4. APIs Layer

#### Controladores

**Características:**
- ✅ Responsabilidad HTTP solamente
- ✅ Guards para autenticación/autorización
- ✅ Validación automática de DTOs
- ✅ Documentación Swagger completa
- ✅ Manejo de errores HTTP

**Ejemplo Completo:**

```typescript
// apps/admin-api/src/controllers/users.controller.ts
import { 
  Controller, 
  Post, 
  Get,
  Param,
  Body, 
  HttpCode, 
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  CreateUserHandler,
  CreateUserRequest,
  CreateUserResponse,
  GetUserHandler,
  GetUserRequest,
  GetUserResponse,
} from '@libs/application';
import { JwtAuthGuard, RolesGuard, Roles } from '@libs/shared';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly createUserHandler: CreateUserHandler,
    private readonly getUserHandler: GetUserHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Crear un nuevo usuario',
    description: 'Crea un nuevo usuario en el sistema. Requiere rol ADMIN.'
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
      profile: { preferences: { language: 'es' } },
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
    description: 'No tiene permisos de administrador',
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
      message: 'User with email user@example.com already exists',
      error: 'Conflict',
    },
  })
  async create(
    @Body() request: CreateUserRequest
  ): Promise<CreateUserResponse> {
    return this.createUserHandler.execute(request);
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ 
    summary: 'Obtener usuario por ID',
    description: 'Retorna la información de un usuario específico'
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario',
    type: Number,
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado',
    type: GetUserResponse,
    example: {
      id: 1,
      email: 'user@example.com',
      name: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      profile: { preferences: { language: 'es' } },
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
      message: 'User not found',
      error: 'Not Found',
    },
  })
  async getUserById(
    @Param('id', ParseIntPipe) id: number
  ): Promise<GetUserResponse> {
    const request = new GetUserRequest();
    request.userId = id;
    return this.getUserHandler.execute(request);
  }
}
```

---

## 🎨 Patrones de Implementación

### Patrón Repository

**¿Qué es?** Abstracción que oculta los detalles de acceso a datos.

**Beneficios:**
- ✅ Cambiar de TypeORM a MongoDB solo requiere nueva implementación
- ✅ Fácil hacer mocks para testing
- ✅ Dominio no sabe cómo se persisten los datos

```typescript
// Domain: Define el contrato
interface IUserRepository {
  findById(id: number): Promise<User | null>;
  save(user: User): Promise<User>;
}

// Infrastructure: Implementación con TypeORM
class UserRepository implements IUserRepository {
  async findById(id: number): Promise<User | null> {
    const entity = await this.typeormRepo.findOne({ where: { id } });
    return entity ? UserMapper.toDomain(entity) : null;
  }
}

// Fácil cambiar implementación (ej: MongoDB)
class UserMongoRepository implements IUserRepository {
  async findById(id: number): Promise<User | null> {
    const doc = await this.mongoModel.findById(id);
    return doc ? UserMapper.toDomain(doc) : null;
  }
}
```

### Patrón Factory Method

**¿Qué es?** Método estático para crear instancias con validaciones.

```typescript
class User {
  private constructor(/* ... */) {}

  static create(email: string, name: string, password: string): User {
    // Validaciones centralizadas
    if (!email.includes('@')) throw new Error('Invalid email');
    if (name.length < 2) throw new Error('Name too short');
    if (password.length < 6) throw new Error('Password too short');

    return new User(0, email, name, password, true, new Date());
  }
}

// Uso
const user = User.create('user@example.com', 'John Doe', 'SecurePass123!');
```

### Patrón Command/Handler

**¿Qué es?** Separar el request (comando) de su ejecución (handler).

```typescript
// Command (Request)
class CreateUserRequest {
  email: string;
  name: string;
  password: string;
}

// Handler (Executor)
class CreateUserHandler {
  async execute(command: CreateUserRequest): Promise<CreateUserResponse> {
    // Lógica de ejecución
  }
}

// Controller solo delega
@Post()
create(@Body() command: CreateUserRequest) {
  return this.createUserHandler.execute(command);
}
```

### Patrón Mapper

**¿Qué es?** Convertidor entre capas (domain ↔ persistence).

```typescript
class UserMapper {
  static toDomain(entity: UserEntity): User {
    return new User(/* ... */);
  }

  static toPersistence(domain: User): Partial<UserEntity> {
    return { /* ... */ };
  }
}

// Uso en repositorio
async save(user: User): Promise<User> {
  const entityData = UserMapper.toPersistence(user); // Domain → Persistence
  const savedEntity = await this.repo.save(entityData);
  return UserMapper.toDomain(savedEntity); // Persistence → Domain
}
```

---

## 🧪 Testing Strategies

### Pirámide de Testing

```
        ┌───────┐
        │  E2E  │  ← Pocos (10%)
        └───────┘
      ┌───────────┐
      │Integration│  ← Algunos (30%)
      └───────────┘
    ┌───────────────┐
    │  Unit Tests   │  ← Muchos (60%)
    └───────────────┘
```

### 1. Unit Tests (Dominio)

**Ventajas:**
- ✅ Rápidos de ejecutar
- ✅ No requieren BD ni frameworks
- ✅ Fáciles de escribir
- ✅ Alta cobertura

**Ejemplo:**

```typescript
// libs/domain/src/entities/__tests__/user.entity.spec.ts
import { User } from '../user.entity';

describe('User Entity', () => {
  describe('create', () => {
    it('should create a valid user', () => {
      const user = User.create(
        'user@example.com',
        'John Doe',
        'John',
        'Doe',
        'password123',
      );

      expect(user.email).toBe('user@example.com');
      expect(user.name).toBe('John Doe');
      expect(user.isActive).toBe(true);
      expect(user.roles).toContain('CUSTOMER');
    });

    it('should throw error for invalid email', () => {
      expect(() => {
        User.create(
          'invalid-email',
          'John Doe',
          'John',
          'Doe',
          'password123',
        );
      }).toThrow('Invalid email format');
    });

    it('should throw error for short name', () => {
      expect(() => {
        User.create(
          'user@example.com',
          'J',
          'J',
          'D',
          'password123',
        );
      }).toThrow('Name must be at least 2 characters');
    });

    it('should throw error for short password', () => {
      expect(() => {
        User.create(
          'user@example.com',
          'John Doe',
          'John',
          'Doe',
          '123',
        );
      }).toThrow('Password must be at least 6 characters');
    });
  });

  describe('suspend', () => {
    it('should suspend an active user', () => {
      const user = User.create(
        'user@example.com',
        'John Doe',
        'John',
        'Doe',
        'password123',
      );

      const suspended = user.suspend();

      expect(suspended.isActive).toBe(false);
      expect(suspended.email).toBe(user.email);
    });

    it('should throw error when suspending already suspended user', () => {
      const user = User.create(
        'user@example.com',
        'John Doe',
        'John',
        'Doe',
        'password123',
      );
      const suspended = user.suspend();

      expect(() => {
        suspended.suspend();
      }).toThrow('User is already suspended');
    });
  });

  describe('activate', () => {
    it('should activate a suspended user', () => {
      const user = User.create(
        'user@example.com',
        'John Doe',
        'John',
        'Doe',
        'password123',
      );
      const suspended = user.suspend();
      const activated = suspended.activate();

      expect(activated.isActive).toBe(true);
    });
  });

  describe('hasRole', () => {
    it('should return true for existing role', () => {
      const user = User.create(
        'user@example.com',
        'John Doe',
        'John',
        'Doe',
        'password123',
        ['CUSTOMER', 'PREMIUM'],
      );

      expect(user.hasRole('CUSTOMER')).toBe(true);
      expect(user.hasRole('PREMIUM')).toBe(true);
    });

    it('should return false for non-existing role', () => {
      const user = User.create(
        'user@example.com',
        'John Doe',
        'John',
        'Doe',
        'password123',
        ['CUSTOMER'],
      );

      expect(user.hasRole('ADMIN')).toBe(false);
    });
  });
});
```

### 2. Integration Tests (Application Layer)

**Ventajas:**
- ✅ Testan la integración entre capas
- ✅ Usan mocks de repositorios
- ✅ No requieren BD real

**Ejemplo:**

```typescript
// libs/application/src/users/create-user/__tests__/create-user.handler.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { CreateUserHandler } from '../create-user.handler';
import { CreateUserRequest } from '../create-user.request';
import { IUserRepository, User } from '@libs/domain';

describe('CreateUserHandler', () => {
  let handler: CreateUserHandler;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(async () => {
    // Crear mock del repositorio
    mockUserRepository = {
      findByEmail: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findActiveAdmins: jest.fn(),
      countByRole: jest.fn(),
      existsByEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserHandler,
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    handler = module.get<CreateUserHandler>(CreateUserHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      const request = new CreateUserRequest();
      request.email = 'newuser@example.com';
      request.name = 'New User';
      request.firstName = 'New';
      request.lastName = 'User';
      request.password = 'password123';
      request.roles = ['CUSTOMER'];

      mockUserRepository.findByEmail.mockResolvedValue(null); // No existe

      const savedUser = User.create(
        request.email,
        request.name,
        request.firstName,
        request.lastName,
        'hashedpassword',
        request.roles,
      );
      // Simulamos que la BD asigna ID = 1
      Object.defineProperty(savedUser, 'id', { value: 1 });

      mockUserRepository.save.mockResolvedValue(savedUser);

      // Act
      const result = await handler.execute(request);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.email).toBe(request.email);
      expect(result.name).toBe(request.name);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(request.email);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      // Arrange
      const request = new CreateUserRequest();
      request.email = 'existing@example.com';
      request.name = 'Existing User';
      request.firstName = 'Existing';
      request.lastName = 'User';
      request.password = 'password123';

      const existingUser = User.create(
        request.email,
        'Old Name',
        'Old',
        'Name',
        'oldpassword',
      );

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(handler.execute(request)).rejects.toThrow(ConflictException);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should hash password before saving', async () => {
      // Arrange
      const request = new CreateUserRequest();
      request.email = 'user@example.com';
      request.name = 'Test User';
      request.firstName = 'Test';
      request.lastName = 'User';
      request.password = 'plainpassword';

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockImplementation((user) => Promise.resolve(user));

      // Act
      await handler.execute(request);

      // Assert
      expect(mockUserRepository.save).toHaveBeenCalled();
      const savedUser = mockUserRepository.save.mock.calls[0][0];
      expect(savedUser.password).not.toBe('plainpassword'); // Password debe estar hasheado
    });
  });
});
```

### 3. E2E Tests (Full Stack)

**Ventajas:**
- ✅ Testan el flujo completo
- ✅ Incluyen BD real (test database)
- ✅ Validan autenticación, autorización, etc.

**Ejemplo:**

```typescript
// apps/admin-api/test/users.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AdminApiModule } from '../src/admin-api.module';
import { DataSource } from 'typeorm';

describe('Users E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AdminApiModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Login para obtener token
    const loginResponse = await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin123!',
      });

    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('POST /admin/users', () => {
    it('should create a new user', () => {
      return request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'test@example.com',
          name: 'Test User',
          firstName: 'Test',
          lastName: 'User',
          password: 'password123',
          roles: ['CUSTOMER'],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.email).toBe('test@example.com');
          expect(res.body.name).toBe('Test User');
        });
    });

    it('should return 409 if email already exists', async () => {
      // Crear usuario primero
      await request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'duplicate@example.com',
          name: 'Duplicate User',
          firstName: 'Duplicate',
          lastName: 'User',
          password: 'password123',
        });

      // Intentar crear de nuevo
      return request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'duplicate@example.com',
          name: 'Another User',
          firstName: 'Another',
          lastName: 'User',
          password: 'password123',
        })
        .expect(409);
    });

    it('should return 400 for invalid email', () => {
      return request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'invalid-email',
          name: 'Test User',
          firstName: 'Test',
          lastName: 'User',
          password: 'password123',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('email must be an email');
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/admin/users')
        .send({
          email: 'test@example.com',
          name: 'Test User',
          firstName: 'Test',
          lastName: 'User',
          password: 'password123',
        })
        .expect(401);
    });
  });

  describe('GET /admin/users/:id', () => {
    it('should get user by id', async () => {
      // Crear usuario primero
      const createResponse = await request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'getuser@example.com',
          name: 'Get User',
          firstName: 'Get',
          lastName: 'User',
          password: 'password123',
        });

      const userId = createResponse.body.id;

      // Obtener usuario
      return request(app.getHttpServer())
        .get(`/admin/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(userId);
          expect(res.body.email).toBe('getuser@example.com');
        });
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .get('/admin/users/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
```

### Testing Best Practices

1. **AAA Pattern** (Arrange-Act-Assert)
   ```typescript
   it('should do something', async () => {
     // Arrange: setup
     const user = User.create(/*...*/);
     
     // Act: execute
     const result = user.suspend();
     
     // Assert: verify
     expect(result.isActive).toBe(false);
   });
   ```

2. **Mock Dependencies**
   ```typescript
   const mockRepo = {
     findById: jest.fn(),
     save: jest.fn(),
   };
   ```

3. **Test One Thing**
   ```typescript
   // ✅ BIEN
   it('should create user', () => { /* ... */ });
   it('should validate email', () => { /* ... */ });
   
   // ❌ MAL
   it('should create user and validate email and check roles', () => { /* ... */ });
   ```

4. **Descriptive Names**
   ```typescript
   // ✅ BIEN
   it('should throw error when email already exists', () => { /* ... */ });
   
   // ❌ MAL
   it('test1', () => { /* ... */ });
   ```

---

## 🔄 Manejo de Transacciones

### ¿Cuándo usar transacciones?

Usa transacciones cuando necesitas garantizar **atomicidad** (todo o nada):

- ✅ Múltiples operaciones de escritura que deben ser consistentes
- ✅ Operaciones que involucran múltiples tablas
- ✅ Lógica de negocio que no puede quedar en estado inconsistente

**Ejemplo:** Transferir puntos entre usuarios:
```
- Restar puntos de usuario A
- Sumar puntos a usuario B
- Crear registro de transacción
→ Si alguno falla, todos deben revertirse
```

### Patrón Transaction Script

**Opción 1: TypeORM QueryRunner** (Recomendado)

```typescript
// libs/application/src/points/transfer-points/transfer-points.handler.ts
import { Injectable, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IPointsTransactionRepository, ICustomerMembershipRepository } from '@libs/domain';

@Injectable()
export class TransferPointsHandler {
  constructor(
    private readonly dataSource: DataSource,
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
  ) {}

  async execute(request: TransferPointsRequest): Promise<TransferPointsResponse> {
    // Crear QueryRunner para manejar transacción
    const queryRunner = this.dataSource.createQueryRunner();
    
    // Conectar y comenzar transacción
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Obtener membresías
      const senderMembership = await this.membershipRepository.findById(
        request.senderMembershipId
      );
      const receiverMembership = await this.membershipRepository.findById(
        request.receiverMembershipId
      );

      if (!senderMembership || !receiverMembership) {
        throw new Error('Membership not found');
      }

      // 2. Validar que sender tiene suficientes puntos
      if (senderMembership.points < request.points) {
        throw new Error('Insufficient points');
      }

      // 3. Crear transacciones de puntos
      const debitTransaction = PointsTransaction.createTransfer(
        senderMembership.id,
        -request.points,
        'TRANSFER_OUT',
        `Transfer to membership ${receiverMembership.id}`,
      );

      const creditTransaction = PointsTransaction.createTransfer(
        receiverMembership.id,
        request.points,
        'TRANSFER_IN',
        `Transfer from membership ${senderMembership.id}`,
      );

      // 4. Guardar transacciones (dentro de la transacción)
      await this.pointsTransactionRepository.save(debitTransaction);
      await this.pointsTransactionRepository.save(creditTransaction);

      // 5. Actualizar balances
      const updatedSender = senderMembership.subtractPoints(request.points);
      const updatedReceiver = receiverMembership.addPoints(request.points);

      await this.membershipRepository.update(updatedSender);
      await this.membershipRepository.update(updatedReceiver);

      // ✅ Commit: todo salió bien
      await queryRunner.commitTransaction();

      return new TransferPointsResponse(
        debitTransaction.id,
        creditTransaction.id,
        updatedSender.points,
        updatedReceiver.points,
      );

    } catch (error) {
      // ❌ Rollback: algo falló, revertir todo
      await queryRunner.rollbackTransaction();
      throw error;

    } finally {
      // Liberar conexión
      await queryRunner.release();
    }
  }
}
```

**Opción 2: TypeORM Transaction Decorator** (Más simple)

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionRepository } from 'typeorm';

@Injectable()
export class TransferPointsHandler {
  @Transaction()
  async execute(
    @TransactionRepository(PointsTransactionEntity) pointsRepo?: Repository<PointsTransactionEntity>,
    @TransactionRepository(MembershipEntity) membershipRepo?: Repository<MembershipEntity>,
  ): Promise<TransferPointsResponse> {
    // Código aquí se ejecuta en una transacción automáticamente
    // Si algo lanza error, se hace rollback automático
    
    const debitTransaction = /* ... */;
    const creditTransaction = /* ... */;

    await pointsRepo.save(debitTransaction);
    await pointsRepo.save(creditTransaction);

    const updatedSender = /* ... */;
    const updatedReceiver = /* ... */;

    await membershipRepo.update(updatedSender.id, updatedSender);
    await membershipRepo.update(updatedReceiver.id, updatedReceiver);

    return /* ... */;
  }
}
```

### Niveles de Aislamiento

```typescript
// Configurar en data-source.ts
{
  type: 'mariadb',
  // ...
  isolationLevel: 'READ COMMITTED', // Default recomendado
}

// O por transacción específica
await queryRunner.startTransaction('READ COMMITTED');
await queryRunner.startTransaction('SERIALIZABLE'); // Máximo aislamiento
```

**Niveles disponibles:**
- `READ UNCOMMITTED` - Más rápido, menos seguro
- `READ COMMITTED` - Balance (recomendado)
- `REPEATABLE READ` - Más seguro, puede causar dead locks
- `SERIALIZABLE` - Máxima seguridad, más lento

### Deadlocks

**¿Qué es?** Dos transacciones esperando recursos que la otra tiene bloqueados.

**Prevención:**
1. ✅ Ordenar operaciones de forma consistente
2. ✅ Mantener transacciones cortas
3. ✅ Usar timeouts
4. ✅ Retry logic para deadlocks

```typescript
async executeWithRetry(operation: () => Promise<any>, maxRetries = 3): Promise<any> {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      if (error.code === 'ER_LOCK_DEADLOCK' && attempt < maxRetries - 1) {
        attempt++;
        // Esperar un tiempo random antes de reintentar
        await this.sleep(Math.random() * 1000);
        continue;
      }
      throw error;
    }
  }
}
```

---

## 📡 Eventos y Side Effects

### Eventos de Dominio

**¿Qué son?** Notificaciones de que algo importante pasó en el dominio.

**Características:**
- ✅ Desacoplar lógica de negocio
- ✅ Permitir múltiples reacciones al mismo evento
- ✅ Facilitar auditoría

**Ejemplo:**

```typescript
// libs/domain/src/events/user-created.event.ts
export class UserCreatedEvent {
  constructor(
    public readonly userId: number,
    public readonly email: string,
    public readonly name: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

// libs/domain/src/entities/user.entity.ts
export class User {
  private domainEvents: any[] = [];

  static create(email: string, name: string, password: string): User {
    const user = new User(/* ... */);
    
    // Registrar evento
    user.domainEvents.push(
      new UserCreatedEvent(user.id, user.email, user.name)
    );
    
    return user;
  }

  getDomainEvents(): any[] {
    return this.domainEvents;
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }
}

// libs/application/src/users/create-user/create-user.handler.ts
@Injectable()
export class CreateUserHandler {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly eventEmitter: EventEmitter2, // NestJS EventEmitter
  ) {}

  async execute(request: CreateUserRequest): Promise<CreateUserResponse> {
    const user = User.create(/* ... */);
    const savedUser = await this.userRepository.save(user);

    // Emitir eventos de dominio
    const events = user.getDomainEvents();
    events.forEach(event => {
      this.eventEmitter.emit(event.constructor.name, event);
    });
    user.clearDomainEvents();

    return /* ... */;
  }
}

// libs/application/src/users/events/user-created.listener.ts
@Injectable()
export class UserCreatedListener {
  constructor(
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
  ) {}

  @OnEvent('UserCreatedEvent')
  async handleUserCreated(event: UserCreatedEvent) {
    // Enviar email de bienvenida
    await this.emailService.sendWelcomeEmail(event.email, event.name);

    // Registrar en audit log
    await this.auditService.log({
      action: 'USER_CREATED',
      userId: event.userId,
      timestamp: event.occurredAt,
    });

    // Crear entrada en analytics
    // ...
  }
}
```

### Side Effects vs Eventos

**Side Effects Síncronos** (en el mismo handler):
```typescript
async execute(request: CreateUserRequest) {
  const user = User.create(/* ... */);
  await this.userRepository.save(user);

  // Side effect síncrono (bloqueante)
  await this.emailService.sendWelcomeEmail(user.email);
  
  return response;
}
```

**Side Effects Asíncronos** (con eventos):
```typescript
async execute(request: CreateUserRequest) {
  const user = User.create(/* ... */);
  await this.userRepository.save(user);

  // Emitir evento (no bloqueante)
  this.eventEmitter.emit('UserCreatedEvent', { userId: user.id });
  
  return response; // No espera a que se envíe el email
}

// Listener maneja el side effect
@OnEvent('UserCreatedEvent')
async handleUserCreated(event) {
  await this.emailService.sendWelcomeEmail(/* ... */);
}
```

**¿Cuándo usar cada uno?**

| Criterio | Síncrono | Asíncrono (Eventos) |
|----------|----------|---------------------|
| **Performance** | Más lento | Más rápido |
| **Consistencia** | Garantizada | Eventual |
| **Acoplamiento** | Alto | Bajo |
| **Debugging** | Más fácil | Más complejo |
| **Escalabilidad** | Limitada | Alta |

**Recomendación:**
- ✅ **Síncrono**: Operaciones críticas que deben completarse (ej: crear usuario + crear membership obligatoria)
- ✅ **Asíncrono**: Operaciones opcionales/auxiliares (ej: enviar email, actualizar analytics, logs)

---

## 💰 Sistema de Puntos y Ledger

### Principio Fundamental: Ledger como Fuente de Verdad

El sistema de puntos está basado en un **ledger inmutable** (`PointsTransaction`) que actúa como la única fuente de verdad para todos los cambios de puntos. El campo `points` en `customer_memberships` es una **proyección calculada** desde el ledger, no la fuente primaria.

### Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    Ledger (Fuente de Verdad)            │
│              PointsTransaction (Inmutable)              │
│  - EARNING, REDEEM, ADJUSTMENT, REVERSAL, EXPIRATION   │
│  - Idempotencia garantizada por idempotencyKey         │
└─────────────────────────────────────────────────────────┘
                        │
                        │ Proyección
                        ▼
┌─────────────────────────────────────────────────────────┐
│              BalanceProjectionService                   │
│  - Calcula balance desde ledger (SUM pointsDelta)       │
│  - Actualiza proyección en customer_memberships.points │
└─────────────────────────────────────────────────────────┘
                        │
                        │ Sincronización
                        ▼
┌─────────────────────────────────────────────────────────┐
│              BalanceSyncService                          │
│  - Sincroniza balances después de transacciones         │
│  - Batch sync para reparación                          │
└─────────────────────────────────────────────────────────┘
```

### Reglas Críticas

1. **Inmutabilidad del Ledger**
   - El ledger es de solo escritura (INSERT)
   - NUNCA se actualiza ni elimina una transacción existente
   - Para corregir errores, crear transacción de REVERSAL

2. **Idempotencia Obligatoria**
   - Toda transacción debe tener un `idempotencyKey` único
   - El ledger tiene índice UNIQUE en `idempotencyKey`
   - Previene duplicados en caso de retries

3. **Proyecciones, No Mutación Directa**
   - ❌ **NUNCA** actualizar `customer_memberships.points` directamente
   - ✅ **SIEMPRE** crear transacciones en el ledger
   - ✅ Usar `BalanceProjectionService.recalculateBalance()` para actualizar proyecciones

4. **Validación en Repositorio**
   - `CustomerMembershipRepository.save()` valida y previene actualizaciones directas de `points`
   - Si se intenta actualizar `points` directamente, se ignora y se registra advertencia

### Flujo de Actualización de Puntos

```typescript
// ✅ CORRECTO: Crear transacción en ledger
const transaction = PointsTransaction.createEarning(
  membershipId,
  programId,
  points,
  idempotencyKey, // OBLIGATORIO para idempotencia
  sourceEventId,
  reason,
  metadata,
);
await pointsTransactionRepository.save(transaction);

// Sincronizar proyección automáticamente
await balanceSyncService.syncAfterTransaction(membershipId);

// ❌ INCORRECTO: Actualizar puntos directamente
membership.addPoints(points); // ⚠️ DEPRECATED - No usar
await membershipRepository.save(membership); // ⚠️ points será ignorado
```

### Ejemplo Completo: Acumular Puntos

```typescript
// libs/application/src/loyalty/process-loyalty-event/process-loyalty-event.handler.ts
@Injectable()
export class ProcessLoyaltyEventHandler {
  constructor(
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
    private readonly balanceSyncService: BalanceSyncService,
    private readonly tierCalculator: TierCalculatorHelper,
  ) {}

  async execute(request: ProcessLoyaltyEventRequest): Promise<ProcessLoyaltyEventResponse> {
    // 1. Calcular puntos según reglas del programa
    const pointsToAward = this.calculatePoints(
      request.amount,
      request.loyaltyProgram,
    );

    // 2. Generar idempotency key único
    const idempotencyKey = this.generateIdempotencyKey(
      request.membershipId,
      request.eventType,
      request.sourceEventId,
    );

    // 3. Crear transacción en el ledger
    const transaction = PointsTransaction.createEarning(
      request.membershipId,
      request.programId,
      pointsToAward,
      idempotencyKey,
      request.sourceEventId,
      `Points earned from ${request.eventType}`,
      {
        amount: request.amount,
        eventType: request.eventType,
        branchId: request.branchId,
      },
    );

    try {
      // 4. Guardar en ledger (idempotencia garantizada por BD)
      const savedTransaction = await this.pointsTransactionRepository.save(transaction);

      // 5. Sincronizar balance (proyección)
      await this.balanceSyncService.syncAfterTransaction(request.membershipId);

      // 6. Recalcular tier basado en nuevo balance
      await this.tierCalculator.recalculateTierFromLedger(request.membershipId);

      return new ProcessLoyaltyEventResponse(
        savedTransaction.id,
        pointsToAward,
        'SUCCESS',
      );

    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        // Transacción duplicada (idempotencyKey ya existe)
        // Esto es esperado en caso de retry
        return new ProcessLoyaltyEventResponse(
          null,
          pointsToAward,
          'DUPLICATE',
        );
      }
      throw error;
    }
  }

  private generateIdempotencyKey(
    membershipId: number,
    eventType: string,
    sourceEventId: string,
  ): string {
    return `${membershipId}-${eventType}-${sourceEventId}`;
  }
}
```

### Métodos Deprecados

Los siguientes métodos están deprecados y serán removidos:

```typescript
// ❌ DEPRECADOS
CustomerMembership.addPoints()
CustomerMembership.subtractPoints()
TierCalculatorHelper.addPointsAndRecalculateTier()
TierCalculatorHelper.subtractPointsAndRecalculateTier()
```

### Métodos Recomendados

```typescript
// ✅ USAR ESTOS
BalanceProjectionService.calculateMembershipBalance()
BalanceProjectionService.recalculateBalance()
BalanceSyncService.syncAfterTransaction()
TierCalculatorHelper.recalculateTierFromLedger()
```

### Ejemplo: Canjear Recompensa

```typescript
@Injectable()
export class RedeemRewardHandler {
  async execute(request: RedeemRewardRequest): Promise<RedeemRewardResponse> {
    // 1. Validar que el usuario tiene suficientes puntos
    const currentBalance = await this.balanceProjectionService
      .calculateMembershipBalance(request.membershipId);

    if (currentBalance < request.pointsCost) {
      throw new BadRequestException('Insufficient points');
    }

    // 2. Crear transacción de canje (débito)
    const redemptionTransaction = PointsTransaction.createRedeem(
      request.membershipId,
      request.programId,
      -request.pointsCost, // Negativo porque es débito
      `reward-redeem-${request.rewardId}-${Date.now()}`, // idempotencyKey
      request.rewardId.toString(),
      `Redeemed reward: ${request.rewardName}`,
      {
        rewardId: request.rewardId,
        rewardName: request.rewardName,
      },
    );

    // 3. Guardar en ledger
    await this.pointsTransactionRepository.save(redemptionTransaction);

    // 4. Crear código de canje
    const redemptionCode = await this.createRedemptionCode(
      request.membershipId,
      request.rewardId,
      redemptionTransaction.id,
    );

    // 5. Sincronizar balance
    await this.balanceSyncService.syncAfterTransaction(request.membershipId);

    // 6. Recalcular tier (balance cambió)
    await this.tierCalculator.recalculateTierFromLedger(request.membershipId);

    return new RedeemRewardResponse(
      redemptionCode.code,
      request.pointsCost,
      currentBalance - request.pointsCost,
    );
  }
}
```

---

## 🔄 Migraciones y Evolución

### Estrategias de Migración de Datos

#### 1. Migración de Estructura (Schema)

**TypeORM Migrations:**

```bash
# Generar migración desde cambios en entidades
npm run migration:generate libs/infrastructure/src/persistence/migrations/AddAvatarToUsers

# Crear migración manual
npm run migration:create libs/infrastructure/src/persistence/migrations/AddCustomIndex

# Ejecutar migraciones
npm run migration:run

# Revertir última migración
npm run migration:revert
```

**Ejemplo de Migración:**

```typescript
// libs/infrastructure/src/persistence/migrations/1234567890-AddAvatarToUsers.ts
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAvatarToUsers1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'avatar',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'avatar');
  }
}
```

#### 2. Migración de Datos (Data Migration)

**Usar Scripts Dedicados:**

```typescript
// libs/infrastructure/src/scripts/migrate-users-profile-to-table.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../apps/admin-api/src/admin-api.module';
import { DataSource } from 'typeorm';

async function migrateUsersProfile() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('Starting migration: users profile JSON → relational table');

  try {
    // 1. Obtener todos los usuarios con profile no vacío
    const users = await dataSource.query(`
      SELECT id, profile 
      FROM users 
      WHERE profile IS NOT NULL
    `);

    console.log(`Found ${users.length} users with profile data`);

    // 2. Procesar cada usuario
    for (const user of users) {
      const profile = JSON.parse(user.profile);
      
      // 3. Insertar en tabla normalizada
      await dataSource.query(`
        INSERT INTO user_profiles (user_id, language, theme, notifications)
        VALUES (?, ?, ?, ?)
      `, [
        user.id,
        profile.preferences?.language || 'en',
        profile.preferences?.theme || 'light',
        profile.preferences?.notifications ?? true,
      ]);

      console.log(`Migrated profile for user ${user.id}`);
    }

    console.log('✅ Migration completed successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

migrateUsersProfile();
```

**Ejecutar:**

```bash
ts-node -r tsconfig-paths/register libs/infrastructure/src/scripts/migrate-users-profile-to-table.ts
```

#### 3. Migración con Backward Compatibility

**Patrón: Columna Dual**

```typescript
// Paso 1: Agregar nueva columna (mantener antigua)
export class AddNewEmailColumn implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'email_verified',
        type: 'varchar',
        length: '255',
        isNullable: true, // Permitir null temporalmente
      }),
    );
  }
}

// Paso 2: Código que escribe en ambas columnas
class User {
  @Column('varchar', { length: 255 })
  email: string; // Antigua

  @Column('varchar', { length: 255, nullable: true })
  emailVerified: string | null; // Nueva

  changeEmail(newEmail: string): User {
    return new User(
      /* ... */,
      newEmail, // Escribir en ambas
      newEmail,
    );
  }
}

// Paso 3: Migrar datos existentes
export class MigrateEmailToEmailVerified implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE users 
      SET email_verified = email 
      WHERE email_verified IS NULL
    `);
  }
}

// Paso 4: Código que lee de nueva columna (pero sigue escribiendo en ambas)
const email = user.emailVerified || user.email; // Leer de nueva, fallback a antigua

// Paso 5 (después de despliegue): Hacer nueva columna NOT NULL
export class MakeEmailVerifiedNotNull implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'users',
      'email_verified',
      new TableColumn({
        name: 'email_verified',
        type: 'varchar',
        length: '255',
        isNullable: false, // ← Ahora NOT NULL
      }),
    );
  }
}

// Paso 6 (mucho después): Eliminar columna antigua
export class DropOldEmailColumn implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'email');
  }
}
```

### Evolución de la Arquitectura

#### Agregar Nueva Capa (ej: CQRS)

```
Antes:
Handler → Repository → Database

Después (con CQRS):
Command Handler → Repository → Database (writes)
Query Handler → Read Model → Database (reads)
```

**Implementación:**

```typescript
// libs/application/src/users/queries/get-user.query.ts
export class GetUserQuery {
  constructor(public readonly userId: number) {}
}

// libs/application/src/users/queries/get-user.query-handler.ts
@Injectable()
export class GetUserQueryHandler {
  constructor(
    @Inject('IUserReadModel')
    private readonly userReadModel: IUserReadModel, // Read-only interface
  ) {}

  async execute(query: GetUserQuery): Promise<GetUserResponse> {
    // Optimizado para lectura (puede usar vistas, índices específicos, cache, etc.)
    return this.userReadModel.findById(query.userId);
  }
}

// libs/infrastructure/src/persistence/read-models/user.read-model.ts
@Injectable()
export class UserReadModel implements IUserReadModel {
  async findById(userId: number): Promise<GetUserResponse> {
    // Query optimizado para lectura
    // Puede usar vistas materializadas, cache, etc.
  }
}
```

---

## ⚡ Performance y Optimización

### 1. Índices de Base de Datos

**Reglas:**
- ✅ Indexar columnas usadas en WHERE
- ✅ Indexar columnas usadas en JOIN
- ✅ Indexar columnas usadas en ORDER BY
- ✅ Índices compuestos para queries con múltiples condiciones

**Ejemplo:**

```typescript
@Entity('users')
@Index(['email'], { unique: true }) // ← Búsqueda por email
@Index(['tenantId', 'isActive']) // ← Filtro común: tenant + activo
@Index(['roles']) // ← Búsqueda por rol
@Index(['createdAt']) // ← Ordenamiento por fecha
export class UserEntity {
  // ...
}
```

**Verificar uso de índices:**

```sql
-- Explicar query
EXPLAIN SELECT * FROM users WHERE tenant_id = 1 AND is_active = 1;

-- Ver índices de tabla
SHOW INDEX FROM users;
```

### 2. N+1 Problem

**❌ MAL** (N+1 queries):

```typescript
// 1 query para obtener users
const users = await this.userRepository.findAll();

// N queries (una por cada user)
for (const user of users) {
  user.orders = await this.orderRepository.findByUserId(user.id); // ❌
}
```

**✅ BIEN** (1 query con JOIN):

```typescript
const users = await this.userRepository
  .createQueryBuilder('user')
  .leftJoinAndSelect('user.orders', 'orders') // ← JOIN
  .getMany();
```

### 3. Paginación

```typescript
async findAll(filters: {
  page?: number;
  limit?: number;
}): Promise<{ users: User[]; total: number }> {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 10, 100); // ← Máximo 100
  const skip = (page - 1) * limit;

  const [entities, total] = await this.userRepository.findAndCount({
    skip,
    take: limit,
    order: { createdAt: 'DESC' },
  });

  return {
    users: UserMapper.toDomainMany(entities),
    total,
  };
}
```

### 4. Caching

**Estrategia:**

```typescript
// libs/infrastructure/src/cache/cache.service.ts
@Injectable()
export class CacheService {
  private cache = new Map<string, { value: any; expiry: number }>();

  set(key: string, value: any, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

// Uso en repositorio
async findById(id: number): Promise<User | null> {
  const cacheKey = `user:${id}`;
  
  // 1. Intentar obtener del cache
  const cached = this.cacheService.get(cacheKey);
  if (cached) {
    return UserMapper.toDomain(cached);
  }

  // 2. Si no está en cache, consultar BD
  const entity = await this.userRepository.findOne({ where: { id } });
  if (!entity) return null;

  // 3. Guardar en cache (TTL: 5 minutos)
  this.cacheService.set(cacheKey, entity, 300);

  return UserMapper.toDomain(entity);
}
```

### 5. Batch Operations

**❌ MAL** (N queries):

```typescript
for (const userId of userIds) {
  await this.userRepository.delete(userId); // ❌ N queries
}
```

**✅ BIEN** (1 query):

```typescript
await this.userRepository.delete(userIds); // ✅ 1 query
// DELETE FROM users WHERE id IN (1, 2, 3, 4, 5)
```

### 6. Select Específico (No SELECT *)

**❌ MAL**:

```typescript
const users = await this.userRepository.find(); // SELECT * FROM users
```

**✅ BIEN**:

```typescript
const users = await this.userRepository
  .createQueryBuilder('user')
  .select(['user.id', 'user.email', 'user.name']) // ← Solo campos necesarios
  .getMany();
```

---

## 🔍 Troubleshooting Arquitectónico

### Problema 1: Dependencia Circular

**Síntoma:**
```
Error: Cannot resolve dependencies of UserService (?). Please make sure that the argument dependency at index [0] is available.
```

**Causa:** Módulo A importa Módulo B, y Módulo B importa Módulo A.

**Solución:**

1. **Usar `forwardRef()`**:
   ```typescript
   @Module({
     imports: [forwardRef(() => OrderModule)],
     providers: [UserService],
   })
   export class UserModule {}
   ```

2. **Mejor: Refactorizar**
   - Extraer lógica compartida a un tercer módulo
   - Usar eventos para desacoplar

### Problema 2: Mapper Falla con Relaciones

**Síntoma:**
```
TypeError: Cannot read property 'id' of undefined
```

**Causa:** Entidad de persistencia tiene relaciones no cargadas (lazy).

**Solución:**

```typescript
// ❌ MAL
const user = await this.userRepository.findOne({ where: { id } });
// user.orders es undefined (relación lazy)

// ✅ BIEN: Eager loading
const user = await this.userRepository.findOne({
  where: { id },
  relations: ['orders'], // ← Cargar relación
});

// ✅ BIEN: Query builder con join
const user = await this.userRepository
  .createQueryBuilder('user')
  .leftJoinAndSelect('user.orders', 'orders')
  .where('user.id = :id', { id })
  .getOne();

// Mapper debe manejar null
static toDomain(entity: UserEntity): User {
  return new User(
    entity.id,
    entity.email,
    entity.orders?.map(o => o.id) || [], // ← Handle undefined
  );
}
```

### Problema 3: Handler Lento

**Síntoma:** Handler tarda mucho en ejecutarse.

**Diagnóstico:**

```typescript
@Injectable()
export class CreateUserHandler {
  async execute(request: CreateUserRequest): Promise<CreateUserResponse> {
    const start = Date.now();

    console.log('1. Checking email...');
    const existing = await this.userRepository.findByEmail(request.email);
    console.log(`   Took: ${Date.now() - start}ms`);

    console.log('2. Hashing password...');
    const hashed = await bcrypt.hash(request.password, 10);
    console.log(`   Took: ${Date.now() - start}ms`);

    console.log('3. Saving user...');
    const saved = await this.userRepository.save(/* ... */);
    console.log(`   Took: ${Date.now() - start}ms`);

    return /* ... */;
  }
}
```

**Optimizaciones:**
1. Reducir rounds de bcrypt (10 → 8)
2. Agregar índice a email
3. Usar cache para existsByEmail
4. Mover envío de email a evento asíncrono

### Problema 4: Memory Leak en Producción

**Síntoma:** Uso de memoria crece indefinidamente.

**Causas Comunes:**
1. ❌ Cache sin límite de tamaño
2. ❌ Event listeners no removidos
3. ❌ Conexiones a BD no cerradas
4. ❌ Timers no cancelados

**Solución:**

```typescript
// ❌ MAL: Cache ilimitado
private cache = new Map<string, any>();

set(key: string, value: any): void {
  this.cache.set(key, value); // ❌ Crece indefinidamente
}

// ✅ BIEN: Cache con límite LRU
import LRU from 'lru-cache';

private cache = new LRU({
  max: 1000, // ← Máximo 1000 entradas
  ttl: 1000 * 60 * 5, // ← TTL 5 minutos
});
```

---

## ✅ Mejores Prácticas

### 1. Mantener el Dominio Puro

❌ **MAL**:
```typescript
import { Entity, Column } from 'typeorm'; // ❌ TypeORM en dominio

@Entity('users') // ❌
export class User {
  @Column() // ❌
  email: string;
}
```

✅ **BIEN**:
```typescript
// ✅ TypeScript puro
export class User {
  constructor(
    public readonly email: string,
  ) {}
}
```

### 2. Siempre Usar Mappers

❌ **MAL**:
```typescript
async findById(id: number): Promise<UserEntity> { // ❌ Retorna entity de persistencia
  return await this.repository.findOne({ where: { id } });
}
```

✅ **BIEN**:
```typescript
async findById(id: number): Promise<User | null> { // ✅ Retorna domain entity
  const entity = await this.repository.findOne({ where: { id } });
  return entity ? UserMapper.toDomain(entity) : null;
}
```

### 3. Inmutabilidad en Dominio

❌ **MAL**:
```typescript
user.email = 'new@email.com'; // ❌ Mutación
await repository.save(user);
```

✅ **BIEN**:
```typescript
const updatedUser = user.changeEmail('new@email.com'); // ✅ Nueva instancia
await repository.update(updatedUser);
```

### 4. Validaciones en el Lugar Correcto

| Tipo de Validación | Dónde |
|---------------------|-------|
| Formato (email, longitud) | DTO (class-validator) |
| Reglas de negocio simples | Domain Entity |
| Reglas de negocio complejas | Handler |
| Unicidad (DB constraints) | Repository/Handler |

```typescript
// DTO: Formato
@IsEmail()
email: string;

// Domain: Regla de negocio simple
static create(email: string): User {
  if (!email.includes('@')) throw new Error('Invalid email');
  // ...
}

// Handler: Regla de negocio compleja
async execute(request: CreateUserRequest) {
  const existing = await this.repo.findByEmail(request.email);
  if (existing) throw new ConflictException('Email already exists');
  // ...
}
```

### 5. Nomenclatura Consistente

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| **Entities (Domain)** | Sustantivo | `User`, `Order`, `Product` |
| **Entities (Persistence)** | Sustantivo + Entity | `UserEntity`, `OrderEntity` |
| **Handlers** | Verbo + Sustantivo + Handler | `CreateUserHandler` |
| **DTOs Request** | Verbo + Sustantivo + Request | `CreateUserRequest` |
| **DTOs Response** | Verbo + Sustantivo + Response | `CreateUserResponse` |
| **Repositories** | Sustantivo + Repository | `UserRepository` |
| **Mappers** | Sustantivo + Mapper | `UserMapper` |
| **Controllers** | Sustantivo plural + Controller | `UsersController` |

### 6. Manejo de Errores

```typescript
// Domain: Throw Error simple
static create(email: string): User {
  if (!email) {
    throw new Error('Email is required'); // ✅ Error simple
  }
  // ...
}

// Application: Throw HttpException
async execute(request: CreateUserRequest) {
  const existing = await this.repo.findByEmail(request.email);
  if (existing) {
    throw new ConflictException('Email already exists'); // ✅ HTTP exception
  }
  // ...
}

// Infrastructure: Catch y transformar errores
async save(user: User): Promise<User> {
  try {
    // ...
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('Duplicate entry'); // ✅ Transformar error de DB
    }
    throw new InternalServerErrorException('Database error');
  }
}
```

### 7. Documentación de Código

```typescript
/**
 * Crea un nuevo usuario en el sistema.
 * 
 * Reglas de negocio:
 * - El email debe ser único
 * - La contraseña debe tener al menos 6 caracteres
 * - Los usuarios nuevos están activos por defecto
 * 
 * @param email - Email del usuario (único)
 * @param name - Nombre completo
 * @param password - Contraseña en texto plano (será hasheada)
 * @returns Nueva instancia de User con ID = 0 (será asignado por BD)
 * @throws Error si el email es inválido
 * @throws Error si el nombre es muy corto
 */
static create(email: string, name: string, password: string): User {
  // ...
}
```

---

## 📚 Recursos Adicionales

### Documentación Relacionada

- [API-GUIDELINE.md](./API-GUIDELINE.md) - Guía completa para crear APIs
- [CODING-GUIDELINE.md](./CODING-GUIDELINE.md) - Estándares de código
- [DATABASE.md](./DATABASE.md) - Configuración de base de datos
- [DOCKER.md](./DOCKER.md) - Guía de Docker

### Libros Recomendados

- **Domain-Driven Design** - Eric Evans
- **Implementing Domain-Driven Design** - Vaughn Vernon
- **Clean Architecture** - Robert C. Martin
- **Patterns of Enterprise Application Architecture** - Martin Fowler

### Recursos Online

- [Domain-Driven Design (DDD)](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)

---

## 📝 Historial de Cambios

| Versión | Fecha | Cambios |
|---------|-------|---------|
| **v2.0** | 2026-02-06 | Versión mejorada con secciones adicionales |
| **v1.0** | 2025-01-28 | Versión inicial |

---

**Última actualización**: 2026-02-06  
**Versión**: 2.0  
**Mantenedor**: Equipo de Desarrollo TuLealtApp

---

<div align="center">

**¿Preguntas sobre la arquitectura?**

Consulta la [documentación completa](./README.md) o contacta al equipo de desarrollo.

</div>
