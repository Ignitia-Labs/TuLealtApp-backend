-- Script SQL directo para convertir partner_requests.currencyId de VARCHAR a INT
-- Ejecutar este script directamente en la base de datos si las migraciones fallan

-- Paso 1: Verificar el estado actual
SELECT 'Estado actual de partner_requests.currencyId:' as info;
SELECT DISTINCT currencyId, COUNT(*) as count
FROM partner_requests
GROUP BY currencyId;

-- Paso 2: Verificar que existe la tabla currencies y obtener el ID de GTQ (default)
SELECT 'ID de GTQ (moneda por defecto):' as info;
SELECT id FROM currencies WHERE code = 'GTQ' LIMIT 1;

-- Paso 3: Crear columna temporal
ALTER TABLE partner_requests ADD COLUMN currencyId_temp INT NULL;

-- Paso 4: Migrar datos
-- Si viene en formato 'currency-{id}', extraer el número
UPDATE partner_requests
SET currencyId_temp = CAST(SUBSTRING(currencyId, 10) AS UNSIGNED)
WHERE currencyId LIKE 'currency-%'
  AND CAST(SUBSTRING(currencyId, 10) AS UNSIGNED) IN (SELECT id FROM currencies);

-- Si viene como número string directo (ej: "61"), convertir directamente
UPDATE partner_requests
SET currencyId_temp = CAST(currencyId AS UNSIGNED)
WHERE currencyId NOT LIKE 'currency-%'
  AND currencyId REGEXP '^[0-9]+$'
  AND CAST(currencyId AS UNSIGNED) IN (SELECT id FROM currencies);

-- Asignar GTQ (8) como default para valores inválidos o NULL
SET @gtq_id = (SELECT id FROM currencies WHERE code = 'GTQ' LIMIT 1);
UPDATE partner_requests
SET currencyId_temp = @gtq_id
WHERE currencyId_temp IS NULL;

-- Paso 5: Verificar que todos los valores sean válidos
SELECT 'Verificación de valores inválidos:' as info;
SELECT pr.id, pr.currencyId, pr.currencyId_temp, c.code, c.name
FROM partner_requests pr
LEFT JOIN currencies c ON c.id = pr.currencyId_temp
WHERE c.id IS NULL;

-- Paso 6: Eliminar foreign key si existe (puede fallar si no existe, está bien)
SET @fk_name = (
  SELECT CONSTRAINT_NAME
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'partner_requests'
    AND COLUMN_NAME = 'currencyId'
    AND REFERENCED_TABLE_NAME IS NOT NULL
  LIMIT 1
);

SET @sql = IF(@fk_name IS NOT NULL,
  CONCAT('ALTER TABLE partner_requests DROP FOREIGN KEY ', @fk_name),
  'SELECT "No hay foreign key para eliminar"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Paso 7: Eliminar columna antigua
ALTER TABLE partner_requests DROP COLUMN currencyId;

-- Paso 8: Renombrar columna temporal
ALTER TABLE partner_requests CHANGE currencyId_temp currencyId INT NOT NULL;

-- Paso 9: Crear foreign key
ALTER TABLE partner_requests
ADD CONSTRAINT FK_partner_requests_currencyId
FOREIGN KEY (currencyId) REFERENCES currencies(id)
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Paso 10: Verificación final
SELECT 'Migración completada. Verificación final:' as info;
SELECT COUNT(*) as total_records,
       COUNT(DISTINCT currencyId) as distinct_currencies,
       MIN(currencyId) as min_currency_id,
       MAX(currencyId) as max_currency_id
FROM partner_requests;

