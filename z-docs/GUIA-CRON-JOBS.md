# Guía Completa: Configuración y Mantenimiento de Cron Jobs

## 📍 Ubicación de la Configuración

### **1. Configuración del Módulo de Scheduling**

**Archivo:** `apps/admin-api/src/admin-api.module.ts`

```typescript
@Module({
  imports: [
    ScheduleModule.forRoot(),  // ← Esta línea activa el sistema de cron jobs
    InfrastructureModule,
    StorageModule,
    AdminAuthModule,
  ],
  // ...
})
```

**¿Qué hace?**
- `ScheduleModule.forRoot()` inicializa el sistema de cron jobs de NestJS
- Se ejecuta cuando el Admin API inicia
- No requiere configuración adicional

---

### **2. Servicios con Cron Jobs**

#### **A. BillingCycleGeneratorService**

**Archivo:** `libs/application/src/billing-cycles/billing-cycle-generator.service.ts`

**Configuración del Cron:**
```typescript
@Cron(CronExpression.EVERY_DAY_AT_2AM)  // ← Se ejecuta diariamente a las 2:00 AM
async handleDailyBillingCycleGeneration() {
  // Lógica del cron job
}
```

**¿Qué hace?**
- Se ejecuta **diariamente a las 2:00 AM** (según el timezone del contenedor)
- Busca suscripciones activas con `nextBillingDate <= hoy`
- Genera automáticamente `BillingCycle` e `Invoice` para cada suscripción
- Envía emails a los partners
- Actualiza períodos de suscripción

#### **B. InvoiceReminderService**

**Archivo:** `libs/application/src/invoices/invoice-reminder.service.ts`

**Configuración del Cron:**
```typescript
@Cron(CronExpression.EVERY_DAY_AT_9AM)  // ← Se ejecuta diariamente a las 9:00 AM
async handleDailyInvoiceReminders() {
  // Lógica del cron job
}
```

**¿Qué hace?**
- Se ejecuta **diariamente a las 9:00 AM** (según el timezone del contenedor)
- Busca facturas pendientes de todos los partners
- Envía recordatorios si la factura vence en 3 días o menos
- Envía recordatorios si la factura ya está vencida

---

### **3. Registro de Servicios**

**Archivo:** `apps/admin-api/src/admin-api.module.ts`

Los servicios deben estar registrados como **providers**:

```typescript
providers: [
  // ...
  BillingCycleGeneratorService,  // ← Registrado aquí
  InvoiceReminderService,         // ← Registrado aquí
  // ...
]
```

---

## 🔍 Cómo Revisar si se Está Ejecutando

### **Método 1: Ver Logs del Contenedor (Recomendado)**

```bash
# Ver logs en tiempo real del Admin API
docker-compose logs -f admin-api

# O solo los logs del servicio específico
docker-compose logs -f admin-api | grep -i "billing\|invoice\|cron"
```

**Logs esperados cuando se ejecuta el cron:**

```
[BillingCycleGeneratorService] Iniciando generación automática de ciclos de facturación...
[BillingCycleGeneratorService] Encontradas 5 suscripciones para facturar
[BillingCycleGeneratorService] Generando ciclo para suscripción 1 (Partner 1)
[BillingCycleGeneratorService] Ciclo 1 y factura generados exitosamente para suscripción 1
[BillingCycleGeneratorService] Generación completada: 5 exitosas, 0 errores
```

---

### **Método 2: Verificar en la Base de Datos**

```sql
-- Ver ciclos generados recientemente
SELECT * FROM billing_cycles
WHERE billingDate >= DATE_SUB(NOW(), INTERVAL 1 DAY)
ORDER BY createdAt DESC;

-- Ver facturas generadas recientemente
SELECT * FROM invoices
WHERE issueDate >= DATE_SUB(NOW(), INTERVAL 1 DAY)
ORDER BY createdAt DESC;

-- Ver suscripciones que deberían facturarse hoy
SELECT id, partnerId, nextBillingDate, status, autoRenew
FROM partner_subscriptions
WHERE status = 'active'
  AND autoRenew = true
  AND nextBillingDate <= CURDATE();
```

---

### **Método 3: Verificar Timezone del Contenedor**

```bash
# Entrar al contenedor
docker-compose exec admin-api sh

# Verificar timezone
date
# Debería mostrar la fecha/hora en el timezone configurado (America/Mexico_City)

# Ver variable de entorno
echo $TZ
# Debería mostrar: America/Mexico_City
```

---

### **Método 4: Verificar que el Servicio Está Activo**

```bash
# Verificar que el contenedor está corriendo
docker-compose ps admin-api

# Ver logs de inicio (debería mostrar que ScheduleModule está activo)
docker-compose logs admin-api | grep -i "schedule\|cron\|billing"
```

---

## 🛠️ Mantenimiento y Administración

### **1. Cambiar el Horario de Ejecución**

#### **Opción A: Cambiar Expresión Cron**

**Archivo:** `libs/application/src/billing-cycles/billing-cycle-generator.service.ts`

```typescript
// Ejemplos de expresiones cron disponibles:
@Cron(CronExpression.EVERY_DAY_AT_2AM)        // 2:00 AM diario
@Cron(CronExpression.EVERY_DAY_AT_3AM)        // 3:00 AM diario
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)   // Medianoche diario
@Cron('0 1 * * *')                            // 1:00 AM diario (formato cron estándar)
@Cron('0 */6 * * *')                          // Cada 6 horas
@Cron('0 0 * * 1')                            // Cada lunes a medianoche
```

**Expresiones cron personalizadas:**
```typescript
// Formato: segundo minuto hora día mes día-semana
@Cron('0 0 2 * * *')    // 2:00 AM todos los días
@Cron('0 30 1 * * *')   // 1:30 AM todos los días
@Cron('0 0 0 * * 1')    // Lunes a medianoche
```

#### **Opción B: Usar Variable de Entorno (Recomendado para Producción)**

```typescript
// En el servicio
@Cron(process.env.BILLING_CRON_SCHEDULE || CronExpression.EVERY_DAY_AT_2AM)
async handleDailyBillingCycleGeneration() {
  // ...
}
```

```yaml
# En docker-compose.yml
environment:
  - BILLING_CRON_SCHEDULE=0 0 2 * * *  # 2:00 AM
```

---

### **2. Ejecutar Manualmente (Para Testing o Corrección)**

#### **✅ Endpoints Disponibles (Ya Implementados)**

**A. Generar ciclo para una suscripción específica:**

```bash
POST /admin/billing-cycles/generate/:subscriptionId
Authorization: Bearer {admin_token}
```

**Ejemplo:**
```bash
curl -X POST http://localhost:3000/admin/billing-cycles/generate/1 \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json"
```

**Respuesta:**
```json
{
  "message": "Ciclo de facturación generado exitosamente para suscripción 1"
}
```

**B. Ejecutar proceso completo de generación automática:**

```bash
POST /admin/billing-cycles/generate-all
Authorization: Bearer {admin_token}
```

**Ejemplo:**
```bash
curl -X POST http://localhost:3000/admin/billing-cycles/generate-all \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json"
```

**Respuesta:**
```json
{
  "message": "Proceso de generación automática de ciclos ejecutado exitosamente"
}
```

**¿Cuándo usar cada uno?**
- `POST /admin/billing-cycles/generate/:subscriptionId` - Para generar ciclo de una suscripción específica
- `POST /admin/billing-cycles/generate-all` - Para ejecutar el proceso completo (como el cron job)

#### **Opción C: Ejecutar desde la Consola del Contenedor (Avanzado)**

```bash
# Entrar al contenedor
docker-compose exec admin-api sh

# Ejecutar Node.js interactivo
node

# En Node.js:
const { NestFactory } = require('@nestjs/core');
const { AdminApiModule } = require('./dist/apps/admin-api/src/admin-api.module');
const app = await NestFactory.createApplicationContext(AdminApiModule);
const service = app.get('BillingCycleGeneratorService');
await service.generateBillingCycleManually(1);
```

**Nota:** Los endpoints REST son más fáciles de usar y están disponibles en Swagger UI.

---

### **3. Deshabilitar Temporalmente un Cron Job**

#### **Opción A: Comentar el Decorador**

```typescript
// @Cron(CronExpression.EVERY_DAY_AT_2AM)  // ← Comentar esta línea
async handleDailyBillingCycleGeneration() {
  // ...
}
```

#### **Opción B: Agregar Condición**

```typescript
@Cron(CronExpression.EVERY_DAY_AT_2AM)
async handleDailyBillingCycleGeneration() {
  if (process.env.DISABLE_BILLING_CRON === 'true') {
    this.logger.log('Billing cycle generation is disabled');
    return;
  }
  // ... resto del código
}
```

```yaml
# En docker-compose.yml
environment:
  - DISABLE_BILLING_CRON=true
```

---

### **4. Monitorear Ejecuciones**

#### **Agregar Métricas (Opcional)**

```typescript
@Cron(CronExpression.EVERY_DAY_AT_2AM)
async handleDailyBillingCycleGeneration() {
  const startTime = Date.now();
  this.logger.log('Iniciando generación automática de ciclos de facturación...');

  try {
    // ... código existente ...

    const duration = Date.now() - startTime;
    this.logger.log(
      `Generación completada en ${duration}ms: ${successCount} exitosas, ${errorCount} errores`,
    );

    // Opcional: Enviar métricas a sistema de monitoreo
    // await this.metricsService.record('billing_cycle_generation', {
    //   duration,
    //   successCount,
    //   errorCount,
    // });
  } catch (error) {
    this.logger.error('Error en generación automática de ciclos:', error);
    // Opcional: Enviar alerta
    // await this.alertService.send('Billing cycle generation failed', error);
  }
}
```

---

### **5. Verificar Errores y Debugging**

#### **Ver Logs de Errores**

```bash
# Ver solo errores
docker-compose logs admin-api | grep -i "error\|failed\|exception"

# Ver errores del cron job específico
docker-compose logs admin-api | grep -i "BillingCycleGeneratorService.*error"
```

#### **Agregar Más Logging (Si es necesario)**

```typescript
@Cron(CronExpression.EVERY_DAY_AT_2AM)
async handleDailyBillingCycleGeneration() {
  this.logger.log('Iniciando generación automática de ciclos de facturación...');
  this.logger.debug(`Timezone del sistema: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
  this.logger.debug(`Fecha actual: ${new Date().toISOString()}`);

  // ... resto del código ...
}
```

---

### **6. Cambiar Timezone**

**Archivos a modificar:**

1. **`Dockerfile.dev`** y **`Dockerfile`**:
```dockerfile
ENV TZ=America/Mexico_City  # Cambiar por tu timezone
```

2. **`docker-compose.yml`** y **`docker-compose.prod.yml`**:
```yaml
environment:
  - TZ=America/Mexico_City  # Cambiar por tu timezone
```

**Timezones comunes:**
- `America/Mexico_City` - México
- `America/New_York` - Este de USA
- `America/Los_Angeles` - Oeste de USA
- `Europe/Madrid` - España
- `UTC` - Tiempo universal

**Después de cambiar:**
```bash
# Reconstruir contenedores
docker-compose down
docker-compose build admin-api
docker-compose up -d admin-api

# Verificar
docker-compose exec admin-api date
```

---

## 📊 Verificación de Estado

### **Checklist de Verificación**

```bash
# 1. Verificar que el contenedor está corriendo
docker-compose ps admin-api
# Debe mostrar: Up (healthy)

# 2. Verificar timezone
docker-compose exec admin-api date
# Debe mostrar fecha/hora en el timezone correcto

# 3. Ver logs de inicio
docker-compose logs admin-api | grep -i "schedule\|admin api running"
# Debe mostrar que ScheduleModule está activo

# 4. Verificar que los servicios están registrados
docker-compose logs admin-api | grep -i "BillingCycleGeneratorService\|InvoiceReminderService"
# No debería mostrar errores

# 5. Ver logs de ejecución (esperar a la hora programada)
docker-compose logs -f admin-api | grep -i "billing\|invoice"
# Debe mostrar logs cuando se ejecuta el cron
```

---

## 🔧 Troubleshooting

### **Problema: El cron no se ejecuta**

**Posibles causas y soluciones:**

1. **El contenedor no está corriendo**
   ```bash
   docker-compose ps admin-api
   # Si no está corriendo:
   docker-compose up -d admin-api
   ```

2. **ScheduleModule no está importado**
   - Verificar que `ScheduleModule.forRoot()` está en `AdminApiModule`
   - Verificar que el servicio está registrado como provider

3. **Timezone incorrecto**
   ```bash
   docker-compose exec admin-api date
   # Si el timezone es incorrecto, verificar variables de entorno
   ```

4. **El servicio no está registrado**
   - Verificar que `BillingCycleGeneratorService` está en los providers del módulo

5. **Error en el código del cron**
   ```bash
   # Ver logs de errores
   docker-compose logs admin-api | grep -i "error"
   ```

---

### **Problema: El cron se ejecuta en hora incorrecta**

**Solución:**
1. Verificar timezone del contenedor
2. Verificar variable `TZ` en docker-compose
3. Reconstruir contenedor después de cambiar timezone

---

### **Problema: El cron genera errores**

**Solución:**
1. Ver logs detallados:
   ```bash
   docker-compose logs admin-api | grep -i "error\|exception"
   ```

2. Verificar que las dependencias están disponibles:
   - Base de datos conectada
   - Servicios de email funcionando
   - Repositorios inyectados correctamente

3. Ejecutar manualmente para debugging:
   ```bash
   POST /admin/billing-cycles/generate/{subscriptionId}
   ```

---

## 📝 Ejemplos de Uso

### **Ejemplo 1: Verificar que el Cron se Ejecutó Hoy**

```bash
# Ver logs de hoy
docker-compose logs --since 24h admin-api | grep -i "BillingCycleGeneratorService"

# Ver en base de datos
docker-compose exec mariadb mysql -u tulealtapp -ptulealtapp tulealtapp -e \
  "SELECT COUNT(*) as ciclos_hoy FROM billing_cycles WHERE DATE(billingDate) = CURDATE();"
```

---

### **Ejemplo 2: Ejecutar Manualmente para Testing**

```bash
# Generar ciclo para una suscripción específica
curl -X POST http://localhost:3000/admin/billing-cycles/generate/1 \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json"

# O ejecutar el proceso completo (como el cron job)
curl -X POST http://localhost:3000/admin/billing-cycles/generate-all \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json"

# También disponible en Swagger UI:
# http://localhost:3000/admin/docs
# Buscar: POST /admin/billing-cycles/generate/{subscriptionId}
```

---

### **Ejemplo 3: Cambiar Horario Temporalmente**

```typescript
// Cambiar a cada hora para testing
@Cron('0 * * * * *')  // Cada hora
async handleDailyBillingCycleGeneration() {
  // ...
}
```

**Luego revertir a:**
```typescript
@Cron(CronExpression.EVERY_DAY_AT_2AM)
```

---

## 🎯 Resumen de Ubicaciones Clave

| Componente | Archivo | Línea Aproximada |
|------------|---------|------------------|
| **Configuración del módulo** | `apps/admin-api/src/admin-api.module.ts` | 130 |
| **Cron Billing Cycles** | `libs/application/src/billing-cycles/billing-cycle-generator.service.ts` | 50 |
| **Cron Invoice Reminders** | `libs/application/src/invoices/invoice-reminder.service.ts` | 26 |
| **Timezone Docker Dev** | `Dockerfile.dev` | 10-12 |
| **Timezone Docker Prod** | `Dockerfile` | 25-28 |
| **Timezone docker-compose** | `docker-compose.yml` | 67 |
| **Timezone docker-compose prod** | `docker-compose.prod.yml` | 38 |

---

## 📚 Referencias

- [NestJS Schedule Module](https://docs.nestjs.com/techniques/task-scheduling)
- [Cron Expression Format](https://crontab.guru/)
- [Node.js Timezone Handling](https://nodejs.org/api/intl.html)

---

**Última actualización:** 2025-01-20

