import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Migración para crear la tabla refresh_tokens
 *
 * Esta tabla almacena tokens de refresco (refresh tokens) para mantener
 * sesiones activas sin requerir re-autenticación frecuente.
 *
 * Características:
 * - tokenHash: Hash del token (no el token en texto plano) para seguridad
 * - expiresAt: Fecha de expiración (típicamente 7 días)
 * - isRevoked: Flag para revocar tokens manualmente (logout)
 * - userAgent, ipAddress: Metadata de seguridad para detectar uso sospechoso
 *
 * Índices:
 * - UNIQUE en tokenHash para búsquedas rápidas y prevenir duplicados
 * - INDEX en userId para listar tokens por usuario
 * - INDEX en expiresAt para cleanup eficiente de tokens expirados
 * - INDEX en isRevoked para queries de tokens activos
 *
 * Seguridad:
 * - CASCADE delete cuando se elimina el usuario
 * - Tokens de un solo uso (revocados después de refresh)
 * - Límite de tokens activos por usuario (configurable)
 */
export class CreateRefreshTokensTable1811000000000 implements MigrationInterface {
  name = 'CreateRefreshTokensTable1811000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('📝 [Migration] Creating refresh_tokens table...');

    // 1. Verificar si la tabla ya existe (idempotente)
    const tableExists = await queryRunner.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'refresh_tokens'
    `);

    if (tableExists.length > 0) {
      console.log('  ⚠️  Table refresh_tokens already exists, skipping...');
      return;
    }

    // 2. Crear tabla refresh_tokens
    console.log('  ⏳ Creating table refresh_tokens...');
    await queryRunner.createTable(
      new Table({
        name: 'refresh_tokens',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'userId',
            type: 'int',
            isNullable: false,
            comment: 'ID del usuario propietario del token',
          },
          {
            name: 'tokenHash',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
            comment: 'Hash SHA-256 del refresh token (no almacenar token en texto plano)',
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: false,
            comment: 'Fecha y hora de expiración del token',
          },
          {
            name: 'isRevoked',
            type: 'boolean',
            default: false,
            isNullable: false,
            comment: 'Indica si el token ha sido revocado manualmente (logout)',
          },
          {
            name: 'userAgent',
            type: 'varchar',
            length: '500',
            isNullable: true,
            comment: 'User agent del navegador/cliente (para detección de uso sospechoso)',
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            length: '45',
            isNullable: true,
            comment: 'Dirección IP del cliente (soporta IPv4 e IPv6)',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
            comment: 'Fecha de creación del token',
          },
          {
            name: 'revokedAt',
            type: 'timestamp',
            isNullable: true,
            comment: 'Fecha y hora en que fue revocado el token (NULL si no está revocado)',
          },
        ],
      }),
      true,
    );
    console.log('  ✅ Table refresh_tokens created successfully');

    // 3. Crear índice UNIQUE en tokenHash (búsqueda rápida)
    console.log('  ⏳ Creating UNIQUE index on tokenHash...');
    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({
        name: 'IDX_REFRESH_TOKENS_TOKEN_HASH',
        columnNames: ['tokenHash'],
        isUnique: true,
      }),
    );
    console.log('  ✅ UNIQUE index on tokenHash created');

    // 4. Crear índice en userId (listar tokens por usuario)
    console.log('  ⏳ Creating index on userId...');
    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({
        name: 'IDX_REFRESH_TOKENS_USER_ID',
        columnNames: ['userId'],
      }),
    );
    console.log('  ✅ Index on userId created');

    // 5. Crear índice en expiresAt (cleanup de tokens expirados)
    console.log('  ⏳ Creating index on expiresAt...');
    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({
        name: 'IDX_REFRESH_TOKENS_EXPIRES_AT',
        columnNames: ['expiresAt'],
      }),
    );
    console.log('  ✅ Index on expiresAt created');

    // 6. Crear índice en isRevoked (queries de tokens activos)
    console.log('  ⏳ Creating index on isRevoked...');
    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({
        name: 'IDX_REFRESH_TOKENS_IS_REVOKED',
        columnNames: ['isRevoked'],
      }),
    );
    console.log('  ✅ Index on isRevoked created');

    // 7. Crear foreign key a users (CASCADE delete)
    console.log('  ⏳ Creating foreign key to users table...');
    await queryRunner.createForeignKey(
      'refresh_tokens',
      new TableForeignKey({
        name: 'FK_REFRESH_TOKENS_USER_ID',
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE', // Eliminar tokens cuando se elimina el usuario
        onUpdate: 'CASCADE',
      }),
    );
    console.log('  ✅ Foreign key to users created');

    console.log('✅ [Migration] refresh_tokens table created successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('📝 [Migration] Rolling back refresh_tokens table...');

    // 1. Verificar si la tabla existe
    const tableExists = await queryRunner.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'refresh_tokens'
    `);

    if (tableExists.length === 0) {
      console.log('  ⚠️  Table refresh_tokens does not exist, skipping rollback...');
      return;
    }

    // 2. Eliminar foreign key
    console.log('  ⏳ Dropping foreign key FK_REFRESH_TOKENS_USER_ID...');
    await queryRunner.dropForeignKey('refresh_tokens', 'FK_REFRESH_TOKENS_USER_ID');
    console.log('  ✅ Foreign key dropped');

    // 3. Eliminar índices
    console.log('  ⏳ Dropping indexes...');
    await queryRunner.dropIndex('refresh_tokens', 'IDX_REFRESH_TOKENS_IS_REVOKED');
    await queryRunner.dropIndex('refresh_tokens', 'IDX_REFRESH_TOKENS_EXPIRES_AT');
    await queryRunner.dropIndex('refresh_tokens', 'IDX_REFRESH_TOKENS_USER_ID');
    await queryRunner.dropIndex('refresh_tokens', 'IDX_REFRESH_TOKENS_TOKEN_HASH');
    console.log('  ✅ Indexes dropped');

    // 4. Eliminar tabla
    console.log('  ⏳ Dropping table refresh_tokens...');
    await queryRunner.dropTable('refresh_tokens');
    console.log('  ✅ Table dropped');

    console.log('✅ [Migration] refresh_tokens table rollback completed');
  }
}
