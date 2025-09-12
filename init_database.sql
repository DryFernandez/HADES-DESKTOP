-- Script SQL para inicializar la base de datos HADES
-- Ejecutar este script manualmente si hay problemas con la inicialización automática

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS HADES;
USE HADES;

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Insertar usuario administrador por defecto
INSERT IGNORE INTO users (username, password, email, full_name) 
VALUES ('admin', 'admin123', 'admin@hades.com', 'Administrador');

-- Verificar que se creó correctamente
SELECT 'Tablas creadas exitosamente' as status;
SELECT COUNT(*) as total_users FROM users;
SELECT username, email, full_name, created_at FROM users;
