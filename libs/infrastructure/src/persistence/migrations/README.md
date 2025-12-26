# Migraciones de Base de Datos

Este directorio contiene las migraciones de TypeORM para la base de datos.

## Estructura

Las migraciones siguen el formato: `[timestamp]-[NombreDescriptivo].ts`

Ejemplo: `1734567890000-CreatePartnersTenantsBranches.ts`

## Comandos

### Crear una nueva migración manualmente

```bash
npm run migration:create libs/infrastructure/src/persistence/migrations/NombreDeLaMigracion
```

### Generar migración automáticamente desde entidades

```bash
npm run migration:generate libs/infrastructure/src/persistence/migrations/NombreDeLaMigracion
```

### Ejecutar migraciones pendientes

```bash
npm run migration:run
```

### Revertir la última migración

```bash
npm run migration:revert
```

### Ver estado de migraciones

```bash
npm run migration:show
```

## Migraciones Existentes

Las migraciones se ejecutan en orden cronológico según su timestamp:

### 1. CreateInitialTables (1730000000000)

Crea las tablas iniciales del sistema:
- `users` - Usuarios del sistema
- `pricing_plans` - Planes de precios
- `pricing_periods` - Períodos de facturación de los planes
- `pricing_promotions` - Promociones por período
- `pricing_features` - Características de los planes
- `legacy_promotions` - Promociones legacy (una por plan)
- `rate_exchanges` - Tipos de cambio GTQ/USD

Incluye:
- Foreign keys con CASCADE delete para relaciones de pricing
- Índices para mejorar rendimiento en búsquedas por email y slug
- Campos con valores por defecto apropiados

### 2. CreatePartnersTenantsBranches (1734567890000)

Crea las tablas de partners, tenants y branches:
- `partners` - Tabla principal de partners
- `partner_subscriptions` - Suscripciones de partners
- `partner_limits` - Límites de partners según su plan
- `partner_stats` - Estadísticas actuales de partners
- `tenants` - Tabla principal de tenants (negocios)
- `tenant_features` - Características habilitadas de tenants
- `branches` - Sucursales de tenants

Incluye:
- Foreign keys con CASCADE delete
- Índices para mejorar rendimiento
- Campos con valores por defecto apropiados

### 3. CreatePartnerArchives (1766769531000)

Crea la tabla para archivar partners eliminados:
- `partner_archives` - Almacena partners eliminados con toda su información relacionada en formato JSON

Incluye:
- Campo JSON para almacenar toda la información del partner y sus relaciones (subscription, limits, stats, tenants con features y branches)
- Índices para búsquedas por ID original del partner y fecha de archivado
- Campo opcional `deletedBy` para auditoría

**Nota**: Esta tabla puede tener datos JSON ya que solo es para archivo/historial, no para consultas operativas.

## Notas Importantes

1. **Nunca modificar migraciones ya ejecutadas**: Si necesitas cambiar una migración que ya se ejecutó, crea una nueva migración.

2. **Orden de ejecución**: Las migraciones se ejecutan en orden cronológico según el timestamp.

3. **Producción**: Siempre revisa las migraciones antes de ejecutarlas en producción.

4. **Backup**: Haz backup de la base de datos antes de ejecutar migraciones en producción.
