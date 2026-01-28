/**
 * Script de prueba para verificar la configuración SMTP
 *
 * Uso:
 *   npm run script:test-email
 *
 * O directamente:
 *   ts-node -r tsconfig-paths/register libs/infrastructure/src/scripts/test-email.ts
 */

import { EmailService } from '../services/email.service';

async function testEmailService() {
  console.log('🧪 Iniciando prueba del servicio de email...\n');

  try {
    // Crear instancia del servicio
    const emailService = new EmailService();

    // Paso 1: Verificar conexión SMTP
    console.log('1️⃣ Verificando conexión SMTP...');
    const isConnected = await emailService.verifyConnection();

    if (!isConnected) {
      console.error('❌ Error: No se pudo conectar al servidor SMTP');
      console.log('\n💡 Verifica:');
      console.log('   - Que GreenMail esté corriendo: docker-compose up -d greenmail');
      console.log('   - Que las variables SMTP estén configuradas en .env');
      console.log('   - Que el puerto sea correcto (3465 para GreenMail SSL)');
      process.exit(1);
    }

    console.log('✅ Conexión SMTP verificada correctamente\n');

    // Paso 2: Enviar email de prueba
    console.log('2️⃣ Enviando email de prueba...');

    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    const testSubject = `[TEST] Email de Prueba - ${new Date().toISOString()}`;
    const testHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { padding: 20px; background-color: #f9f9f9; border-radius: 0 0 5px 5px; }
            .info { background-color: #e3f2fd; padding: 15px; margin: 15px 0; border-left: 4px solid #2196F3; }
            .success { color: #4CAF50; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Email de Prueba</h1>
            </div>
            <div class="content">
              <p>Este es un email de prueba del servicio SMTP de TuLealtApp.</p>
              <div class="info">
                <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
                <p><strong>Entorno:</strong> ${process.env.NODE_ENV || 'development'}</p>
                <p><strong>Servidor SMTP:</strong> ${process.env.SMTP_HOST || 'localhost'}:${process.env.SMTP_PORT || '3465'}</p>
              </div>
              <p>Si recibes este email, significa que la configuración SMTP está funcionando correctamente.</p>
              <p class="success">🎉 ¡Configuración exitosa!</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await emailService.sendGenericEmail({
      to: testEmail,
      subject: testSubject,
      html: testHtml,
    });

    console.log('✅ Email enviado correctamente\n');

    // Paso 3: Instrucciones finales
    console.log('3️⃣ Próximos pasos:\n');

    if (process.env.NODE_ENV !== 'production') {
      console.log('📧 Para ver el email enviado:');
      console.log('   → Abre http://localhost:8080 en tu navegador');
      console.log('   → Busca el email con el asunto:', testSubject);
      console.log('   → Haz clic en el email para ver su contenido\n');
    } else {
      console.log('📧 Verifica tu bandeja de entrada en:', testEmail);
      console.log('   (También revisa la carpeta de spam)\n');
    }

    console.log('✨ Prueba completada exitosamente!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error durante la prueba:');
    console.error(error);

    console.log('\n💡 Posibles soluciones:');
    console.log('   1. Verifica que GreenMail esté corriendo:');
    console.log('      docker-compose up -d greenmail');
    console.log('   2. Verifica las variables SMTP en .env:');
    console.log('      SMTP_HOST=localhost (o greenmail)');
    console.log('      SMTP_PORT=3465');
    console.log('      SMTP_SECURE=true');
    console.log('   3. Verifica los logs de GreenMail:');
    console.log('      docker logs tulealtapp-greenmail-dev');
    console.log('   4. Para producción, verifica las credenciales de Hostinger');

    process.exit(1);
  }
}

// Ejecutar la prueba
testEmailService();
