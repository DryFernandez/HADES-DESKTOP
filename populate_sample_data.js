const db = require('./database');

async function populateSampleData() {
    console.log('🔄 Agregando datos de ejemplo...');
    
    let connection;
    try {
        connection = await db.getConnection();
        
        // 1. Agregar categorías si no existen
        console.log('� Agregando categorías...');
        await connection.execute(`
            INSERT IGNORE INTO categorias_productos (id, nombre, descripcion, activo) VALUES
            (1, 'Smartphones', 'Teléfonos inteligentes', TRUE),
            (2, 'Laptops', 'Computadoras portátiles', TRUE),
            (3, 'Accesorios', 'Accesorios tecnológicos', TRUE),
            (4, 'Tablets', 'Tabletas digitales', TRUE)
        `);
        
        // 2. Agregar marcas si no existen
        console.log('🏷️ Agregando marcas...');
        await connection.execute(`
            INSERT IGNORE INTO marcas (id, nombre, descripcion, activo) VALUES
            (1, 'Apple', 'Productos Apple Inc.', TRUE),
            (2, 'Samsung', 'Productos Samsung Electronics', TRUE),
            (3, 'Generic', 'Productos genéricos', TRUE)
        `);
        
        // 3. Agregar unidades de medida
        console.log('📏 Agregando unidades de medida...');
        await connection.execute(`
            INSERT IGNORE INTO unidades_medida (id, nombre, abreviacion, tipo, activo) VALUES
            (1, 'Unidad', 'UN', 'cantidad', TRUE),
            (2, 'Kilogramo', 'KG', 'peso', TRUE),
            (3, 'Litro', 'L', 'volumen', TRUE)
        `);
        
        // 4. Agregar algunos productos de ejemplo (sin precio, que está en inventario)
        console.log('� Agregando productos...');
        await connection.execute(`
            INSERT IGNORE INTO productos (id, codigo_interno, nombre, descripcion, categoria_id, marca_id, unidad_medida_id, activo) VALUES
            (1, 'IPH15PRO256', 'iPhone 15 Pro', 'Smartphone Apple iPhone 15 Pro 256GB', 1, 1, 1, TRUE),
            (2, 'SAM24ULT512', 'Samsung Galaxy S24', 'Smartphone Samsung Galaxy S24 Ultra 512GB', 1, 2, 1, TRUE),
            (3, 'MBAIRM2256', 'MacBook Air M2', 'Laptop Apple MacBook Air con chip M2 256GB', 2, 1, 1, TRUE),
            (4, 'APPRO2GEN', 'AirPods Pro', 'Auriculares inalámbricos Apple AirPods Pro 2da Gen', 3, 1, 1, TRUE),
            (5, 'IPADAIR64', 'iPad Air', 'Tablet Apple iPad Air 10.9 pulgadas 64GB', 4, 1, 1, TRUE)
        `);
        
        // 5. Agregar inventario con precios
        console.log('📊 Agregando inventario...');
        await connection.execute(`
            INSERT IGNORE INTO inventario (id, local_id, producto_id, cantidad_disponible, cantidad_minima, costo_promedio, precio_venta) VALUES
            (1, 1, 1, 5, 10, 999.99, 1299.99),
            (2, 1, 2, 8, 10, 899.99, 1199.99),
            (3, 1, 3, 12, 5, 1199.99, 1499.99),
            (4, 1, 4, 25, 10, 179.99, 249.99),
            (5, 1, 5, 15, 8, 459.99, 599.99)
        `);
        
        // 6. Agregar algunos clientes
        console.log('👥 Agregando clientes...');
        await connection.execute(`
            INSERT IGNORE INTO clientes (id, cedula, nombre_completo, genero, activo) VALUES
            (1, '001-1234567-8', 'María González Pérez', 'F', TRUE),
            (2, '001-2345678-9', 'Juan Pérez Rodríguez', 'M', TRUE),
            (3, '001-3456789-0', 'Ana Rodríguez García', 'F', TRUE)
        `);
        
        // 7. Agregar estados de órdenes
        console.log('📋 Agregando estados de órdenes...');
        await connection.execute(`
            INSERT IGNORE INTO estados_orden (id, nombre, descripcion, color_hex, activo) VALUES
            (1, 'pendiente', 'Orden pendiente de procesamiento', '#FFA500', TRUE),
            (2, 'en_proceso', 'Orden siendo procesada', '#2196F3', TRUE),
            (3, 'completado', 'Orden completada', '#4CAF50', TRUE),
            (4, 'entregado', 'Orden entregada al cliente', '#8BC34A', TRUE),
            (5, 'cancelado', 'Orden cancelada', '#F44336', TRUE)
        `);
        
        // 8. Agregar métodos de pago
        console.log('💳 Agregando métodos de pago...');
        await connection.execute(`
            INSERT IGNORE INTO metodos_pago (id, nombre, descripcion, activo, requiere_autorizacion) VALUES
            (1, 'Efectivo', 'Pago en efectivo', TRUE, FALSE),
            (2, 'Tarjeta', 'Pago con tarjeta de crédito/débito', TRUE, TRUE),
            (3, 'Transferencia', 'Transferencia bancaria', TRUE, TRUE)
        `);
        
        // 9. Agregar direcciones de ejemplo
        console.log('📍 Agregando direcciones...');
        await connection.execute(`
            INSERT IGNORE INTO direcciones (id, cliente_id, tipo, calle_principal, numero, sector, ciudad, provincia, codigo_postal, es_principal, activo) VALUES
            (1, 1, 'casa', 'Av. 27 de Febrero', '123', 'Ensanche Piantini', 'Santo Domingo', 'Distrito Nacional', '10107', TRUE, TRUE),
            (2, 2, 'casa', 'Calle Mercedes', '456', 'Zona Colonial', 'Santo Domingo', 'Distrito Nacional', '10210', TRUE, TRUE),
            (3, 3, 'casa', 'Av. Abraham Lincoln', '789', 'Piantini', 'Santo Domingo', 'Distrito Nacional', '10108', TRUE, TRUE)
        `);
        
        // 10. Agregar algunas órdenes de ejemplo
        console.log('🛍️ Agregando órdenes...');
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        
        await connection.execute(`
            INSERT IGNORE INTO ordenes (id, numero_orden, local_id, cliente_id, direccion_entrega_id, subtotal, impuesto, total, estado_id, metodo_pago_id, fecha_pedido) VALUES
            (1, 'ORD-20240912-001', 1, 1, 1, 1299.99, 207.99, 1507.98, 4, 2, ?),
            (2, 'ORD-20240912-002', 1, 2, 2, 1199.99, 191.99, 1391.98, 3, 1, ?),
            (3, 'ORD-20240911-001', 1, 3, 3, 599.99, 95.99, 695.98, 4, 2, ?),
            (4, 'ORD-20240911-002', 1, 1, 1, 249.99, 39.99, 289.98, 3, 3, ?),
            (5, 'ORD-20240910-001', 1, 2, 2, 1499.99, 239.99, 1739.98, 2, 1, ?)
        `, [
            today.toISOString().slice(0, 19).replace('T', ' '),
            today.toISOString().slice(0, 19).replace('T', ' '),
            yesterday.toISOString().slice(0, 19).replace('T', ' '),
            yesterday.toISOString().slice(0, 19).replace('T', ' '),
            twoDaysAgo.toISOString().slice(0, 19).replace('T', ' ')
        ]);
        
        console.log('✅ Datos de ejemplo agregados exitosamente!');
        
        // Mostrar resumen
        const [productCount] = await connection.execute('SELECT COUNT(*) as total FROM productos');
        const [orderCount] = await connection.execute('SELECT COUNT(*) as total FROM ordenes');
        const [clientCount] = await connection.execute('SELECT COUNT(*) as total FROM clientes');
        
        console.log('\n📊 Resumen de datos agregados:');
        console.log(`Productos: ${productCount[0].total}`);
        console.log(`Órdenes: ${orderCount[0].total}`);
        console.log(`Clientes: ${clientCount[0].total}`);
        
    } catch (error) {
        console.error('❌ Error agregando datos de ejemplo:', error);
    } finally {
        if (connection) connection.release();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    populateSampleData().then(() => {
        process.exit(0);
    });
}

module.exports = { populateSampleData };
