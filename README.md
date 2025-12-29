# TuLealtApp Backend

Backend del sistema de lealtad TuLealtApp construido con NestJS, TypeORM y arquitectura hexagonal (Domain-Driven Design).

## 📋 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Iniciar base de datos con Docker
docker-compose up -d mariadb

# Ejecutar migraciones
npm run migration:run

# Ejecutar seeds (datos iniciales)
npm run seed:all

# Iniciar Admin API
npm run start:admin
```

## 📚 Documentación Completa

Toda la documentación del proyecto está disponible en la carpeta **[`z-docs/`](./z-docs/README.md)**.

### Documentación Principal

- **[Arquitectura](./z-docs/ARCHITECTURE.md)** - Arquitectura hexagonal (DDD)
- **[Guía de APIs](./z-docs/API-GUIDELINE.md)** - Cómo crear APIs con Swagger
- **[Base de Datos](./z-docs/DATABASE.md)** - Configuración de MariaDB
- **[Docker](./z-docs/DOCKER.md)** - Guía de Docker

### Documentación por Temas

- **Pagos y Facturación**: [Flujo de Pagos](./z-docs/FLUJO-PAGOS-INVOICES-BILLING.md), [Stripe](./z-docs/STRIPE-INTEGRATION-GUIDE.md)
- **Cron Jobs**: [Guía Completa](./z-docs/GUIA-CRON-JOBS.md), [Resumen](./z-docs/RESUMEN-CRON-JOBS.md)
- **Clientes**: [Flujo de Membresías](./z-docs/FLUJO-CUSTOMER-MEMBERSHIP.md)
- **Almacenamiento**: [Configuración S3](./z-docs/STORAGE.md)

Ver el [índice completo](./z-docs/README.md) para toda la documentación disponible.

## 🚀 APIs Disponibles

### Admin API (Puerto 3000)
- **Swagger UI**: http://localhost:3000/admin/docs
- **OpenAPI JSON**: http://localhost:3000/admin/docs-json

### Partner API (Puerto 3001)
- **Swagger UI**: http://localhost:3001/partner/docs

### Customer API (Puerto 3002)
- **Swagger UI**: http://localhost:3002/customer/docs

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run start:admin          # Admin API
npm run start:partner        # Partner API
npm run start:customer       # Customer API

# Base de Datos
npm run migration:run        # Ejecutar migraciones
npm run seed:all             # Ejecutar seeds

# Docker
npm run docker:up            # Iniciar servicios
npm run docker:down          # Detener servicios
npm run docker:logs          # Ver logs
```

## 📦 Requisitos

- Node.js >= 18.x
- npm >= 9.x
- MariaDB/MySQL >= 10.5
- Docker (opcional) >= 20.x

## 📝 Licencia

Ver [LICENSE.md](./z-docs/LICENSE.md) para más información.

---

Para más información, consulta la [documentación completa](./z-docs/README.md).

