const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la base de datos desde variables de entorno
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'HADES', // Usar la base de datos HADES
    port: parseInt(process.env.DB_PORT) || 3306,
    charset: 'utf8mb4',
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};

console.log('🔧 Configuración de DB cargada:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    port: dbConfig.port,
    passwordSet: !!dbConfig.password
});

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
    // Solo autenticar en tabla users (usuarios locales)
    let user = await authenticateLocalUser(username, password);
    
    return user;
}

// Función para verificar e inicializar la base de datos
async function initializeDatabase() {
    let connection;
    try {
        console.log('🔄 Inicializando base de datos HADES...');
        
        // Conectar sin especificar base de datos para crearla si no existe
        const tempConfig = { ...dbConfig };
        delete tempConfig.database;
        
        connection = await mysql.createConnection(tempConfig);
        console.log('🔄 Conectando a MySQL...');
        
        // Crear base de datos si no existe
        console.log('🔄 Verificando base de datos HADES...');
        await connection.execute('CREATE DATABASE IF NOT EXISTS HADES CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        console.log('✅ Base de datos HADES verificada/creada');
        
        await connection.end();
        
        // Ahora conectar a la base de datos HADES
        connection = await mysql.createConnection(dbConfig);
        
        // Verificar si existe la tabla a_users
        console.log('🔄 Verificando tabla a_users...');
        const [tables] = await connection.execute(
            "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'HADES' AND TABLE_NAME = 'a_users'"
        );
        
        if (tables.length === 0) {
            console.log('🔄 Creando tabla a_users...');
            await connection.execute(`
                CREATE TABLE a_users (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    username VARCHAR(50) NOT NULL UNIQUE,
                    password_hash VARCHAR(255) NOT NULL,
                    nombre_completo VARCHAR(100) NOT NULL,
                    email VARCHAR(100) NOT NULL UNIQUE,
                    activo BOOLEAN DEFAULT TRUE,
                    ultimo_acceso TIMESTAMP NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Tabla a_users creada');
        } else {
            console.log('✅ Tabla a_users ya existe');
        }
        
        // Verificar si existe el usuario admin por defecto
        console.log('🔄 Verificando usuario admin...');
        const [adminUsers] = await connection.execute(
            'SELECT * FROM a_users WHERE username = ?',
            ['admin']
        );
        
        if (adminUsers.length === 0) {
            console.log('🔄 Creando usuario admin por defecto...');
            await connection.execute(
                'INSERT INTO a_users (username, password_hash, nombre_completo, email) VALUES (?, ?, ?, ?)',
                ['admin', 'admin123', 'Administrador del Sistema', 'admin@hades.com']
            );
            console.log('✅ Usuario admin creado (admin/admin123)');
        } else {
            console.log('👤 Usuario admin ya existe');
        }
        
        // Mostrar estadísticas de usuarios
        const [adminCount] = await connection.execute('SELECT COUNT(*) as total FROM a_users');
        console.log(`📊 Total de administradores en la base de datos: ${adminCount[0].total}`);
        
        // Verificar y crear usuario de prueba en tabla users
        console.log('🔄 Verificando datos de prueba para login de usuarios...');
        
        // Verificar si existe el propietario de prueba
        const [propietarios] = await connection.execute('SELECT * FROM propietarios WHERE cedula = ?', ['00112345678']);
        let propietarioId = 1;
        
        if (propietarios.length === 0) {
            console.log('🔄 Creando propietario de prueba...');
            await connection.execute(
                'INSERT INTO propietarios (cedula, nombre_completo, fecha_nacimiento) VALUES (?, ?, ?)',
                ['00112345678', 'Carlos Alberto Pérez Rodríguez', '1985-03-15']
            );
            propietarioId = 1;
        } else {
            propietarioId = propietarios[0].id;
        }
        
        // Verificar si existe el local de prueba
        const [locales] = await connection.execute('SELECT * FROM locales WHERE codigo_local = ?', ['LOC001']);
        let localId = 1;
        
        if (locales.length === 0) {
            console.log('🔄 Creando local de prueba...');
            await connection.execute(
                'INSERT INTO locales (propietario_id, codigo_local, nombre_comercial, rnc, descripcion, fecha_apertura) VALUES (?, ?, ?, ?, ?, ?)',
                [propietarioId, 'LOC001', 'Colmado Don Carlos', '131234567', 'Colmado familiar en el corazón de Villa Mella', '2020-01-15']
            );
            localId = 1;
        } else {
            localId = locales[0].id;
        }
        
        // Verificar si existe el usuario de prueba
        const [testUsers] = await connection.execute('SELECT * FROM users WHERE username = ?', ['carlos.admin']);
        
        if (testUsers.length === 0) {
            console.log('🔄 Creando usuario de prueba en tabla users...');
            await connection.execute(
                'INSERT INTO users (local_id, username, password_hash, nombre_completo, cedula, cargo, es_propietario) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [localId, 'carlos.admin', 'admin123', 'Carlos Alberto Pérez Rodríguez', '00112345678', 'Gerente General', true]
            );
            console.log('✅ Usuario de prueba creado (carlos.admin/admin123)');
        } else {
            console.log('👤 Usuario de prueba ya existe');
        }
        
        // Mostrar estadísticas de usuarios locales
        const [userCount] = await connection.execute('SELECT COUNT(*) as total FROM users WHERE activo = TRUE');
        console.log(`📊 Total de usuarios locales en la base de datos: ${userCount[0].total}`);
        
        // Debug: Mostrar datos del usuario de prueba
        const [debugUser] = await connection.execute('SELECT username, password_hash, nombre_completo FROM users WHERE username = ?', ['carlos.admin']);
        if (debugUser.length > 0) {
            console.log('🔍 DEBUG - Datos del usuario carlos.admin:');
            console.log('   Username:', debugUser[0].username);
            console.log('   Password Hash:', debugUser[0].password_hash);
            console.log('   Nombre:', debugUser[0].nombre_completo);
            
            // Si la contraseña está hasheada, actualizarla a texto plano
            if (debugUser[0].password_hash.startsWith('$2b$')) {
                console.log('🔄 Contraseña hasheada encontrada, actualizando a texto plano...');
                await connection.execute(
                    'UPDATE users SET password_hash = ? WHERE username = ?',
                    ['admin123', 'carlos.admin']
                );
                console.log('✅ Contraseña actualizada a admin123');
            }
        }
        
        // Verificar otras tablas importantes
        const [allTables] = await connection.execute(
            "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'HADES' ORDER BY TABLE_NAME"
        );
        console.log('🗂️ Tablas existentes:', allTables.map(t => t.TABLE_NAME));
        
        await connection.end();
        
        console.log('🎉 Base de datos HADES lista para usar');
        
    } catch (error) {
        console.error('❌ Error inicializando base de datos:', error);
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (err) {
                console.error('Error cerrando conexión:', err);
            }
        }
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
                WHERE i.cantidad_disponible < 10 AND p.activo = TRUE
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
        return {
            totalEmpleados: 0,
            totalProductos: 0,
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
                
                // Obtener estadísticas del local
                const [employeeCount] = await connection.execute(
                    'SELECT COUNT(*) as total FROM users WHERE local_id = ? AND activo = TRUE',
                    [user.id]
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
                `, [user.id]);
                
                return {
                    username: user.username,
                    full_name: user.full_name,
                    cedula: user.cedula || 'No especificado',
                    email: 'No especificado', // Los usuarios locales no tienen email requerido
                    cargo: user.cargo,
                    ultimo_acceso: user.ultimo_acceso,
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
            empleadoData.cedula,
            empleadoData.cargo,
            empleadoData.email,
            empleadoData.telefono,
            empleadoData.fecha_ingreso,
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
async function getProductos(localId) {
    let connection;
    try {
        connection = await getConnection();
        const [productos] = await connection.execute(`
            SELECT 
                p.id,
                p.codigo_barras,
                p.codigo_interno,
                p.nombre,
                p.descripcion,
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
                COALESCE(i.cantidad_disponible, 0) as stock,
                COALESCE(i.cantidad_minima, 0) as stock_minimo,
                COALESCE(i.precio_venta, 0) as precio_venta,
                COALESCE(i.costo_promedio, 0) as costo_promedio
            FROM productos p
            LEFT JOIN categorias_productos c ON p.categoria_id = c.id
            LEFT JOIN marcas m ON p.marca_id = m.id
            LEFT JOIN unidades_medida um ON p.unidad_medida_id = um.id
            LEFT JOIN inventario i ON p.id = i.producto_id AND i.local_id = ?
            WHERE p.activo = TRUE
            ORDER BY p.nombre ASC
        `, [localId]);
        return productos;
    } catch (error) {
        console.error('❌ Error obteniendo productos:', error);
        return [];
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
        
        // Insertar producto
        const [result] = await connection.execute(`
            INSERT INTO productos (
                codigo_interno, 
                nombre, 
                descripcion, 
                categoria_id, 
                marca_id, 
                unidad_medida_id,
                peso_neto,
                volumen,
                es_perecedero,
                dias_vencimiento,
                activo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
        `, [
            productoData.codigo_interno,
            productoData.nombre,
            productoData.descripcion,
            productoData.categoria_id || null,
            productoData.marca_id || null,
            productoData.unidad_medida_id || 1,
            productoData.peso_neto || null,
            productoData.volumen || null,
            productoData.es_perecedero || false,
            productoData.dias_vencimiento || null
        ]);
        
        const productoId = result.insertId;
        
        // Si se proporcionó información de inventario, agregarla
        if (productoData.precio_venta || productoData.stock_inicial) {
            await connection.execute(`
                INSERT INTO inventario (
                    local_id,
                    producto_id,
                    cantidad_disponible,
                    cantidad_minima,
                    costo_promedio,
                    precio_venta
                ) VALUES (1, ?, ?, ?, ?, ?)
            `, [
                productoId,
                productoData.stock_inicial || 0,
                productoData.stock_minimo || 0,
                productoData.costo_promedio || 0,
                productoData.precio_venta || 0
            ]);
        }
        
        await connection.commit();
        
        return { success: true, id: productoId, message: 'Producto agregado exitosamente' };
        
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('❌ Error agregando producto:', error);
        return { success: false, message: 'Error al agregar producto: ' + error.message };
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
        return { success: false, message: 'Error al cambiar estado del producto: ' + error.message };
    } finally {
        if (connection) connection.release();
    }
}

// Eliminar producto
async function deleteProducto(id) {
    let connection;
    try {
        connection = await getConnection();
        
        // Verificar si el producto tiene movimientos de inventario
        const [movimientos] = await connection.execute(
            'SELECT COUNT(*) as total FROM movimientos_inventario WHERE producto_id = ?',
            [id]
        );
        
        if (movimientos[0].total > 0) {
            return { success: false, message: 'No se puede eliminar el producto porque tiene movimientos de inventario' };
        }
        
        await connection.beginTransaction();
        
        // Eliminar del inventario primero
        await connection.execute('DELETE FROM inventario WHERE producto_id = ?', [id]);
        
        // Eliminar el producto
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
        return [];
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
        return [];
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
        return [];
    } finally {
        if (connection) connection.release();
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
    toggleProductoStatus,
    deleteProducto,
    getCategorias,
    getMarcas,
    getUnidadesMedida,
    getConnection,
    closePool,
    dbConfig
};
