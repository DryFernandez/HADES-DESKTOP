const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTableStructure() {
    let connection;

    try {
        console.log('🔧 Verificando estructura de la tabla productos...');

        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: 'HADES',
            port: parseInt(process.env.DB_PORT) || 3306
        };

        connection = await mysql.createConnection(dbConfig);

        // Verificar estructura de la tabla productos
        console.log('📋 Estructura de la tabla productos:');
        const [columns] = await connection.execute('DESCRIBE productos');
        console.table(columns);

        // Verificar algunos registros de ejemplo
        console.log('📦 Registros de ejemplo en productos:');
        const [productos] = await connection.execute('SELECT * FROM productos LIMIT 5');
        console.table(productos);

        // Verificar si hay campos de stock y precio
        const stockFields = columns.filter(col =>
            col.Field.toLowerCase().includes('stock') ||
            col.Field.toLowerCase().includes('cantidad') ||
            col.Field.toLowerCase().includes('inventario')
        );

        const priceFields = columns.filter(col =>
            col.Field.toLowerCase().includes('precio') ||
            col.Field.toLowerCase().includes('costo') ||
            col.Field.toLowerCase().includes('venta')
        );

        console.log('🔍 Campos relacionados con stock:', stockFields.map(f => f.Field));
        console.log('💰 Campos relacionados con precio:', priceFields.map(f => f.Field));

    } catch (error) {
        console.error('❌ Error verificando estructura:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkTableStructure();