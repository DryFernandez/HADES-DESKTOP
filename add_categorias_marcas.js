const db = require('./database');

async function addCategoriasYMarcas() {
    console.log('🔄 Agregando categorías y marcas...');
    
    let connection;
    try {
        connection = await db.getConnection();
        
        // Agregar categorías básicas
        console.log('📂 Agregando categorías...');
        await connection.execute(`
            INSERT IGNORE INTO categorias_productos (id, nombre, descripcion, activo) VALUES
            (1, 'Smartphones', 'Teléfonos inteligentes', TRUE),
            (2, 'Laptops', 'Computadoras portátiles', TRUE),
            (3, 'Accesorios', 'Accesorios tecnológicos', TRUE),
            (4, 'Tablets', 'Tabletas digitales', TRUE),
            (5, 'Audio', 'Equipos de audio', TRUE)
        `);
        
        // Agregar marcas básicas
        console.log('🏷️ Agregando marcas...');
        await connection.execute(`
            INSERT IGNORE INTO marcas (id, nombre, descripcion, activo) VALUES
            (1, 'Apple', 'Productos Apple Inc.', TRUE),
            (2, 'Samsung', 'Productos Samsung Electronics', TRUE),
            (3, 'Huawei', 'Productos Huawei Technologies', TRUE),
            (4, 'Xiaomi', 'Productos Xiaomi Corporation', TRUE),
            (5, 'Sony', 'Productos Sony Corporation', TRUE),
            (6, 'Generic', 'Productos genéricos', TRUE)
        `);
        
        // Agregar unidades de medida básicas
        console.log('📏 Agregando unidades de medida...');
        await connection.execute(`
            INSERT IGNORE INTO unidades_medida (id, nombre, tipo) VALUES
            (1, 'Unidad', 'cantidad'),
            (2, 'Kilogramo', 'peso'),
            (3, 'Gramo', 'peso'),
            (4, 'Litro', 'volumen'),
            (5, 'Metro', 'longitud')
        `);
        
        console.log('✅ Categorías y marcas agregadas exitosamente!');
        
        // Mostrar conteos
        const [catCount] = await connection.execute('SELECT COUNT(*) as total FROM categorias_productos');
        const [marcaCount] = await connection.execute('SELECT COUNT(*) as total FROM marcas');
        const [unidadCount] = await connection.execute('SELECT COUNT(*) as total FROM unidades_medida');
        
        console.log(`\n📊 Categorías: ${catCount[0].total}`);
        console.log(`🏷️ Marcas: ${marcaCount[0].total}`);
        console.log(`📏 Unidades: ${unidadCount[0].total}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) connection.release();
    }
}

addCategoriasYMarcas().then(() => {
    process.exit(0);
});
