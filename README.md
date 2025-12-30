# TuLealtApp Backend

<div align="center">

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TypeORM](https://img.shields.io/badge/TypeORM-FE0902?style=for-the-badge&logo=typeorm&logoColor=white)
![MariaDB](https://img.shields.io/badge/MariaDB-003545?style=for-the-badge&logo=mariadb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

**Backend del sistema de lealtad TuLealtApp construido con NestJS, TypeORM y arquitectura hexagonal (Domain-Driven Design)**

[Documentación](#-documentación) • [Inicio Rápido](#-inicio-rápido) • [APIs](#-apis-disponibles) • [Arquitectura](#-arquitectura)

</div>

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Inicio Rápido](#-inicio-rápido)
- [APIs Disponibles](#-apis-disponibles)
- [Scripts Disponibles](#-scripts-disponibles)
- [Requisitos](#-requisitos)
- [Documentación](#-documentación)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Desarrollo](#-desarrollo)
- [Licencia](#-licencia)

---

## 🎯 Descripción

TuLealtApp Backend es un sistema completo de gestión de programas de lealtad diseñado para permitir a empresas (partners) crear y gestionar programas de puntos y recompensas para sus clientes. El sistema soporta múltiples tenants (negocios), sucursales, y ofrece funcionalidades completas de gestión de puntos, recompensas, niveles de cliente, y suscripciones.

### Tecnologías Principales

- **NestJS** - Framework Node.js progresivo para aplicaciones del lado del servidor
- **TypeORM** - ORM para TypeScript y JavaScript
- **MariaDB** - Sistema de gestión de bases de datos relacionales
- **Docker** - Contenedorización para desarrollo y producción
- **Swagger/OpenAPI** - Documentación automática de APIs
- **Stripe** - Integración de pagos
- **AWS S3/MinIO** - Almacenamiento de archivos

---

## ✨ Características

### 🏢 Gestión Multi-Tenant
- Soporte para múltiples partners y tenants
- Gestión de sucursales por tenant
- Aislamiento de datos por tenant

### 💰 Sistema de Suscripciones y Facturación
- Gestión completa de suscripciones de partners
- Generación automática de ciclos de facturación (cron jobs)
- Sistema de facturas (invoices) con generación de PDFs
- Integración con Stripe para pagos
- Aplicación automática de créditos y pagos excedentes
- Recordatorios automáticos de facturas pendientes

### 🎁 Sistema de Puntos y Recompensas
- Gestión de puntos de lealtad
- Reglas de puntos configurables
- Sistema de recompensas con categorías y stock
- Niveles de cliente (tiers) con beneficios escalonados
- Membresías de clientes por tenant

### 📊 Gestión y Administración
- Panel de administración completo
- Gestión de usuarios y roles
- Solicitudes de partners con flujo de aprobación
- Notificaciones del sistema
- Catálogos configurables (países, monedas, categorías)
- Límites y estadísticas de partners

### 🔧 Características Técnicas
- Arquitectura hexagonal (DDD) para mantenibilidad
- APIs RESTful completamente documentadas con Swagger
- Autenticación JWT segura
- Migraciones de base de datos versionadas
- Sistema de seeds para datos iniciales
- Hot reload en desarrollo
- Health checks para monitoreo

---

## 🏗️ Arquitectura

Este proyecto utiliza **Arquitectura Hexagonal (Ports & Adapters)** también conocida como **Clean Architecture** o **Domain-Driven Design (DDD)**.

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
│              APPLICATION LAYER                         │
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

**Principios clave:**
- ✅ Separación clara de responsabilidades
- ✅ Dominio independiente de frameworks
- ✅ Fácil de testear y mantener
- ✅ Escalable y extensible

Para más detalles, consulta la [documentación completa de arquitectura](./z-docs/ARCHITECTURE.md).

---

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js >= 18.x
- npm >= 9.x
- Docker >= 20.x (recomendado)
- MariaDB >= 10.5 (si no usas Docker)

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd TuLealtApp-backend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Editar .env con tus configuraciones
   ```

4. **Iniciar servicios con Docker (Recomendado)**
   ```bash
   # Iniciar MariaDB y MinIO
   docker-compose up -d mariadb minio

   # Ejecutar migraciones
   npm run migration:run

   # Ejecutar seeds (datos iniciales)
   npm run seed:all

   # Iniciar Admin API
   npm run start:admin
   ```

5. **Acceder a la documentación**
   - Swagger UI: http://localhost:3000/admin/docs
   - OpenAPI JSON: http://localhost:3000/admin/docs-json

### Usuario Admin por Defecto

Después de ejecutar los seeds, puedes iniciar sesión con:
- **Email**: `admin@example.com`
- **Password**: `Admin123!`

⚠️ **Importante**: Cambia esta contraseña inmediatamente en producción.

---

## 🌐 APIs Disponibles

El proyecto incluye **3 APIs separadas** para diferentes roles:

### Admin API (Puerto 3000)
API para administración completa del sistema.

- **Swagger UI**: http://localhost:3000/admin/docs
- **OpenAPI JSON**: http://localhost:3000/admin/docs-json
- **Endpoints principales**:
  - Gestión de usuarios, partners, tenants, branches
  - Gestión de suscripciones y facturación
  - Gestión de puntos, recompensas y tiers
  - Solicitudes de partners
  - Notificaciones y catálogos

### Partner API (Puerto 3001)
API para partners (empresas que usan el sistema).

- **Swagger UI**: http://localhost:3001/partner/docs
- **Endpoints principales**:
  - Gestión de órdenes
  - Consulta de precios

### Customer API (Puerto 3002)
API para clientes finales.

- **Swagger UI**: http://localhost:3002/customer/docs
- **Endpoints principales**:
  - Gestión de membresías
  - Consulta de precios

---

## 🛠️ Scripts Disponibles

### Desarrollo
```bash
npm run start:admin          # Iniciar Admin API en modo watch
npm run start:partner        # Iniciar Partner API en modo watch
npm run start:customer       # Iniciar Customer API en modo watch
npm run start:dev:admin      # Iniciar Admin API con debug
```

### Base de Datos
```bash
npm run migration:generate   # Generar migración desde entidades
npm run migration:create     # Crear migración manual
npm run migration:run        # Ejecutar migraciones pendientes
npm run migration:revert     # Revertir última migración
npm run migration:show       # Ver estado de migraciones
```

### Seeds (Datos Iniciales)
```bash
npm run seed:all             # Ejecutar todos los seeds
npm run seed:admin           # Seed de usuario admin
npm run seed:partner         # Seed de partners
npm run seed:customer        # Seed de clientes
npm run seed:country         # Seed de países
npm run seed:currency        # Seed de monedas
npm run seed:catalog         # Seed de catálogos
```

### Docker
```bash
npm run docker:build         # Construir imágenes
npm run docker:up            # Iniciar servicios
npm run docker:down          # Detener servicios
npm run docker:logs          # Ver logs
npm run docker:restart       # Reiniciar servicios
npm run docker:clean         # Limpiar todo (contenedores, volúmenes, imágenes)
```

### Producción
```bash
npm run build                # Compilar proyecto
npm run start:prod:admin     # Iniciar Admin API en producción
npm run start:prod:partner   # Iniciar Partner API en producción
npm run start:prod:customer  # Iniciar Customer API en producción
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

---

## 📦 Requisitos

| Requisito | Versión Mínima | Recomendada |
|-----------|---------------|-------------|
| **Node.js** | 18.x | 20.x LTS |
| **npm** | 9.x | 10.x |
| **MariaDB/MySQL** | 10.5 | 10.11+ |
| **Docker** | 20.x | 24.x+ |
| **Docker Compose** | 2.0 | 2.20+ |

---

## 📚 Documentación

Toda la documentación del proyecto está disponible en la carpeta **[`z-docs/`](./z-docs/README.md)**.

### Documentación Principal

- **[Arquitectura](./z-docs/ARCHITECTURE.md)** - Arquitectura hexagonal (DDD) detallada
- **[Guía de APIs](./z-docs/API-GUIDELINE.md)** - Cómo crear APIs con documentación Swagger completa
- **[Base de Datos](./z-docs/DATABASE.md)** - Configuración y guía de uso de MariaDB
- **[Docker](./z-docs/DOCKER.md)** - Guía completa de Docker para desarrollo y producción

### Documentación por Temas

- **Pagos y Facturación**:
  - [Flujo Completo de Pagos](./z-docs/FLUJO-PAGOS-INVOICES-BILLING.md)
  - [Integración con Stripe](./z-docs/STRIPE-INTEGRATION-GUIDE.md)
  - [Resumen de Mejoras Implementadas](./z-docs/RESUMEN-IMPLEMENTACION-MEJORAS.md)

- **Cron Jobs**:
  - [Guía Completa](./z-docs/GUIA-CRON-JOBS.md)
  - [Resumen Rápido](./z-docs/RESUMEN-CRON-JOBS.md)

- **Clientes y Membresías**:
  - [Flujo de Membresías](./z-docs/FLUJO-CUSTOMER-MEMBERSHIP.md)

- **Almacenamiento**:
  - [Configuración S3/MinIO](./z-docs/STORAGE.md)

- **Infraestructura**:
  - [Migraciones](./z-docs/infrastructure/migrations-README.md)
  - [Seeds](./z-docs/infrastructure/seeds-README.md)

Ver el [índice completo](./z-docs/README.md) para toda la documentación disponible.

---

## 📁 Estructura del Proyecto

```
TuLealtApp-backend/
├── apps/                          # Aplicaciones (APIs)
│   ├── admin-api/                 # API de administración
│   ├── partner-api/               # API para partners
│   └── customer-api/              # API para clientes
├── libs/                          # Librerías compartidas
│   ├── domain/                    # Capa de dominio (DDD)
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
├── z-docs/                        # Documentación completa
├── docker/                        # Configuración Docker
├── docker-compose.yml             # Docker Compose desarrollo
├── docker-compose.prod.yml        # Docker Compose producción
└── package.json                   # Configuración del proyecto
```

Para más detalles sobre la estructura, consulta [ARCHITECTURE.md](./z-docs/ARCHITECTURE.md).

---

## 💻 Desarrollo

### Crear una Nueva Feature

1. **Crear entidad de dominio** en `libs/domain/src/entities/`
2. **Crear interfaz de repositorio** en `libs/domain/src/repositories/`
3. **Crear entidad de persistencia** en `libs/infrastructure/src/persistence/entities/`
4. **Crear mapper** en `libs/infrastructure/src/persistence/mappers/`
5. **Implementar repositorio** en `libs/infrastructure/src/persistence/repositories/`
6. **Crear handler** en `libs/application/src/[feature]/`
7. **Crear controlador** en `apps/[api]/src/controllers/`
8. **Crear migración** con `npm run migration:generate`

Para más detalles, consulta [API-GUIDELINE.md](./z-docs/API-GUIDELINE.md) y [ARCHITECTURE.md](./z-docs/ARCHITECTURE.md).

### Convenciones de Código

- **Entidades de dominio**: Clases puras sin decoradores de TypeORM
- **Entidades de persistencia**: Clases con decoradores `@Entity()`, `@Column()`, etc.
- **Handlers**: Implementan casos de uso específicos
- **Repositorios**: Implementan interfaces definidas en domain
- **Mappers**: Convierten entre dominio y persistencia

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=tulealtapp
DB_PASSWORD=tulealtapp
DB_NAME=tulealtapp

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# AWS S3 / MinIO
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=tulealtapp-images
S3_REGION=us-east-1

# Stripe (opcional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# API Ports
ADMIN_API_PORT=3000
PARTNER_API_PORT=3001
CUSTOMER_API_PORT=3002
```

---

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

---

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

Asegúrate de configurar todas las variables de entorno necesarias, especialmente:
- `JWT_SECRET`: Debe ser una clave segura y única
- `DB_*`: Credenciales de base de datos de producción
- `AWS_*`: Credenciales de AWS si usas S3 real
- `STRIPE_*`: Credenciales de Stripe en modo producción

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE.md](./z-docs/LICENSE.md) para más información.

---

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Crea una rama desde `main`: `git checkout -b feature/nueva-feature`
2. Realiza cambios y commits descriptivos
3. Ejecuta tests y lint: `npm run test && npm run lint`
4. Crea Pull Request con descripción detallada

---

## 📞 Soporte

Para más información y documentación detallada, consulta:
- [Documentación Completa](./z-docs/README.md)
- [Guía de Arquitectura](./z-docs/ARCHITECTURE.md)
- [Guía de APIs](./z-docs/API-GUIDELINE.md)

---

<div align="center">

**Desarrollado con ❤️ para TuLealtApp**

[Documentación](./z-docs/README.md) • [Arquitectura](./z-docs/ARCHITECTURE.md) • [APIs](./z-docs/API-GUIDELINE.md)

</div>
