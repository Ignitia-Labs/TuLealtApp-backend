-- Script SQL completo para partner_requests.currencyId
-- Maneja tanto la creación de la tabla como la migración de datos

-- Paso 1: Verificar si la tabla existe, si no, crearla con currencyId como INT
CREATE TABLE IF NOT EXISTS partner_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  status VARCHAR(20) DEFAULT 'pending',
  submittedAt DATETIME NOT NULL,
  name VARCHAR(255) NOT NULL,
  responsibleName VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  countryId INT NULL,
  city VARCHAR(100) NOT NULL,
  plan VARCHAR(50) NOT NULL,
  planId INT NULL,
  billingFrequency VARCHAR(20) NULL,
  logo TEXT NULL,
  category VARCHAR(100) NOT NULL,
  branchesNumber INT DEFAULT 0,
  website VARCHAR(255) NULL,
  socialMedia VARCHAR(255) NULL,
  rewardType VARCHAR(255) NOT NULL,
  currencyId INT NOT NULL,
  businessName VARCHAR(255) NOT NULL,
  taxId VARCHAR(100) NOT NULL,
  fiscalAddress TEXT NOT NULL,
  paymentMethod VARCHAR(100) NOT NULL,
  billingEmail VARCHAR(255) NOT NULL,
  notes TEXT NULL,
  assignedTo INT NULL,
  lastUpdated DATETIME NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX IDX_partner_requests_status (status),
  INDEX IDX_partner_requests_submittedAt (submittedAt),
  FOREIGN KEY (countryId) REFERENCES countries(id) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (currencyId) REFERENCES currencies(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Paso 2: Si la tabla ya existe con currencyId como VARCHAR, migrar los datos
SET @table_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'partner_requests');
SET @col_type = (SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'partner_requests'
    AND COLUMN_NAME = 'currencyId'
  LIMIT 1);

-- Solo migrar si currencyId es VARCHAR
SET @needs_migration = IF(@col_type = 'varchar' OR @col_type = 'varchar', 1, 0);

-- Si necesita migración, ejecutar el proceso de migración
SET @gtq_id = (SELECT id FROM currencies WHERE code = 'GTQ' LIMIT 1);

-- Crear columna temporal si no existe
SET @temp_col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'partner_requests'
    AND COLUMN_NAME = 'currencyId_temp');

SET @sql = IF(@temp_col_exists = 0 AND @needs_migration = 1,
  'ALTER TABLE partner_requests ADD COLUMN currencyId_temp INT NULL',
  'SELECT "No se necesita columna temporal"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Migrar datos si es necesario
SET @sql = IF(@needs_migration = 1,
  CONCAT('UPDATE partner_requests SET currencyId_temp = CAST(SUBSTRING(currencyId, 10) AS UNSIGNED) WHERE currencyId LIKE ''currency-%'' AND CAST(SUBSTRING(currencyId, 10) AS UNSIGNED) IN (SELECT id FROM currencies)'),
  'SELECT "No migración necesaria"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(@needs_migration = 1,
  CONCAT('UPDATE partner_requests SET currencyId_temp = CAST(currencyId AS UNSIGNED) WHERE currencyId NOT LIKE ''currency-%'' AND currencyId REGEXP ''^[0-9]+$'' AND CAST(currencyId AS UNSIGNED) IN (SELECT id FROM currencies)'),
  'SELECT "No migración necesaria"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(@needs_migration = 1,
  CONCAT('UPDATE partner_requests SET currencyId_temp = ', @gtq_id, ' WHERE currencyId_temp IS NULL'),
  'SELECT "No migración necesaria"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Eliminar foreign key si existe
SET @fk_name = (SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'partner_requests'
    AND COLUMN_NAME = 'currencyId'
    AND REFERENCED_TABLE_NAME IS NOT NULL
  LIMIT 1);

SET @sql = IF(@fk_name IS NOT NULL AND @needs_migration = 1,
  CONCAT('ALTER TABLE partner_requests DROP FOREIGN KEY ', @fk_name),
  'SELECT "No FK para eliminar"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Eliminar columna antigua y renombrar si es necesario
SET @sql = IF(@needs_migration = 1,
  'ALTER TABLE partner_requests DROP COLUMN currencyId',
  'SELECT "No se necesita eliminar columna"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(@needs_migration = 1,
  'ALTER TABLE partner_requests CHANGE currencyId_temp currencyId INT NOT NULL',
  'SELECT "No se necesita renombrar"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Crear foreign key si no existe
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'partner_requests'
    AND COLUMN_NAME = 'currencyId'
    AND REFERENCED_TABLE_NAME = 'currencies');

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE partner_requests ADD CONSTRAINT FK_partner_requests_currencyId FOREIGN KEY (currencyId) REFERENCES currencies(id) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT "FK ya existe"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificación final
SELECT 'Migración completada. Estado final:' as info;
SELECT COUNT(*) as total_records,
       COUNT(DISTINCT currencyId) as distinct_currencies
FROM partner_requests;

