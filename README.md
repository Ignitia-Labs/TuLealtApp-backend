# TuLealtApp Backend

Backend del sistema de lealtad TuLealtApp construido con NestJS, TypeORM y arquitectura hexagonal (Domain-Driven Design).

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Características](#características)
- [Arquitectura](#arquitectura)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [APIs Disponibles](#apis-disponibles)
- [Documentación](#documentación)
- [Scripts Disponibles](#scripts-disponibles)
- [Desarrollo](#desarrollo)
- [Testing](#testing)
- [Despliegue](#despliegue)
- [Contribución](#contribución)

## 🎯 Descripción

TuLealtApp Backend es un sistema de gestión de programas de lealtad diseñado para permitir a empresas (partners) crear y gestionar programas de puntos y recompensas para sus clientes. El sistema soporta múltiples tenants (negocios), sucursales, y ofrece funcionalidades completas de gestión de puntos, recompensas, niveles de cliente, y suscripciones.

## ✨ Características

- **Arquitectura Hexagonal (DDD)**: Separación clara entre dominio, aplicación e infraestructura
- **Multi-tenancy**: Soporte para múltiples partners y tenants
- **Sistema de Puntos**: Gestión completa de puntos, transacciones y reglas
- **Recompensas**: Sistema de recompensas con categorías, stock y límites
- **Niveles de Cliente**: Sistema de tiers con beneficios escalonados
- **Suscripciones**: Gestión completa de suscripciones y facturación
- **APIs RESTful**: Documentación completa con Swagger/OpenAPI
- **Autenticación JWT**: Sistema de autenticación seguro
- **Almacenamiento S3**: Integración con AWS S3 para archivos
- **Migraciones**: Sistema de migraciones de base de datos con TypeORM

## 🏗️ Arquitectura

Este proyecto utiliza **Arquitectura Hexagonal (Ports & Adapters)** también conocida como **Clean Architecture** o **Domain-Driven Design (DDD)**. La arquitectura está dividida en 4 capas principales:

```
┌─────────────────────────────────────────────────────────┐
│                    APPS (APIs)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Admin    │  │ Partner  │  │ Customer │              │
│  │ API      │  │ API      │  │ API      │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              APPLICATION LAYER                          │
│  Handlers, DTOs, Casos de Uso                          │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                 DOMAIN LAYER                            │
│  Entidades, Interfaces de Repositorios, Lógica Negocio │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│            INFRASTRUCTURE LAYER                         │
│  TypeORM, Repositorios, Mappers, Storage, Database     │
└─────────────────────────────────────────────────────────┘
```

Para una explicación detallada de la arquitectura, consulta [ARCHITECTURE.md](./ARCHITECTURE.md).

## 📦 Requisitos

- **Node.js**: >= 18.x
- **npm**: >= 9.x
- **MariaDB/MySQL**: >= 10.5
- **Docker** (opcional): >= 20.x
- **AWS Account** (opcional): Para almacenamiento S3

## 🚀 Instalación

1. **Clonar el repositorio**:
```bash
git clone <repository-url>
cd TuLealtApp-backend
```

2. **Instalar dependencias**:
```bash
npm install
```

3. **Configurar variables de entorno**:
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. **Iniciar base de datos con Docker** (opcional):
```bash
docker-compose up -d
```

5. **Ejecutar migraciones**:
```bash
npm run migration:run
```

6. **Ejecutar seeds** (datos iniciales):
```bash
npm run seed:all
```

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=tulealtapp

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# AWS S3 (opcional)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name

# API Ports
ADMIN_API_PORT=3000
PARTNER_API_PORT=3001
CUSTOMER_API_PORT=3002
```

## 💻 Uso

### Desarrollo

```bash
# Iniciar Admin API
npm run start:admin

# Iniciar Partner API
npm run start:partner

# Iniciar Customer API
npm run start:customer
```

### Producción

```bash
# Compilar proyecto
npm run build

# Iniciar APIs en producción
npm run start:prod:admin
npm run start:prod:partner
npm run start:prod:customer
```

### Docker

```bash
# Construir y levantar contenedores
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener contenedores
docker-compose down
```

## 📁 Estructura del Proyecto

```
TuLealtApp-backend/
├── apps/                          # Aplicaciones (APIs)
│   ├── admin-api/                 # API de administración
│   ├── partner-api/               # API para partners
│   └── customer-api/              # API para clientes
├── libs/                          # Librerías compartidas
│   ├── domain/                    # Capa de dominio
│   │   ├── entities/              # Entidades de dominio
│   │   └── repositories/          # Interfaces de repositorios
│   ├── application/               # Capa de aplicación
│   │   └── [features]/            # Casos de uso por feature
│   ├── infrastructure/            # Capa de infraestructura
│   │   ├── persistence/           # Persistencia (TypeORM)
│   │   ├── storage/               # Almacenamiento (S3)
│   │   └── seeds/                 # Datos iniciales
│   └── shared/                    # Utilidades compartidas
│       ├── guards/                # Guards de autenticación
│       ├── filters/               # Filtros de excepciones
│       └── types/                 # Tipos compartidos
├── docker/                        # Configuración Docker
├── API-GUIDELINE.md              # Guía para crear APIs
├── ARCHITECTURE.md               # Documentación de arquitectura
└── README.md                     # Este archivo
```

## 🌐 APIs Disponibles

### Admin API (Puerto 3000)

API para administración del sistema. Documentación Swagger disponible en:
- **Swagger UI**: `http://localhost:3000/admin/docs`
- **OpenAPI JSON**: `http://localhost:3000/admin/docs-json`

**Endpoints principales**:
- `/admin/users` - Gestión de usuarios
- `/admin/partners` - Gestión de partners
- `/admin/tenants` - Gestión de tenants
- `/admin/branches` - Gestión de sucursales
- `/admin/rewards` - Gestión de recompensas
- `/admin/transactions` - Consulta de transacciones
- `/admin/notifications` - Gestión de notificaciones
- `/admin/pricing` - Gestión de planes de precios

### Partner API (Puerto 3001)

API para partners. Documentación Swagger disponible en:
- **Swagger UI**: `http://localhost:3001/partner/docs`

### Customer API (Puerto 3002)

API para clientes. Documentación Swagger disponible en:
- **Swagger UI**: `http://localhost:3002/customer/docs`

## 📚 Documentación

- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Documentación detallada de la arquitectura
- **[API-GUIDELINE.md](./API-GUIDELINE.md)**: Guía para crear nuevas APIs con Swagger
- **[DATABASE.md](./DATABASE.md)**: Documentación de la base de datos
- **[DOCKER.md](./DOCKER.md)**: Guía de Docker
- **[STORAGE.md](./STORAGE.md)**: Documentación de almacenamiento S3

## 🛠️ Scripts Disponibles

### Desarrollo
```bash
npm run start:admin          # Iniciar Admin API en modo watch
npm run start:partner        # Iniciar Partner API en modo watch
npm run start:customer       # Iniciar Customer API en modo watch
npm run start:dev:admin       # Iniciar Admin API con debug
```

### Build
```bash
npm run build                # Compilar todo el proyecto
```

### Base de Datos
```bash
npm run migration:generate   # Generar migración desde entidades
npm run migration:create     # Crear migración manual
npm run migration:run        # Ejecutar migraciones pendientes
npm run migration:revert     # Revertir última migración
npm run migration:show       # Ver estado de migraciones
```

### Seeds
```bash
npm run seed:all             # Ejecutar todos los seeds
npm run seed:admin           # Seed de usuario admin
npm run seed:partner         # Seed de partners
npm run seed:customer        # Seed de clientes
```

### Docker
```bash
npm run docker:build         # Construir imágenes
npm run docker:up            # Levantar contenedores
npm run docker:down          # Detener contenedores
npm run docker:logs          # Ver logs
npm run docker:restart       # Reiniciar contenedores
```

### Code Quality
```bash
npm run lint                 # Ejecutar ESLint
npm run format               # Formatear código con Prettier
npm run format:code          # Formatear y lint en un comando
```

### Testing
```bash
npm run test                 # Ejecutar tests
npm run test:watch           # Tests en modo watch
npm run test:cov             # Tests con cobertura
npm run test:e2e             # Tests end-to-end
```

## 🔧 Desarrollo

### Crear una Nueva Feature

1. **Crear entidad de dominio** en `libs/domain/src/entities/`
2. **Crear interfaz de repositorio** en `libs/domain/src/repositories/`
3. **Crear entidad de persistencia** en `libs/infrastructure/src/persistence/entities/`
4. **Crear mapper** en `libs/infrastructure/src/persistence/mappers/`
5. **Implementar repositorio** en `libs/infrastructure/src/persistence/repositories/`
6. **Crear handler** en `libs/application/src/[feature]/`
7. **Crear controlador** en `apps/[api]/src/controllers/`
8. **Crear migración** con `npm run migration:generate`

Para más detalles, consulta [ARCHITECTURE.md](./ARCHITECTURE.md).

### Convenciones de Código

- **Entidades de dominio**: Clases puras sin decoradores de TypeORM
- **Entidades de persistencia**: Clases con decoradores `@Entity()`, `@Column()`, etc.
- **Handlers**: Implementan casos de uso específicos
- **Repositorios**: Implementan interfaces definidas en domain
- **Mappers**: Convierten entre dominio y persistencia

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm run test

# Tests en modo watch
npm run test:watch

# Tests con cobertura
npm run test:cov

# Tests end-to-end
npm run test:e2e
```

## 🚢 Despliegue

### Producción con Docker

```bash
# Construir imágenes de producción
docker-compose -f docker-compose.prod.yml build

# Levantar servicios
docker-compose -f docker-compose.prod.yml up -d

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Variables de Entorno en Producción

Asegúrate de configurar todas las variables de entorno necesarias en tu entorno de producción, especialmente:
- `JWT_SECRET`: Debe ser una clave segura y única
- `DB_*`: Credenciales de base de datos
- `AWS_*`: Credenciales de AWS si usas S3

## 🤝 Contribución

1. Crear una rama desde `main`: `git checkout -b feature/nueva-feature`
2. Realizar cambios y commits descriptivos
3. Ejecutar tests y lint: `npm run test && npm run lint`
4. Crear Pull Request con descripción detallada

## 📝 Licencia

Ver [LICENSE.md](./LICENSE.md) para más información.

## 👥 Equipo

Desarrollado por el equipo de TuLealtApp.

---

Para más información sobre la arquitectura del proyecto, consulta [ARCHITECTURE.md](./ARCHITECTURE.md).

