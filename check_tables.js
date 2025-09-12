const db = require('./database');

async function checkTables() {
    console.log('🔍 Verificando estructura de tablas...');
    
    let connection;
    try {
        connection = await db.getConnection();
        
        // Verificar estructura de la tabla productos
        console.log('\n📦 Estructura de tabla productos:');
        const [productColumns] = await connection.execute('DESCRIBE productos');
        console.table(productColumns);
        
        // Verificar estructura de la tabla ordenes
        console.log('\n🛍️ Estructura de tabla ordenes:');
        const [orderColumns] = await connection.execute('DESCRIBE ordenes');
        console.table(orderColumns);
        
        // Verificar estructura de la tabla clientes
        console.log('\n👥 Estructura de tabla clientes:');
        const [clientColumns] = await connection.execute('DESCRIBE clientes');
        console.table(clientColumns);
        
        // Contar registros existentes
        console.log('\n📊 Conteo de registros existentes:');
        
        const [productCount] = await connection.execute('SELECT COUNT(*) as total FROM productos');
        console.log(`Productos: ${productCount[0].total}`);
        
        const [orderCount] = await connection.execute('SELECT COUNT(*) as total FROM ordenes');
        console.log(`Órdenes: ${orderCount[0].total}`);
        
        const [clientCount] = await connection.execute('SELECT COUNT(*) as total FROM clientes');
        console.log(`Clientes: ${clientCount[0].total}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) connection.release();
    }
}

checkTables().then(() => {
    process.exit(0);
});
