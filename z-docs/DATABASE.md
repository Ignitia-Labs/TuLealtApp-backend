# Configuración de Base de Datos - MariaDB

Esta guía explica cómo configurar y usar MariaDB con las APIs.

## Configuración Local

### Opción 1: MariaDB en Docker (Recomendado para desarrollo)

1. **Iniciar solo MariaDB en Docker:**
   ```bash
   docker-compose up -d mariadb
   ```

2. **Verificar que esté corriendo:**
   ```bash
   docker ps | grep mariadb
   ```

3. **Crear archivo `.env.local` en la raíz del proyecto:**
   ```env
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=tulealtapp
   DB_PASSWORD=tulealtapp
   DB_NAME=tulealtapp
   ```

4. **Ejecutar la API localmente:**
   ```bash
   npm run start:admin
   ```

### Opción 2: MariaDB Local

1. **Instalar MariaDB localmente** (si no lo tienes):
   ```bash
   # macOS
   brew install mariadb
   brew services start mariadb

   # Linux
   sudo apt-get install mariadb-server
   sudo systemctl start mariadb
   ```

2. **Crear base de datos y usuario:**
   ```sql
   CREATE DATABASE tulealtapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'tulealtapp'@'localhost' IDENTIFIED BY 'tulealtapp';
   GRANT ALL PRIVILEGES ON tulealtapp.* TO 'tulealtapp'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. **Configurar `.env.local`:**
   ```env
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=tulealtapp
   DB_PASSWORD=tulealtapp
   DB_NAME=tulealtapp
   ```

4. **Ejecutar la API:**
   ```bash
   npm run start:admin
   ```

## Configuración en Docker

### Desarrollo

Las variables de entorno ya están configuradas en `docker-compose.yml`. Solo necesitas:

```bash
npm run docker:up
```

### Producción

1. **Crear archivo `.env` con las credenciales de producción:**
   ```env
   NODE_ENV=production
   DB_HOST=mariadb
   DB_PORT=3306
   DB_USER=tu_usuario_prod
   DB_PASSWORD=tu_password_seguro
   DB_NAME=tulealtapp_prod
   DB_ROOT_PASSWORD=password_root_seguro
   ```

2. **Iniciar servicios:**
   ```bash
   npm run docker:up:prod
   ```

## Variables de Entorno

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `DB_HOST` | Host de la base de datos | `localhost` |
| `DB_PORT` | Puerto de MariaDB | `3306` |
| `DB_USER` | Usuario de la base de datos | `tulealtapp` |
| `DB_PASSWORD` | Contraseña del usuario | `tulealtapp` |
| `DB_NAME` | Nombre de la base de datos | `tulealtapp` |
| `DB_ROOT_PASSWORD` | Contraseña root (solo Docker) | `rootpassword` |

## Estructura de Tablas

Las tablas se crean automáticamente cuando `synchronize: true` está activado (solo en desarrollo).

### Tabla: users

```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  roles JSON NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);
```

## Migraciones (Producción)

En producción, se recomienda usar migraciones en lugar de `synchronize: true`.

### Estructura de Migraciones

Las migraciones se encuentran en: `libs/infrastructure/src/persistence/migrations/`

### Comandos Disponibles

#### Crear una nueva migración:

```bash
npm run migration:create libs/infrastructure/src/persistence/migrations/NombreDeLaMigracion
```

#### Generar migración automáticamente desde entidades:

```bash
npm run migration:generate libs/infrastructure/src/persistence/migrations/NombreDeLaMigracion
```

#### Ejecutar migraciones pendientes:

```bash
npm run migration:run
```

#### Revertir la última migración:

```bash
npm run migration:revert
```

#### Ver el estado de las migraciones:

```bash
npm run migration:show
```

### Migraciones Existentes

Las migraciones se ejecutan en orden cronológico según su timestamp:

1. **`1730000000000-CreateInitialTables.ts`** - Crea las tablas iniciales del sistema:
   - `users` - Usuarios del sistema
   - `pricing_plans` - Planes de precios
   - `pricing_periods` - Períodos de facturación de los planes
   - `pricing_promotions` - Promociones por período
   - `pricing_features` - Características de los planes
   - `legacy_promotions` - Promociones legacy (una por plan)
   - `rate_exchanges` - Tipos de cambio GTQ/USD

2. **`1734567890000-CreatePartnersTenantsBranches.ts`** - Crea las tablas de partners, tenants, branches y sus relaciones:
   - `partners` - Partners del sistema
   - `partner_subscriptions` - Suscripciones de partners
   - `partner_limits` - Límites de partners según su plan
   - `partner_stats` - Estadísticas actuales de partners
   - `tenants` - Tenants (negocios)
   - `tenant_features` - Características habilitadas de tenants
   - `branches` - Sucursales de tenants

3. **`1766349670000-CreateCurrencies.ts`** - Crea la tabla de monedas

4. **`1766349680000-UpdatePartnersTenantsCurrencyRelation.ts`** - Actualiza relaciones de moneda en partners y tenants

5. **`1766753859000-CreateCountries.ts`** - Crea la tabla de países

6. **`1766753860000-AddCountryRelations.ts`** - Agrega relaciones de país a partners y tenants

7. **`1766769531000-CreatePartnerArchives.ts`** - Crea tabla para archivar partners eliminados

8. **`1766772588000-UpdatePartnerRequestCountryToCountryId.ts`** - Actualiza partner requests para usar countryId

9. **`1766785140000-AddPlanIdAndBillingFrequencyToPartnerRequests.ts`** - Agrega campos de plan a partner requests

10. **`1766787800000-AddTaxFieldsToPartnerSubscriptions.ts`** - Agrega campos de impuestos a suscripciones

11. **`1766870089000-UpdatePartnerRequestCurrencyIdToInt.ts`** - Actualiza currencyId a entero en partner requests

12. **`1766872709000-CreateCatalogs.ts`** - Crea tabla de catálogos

13. **`1766873000000-AddSlugToCatalogs.ts`** - Agrega campo slug a catálogos

14. **`1766873100000-MakeSlugNotNullAndUnique.ts`** - Hace slug obligatorio y único

15. **`1766873200000-UpdateCategoriesToBusinessCategories.ts`** - Actualiza categorías a business categories

16. **`1767000000000-UpdateExistingTablesAndCreateNewEntities.ts`** - Migración grande que actualiza tablas existentes y crea nuevas entidades:
    - Actualiza tabla `users` con nuevos campos (partnerId, tenantId, branchId, points, qrCode, tierId)
    - Crea tablas: `pricing_plan_limits`, `rewards`, `transactions`, `points_rules`, `customer_tiers`, `reward_tiers`, `notifications`, `invitation_codes`, `billing_cycles`, `invoices`, `invoice_items`, `payments`, `saved_payment_methods`, `subscription_events`, `subscription_alerts`, `coupons`, `plan_changes`, `partner_requests`

17. **`1768000000000-AddPointsRuleAndCustomerTierFields.ts`** - Agrega campos relacionados con puntos y tiers

18. **`1768100000000-CreateCustomerMemberships.ts`** - Crea tabla de membresías de clientes

19. **`1768200000000-AddMembershipIdToTransactions.ts`** - Agrega membershipId a transacciones

20. **`1768200000000-RemoveCustomerFieldsFromUsers.ts`** - Elimina campos obsoletos de users (tenantId, branchId, points, tierId, qrCode) que ahora están en customer_memberships

## Conexión Manual

### Desde línea de comandos:

```bash
# Con Docker
docker exec -it tulealtapp-mariadb-dev mariadb -u tulealtapp -ptulealtapp tulealtapp

# Local
mariadb -u tulealtapp -ptulealtapp tulealtapp
```

### Desde cliente GUI:

- **Host:** `localhost`
- **Port:** `3306`
- **User:** `tulealtapp`
- **Password:** `tulealtapp`
- **Database:** `tulealtapp`

## Troubleshooting

### Error: "Cannot connect to database"

1. Verifica que MariaDB esté corriendo:
   ```bash
   docker ps | grep mariadb
   # o
   brew services list | grep mariadb
   ```

2. Verifica las variables de entorno:
   ```bash
   echo $DB_HOST
   echo $DB_PORT
   ```

3. Prueba la conexión manualmente:
   ```bash
   mariadb -h localhost -P 3306 -u tulealtapp -ptulealtapp tulealtapp
   ```

### Error: "Access denied"

1. Verifica las credenciales en `.env.local`
2. Asegúrate de que el usuario tenga permisos:
   ```sql
   GRANT ALL PRIVILEGES ON tulealtapp.* TO 'tulealtapp'@'%';
   FLUSH PRIVILEGES;
   ```

### Error: "Database does not exist"

1. Crea la base de datos:
   ```sql
   CREATE DATABASE tulealtapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. O deja que Docker la cree automáticamente con las variables de entorno.

## Backup y Restore

### Backup:

```bash
# Docker
docker exec tulealtapp-mariadb-dev mysqldump -u tulealtapp -ptulealtapp tulealtapp > backup.sql

# Local
mysqldump -u tulealtapp -ptulealtapp tulealtapp > backup.sql
```

### Restore:

```bash
# Docker
docker exec -i tulealtapp-mariadb-dev mariadb -u tulealtapp -ptulealtapp tulealtapp < backup.sql

# Local
mariadb -u tulealtapp -ptulealtapp tulealtapp < backup.sql
```

