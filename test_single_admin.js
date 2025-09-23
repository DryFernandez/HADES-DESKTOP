// Script para probar la restricción de un solo administrador activo
const { getEmpleados, addEmpleado, updateEmpleado, toggleEmpleadoStatus, deleteEmpleado } = require('./database');

async function testSingleAdminRestriction() {
    console.log('🧪 Probando restricción de un solo administrador activo...\n');

    try {
        // 1. Obtener empleados actuales
        console.log('1️⃣ Empleados actuales:');
        const empleados = await getEmpleados();
        empleados.forEach(emp => {
            console.log(`   - ${emp.nombre_completo}: ${emp.cargo} (${emp.activo ? 'Activo' : 'Inactivo'})`);
        });

        // 2. Intentar crear un nuevo administrador
        console.log('\n2️⃣ Creando nuevo administrador...');
        const cedulaNueva = `999-${Date.now().toString().slice(-7)}`; // Cédula única
        const result1 = await addEmpleado({
            nombre_completo: 'Nuevo Administrador',
            cedula: cedulaNueva,
            rol_id: 1, // Administrador
            fecha_ingreso: new Date().toISOString().split('T')[0]
        });
        console.log('Resultado:', result1);

        // 3. Verificar que otros administradores se desactivaron
        console.log('\n3️⃣ Verificando que otros administradores se desactivaron:');
        const empleadosDespues = await getEmpleados();
        empleadosDespues.forEach(emp => {
            if (emp.cargo === 'Administrador') {
                console.log(`   - ${emp.nombre_completo}: ${emp.activo ? 'Activo' : 'Inactivo'}`);
            }
        });

        // 4. Intentar desactivar el último administrador activo
        console.log('\n4️⃣ Intentando desactivar el último administrador activo...');
        const adminActivo = empleadosDespues.find(emp => emp.cargo === 'Administrador' && emp.activo);
        if (adminActivo) {
            const result2 = await deleteEmpleado(adminActivo.id);
            console.log('Resultado (debería fallar):', result2);
        }

        // 5. Intentar cambiar un empleado a administrador
        console.log('\n5️⃣ Cambiando un empleado existente a administrador...');
        const empleadoNoAdmin = empleadosDespues.find(emp => emp.cargo !== 'Administrador');
        if (empleadoNoAdmin) {
            const result3 = await updateEmpleado(empleadoNoAdmin.id, {
                nombre_completo: empleadoNoAdmin.nombre_completo,
                cedula: empleadoNoAdmin.cedula,
                rol_id: 1, // Administrador
                fecha_nacimiento: empleadoNoAdmin.fecha_nacimiento,
                salario: empleadoNoAdmin.salario,
                fecha_ingreso: empleadoNoAdmin.fecha_ingreso
            });
            console.log('Resultado:', result3);
        }

        console.log('\n✅ Prueba completada');

    } catch (error) {
        console.error('❌ Error en la prueba:', error);
    }
}

// Probar la función ensureActiveAdmin
async function testEnsureActiveAdmin() {
    console.log('🧪 Probando función ensureActiveAdmin...\n');

    try {
        const { ensureActiveAdmin } = require('./database');

        // Ejecutar la función
        const result = await ensureActiveAdmin();
        console.log('Resultado:', result);

        console.log('\n✅ Prueba de ensureActiveAdmin completada');

    } catch (error) {
        console.error('❌ Error en la prueba:', error);
    }
}

// Ejecutar la prueba si se llama directamente
if (require.main === module) {
    testSingleAdminRestriction();
    testEnsureActiveAdmin();
}

module.exports = { testSingleAdminRestriction, testEnsureActiveAdmin };