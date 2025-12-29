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

Las migraciones se ejecutan en orden cronológico según su timestamp. Actualmente hay **20 migraciones** en total:

### Migraciones Principales

1. **CreateInitialTables (1730000000000)** - Tablas iniciales del sistema (users, pricing, etc.)
2. **CreatePartnersTenantsBranches (1734567890000)** - Partners, tenants y branches
3. **CreateCurrencies (1766349670000)** - Tabla de monedas
4. **UpdatePartnersTenantsCurrencyRelation (1766349680000)** - Relaciones de moneda
5. **CreateCountries (1766753859000)** - Tabla de países
6. **AddCountryRelations (1766753860000)** - Relaciones de país
7. **CreatePartnerArchives (1766769531000)** - Archivo de partners eliminados
8. **UpdatePartnerRequestCountryToCountryId (1766772588000)** - Actualización de countryId
9. **AddPlanIdAndBillingFrequencyToPartnerRequests (1766785140000)** - Campos de plan
10. **AddTaxFieldsToPartnerSubscriptions (1766787800000)** - Campos de impuestos
11. **UpdatePartnerRequestCurrencyIdToInt (1766870089000)** - CurrencyId a entero
12. **CreateCatalogs (1766872709000)** - Tabla de catálogos
13. **AddSlugToCatalogs (1766873000000)** - Campo slug
14. **MakeSlugNotNullAndUnique (1766873100000)** - Slug obligatorio y único
15. **UpdateCategoriesToBusinessCategories (1766873200000)** - Actualización de categorías
16. **UpdateExistingTablesAndCreateNewEntities (1767000000000)** - Migración grande con múltiples tablas nuevas
17. **AddPointsRuleAndCustomerTierFields (1768000000000)** - Campos de puntos y tiers
18. **CreateCustomerMemberships (1768100000000)** - Membresías de clientes
19. **AddMembershipIdToTransactions (1768200000000)** - MembershipId en transacciones
20. **RemoveCustomerFieldsFromUsers (1768200000000)** - Elimina campos obsoletos de users

Para ver detalles completos de cada migración, consulta [DATABASE.md](../DATABASE.md#migraciones-existentes).

## Notas Importantes

1. **Nunca modificar migraciones ya ejecutadas**: Si necesitas cambiar una migración que ya se ejecutó, crea una nueva migración.

2. **Orden de ejecución**: Las migraciones se ejecutan en orden cronológico según el timestamp.

3. **Producción**: Siempre revisa las migraciones antes de ejecutarlas en producción.

4. **Backup**: Haz backup de la base de datos antes de ejecutar migraciones en producción.
