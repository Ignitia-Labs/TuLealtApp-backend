# Arquitectura del Proyecto TuLealtApp Backend

Este documento explica en detalle la arquitectura del proyecto TuLealtApp Backend, basada en **Domain-Driven Design (DDD)** y **Arquitectura Hexagonal (Ports & Adapters)**.

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Principios de Arquitectura](#principios-de-arquitectura)
3. [Capas de la Arquitectura](#capas-de-la-arquitectura)
4. [Flujo de Datos](#flujo-de-datos)
5. [Componentes Detallados](#componentes-detallados)
6. [Ejemplos Prácticos](#ejemplos-prácticos)
7. [Mejores Prácticas](#mejores-prácticas)

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
- ✅ **APIs** dependen de **Application** y **Infrastructure**

### Separación de Responsabilidades

Cada capa tiene una responsabilidad específica:

- **Domain**: Lógica de negocio pura
- **Application**: Orquestación de casos de uso
- **Infrastructure**: Implementaciones técnicas
- **APIs**: Puntos de entrada HTTP

---

## 🏗️ Capas de la Arquitectura

### 1. Domain Layer (`libs/domain/`)

**¿Qué es?** La capa más interna, contiene la **lógica de negocio pura** sin dependencias externas.

**¿Para qué sirve?**
- Define las **entidades de negocio** (User, Partner, Reward, etc.)
- Contiene la **lógica de dominio** (métodos de negocio)
- Define **interfaces de repositorios** (contratos)
- Establece las **reglas de negocio** del sistema

**Características**:
- ✅ **Sin dependencias externas**: No usa TypeORM, NestJS, ni ninguna librería de framework
- ✅ **Clases puras**: Solo TypeScript puro
- ✅ **Inmutabilidad**: Las entidades son inmutables (readonly)
- ✅ **Métodos de dominio**: Contienen lógica de negocio

**Estructura**:
```
libs/domain/src/
├── entities/              # Entidades de dominio
│   ├── user.entity.ts
│   ├── partner.entity.ts
│   ├── reward.entity.ts
│   └── ...
└── repositories/         # Interfaces de repositorios
    ├── user.repository.interface.ts
    ├── partner.repository.interface.ts
    └── ...
```

#### Entidades de Dominio

**Ejemplo: `User`**

```typescript
// libs/domain/src/entities/user.entity.ts
export class User {
  constructor(
    public readonly id: number,
    public readonly email: string,
    public readonly name: string,
    // ... más campos readonly
  ) {}

  // Método de dominio: lógica de negocio
  suspend(): User {
    return new User(
      this.id,
      this.email,
      this.name,
      // ... otros campos
      'suspended', // nuevo status
      this.updatedAt,
    );
  }

  // Factory method para crear nuevos usuarios
  static create(
    email: string,
    name: string,
    // ... parámetros
  ): User {
    // Validaciones de dominio
    if (!email.includes('@')) {
      throw new Error('Invalid email');
    }
    // Crear y retornar nueva instancia
  }
}
```

**Características importantes**:
- Todos los campos son `readonly` (inmutabilidad)
- Métodos de dominio retornan nuevas instancias (no mutan el objeto)
- Validaciones de negocio dentro de la entidad
- Sin decoradores de TypeORM ni NestJS

#### Interfaces de Repositorios

**Ejemplo: `IUserRepository`**

```typescript
// libs/domain/src/repositories/user.repository.interface.ts
import { User } from '../entities/user.entity';

export interface IUserRepository {
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  update(user: User): Promise<User>;
  delete(id: number): Promise<void>;
}
```

**¿Por qué interfaces?**
- Define el **contrato** que debe cumplir cualquier implementación
- Permite cambiar la implementación (TypeORM, MongoDB, etc.) sin afectar el dominio
- Facilita testing con mocks

---

### 2. Application Layer (`libs/application/`)

**¿Qué es?** La capa que **orquesta los casos de uso** y coordina entre dominio e infraestructura.

**¿Para qué sirve?**
- Implementa **casos de uso específicos** (CreateUser, GetRewards, etc.)
- Define **DTOs** (Data Transfer Objects) para entrada/salida
- Coordina llamadas a repositorios y servicios
- Valida datos de entrada
- Maneja transacciones y errores

**Características**:
- ✅ Depende solo de **Domain**
- ✅ Usa **Dependency Injection** de NestJS
- ✅ Cada caso de uso tiene su propio handler
- ✅ DTOs separados para Request y Response

**Estructura**:
```
libs/application/src/
├── users/
│   ├── create-user/
│   │   ├── create-user.handler.ts      # Lógica del caso de uso
│   │   ├── create-user.request.ts      # DTO de entrada
│   │   └── create-user.response.ts     # DTO de salida
│   ├── get-user-profile/
│   │   └── ...
│   └── ...
├── rewards/
│   ├── create-reward/
│   └── get-rewards/
└── ...
```

#### Handlers (Casos de Uso)

**Ejemplo: `CreateUserHandler`**

```typescript
// libs/application/src/users/create-user/create-user.handler.ts
import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository, User } from '@libs/domain';
import { CreateUserRequest } from './create-user.request';
import { CreateUserResponse } from './create-user.response';

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
      throw new Error('User already exists');
    }

    // 2. Crear entidad de dominio usando factory method
    const user = User.create(
      request.email,
      request.name,
      // ... otros campos
    );

    // 3. Guardar usando el repositorio
    const savedUser = await this.userRepository.save(user);

    // 4. Retornar DTO de respuesta
    return new CreateUserResponse(
      savedUser.id,
      savedUser.email,
      // ... otros campos
    );
  }
}
```

**Flujo típico de un Handler**:
1. Validar datos de entrada
2. Consultar repositorios si es necesario
3. Crear/modificar entidades de dominio
4. Guardar cambios
5. Retornar DTO de respuesta

#### DTOs (Data Transfer Objects)

**Request DTO**:
```typescript
// libs/application/src/users/create-user/create-user.request.ts
import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserRequest {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  name: string;
  // ... más campos
}
```

**Response DTO**:
```typescript
// libs/application/src/users/create-user/create-user.response.ts
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'user@example.com' })
  email: string;
  // ... más campos
}
```

---

### 3. Infrastructure Layer (`libs/infrastructure/`)

**¿Qué es?** La capa que implementa los **detalles técnicos** y se conecta con sistemas externos.

**¿Para qué sirve?**
- Implementa repositorios usando TypeORM
- Define entidades de persistencia (con decoradores TypeORM)
- Crea mappers para convertir entre dominio y persistencia
- Maneja migraciones de base de datos
- Integra con servicios externos (S3, APIs, etc.)

**Características**:
- ✅ Depende de **Domain** y **Application**
- ✅ Usa TypeORM para persistencia
- ✅ Implementa interfaces definidas en Domain
- ✅ Maneja detalles técnicos (SQL, HTTP, etc.)

**Estructura**:
```
libs/infrastructure/src/
├── persistence/
│   ├── entities/              # Entidades TypeORM
│   │   ├── user.entity.ts
│   │   └── ...
│   ├── mappers/               # Convertidores dominio ↔ persistencia
│   │   ├── user.mapper.ts
│   │   └── ...
│   ├── repositories/          # Implementaciones de repositorios
│   │   ├── user.repository.ts
│   │   └── ...
│   └── migrations/            # Migraciones de BD
├── storage/                   # Integración con S3
└── seeds/                     # Datos iniciales
```

#### Entidades de Persistencia

**Ejemplo: `UserEntity`**

```typescript
// libs/infrastructure/src/persistence/entities/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 255, unique: true })
  email: string;

  @Column('varchar', { length: 255 })
  name: string;

  // ... más columnas con decoradores TypeORM
}
```

**Diferencias con entidades de dominio**:
- ✅ Usa decoradores de TypeORM (`@Entity`, `@Column`, etc.)
- ✅ Puede tener campos opcionales para relaciones lazy
- ✅ Estructura optimizada para base de datos
- ❌ NO contiene lógica de negocio

#### Mappers

**¿Qué son?** Clases que convierten entre entidades de dominio y entidades de persistencia.

**¿Por qué existen?**
- El dominio y la persistencia tienen estructuras diferentes
- Permiten mantener el dominio puro (sin decoradores TypeORM)
- Facilitan cambios en la estructura de BD sin afectar el dominio

**Ejemplo: `UserMapper`**

```typescript
// libs/infrastructure/src/persistence/mappers/user.mapper.ts
import { User } from '@libs/domain';
import { UserEntity } from '../entities/user.entity';

export class UserMapper {
  /**
   * Convierte entidad de persistencia → entidad de dominio
   */
  static toDomain(entity: UserEntity): User {
    return new User(
      entity.id,
      entity.email,
      entity.name,
      // ... mapear todos los campos
    );
  }

  /**
   * Convierte entidad de dominio → entidad de persistencia
   */
  static toPersistence(domain: User): Partial<UserEntity> {
    return {
      id: domain.id,
      email: domain.email,
      name: domain.name,
      // ... mapear todos los campos
    };
  }
}
```

**Flujo de conversión**:
```
Base de Datos → UserEntity → UserMapper.toDomain() → User (Domain)
User (Domain) → UserMapper.toPersistence() → UserEntity → Base de Datos
```

#### Repositorios (Implementaciones)

**Ejemplo: `UserRepository`**

```typescript
// libs/infrastructure/src/persistence/repositories/user.repository.ts
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    // 1. Consultar base de datos usando TypeORM
    const entity = await this.userRepository.findOne({ where: { id } });

    if (!entity) {
      return null;
    }

    // 2. Convertir a entidad de dominio usando mapper
    return UserMapper.toDomain(entity);
  }

  async save(user: User): Promise<User> {
    // 1. Convertir dominio → persistencia
    const entityData = UserMapper.toPersistence(user);

    // 2. Guardar en BD
    const savedEntity = await this.userRepository.save(entityData);

    // 3. Convertir persistencia → dominio
    return UserMapper.toDomain(savedEntity);
  }
}
```

**Características**:
- ✅ Implementa la interfaz definida en Domain
- ✅ Usa TypeORM para acceso a BD
- ✅ Siempre convierte usando mappers
- ✅ Retorna entidades de dominio, nunca entidades de persistencia

---

### 4. APIs Layer (`apps/`)

**¿Qué es?** Los puntos de entrada HTTP del sistema, expuestos como APIs REST.

**¿Para qué sirve?**
- Expone endpoints HTTP
- Maneja autenticación y autorización
- Valida requests usando DTOs
- Documenta APIs con Swagger
- Maneja errores HTTP

**Estructura**:
```
apps/
├── admin-api/              # API para administradores
│   ├── src/
│   │   ├── controllers/   # Controladores HTTP
│   │   ├── auth/          # Autenticación
│   │   └── main.ts        # Bootstrap
├── partner-api/            # API para partners
└── customer-api/           # API para clientes
```

#### Controladores

**Ejemplo: `UsersController`**

```typescript
// apps/admin-api/src/controllers/users.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateUserHandler, CreateUserRequest, CreateUserResponse } from '@libs/application';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserHandler: CreateUserHandler,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear usuario' })
  @ApiResponse({ status: 201, type: CreateUserResponse })
  async create(@Body() request: CreateUserRequest): Promise<CreateUserResponse> {
    return this.createUserHandler.execute(request);
  }
}
```

**Responsabilidades**:
- ✅ Recibir requests HTTP
- ✅ Validar datos usando DTOs
- ✅ Llamar a handlers
- ✅ Retornar respuestas HTTP
- ✅ Documentar con Swagger

---

## 🔄 Flujo de Datos

### Ejemplo Completo: Crear un Usuario

```
1. Cliente HTTP
   POST /admin/users
   { "email": "user@example.com", "name": "John Doe" }
   │
   ▼
2. UsersController (API Layer)
   - Valida request con CreateUserRequest DTO
   - Llama a CreateUserHandler
   │
   ▼
3. CreateUserHandler (Application Layer)
   - Valida que email no exista (consulta IUserRepository)
   - Crea entidad User usando User.create()
   - Guarda usando IUserRepository.save()
   │
   ▼
4. UserRepository (Infrastructure Layer)
   - Convierte User → UserEntity usando UserMapper
   - Guarda en BD usando TypeORM
   - Convierte UserEntity → User usando UserMapper
   │
   ▼
5. CreateUserHandler (Application Layer)
   - Recibe User guardado
   - Crea CreateUserResponse DTO
   │
   ▼
6. UsersController (API Layer)
   - Retorna CreateUserResponse como JSON
   │
   ▼
7. Cliente HTTP
   Recibe: { "id": 1, "email": "user@example.com", ... }
```

### Diagrama de Flujo

```
┌─────────────┐
│ HTTP Client │
└──────┬──────┘
       │ POST /users
       ▼
┌─────────────────┐
│ UsersController │ (API Layer)
└──────┬──────────┘
       │ execute(request)
       ▼
┌──────────────────┐
│ CreateUserHandler│ (Application Layer)
└──────┬───────────┘
       │ findByEmail() / save()
       ▼
┌─────────────────┐
│ IUserRepository │ (Domain Interface)
└──────┬──────────┘
       │ (implementado por)
       ▼
┌─────────────────┐
│ UserRepository  │ (Infrastructure Layer)
└──────┬──────────┘
       │ TypeORM queries
       ▼
┌─────────────────┐
│   Database      │
└─────────────────┘
```

---

## 🧩 Componentes Detallados

### Mappers: ¿Por qué son necesarios?

**Problema**: Las entidades de dominio y persistencia tienen estructuras diferentes:

```typescript
// Domain: User (sin decoradores, campos readonly)
class User {
  constructor(
    public readonly id: number,
    public readonly email: string,
    // ...
  ) {}
}

// Persistence: UserEntity (con decoradores TypeORM, campos mutables)
@Entity('users')
class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar')
  email: string;
  // ...
}
```

**Solución**: Mappers convierten entre ambos:

```typescript
UserMapper.toDomain(entity)      // UserEntity → User
UserMapper.toPersistence(domain)  // User → Partial<UserEntity>
```

**Beneficios**:
- ✅ Dominio permanece puro (sin decoradores)
- ✅ Cambios en BD no afectan dominio
- ✅ Fácil cambiar de TypeORM a MongoDB, etc.

### Repositorios: Patrón Repository

**¿Qué es?** Abstracción que oculta los detalles de acceso a datos.

**Interfaz (Domain)**:
```typescript
interface IUserRepository {
  findById(id: number): Promise<User | null>;
  save(user: User): Promise<User>;
}
```

**Implementación (Infrastructure)**:
```typescript
class UserRepository implements IUserRepository {
  // Usa TypeORM internamente
  async findById(id: number): Promise<User | null> {
    const entity = await this.typeormRepo.findOne({ where: { id } });
    return entity ? UserMapper.toDomain(entity) : null;
  }
}
```

**Beneficios**:
- ✅ Cambiar de TypeORM a MongoDB solo requiere nueva implementación
- ✅ Fácil hacer mocks para testing
- ✅ Dominio no sabe cómo se persisten los datos

### Handlers: Casos de Uso

**Cada handler representa un caso de uso específico**:

- `CreateUserHandler` → Crear usuario
- `GetRewardsHandler` → Obtener recompensas
- `MarkNotificationReadHandler` → Marcar notificación como leída

**Estructura estándar**:
```typescript
@Injectable()
export class CreateUserHandler {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: CreateUserRequest): Promise<CreateUserResponse> {
    // 1. Validaciones
    // 2. Lógica de negocio (usando entidades de dominio)
    // 3. Persistencia (usando repositorios)
    // 4. Retornar respuesta
  }
}
```

---

## 💡 Ejemplos Prácticos

### Ejemplo 1: Agregar un Campo a User

**Paso 1**: Actualizar entidad de dominio
```typescript
// libs/domain/src/entities/user.entity.ts
export class User {
  constructor(
    // ... campos existentes
    public readonly avatar: string | null, // ← NUEVO CAMPO
  ) {}
}
```

**Paso 2**: Actualizar entidad de persistencia
```typescript
// libs/infrastructure/src/persistence/entities/user.entity.ts
@Entity('users')
export class UserEntity {
  // ... columnas existentes
  @Column('text', { nullable: true })
  avatar: string | null; // ← NUEVO CAMPO
}
```

**Paso 3**: Actualizar mapper
```typescript
// libs/infrastructure/src/persistence/mappers/user.mapper.ts
static toDomain(entity: UserEntity): User {
  return new User(
    // ... campos existentes
    entity.avatar, // ← NUEVO CAMPO
  );
}
```

**Paso 4**: Crear migración
```bash
npm run migration:generate AddAvatarToUsers
```

### Ejemplo 2: Crear Nueva Feature (Reward)

**1. Entidad de Dominio**:
```typescript
// libs/domain/src/entities/reward.entity.ts
export class Reward {
  constructor(
    public readonly id: number,
    public readonly tenantId: number,
    public readonly name: string,
    // ...
  ) {}
}
```

**2. Interfaz de Repositorio**:
```typescript
// libs/domain/src/repositories/reward.repository.interface.ts
export interface IRewardRepository {
  findById(id: number): Promise<Reward | null>;
  save(reward: Reward): Promise<Reward>;
}
```

**3. Entidad de Persistencia**:
```typescript
// libs/infrastructure/src/persistence/entities/reward.entity.ts
@Entity('rewards')
export class RewardEntity {
  @PrimaryGeneratedColumn()
  id: number;
  // ...
}
```

**4. Mapper**:
```typescript
// libs/infrastructure/src/persistence/mappers/reward.mapper.ts
export class RewardMapper {
  static toDomain(entity: RewardEntity): Reward { /* ... */ }
  static toPersistence(domain: Reward): Partial<RewardEntity> { /* ... */ }
}
```

**5. Repositorio**:
```typescript
// libs/infrastructure/src/persistence/repositories/reward.repository.ts
@Injectable()
export class RewardRepository implements IRewardRepository {
  // Implementar métodos
}
```

**6. Handler**:
```typescript
// libs/application/src/rewards/create-reward/create-reward.handler.ts
@Injectable()
export class CreateRewardHandler {
  constructor(
    @Inject('IRewardRepository')
    private readonly rewardRepository: IRewardRepository,
  ) {}
  // ...
}
```

**7. Controlador**:
```typescript
// apps/admin-api/src/controllers/rewards.controller.ts
@Controller('rewards')
export class RewardsController {
  // ...
}
```

---

## ✅ Mejores Prácticas

### 1. Mantener el Dominio Puro

❌ **MAL**: Decoradores TypeORM en dominio
```typescript
// ❌ NO hacer esto en domain
@Entity('users')
export class User {
  @Column()
  email: string;
}
```

✅ **BIEN**: Dominio sin decoradores
```typescript
// ✅ Hacer esto en domain
export class User {
  constructor(
    public readonly email: string,
  ) {}
}
```

### 2. Siempre Usar Mappers

❌ **MAL**: Retornar entidades de persistencia
```typescript
async findById(id: number): Promise<UserEntity> { // ❌
  return await this.repository.findOne({ where: { id } });
}
```

✅ **BIEN**: Convertir a dominio
```typescript
async findById(id: number): Promise<User | null> { // ✅
  const entity = await this.repository.findOne({ where: { id } });
  return entity ? UserMapper.toDomain(entity) : null;
}
```

### 3. Inmutabilidad en Dominio

❌ **MAL**: Mutar objetos
```typescript
user.email = 'new@email.com'; // ❌
```

✅ **BIEN**: Crear nueva instancia
```typescript
const updatedUser = user.updateEmail('new@email.com'); // ✅
```

### 4. Dependencias Correctas

❌ **MAL**: Domain depende de Infrastructure
```typescript
// ❌ NO hacer esto
import { UserEntity } from '@libs/infrastructure';
```

✅ **BIEN**: Infrastructure depende de Domain
```typescript
// ✅ Hacer esto
import { User } from '@libs/domain';
```

### 5. Testing

**Testear dominio sin infraestructura**:
```typescript
// Test de dominio (sin BD, sin TypeORM)
describe('User', () => {
  it('should suspend user', () => {
    const user = User.create('test@example.com', 'Test');
    const suspended = user.suspend();
    expect(suspended.status).toBe('suspended');
  });
});
```

**Testear handlers con mocks**:
```typescript
// Test de handler (mock del repositorio)
describe('CreateUserHandler', () => {
  it('should create user', async () => {
    const mockRepo = {
      findByEmail: jest.fn().resolves(null),
      save: jest.fn().resolves(user),
    };
    const handler = new CreateUserHandler(mockRepo);
    // ...
  });
});
```

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

1. **Inmutabilidad del Ledger**: El ledger es de solo escritura (INSERT). Nunca se actualiza ni elimina una transacción existente.

2. **Idempotencia Obligatoria**: Toda transacción debe tener un `idempotencyKey` único. El ledger tiene un índice UNIQUE en `idempotencyKey` para garantizar idempotencia.

3. **Proyecciones, No Mutación Directa**:
   - ❌ **NUNCA** actualizar `customer_memberships.points` directamente
   - ✅ **SIEMPRE** crear transacciones en el ledger
   - ✅ Usar `BalanceProjectionService.recalculateBalance()` para actualizar proyecciones

4. **Validación en Repositorio**: El método `CustomerMembershipRepository.save()` valida y previene actualizaciones directas de `points`. Si se intenta actualizar `points` directamente, se ignora el cambio y se registra una advertencia.

### Flujo de Actualización de Puntos

```typescript
// ✅ CORRECTO: Crear transacción en ledger
const transaction = PointsTransaction.createEarning(
  membershipId,
  programId,
  points,
  idempotencyKey,
  sourceEventId,
  // ... otros parámetros
);
await pointsTransactionRepository.save(transaction);

// Sincronizar proyección automáticamente
await balanceSyncService.syncAfterTransaction(membershipId);

// ❌ INCORRECTO: Actualizar puntos directamente
membership.addPoints(points); // ⚠️ DEPRECATED - No usar
await membershipRepository.save(membership); // ⚠️ points será ignorado
```

### Métodos Deprecados

Los siguientes métodos están deprecados y serán removidos en versiones futuras:

- `CustomerMembership.addPoints()` - Use ledger + `BalanceProjectionService`
- `CustomerMembership.subtractPoints()` - Use ledger + `BalanceProjectionService`
- `TierCalculatorHelper.addPointsAndRecalculateTier()` - Use ledger + `recalculateTierFromLedger()`
- `TierCalculatorHelper.subtractPointsAndRecalculateTier()` - Use ledger + `recalculateTierFromLedger()`

### Métodos Recomendados

- `BalanceProjectionService.calculateMembershipBalance()` - Calcula balance desde ledger
- `BalanceProjectionService.recalculateBalance()` - Recalcula y actualiza proyección
- `BalanceSyncService.syncAfterTransaction()` - Sincroniza después de crear transacción
- `TierCalculatorHelper.recalculateTierFromLedger()` - Recalcula tier basado en balance del ledger

### Migración de Código Existente

Si tienes código que actualiza puntos directamente:

1. **Identificar**: Buscar usos de `addPoints()`, `subtractPoints()`, o actualización directa de `points`
2. **Refactorizar**: Cambiar para crear transacciones en el ledger primero
3. **Sincronizar**: Llamar a `BalanceSyncService.syncAfterTransaction()` después de crear transacciones
4. **Validar**: Verificar que las proyecciones se actualizan correctamente

### Documentación Adicional

- Ver `PLAN-IMPLEMENTACION-TIPOS-RECOMPENSA.md` para detalles completos del sistema
- Ver `ANALISIS-ACUMULACION-PUNTOS.md` para análisis técnico detallado

---

## 📚 Recursos Adicionales

- [Domain-Driven Design (DDD)](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)

---



# Regla: No usar JSON para datos consultables

Prohibido guardar en JSON cualquier dato que:
	•	se use en filtros (WHERE)
	•	se use en joins (JOIN)
	•	se use en agregaciones (GROUP BY, SUM, COUNT)
	•	se use para ordenamiento (ORDER BY)
	•	se use para reglas de negocio (tiers, rewards, eligibility, etc.)

✅ Sí se permite JSON únicamente para:
	•	metadata / auditing (ej. rawPayload, debugContext)
	•	payloads externos que se almacenan “tal cual” por trazabilidad
	•	campos opcionales no indexables y que no afectan reglas ni reportes

Principio: Si lo vas a consultar, indexar o usar en reglas → debe ser columna tipada, no JSON.

2) Diseño de modelo: columnas tipadas + tablas de relación
	•	Preferir columnas tipadas (int, varchar, datetime, boolean, decimal) sobre “bolsas” JSON.
	•	Preferir tablas normalizadas para listas (ej. reward_eligible_categories) en vez de categories: ["A","B"] dentro de JSON.
	•	Definir claves y constraints: PK, FK, UNIQUE, CHECK, NOT NULL.

3) Performance: consultas “sargables” e índices explícitos

Para mantener las consultas eficientes:
	•	Las condiciones en WHERE deben poder usar índices (evitar funciones sobre la columna).
	•	❌ WHERE LOWER(email) = 'x@x.com'
	•	✅ WHERE email = 'x@x.com' (y normalizar email al guardar si aplica)
	•	No depender de “parsing” de JSON en tiempo de consulta.
	•	❌ WHERE JSON_VALUE(payload, '$.tenantId') = ...
	•	✅ WHERE tenant_id = ...
	•	Índices por acceso real:
	•	Índices en tenant_id, membership_id, program_id, created_at
	•	Índices compuestos según patrones: (tenant_id, program_id, created_at) etc.

4) Contrato de acceso a datos
	•	Los repositorios deben exponer métodos que regresen entidades de dominio o DTOs, nunca blobs JSON.
	•	Las consultas complejas (reporting/analytics) deben estar:
	•	en un módulo dedicado (/infrastructure/persistence/queries o “read models”)
	•	documentadas con su intención, y con índices requeridos

5) Excepción explícita: ledger/transactions y trazabilidad

En el sistema de ledger (PointsTransaction) se permite guardar rawPayload o context JSON solo para auditoría, pero:
	•	Las columnas que soportan balance, tier, program, membership, tenant deben ser tipadas e indexadas.
Esto es consistente con el enfoque de “ledger + proyecciones” que ya describes.  ￼

6) Checklist antes de agregar una tabla o query nueva

Antes de mergear:
	•	¿Algún campo “consultable” quedó como JSON? → refactor a columna / tabla
	•	¿La query usa índices existentes? → agregar índice
	•	¿Se está filtrando por tenant/membership cuando aplica multitenancy? → obligatorio
	•	¿Hay riesgo de N+1? → cambiar a joins / batch
	•	¿Se documentó el patrón de acceso y los índices? → sí

  **Última actualización**: 2025-01-28