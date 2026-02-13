-- Script de inicialización de MariaDB
-- Este script se ejecuta automáticamente cuando se crea el contenedor por primera vez

-- Configurar timezone global de MariaDB a America/Guatemala (UTC-6)
-- Esto asegura que todas las funciones de fecha/hora usen el timezone correcto
SET GLOBAL time_zone = '-06:00';
SET time_zone = '-06:00';

-- Crear base de datos si no existe (normalmente ya está creada por variables de entorno)
-- CREATE DATABASE IF NOT EXISTS tulealtapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
-- USE tulealtapp;

-- Las tablas se crearán automáticamente por TypeORM con synchronize: true en desarrollo
-- En producción, usar migraciones
