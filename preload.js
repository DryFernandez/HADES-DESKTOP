// All the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge, ipcRenderer } = require('electron')

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency])
  }
})

// Expose database functions to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Login function - Compatible con la nueva estructura HADES
  login: async (credentials) => {
    return await ipcRenderer.invoke('login', credentials)
  },

  // Función para cerrar sesión
  logout: async () => {
    return await ipcRenderer.invoke('logout')
  },

  // Función para navegar al dashboard
  navigateToDashboard: async () => {
    return await ipcRenderer.invoke('navigate-to-dashboard')
  },

  // Test database connection
  testConnection: async () => {
    return await ipcRenderer.invoke('test-connection')
  },

  // Función para obtener estadísticas del dashboard
  getDashboardStats: async () => {
    return await ipcRenderer.invoke('get-dashboard-stats')
  },

  // Función para obtener actividad reciente
  getRecentActivity: async () => {
    return await ipcRenderer.invoke('get-recent-activity')
  },

  // Función para obtener datos completos del perfil
  getProfileData: async () => {
    return await ipcRenderer.invoke('get-profile-data')
  },

  // Funciones para gestión de empleados
  getEmpleados: async () => {
    return await ipcRenderer.invoke('get-empleados')
  },

  addEmpleado: async (empleadoData) => {
    return await ipcRenderer.invoke('add-empleado', empleadoData)
  },

  updateEmpleado: async (id, empleadoData) => {
    return await ipcRenderer.invoke('update-empleado', id, empleadoData)
  },

  toggleEmpleadoStatus: async (id, status) => {
    return await ipcRenderer.invoke('toggle-empleado-status', id, status)
  },

  deleteEmpleado: async (id) => {
    return await ipcRenderer.invoke('delete-empleado', id)
  },

  // Funciones para gestión de productos
  getProductos: async (localId, inventarioId = null) => {
    return await ipcRenderer.invoke('get-productos', localId, inventarioId)
  },

  addProducto: async (productoData) => {
    return await ipcRenderer.invoke('add-producto', productoData)
  },

  updateProducto: async (id, productoData) => {
    return await ipcRenderer.invoke('update-producto', id, productoData)
  },

  toggleProductoStatus: async (id, status) => {
    return await ipcRenderer.invoke('toggle-producto-status', id, status)
  },

  deleteProducto: async (id) => {
    return await ipcRenderer.invoke('delete-producto', id)
  },

  getCategorias: async () => {
    return await ipcRenderer.invoke('get-categorias')
  },

  getMarcas: async () => {
    return await ipcRenderer.invoke('get-marcas')
  },

  getUnidadesMedida: async () => {
    return await ipcRenderer.invoke('get-unidades-medida')
  },

  getRolesEmpleados: async () => {
    return await ipcRenderer.invoke('get-roles-empleados')
  },

  // Obtener inventarios por local
  getInventariosPorLocal: async (localId) => {
    return await ipcRenderer.invoke('get-inventarios-por-local', localId)
  },

  // Funciones para gestión de inventarios
  addInventario: async (inventarioData) => {
    return await ipcRenderer.invoke('add-inventario', inventarioData)
  },

  updateInventario: async (id, inventarioData) => {
    return await ipcRenderer.invoke('update-inventario', id, inventarioData)
  },

  deleteInventario: async (id) => {
    return await ipcRenderer.invoke('delete-inventario', id)
  },

  // Get all users (mantener compatibilidad)
  getUsers: async () => {
    return await ipcRenderer.invoke('get-users')
  }
})
