# 📋 Resumen Rápido: Cron Jobs - Configuración y Verificación

## 🎯 Ubicación de la Configuración

### **Archivos Clave:**

1. **Configuración del módulo:**
   ```
   apps/admin-api/src/admin-api.module.ts
   Línea 130: ScheduleModule.forRoot()
   ```

2. **Cron Job de Billing Cycles:**
   ```
   libs/application/src/billing-cycles/billing-cycle-generator.service.ts
   Línea 50: @Cron(CronExpression.EVERY_DAY_AT_2AM)
   ```

3. **Cron Job de Invoice Reminders:**
   ```
   libs/application/src/invoices/invoice-reminder.service.ts
   Línea 26: @Cron(CronExpression.EVERY_DAY_AT_9AM)
   ```

4. **Timezone en Docker:**
   ```
   Dockerfile.dev (líneas 10-12)
   docker-compose.yml (línea 67)
   ```

---

## ✅ Verificación Rápida

### **1. ¿Está el cron corriendo?**

```bash
# Ver logs en tiempo real
docker-compose logs -f admin-api

# Buscar mensajes del cron
docker-compose logs admin-api | grep -i "BillingCycleGeneratorService\|InvoiceReminderService"
```

**Logs esperados:**
```
[BillingCycleGeneratorService] Iniciando generación automática de ciclos...
[InvoiceReminderService] Iniciando envío de recordatorios...
```

---

### **2. ¿Se ejecutó hoy?**

```bash
# Ver ciclos generados hoy
docker-compose exec mariadb mysql -u tulealtapp -ptulealtapp tulealtapp -e \
  "SELECT COUNT(*) FROM billing_cycles WHERE DATE(billingDate) = CURDATE();"

# Ver facturas generadas hoy
docker-compose exec mariadb mysql -u tulealtapp -ptulealtapp tulealtapp -e \
  "SELECT COUNT(*) FROM invoices WHERE DATE(issueDate) = CURDATE();"
```

---

### **3. ¿El timezone es correcto?**

```bash
# Verificar timezone del contenedor
docker-compose exec admin-api date
# Debe mostrar fecha/hora en America/Mexico_City (o tu timezone configurado)

# Verificar variable de entorno
docker-compose exec admin-api sh -c 'echo $TZ'
# Debe mostrar: America/Mexico_City
```

---

## 🛠️ Mantenimiento

### **Ejecutar Manualmente:**

```bash
# Generar ciclo para una suscripción específica
POST /admin/billing-cycles/generate/:subscriptionId

# Ejecutar proceso completo (como el cron job)
POST /admin/billing-cycles/generate-all
```

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:3000/admin/billing-cycles/generate/1 \
  -H "Authorization: Bearer {admin_token}"
```

**Ejemplo en Swagger:**
```
http://localhost:3000/admin/docs
→ Buscar: POST /admin/billing-cycles/generate/{subscriptionId}
```

---

### **Cambiar Horario:**

**Archivo:** `libs/application/src/billing-cycles/billing-cycle-generator.service.ts`

```typescript
// Cambiar esta línea (línea 50):
@Cron(CronExpression.EVERY_DAY_AT_2AM)  // ← Cambiar aquí

// Opciones disponibles:
@Cron(CronExpression.EVERY_DAY_AT_3AM)        // 3:00 AM
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)   // Medianoche
@Cron('0 1 * * *')                            // 1:00 AM (formato cron)
```

---

### **Deshabilitar Temporalmente:**

```typescript
// Opción 1: Comentar el decorador
// @Cron(CronExpression.EVERY_DAY_AT_2AM)

// Opción 2: Agregar condición
@Cron(CronExpression.EVERY_DAY_AT_2AM)
async handleDailyBillingCycleGeneration() {
  if (process.env.DISABLE_BILLING_CRON === 'true') return;
  // ... resto del código
}
```

---

## 📊 Comandos Útiles

```bash
# Ver logs del cron job
docker-compose logs -f admin-api | grep -i "billing\|invoice"

# Ver solo errores
docker-compose logs admin-api | grep -i "error"

# Ver estado del contenedor
docker-compose ps admin-api

# Reiniciar Admin API (si es necesario)
docker-compose restart admin-api

# Ver logs de las últimas 24 horas
docker-compose logs --since 24h admin-api | grep -i "BillingCycleGeneratorService"
```

---

## 🔍 Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| Cron no se ejecuta | Verificar que contenedor está corriendo: `docker-compose ps admin-api` |
| Se ejecuta en hora incorrecta | Verificar timezone: `docker-compose exec admin-api date` |
| Genera errores | Ver logs: `docker-compose logs admin-api \| grep -i error` |
| No genera facturas | Verificar suscripciones: `SELECT * FROM partner_subscriptions WHERE nextBillingDate <= CURDATE()` |

---

**Para más detalles, ver:** `GUIA-CRON-JOBS.md`

