-- Script SQL para limpiar datos inválidos antes de ejecutar la migración
-- Ejecutar este script ANTES de ejecutar la migración si hay errores de foreign key

-- 1. Verificar qué valores de currencyId existen en partner_requests
SELECT DISTINCT currencyId, COUNT(*) as count
FROM partner_requests
GROUP BY currencyId;

-- 2. Verificar qué IDs existen en currencies
SELECT id, code, name FROM currencies ORDER BY id;

-- 3. Si hay valores inválidos, actualizarlos manualmente antes de ejecutar la migración
-- Ejemplo: Si hay un registro con currencyId = "61" y no existe en currencies:
-- UPDATE partner_requests SET currencyId = 'currency-8' WHERE currencyId = '61';

-- 4. O si ya está en formato "currency-{id}" pero el ID no existe:
-- Primero obtener el ID de GTQ:
-- SELECT id FROM currencies WHERE code = 'GTQ';
-- Luego actualizar los registros inválidos con ese ID

