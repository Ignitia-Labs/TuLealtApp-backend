import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

/**
 * Migración para convertir el campo planId de varchar a integer en partner_subscriptions
 *
 * Esta migración:
 * 1. Convierte todos los planId que sean slugs (texto) a IDs numéricos consultando pricing_plans
 * 2. Cambia el tipo de columna de varchar(100) a int
 * 3. Agrega una foreign key constraint hacia pricing_plans.id
 *
 * Precauciones:
 * - Si un slug no se encuentra, se intentará usar el plan por defecto más común (esencia)
 * - Si no hay ningún plan disponible, se marcará como NULL temporalmente (requiere atención manual)
 * - Se registran todos los casos problemáticos en los logs
 */
export class ConvertPlanIdToIntegerInPartnerSubscriptions1808000000000
  implements MigrationInterface
{
  name = 'ConvertPlanIdToIntegerInPartnerSubscriptions1808000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('partner_subscriptions');

    if (!table) {
      console.log('⚠️ Tabla partner_subscriptions no encontrada.');
      return;
    }

    const planIdColumn = table.findColumnByName('planId');
    if (!planIdColumn) {
      console.log('⚠️ Columna planId no encontrada en partner_subscriptions.');
      return;
    }

    // Verificar si ya es integer
    if (planIdColumn.type === 'int' || planIdColumn.type === 'integer') {
      console.log('✅ Columna planId ya es de tipo integer.');
      return;
    }

    console.log('🔄 Iniciando conversión de planId de varchar a integer...');

    // Paso 1: Obtener todos los registros con planId que no sean numéricos (slugs)
    const subscriptions = await queryRunner.query(
      'SELECT id, planId FROM partner_subscriptions WHERE planId IS NOT NULL AND planId != ""',
    );

    let convertedCount = 0;
    let alreadyNumericCount = 0;
    let notFoundCount = 0;
    const notFoundSlugs = new Set<string>();
    const conversionMap = new Map<number, number>(); // subscriptionId -> planId numérico

    // Paso 2: Convertir slugs a IDs numéricos
    for (const subscription of subscriptions) {
      const planIdValue = subscription.planId;

      // Verificar si ya es numérico
      const numericPlanId = parseInt(planIdValue, 10);
      if (!isNaN(numericPlanId) && numericPlanId.toString() === planIdValue.trim()) {
        // Ya es numérico, solo guardar el mapeo
        conversionMap.set(subscription.id, numericPlanId);
        alreadyNumericCount++;
        continue;
      }

      // Es un slug, buscar en pricing_plans
      // Primero intentar con el slug tal cual
      let plan = await queryRunner.query('SELECT id FROM pricing_plans WHERE slug = ? LIMIT 1', [
        planIdValue.trim(),
      ]);

      // Si no se encuentra, intentar sin prefijo "plan-" si existe
      if (!plan || plan.length === 0) {
        const slugWithoutPrefix = planIdValue.replace(/^plan-/, '').trim();
        if (slugWithoutPrefix !== planIdValue.trim()) {
          plan = await queryRunner.query('SELECT id FROM pricing_plans WHERE slug = ? LIMIT 1', [
            slugWithoutPrefix,
          ]);
        }
      }

      if (plan && plan.length > 0) {
        const numericId = plan[0].id;
        conversionMap.set(subscription.id, numericId);
        convertedCount++;
      } else {
        // Slug no encontrado, intentar usar el plan por defecto (esencia)
        const defaultPlan = await queryRunner.query(
          "SELECT id FROM pricing_plans WHERE slug = 'esencia' LIMIT 1",
        );

        if (defaultPlan && defaultPlan.length > 0) {
          const defaultPlanId = defaultPlan[0].id;
          conversionMap.set(subscription.id, defaultPlanId);
          convertedCount++;
          console.log(
            `⚠️ Slug "${planIdValue}" no encontrado para subscription ${subscription.id}, usando plan por defecto (esencia, ID: ${defaultPlanId})`,
          );
        } else {
          // No hay plan por defecto disponible
          notFoundCount++;
          notFoundSlugs.add(planIdValue);
          console.error(
            `❌ No se pudo convertir planId "${planIdValue}" para subscription ${subscription.id}. No se encontró el slug ni un plan por defecto.`,
          );
        }
      }
    }

    console.log(`✅ Conversión completada:`);
    console.log(`   - ${alreadyNumericCount} registros ya tenían planId numérico`);
    console.log(`   - ${convertedCount} registros convertidos de slug a ID numérico`);
    if (notFoundCount > 0) {
      console.log(`   - ⚠️ ${notFoundCount} registros no pudieron ser convertidos`);
      console.log(`     Slugs no encontrados: ${Array.from(notFoundSlugs).join(', ')}`);
    }

    // Paso 3: Actualizar todos los registros con los IDs numéricos
    if (conversionMap.size > 0) {
      // Primero, crear una columna temporal para almacenar los valores numéricos
      await queryRunner.addColumn(
        'partner_subscriptions',
        new TableColumn({
          name: 'planId_temp',
          type: 'int',
          isNullable: true,
        }),
      );

      // Actualizar la columna temporal con los valores convertidos
      for (const [subscriptionId, numericPlanId] of conversionMap.entries()) {
        await queryRunner.query('UPDATE partner_subscriptions SET planId_temp = ? WHERE id = ?', [
          numericPlanId,
          subscriptionId,
        ]);
      }

      // Eliminar la columna original
      await queryRunner.dropColumn('partner_subscriptions', 'planId');

      // Renombrar la columna temporal a planId
      await queryRunner.addColumn(
        'partner_subscriptions',
        new TableColumn({
          name: 'planId',
          type: 'int',
          isNullable: false,
        }),
      );

      // Copiar los datos de la columna temporal a la nueva columna
      await queryRunner.query(
        'UPDATE partner_subscriptions SET planId = planId_temp WHERE planId_temp IS NOT NULL',
      );

      // Eliminar la columna temporal
      await queryRunner.dropColumn('partner_subscriptions', 'planId_temp');

      console.log('✅ Columna planId convertida a integer.');
    }

    // Paso 4: Verificar si hay registros con planId NULL y manejarlos
    const nullPlanIds = await queryRunner.query(
      'SELECT COUNT(*) as count FROM partner_subscriptions WHERE planId IS NULL',
    );
    if (nullPlanIds[0]?.count > 0) {
      console.log(
        `⚠️ Hay ${nullPlanIds[0].count} registros con planId NULL. Estos requieren atención manual.`,
      );
    }

    // Paso 5: Agregar foreign key constraint hacia pricing_plans
    const tableWithFK = await queryRunner.getTable('partner_subscriptions');
    if (tableWithFK) {
      const existingFK = tableWithFK.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('planId') !== -1,
      );

      if (!existingFK) {
        // Verificar que todos los planId existan en pricing_plans antes de crear la FK
        const invalidPlanIds = await queryRunner.query(
          'SELECT DISTINCT ps.planId FROM partner_subscriptions ps LEFT JOIN pricing_plans pp ON ps.planId = pp.id WHERE ps.planId IS NOT NULL AND pp.id IS NULL',
        );

        if (invalidPlanIds && invalidPlanIds.length > 0) {
          console.error(
            `❌ No se puede crear la foreign key. Hay ${invalidPlanIds.length} planId inválidos que no existen en pricing_plans:`,
          );
          invalidPlanIds.forEach((row: any) => {
            console.error(`   - planId: ${row.planId}`);
          });
          console.log(
            '💡 Por favor, corrige estos planId manualmente antes de ejecutar la migración nuevamente.',
          );
        } else {
          // Crear la foreign key hacia pricing_plans
          await queryRunner.createForeignKey(
            'partner_subscriptions',
            new TableForeignKey({
              columnNames: ['planId'],
              referencedColumnNames: ['id'],
              referencedTableName: 'pricing_plans',
              onDelete: 'RESTRICT',
              onUpdate: 'CASCADE',
              name: 'FK_partner_subscriptions_planId',
            }),
          );

          console.log('✅ Foreign key FK_partner_subscriptions_planId creada.');
        }
      } else {
        console.log('⚠️ Foreign key FK_partner_subscriptions_planId ya existe.');
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('partner_subscriptions');

    if (!table) {
      console.log('⚠️ Tabla partner_subscriptions no encontrada.');
      return;
    }

    // Eliminar la foreign key si existe
    const existingFK = table.foreignKeys.find((fk) => fk.columnNames.indexOf('planId') !== -1);

    if (existingFK) {
      await queryRunner.dropForeignKey('partner_subscriptions', existingFK);
      console.log('✅ Foreign key FK_partner_subscriptions_planId eliminada.');
    }

    // Cambiar el tipo de columna de int a varchar
    const planIdColumn = table.findColumnByName('planId');
    if (planIdColumn && (planIdColumn.type === 'int' || planIdColumn.type === 'integer')) {
      // Crear columna temporal varchar
      await queryRunner.addColumn(
        'partner_subscriptions',
        new TableColumn({
          name: 'planId_temp',
          type: 'varchar',
          length: '100',
          isNullable: true,
        }),
      );

      // Convertir IDs numéricos a strings (no podemos recuperar los slugs originales)
      await queryRunner.query(
        'UPDATE partner_subscriptions SET planId_temp = CAST(planId AS CHAR) WHERE planId IS NOT NULL',
      );

      // Eliminar la columna original
      await queryRunner.dropColumn('partner_subscriptions', 'planId');

      // Renombrar la columna temporal
      await queryRunner.addColumn(
        'partner_subscriptions',
        new TableColumn({
          name: 'planId',
          type: 'varchar',
          length: '100',
          isNullable: true,
        }),
      );

      // Copiar los datos
      await queryRunner.query(
        'UPDATE partner_subscriptions SET planId = planId_temp WHERE planId_temp IS NOT NULL',
      );

      // Eliminar la columna temporal
      await queryRunner.dropColumn('partner_subscriptions', 'planId_temp');

      console.log('✅ Columna planId convertida de integer a varchar.');
      console.log(
        '⚠️ Nota: Los valores se convirtieron a strings numéricos. Los slugs originales no se pueden recuperar.',
      );
    } else {
      console.log('⚠️ Columna planId no es de tipo integer, no se puede hacer rollback.');
    }
  }
}
