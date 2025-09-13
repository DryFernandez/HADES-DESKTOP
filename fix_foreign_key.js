const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixForeignKey() {
    let connection;

    try {
        console.log('🔧 Conectando a la base de datos...');

        // Configuración de conexión
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: 'HADES',
            port: parseInt(process.env.DB_PORT) || 3306
        };

        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión exitosa');

        // Verificar tablas existentes
        console.log('📋 Verificando tablas existentes...');
        const [tables] = await connection.execute("SHOW TABLES");
        console.log('Tablas encontradas:', tables.map(t => Object.values(t)[0]));

        // Verificar restricciones de clave foránea
        console.log('🔍 Verificando restricciones de clave foránea...');
        const [constraints] = await connection.execute(`
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
        `);

        console.log('Restricciones encontradas:', constraints);

        // Desactivar verificación de claves foráneas temporalmente
        console.log('🔄 Desactivando verificación de claves foráneas...');
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

        // Eliminar la restricción problemática
        console.log('🗑️ Eliminando restricción problemática...');
        try {
            await connection.execute('ALTER TABLE productos DROP FOREIGN KEY fk_producto_inventario');
            console.log('✅ Restricción eliminada');
        } catch (error) {
            console.log('⚠️ La restricción no existía o ya fue eliminada:', error.message);
        }

        // Reactivar verificación de claves foráneas
        console.log('🔄 Reactivando verificación de claves foráneas...');
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

        // Crear la restricción correcta
        console.log('🔗 Creando restricción correcta...');
        await connection.execute(`
            ALTER TABLE productos
            ADD CONSTRAINT fk_producto_inventario
            FOREIGN KEY (inventario_id)
            REFERENCES inventario(id)
            ON DELETE SET NULL
            ON UPDATE CASCADE
        `);

        console.log('✅ Restricción creada correctamente');

        // Verificar que se creó correctamente
        const [newConstraints] = await connection.execute(`
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
                AND CONSTRAINT_NAME = 'fk_producto_inventario'
        `);

        console.log('✅ Nueva restricción verificada:', newConstraints);

        console.log('🎉 ¡Foreign key constraint corregida exitosamente!');

    } catch (error) {
        console.error('❌ Error corrigiendo foreign key:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada');
        }
    }
}

// Ejecutar la función
fixForeignKey()
    .then(() => {
        console.log('✅ Script completado exitosamente');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error en el script:', error);
        process.exit(1);
    });