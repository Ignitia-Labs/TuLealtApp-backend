# Guía de Configuración SMTP y Email Service

Esta guía explica cómo configurar y usar el servicio de email mejorado con soporte para GreenMail (desarrollo) y Hostinger (producción).

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración de GreenMail para Desarrollo](#configuración-de-greenmail-para-desarrollo)
3. [Configuración de Hostinger para Producción](#configuración-de-hostinger-para-producción)
4. [Uso del Servicio de Email](#uso-del-servicio-de-email)
5. [Verificación y Testing](#verificación-y-testing)
6. [Troubleshooting](#troubleshooting)
7. [Ejemplos Prácticos](#ejemplos-prácticos)

---

## 🎯 Requisitos Previos

- Docker y Docker Compose instalados
- Node.js >= 18.x
- Variables de entorno configuradas (`.env`)

---

## 🚀 Configuración de GreenMail para Desarrollo

### Paso 1: Iniciar GreenMail con Docker

GreenMail ya está configurado en `docker-compose.yml`. Para iniciarlo:

```bash
# Iniciar solo GreenMail
docker-compose up -d greenmail

# O iniciar todos los servicios (incluyendo GreenMail)
docker-compose up -d
```

### Paso 2: Verificar que GreenMail está corriendo

```bash
# Verificar el estado del contenedor
docker ps | grep greenmail

# Ver logs de GreenMail
docker logs tulealtapp-greenmail-dev

# Verificar que los puertos están expuestos
netstat -an | grep -E "3025|3465|8080"
```

**Puertos de GreenMail:**
- `3025`: SMTP sin SSL (no usado por defecto)
- `3465`: SMTP con SSL (SMTPS) - **Este es el que usamos**
- `8080`: Interfaz web para ver emails

### Paso 3: Configurar Variables de Entorno

Crea o actualiza tu archivo `.env` en la raíz del proyecto:

```env
# Configuración SMTP para Desarrollo (GreenMail)
SMTP_HOST=localhost
SMTP_PORT=3465
SMTP_SECURE=true
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@tulealtapp.local

# O si usas Docker Compose, usa el nombre del servicio:
# SMTP_HOST=greenmail
```

**Nota:** GreenMail acepta cualquier email sin autenticación, por eso `SMTP_USER` y `SMTP_PASSWORD` pueden estar vacíos.

### Paso 4: Acceder a la Interfaz Web de GreenMail

Una vez que GreenMail esté corriendo, puedes acceder a la interfaz web en:

```
http://localhost:8080
```

Esta interfaz te permite:
- Ver todos los emails enviados
- Ver el contenido HTML/texto de cada email
- Ver headers y metadatos
- Limpiar la bandeja de entrada

### Paso 5: Probar el Servicio

Inicia tu aplicación y verifica los logs:

```bash
npm run start:admin
```

Deberías ver en los logs algo como:

```
[EmailService] EmailService initialized with config: {"host":"localhost","port":3465,"secure":true,"hasAuth":false,"environment":"development"}
[EmailService] 📧 Modo desarrollo: Los emails se enviarán a GreenMail. Accede a http://localhost:8080 para verlos.
```

---

## 🌐 Configuración de Hostinger para Producción

### Paso 1: Obtener Credenciales SMTP de Hostinger

1. Inicia sesión en tu panel de Hostinger
2. Ve a **Email** → **Cuentas de Email**
3. Crea una cuenta de email o usa una existente
4. Ve a **Configuración SMTP** o **Configuración de Email**
5. Anota los siguientes datos:
   - **Servidor SMTP saliente:** `smtp.hostinger.com`
   - **Puerto:** `465`
   - **Seguridad:** SSL/TLS
   - **Usuario:** Tu email completo (ej: `noreply@tudominio.com`)
   - **Contraseña:** La contraseña de tu cuenta de email

### Paso 2: Configurar Variables de Entorno

En producción, configura tu `.env` o variables de entorno del servidor:

```env
# Configuración SMTP para Producción (Hostinger)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@tudominio.com
SMTP_PASSWORD=tu_password_seguro
SMTP_FROM=noreply@tudominio.com

# Asegúrate de que NODE_ENV esté en producción
NODE_ENV=production
```

**⚠️ IMPORTANTE:**
- Nunca commitees el archivo `.env` con credenciales reales
- Usa variables de entorno del sistema o un gestor de secretos en producción
- El puerto 465 **siempre** requiere SSL (`SMTP_SECURE=true`)

### Paso 3: Verificar la Configuración

El servicio detecta automáticamente que estás en producción y configura SSL correctamente:

```
[EmailService] EmailService initialized with config: {"host":"smtp.hostinger.com","port":465,"secure":true,"hasAuth":true,"environment":"production"}
```

---

## 📧 Uso del Servicio de Email

### Métodos Disponibles

El `EmailService` tiene los siguientes métodos públicos:

#### 1. `sendGenericEmail(options: SendEmailOptions)`

Envía un email genérico con soporte para múltiples destinatarios:

```typescript
import { EmailService, SendEmailOptions } from '@libs/infrastructure';

// Ejemplo básico
await emailService.sendGenericEmail({
  to: 'usuario@example.com',
  subject: 'Bienvenido a TuLealtApp',
  html: '<h1>¡Hola!</h1><p>Gracias por registrarte.</p>',
});

// Con múltiples destinatarios
await emailService.sendGenericEmail({
  to: ['usuario1@example.com', 'usuario2@example.com'],
  subject: 'Notificación importante',
  html: '<p>Este es un mensaje importante.</p>',
  cc: 'manager@example.com',
  bcc: 'archive@example.com',
  from: 'custom@tulealtapp.com', // Opcional, usa SMTP_FROM por defecto
});
```

#### 2. `sendInvoiceGeneratedEmail(invoice, partnerEmail, pdfUrl?)`

Envía un email cuando se genera una factura:

```typescript
await emailService.sendInvoiceGeneratedEmail(
  invoice,
  'partner@example.com',
  'https://s3.amazonaws.com/invoices/invoice-123.pdf' // Opcional
);
```

#### 3. `sendInvoiceDueSoonEmail(invoice, partnerEmail, daysUntilDue)`

Envía un recordatorio de factura por vencer:

```typescript
await emailService.sendInvoiceDueSoonEmail(
  invoice,
  'partner@example.com',
  3 // días hasta el vencimiento
);
```

#### 4. `sendPaymentReceivedEmail(invoice, partnerEmail, paymentAmount, paymentMethod)`

Envía confirmación de pago recibido:

```typescript
await emailService.sendPaymentReceivedEmail(
  invoice,
  'partner@example.com',
  1500.00,
  'credit_card'
);
```

#### 5. `verifyConnection()`

Verifica la conexión SMTP (útil para diagnóstico):

```typescript
const isConnected = await emailService.verifyConnection();
if (isConnected) {
  console.log('Conexión SMTP verificada correctamente');
} else {
  console.error('Error al conectar con el servidor SMTP');
}
```

---

## ✅ Verificación y Testing

### Test 1: Verificar que GreenMail está funcionando

```bash
# 1. Iniciar GreenMail
docker-compose up -d greenmail

# 2. Verificar logs
docker logs -f tulealtapp-greenmail-dev

# 3. Abrir interfaz web
open http://localhost:8080
```

### Test 2: Enviar un Email de Prueba

Crea un script de prueba (`test-email.ts`):

```typescript
import { EmailService } from '@libs/infrastructure';

async function testEmail() {
  const emailService = new EmailService();

  // Verificar conexión
  const connected = await emailService.verifyConnection();
  console.log('Conexión:', connected ? 'OK' : 'ERROR');

  // Enviar email de prueba
  try {
    await emailService.sendGenericEmail({
      to: 'test@example.com',
      subject: 'Email de Prueba',
      html: '<h1>Test</h1><p>Este es un email de prueba.</p>',
    });
    console.log('✅ Email enviado correctamente');
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
  }
}

testEmail();
```

Ejecuta el script:

```bash
ts-node -r tsconfig-paths/register test-email.ts
```

Luego verifica en http://localhost:8080 que el email apareció.

### Test 3: Verificar Configuración Automática

El servicio detecta automáticamente el entorno y configura SSL:

**En Desarrollo (puerto 3465):**
```typescript
// El servicio detecta automáticamente:
// - Puerto 3465 → SSL habilitado
// - GreenMail → rejectUnauthorized: false
// - Modo desarrollo → logging mejorado
```

**En Producción (puerto 465):**
```typescript
// El servicio detecta automáticamente:
// - Puerto 465 → SSL habilitado (forzado)
// - Hostinger → requiere autenticación
// - Modo producción → validaciones estrictas
```

---

## 🔧 Troubleshooting

### Problema 1: Error "ECONNREFUSED" o "ETIMEDOUT"

**Síntomas:**
```
Error: connect ECONNREFUSED localhost:3465
```

**Soluciones:**
1. Verificar que GreenMail está corriendo:
   ```bash
   docker ps | grep greenmail
   ```

2. Si no está corriendo, iniciarlo:
   ```bash
   docker-compose up -d greenmail
   ```

3. Verificar que el puerto está expuesto:
   ```bash
   docker port tulealtapp-greenmail-dev
   ```

4. Verificar la configuración en `.env`:
   ```env
   SMTP_HOST=localhost  # o 'greenmail' si usas Docker Compose
   SMTP_PORT=3465
   SMTP_SECURE=true
   ```

### Problema 2: Error de Certificado SSL

**Síntomas:**
```
Error: self signed certificate
```

**Solución:**
El servicio ya está configurado para aceptar certificados autofirmados en desarrollo con GreenMail. Si aún tienes problemas:

1. Verificar que `NODE_ENV=development`
2. Verificar que el puerto es 3465 (GreenMail SSL)
3. Revisar los logs del servicio

### Problema 3: Emails no aparecen en GreenMail

**Síntomas:**
El email se envía sin errores pero no aparece en la interfaz web.

**Soluciones:**
1. Verificar que estás usando el puerto correcto (3465 para SSL)
2. Limpiar la bandeja en GreenMail (botón "Clear" en la interfaz web)
3. Verificar los logs de GreenMail:
   ```bash
   docker logs -f tulealtapp-greenmail-dev
   ```

### Problema 4: Error de Autenticación en Producción

**Síntomas:**
```
Error: Invalid login: 535 Authentication failed
```

**Soluciones:**
1. Verificar que `SMTP_USER` es el email completo:
   ```env
   SMTP_USER=noreply@tudominio.com  # ✅ Correcto
   SMTP_USER=noreply                 # ❌ Incorrecto
   ```

2. Verificar que `SMTP_PASSWORD` es correcta
3. Verificar que el puerto es 465 y `SMTP_SECURE=true`
4. Algunos proveedores requieren habilitar "Acceso de aplicaciones menos seguras"

### Problema 5: Puerto 465 no funciona

**Síntomas:**
```
Error: connect ETIMEDOUT smtp.hostinger.com:465
```

**Soluciones:**
1. Verificar que `SMTP_SECURE=true` (obligatorio para puerto 465)
2. Verificar firewall/proxy que no bloquee el puerto 465
3. Probar con otro puerto si Hostinger lo permite (587 con STARTTLS)

---

## 💡 Ejemplos Prácticos

### Ejemplo 1: Enviar Email desde un Handler

```typescript
// libs/application/src/users/welcome-user/welcome-user.handler.ts
import { Injectable } from '@nestjs/common';
import { EmailService } from '@libs/infrastructure';

@Injectable()
export class WelcomeUserHandler {
  constructor(private readonly emailService: EmailService) {}

  async execute(userEmail: string, userName: string): Promise<void> {
    await this.emailService.sendGenericEmail({
      to: userEmail,
      subject: `¡Bienvenido a TuLealtApp, ${userName}!`,
      html: `
        <h1>¡Bienvenido!</h1>
        <p>Hola ${userName},</p>
        <p>Gracias por unirte a TuLealtApp.</p>
        <p>Saludos,<br>El equipo de TuLealtApp</p>
      `,
    });
  }
}
```

### Ejemplo 2: Enviar Email con Múltiples Destinatarios

```typescript
await emailService.sendGenericEmail({
  to: ['usuario@example.com'],
  cc: ['manager@example.com'],
  bcc: ['archive@example.com'],
  subject: 'Reporte Mensual',
  html: '<p>Adjunto encontrarás el reporte mensual.</p>',
});
```

### Ejemplo 3: Enviar Email con Template HTML Completo

```typescript
const htmlTemplate = `
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: #4CAF50; color: white; padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Notificación Importante</h1>
        </div>
        <div class="content">
          <p>Este es el contenido del email.</p>
        </div>
      </div>
    </body>
  </html>
`;

await emailService.sendGenericEmail({
  to: 'usuario@example.com',
  subject: 'Notificación',
  html: htmlTemplate,
});
```

### Ejemplo 4: Manejo de Errores

```typescript
try {
  await emailService.sendGenericEmail({
    to: 'usuario@example.com',
    subject: 'Test',
    html: '<p>Test</p>',
  });
  console.log('Email enviado correctamente');
} catch (error) {
  console.error('Error al enviar email:', error);
  // No lanzar el error si no quieres interrumpir el flujo principal
  // El servicio ya maneja los errores internamente
}
```

---

## 📚 Referencias

- [Documentación de Nodemailer](https://nodemailer.com/about/)
- [GreenMail Documentation](https://greenmail-mail-test.github.io/greenmail/)
- [Hostinger SMTP Settings](https://www.hostinger.com/tutorials/how-to-use-smtp)

---

## 🔐 Seguridad

### Buenas Prácticas

1. **Nunca commitees credenciales:**
   - Usa `.env` local para desarrollo
   - Usa variables de entorno del sistema en producción
   - Agrega `.env` a `.gitignore`

2. **Validación de Emails:**
   - El servicio valida automáticamente el formato de emails
   - Siempre valida emails de entrada antes de enviar

3. **Logging:**
   - El servicio no loguea contraseñas
   - Los logs incluyen información útil para debugging sin exponer datos sensibles

4. **SSL/TLS:**
   - Siempre usa SSL en producción (puerto 465)
   - En desarrollo, GreenMail usa certificados autofirmados (aceptados automáticamente)

---

**Última actualización:** 2025-01-28
