const db = require('./database');

async function addBasicData() {
    console.log('🔄 Agregando datos básicos...');
    
    let connection;
    try {
        connection = await db.getConnection();
        
        // 1. Solo agregar algunos clientes
        console.log('👥 Agregando clientes...');
        await connection.execute(`
            INSERT IGNORE INTO clientes (id, cedula, nombre_completo, genero, activo) VALUES
            (1, '001-1234567-8', 'María González Pérez', 'F', TRUE),
            (2, '001-2345678-9', 'Juan Pérez Rodríguez', 'M', TRUE),
            (3, '001-3456789-0', 'Ana Rodríguez García', 'F', TRUE)
        `);
        
        // 2. Agregar algunos productos básicos (con unidad_medida_id = 1)
        console.log('📦 Agregando productos básicos...');
        await connection.execute(`
            INSERT IGNORE INTO productos (id, codigo_interno, nombre, descripcion, activo, unidad_medida_id) VALUES
            (1, 'PROD001', 'iPhone 15 Pro', 'Smartphone Apple iPhone 15 Pro 256GB', TRUE, 1),
            (2, 'PROD002', 'Samsung Galaxy S24', 'Smartphone Samsung Galaxy S24 Ultra 512GB', TRUE, 1),
            (3, 'PROD003', 'MacBook Air M2', 'Laptop Apple MacBook Air con chip M2 256GB', TRUE, 1)
        `);
        
        console.log('✅ Datos básicos agregados exitosamente!');
        
        // Mostrar conteos
        const [productCount] = await connection.execute('SELECT COUNT(*) as total FROM productos');
        const [clientCount] = await connection.execute('SELECT COUNT(*) as total FROM clientes');
        
        console.log(`\n📊 Productos: ${productCount[0].total}`);
        console.log(`👥 Clientes: ${clientCount[0].total}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) connection.release();
    }
}

addBasicData().then(() => {
    process.exit(0);
});
