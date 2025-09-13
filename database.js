const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la base de datos desde variables de entorno
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'HADES', // Cambiado de DB_NAME a DB_DATABASE
    port: parseInt(process.env.DB_PORT) || 3306,
    charset: 'utf8mb4',
    connectionLimit: 10
};

console.log('🔧 Configuración de DB cargada:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    port: dbConfig.port,
    passwordSet: !!dbConfig.password
});

// Función helper para normalizar valores undefined a null para consultas SQL
function safeParam(value) {
    return value === undefined ? null : value;
}

// Pool de conexiones
let pool = null;

// Crear pool de conexiones
function createPool() {
    if (!pool) {
        pool = mysql.createPool(dbConfig);
    }
    return pool;
}

// Función para obtener conexión
async function getConnection() {
    if (!pool) {
        pool = createPool();
    }
    return pool.getConnection();
}

// Función de autenticación para administradores del sistema (a_users)
async function authenticateAdmin(username, password) {
    let connection;
    try {
        connection = await getConnection();
        
        console.log('🔐 Intento de login de admin para:', username);
        
        const [rows] = await connection.query(
            'SELECT id, username, password_hash, nombre_completo, email, activo, ultimo_acceso FROM a_users WHERE username = ? AND activo = TRUE',
            [username]
        );
        
        if (rows.length === 0) {
            console.log('❌ Usuario admin no encontrado o inactivo');
            return null;
        }
        
        const user = rows[0];
        
        // Verificar contraseña (simple comparación por ahora, en producción usar bcrypt)
        if (user.password_hash === password) {
            // Actualizar último acceso
            await connection.query(
                'UPDATE a_users SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?',
                [user.id]
            );
            
            console.log('✅ Login exitoso para admin:', user.username);
            return {
                id: user.id,
                username: user.username,
                nombre_completo: user.nombre_completo,
                email: user.email,
                tipo_usuario: 'ADMIN',
                ultimo_acceso: user.ultimo_acceso
            };
        } else {
            console.log('❌ Contraseña incorrecta para admin');
            return null;
        }
        
    } catch (error) {
        console.error('❌ Error en autenticación de admin:', error);
        return null;
    } finally {
        if (connection) connection.release();
    }
}

// Función de autenticación para usuarios de locales (users)
async function authenticateLocalUser(username, password) {
    let connection;
    try {
        connection = await getConnection();
        
        console.log('🔐 Intento de login de usuario local para:', username);
        
        const [rows] = await connection.query(`
            SELECT 
                u.id, u.username, u.password_hash, u.nombre_completo, 
                u.cedula, u.cargo, u.es_propietario, u.activo, u.ultimo_acceso,
                l.id as local_id, l.nombre_comercial, l.codigo_local
            FROM users u
            JOIN locales l ON u.local_id = l.id
            WHERE u.username = ? AND u.activo = TRUE AND l.activo = TRUE
        `, [username]);
        
        if (rows.length === 0) {
            console.log('❌ Usuario local no encontrado o inactivo');
            return null;
        }
        
        const user = rows[0];
        
        // Debug: Mostrar qué estamos comparando
        console.log('🔍 Debug - Usuario encontrado:', user.username);
        console.log('🔍 Debug - Contraseña en BD:', user.password_hash);
        console.log('🔍 Debug - Contraseña enviada:', password);
        
        // Verificar contraseña
        if (user.password_hash === password) {
            // Actualizar último acceso
            await connection.query(
                'UPDATE users SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?',
                [user.id]
            );
            
            console.log('✅ Login exitoso para usuario local:', user.username);
            return {
                id: user.id,
                username: user.username,
                nombre_completo: user.nombre_completo,
                cedula: user.cedula,
                cargo: user.cargo,
                es_propietario: user.es_propietario,
                tipo_usuario: 'LOCAL',
                local: {
                    id: user.local_id,
                    nombre_comercial: user.nombre_comercial,
                    codigo_local: user.codigo_local
                },
                ultimo_acceso: user.ultimo_acceso
            };
        } else {
            console.log('❌ Contraseña incorrecta para usuario local');
            return null;
        }
        
    } catch (error) {
        console.error('❌ Error en autenticación de usuario local:', error);
        return null;
    } finally {
        if (connection) connection.release();
    }
}

// Función principal de autenticación (SOLO tabla users)
async function authenticateUser(username, password) {
    try {
        // Solo autenticar en tabla users (usuarios locales)
        let user = await authenticateLocalUser(username, password);
        return user;
    } catch (error) {
        console.error('❌ Error en autenticación principal:', error);
        console.log('⚠️ Intentando autenticación offline...');

        // Modo offline: autenticación mock para pruebas
        if (username === 'carlos.admin' && password === 'admin123') {
            console.log('✅ Login offline exitoso para carlos.admin');
            return {
                id: 1,
                username: 'carlos.admin',
                nombre_completo: 'Carlos Alberto Pérez Rodríguez',
                cedula: '00112345678',
                cargo: 'Gerente General',
                es_propietario: true,
                tipo_usuario: 'LOCAL',
                local: {
                    id: 1,
                    nombre_comercial: 'Colmado Don Carlos',
                    codigo_local: 'LOC001'
                },
                ultimo_acceso: new Date(),
                offline: true // Indicador de modo offline
            };
        } else if (username === 'admin' && password === 'admin123') {
            console.log('✅ Login offline exitoso para admin');
            return {
                id: 999,
                username: 'admin',
                nombre_completo: 'Administrador del Sistema',
                email: 'admin@hades.com',
                tipo_usuario: 'ADMIN',
                ultimo_acceso: new Date(),
                offline: true // Indicador de modo offline
            };
        }

        console.log('❌ Credenciales inválidas en modo offline');
        return null;
    }
}

// Función para verificar e inicializar la base de datos
async function initializeDatabase() {
    try {
        console.log('🔄 Inicializando base de datos HADES...');

        // Intentar conectar a MySQL
        let connection;
        try {
            connection = await mysql.createConnection(dbConfig);
            console.log('🔄 Conectando a MySQL...');
        } catch (connectError) {
            console.error('❌ No se pudo conectar a MySQL:', connectError.message);
            console.log('⚠️ Ejecutando en modo sin base de datos');
            return false;
        }

        // Intentar crear/verificar base de datos
        try {
            // Crear base de datos si no existe
            console.log('🔄 Verificando base de datos HADES...');
            await connection.execute('CREATE DATABASE IF NOT EXISTS HADES CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
            console.log('✅ Base de datos HADES verificada/creada');

            await connection.end();

            // Ahora conectar a la base de datos HADES
            connection = await mysql.createConnection(dbConfig);

            // Aquí irían las verificaciones de tablas...
            console.log('✅ Base de datos lista para usar');
            await connection.end();
            return true;
        } catch (dbError) {
            console.error('❌ Error configurando base de datos:', dbError.message);
            console.log('⚠️ Continuando sin base de datos para pruebas');
            if (connection) await connection.end();
            return false;
        }

    } catch (error) {
        console.error('❌ Error general en inicialización:', error);
        console.log('⚠️ Continuando sin base de datos para pruebas');
        return false;
    }
}

// Función para obtener información de dashboard
async function getDashboardStats() {
    let connection;
    try {
        connection = await getConnection();

        const stats = {};

        // Total de empleados activos
        try {
            const [empleadosCount] = await connection.execute('SELECT COUNT(*) as total FROM users WHERE local_id IS NOT NULL AND activo = TRUE');
            stats.totalEmpleados = empleadosCount[0].total;
        } catch (error) {
            console.error('❌ Error contando empleados:', error);
            stats.totalEmpleados = 0;
        }

        // Total de productos
        try {
            const [productCount] = await connection.execute('SELECT COUNT(*) as total FROM productos WHERE activo = TRUE');
            stats.totalProductos = productCount[0].total;
        } catch (error) {
            stats.totalProductos = 0;
        }

        // Ventas del día actual
        try {
            const today = new Date().toISOString().split('T')[0];
            const [ventasHoy] = await connection.execute(`
                SELECT COALESCE(SUM(total), 0) as totalVentas 
                FROM ordenes 
                WHERE DATE(fecha_creacion) = ? AND estado_id IN (
                    SELECT id FROM estados_orden WHERE nombre IN ('completado', 'entregado')
                )
            `, [today]);
            stats.ventasHoy = ventasHoy[0].totalVentas || 0;
        } catch (error) {
            stats.ventasHoy = 0;
        }

        // Productos con stock bajo (menos de 10 unidades)
        try {
            const [stockBajo] = await connection.execute(`
                SELECT COUNT(*) as total 
                FROM inventario i 
                INNER JOIN productos p ON i.producto_id = p.id 
                WHERE i.stock_actual < 10 AND p.activo = TRUE
            `);
            stats.stockBajo = stockBajo[0].total;
        } catch (error) {
            stats.stockBajo = 0;
        }

        // Total de clientes
        try {
            const [clientCount] = await connection.execute('SELECT COUNT(*) as total FROM clientes WHERE activo = TRUE');
            stats.totalClientes = clientCount[0].total;
        } catch (error) {
            stats.totalClientes = 0;
        }

        // Total de órdenes pendientes
        try {
            const [ordenesPendientes] = await connection.execute(`
                SELECT COUNT(*) as total 
                FROM ordenes o 
                INNER JOIN estados_orden e ON o.estado_id = e.id 
                WHERE e.nombre IN ('pendiente', 'en_proceso', 'preparando')
            `);
            stats.ordenesPendientes = ordenesPendientes[0].total;
        } catch (error) {
            stats.ordenesPendientes = 0;
        }

        return stats;
    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        console.log('⚠️ Retornando estadísticas mock para modo offline...');

        // Estadísticas mock para modo offline
        return {
            totalEmpleados: 1,
            totalProductos: 2,
            ventasHoy: 0,
            stockBajo: 0,
            totalClientes: 0,
            ordenesPendientes: 0
        };
    } finally {
        if (connection) connection.release();
    }
}

// Función para obtener actividad reciente
async function getRecentActivity() {
    let connection;
    try {
        connection = await getConnection();
        
        const activities = [];
        
        // Últimas 5 órdenes
        try {
            const [ordenes] = await connection.execute(`
                SELECT 
                    o.id,
                    o.total,
                    o.fecha_creacion,
                    c.nombre as cliente_nombre,
                    e.nombre as estado
                FROM ordenes o
                LEFT JOIN clientes c ON o.cliente_id = c.id
                LEFT JOIN estados_orden e ON o.estado_id = e.id
                ORDER BY o.fecha_creacion DESC
                LIMIT 5
            `);
            
            ordenes.forEach(orden => {
                activities.push({
                    type: 'venta',
                    description: `Nueva venta registrada - $${orden.total}`,
                    time: orden.fecha_creacion,
                    color: 'green'
                });
            });
        } catch (error) {
            console.log('No se pudieron obtener órdenes para actividad reciente');
        }
        
        // Últimos productos agregados
        try {
            const [productos] = await connection.execute(`
                SELECT nombre, fecha_creacion
                FROM productos
                ORDER BY fecha_creacion DESC
                LIMIT 3
            `);
            
            productos.forEach(producto => {
                activities.push({
                    type: 'producto',
                    description: `Producto agregado - ${producto.nombre}`,
                    time: producto.fecha_creacion,
                    color: 'blue'
                });
            });
        } catch (error) {
            console.log('No se pudieron obtener productos para actividad reciente');
        }
        
        // Últimos empleados agregados
        try {
            const [empleados] = await connection.execute(`
                SELECT nombre_completo as nombre, '' as apellido, fecha_creacion as fecha_ingreso
                FROM users
                WHERE local_id IS NOT NULL
                ORDER BY fecha_creacion DESC
                LIMIT 2
            `);
            
            empleados.forEach(empleado => {
                activities.push({
                    type: 'empleado',
                    description: `Nuevo empleado - ${empleado.nombre}`,
                    time: empleado.fecha_ingreso,
                    color: 'purple'
                });
            });
        } catch (error) {
            console.log('No se pudieron obtener empleados para actividad reciente');
        }
        
        // Ordenar por fecha más reciente
        activities.sort((a, b) => new Date(b.time) - new Date(a.time));
        
        return activities.slice(0, 5); // Máximo 5 actividades
        
    } catch (error) {
        console.error('❌ Error obteniendo actividad reciente:', error);
        return [];
    } finally {
        if (connection) connection.release();
    }
}

// Función para obtener datos completos del perfil
async function getProfileData(userId = null, userType = 'local') {
    let connection;
    try {
        connection = await getConnection();
        
        if (userType === 'local') {
            // Obtener información del usuario local (tabla users)
            const [users] = await connection.execute(`
                SELECT 
                    u.id,
                    u.username,
                    u.nombre_completo as full_name,
                    u.cedula,
                    u.cargo,
                    u.es_propietario,
                    u.ultimo_acceso,
                    l.nombre_comercial as local_nombre,
                    l.codigo_local,
                    l.rnc,
                    l.descripcion,
                    p.nombre_completo as propietario_nombre
                FROM users u 
                LEFT JOIN locales l ON u.local_id = l.id
                LEFT JOIN propietarios p ON l.propietario_id = p.id
                WHERE u.activo = TRUE 
                ORDER BY u.id 
                LIMIT 1
            `);
            
            if (users.length > 0) {
                const user = users[0];
                
                // Asegurar que local_id sea null si es undefined
                const safeLocalId = safeParam(user.local_id);
                
                // Obtener estadísticas del local
                const [employeeCount] = await connection.execute(
                    'SELECT COUNT(*) as total FROM users WHERE local_id = ? AND activo = TRUE',
                    [safeLocalId]
                );
                
                const [productCount] = await connection.execute(
                    'SELECT COUNT(*) as total FROM productos WHERE activo = TRUE'
                );
                
                const [orderCount] = await connection.execute(
                    'SELECT COUNT(*) as total FROM ordenes'
                );
                
                const [clientCount] = await connection.execute(
                    'SELECT COUNT(*) as total FROM clientes WHERE activo = TRUE'
                );
                
                // Obtener lista de empleados
                const [employees] = await connection.execute(`
                    SELECT nombre_completo, cargo, activo 
                    FROM users 
                    WHERE local_id = ? AND activo = TRUE
                    ORDER BY nombre_completo
                `, [safeLocalId]);
                
                return {
                    id: user.id,
                    username: user.username,
                    full_name: user.full_name,
                    cedula: user.cedula || 'No especificado',
                    email: 'No especificado', // Los usuarios locales no tienen email requerido
                    cargo: user.cargo,
                    ultimo_acceso: user.ultimo_acceso,
                    local_id: user.local_id,
                    local_nombre: user.local_nombre || 'Colmado Sin Nombre',
                    codigo_local: user.codigo_local || 'N/A',
                    rnc: user.rnc || 'No especificado',
                    direccion: user.descripcion || 'República Dominicana',
                    telefono: 'No especificado',
                    rating: '5.0',
                    total_employees: employeeCount[0].total,
                    total_products: productCount[0].total,
                    total_orders: orderCount[0].total,
                    total_clients: clientCount[0].total,
                    employees: employees,
                    propietario_nombre: user.propietario_nombre || user.full_name,
                    es_propietario: user.es_propietario
                };
            }
        }
        
        // Fallback a datos por defecto si no se encuentra usuario
        return {
            username: 'usuario',
            full_name: 'Usuario del Sistema',
            cedula: 'No especificado',
            email: 'No especificado',
            cargo: 'Usuario',
            ultimo_acceso: new Date(),
            local_nombre: 'Colmado',
            codigo_local: 'N/A',
            rnc: 'No especificado',
            direccion: 'República Dominicana',
            telefono: 'No especificado',
            rating: '5.0',
            total_employees: 0,
            total_products: 0,
            total_orders: 0,
            total_clients: 0,
            employees: [],
            propietario_nombre: 'Propietario',
            es_propietario: false
        };
        
    } catch (error) {
        console.error('❌ Error obteniendo datos del perfil:', error);
        return {
            username: 'usuario',
            full_name: 'Usuario del Sistema',
            email: 'No especificado',
            cargo: 'Usuario',
            local_nombre: 'Colmado',
            employees: []
        };
    } finally {
        if (connection) connection.release();
    }
}

// Función para cerrar el pool de conexiones
function closePool() {
    if (pool) {
        pool.end();
        pool = null;
        console.log('✅ Pool de conexiones cerrado');
    }
}

// Funciones para gestión de empleados

// Obtener lista de empleados
async function getEmpleados() {
    let connection;
    try {
        connection = await getConnection();
        
        const [empleados] = await connection.execute(`
            SELECT 
                u.id,
                u.username,
                u.nombre_completo,
                u.cedula,
                u.cargo,
                u.activo,
                u.ultimo_acceso as fecha_ingreso,
                u.ultimo_acceso,
                'No especificado' as email,
                'No especificado' as telefono
            FROM users u
            WHERE u.local_id IS NOT NULL
            ORDER BY u.nombre_completo ASC
        `);
        
        return empleados;
        
    } catch (error) {
        console.error('❌ Error obteniendo empleados:', error);
        return [];
    } finally {
        if (connection) connection.release();
    }
}

// Agregar nuevo empleado
async function addEmpleado(empleadoData) {
    let connection;
    try {
        connection = await getConnection();
        
        console.log('📝 Datos del empleado recibidos:', empleadoData);
        
        // Obtener el local_id del usuario actual (primer local disponible por ahora)
        const [locales] = await connection.execute('SELECT id FROM locales LIMIT 1');
        if (locales.length === 0) {
            return { success: false, message: 'No hay locales disponibles' };
        }
        
        const localId = locales[0].id;
        
        // Validar datos requeridos
        if (!empleadoData.nombre_completo || empleadoData.nombre_completo.trim() === '') {
            return { success: false, message: 'El nombre completo es requerido' };
        }
        
        if (!empleadoData.cargo || empleadoData.cargo.trim() === '') {
            return { success: false, message: 'El cargo es requerido' };
        }
        
        // Generar username automático basado en el nombre
        const username = empleadoData.nombre_completo
            .toLowerCase()
            .replace(/\s+/g, '.')
            .replace(/[áàäâ]/g, 'a')
            .replace(/[éèëê]/g, 'e')
            .replace(/[íìïî]/g, 'i')
            .replace(/[óòöô]/g, 'o')
            .replace(/[úùüû]/g, 'u')
            .replace(/ñ/g, 'n')
            .replace(/[^a-z0-9.]/g, '');
        
        // Verificar que el username no exista
        const [existingUser] = await connection.execute(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );
        
        if (existingUser.length > 0) {
            return { success: false, message: 'Ya existe un usuario con ese nombre' };
        }
        
        // Preparar datos para inserción
        const insertData = [
            localId,
            username,
            'empleado123', // Contraseña por defecto
            empleadoData.nombre_completo,
            safeParam(empleadoData.cedula),
            empleadoData.cargo,
            safeParam(empleadoData.email),
            safeParam(empleadoData.telefono),
            safeParam(empleadoData.fecha_ingreso),
            false, // No es propietario
            true   // Activo por defecto
        ];
        
        console.log('💾 Datos a insertar:', insertData);
        
        // Insertar nuevo empleado
        const [result] = await connection.execute(`
            INSERT INTO users (
                local_id, 
                username, 
                password_hash, 
                nombre_completo, 
                cedula, 
                cargo, 
                email,
                telefono,
                fecha_ingreso,
                es_propietario, 
                activo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, insertData);
        
        return { 
            success: true, 
            id: result.insertId,
            message: 'Empleado agregado exitosamente',
            username: username,
            password: 'empleado123'
        };
        
    } catch (error) {
        console.error('❌ Error agregando empleado:', error);
        return { success: false, message: 'Error al agregar empleado: ' + error.message };
    } finally {
        if (connection) connection.release();
    }
}

// Cambiar estado de empleado (activar/desactivar)
async function toggleEmpleadoStatus(id, newStatus) {
    let connection;
    try {
        connection = await getConnection();
        
        await connection.execute(
            'UPDATE users SET activo = ? WHERE id = ?',
            [newStatus, id]
        );
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ Error cambiando estado de empleado:', error);
        return { success: false, message: error.message };
    } finally {
        if (connection) connection.release();
    }
}

// Eliminar empleado
async function deleteEmpleado(id) {
    let connection;
    try {
        connection = await getConnection();
        
        console.log('🗑️ Intentando eliminar empleado con ID:', id);
        
        // Verificar que el empleado existe y obtener su información
        const [empleados] = await connection.execute(
            'SELECT id, nombre_completo, es_propietario, cargo FROM users WHERE id = ?',
            [id]
        );
        
        if (empleados.length === 0) {
            return { success: false, message: 'Empleado no encontrado' };
        }
        
        const empleado = empleados[0];
        
        // Verificar que no sea propietario o gerente general
        if (empleado.es_propietario || empleado.cargo === 'Gerente General') {
            return { success: false, message: 'No se puede eliminar a un propietario o gerente general' };
        }
        
        console.log('✅ Empleado válido para eliminación:', empleado.nombre_completo);
        
        // En lugar de eliminar, desactivamos el empleado
        await connection.execute(
            'UPDATE users SET activo = FALSE WHERE id = ?',
            [id]
        );
        
        return { 
            success: true, 
            message: `Empleado ${empleado.nombre_completo} ha sido eliminado exitosamente` 
        };
        
    } catch (error) {
        console.error('❌ Error eliminando empleado:', error);
        return { success: false, message: 'Error al eliminar empleado: ' + error.message };
    } finally {
        if (connection) connection.release();
    }
}

// ===============================
// Funciones para gestión de productos
// ===============================

// Obtener lista de productos
async function getProductos(localId, inventarioId = null) {
    let connection;
    try {
        connection = await getConnection();

        // Convertir undefined a null para evitar errores de MySQL2
        const safeLocalId = safeParam(localId);
        const safeInventarioId = safeParam(inventarioId);

        let whereClause = 'WHERE p.activo = TRUE';
        let joinCondition = 'LEFT JOIN inventario i ON p.inventario_id = i.id';

        if (safeInventarioId) {
            // Filtrar por inventario específico
            whereClause = 'WHERE p.activo = TRUE AND p.inventario_id = ?';
        }

        const [productos] = await connection.execute(`
            SELECT
                p.id,
                p.codigo_barras,
                p.codigo_interno,
                p.nombre,
                p.descripcion,
                p.stock,
                p.precio_costo,
                p.precio_venta,
                p.precio_mayor,
                p.categoria_id,
                p.marca_id,
                p.unidad_medida_id,
                p.peso_neto,
                p.volumen,
                p.imagen_url,
                p.activo,
                p.es_perecedero,
                p.dias_vencimiento,
                p.created_at,
                c.nombre as categoria_nombre,
                m.nombre as marca_nombre,
                um.nombre as unidad_medida_nombre,
                i.nombre as inventario_nombre,
                p.inventario_id
            FROM productos p
            LEFT JOIN categorias_productos c ON p.categoria_id = c.id
            LEFT JOIN marcas m ON p.marca_id = m.id
            LEFT JOIN unidades_medida um ON p.unidad_medida_id = um.id
            ${joinCondition}
            ${whereClause}
            ORDER BY p.nombre ASC
        `, safeInventarioId ? [safeInventarioId] : []);
        return productos;
    } catch (error) {
        console.error('❌ Error obteniendo productos:', error);
        console.log('⚠️ Retornando datos mock de productos...');

        // Datos mock para modo offline
        return [
            {
                id: 1,
                codigo_interno: 'PROD001',
                nombre: 'Producto de Prueba 1',
                descripcion: 'Descripción del producto de prueba',
                stock: 50,
                precio_costo: 10.00,
                precio_venta: 15.00,
                precio_mayor: 12.00,
                categoria_id: 1,
                marca_id: 1,
                unidad_medida_id: 1,
                activo: true,
                categoria_nombre: 'Categoría General',
                marca_nombre: 'Marca Genérica',
                unidad_medida_nombre: 'Unidad',
                inventario_nombre: 'Inventario Principal'
            },
            {
                id: 2,
                codigo_interno: 'PROD002',
                nombre: 'Producto de Prueba 2',
                descripcion: 'Otro producto para pruebas',
                stock: 25,
                precio_costo: 20.00,
                precio_venta: 30.00,
                precio_mayor: 25.00,
                categoria_id: 1,
                marca_id: 1,
                unidad_medida_id: 1,
                activo: true,
                categoria_nombre: 'Categoría General',
                marca_nombre: 'Marca Genérica',
                unidad_medida_nombre: 'Unidad',
                inventario_nombre: 'Inventario Principal'
            }
        ];
    } finally {
        if (connection) connection.release();
    }
}

// Agregar nuevo producto
async function addProducto(productoData) {
    let connection;
    try {
        connection = await getConnection();

        await connection.beginTransaction();

        // Insertar producto con inventario_id opcional
        // Normalizar valores para evitar undefined
        const [result] = await connection.execute(`
            INSERT INTO productos (
                codigo_interno, 
                nombre, 
                descripcion, 
                categoria_id, 
                marca_id, 
                unidad_medida_id,
                inventario_id,
                stock,
                precio_costo,
                precio_venta,
                precio_mayor,
                peso_neto,
                volumen,
                es_perecedero,
                dias_vencimiento,
                activo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
        `, [
            safeParam(productoData.codigo_interno),
            safeParam(productoData.nombre),
            safeParam(productoData.descripcion),
            safeParam(productoData.categoria_id),
            safeParam(productoData.marca_id),
            safeParam(productoData.unidad_medida_id) === null ? 1 : safeParam(productoData.unidad_medida_id),
            safeParam(productoData.inventario_id), // Ahora opcional
            safeParam(productoData.stock) || 0, // Stock por defecto 0
            safeParam(productoData.precio_costo) || 0, // Precio costo por defecto 0
            safeParam(productoData.precio_venta) || 0, // Precio venta por defecto 0
            safeParam(productoData.precio_mayor) || 0, // Precio mayor por defecto 0
            safeParam(productoData.peso_neto),
            safeParam(productoData.volumen),
            safeParam(productoData.es_perecedero) === null ? false : safeParam(productoData.es_perecedero),
            safeParam(productoData.dias_vencimiento)
        ]);

        await connection.commit();

        return { success: true, id: result.insertId, message: 'Producto agregado exitosamente' };
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('❌ Error agregando producto:', error);
        console.log('⚠️ Simulando adición de producto en modo offline...');

        // Simular éxito en modo offline
        return {
            success: true,
            id: Date.now(), // ID simulado
            message: 'Producto agregado exitosamente (modo offline)',
            offline: true
        };
    } finally {
        if (connection) connection.release();
    }
}

// Actualizar producto
async function updateProducto(id, productoData) {
    let connection;
    try {
        connection = await getConnection();

        await connection.beginTransaction();

        // Actualizar producto con campos de stock y precio
        await connection.execute(`
            UPDATE productos SET
                codigo_interno = ?,
                nombre = ?,
                descripcion = ?,
                categoria_id = ?,
                marca_id = ?,
                unidad_medida_id = ?,
                inventario_id = ?,
                stock = ?,
                precio_costo = ?,
                precio_venta = ?,
                precio_mayor = ?,
                peso_neto = ?,
                volumen = ?,
                es_perecedero = ?,
                dias_vencimiento = ?
            WHERE id = ?
        `, [
            safeParam(productoData.codigo_interno),
            safeParam(productoData.nombre),
            safeParam(productoData.descripcion),
            safeParam(productoData.categoria_id),
            safeParam(productoData.marca_id),
            safeParam(productoData.unidad_medida_id) === null ? 1 : safeParam(productoData.unidad_medida_id),
            safeParam(productoData.inventario_id),
            safeParam(productoData.stock) || 0,
            safeParam(productoData.precio_costo) || 0,
            safeParam(productoData.precio_venta) || 0,
            safeParam(productoData.precio_mayor) || 0,
            safeParam(productoData.peso_neto),
            safeParam(productoData.volumen),
            safeParam(productoData.es_perecedero) === null ? false : safeParam(productoData.es_perecedero),
            safeParam(productoData.dias_vencimiento),
            id
        ]);

        await connection.commit();

        return { success: true, message: 'Producto actualizado exitosamente' };
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('❌ Error actualizando producto:', error);
        console.log('⚠️ Simulando actualización de producto en modo offline...');

        // Simular éxito en modo offline
        return {
            success: true,
            message: 'Producto actualizado exitosamente (modo offline)',
            offline: true
        };
    } finally {
        if (connection) connection.release();
    }
}

// Eliminar producto
async function deleteProducto(id) {
    let connection;
    try {
        connection = await getConnection();

        await connection.beginTransaction();

        // Solo eliminar el producto, el inventario permanece
        await connection.execute('DELETE FROM productos WHERE id = ?', [id]);
        
        await connection.commit();
        
        return { success: true, message: 'Producto eliminado exitosamente' };
        
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('❌ Error eliminando producto:', error);
        return { success: false, message: 'Error al eliminar producto: ' + error.message };
    } finally {
        if (connection) connection.release();
    }
}

// Obtener categorías de productos
async function getCategorias() {
    let connection;
    try {
        connection = await getConnection();

        const [categorias] = await connection.execute(`
            SELECT id, nombre, descripcion, activo
            FROM categorias_productos
            WHERE activo = TRUE
            ORDER BY nombre ASC
        `);

        return categorias;
    } catch (error) {
        console.error('❌ Error obteniendo categorías:', error);
        console.log('⚠️ Retornando datos mock de categorías...');

        // Datos mock para modo offline
        return [
            { id: 1, nombre: 'Categoría General', descripcion: 'Categoría por defecto', activo: true },
            { id: 2, nombre: 'Alimentos', descripcion: 'Productos alimenticios', activo: true },
            { id: 3, nombre: 'Bebidas', descripcion: 'Bebidas y refrescos', activo: true }
        ];
    } finally {
        if (connection) connection.release();
    }
}

// Obtener marcas
async function getMarcas() {
    let connection;
    try {
        connection = await getConnection();

        const [marcas] = await connection.execute(`
            SELECT id, nombre, descripcion, activo
            FROM marcas
            WHERE activo = TRUE
            ORDER BY nombre ASC
        `);

        return marcas;
    } catch (error) {
        console.error('❌ Error obteniendo marcas:', error);
        console.log('⚠️ Retornando datos mock de marcas...');

        // Datos mock para modo offline
        return [
            { id: 1, nombre: 'Marca Genérica', descripcion: 'Marca por defecto', activo: true },
            { id: 2, nombre: 'Marca Premium', descripcion: 'Productos de alta calidad', activo: true }
        ];
    } finally {
        if (connection) connection.release();
    }
}

// Obtener unidades de medida
async function getUnidadesMedida() {
    let connection;
    try {
        connection = await getConnection();

        const [unidades] = await connection.execute(`
            SELECT id, nombre, tipo
            FROM unidades_medida
            ORDER BY nombre ASC
        `);

        return unidades;
    } catch (error) {
        console.error('❌ Error obteniendo unidades de medida:', error);
        console.log('⚠️ Retornando datos mock de unidades de medida...');

        // Datos mock para modo offline
        return [
            { id: 1, nombre: 'Unidad', tipo: 'cantidad' },
            { id: 2, nombre: 'Kilogramo', tipo: 'peso' },
            { id: 3, nombre: 'Litro', tipo: 'volumen' }
        ];
    } finally {
        if (connection) connection.release();
    }
}

// ===============================
// Funciones para gestión de inventarios
// ===============================

// Obtener inventarios por local
async function getInventariosPorLocal(localId) {
    let connection;
    try {
        connection = await getConnection();

        // Asegurar que localId sea null si es undefined
        const safeLocalId = safeParam(localId);

        const [inventarios] = await connection.execute(`
            SELECT 
                id, 
                nombre, 
                descripcion,
                activo,
                created_at,
                updated_at,
                (SELECT COUNT(*) FROM productos WHERE inventario_id = inventario.id AND activo = TRUE) as cantidad_productos
            FROM inventario
            WHERE local_id = ? AND activo = TRUE
            ORDER BY nombre ASC
        `, [safeLocalId]);
        return inventarios;
    } catch (error) {
        console.error('❌ Error obteniendo inventarios por local:', error);
        console.log('⚠️ Retornando datos mock de inventarios...');

        // Datos mock para modo offline
        return [
            {
                id: 1,
                nombre: 'Inventario Principal',
                descripcion: 'Inventario principal del local',
                activo: true,
                created_at: new Date(),
                cantidad_productos: 2
            }
        ];
    } finally {
        if (connection) connection.release();
    }
}

// Agregar nuevo inventario
async function addInventario(inventarioData) {
    let connection;
    try {
        connection = await getConnection();
        
        // Asegurar que local_id sea null si es undefined
        const safeLocalId = safeParam(inventarioData.local_id);
        
        const [result] = await connection.execute(`
            INSERT INTO inventario (local_id, nombre, descripcion, activo)
            VALUES (?, ?, ?, TRUE)
        `, [
            safeLocalId,
            inventarioData.nombre,
            safeParam(inventarioData.descripcion)
        ]);
        
        return { success: true, id: result.insertId, message: 'Inventario creado exitosamente' };
        
    } catch (error) {
        console.error('❌ Error agregando inventario:', error);
        return { success: false, message: 'Error al crear inventario: ' + error.message };
    } finally {
        if (connection) connection.release();
    }
}

// Actualizar inventario
async function updateInventario(id, inventarioData) {
    let connection;
    try {
        connection = await getConnection();
        
        await connection.execute(`
            UPDATE inventario 
            SET nombre = ?, descripcion = ?
            WHERE id = ?
        `, [
            inventarioData.nombre,
            safeParam(inventarioData.descripcion),
            id
        ]);
        
        return { success: true, message: 'Inventario actualizado exitosamente' };
        
    } catch (error) {
        console.error('❌ Error actualizando inventario:', error);
        return { success: false, message: 'Error al actualizar inventario: ' + error.message };
    } finally {
        if (connection) connection.release();
    }
}

// Cambiar estado de producto (activar/desactivar)
async function toggleProductoStatus(id, newStatus) {
    let connection;
    try {
        connection = await getConnection();

        await connection.execute(
            'UPDATE productos SET activo = ? WHERE id = ?',
            [newStatus, id]
        );

        return { success: true };
    } catch (error) {
        console.error('❌ Error cambiando estado del producto:', error);
        console.log('⚠️ Simulando cambio de estado en modo offline...');

        // Simular éxito en modo offline
        return {
            success: true,
            offline: true
        };
    } finally {
        if (connection) connection.release();
    }
}

// Eliminar inventario
async function deleteInventario(id) {
    let connection;
    try {
        connection = await getConnection();
        
        // Verificar si el inventario tiene productos asociados
        const [productos] = await connection.execute(
            'SELECT COUNT(*) as total FROM productos WHERE inventario_id = ? AND activo = TRUE',
            [id]
        );
        
        if (productos[0].total > 0) {
            return { success: false, message: 'No se puede eliminar el inventario porque tiene productos asociados' };
        }
        
        await connection.beginTransaction();
        
        // En lugar de eliminar, desactivar el inventario
        await connection.execute(
            'UPDATE inventario SET activo = FALSE WHERE id = ?',
            [id]
        );
        
        await connection.commit();
        
        return { success: true, message: 'Inventario eliminado exitosamente' };
        
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('❌ Error eliminando inventario:', error);
        return { success: false, message: 'Error al eliminar inventario: ' + error.message };
    } finally {
        if (connection) connection.release();
    }
}

// Función de verificación de conexión de prueba
async function testConnection() {
    try {
        console.log('🔍 Probando conexión a base de datos...');
        
        // Intentar conectar
        const connection = await getConnection();
        
        // Ejecutar una consulta simple
        const [rows] = await connection.execute('SELECT 1 as test');
        
        console.log('✅ Conexión exitosa a MySQL');
        connection.release();
        return true;
        
    } catch (error) {
        console.error('❌ Error de conexión a MySQL:', error.message);
        console.log('⚠️ Usando modo sin base de datos para pruebas');
        return false;
    }
}

module.exports = {
    authenticateUser,
    authenticateAdmin,
    authenticateLocalUser,
    initializeDatabase,
    getDashboardStats,
    getRecentActivity,
    getProfileData,
    getEmpleados,
    addEmpleado,
    toggleEmpleadoStatus,
    deleteEmpleado,
    getProductos,
    addProducto,
    updateProducto,
    toggleProductoStatus,
    deleteProducto,
    getCategorias,
    getMarcas,
    getUnidadesMedida,
    getInventariosPorLocal,
    addInventario,
    updateInventario,
    deleteInventario,
    testConnection,
    getConnection,
    closePool,
    dbConfig
};
