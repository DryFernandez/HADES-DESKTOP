const mysql = require('mysql2/promise');
require('dotenv').config();

async function addPriceFields() {
    let connection;

    try {
        console.log('🔧 Agregando campos de precio a la tabla productos...');

        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: 'HADES',
            port: parseInt(process.env.DB_PORT) || 3306
        };

        connection = await mysql.createConnection(dbConfig);

        // Verificar si ya existen los campos de precio
        console.log('📋 Verificando campos existentes...');
        const [columns] = await connection.execute("DESCRIBE productos");

        const existingFields = columns.map(col => col.Field);
        console.log('Campos existentes:', existingFields);

        // Agregar campo precio_costo si no existe
        if (!existingFields.includes('precio_costo')) {
            console.log('➕ Agregando campo precio_costo...');
            await connection.execute(`
                ALTER TABLE productos
                ADD COLUMN precio_costo DECIMAL(10,2) DEFAULT 0.00
                AFTER stock
            `);
            console.log('✅ Campo precio_costo agregado');
        }

        // Agregar campo precio_venta si no existe
        if (!existingFields.includes('precio_venta')) {
            console.log('➕ Agregando campo precio_venta...');
            await connection.execute(`
                ALTER TABLE productos
                ADD COLUMN precio_venta DECIMAL(10,2) DEFAULT 0.00
                AFTER precio_costo
            `);
            console.log('✅ Campo precio_venta agregado');
        }

        // Agregar campo precio_mayor si no existe
        if (!existingFields.includes('precio_mayor')) {
            console.log('➕ Agregando campo precio_mayor...');
            await connection.execute(`
                ALTER TABLE productos
                ADD COLUMN precio_mayor DECIMAL(10,2) DEFAULT 0.00
                AFTER precio_venta
            `);
            console.log('✅ Campo precio_mayor agregado');
        }

        // Verificar la estructura final
        console.log('📋 Estructura final de la tabla productos:');
        const [finalColumns] = await connection.execute("DESCRIBE productos");
        console.table(finalColumns);

        console.log('🎉 ¡Campos de precio agregados exitosamente!');

    } catch (error) {
        console.error('❌ Error agregando campos de precio:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

addPriceFields();