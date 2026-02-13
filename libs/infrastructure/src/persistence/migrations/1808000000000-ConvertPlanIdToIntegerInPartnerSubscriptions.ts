import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

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

    // Paso 3: Manejar registros que no pudieron ser convertidos
    // Si hay registros sin conversión, asignarles un plan por defecto
    if (notFoundCount > 0) {
      const defaultPlan = await queryRunner.query(
        "SELECT id FROM pricing_plans WHERE slug = 'esencia' LIMIT 1",
      );
      if (defaultPlan && defaultPlan.length > 0) {
        const defaultPlanId = defaultPlan[0].id;
        // Obtener los IDs de las suscripciones que no pudieron ser convertidas
        const subscriptionsWithoutPlan = await queryRunner.query(
          'SELECT id FROM partner_subscriptions WHERE planId IS NOT NULL AND planId != ""',
        );
        for (const sub of subscriptionsWithoutPlan) {
          if (!conversionMap.has(sub.id)) {
            conversionMap.set(sub.id, defaultPlanId);
            console.log(
              `⚠️ Asignando plan por defecto (esencia, ID: ${defaultPlanId}) a subscription ${sub.id}`,
            );
          }
        }
      } else {
        throw new Error(
          `No se puede completar la migración. Hay ${notFoundCount} registros sin planId válido y no se encontró un plan por defecto.`,
        );
      }
    }

    // Paso 4: Actualizar todos los registros con los IDs numéricos
    if (conversionMap.size > 0 || subscriptions.length > 0) {
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

      // Asegurar que todos los registros tengan un planId válido
      const recordsWithoutPlanId = await queryRunner.query(
        'SELECT COUNT(*) as count FROM partner_subscriptions WHERE planId_temp IS NULL',
      );
      if (recordsWithoutPlanId[0]?.count > 0) {
        const defaultPlan = await queryRunner.query(
          "SELECT id FROM pricing_plans WHERE slug = 'esencia' LIMIT 1",
        );
        if (defaultPlan && defaultPlan.length > 0) {
          const defaultPlanId = defaultPlan[0].id;
          await queryRunner.query(
            'UPDATE partner_subscriptions SET planId_temp = ? WHERE planId_temp IS NULL',
            [defaultPlanId],
          );
          console.log(
            `✅ Se asignó el plan por defecto (esencia, ID: ${defaultPlanId}) a ${recordsWithoutPlanId[0].count} registros sin planId.`,
          );
        }
      }

      // Eliminar la columna original
      await queryRunner.dropColumn('partner_subscriptions', 'planId');

      // Crear la nueva columna planId como NOT NULL
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

    // Paso 5: Verificar si hay registros con planId NULL y manejarlos
    const nullPlanIds = await queryRunner.query(
      'SELECT COUNT(*) as count FROM partner_subscriptions WHERE planId IS NULL',
    );
    if (nullPlanIds[0]?.count > 0) {
      console.log(
        `⚠️ Hay ${nullPlanIds[0].count} registros con planId NULL. Estos requieren atención manual.`,
      );
      // Si hay valores NULL y la columna es NOT NULL, necesitamos asignar un valor por defecto
      const defaultPlan = await queryRunner.query(
        "SELECT id FROM pricing_plans WHERE slug = 'esencia' LIMIT 1",
      );
      if (defaultPlan && defaultPlan.length > 0) {
        const defaultPlanId = defaultPlan[0].id;
        await queryRunner.query(
          'UPDATE partner_subscriptions SET planId = ? WHERE planId IS NULL',
          [defaultPlanId],
        );
        console.log(
          `✅ Se asignó el plan por defecto (esencia, ID: ${defaultPlanId}) a los registros con planId NULL.`,
        );
      } else {
        console.error(
          '❌ No se puede asignar un plan por defecto. No se encontró el plan "esencia".',
        );
        throw new Error(
          `Hay ${nullPlanIds[0].count} registros con planId NULL y no se puede asignar un plan por defecto.`,
        );
      }
    }

    // Paso 6: Crear índice en planId antes de crear la foreign key (requerido por MySQL/MariaDB)
    let tableWithFK = await queryRunner.getTable('partner_subscriptions');
    if (tableWithFK) {
      const existingIndex = tableWithFK.indices.find(
        (idx) => idx.columnNames.indexOf('planId') !== -1 && idx.columnNames.length === 1,
      );

      if (!existingIndex) {
        await queryRunner.createIndex(
          'partner_subscriptions',
          new TableIndex({
            name: 'IDX_partner_subscriptions_planId',
            columnNames: ['planId'],
          }),
        );
        console.log('✅ Índice IDX_partner_subscriptions_planId creado.');

        // Refrescar la información de la tabla después de crear el índice
        tableWithFK = await queryRunner.getTable('partner_subscriptions');
      } else {
        console.log('ℹ️ Índice IDX_partner_subscriptions_planId ya existe.');
      }

      // Paso 7: Verificar que todos los planId existan en pricing_plans antes de crear la FK
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
        throw new Error(
          `No se puede crear la foreign key. Hay ${invalidPlanIds.length} planId inválidos.`,
        );
      }

      // Verificar que la tabla pricing_plans existe y tiene la estructura correcta
      const pricingPlansTable = await queryRunner.getTable('pricing_plans');
      if (!pricingPlansTable) {
        throw new Error('La tabla pricing_plans no existe. No se puede crear la foreign key.');
      }

      const pricingPlansIdColumn = pricingPlansTable.findColumnByName('id');
      if (!pricingPlansIdColumn) {
        throw new Error(
          'La columna id no existe en pricing_plans. No se puede crear la foreign key.',
        );
      }

      // Verificar que planId tenga el mismo tipo que pricing_plans.id
      const planIdColumn = tableWithFK.findColumnByName('planId');
      if (!planIdColumn) {
        throw new Error('La columna planId no existe en partner_subscriptions.');
      }

      console.log(
        `ℹ️ Tipo de planId: ${planIdColumn.type}, Tipo de pricing_plans.id: ${pricingPlansIdColumn.type}`,
      );

      // Verificar la estructura real usando SQL directo para debugging
      const planIdInfo = await queryRunner.query(`
        SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'partner_subscriptions'
          AND COLUMN_NAME = 'planId'
      `);

      const pricingPlansIdInfo = await queryRunner.query(`
        SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'pricing_plans'
          AND COLUMN_NAME = 'id'
      `);

      console.log('ℹ️ Información detallada de columnas:');
      console.log(`   partner_subscriptions.planId:`, planIdInfo[0]);
      console.log(`   pricing_plans.id:`, pricingPlansIdInfo[0]);

      // Verificar que pricing_plans.id sea PRIMARY KEY
      if (pricingPlansIdInfo[0]?.COLUMN_KEY !== 'PRI') {
        throw new Error(
          'La columna pricing_plans.id no es PRIMARY KEY. No se puede crear la foreign key.',
        );
      }

      // Verificar que los tipos coincidan exactamente (incluyendo UNSIGNED)
      const planIdType = planIdInfo[0]?.COLUMN_TYPE || '';
      const pricingPlansIdType = pricingPlansIdInfo[0]?.COLUMN_TYPE || '';

      // Si los tipos no coinciden exactamente, modificar planId para que coincida
      if (planIdType !== pricingPlansIdType) {
        console.log(
          `⚠️ Los tipos no coinciden exactamente. Modificando planId de "${planIdType}" a "${pricingPlansIdType}"`,
        );
        await queryRunner.query(
          `ALTER TABLE \`partner_subscriptions\` MODIFY COLUMN \`planId\` ${pricingPlansIdType} NOT NULL`,
        );
        console.log('✅ Tipo de planId modificado para que coincida con pricing_plans.id');

        // Refrescar la información de la tabla después de modificar la columna
        tableWithFK = await queryRunner.getTable('partner_subscriptions');
      }

      // Verificar índices en planId
      const planIdIndexes = await queryRunner.query(`
        SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'partner_subscriptions'
          AND COLUMN_NAME = 'planId'
      `);
      console.log('ℹ️ Índices en planId:', planIdIndexes);

      // Verificar que no haya valores NULL en planId
      const nullCount = await queryRunner.query(
        'SELECT COUNT(*) as count FROM partner_subscriptions WHERE planId IS NULL',
      );
      if (nullCount[0]?.count > 0) {
        throw new Error(
          `Hay ${nullCount[0].count} registros con planId NULL. La columna debe ser NOT NULL para crear la foreign key.`,
        );
      }

      // Verificar que todos los valores existan en pricing_plans
      const countPricingPlans = await queryRunner.query(
        'SELECT COUNT(*) as count FROM pricing_plans',
      );
      console.log(`ℹ️ Total de registros en pricing_plans: ${countPricingPlans[0]?.count}`);

      const countSubscriptions = await queryRunner.query(
        'SELECT COUNT(*) as count FROM partner_subscriptions',
      );
      console.log(
        `ℹ️ Total de registros en partner_subscriptions: ${countSubscriptions[0]?.count}`,
      );

      // Paso 8: Agregar foreign key constraint hacia pricing_plans
      const existingFK = tableWithFK.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('planId') !== -1,
      );

      if (!existingFK) {
        // Crear la foreign key hacia pricing_plans usando SQL directo para más control
        try {
          await queryRunner.query(`
            ALTER TABLE \`partner_subscriptions\`
            ADD CONSTRAINT \`FK_partner_subscriptions_planId\`
            FOREIGN KEY (\`planId\`)
            REFERENCES \`pricing_plans\`(\`id\`)
            ON DELETE RESTRICT
            ON UPDATE CASCADE
          `);
          console.log('✅ Foreign key FK_partner_subscriptions_planId creada.');
        } catch (error: any) {
          console.error('❌ Error al crear la foreign key:', error.message);
          console.error('SQL ejecutado:', error.sql);
          throw error;
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
