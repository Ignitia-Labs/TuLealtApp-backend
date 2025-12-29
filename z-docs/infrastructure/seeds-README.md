# Seeds - Sistema de Semillas de Datos

Este módulo proporciona un sistema de seeds (semillas de datos) para poblar la base de datos con datos iniciales necesarios para el funcionamiento de las aplicaciones.

⚠️ **IMPORTANTE**: Las seeds **NO se ejecutan automáticamente** al iniciar las aplicaciones. Solo se ejecutan bajo demanda mediante los comandos `npm run seed:*`.

## Estructura

```
libs/infrastructure/src/seeds/
├── interfaces/
│   └── seed.interface.ts          # Interfaz base para todas las seeds
├── base/
│   └── base-seed.ts                # Clase base abstracta
├── shared/
│   └── admin-user.seed.ts         # Seed compartida: usuario admin
├── admin/
│   └── admin.seed.ts              # Seeds específicas de Admin API
├── partner/
│   └── partner.seed.ts            # Seeds específicas de Partner API
├── customer/
│   └── customer.seed.ts           # Seeds específicas de Customer API
├── seed-runner.ts                 # Runner principal
└── index.ts                       # Exports públicos
```

## Uso

### Ejecutar todas las seeds

```bash
npm run seed:all
```

### Ejecutar seeds por contexto

```bash
# Seeds para Admin API
npm run seed:admin

# Seeds para Partner API
npm run seed:partner

# Seeds para Customer API
npm run seed:customer
```

### Ejecutar directamente con ts-node

```bash
# Todas las seeds
ts-node -r tsconfig-paths/register libs/infrastructure/src/seeds/seed-runner.ts all

# Seeds específicas
ts-node -r tsconfig-paths/register libs/infrastructure/src/seeds/seed-runner.ts admin
ts-node -r tsconfig-paths/register libs/infrastructure/src/seeds/seed-runner.ts partner
ts-node -r tsconfig-paths/register libs/infrastructure/src/seeds/seed-runner.ts customer
```

## Seeds Disponibles

### AdminUserSeed

Crea el usuario administrador por defecto con las siguientes credenciales:

- **Email**: `admin@example.com`
- **Username**: `admin`
- **Password**: `Admin123!`
- **Rol**: `ADMIN`

⚠️ **ADVERTENCIA DE SEGURIDAD**:
- Esta seed crea un usuario con credenciales conocidas
- En producción, cambiar la contraseña inmediatamente después del primer login
- Considerar usar variables de entorno para la contraseña en producción
- Este usuario debe tener acceso restringido en producción

## Crear una Nueva Seed

Para crear una nueva seed, sigue estos pasos:

1. Crea una clase que extienda `BaseSeed`:

```typescript
import { Injectable } from '@nestjs/common';
import { BaseSeed } from '../base/base-seed';

@Injectable()
export class MyNewSeed extends BaseSeed {
  getName(): string {
    return 'MyNewSeed';
  }

  async run(): Promise<void> {
    this.log('Ejecutando mi nueva seed...');

    // Tu lógica aquí
    // Asegúrate de verificar si los datos ya existen (idempotencia)

    this.log('Seed completada');
  }
}
```

2. Registra la seed en el módulo correspondiente:
   - Seeds compartidas: `libs/infrastructure/src/infrastructure.module.ts`
   - Seeds específicas de contexto: en el seed correspondiente (`admin.seed.ts`, `partner.seed.ts`, etc.)

3. Ejecuta la seed usando el runner.

## Arquitectura

Las seeds siguen los principios de la arquitectura hexagonal:

- **Domain Layer**: Usa las entidades de dominio (`User`, etc.)
- **Application Layer**: Puede usar los handlers de aplicación si es necesario
- **Infrastructure Layer**: Usa los repositorios de infraestructura para persistir datos

Las seeds son **idempotentes**, lo que significa que pueden ejecutarse múltiples veces sin crear datos duplicados.

## Integración con NestJS

El seed runner crea un contexto de aplicación NestJS para tener acceso a la inyección de dependencias. Esto permite:

- Usar repositorios inyectados
- Acceder a servicios de infraestructura
- Mantener la misma configuración que las aplicaciones

## Notas de Producción

- ⚠️ **Nunca ejecutar seeds en producción sin revisar primero**
- Las seeds pueden sobrescribir datos existentes si no están bien implementadas
- Considerar usar migraciones de base de datos para datos críticos
- Las credenciales por defecto deben cambiarse inmediatamente en producción

