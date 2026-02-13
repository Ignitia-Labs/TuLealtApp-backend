# TuLealtApp Backend

<div align="center">

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TypeORM](https://img.shields.io/badge/TypeORM-FE0902?style=for-the-badge&logo=typeorm&logoColor=white)
![MariaDB](https://img.shields.io/badge/MariaDB-003545?style=for-the-badge&logo=mariadb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

**Plataforma completa de gestión de programas de lealtad multi-tenant con arquitectura hexagonal**

*Permite a negocios crear programas de puntos, recompensas y fidelización de clientes de manera escalable*

[🚀 Inicio Rápido](#-inicio-rápido-5-minutos) • [📖 Documentación](#-documentación) • [🏗️ Arquitectura](#-arquitectura) • [💡 Casos de Uso](#-casos-de-uso)

</div>

---

## 📋 Tabla de Contenidos

- [¿Qué es TuLealtApp?](#-qué-es-tulealtapp)
- [Casos de Uso](#-casos-de-uso)
- [Inicio Rápido (5 minutos)](#-inicio-rápido-5-minutos)
- [Características Principales](#-características-principales)
- [Arquitectura](#-arquitectura)
- [Setup Completo](#-setup-completo)
- [Primeros Pasos](#-primeros-pasos-después-de-la-instalación)
- [APIs Disponibles](#-apis-disponibles)
- [Troubleshooting](#-troubleshooting)
- [Documentación Completa](#-documentación-completa)
- [Desarrollo](#-desarrollo)
- [Scripts Disponibles](#-scripts-disponibles)

---

## 🎯 ¿Qué es TuLealtApp?

**TuLealtApp** es una plataforma backend completa para **gestión de programas de lealtad** que permite a empresas (partners) crear y administrar sistemas de puntos, recompensas y beneficios para sus clientes.

### El Problema que Resuelve

Las empresas necesitan:
- ✅ Fidelizar clientes mediante programas de puntos
- ✅ Gestionar múltiples sucursales y ubicaciones
- ✅ Ofrecer recompensas personalizadas por nivel de cliente
- ✅ Tener control total de sus programas de lealtad
- ✅ Analíticas y métricas de rendimiento

### ¿Para Quién?

- **Partners (Negocios)**: Restaurantes, tiendas, gimnasios, spas, etc. que quieren fidelizar clientes
- **Clientes (Customers)**: Usuarios finales que acumulan puntos y canjean recompensas
- **Administradores (Admins)**: Gestores de la plataforma que supervisan todo el sistema

---

## 💡 Casos de Uso

### Ejemplo Real: Cadena de Restaurantes "Sabor Latino"

**Escenario:**
1. **Restaurante** crea cuenta en TuLealtApp como Partner
2. **Configura** 3 sucursales (Centro, Norte, Sur)
3. **Crea programa** de lealtad: "1 punto por cada $1 gastado"
4. **Define niveles** de cliente:
   - 🥉 Bronce (0-100 pts): 5% descuento
   - 🥈 Plata (101-500 pts): 10% descuento  
   - 🥇 Oro (501+ pts): 15% descuento + reward gratis mensual
5. **Añade recompensas**: Postre gratis (50 pts), Plato fuerte (150 pts), Cena completa (300 pts)
6. **Cliente** se registra, consume $50, recibe 50 puntos
7. **Cliente** canjea 50 puntos por postre gratis
8. **Restaurante** ve analíticas: clientes más frecuentes, sucursal más activa, ROI de recompensas

### Otros Casos de Uso

- **Gimnasio**: Puntos por asistencia, recompensas por clases especiales
- **Tienda de ropa**: Puntos por compra, descuentos por nivel VIP
- **Cafetería**: Puntos por visita, bebida gratis cada 10 visitas
- **Spa**: Puntos por servicio, masaje gratis para clientes oro

---

## 🚀 Inicio Rápido (5 minutos)

**¿Quieres ver el sistema funcionando ya?** Sigue estos 5 pasos:

### Opción A: Con Docker (Recomendado - Más Rápido)

```bash
# 1. Clonar repositorio
git clone <repository-url>
cd TuLealtApp-backend

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Levantar todo con Docker
docker-compose up -d

# 4. Esperar 30 segundos y ejecutar seeds (datos iniciales)
sleep 30
docker exec tulealtapp-admin-api-dev npm run seed:all

# 5. Abrir Swagger en el navegador
# ✅ Admin API: http://localhost:3000/admin/docs
# ✅ Partner API: http://localhost:3001/partner/docs
# ✅ Customer API: http://localhost:3002/customer/docs
```

### Opción B: Sin Docker (Desarrollo Local)

```bash
# 1. Clonar repositorio
git clone <repository-url>
cd TuLealtApp-backend

# 2. Instalar dependencias
npm install

# 3. Copiar variables de entorno y configurar DB
cp .env.example .env
# Editar .env: configurar DB_HOST, DB_USER, DB_PASSWORD

# 4. Levantar solo servicios de infraestructura
docker-compose up -d mariadb minio

# 5. Ejecutar migraciones y seeds
npm run migration:run
npm run seed:all

# 6. Levantar API (elige una o todas)
npm run start:admin     # http://localhost:3000/admin/docs
```

**🎉 ¡Listo!** Ya tienes el sistema corriendo. Ve a la sección [Primeros Pasos](#-primeros-pasos-después-de-la-instalación) para saber qué hacer ahora.

---

## ✨ Características Principales

### 🏢 Multi-Tenant y Multi-Sucursal
- Soporte para múltiples partners (empresas) independientes
- Cada partner puede tener múltiples tenants (marcas/divisiones)
- Cada tenant puede tener múltiples branches (sucursales)
- Aislamiento total de datos por tenant

### 💰 Sistema de Puntos Avanzado
- **Ledger inmutable**: Sistema de contabilidad de puntos basado en transacciones
- **Acumulación**: Reglas configurables de puntos por compra
- **Canje**: Recompensas con costos en puntos
- **Ajustes**: Sistema de ajustes manuales y reversiones
- **Expiración**: Puntos con fecha de vencimiento opcional
- **Auditoría completa**: Historial completo de todas las transacciones

### 🎁 Gestión de Recompensas
- Recompensas configurables por tenant
- Categorías de recompensas (productos, servicios, descuentos)
- Control de stock y disponibilidad
- Códigos de canje únicos y seguros
- Validación de elegibilidad por tier/branch
- Analytics de recompensas más canjeadas

### 🏆 Sistema de Niveles (Tiers)
- Niveles personalizables (Bronce, Plata, Oro, etc.)
- Beneficios escalonados por nivel
- Cálculo automático basado en puntos acumulados
- Políticas de tier configurables por tenant
- Historial de cambios de nivel

### 📊 Dashboard y Analytics
- **Métricas por sucursal**: Revenue, clientes, redemptions, performance score
- **Segmentación inteligente**: VIP, FREQUENT, OCCASIONAL, AT_RISK
- **Analytics de recompensas**: ROI, efficiency, top performers
- **Evolución histórica**: Growth de clientes por día/semana/mes
- **Cross-branch insights**: Clientes multi-sucursal, patrones de comportamiento

### 💳 Suscripciones y Facturación
- Gestión completa de suscripciones de partners
- Ciclos de facturación automatizados (cron jobs)
- Generación de invoices en PDF
- Integración con Stripe para pagos
- Aplicación automática de créditos
- Alertas de facturas pendientes

### 🔐 Autenticación y Autorización
- JWT authentication para todas las APIs
- Sistema de roles y permisos granular
- Profiles y permisos por usuario
- Guards de seguridad por recurso (tenant, branch, customer)
- Rate limiting configurable

### 📧 Comunicación
- Sistema de notificaciones internas
- Templates de emails configurables
- Mensajes por tenant
- Webhooks para eventos externos
- Integración SMTP (Hostinger, Gmail, etc.)

### 🗄️ Gestión de Datos
- Catálogos de países y monedas
- Tipo de cambio entre monedas
- Gestión de usuarios y staff
- Invitaciones con códigos únicos
- Sistema de solicitudes de partners

---

## 🏗️ Arquitectura

Este proyecto utiliza **Arquitectura Hexagonal (Ports & Adapters)** con **Domain-Driven Design (DDD)**.

### Diagrama Simplificado

```
┌────────────────────────────────────────────────────────────┐
│                   APPS LAYER (APIs)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Admin API   │  │ Partner API  │  │ Customer API │     │
│  │  (Port 3000) │  │  (Port 3001) │  │  (Port 3002) │     │
│  │              │  │              │  │              │     │
│  │ Controllers  │  │ Controllers  │  │ Controllers  │     │
│  │ Auth Guards  │  │ Auth Guards  │  │ Auth Guards  │     │
│  │ Swagger Docs │  │ Swagger Docs │  │ Swagger Docs │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────┬──────────────────────────────────┘
                          │ HTTP Requests
                          ▼
┌────────────────────────────────────────────────────────────┐
│              APPLICATION LAYER (Casos de Uso)              │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Handlers: CreateUser, GetRewards, ProcessLoyalty... │ │
│  │  DTOs: Request/Response objects                      │ │
│  │  Validations: class-validator                        │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────┬──────────────────────────────────┘
                          │ Uses
                          ▼
┌────────────────────────────────────────────────────────────┐
│           DOMAIN LAYER (Lógica de Negocio Pura)           │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Entities: User, Partner, Reward, Transaction...     │ │
│  │  Repository Interfaces: IUserRepository, ...         │ │
│  │  Business Rules: Pure TypeScript (no frameworks)     │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────┬──────────────────────────────────┘
                          │ Implemented by
                          ▼
┌────────────────────────────────────────────────────────────┐
│       INFRASTRUCTURE LAYER (Detalles Técnicos)            │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  TypeORM Entities: @Entity, @Column decorators       │ │
│  │  Repositories: Implementaciones con TypeORM           │ │
│  │  Mappers: Domain ↔ Persistence conversions           │ │
│  │  Storage: S3/MinIO integration                        │ │
│  │  External Services: Stripe, SMTP, etc.               │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────┬──────────────────────────────────┘
                          │ Persists to
                          ▼
                   ┌──────────────┐
                   │   MariaDB    │
                   │   Database   │
                   └──────────────┘
```

### Principios Clave

1. **Independencia de Frameworks**: El dominio no depende de NestJS, TypeORM, ni ningún framework
2. **Testabilidad**: Fácil hacer testing sin base de datos real
3. **Mantenibilidad**: Cambios en infraestructura no afectan la lógica de negocio
4. **Escalabilidad**: Fácil agregar nuevas features sin romper código existente

### Estructura de Carpetas

```
TuLealtApp-backend/
├── apps/                         # APIs (3 aplicaciones separadas)
│   ├── admin-api/                # API de administración
│   ├── partner-api/              # API para partners
│   └── customer-api/             # API para clientes
│
├── libs/                         # Librerías compartidas (monorepo)
│   ├── domain/                   # ⭐ CAPA DE DOMINIO
│   │   ├── entities/             # Entidades de negocio puras
│   │   └── repositories/         # Interfaces de repositorios
│   │
│   ├── application/              # ⭐ CAPA DE APLICACIÓN
│   │   └── [features]/           # Handlers + DTOs por feature
│   │       ├── *.handler.ts      # Lógica de casos de uso
│   │       ├── *.request.ts      # DTOs de entrada
│   │       └── *.response.ts     # DTOs de salida
│   │
│   ├── infrastructure/           # ⭐ CAPA DE INFRAESTRUCTURA
│   │   ├── persistence/          # TypeORM + Repositorios
│   │   │   ├── entities/         # Entidades con decoradores TypeORM
│   │   │   ├── mappers/          # Conversión domain ↔ persistence
│   │   │   ├── repositories/     # Implementaciones de repositorios
│   │   │   └── migrations/       # Migraciones de BD
│   │   ├── storage/              # S3/MinIO
│   │   ├── seeds/                # Datos iniciales
│   │   └── scripts/              # Scripts de mantenimiento
│   │
│   └── shared/                   # Utilidades compartidas
│       ├── guards/               # Guards de autenticación
│       ├── filters/              # Filtros de excepciones
│       ├── decorators/           # Decoradores custom
│       └── utils/                # Helpers y utilidades
│
└── z-docs/                       # 📚 Documentación completa
    ├── ARCHITECTURE.md           # Arquitectura detallada
    ├── API-GUIDELINE.md          # Guía de creación de APIs
    ├── DATABASE.md               # Guía de base de datos
    └── ...                       # Más documentación
```

**📖 Para más detalles:** [ARCHITECTURE.md](./z-docs/ARCHITECTURE.md)

---

## 📦 Setup Completo

### Prerrequisitos

| Herramienta | Versión Mínima | Versión Recomendada | Notas |
|-------------|---------------|---------------------|--------|
| **Node.js** | 18.x | 20.x LTS | Usar nvm para gestionar versiones |
| **npm** | 9.x | 10.x | Viene con Node.js |
| **Docker** | 20.x | 24.x+ | Solo si usas Docker |
| **Docker Compose** | 2.0 | 2.20+ | Solo si usas Docker |
| **MariaDB** | 10.5 | 10.11+ | Solo si NO usas Docker |
| **Git** | 2.x | Latest | Para clonar el repo |

**Verificar versiones:**
```bash
node --version    # v20.x.x
npm --version     # 10.x.x
docker --version  # Docker version 24.x.x
```

---

### 🐳 Opción 1: Desarrollo con Docker (Recomendado)

**Ventajas:**
- ✅ Setup más rápido
- ✅ No necesitas instalar MariaDB localmente
- ✅ Entorno consistente (igual para todos)
- ✅ Hot reload incluido
- ✅ Ideal para QA y testing

#### Instalación

**1. Clonar el repositorio**
```bash
git clone <repository-url>
cd TuLealtApp-backend
```

**2. Configurar variables de entorno**

Copia el archivo de ejemplo:
```bash
cp .env.example .env
```

El archivo `.env.example` ya tiene valores por defecto que funcionan con Docker. Solo necesitas cambiar:

```env
# JWT (cambiar en producción)
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Stripe (opcional, solo si vas a probar pagos)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Nota:** Las variables de base de datos (`DB_HOST`, `DB_USER`, etc.) ya están configuradas en `docker-compose.yml` y no necesitas cambiarlas.

**3. Levantar servicios con Docker**
```bash
# Construir imágenes (solo primera vez o después de cambios en Dockerfile)
docker-compose build

# Levantar todos los servicios
docker-compose up -d

# Ver logs para verificar que todo inició correctamente
docker-compose logs -f
```

**Servicios que se levantarán:**
- 🐳 `mariadb` - Base de datos (puerto 3306)
- 🐳 `minio` - Almacenamiento S3 (puerto 9000, consola en 9001)
- 🐳 `admin-api` - Admin API (puerto 3000)
- 🐳 `partner-api` - Partner API (puerto 3001)
- 🐳 `customer-api` - Customer API (puerto 3002)

**4. Esperar que los servicios estén listos**

La primera vez tarda ~1-2 minutos mientras:
- Se instalan las dependencias de Node.js
- Se inicializa MariaDB
- Se compilan las aplicaciones

```bash
# Verificar que todos los contenedores estén "healthy" o "running"
docker ps

# Ver logs en tiempo real
docker-compose logs -f admin-api
```

**5. Ejecutar migraciones y seeds**

Una vez que los servicios estén corriendo:

```bash
# Ejecutar migraciones (crear tablas)
docker exec tulealtapp-admin-api-dev npm run migration:run

# Ejecutar seeds (datos iniciales: admin user, países, monedas, etc.)
docker exec tulealtapp-admin-api-dev npm run seed:all
```

**6. Verificar que todo funcione**

Abre en tu navegador:
- ✅ **Admin API Swagger**: http://localhost:3000/admin/docs
- ✅ **Partner API Swagger**: http://localhost:3001/partner/docs
- ✅ **Customer API Swagger**: http://localhost:3002/customer/docs
- ✅ **MinIO Console**: http://localhost:9001 (usuario: `minioadmin`, password: `minioadmin`)

**7. Login con usuario admin**

Después de ejecutar los seeds, puedes hacer login:
- **Email**: `admin@example.com`
- **Password**: `Admin123!`

Usa el endpoint `POST /admin/auth/login` en Swagger.

#### Comandos Útiles (Docker)

```bash
# Ver logs en tiempo real
docker-compose logs -f
docker-compose logs -f admin-api    # Solo Admin API

# Detener todos los servicios
docker-compose down

# Reiniciar un servicio específico
docker-compose restart admin-api

# Reconstruir imágenes (después de cambios en package.json)
docker-compose build

# Limpiar todo (contenedores, volúmenes, imágenes)
docker-compose down -v --rmi all

# Entrar al shell de un contenedor
docker exec -it tulealtapp-admin-api-dev sh

# Ejecutar comandos dentro del contenedor
docker exec tulealtapp-admin-api-dev npm run migration:run
docker exec tulealtapp-admin-api-dev npm run seed:all
docker exec tulealtapp-admin-api-dev npm run test
```

---

### 💻 Opción 2: Desarrollo Local (Sin Docker para APIs)

**Ventajas:**
- ✅ Mayor control sobre el entorno
- ✅ Más rápido para desarrollo (no hay overhead de Docker)
- ✅ Fácil debugging con IDE
- ✅ Menos recursos de sistema

**Desventajas:**
- ❌ Necesitas instalar MariaDB localmente (o usar Docker solo para DB)
- ❌ Setup inicial más complejo

#### Instalación

**1. Clonar el repositorio**
```bash
git clone <repository-url>
cd TuLealtApp-backend
```

**2. Instalar dependencias**
```bash
npm install
```

**3. Configurar variables de entorno**

Copia el archivo de ejemplo y edítalo:
```bash
cp .env.example .env
```

Edita `.env` con tu editor favorito:

```env
# Database (ajustar según tu instalación de MariaDB)
DB_HOST=localhost
DB_PORT=3306
DB_USER=tulealtapp
DB_PASSWORD=tulealtapp
DB_NAME=tulealtapp
DB_ROOT_PASSWORD=rootpassword

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# AWS S3 / MinIO (localhost si usas Docker para MinIO)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=tulealtapp-images
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true

# API Ports
ADMIN_API_PORT=3000
PARTNER_API_PORT=3001
CUSTOMER_API_PORT=3002

# Stripe (opcional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (opcional para desarrollo)
SMTP_HOST=localhost
SMTP_PORT=3465
SMTP_SECURE=true
SMTP_FROM=noreply@tulealtapp.local
```

**4. Iniciar servicios de infraestructura**

Usa Docker solo para MariaDB y MinIO:
```bash
# Levantar solo servicios de infraestructura
docker-compose up -d mariadb minio

# Verificar que estén corriendo
docker ps
```

**5. Configurar base de datos**

Si instalaste MariaDB localmente (no Docker):
```bash
# Conectarse a MariaDB
mysql -u root -p

# Crear base de datos y usuario
CREATE DATABASE tulealtapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'tulealtapp'@'localhost' IDENTIFIED BY 'tulealtapp';
GRANT ALL PRIVILEGES ON tulealtapp.* TO 'tulealtapp'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**6. Ejecutar migraciones y seeds**
```bash
# Ejecutar migraciones (crear tablas)
npm run migration:run

# Ejecutar seeds (datos iniciales)
npm run seed:all
```

**7. Iniciar las APIs**

Abre 3 terminales separadas:

```bash
# Terminal 1: Admin API
npm run start:admin

# Terminal 2: Partner API
npm run start:partner

# Terminal 3: Customer API
npm run start:customer
```

**O usa un comando para todas a la vez:**
```bash
npm run start:all
```

**8. Verificar que todo funcione**

Abre en tu navegador:
- ✅ **Admin API Swagger**: http://localhost:3000/admin/docs
- ✅ **Partner API Swagger**: http://localhost:3001/partner/docs
- ✅ **Customer API Swagger**: http://localhost:3002/customer/docs
- ✅ **MinIO Console**: http://localhost:9001

---

## 🎬 Primeros Pasos (Después de la Instalación)

Ya tienes el sistema corriendo. ¿Y ahora qué? Aquí te guiamos:

### 1. Explora la Documentación de Swagger

Abre cualquier API en tu navegador:
- **Admin API**: http://localhost:3000/admin/docs

**¿Qué verás?**
- 📚 **Lista de endpoints** organizados por categorías (tags)
- 📝 **Documentación completa** de cada endpoint
- 🔍 **Ejemplos de request/response**
- 🧪 **Botón "Try it out"** para probar endpoints directamente

### 2. Hacer tu Primer Login

**En Swagger UI (Admin API):**

1. Ve a la sección **Auth**
2. Encuentra el endpoint `POST /admin/auth/login`
3. Haz clic en **"Try it out"**
4. Usa las credenciales del seed:
   ```json
   {
     "email": "admin@example.com",
     "password": "Admin123!"
   }
   ```
5. Haz clic en **"Execute"**
6. Copia el `accessToken` de la respuesta

### 3. Autenticarte en Swagger

1. Haz clic en el botón **"Authorize"** (candado verde) en la parte superior derecha
2. Pega el token que copiaste (sin el prefijo "Bearer")
3. Haz clic en **"Authorize"**
4. Ahora puedes probar endpoints protegidos

### 4. Explorar los Datos Iniciales

Los seeds crean datos de ejemplo. Prueba estos endpoints:

**Ver usuarios:**
```
GET /admin/users
```

**Ver partners:**
```
GET /admin/partners
```

**Ver catálogo de países:**
```
GET /admin/catalogs/countries
```

**Ver catálogo de monedas:**
```
GET /admin/catalogs/currencies
```

### 5. Crear tu Primer Partner

**En Swagger UI:**

1. Ve a `POST /admin/partners`
2. Usa este ejemplo:
   ```json
   {
     "name": "Mi Restaurante",
     "email": "contacto@mirestaurante.com",
     "phone": "+1234567890",
     "address": "Calle Principal 123",
     "countryId": 1,
     "website": "https://mirestaurante.com"
   }
   ```
3. Observa el ID del partner creado

### 6. Crear un Tenant para el Partner

1. Ve a `POST /admin/tenants`
2. Usa el ID del partner que creaste:
   ```json
   {
     "partnerId": 1,
     "name": "Sabor Latino",
     "description": "Restaurante de comida latina",
     "currencyId": 1
   }
   ```

### 7. Explorar Más Features

Ahora puedes explorar:
- **Branches**: Crear sucursales para el tenant
- **Loyalty Programs**: Configurar programas de lealtad
- **Rewards**: Crear recompensas
- **Customer Tiers**: Configurar niveles de cliente
- **Memberships**: Crear membresías de clientes

### 8. Ver Logs en Consola

Si estás usando Docker:
```bash
docker-compose logs -f admin-api
```

Si estás en local:
- Los logs aparecen en la terminal donde iniciaste la API

---

## 🌐 APIs Disponibles

El proyecto incluye **3 APIs separadas** para diferentes roles:

### 1. Admin API (Puerto 3000)

**¿Para quién?** Administradores del sistema (superadmins)

**Swagger UI:** http://localhost:3000/admin/docs

**Endpoints principales:**
- 👥 **Users**: Gestión de usuarios del sistema
- 🏢 **Partners**: Gestión de empresas
- 🏪 **Tenants**: Gestión de marcas/divisiones
- 🏬 **Branches**: Gestión de sucursales
- 💳 **Subscriptions**: Suscripciones de partners
- 💰 **Billing**: Ciclos de facturación e invoices
- 💸 **Payments**: Pagos y métodos de pago
- 🎁 **Rewards**: Gestión de recompensas
- 🏆 **Tiers**: Configuración de niveles de cliente
- 📊 **Analytics**: Dashboards y métricas
- 📧 **Notifications**: Sistema de notificaciones
- 🗂️ **Catalogs**: Países, monedas, categorías
- 🔑 **Permissions**: Roles y permisos
- 📝 **Profiles**: Perfiles de usuario

### 2. Partner API (Puerto 3001)

**¿Para quién?** Empresas (partners) que usan la plataforma

**Swagger UI:** http://localhost:3001/partner/docs

**Endpoints principales:**
- 👔 **Partner Profile**: Gestión del perfil del partner
- 🏪 **My Tenants**: Gestión de sus tenants
- 🏬 **My Branches**: Gestión de sus sucursales
- 🎯 **Loyalty Programs**: Configurar programas de lealtad
- 🎁 **Rewards**: Crear y gestionar recompensas
- 🏆 **Reward Rules**: Reglas de acumulación de puntos
- 👥 **Customers**: Ver clientes registrados
- 📊 **Dashboard**: Métricas y analytics
- 📈 **Branch Metrics**: Rendimiento por sucursal
- 💡 **Insights**: Insights de comportamiento de clientes
- 🔄 **Enrollments**: Inscripciones de clientes
- 🎫 **Invitation Codes**: Códigos de invitación
- 💱 **Pricing**: Planes y precios

### 3. Customer API (Puerto 3002)

**¿Para quién?** Clientes finales (usuarios de la app móvil)

**Swagger UI:** http://localhost:3002/customer/docs

**Endpoints principales:**
- 👤 **My Profile**: Gestión de perfil del cliente
- 🎯 **My Memberships**: Mis membresías activas
- 💎 **My Points**: Ver mis puntos por tenant
- 🎁 **Available Rewards**: Recompensas disponibles para canjear
- 🎫 **My Redemptions**: Historial de canjes
- 🏪 **Partners**: Ver partners disponibles
- 🏬 **Branches**: Ver sucursales
- 🎫 **Invitation Codes**: Usar códigos de invitación
- 💱 **Currencies**: Ver monedas disponibles

---

## 🔧 Troubleshooting

### Problemas Comunes y Soluciones

#### 1. Error: "Cannot connect to database"

**Síntoma:**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solución:**

**Si usas Docker:**
```bash
# Verificar que MariaDB esté corriendo
docker ps | grep mariadb

# Ver logs de MariaDB
docker logs tulealtapp-mariadb-dev

# Reiniciar MariaDB
docker-compose restart mariadb

# Esperar 10 segundos y reiniciar las APIs
docker-compose restart admin-api partner-api customer-api
```

**Si usas MariaDB local:**
```bash
# Verificar que MariaDB esté corriendo
sudo systemctl status mariadb    # Linux
brew services list               # macOS

# Iniciar MariaDB
sudo systemctl start mariadb     # Linux
brew services start mariadb      # macOS

# Verificar conexión
mysql -u tulealtapp -p -h localhost
```

---

#### 2. Error: "Cannot find module '@nestjs/schedule'"

**Síntoma:**
```
Error: Cannot find module '@nestjs/schedule'
```

**Solución:**

**Si usas Docker:**
```bash
# Reconstruir imágenes
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# O forzar reinstalación de dependencias
docker exec tulealtapp-admin-api-dev rm -rf node_modules package-lock.json
docker exec tulealtapp-admin-api-dev npm install
docker-compose restart admin-api
```

**Si usas local:**
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

---

#### 3. Error: "Port 3000 is already in use"

**Síntoma:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solución:**

**Opción A - Encontrar y matar el proceso:**
```bash
# Encontrar qué proceso usa el puerto
lsof -ti:3000         # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Matar el proceso
kill -9 <PID>         # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

**Opción B - Cambiar el puerto en .env:**
```env
ADMIN_API_PORT=3010
PARTNER_API_PORT=3011
CUSTOMER_API_PORT=3012
```

---

#### 4. Error: "Migration has already been run"

**Síntoma:**
```
Error: Migration "..." has already been executed
```

**Solución:**

```bash
# Ver estado de migraciones
npm run migration:show

# Si necesitas revertir la última migración
npm run migration:revert

# Si necesitas resetear completamente la BD (⚠️ CUIDADO: borra todos los datos)
npm run script:reset-db
```

---

#### 5. Seeds fallan: "Cannot insert duplicate key"

**Síntoma:**
```
Error: Duplicate entry 'admin@example.com' for key 'email'
```

**Solución:**

Los seeds ya fueron ejecutados. Si quieres volver a ejecutarlos:

```bash
# Opción 1: Limpiar y recrear BD
npm run script:reset-db
npm run migration:run
npm run seed:all

# Opción 2: Limpiar solo los datos (mantiene estructura)
npm run script:clean-db
npm run seed:all
```

---

#### 6. Docker: "Container is unhealthy"

**Síntoma:**
```bash
docker ps
# STATUS: (health: unhealthy)
```

**Solución:**

```bash
# Ver logs del contenedor unhealthy
docker logs tulealtapp-admin-api-dev

# Verificar salud de todos los servicios
docker ps --format "table {{.Names}}\t{{.Status}}"

# Reiniciar servicio específico
docker-compose restart admin-api

# Si persiste, reconstruir
docker-compose down
docker-compose up -d --build
```

---

#### 7. Hot Reload no funciona en Docker

**Síntoma:** Cambios en el código no se reflejan automáticamente

**Solución:**

Verifica que los volúmenes estén montados correctamente en `docker-compose.yml`:

```yaml
volumes:
  - .:/app                      # ✅ Debe estar presente
  - /app/node_modules           # ✅ Debe estar presente
```

Si no funciona:
```bash
# Reiniciar servicio
docker-compose restart admin-api

# Ver logs para verificar que detecta cambios
docker-compose logs -f admin-api
# Deberías ver: "File change detected. Starting incremental compilation..."
```

---

#### 8. MinIO: "Bucket does not exist"

**Síntoma:**
```
Error: The specified bucket does not exist
```

**Solución:**

```bash
# Inicializar bucket manualmente
docker exec tulealtapp-admin-api-dev npm run s3:init

# O crear bucket desde MinIO Console:
# 1. Ir a http://localhost:9001
# 2. Login: minioadmin / minioadmin
# 3. Crear bucket: "tulealtapp-images"
# 4. Hacer público: Settings > Access Policy > Public
```

---

#### 9. Swagger muestra "Failed to fetch"

**Síntoma:** Swagger UI carga pero las peticiones fallan

**Solución:**

**Verificar que la API esté corriendo:**
```bash
# Probar endpoint directamente
curl http://localhost:3000/admin/health

# Debería retornar: {"status":"ok"}
```

**Verificar CORS:**
Si accedes desde otro dominio, asegúrate que CORS esté habilitado en `main.ts`:
```typescript
app.enableCors({
  origin: '*', // En desarrollo
  credentials: true,
});
```

---

#### 10. JWT Token expirado

**Síntoma:**
```
Error: Unauthorized - jwt expired
```

**Solución:**

Simplemente haz login de nuevo y obtén un nuevo token:
```bash
# En Swagger UI:
# 1. Ir a POST /admin/auth/login
# 2. Usar credenciales
# 3. Copiar nuevo token
# 4. Autorizar de nuevo con el botón "Authorize"
```

Para cambiar la expiración del token, edita `.env`:
```env
JWT_EXPIRES_IN=24h  # Cambia a lo que necesites: 1h, 7d, 30d
```

---

### Comandos de Diagnóstico

```bash
# Ver estado de todos los contenedores
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f admin-api

# Verificar red de Docker
docker network ls
docker network inspect tulealtapp-backend_default

# Ejecutar comando dentro del contenedor
docker exec -it tulealtapp-admin-api-dev sh

# Verificar variables de entorno dentro del contenedor
docker exec tulealtapp-admin-api-dev env | grep DB_

# Verificar conectividad entre contenedores
docker exec tulealtapp-admin-api-dev ping mariadb

# Ver uso de recursos
docker stats
```

---

### Logs y Debugging

**Habilitar logs detallados:**

En `.env`:
```env
LOG_LEVEL=debug
NODE_ENV=development
```

**Ver logs de queries SQL:**

En `data-source.ts` (solo desarrollo):
```typescript
{
  type: 'mariadb',
  logging: true,  // ✅ Activar
  logger: 'advanced-console',
}
```

---

### ¿Sigues con problemas?

1. **Revisa la documentación completa:** [z-docs/](./z-docs/README.md)
2. **Arquitectura detallada:** [ARCHITECTURE.md](./z-docs/ARCHITECTURE.md)
3. **Guía de Docker:** [DOCKER.md](./z-docs/DOCKER.md)
4. **Guía de Base de Datos:** [DATABASE.md](./z-docs/DATABASE.md)

---

## 🛠️ Scripts Disponibles

### Desarrollo

```bash
# Iniciar APIs individuales (modo watch - hot reload)
npm run start:admin          # Admin API (3000)
npm run start:partner        # Partner API (3001)
npm run start:customer       # Customer API (3002)
npm run start:all            # Todas las APIs a la vez

# Iniciar con debugging habilitado
npm run start:dev:admin      # Admin API con debug
npm run start:dev:partner    # Partner API con debug
npm run start:dev:customer   # Customer API con debug
npm run start:dev:all        # Todas con debug
```

### Base de Datos

```bash
# Migraciones
npm run migration:generate   # Generar migración desde cambios en entidades
npm run migration:create     # Crear migración manual vacía
npm run migration:run        # Ejecutar migraciones pendientes
npm run migration:revert     # Revertir última migración
npm run migration:show       # Ver estado de migraciones

# Seeds (datos iniciales)
npm run seed:all             # Ejecutar todos los seeds
npm run seed:admin           # Solo seed de admin
npm run seed:partner         # Solo seed de partners
npm run seed:customer        # Solo seed de customers
npm run seed:country         # Solo seed de países
npm run seed:currency        # Solo seed de monedas
npm run seed:catalog         # Solo seed de catálogos
npm run seed:profiles        # Solo seed de profiles
npm run seed:permissions     # Solo seed de permissions
```

### Docker

```bash
# Desarrollo
npm run docker:build         # Construir imágenes
npm run docker:up            # Levantar servicios
npm run docker:down          # Detener servicios
npm run docker:logs          # Ver logs
npm run docker:restart       # Reiniciar servicios
npm run docker:clean         # Limpiar todo (contenedores, volúmenes, imágenes)

# Producción
npm run docker:build:prod    # Construir imágenes de producción
npm run docker:up:prod       # Levantar en producción
npm run docker:down:prod     # Detener producción
npm run docker:logs:prod     # Ver logs de producción
npm run docker:restart:prod  # Reiniciar producción
npm run docker:clean:prod    # Limpiar producción
```

### Producción

```bash
npm run build                # Compilar proyecto
npm run start:prod:admin     # Iniciar Admin API (compilado)
npm run start:prod:partner   # Iniciar Partner API (compilado)
npm run start:prod:customer  # Iniciar Customer API (compilado)
npm run start:prod:all       # Iniciar todas las APIs (compilado)
```

### Code Quality

```bash
npm run lint                 # Ejecutar ESLint
npm run format               # Formatear código con Prettier
npm run format:code          # Formatear y lint juntos
```

### Testing

```bash
npm run test                 # Ejecutar tests
npm run test:watch           # Tests en modo watch
npm run test:cov             # Tests con cobertura
npm run test:e2e             # Tests end-to-end
npm run test:debug           # Tests con debugging
```

### Scripts de Mantenimiento

```bash
# S3/MinIO
npm run s3:init              # Inicializar bucket de S3

# Utilidades
npm run script:clean-db                         # Limpiar datos (mantiene estructura)
npm run script:reset-db                         # Resetear BD completamente
npm run script:recalculate-subscription-usage   # Recalcular uso de suscripciones
npm run script:refresh-analytics                # Refrescar analytics
npm run script:test-email                       # Probar envío de emails
npm run script:validate-permissions             # Validar integridad de permisos

# Scripts de migración de datos
npm run script:migrate-profile-permissions      # Migrar permisos de profiles
npm run script:migrate-reward-rules-json        # Migrar reward rules de JSON a relacional
npm run script:migrate-loyalty-programs-json    # Migrar loyalty programs de JSON
npm run script:migrate-users-json               # Migrar users de JSON
npm run script:migrate-tier-benefits-json       # Migrar tier benefits de JSON
npm run script:migrate-customer-tiers-json      # Migrar customer tiers de JSON
npm run script:validate-customer-partners       # Validar migración de customer-partners
npm run script:validate-base-enrollments        # Validar y arreglar enrollments base

# Comisiones
npm run script:generate-commissions             # Generar comisiones para billing cycles
```

### Seguridad

```bash
npm run security:audit       # Auditar dependencias (vulnerabilidades)
npm run security:fix         # Arreglar vulnerabilidades automáticamente
npm run security:fix-force   # Arreglar con force (puede romper)
npm run security:check       # Check con nivel moderate
```

---

## 📚 Documentación Completa

Toda la documentación está en la carpeta **[`z-docs/`](./z-docs/README.md)**.

### 🏗️ Arquitectura y Guías

| Documento | Descripción |
|-----------|-------------|
| [ARCHITECTURE.md](./z-docs/ARCHITECTURE.md) | Arquitectura hexagonal (DDD) completa y detallada |
| [API-GUIDELINE.md](./z-docs/API-GUIDELINE.md) | Guía completa para crear APIs con Swagger |
| [CODING-GUIDELINE.md](./z-docs/CODING-GUIDELINE.md) | Estándares de código y mejores prácticas |

### 💾 Base de Datos

| Documento | Descripción |
|-----------|-------------|
| [DATABASE.md](./z-docs/DATABASE.md) | Configuración y uso de MariaDB |
| [migrations-README.md](./z-docs/infrastructure/migrations-README.md) | Sistema de migraciones |
| [seeds-README.md](./z-docs/infrastructure/seeds-README.md) | Sistema de seeds |

### 🐳 Docker y Deploy

| Documento | Descripción |
|-----------|-------------|
| [DOCKER.md](./z-docs/DOCKER.md) | Guía completa de Docker |

### 💰 Pagos y Facturación

| Documento | Descripción |
|-----------|-------------|
| [FLUJO-PAGOS-INVOICES-BILLING.md](./z-docs/FLUJO-PAGOS-INVOICES-BILLING.md) | Flujo completo de pagos |
| [STRIPE-INTEGRATION-GUIDE.md](./z-docs/STRIPE-INTEGRATION-GUIDE.md) | Integración con Stripe |

### 👥 Clientes y Lealtad

| Documento | Descripción |
|-----------|-------------|
| [FLUJO-CUSTOMER-MEMBERSHIP.md](./z-docs/FLUJO-CUSTOMER-MEMBERSHIP.md) | Flujo de membresías |

### ⏰ Cron Jobs

| Documento | Descripción |
|-----------|-------------|
| [GUIA-CRON-JOBS.md](./z-docs/GUIA-CRON-JOBS.md) | Guía completa de cron jobs |
| [RESUMEN-CRON-JOBS.md](./z-docs/RESUMEN-CRON-JOBS.md) | Resumen rápido |

### 📦 Almacenamiento

| Documento | Descripción |
|-----------|-------------|
| [STORAGE.md](./z-docs/STORAGE.md) | S3/MinIO configuration |

### 📊 Analytics y Dashboard

| Documento | Descripción |
|-----------|-------------|
| [QUICK-START-FRONTEND.md](./z-docs/QUICK-START-FRONTEND.md) | Quick start para frontend |
| [GUIA-FRONTEND-ADVANCED-DASHBOARD.md](./z-docs/GUIA-FRONTEND-ADVANCED-DASHBOARD.md) | Guía de dashboard avanzado |

**Ver índice completo:** [z-docs/README.md](./z-docs/README.md)

---

## 💻 Desarrollo

### Crear una Nueva Feature (Ejemplo: Create Order)

Sigue este flujo basado en arquitectura hexagonal:

#### 1. Crear Entidad de Dominio
```typescript
// libs/domain/src/entities/order.entity.ts
export class Order {
  constructor(
    public readonly id: number,
    public readonly tenantId: number,
    public readonly customerId: number,
    public readonly total: number,
    public readonly status: 'pending' | 'completed' | 'cancelled',
    public readonly createdAt: Date,
  ) {}

  // Factory method
  static create(tenantId: number, customerId: number, total: number): Order {
    return new Order(
      0, // ID será asignado por BD
      tenantId,
      customerId,
      total,
      'pending',
      new Date(),
    );
  }

  // Métodos de dominio
  complete(): Order {
    return new Order(
      this.id,
      this.tenantId,
      this.customerId,
      this.total,
      'completed',
      this.createdAt,
    );
  }
}
```

#### 2. Crear Interfaz de Repositorio
```typescript
// libs/domain/src/repositories/order.repository.interface.ts
import { Order } from '../entities/order.entity';

export interface IOrderRepository {
  findById(id: number): Promise<Order | null>;
  save(order: Order): Promise<Order>;
  findByTenant(tenantId: number): Promise<Order[]>;
}
```

#### 3. Crear Entidad de Persistencia
```typescript
// libs/infrastructure/src/persistence/entities/order.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { TenantEntity } from './tenant.entity';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  tenantId: number;

  @Column('int')
  customerId: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column('varchar', { length: 20 })
  status: string;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => TenantEntity)
  tenant: TenantEntity;
}
```

#### 4. Crear Mapper
```typescript
// libs/infrastructure/src/persistence/mappers/order.mapper.ts
import { Order } from '@libs/domain';
import { OrderEntity } from '../entities/order.entity';

export class OrderMapper {
  static toDomain(entity: OrderEntity): Order {
    return new Order(
      entity.id,
      entity.tenantId,
      entity.customerId,
      Number(entity.total),
      entity.status as any,
      entity.createdAt,
    );
  }

  static toPersistence(domain: Order): Partial<OrderEntity> {
    return {
      id: domain.id || undefined,
      tenantId: domain.tenantId,
      customerId: domain.customerId,
      total: domain.total,
      status: domain.status,
      createdAt: domain.createdAt,
    };
  }
}
```

#### 5. Implementar Repositorio
```typescript
// libs/infrastructure/src/persistence/repositories/order.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IOrderRepository, Order } from '@libs/domain';
import { OrderEntity } from '../entities/order.entity';
import { OrderMapper } from '../mappers/order.mapper';

@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
  ) {}

  async findById(id: number): Promise<Order | null> {
    const entity = await this.orderRepository.findOne({ where: { id } });
    return entity ? OrderMapper.toDomain(entity) : null;
  }

  async save(order: Order): Promise<Order> {
    const entityData = OrderMapper.toPersistence(order);
    const savedEntity = await this.orderRepository.save(entityData);
    return OrderMapper.toDomain(savedEntity);
  }

  async findByTenant(tenantId: number): Promise<Order[]> {
    const entities = await this.orderRepository.find({ where: { tenantId } });
    return entities.map(OrderMapper.toDomain);
  }
}
```

#### 6. Crear DTOs
```typescript
// libs/application/src/orders/create-order/create-order.request.ts
import { IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderRequest {
  @ApiProperty({ example: 1, description: 'ID del tenant' })
  @IsNumber()
  @IsPositive()
  tenantId: number;

  @ApiProperty({ example: 1, description: 'ID del customer' })
  @IsNumber()
  @IsPositive()
  customerId: number;

  @ApiProperty({ example: 150.50, description: 'Total de la orden' })
  @IsNumber()
  @IsPositive()
  total: number;
}

// libs/application/src/orders/create-order/create-order.response.ts
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  tenantId: number;

  @ApiProperty({ example: 1 })
  customerId: number;

  @ApiProperty({ example: 150.50 })
  total: number;

  @ApiProperty({ example: 'pending' })
  status: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;
}
```

#### 7. Crear Handler
```typescript
// libs/application/src/orders/create-order/create-order.handler.ts
import { Injectable, Inject } from '@nestjs/common';
import { IOrderRepository, Order } from '@libs/domain';
import { CreateOrderRequest } from './create-order.request';
import { CreateOrderResponse } from './create-order.response';

@Injectable()
export class CreateOrderHandler {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    // 1. Crear entidad de dominio
    const order = Order.create(
      request.tenantId,
      request.customerId,
      request.total,
    );

    // 2. Guardar
    const savedOrder = await this.orderRepository.save(order);

    // 3. Retornar response
    return {
      id: savedOrder.id,
      tenantId: savedOrder.tenantId,
      customerId: savedOrder.customerId,
      total: savedOrder.total,
      status: savedOrder.status,
      createdAt: savedOrder.createdAt,
    };
  }
}
```

#### 8. Crear Controlador
```typescript
// apps/admin-api/src/controllers/orders.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  CreateOrderHandler,
  CreateOrderRequest,
  CreateOrderResponse,
} from '@libs/application';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly createOrderHandler: CreateOrderHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva orden' })
  @ApiResponse({
    status: 201,
    description: 'Orden creada exitosamente',
    type: CreateOrderResponse,
  })
  async create(@Body() request: CreateOrderRequest): Promise<CreateOrderResponse> {
    return this.createOrderHandler.execute(request);
  }
}
```

#### 9. Crear Migración
```bash
npm run migration:generate libs/infrastructure/src/persistence/migrations/CreateOrdersTable
```

#### 10. Registrar en Módulo
```typescript
// apps/admin-api/src/admin-api.module.ts
import { OrdersController } from './controllers/orders.controller';
import { CreateOrderHandler } from '@libs/application';
import { OrderRepository } from '@libs/infrastructure';

@Module({
  controllers: [OrdersController],
  providers: [
    CreateOrderHandler,
    {
      provide: 'IOrderRepository',
      useClass: OrderRepository,
    },
  ],
})
export class AdminApiModule {}
```

### Convenciones de Código

**Ver documentación completa:** [CODING-GUIDELINE.md](./z-docs/CODING-GUIDELINE.md)

**Resumen rápido:**

- ✅ **Entidades de dominio**: Sin decoradores, readonly, métodos de negocio
- ✅ **Entidades de persistencia**: Con decoradores TypeORM
- ✅ **Handlers**: Un handler = un caso de uso
- ✅ **Repositorios**: Implementan interfaces de domain
- ✅ **Mappers**: `toDomain()` y `toPersistence()`
- ✅ **DTOs**: Request y Response separados
- ✅ **Nomenclatura**: PascalCase para clases, camelCase para variables
- ✅ **Archivos**: kebab-case (ej: `create-order.handler.ts`)

---

## 🚀 Despliegue

### Producción con Docker

```bash
# 1. Crear .env de producción con valores seguros
cp .env.example .env.production
# Editar y configurar valores de producción

# 2. Construir imágenes de producción
docker-compose -f docker-compose.prod.yml build

# 3. Levantar servicios
docker-compose -f docker-compose.prod.yml up -d

# 4. Ejecutar migraciones
docker exec tulealtapp-admin-api-prod npm run migration:run

# 5. Ver logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Variables de Entorno en Producción

**⚠️ IMPORTANTE:** Configura estas variables con valores seguros:

```env
# Node Environment
NODE_ENV=production

# JWT (CRÍTICO: cambiar a clave segura única)
JWT_SECRET=<genera-una-clave-muy-segura-de-al-menos-32-caracteres>
JWT_EXPIRES_IN=24h

# Database (usar credenciales seguras)
DB_HOST=<tu-servidor-mariadb>
DB_PORT=3306
DB_USER=<usuario-seguro>
DB_PASSWORD=<password-muy-segura>
DB_NAME=tulealtapp
DB_ROOT_PASSWORD=<root-password-muy-segura>

# AWS S3 (si usas S3 real en producción)
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY_ID=<tu-access-key>
S3_SECRET_ACCESS_KEY=<tu-secret-key>
S3_BUCKET_NAME=<tu-bucket>
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=false

# Stripe (modo producción)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email SMTP (producción)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=<tu-email@dominio.com>
SMTP_PASSWORD=<tu-password>
SMTP_FROM=noreply@tudominio.com

# Frontend URLs (producción)
CUSTOMER_UI_URL=https://app.tudominio.com
PARTNER_UI_URL=https://partner.tudominio.com
```

**Generar JWT_SECRET seguro:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Health Checks

Todas las APIs exponen un endpoint de health check:

```bash
# Verificar salud de las APIs
curl http://localhost:3000/health  # Admin API
curl http://localhost:3001/health  # Partner API
curl http://localhost:3002/health  # Customer API
```

Respuesta esperada:
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" }
  }
}
```

---

## 📊 Monitoreo y Logs

### Ver Logs en Producción

```bash
# Ver logs de todas las APIs
docker-compose -f docker-compose.prod.yml logs -f

# Ver logs de una API específica
docker-compose -f docker-compose.prod.yml logs -f admin-api

# Ver últimas 100 líneas
docker-compose -f docker-compose.prod.yml logs --tail=100

# Ver logs con timestamps
docker-compose -f docker-compose.prod.yml logs -t
```

### Niveles de Log

Configura el nivel de log en `.env`:
```env
LOG_LEVEL=info  # error, warn, info, debug, verbose
```

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# Tests en modo watch
npm run test:watch

# Tests con cobertura
npm run test:cov

# E2E tests
npm run test:e2e

# Debug tests
npm run test:debug
```

### Ejemplo de Test

```typescript
// libs/domain/src/entities/__tests__/order.entity.spec.ts
import { Order } from '../order.entity';

describe('Order Entity', () => {
  it('should create a new order', () => {
    const order = Order.create(1, 1, 150.50);
    
    expect(order.tenantId).toBe(1);
    expect(order.customerId).toBe(1);
    expect(order.total).toBe(150.50);
    expect(order.status).toBe('pending');
  });

  it('should complete an order', () => {
    const order = Order.create(1, 1, 150.50);
    const completed = order.complete();
    
    expect(completed.status).toBe('completed');
    expect(completed.id).toBe(order.id);
  });
});
```

---

## 🤝 Contribución

### Flujo de Trabajo

1. **Fork** el repositorio
2. **Crea una rama** desde `main`:
   ```bash
   git checkout -b feature/nueva-feature
   ```
3. **Realiza cambios** siguiendo las convenciones
4. **Ejecuta tests y lint**:
   ```bash
   npm run test
   npm run lint
   npm run format:code
   ```
5. **Commit** con mensajes descriptivos:
   ```bash
   git commit -m "feat: agregar endpoint de órdenes"
   ```
6. **Push** a tu fork:
   ```bash
   git push origin feature/nueva-feature
   ```
7. **Crea Pull Request** con descripción detallada

### Convenciones de Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva característica
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Formato de código (no afecta lógica)
- `refactor:` Refactorización de código
- `test:` Agregar o modificar tests
- `chore:` Cambios en build, CI, dependencias

**Ejemplos:**
```bash
feat: agregar endpoint para crear órdenes
fix: corregir cálculo de puntos en tier gold
docs: actualizar README con nuevos endpoints
refactor: extraer lógica de cálculo a helper
test: agregar tests para OrderMapper
chore: actualizar dependencias de seguridad
```

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE.md](./LICENSE.md) para más información.

---

## 🙏 Agradecimientos

Este proyecto utiliza:
- [NestJS](https://nestjs.com/) - Framework progresivo de Node.js
- [TypeORM](https://typeorm.io/) - ORM para TypeScript
- [MariaDB](https://mariadb.org/) - Base de datos relacional
- [Swagger](https://swagger.io/) - Documentación de APIs
- [Docker](https://www.docker.com/) - Contenedorización

---

<div align="center">

**¿Preguntas? ¿Problemas?**

[📚 Documentación Completa](./z-docs/README.md) • [🏗️ Arquitectura](./z-docs/ARCHITECTURE.md) • [🔧 Troubleshooting](#-troubleshooting)

---

**Desarrollado con ❤️ para TuLealtApp**

*Última actualización: 2026-02-06*

</div>
