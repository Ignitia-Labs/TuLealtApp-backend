# Documentación del Proyecto TuLealtApp Backend

Esta carpeta contiene toda la documentación del proyecto organizada por temas.

## 📚 Índice de Documentación

### 🏗️ Arquitectura y Guías Generales

- **[README.md](./README.md)** - Este archivo (índice de documentación)
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Documentación detallada de la arquitectura hexagonal (DDD)
- **[API-GUIDELINE.md](./API-GUIDELINE.md)** - Guía completa para crear APIs con documentación Swagger

### 💾 Base de Datos y Persistencia

- **[DATABASE.md](./DATABASE.md)** - Configuración y guía de uso de MariaDB
- **[infrastructure/migrations-README.md](./infrastructure/migrations-README.md)** - Documentación de migraciones de base de datos
- **[infrastructure/seeds-README.md](./infrastructure/seeds-README.md)** - Documentación del sistema de seeds (datos iniciales)

### 🐳 Docker y Despliegue

- **[DOCKER.md](./DOCKER.md)** - Guía completa de Docker para desarrollo y producción

### 💰 Pagos y Facturación

- **[GUIA-FLujo-UI-SUBSCRIPTIONS-BILLING-PAYMENTS.md](./GUIA-FLujo-UI-SUBSCRIPTIONS-BILLING-PAYMENTS.md)** - 🎨 **Guía completa para implementar en UI** - Flujo de subscriptions, billing-cycles y payments
- **[FLUJO-PAGOS-INVOICES-BILLING.md](./FLUJO-PAGOS-INVOICES-BILLING.md)** - Flujo completo de pagos, invoices y ciclos de facturación
- **[RESUMEN-IMPLEMENTACION-MEJORAS.md](./RESUMEN-IMPLEMENTACION-MEJORAS.md)** - Resumen de implementación de mejoras realizadas ✅
- **[STRIPE-INTEGRATION-GUIDE.md](./STRIPE-INTEGRATION-GUIDE.md)** - Guía de integración con Stripe para pagos

### 👥 Clientes y Membresías

- **[FLUJO-CUSTOMER-MEMBERSHIP.md](./FLUJO-CUSTOMER-MEMBERSHIP.md)** - Flujo completo de creación de customers y memberships

### ⏰ Cron Jobs

- **[GUIA-CRON-JOBS.md](./GUIA-CRON-JOBS.md)** - Guía completa de configuración y mantenimiento de cron jobs
- **[RESUMEN-CRON-JOBS.md](./RESUMEN-CRON-JOBS.md)** - Resumen rápido de cron jobs

### 📦 Almacenamiento

- **[STORAGE.md](./STORAGE.md)** - Configuración de almacenamiento con MinIO (S3 compatible)

### 📄 Licencia

- **[LICENSE.md](./LICENSE.md)** - Licencia MIT del proyecto

---

## 🗂️ Organización

Los archivos están organizados de la siguiente manera:

```
z-docs/
├── README.md                          # Este archivo (índice)
├── ARCHITECTURE.md                    # Arquitectura del proyecto
├── API-GUIDELINE.md                   # Guía de APIs
├── DATABASE.md                        # Base de datos
├── DOCKER.md                          # Docker
├── FLUJO-CUSTOMER-MEMBERSHIP.md       # Flujo de customers
├── FLUJO-PAGOS-INVOICES-BILLING.md    # Flujo de pagos
├── GUIA-CRON-JOBS.md                  # Cron jobs (guía completa)
├── LICENSE.md                         # Licencia
├── PLAN-MEJORAS-PAGOS-BILLING.md      # Plan de mejoras
├── RESUMEN-CRON-JOBS.md               # Cron jobs (resumen)
├── RESUMEN-IMPLEMENTACION-MEJORAS.md  # Resumen de mejoras
├── STORAGE.md                         # Almacenamiento
├── STRIPE-INTEGRATION-GUIDE.md        # Integración Stripe
└── infrastructure/
    ├── migrations-README.md            # Migraciones
    └── seeds-README.md                 # Seeds
```

---

## 🔍 Búsqueda Rápida

### ¿Necesitas información sobre...?

- **Arquitectura del proyecto**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Crear una nueva API**: [API-GUIDELINE.md](./API-GUIDELINE.md)
- **Configurar base de datos**: [DATABASE.md](./DATABASE.md)
- **Usar Docker**: [DOCKER.md](./DOCKER.md)
- **Implementar en UI**: [GUIA-FLujo-UI-SUBSCRIPTIONS-BILLING-PAYMENTS.md](./GUIA-FLujo-UI-SUBSCRIPTIONS-BILLING-PAYMENTS.md) 🎨
- **Sistema de pagos**: [FLUJO-PAGOS-INVOICES-BILLING.md](./FLUJO-PAGOS-INVOICES-BILLING.md)
- **Integrar Stripe**: [STRIPE-INTEGRATION-GUIDE.md](./STRIPE-INTEGRATION-GUIDE.md)
- **Cron jobs**: [GUIA-CRON-JOBS.md](./GUIA-CRON-JOBS.md)
- **Almacenamiento S3**: [STORAGE.md](./STORAGE.md)

---

**Última actualización**: 2025-01-20
