-- Script para corregir la restricción de clave foránea del inventario
-- Ejecutar este script en MySQL para solucionar el error de foreign key

USE HADES;

-- Verificar tablas existentes
SHOW TABLES;

-- Verificar restricciones de clave foránea en la tabla productos
SELECT
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE
    REFERENCED_TABLE_SCHEMA = 'HADES'
    AND TABLE_NAME = 'productos';

-- Si existe la restricción problemática, eliminarla
SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar la restricción problemática si existe
ALTER TABLE productos DROP FOREIGN KEY fk_producto_inventario;

SET FOREIGN_KEY_CHECKS = 1;

-- Verificar si existe la tabla inventario
SHOW TABLES LIKE 'inventario';

-- Si no existe la tabla inventario, crearla
CREATE TABLE IF NOT EXISTS inventario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    local_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_local_id (local_id),
    INDEX idx_activo (activo)
);

-- Verificar si existe la tabla inventario_backup y renombrarla si es necesario
SHOW TABLES LIKE 'inventario_backup';

-- Si existe inventario_backup, renombrarla a inventario (solo si inventario no existe)
-- RENAME TABLE inventario_backup TO inventario;

-- Crear la restricción de clave foránea correcta
ALTER TABLE productos
ADD CONSTRAINT fk_producto_inventario
FOREIGN KEY (inventario_id)
REFERENCES inventario(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Verificar que la restricción se creó correctamente
SELECT
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE
    REFERENCED_TABLE_SCHEMA = 'HADES'
    AND TABLE_NAME = 'productos'
    AND CONSTRAINT_NAME = 'fk_producto_inventario';

SELECT '✅ Foreign key constraint corregida exitosamente' as status;