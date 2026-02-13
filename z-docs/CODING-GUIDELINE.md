# Coding Guidelines - TuLealtApp Backend

Guía de estándares de código y mejores prácticas para el desarrollo en TuLealtApp Backend. Este documento establece las convenciones que todos los desarrolladores deben seguir para mantener un código consistente, mantenible y de alta calidad.

## 📋 Tabla de Contenidos

1. [Convenciones de Nombrado](#convenciones-de-nombrado)
2. [Estándares de Formateo](#estándares-de-formateo)
3. [Estructura de Archivos](#estructura-de-archivos)
4. [Patrones de Error Handling](#patrones-de-error-handling)
5. [Logging Standards](#logging-standards)
6. [Testing Conventions](#testing-conventions)
7. [Git Workflow](#git-workflow)
8. [Code Review Checklist](#code-review-checklist)
9. [Performance Guidelines](#performance-guidelines)
10. [Security Checklist](#security-checklist)
11. [Documentation Standards](#documentation-standards)
12. [TypeScript Best Practices](#typescript-best-practices)

---

## 🏷️ Convenciones de Nombrado

### Principio General

Los nombres deben ser:
- ✅ **Descriptivos**: Comunicar claramente el propósito
- ✅ **Consistentes**: Seguir los mismos patrones
- ✅ **Pronunciables**: Fáciles de decir y recordar
- ✅ **Buscables**: Fáciles de encontrar con Ctrl+F

### Clases y Tipos

| Tipo | Convención | Ejemplo | ❌ Evitar |
|------|-----------|---------|-----------|
| **Entidades de Dominio** | `PascalCase` | `User`, `Order`, `Product` | `user`, `ORDER` |
| **Entidades de Persistencia** | `PascalCase + Entity` | `UserEntity`, `OrderEntity` | `UserModel`, `User_Entity` |
| **DTOs Request** | `PascalCase + Request` | `CreateUserRequest` | `CreateUserDto`, `UserCreateRequest` |
| **DTOs Response** | `PascalCase + Response` | `CreateUserResponse` | `CreateUserDto`, `UserCreateResponse` |
| **Handlers** | `PascalCase + Handler` | `CreateUserHandler` | `UserCreator`, `CreateUser` |
| **Repositories** | `PascalCase + Repository` | `UserRepository` | `UserRepo`, `UsersRepository` |
| **Mappers** | `PascalCase + Mapper` | `UserMapper` | `UserMap`, `MapUser` |
| **Services** | `PascalCase + Service` | `EmailService`, `PaymentService` | `Email`, `Payments` |
| **Guards** | `PascalCase + Guard` | `JwtAuthGuard`, `RolesGuard` | `JwtAuth`, `CheckRoles` |
| **Interceptors** | `PascalCase + Interceptor` | `LoggingInterceptor` | `Logger`, `Log` |
| **Pipes** | `PascalCase + Pipe` | `ValidationPipe` | `Validate`, `Validator` |
| **Controllers** | `PascalCase + Controller` | `UsersController` | `UserController`, `User` |
| **Modules** | `PascalCase + Module` | `UsersModule`, `AuthModule` | `User`, `Users` |
| **Interfaces** | `I + PascalCase` | `IUserRepository` | `UserRepositoryInterface` |
| **Types** | `PascalCase + Type` | `UserRoleType` | `UserRole`, `user_role_type` |
| **Enums** | `PascalCase` | `UserStatus`, `OrderType` | `USER_STATUS`, `OrderTypes` |

### Variables y Constantes

| Tipo | Convención | Ejemplo | ❌ Evitar |
|------|-----------|---------|-----------|
| **Variables** | `camelCase` | `userName`, `totalAmount` | `UserName`, `total_amount` |
| **Constantes** | `UPPER_SNAKE_CASE` | `MAX_RETRIES`, `API_URL` | `maxRetries`, `apiUrl` |
| **Private properties** | `camelCase` | `private userId` | `private _userId` |
| **Booleans** | `is/has/can + camelCase` | `isActive`, `hasPermission`, `canDelete` | `active`, `permission` |
| **Arrays** | Plural | `users`, `orders`, `items` | `userList`, `orderArray` |
| **Dates** | `...At` o `...Date` | `createdAt`, `expiryDate` | `created`, `expiry` |

### Funciones y Métodos

| Tipo | Convención | Ejemplo | ❌ Evitar |
|------|-----------|---------|-----------|
| **Métodos públicos** | `camelCase` verbo | `createUser()`, `getOrders()` | `CreateUser()`, `Orders()` |
| **Métodos privados** | `camelCase` verbo | `validateEmail()`, `hashPassword()` | `_validateEmail()` |
| **Factory methods** | `create` | `User.create()` | `User.new()`, `User.make()` |
| **Query methods** | `find/get` | `findById()`, `getUserByEmail()` | `retrieve()`, `fetch()` |
| **Command methods** | `verbo` | `save()`, `update()`, `delete()` | `persist()`, `remove()` |
| **Boolean methods** | `is/has/can` | `isValid()`, `hasRole()` | `valid()`, `checkRole()` |
| **Event handlers** | `handle...` | `handleUserCreated()` | `onUserCreated()`, `userCreated()` |
| **Async methods** | Usar `async` | `async createUser()` | `createUserAsync()` |

### Ejemplos Completos

```typescript
// ✅ BUENO: Nombres descriptivos y consistentes
export class User {
  constructor(
    public readonly id: number,
    public readonly email: string,
    public readonly createdAt: Date,
    private readonly hashedPassword: string,
  ) {}

  static create(email: string, password: string): User {
    // Factory method claro
  }

  isActive(): boolean {
    // Boolean method con prefijo "is"
  }

  changeEmail(newEmail: string): User {
    // Command method con verbo
  }
}

// ❌ MALO: Nombres ambiguos e inconsistentes
export class user { // ❌ No PascalCase
  constructor(
    public readonly i: number, // ❌ Nombre muy corto
    public readonly e: string, // ❌ Nombre muy corto
    public readonly c: Date, // ❌ Nombre muy corto
    private readonly p: string, // ❌ Nombre muy corto
  ) {}

  static new(e: string, p: string): user { // ❌ "new" es palabra reservada
    // ...
  }

  active(): boolean { // ❌ Debería ser "isActive()"
    // ...
  }

  setEmail(e: string): user { // ❌ Usa "change" en lugar de "set"
    // ...
  }
}
```

---

## 🎨 Estándares de Formateo

### Prettier Configuration

Usamos **Prettier** para formateo automático. Configuración en `.prettierrc`:

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "endOfLine": "lf",
  "arrowParens": "always"
}
```

### ESLint Configuration

Usamos **ESLint** para linting. Reglas clave en `.eslintrc.js`:

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};
```

### Formateo Manual

#### Imports

**Orden de imports:**

```typescript
// 1. Node.js built-ins
import * as fs from 'fs';
import * as path from 'path';

// 2. External libraries
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// 3. Internal libs (@libs/...)
import { User, IUserRepository } from '@libs/domain';
import { UserEntity } from '@libs/infrastructure';

// 4. Relative imports
import { CreateUserRequest } from './create-user.request';
import { CreateUserResponse } from './create-user.response';
```

#### Espaciado

```typescript
// ✅ BUENO: Espacios consistentes
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
  ) {}

  async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
    // Línea en blanco después de declaraciones
    const existingUser = await this.userRepository.findByEmail(request.email);

    // Línea en blanco antes de condicionales
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Línea en blanco entre bloques lógicos
    const user = User.create(request.email, request.name);
    const savedUser = await this.userRepository.save(user);

    // Línea en blanco antes de return
    return new CreateUserResponse(savedUser);
  }
}

// ❌ MALO: Sin espaciado
export class UserService {
  constructor(private readonly userRepository: UserRepository,private readonly emailService: EmailService) {}
  async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }
    const user = User.create(request.email, request.name);
    const savedUser = await this.userRepository.save(user);
    return new CreateUserResponse(savedUser);
  }
}
```

#### Longitud de Línea

- **Máximo**: 100 caracteres
- **Preferido**: 80 caracteres

```typescript
// ✅ BUENO: Líneas cortas y legibles
const user = await this.userRepository.findOne({
  where: { id, isActive: true },
  relations: ['orders', 'profile'],
});

// ❌ MALO: Línea muy larga
const user = await this.userRepository.findOne({ where: { id, isActive: true }, relations: ['orders', 'profile', 'permissions', 'notifications'] });
```

---

## 📁 Estructura de Archivos

### Organización de Carpetas

```
feature/
├── __tests__/              # Tests de la feature
│   ├── feature.spec.ts     # Tests unitarios
│   └── feature.e2e.spec.ts # Tests E2E
├── create-feature/         # Caso de uso: Crear
│   ├── create-feature.handler.ts
│   ├── create-feature.request.ts
│   └── create-feature.response.ts
├── get-feature/            # Caso de uso: Obtener
│   ├── get-feature.handler.ts
│   ├── get-feature.request.ts
│   └── get-feature.response.ts
└── update-feature/         # Caso de uso: Actualizar
    ├── update-feature.handler.ts
    ├── update-feature.request.ts
    └── update-feature.response.ts
```

### Nombrado de Archivos

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| **Entidad (Domain)** | `nombre.entity.ts` | `user.entity.ts` |
| **Entidad (Persistence)** | `nombre.entity.ts` | `user.entity.ts` |
| **Repository Interface** | `nombre.repository.interface.ts` | `user.repository.interface.ts` |
| **Repository** | `nombre.repository.ts` | `user.repository.ts` |
| **Mapper** | `nombre.mapper.ts` | `user.mapper.ts` |
| **Handler** | `accion-nombre.handler.ts` | `create-user.handler.ts` |
| **Request DTO** | `accion-nombre.request.ts` | `create-user.request.ts` |
| **Response DTO** | `accion-nombre.response.ts` | `create-user.response.ts` |
| **Controller** | `nombre.controller.ts` | `users.controller.ts` |
| **Service** | `nombre.service.ts` | `email.service.ts` |
| **Guard** | `nombre.guard.ts` | `jwt-auth.guard.ts` |
| **Test unitario** | `nombre.spec.ts` | `user.spec.ts` |
| **Test E2E** | `nombre.e2e-spec.ts` | `users.e2e-spec.ts` |

### Un Concepto, Un Archivo

```typescript
// ✅ BUENO: Cada clase en su propio archivo

// user.entity.ts
export class User { /* ... */ }

// user.repository.interface.ts
export interface IUserRepository { /* ... */ }

// user.mapper.ts
export class UserMapper { /* ... */ }

// ❌ MALO: Múltiples conceptos en un archivo

// user.ts
export class User { /* ... */ }
export interface IUserRepository { /* ... */ }
export class UserMapper { /* ... */ }
export class UserService { /* ... */ }
```

---

## ⚠️ Patrones de Error Handling

### Jerarquía de Excepciones

```typescript
// Domain Layer: Error simple
throw new Error('Invalid email format');

// Application Layer: HttpException
throw new ConflictException('User already exists');
throw new NotFoundException('User not found');
throw new BadRequestException('Invalid data');
throw new UnauthorizedException('Invalid credentials');
throw new ForbiddenException('Insufficient permissions');

// Infrastructure Layer: Transformar errores
try {
  await this.repository.save(user);
} catch (error) {
  if (error.code === 'ER_DUP_ENTRY') {
    throw new Error('Duplicate entry');
  }
  throw new InternalServerErrorException('Database error');
}
```

### Custom Exceptions

```typescript
// libs/shared/src/exceptions/business-rule.exception.ts
export class BusinessRuleException extends BadRequestException {
  constructor(rule: string, message: string) {
    super({
      statusCode: 422,
      error: 'Business Rule Violation',
      rule,
      message,
    });
  }
}

// Uso
if (user.points < reward.cost) {
  throw new BusinessRuleException(
    'INSUFFICIENT_POINTS',
    `User has ${user.points} points but reward costs ${reward.cost}`,
  );
}
```

### Try-Catch Best Practices

```typescript
// ✅ BUENO: Catch específico con manejo apropiado
async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
  try {
    const user = User.create(request.email, request.name);
    return await this.userRepository.save(user);
  } catch (error) {
    if (error instanceof ConflictException) {
      // Manejo específico
      this.logger.warn(`Duplicate user: ${request.email}`);
      throw error;
    }

    // Error inesperado
    this.logger.error('Failed to create user', error.stack);
    throw new InternalServerErrorException('Failed to create user');
  }
}

// ❌ MALO: Catch genérico que oculta errores
async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
  try {
    const user = User.create(request.email, request.name);
    return await this.userRepository.save(user);
  } catch (error) {
    console.log('Error'); // ❌ No informativo
    return null; // ❌ Oculta el error
  }
}
```

### Error Responses Consistentes

```typescript
// Formato estándar de error
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    "email must be an email",
    "name must be longer than 2 characters"
  ],
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/users"
}
```

---

## 📊 Logging Standards

### Niveles de Log

| Nivel | Cuándo Usar | Ejemplo |
|-------|-------------|---------|
| **error** | Errores que requieren atención inmediata | `logger.error('Payment failed', error.stack)` |
| **warn** | Situaciones potencialmente problemáticas | `logger.warn('Rate limit approaching')` |
| **log** (info) | Eventos importantes del negocio | `logger.log('User created: ${user.id}')` |
| **debug** | Información detallada para debugging | `logger.debug('Query executed', { sql, params })` |
| **verbose** | Información muy detallada | `logger.verbose('Cache hit', { key, value })` |

### Logger Setup

```typescript
// libs/shared/src/logger/app-logger.service.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppLogger extends Logger {
  error(message: string, trace?: string, context?: string) {
    super.error(message, trace, context || this.context);
    // Opcional: Enviar a servicio externo (Sentry, DataDog, etc.)
  }

  warn(message: string, context?: string) {
    super.warn(message, context || this.context);
  }

  log(message: string, context?: string) {
    super.log(message, context || this.context);
  }

  debug(message: string, context?: string) {
    if (process.env.NODE_ENV !== 'production') {
      super.debug(message, context || this.context);
    }
  }

  verbose(message: string, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      super.verbose(message, context || this.context);
    }
  }
}
```

### Logging Best Practices

```typescript
// ✅ BUENO: Logs informativos con contexto
@Injectable()
export class CreateUserHandler {
  private readonly logger = new AppLogger(CreateUserHandler.name);

  async execute(request: CreateUserRequest): Promise<CreateUserResponse> {
    this.logger.log(`Creating user with email: ${request.email}`);

    try {
      const user = User.create(request.email, request.name);
      const savedUser = await this.userRepository.save(user);

      this.logger.log(`User created successfully: ID ${savedUser.id}`);
      return new CreateUserResponse(savedUser);
    } catch (error) {
      this.logger.error(
        `Failed to create user: ${request.email}`,
        error.stack,
      );
      throw error;
    }
  }
}

// ❌ MALO: Logs sin contexto o excesivos
async execute(request: CreateUserRequest): Promise<CreateUserResponse> {
  console.log('Creating user'); // ❌ console.log en lugar de logger
  console.log(request); // ❌ Log de todo el objeto (puede tener passwords)

  const user = User.create(request.email, request.name);
  console.log('User created'); // ❌ No informativo
  console.log(user); // ❌ Log innecesario

  const savedUser = await this.userRepository.save(user);
  console.log('Saved'); // ❌ No informativo

  return new CreateUserResponse(savedUser);
}
```

### Qué NO Loggear

- ❌ Passwords o secrets
- ❌ Tokens de autenticación
- ❌ Números de tarjetas de crédito
- ❌ Información personal sensible (SSN, etc.)
- ❌ Objetos completos con datos sensibles

```typescript
// ✅ BUENO: Sanitizar datos sensibles
this.logger.log(`User logged in: ${user.email}`);

// ❌ MALO: Loggear password
this.logger.log(`Login attempt`, { email, password }); // ❌ NUNCA
```

---

## 🧪 Testing Conventions

### Estructura de Tests

```typescript
// user.entity.spec.ts
import { User } from '../user.entity';

describe('User Entity', () => {
  describe('create', () => {
    it('should create a valid user', () => {
      // Arrange
      const email = 'user@example.com';
      const name = 'John Doe';
      const password = 'password123';

      // Act
      const user = User.create(email, name, password);

      // Assert
      expect(user).toBeDefined();
      expect(user.email).toBe(email);
      expect(user.name).toBe(name);
    });

    it('should throw error for invalid email', () => {
      // Arrange
      const invalidEmail = 'invalid-email';

      // Act & Assert
      expect(() => {
        User.create(invalidEmail, 'Name', 'password');
      }).toThrow('Invalid email format');
    });
  });

  describe('suspend', () => {
    it('should suspend an active user', () => {
      // Arrange
      const user = User.create('user@example.com', 'John', 'pass');

      // Act
      const suspended = user.suspend();

      // Assert
      expect(suspended.isActive).toBe(false);
    });
  });
});
```

### Naming de Tests

**Patrón**: `should [comportamiento esperado] when [condición]`

```typescript
// ✅ BUENO: Nombres descriptivos
it('should create user when email is unique', () => {});
it('should throw ConflictException when email already exists', () => {});
it('should return null when user not found', () => {});

// ❌ MALO: Nombres vagos
it('test1', () => {});
it('creates user', () => {});
it('works', () => {});
```

### AAA Pattern (Arrange-Act-Assert)

```typescript
// ✅ BUENO: Patrón AAA claro
it('should calculate total correctly', () => {
  // Arrange: Preparar datos
  const order = new Order(100, 0.1); // amount: 100, tax: 10%

  // Act: Ejecutar acción
  const total = order.calculateTotal();

  // Assert: Verificar resultado
  expect(total).toBe(110); // 100 + 10% = 110
});

// ❌ MALO: Todo mezclado
it('calculates total', () => {
  expect(new Order(100, 0.1).calculateTotal()).toBe(110);
});
```

### Mocking

```typescript
// ✅ BUENO: Mocks claros y específicos
describe('CreateUserHandler', () => {
  let handler: CreateUserHandler;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      // ... otros métodos
    };

    handler = new CreateUserHandler(mockUserRepository);
  });

  it('should create user when email is unique', async () => {
    // Arrange
    mockUserRepository.findByEmail.mockResolvedValue(null); // No existe
    mockUserRepository.save.mockResolvedValue(savedUser); // Guarda correctamente

    // Act
    const result = await handler.execute(request);

    // Assert
    expect(result).toBeDefined();
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(request.email);
    expect(mockUserRepository.save).toHaveBeenCalled();
  });
});
```

### Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

```bash
# Verificar coverage
npm run test:cov
```

---

## 🌿 Git Workflow

### Branching Strategy

```
main (producción, protegida)
  │
  ├── develop (integración, protegida)
  │    │
  │    ├── feature/user-authentication
  │    ├── feature/payment-integration
  │    ├── bugfix/fix-login-error
  │    ├── hotfix/critical-security-patch
  │    └── release/v1.2.0
```

### Branch Naming

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| **Feature** | `feature/descripcion-corta` | `feature/user-authentication` |
| **Bugfix** | `bugfix/descripcion-del-bug` | `bugfix/fix-login-error` |
| **Hotfix** | `hotfix/descripcion-critica` | `hotfix/security-patch` |
| **Release** | `release/vX.Y.Z` | `release/v1.2.0` |
| **Chore** | `chore/descripcion` | `chore/update-dependencies` |

### Commit Messages

**Formato**: `<tipo>(<scope>): <descripción>`

**Tipos permitidos:**
- `feat`: Nueva feature
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Formateo de código (no afecta lógica)
- `refactor`: Refactorización
- `test`: Agregar o modificar tests
- `chore`: Cambios en build, CI, dependencias

```bash
# ✅ BUENOS commits
feat(auth): add JWT authentication
fix(users): resolve duplicate email validation
docs(readme): update installation instructions
refactor(domain): extract validation logic to helper
test(users): add unit tests for User entity
chore(deps): upgrade @nestjs/common to v10.0.0

# ❌ MALOS commits
update
fix bug
changes
WIP
asdfasdf
```

### Commit Message Body

```bash
feat(loyalty): implement points expiration system

- Add PointsExpiration entity
- Create cron job to expire points
- Send notification before expiration
- Update PointsTransaction with expiry date

Closes #123
```

### Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.ts": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ]
  }
}
```

---

## ✅ Code Review Checklist

### Funcionalidad

- [ ] El código hace lo que se supone que debe hacer
- [ ] Los tests pasan
- [ ] No hay regresiones obvias
- [ ] Edge cases están considerados
- [ ] Errores son manejados apropiadamente

### Arquitectura

- [ ] Respeta la arquitectura hexagonal
- [ ] Separación de responsabilidades clara
- [ ] No hay dependencias circulares
- [ ] Interfaces bien definidas
- [ ] Patrones arquitectónicos aplicados correctamente

### Código

- [ ] Nombres descriptivos y consistentes
- [ ] Funciones/métodos con responsabilidad única
- [ ] No hay código duplicado
- [ ] No hay código comentado innecesario
- [ ] Magic numbers extraídos a constantes
- [ ] Imports organizados

### Testing

- [ ] Tests unitarios escritos y pasan
- [ ] Coverage adecuado (> 80%)
- [ ] Tests descriptivos (nombres claros)
- [ ] Mocks apropiados
- [ ] AAA pattern aplicado

### Seguridad

- [ ] No hay secrets en el código
- [ ] Input validation implementada
- [ ] SQL injection prevenido
- [ ] XSS prevenido
- [ ] Rate limiting considerado
- [ ] Autenticación/autorización correcta

### Performance

- [ ] No hay N+1 queries
- [ ] Índices de BD apropiados
- [ ] Paginación implementada
- [ ] No hay memory leaks obvios
- [ ] Async/await usado correctamente

### Documentación

- [ ] JSDoc en funciones públicas
- [ ] README actualizado (si aplica)
- [ ] Swagger documentado
- [ ] Cambios breaking documentados

---

## ⚡ Performance Guidelines

### Database Queries

```typescript
// ✅ BUENO: Query optimizado con índices
const users = await this.userRepository
  .createQueryBuilder('user')
  .leftJoinAndSelect('user.profile', 'profile')
  .where('user.tenantId = :tenantId', { tenantId })
  .andWhere('user.isActive = :isActive', { isActive: true })
  .orderBy('user.createdAt', 'DESC')
  .take(10)
  .getMany();

// ❌ MALO: N+1 problem
const users = await this.userRepository.findAll();
for (const user of users) {
  user.profile = await this.profileRepository.findByUserId(user.id); // N queries
}
```

### Caching

```typescript
// ✅ BUENO: Cachear datos que no cambian frecuentemente
@Injectable()
export class CatalogService {
  private cache = new Map<string, any>();

  async getCountries(): Promise<Country[]> {
    const cacheKey = 'countries';
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const countries = await this.countryRepository.findAll();
    this.cache.set(cacheKey, countries);
    
    return countries;
  }
}
```

### Batch Operations

```typescript
// ✅ BUENO: Batch insert
await this.orderRepository.save(orders); // 1 query

// ❌ MALO: Individual inserts
for (const order of orders) {
  await this.orderRepository.save(order); // N queries
}
```

### Async/Await en Paralelo

```typescript
// ✅ BUENO: Ejecutar en paralelo
const [user, orders, profile] = await Promise.all([
  this.userRepository.findById(id),
  this.orderRepository.findByUserId(id),
  this.profileRepository.findByUserId(id),
]);

// ❌ MALO: Ejecutar secuencialmente
const user = await this.userRepository.findById(id);
const orders = await this.orderRepository.findByUserId(id);
const profile = await this.profileRepository.findByUserId(id);
```

---

## 🔒 Security Checklist

### Input Validation

- [ ] Validar con class-validator en DTOs
- [ ] Sanitizar HTML/scripts
- [ ] Validar tipos de archivos
- [ ] Limitar tamaños de archivos
- [ ] Validar rangos numéricos

### Authentication & Authorization

- [ ] JWT tokens seguros
- [ ] Passwords hasheados (bcrypt)
- [ ] Guards en endpoints protegidos
- [ ] Roles verificados
- [ ] Permisos granulares

### Data Protection

- [ ] No loggear passwords o secrets
- [ ] No retornar passwords en responses
- [ ] Encriptar datos sensibles
- [ ] HTTPS en producción
- [ ] Secrets en variables de entorno

### SQL Injection Prevention

- [ ] Usar parámetros parametrizados
- [ ] No concatenar strings en queries
- [ ] Usar TypeORM query builder

### XSS Prevention

- [ ] Sanitizar inputs
- [ ] Escapar outputs
- [ ] CSP headers configurados

---

## 📖 Documentation Standards

### JSDoc

```typescript
/**
 * Crea un nuevo usuario en el sistema.
 * 
 * Este método valida que el email sea único, hashea la contraseña
 * y crea el usuario con los roles especificados.
 * 
 * @param email - Email del usuario (debe ser único)
 * @param name - Nombre completo del usuario
 * @param password - Contraseña en texto plano (será hasheada)
 * @param roles - Roles del usuario (default: ['CUSTOMER'])
 * @returns Nueva instancia de User con ID asignado por BD
 * @throws {Error} Si el email es inválido
 * @throws {Error} Si el nombre es muy corto
 * @throws {Error} Si la contraseña es muy corta
 * 
 * @example
 * const user = User.create(
 *   'user@example.com',
 *   'John Doe',
 *   'SecurePass123!',
 *   ['CUSTOMER']
 * );
 */
static create(
  email: string,
  name: string,
  password: string,
  roles: string[] = ['CUSTOMER'],
): User {
  // Implementación
}
```

### README Files

Cada módulo importante debe tener un README:

```markdown
# Users Module

## Descripción

Módulo para gestión de usuarios del sistema.

## Casos de Uso

- CreateUser: Crear nuevo usuario
- GetUser: Obtener usuario por ID
- UpdateUser: Actualizar datos del usuario
- DeleteUser: Eliminar usuario (soft delete)

## Entidades

- **User**: Entidad de dominio
- **UserEntity**: Entidad de persistencia
- **UserProfile**: Perfil del usuario

## Repositorios

- **IUserRepository**: Interfaz de repositorio
- **UserRepository**: Implementación con TypeORM

## Dependencias

- bcrypt: Para hashear passwords
- class-validator: Para validación de DTOs

## Testing

```bash
npm run test:watch user
```

## Ejemplos

Ver archivos en `__tests__/` para ejemplos de uso.
```

---

## 💻 TypeScript Best Practices

### Tipos Explícitos

```typescript
// ✅ BUENO: Tipos explícitos
function calculateTotal(amount: number, tax: number): number {
  return amount + (amount * tax);
}

// ❌ MALO: Sin tipos
function calculateTotal(amount, tax) {
  return amount + (amount * tax);
}
```

### Evitar `any`

```typescript
// ✅ BUENO: Usar tipos específicos
interface UserData {
  email: string;
  name: string;
}

function processUser(data: UserData): void {
  // ...
}

// ❌ MALO: Usar any
function processUser(data: any): void {
  // ...
}
```

### Type Guards

```typescript
// ✅ BUENO: Type guards para narrowing
function isUser(obj: any): obj is User {
  return obj && typeof obj.email === 'string';
}

if (isUser(data)) {
  console.log(data.email); // TypeScript sabe que es User
}
```

### Readonly Properties

```typescript
// ✅ BUENO: Readonly para inmutabilidad
interface User {
  readonly id: number;
  readonly email: string;
  name: string; // Solo name es mutable
}
```

---

## 📝 Resumen

**Recuerda:**

1. ✅ Nombres descriptivos y consistentes
2. ✅ Formateo automático con Prettier/ESLint
3. ✅ Un concepto por archivo
4. ✅ Error handling apropiado
5. ✅ Logging informativo (sin secretos)
6. ✅ Tests con AAA pattern y > 80% coverage
7. ✅ Commits con conventional commits
8. ✅ Code reviews exhaustivos
9. ✅ Performance optimizado
10. ✅ Seguridad primero

---

**Última actualización**: 2026-02-06  
**Versión**: 1.0  
**Mantenedor**: Equipo de Desarrollo TuLealtApp
