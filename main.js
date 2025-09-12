const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')

// Cargar variables de entorno al inicio
require('dotenv').config()

const db = require('./database')

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 450,
    height: 650,
    resizable: false,
    center: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    titleBarStyle: 'default',
    icon: path.join(__dirname, 'assets/icon.png'), // Optional: add an icon
    show: false // Don't show until ready
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Handle navigation to dashboard
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.pathname.endsWith('dashboard.html')) {
      event.preventDefault();
      createDashboardWindow();
      mainWindow.close();
    }
  });

  // Open the DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools()
  }

  return mainWindow
}

const createDashboardWindow = () => {
  // Create dashboard window with different dimensions
  const dashboardWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    resizable: true,
    center: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    titleBarStyle: 'default',
    show: false
  });

  dashboardWindow.loadFile('dashboard.html');

  dashboardWindow.once('ready-to-show', () => {
    dashboardWindow.show();
  });

  // Handle navigation back to login
  dashboardWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.pathname.endsWith('index.html')) {
      event.preventDefault();
      createWindow();
      dashboardWindow.close();
    }
  });

  if (process.env.NODE_ENV === 'development') {
    dashboardWindow.webContents.openDevTools();
  }

  return dashboardWindow;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Inicializar base de datos
  console.log('🔄 Inicializando base de datos...');
  const dbInitialized = await db.initializeDatabase();
  
  if (dbInitialized) {
    const connectionTest = await db.testConnection();
    if (connectionTest) {
      console.log('🚀 Base de datos lista para usar');
      // Verificar tablas existentes
      await db.checkTables();
    }
  } else {
    console.warn('⚠️ Error en la inicialización. Revisa la configuración de MySQL.');
  }

  createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Expose createDashboardWindow globally
global.createDashboardWindow = createDashboardWindow;

// IPC handlers for database operations
ipcMain.handle('login', async (event, credentials) => {
  try {
    console.log('🔐 Intento de login para:', credentials.username);
    const result = await db.authenticateUser(credentials.username, credentials.password);
    return result;
  } catch (error) {
    console.error('❌ Error en handler de login:', error);
    return null;
  }
});

ipcMain.handle('logout', async () => {
  try {
    // Lógica de logout si es necesaria
    return { success: true };
  } catch (error) {
    console.error('❌ Error en logout:', error);
    return { success: false };
  }
});

ipcMain.handle('navigate-to-dashboard', async () => {
  try {
    createDashboardWindow();
    // Cerrar ventana de login
    const loginWindow = BrowserWindow.getFocusedWindow();
    if (loginWindow) {
      loginWindow.close();
    }
    return { success: true };
  } catch (error) {
    console.error('❌ Error navegando al dashboard:', error);
    return { success: false };
  }
});

ipcMain.handle('test-connection', async () => {
  try {
    // Cambiar para usar la nueva función
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-dashboard-stats', async () => {
  try {
    const stats = await db.getDashboardStats();
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
  }
});

ipcMain.handle('get-recent-activity', async () => {
  try {
    const activity = await db.getRecentActivity();
    return activity;
  } catch (error) {
    console.error('❌ Error obteniendo actividad reciente:', error);
    return [];
  }
});

ipcMain.handle('get-profile-data', async () => {
  try {
    const profileData = await db.getProfileData();
    return profileData;
  } catch (error) {
    console.error('❌ Error obteniendo datos del perfil:', error);
    return {
      full_name: 'Usuario',
      username: 'admin',
      cargo: 'Administrador',
      local_nombre: 'Mi Local',
      employees: []
    };
  }
});

// Handlers para gestión de empleados
ipcMain.handle('get-empleados', async () => {
  try {
    const empleados = await db.getEmpleados();
    return empleados;
  } catch (error) {
    console.error('❌ Error obteniendo empleados:', error);
    return [];
  }
});

ipcMain.handle('add-empleado', async (event, empleadoData) => {
  try {
    const result = await db.addEmpleado(empleadoData);
    return result;
  } catch (error) {
    console.error('❌ Error agregando empleado:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('toggle-empleado-status', async (event, id, status) => {
  try {
    const result = await db.toggleEmpleadoStatus(id, status);
    return result;
  } catch (error) {
    console.error('❌ Error cambiando estado de empleado:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('delete-empleado', async (event, id) => {
  try {
    const result = await db.deleteEmpleado(id);
    return result;
  } catch (error) {
    console.error('❌ Error eliminando empleado:', error);
    return { success: false, message: error.message };
  }
});

// ===============================
// Handlers para productos
// ===============================

ipcMain.handle('get-productos', async (event, localId) => {
  try {
    const productos = await db.getProductos(localId);
    return productos;
  } catch (error) {
    console.error('❌ Error obteniendo productos:', error);
    return [];
  }
});

ipcMain.handle('add-producto', async (event, productoData) => {
  try {
    const result = await db.addProducto(productoData);
    return result;
  } catch (error) {
    console.error('❌ Error agregando producto:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('toggle-producto-status', async (event, id, status) => {
  try {
    const result = await db.toggleProductoStatus(id, status);
    return result;
  } catch (error) {
    console.error('❌ Error cambiando estado del producto:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('delete-producto', async (event, id) => {
  try {
    const result = await db.deleteProducto(id);
    return result;
  } catch (error) {
    console.error('❌ Error eliminando producto:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('get-categorias', async () => {
  try {
    const categorias = await db.getCategorias();
    return categorias;
  } catch (error) {
    console.error('❌ Error obteniendo categorías:', error);
    return [];
  }
});

ipcMain.handle('get-marcas', async () => {
  try {
    const marcas = await db.getMarcas();
    return marcas;
  } catch (error) {
    console.error('❌ Error obteniendo marcas:', error);
    return [];
  }
});

ipcMain.handle('get-unidades-medida', async () => {
  try {
    const unidades = await db.getUnidadesMedida();
    return unidades;
  } catch (error) {
    console.error('❌ Error obteniendo unidades de medida:', error);
    return [];
  }
});

ipcMain.handle('get-users', async () => {
  try {
    // Mantener para compatibilidad
    return { success: true, users: [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  // Cerrar conexiones de base de datos
  db.closePool();
  
  if (process.platform !== 'darwin') app.quit()
})

// Cleanup on app quit
app.on('before-quit', () => {
  db.closePool();
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
