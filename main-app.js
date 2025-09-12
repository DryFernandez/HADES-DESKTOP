// Main application JavaScript for dashboard
console.log('Dashboard loaded successfully!');

// Elementos del DOM
let pageTitle, contentArea, navLinks, sidebar, sidebarToggle;

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar elementos del DOM
  initializeElements();
  
  // Get user data from localStorage or sessionStorage
  const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
  
  // Update user interface
  updateUserInterface(userData);

  // Setup navigation event listeners
  setupNavigation();
  
  // Setup sidebar toggle
  setupSidebarToggle();
  
  // Cargar vista inicial del dashboard
  loadDashboardContent();
});

function initializeElements() {
  pageTitle = document.getElementById('page-title');
  contentArea = document.getElementById('content-area');
  navLinks = document.querySelectorAll('.nav-link');
  sidebar = document.getElementById('sidebar');
  sidebarToggle = document.getElementById('sidebar-toggle');
}

function updateUserInterface(userData) {
  if (userData.full_name || userData.username) {
    const welcomeUser = document.getElementById('welcome-user');
    const userInitial = document.getElementById('user-initial');
    
    const displayName = userData.full_name || userData.username || 'Usuario';
    if (welcomeUser) welcomeUser.textContent = displayName;
    if (userInitial) userInitial.textContent = displayName.charAt(0).toUpperCase();
  }
}

function setupNavigation() {
  // Configurar enlaces de navegación
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Remover clase active de todos los enlaces
      navLinks.forEach(nav => {
        nav.classList.remove('active', 'bg-gradient-to-r', 'from-cyan-500/20', 'to-purple-600/20', 'border', 'border-cyan-500/30');
      });
      
      // Agregar clase active al enlace clickeado
      this.classList.add('active', 'bg-gradient-to-r', 'from-cyan-500/20', 'to-purple-600/20', 'border', 'border-cyan-500/30');
      
      // Obtener la sección desde el href
      const section = this.getAttribute('href').substring(1);
      
      // Actualizar título de la página
      const sectionTitle = this.querySelector('span').textContent;
      if (pageTitle) pageTitle.textContent = sectionTitle;
      
      // Cargar contenido correspondiente
      loadSectionContent(section);
      
      // Cerrar sidebar en móviles después de seleccionar
      if (window.innerWidth < 1024 && sidebar) {
        sidebar.classList.add('-translate-x-full');
      }
    });
  });

  // User Profile Section Click
  const userProfileSection = document.getElementById('user-profile-section');
  if (userProfileSection) {
    userProfileSection.addEventListener('click', () => {
      // Remover clase active de todos los enlaces de navegación
      navLinks.forEach(nav => {
        nav.classList.remove('active', 'bg-gradient-to-r', 'from-cyan-500/20', 'to-purple-600/20', 'border', 'border-cyan-500/30');
      });
      
      // Actualizar título de la página
      if (pageTitle) pageTitle.textContent = 'Perfil';
      
      // Cargar contenido del perfil
      loadProfileContent();
      
      // Cerrar sidebar en móviles
      if (window.innerWidth < 1024 && sidebar) {
        sidebar.classList.add('-translate-x-full');
      }
    });
  }

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      // Clear user data
      localStorage.removeItem('currentUser');
      sessionStorage.clear();
      
      // Show confirmation
      if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        // Use Electron API if available, otherwise redirect
        if (window.electronAPI && window.electronAPI.logout) {
          window.electronAPI.logout();
        } else {
          window.location.href = 'index.html';
        }
      }
    });
  }
}

function setupSidebarToggle() {
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', function() {
      sidebar.classList.toggle('-translate-x-full');
    });
  }
}

async function loadDashboardContent() {
  if (!contentArea) return;
  
  // Mostrar loading mientras se cargan los datos
  contentArea.innerHTML = `
    <div class="flex items-center justify-center py-20">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p class="text-gray-400">Cargando estadísticas...</p>
      </div>
    </div>
  `;
  
  try {
    // Obtener estadísticas del dashboard
    const stats = await window.electronAPI.getDashboardStats();
    const recentActivity = await window.electronAPI.getRecentActivity();
    
    console.log('📊 Estadísticas del dashboard:', stats);
    console.log('🔄 Actividad reciente:', recentActivity);
    
    // Formatear número con comas
    const formatNumber = (num) => num.toLocaleString();
    
    // Formatear dinero
    const formatMoney = (amount) => `$${parseFloat(amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
    
    // Formatear tiempo relativo
    const getTimeAgo = (date) => {
      const now = new Date();
      const past = new Date(date);
      const diffInMinutes = Math.floor((now - past) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'ahora';
      if (diffInMinutes < 60) return `hace ${diffInMinutes} min`;
      if (diffInMinutes < 1440) return `hace ${Math.floor(diffInMinutes / 60)} horas`;
      return `hace ${Math.floor(diffInMinutes / 1440)} días`;
    };
    
    contentArea.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-400 text-sm">Total Empleados</p>
              <p class="text-2xl font-bold text-white">${formatNumber(stats.totalEmpleados)}</p>
            </div>
            <div class="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
          </div>
        </div>
        
        <div class="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-400 text-sm">Productos</p>
              <p class="text-2xl font-bold text-white">${formatNumber(stats.totalProductos)}</p>
            </div>
            <div class="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
          </div>
        </div>
        
        <div class="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-400 text-sm">Ventas Hoy</p>
              <p class="text-2xl font-bold text-white">${formatMoney(stats.ventasHoy)}</p>
            </div>
            <div class="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
          </div>
        </div>
        
        <div class="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-400 text-sm">Stock Bajo</p>
              <p class="text-2xl font-bold text-white">${formatNumber(stats.stockBajo)}</p>
            </div>
            <div class="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
          <h3 class="text-lg font-semibold text-white mb-4">Actividad Reciente</h3>
          <div class="space-y-4">
            ${recentActivity.length > 0 ? recentActivity.map(activity => `
              <div class="flex items-center space-x-3">
                <div class="w-2 h-2 bg-${activity.color}-400 rounded-full"></div>
                <span class="text-gray-300">${activity.description}</span>
                <span class="text-gray-500 text-sm ml-auto">${getTimeAgo(activity.time)}</span>
              </div>
            `).join('') : `
              <div class="text-center py-4">
                <p class="text-gray-500">No hay actividad reciente</p>
              </div>
            `}
          </div>
        </div>
        
        <div class="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
          <h3 class="text-lg font-semibold text-white mb-4">Accesos Rápidos</h3>
          <div class="grid grid-cols-2 gap-4">
            <button class="nav-link p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg hover:from-cyan-500/20 hover:to-blue-500/20 transition-all duration-200" data-section="ventas">
              <svg class="w-8 h-8 text-cyan-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              <span class="text-sm text-gray-300">Nueva Venta</span>
            </button>
            <button class="nav-link p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg hover:from-purple-500/20 hover:to-pink-500/20 transition-all duration-200" data-section="productos">
              <svg class="w-8 h-8 text-purple-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              <span class="text-sm text-gray-300">Añadir Producto</span>
            </button>
            <button class="nav-link p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg hover:from-green-500/20 hover:to-emerald-500/20 transition-all duration-200" data-section="empleados">
              <svg class="w-8 h-8 text-green-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              <span class="text-sm text-gray-300">Gestionar Empleados</span>
            </button>
            <button class="nav-link p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg hover:from-orange-500/20 hover:to-red-500/20 transition-all duration-200" data-section="reportes">
              <svg class="w-8 h-8 text-orange-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span class="text-sm text-gray-300">Ver Reportes</span>
            </button>
          </div>
        </div>
      </div>
    `;
    
  } catch (error) {
    console.error('❌ Error cargando dashboard:', error);
    contentArea.innerHTML = `
      <div class="text-center py-20">
        <div class="text-red-400 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-gray-300 mb-2">Error al cargar datos</h3>
        <p class="text-gray-400 mb-4">No se pudieron obtener las estadísticas del dashboard</p>
        <button onclick="loadDashboardContent()" class="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors">
          Reintentar
        </button>
      </div>
    `;
  }
}

function loadSectionContent(section) {
  if (!contentArea) return;
  
  let content = '';
  
  switch(section) {
    case 'dashboard':
      loadDashboardContent();
      return;
      
    case 'usuarios':
      content = `
        <div class="mb-6">
          <button class="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-200">
            + Nuevo Usuario
          </button>
        </div>
        <div class="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
          <div class="px-6 py-4 border-b border-white/10">
            <h3 class="text-lg font-semibold text-white">Lista de Usuarios</h3>
          </div>
          <div class="p-6">
            <p class="text-gray-400">Gestión de usuarios del sistema...</p>
          </div>
        </div>
      `;
      break;
      
    case 'empleados':
      loadEmpleadosContent();
      return;
      
    case 'productos':
      loadProductosContent();
      return;
      
    case 'ventas':
      content = `
        <div class="mb-6">
          <button class="px-4 py-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg hover:from-purple-600 hover:to-violet-600 transition-all duration-200">
            + Nueva Venta
          </button>
        </div>
        <div class="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
          <div class="px-6 py-4 border-b border-white/10">
            <h3 class="text-lg font-semibold text-white">Registro de Ventas</h3>
          </div>
          <div class="p-6">
            <p class="text-gray-400">Gestión y registro de ventas...</p>
          </div>
        </div>
      `;
      break;
      
    case 'inventario':
      content = `
        <div class="mb-6">
          <button class="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200">
            + Actualizar Stock
          </button>
        </div>
        <div class="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
          <div class="px-6 py-4 border-b border-white/10">
            <h3 class="text-lg font-semibold text-white">Control de Inventario</h3>
          </div>
          <div class="p-6">
            <p class="text-gray-400">Control y gestión de inventario...</p>
          </div>
        </div>
      `;
      break;
      
    case 'reportes':
      content = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <button class="p-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-lg hover:from-indigo-500/30 hover:to-purple-500/30 transition-all duration-200">
            <h4 class="text-white font-medium mb-2">Reporte de Ventas</h4>
            <p class="text-gray-400 text-sm">Generar reporte detallado</p>
          </button>
          <button class="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg hover:from-green-500/30 hover:to-emerald-500/30 transition-all duration-200">
            <h4 class="text-white font-medium mb-2">Reporte de Inventario</h4>
            <p class="text-gray-400 text-sm">Estado actual del stock</p>
          </button>
          <button class="p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg hover:from-blue-500/30 hover:to-cyan-500/30 transition-all duration-200">
            <h4 class="text-white font-medium mb-2">Reporte Financiero</h4>
            <p class="text-gray-400 text-sm">Análisis financiero</p>
          </button>
        </div>
        <div class="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
          <div class="px-6 py-4 border-b border-white/10">
            <h3 class="text-lg font-semibold text-white">Centro de Reportes</h3>
          </div>
          <div class="p-6">
            <p class="text-gray-400">Selecciona el tipo de reporte que deseas generar...</p>
          </div>
        </div>
      `;
      break;
      
    case 'configuracion':
      content = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Configuración General</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-gray-300 text-sm mb-2">Nombre de la Empresa</label>
                <input type="text" class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" placeholder="Mi Empresa">
              </div>
              <div>
                <label class="block text-gray-300 text-sm mb-2">Moneda</label>
                <select class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
                  <option>USD - Dólar</option>
                  <option>EUR - Euro</option>
                  <option>MXN - Peso Mexicano</option>
                </select>
              </div>
            </div>
          </div>
          <div class="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Configuración de Sistema</h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-gray-300">Notificaciones</span>
                <button class="w-12 h-6 bg-cyan-500 rounded-full relative">
                  <div class="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                </button>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-300">Modo Oscuro</span>
                <button class="w-12 h-6 bg-cyan-500 rounded-full relative">
                  <div class="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      break;
      
    default:
      content = `
        <div class="text-center py-20">
          <h3 class="text-2xl font-bold text-gray-300 mb-4">Sección en Desarrollo</h3>
          <p class="text-gray-400">Esta funcionalidad será implementada próximamente</p>
        </div>
      `;
  }
  
  contentArea.innerHTML = content;
}

// Función para obtener estadísticas del dashboard
async function getDashboardStats() {
  try {
    if (window.electronAPI && window.electronAPI.getDashboardStats) {
      return await window.electronAPI.getDashboardStats();
    } else {
      // Valores por defecto si no hay API disponible
      return {
        totalAdmins: 1,
        totalLocales: 0,
        totalUsers: 0,
        totalClientes: 0
      };
    }
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return {
      totalAdmins: 1,
      totalLocales: 0,
      totalUsers: 0,
      totalClientes: 0
    };
  }
}

// Función para cargar el contenido del perfil
async function loadProfileContent() {
  if (!contentArea) return;
  
  // Obtener datos del usuario desde localStorage
  const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
  
  // Mostrar loading mientras carga
  contentArea.innerHTML = `
    <div class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      <span class="ml-3 text-gray-400">Cargando información del perfil...</span>
    </div>
  `;
  
  try {
    // Obtener información completa del perfil si hay API disponible
    let profileData = userData;
    if (window.electronAPI && window.electronAPI.getProfileData) {
      profileData = await window.electronAPI.getProfileData();
    }
    
    contentArea.innerHTML = `
      <div class="max-w-6xl mx-auto space-y-6">
        <!-- Header del Perfil -->
        <div class="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
          <div class="flex items-center space-x-6">
            <div class="w-20 h-20 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center">
              <span class="text-2xl font-bold text-white">${(profileData.full_name || profileData.username || 'U').charAt(0).toUpperCase()}</span>
            </div>
            <div class="flex-1">
              <h2 class="text-2xl font-bold text-white mb-2">${profileData.full_name || profileData.username || 'Usuario'}</h2>
              <p class="text-gray-400 mb-1">${profileData.cargo || 'Administrador'}</p>
              <p class="text-gray-500 text-sm">Último acceso: ${formatDate(profileData.ultimo_acceso) || 'Ahora'}</p>
            </div>
            <div class="text-right">
              <button class="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-200">
                Editar Perfil
              </button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Información Personal -->
          <div class="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
            <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
              <svg class="w-5 h-5 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              Información Personal
            </h3>
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-gray-400 text-sm mb-1">Nombre Completo</label>
                  <p class="text-white">${profileData.full_name || 'No especificado'}</p>
                </div>
                <div>
                  <label class="block text-gray-400 text-sm mb-1">Cédula</label>
                  <p class="text-white">${profileData.cedula || 'No especificado'}</p>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-gray-400 text-sm mb-1">Usuario</label>
                  <p class="text-white">${profileData.username || 'No especificado'}</p>
                </div>
                <div>
                  <label class="block text-gray-400 text-sm mb-1">Email</label>
                  <p class="text-white">${profileData.email || 'No especificado'}</p>
                </div>
              </div>
              <div>
                <label class="block text-gray-400 text-sm mb-1">Cargo</label>
                <p class="text-white">${profileData.cargo || 'Administrador'}</p>
              </div>
            </div>
          </div>

          <!-- Información del Local -->
          <div class="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
            <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
              <svg class="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
              Información del Local
            </h3>
            <div class="space-y-4">
              <div>
                <label class="block text-gray-400 text-sm mb-1">Nombre Comercial</label>
                <p class="text-white">${profileData.local_nombre || 'Colmado Don Carlos'}</p>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-gray-400 text-sm mb-1">Código Local</label>
                  <p class="text-white">${profileData.codigo_local || 'LOC001'}</p>
                </div>
                <div>
                  <label class="block text-gray-400 text-sm mb-1">RNC</label>
                  <p class="text-white">${profileData.rnc || '131234567'}</p>
                </div>
              </div>
              <div>
                <label class="block text-gray-400 text-sm mb-1">Dirección</label>
                <p class="text-white">${profileData.direccion || 'Av. Hermanas Mirabal #123, Villa Mella'}</p>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-gray-400 text-sm mb-1">Teléfono</label>
                  <p class="text-white">${profileData.telefono || '809-555-9876'}</p>
                </div>
                <div>
                  <label class="block text-gray-400 text-sm mb-1">Rating</label>
                  <div class="flex items-center">
                    <span class="text-yellow-400 text-lg">⭐</span>
                    <span class="text-white ml-1">${profileData.rating || '4.5'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Estadísticas del Local -->
        <div class="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
          <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
            <svg class="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            Estadísticas del Local
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div class="text-center">
              <div class="text-2xl font-bold text-cyan-400 mb-1">${profileData.total_employees || '5'}</div>
              <div class="text-gray-400 text-sm">Empleados</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-400 mb-1">${profileData.total_products || '456'}</div>
              <div class="text-gray-400 text-sm">Productos</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-purple-400 mb-1">${profileData.total_orders || '1,234'}</div>
              <div class="text-gray-400 text-sm">Órdenes</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-yellow-400 mb-1">${profileData.total_clients || '890'}</div>
              <div class="text-gray-400 text-sm">Clientes</div>
            </div>
          </div>
        </div>

        <!-- Personal del Local -->
        <div class="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
          <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
            <svg class="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            Personal del Local
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${generateEmployeeCards(profileData.employees || [])}
          </div>
        </div>

        <!-- Configuración de Seguridad -->
        <div class="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
          <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
            <svg class="w-5 h-5 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            Configuración de Seguridad
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <button class="w-full px-4 py-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg hover:from-blue-500/30 hover:to-cyan-500/30 transition-all duration-200 text-left">
                <div class="text-white font-medium">Cambiar Contraseña</div>
                <div class="text-gray-400 text-sm">Actualizar credenciales de acceso</div>
              </button>
            </div>
            <div>
              <button class="w-full px-4 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg hover:from-green-500/30 hover:to-emerald-500/30 transition-all duration-200 text-left">
                <div class="text-white font-medium">Configuración de Sesión</div>
                <div class="text-gray-400 text-sm">Gestionar tiempo de sesión</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error cargando perfil:', error);
    contentArea.innerHTML = `
      <div class="text-center py-20">
        <div class="text-red-400 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-300 mb-2">Error al cargar el perfil</h3>
        <p class="text-gray-400">No se pudo cargar la información del perfil.</p>
      </div>
    `;
  }
}

// Función para generar tarjetas de empleados
function generateEmployeeCards(employees) {
  if (!employees || employees.length === 0) {
    return `
      <div class="col-span-full text-center py-8">
        <div class="text-gray-400 mb-2">
          <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
        </div>
        <p class="text-gray-400">No hay empleados registrados</p>
        <button id="add-empleado-btn-empty" class="mt-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 text-sm">
          Agregar Empleado
        </button>
      </div>
    `;
  }
  
  return employees.map(employee => `
    <div class="bg-white/5 border border-white/10 rounded-lg p-4">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <span class="text-sm font-bold text-white">${employee.nombre_completo.charAt(0).toUpperCase()}</span>
        </div>
        <div class="flex-1">
          <p class="text-white font-medium text-sm">${employee.nombre_completo}</p>
          <p class="text-gray-400 text-xs">${employee.rol || 'Empleado'}</p>
        </div>
        <div class="text-xs text-gray-500">
          ${employee.activo ? '🟢' : '🔴'}
        </div>
      </div>
    </div>
  `).join('');
}

// Función helper para formatear fechas
function formatDate(dateString) {
  if (!dateString) return null;
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
}

// Función para cargar contenido de empleados
async function loadEmpleadosContent() {
  console.log('🔥 Ejecutando loadEmpleadosContent');
  console.log('📍 Sidebar element:', document.getElementById('sidebar'));
  console.log('📍 Sidebar visible:', document.getElementById('sidebar')?.style.display);
  console.log('📍 Sidebar classes:', document.getElementById('sidebar')?.className);
  
  if (!contentArea) return;
  
  try {
    // Obtener lista de empleados
    const empleados = await window.electronAPI.getEmpleados();
    
    contentArea.innerHTML = `
      <div class="space-y-6">
        <!-- Header with actions -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-white">Gestión de Empleados</h1>
            <p class="text-gray-400">Administra el personal de tu colmado</p>
          </div>
          <button id="add-empleado-btn" class="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 flex items-center space-x-2 font-medium">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            <span>Agregar Empleado</span>
          </button>
        </div>

        <!-- Search and filters -->
        <div class="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
          <div class="flex flex-col md:flex-row gap-4">
            <div class="flex-1">
              <input type="text" id="search-empleados" placeholder="Buscar empleados..." 
                     class="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none">
            </div>
            <select id="filter-cargo" class="px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:border-cyan-500 focus:outline-none">
              <option value="">Todos los cargos</option>
              <option value="Cajero">Cajero</option>
              <option value="Vendedor">Vendedor</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Gerente">Gerente</option>
            </select>
            <select id="filter-estado" class="px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:border-cyan-500 focus:outline-none">
              <option value="">Todos los estados</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
        </div>

        <!-- Lista de empleados dividida por estado -->
        
        <!-- Empleados Activos -->
        <div class="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
          <div class="px-6 py-4 border-b border-white/10 bg-green-900/20">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-white flex items-center">
                <div class="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                Empleados Activos
                <span id="activos-count" class="ml-2 px-2 py-1 bg-green-500/20 text-green-400 text-sm rounded-full"></span>
              </h3>
              <button id="toggle-activos" class="text-gray-400 hover:text-white transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
            </div>
          </div>
          <div id="activos-table" class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-white/5">
                <tr>
                  <th class="text-left px-6 py-3 text-sm font-medium text-gray-300">Nombre</th>
                  <th class="text-left px-6 py-3 text-sm font-medium text-gray-300">Cédula</th>
                  <th class="text-left px-6 py-3 text-sm font-medium text-gray-300">Cargo</th>
                  <th class="text-left px-6 py-3 text-sm font-medium text-gray-300">Fecha Ingreso</th>
                  <th class="text-left px-6 py-3 text-sm font-medium text-gray-300">Acciones</th>
                </tr>
              </thead>
              <tbody id="empleados-activos-tbody" class="divide-y divide-white/10">
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empleados Inactivos -->
        <div class="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
          <div class="px-6 py-4 border-b border-white/10 bg-red-900/20">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-white flex items-center">
                <div class="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                Empleados Inactivos
                <span id="inactivos-count" class="ml-2 px-2 py-1 bg-red-500/20 text-red-400 text-sm rounded-full"></span>
              </h3>
              <button id="toggle-inactivos" class="text-gray-400 hover:text-white transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
            </div>
          </div>
          <div id="inactivos-table" class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-white/5">
                <tr>
                  <th class="text-left px-6 py-3 text-sm font-medium text-gray-300">Nombre</th>
                  <th class="text-left px-6 py-3 text-sm font-medium text-gray-300">Cédula</th>
                  <th class="text-left px-6 py-3 text-sm font-medium text-gray-300">Cargo</th>
                  <th class="text-left px-6 py-3 text-sm font-medium text-gray-300">Fecha Ingreso</th>
                  <th class="text-left px-6 py-3 text-sm font-medium text-gray-300">Acciones</th>
                </tr>
              </thead>
              <tbody id="empleados-inactivos-tbody" class="divide-y divide-white/10">
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Setup event listeners
    try {
      setupEmpleadosEventListeners();
      console.log('✅ Event listeners configurados correctamente');
    } catch (error) {
      console.error('❌ Error configurando event listeners:', error);
    }
    
    // Poblar las tablas con los datos de empleados
    try {
      populateEmpleadosTables(empleados);
      console.log('✅ Tablas de empleados pobladas correctamente');
    } catch (error) {
      console.error('❌ Error poblando tablas:', error);
    }
    
  } catch (error) {
    console.error('Error cargando empleados:', error);
    contentArea.innerHTML = `
      <div class="text-center py-12">
        <div class="text-red-400 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-white mb-2">Error al cargar empleados</h3>
        <p class="text-gray-400 mb-4">No se pudieron obtener los datos de empleados</p>
        <button data-action="retry-load" class="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors">
          Reintentar
        </button>
      </div>
    `;
  }
}

// Función para generar filas de empleados
function generateEmpleadosRows(empleados) {
  // Obtener el usuario actual para evitar que se pueda eliminar a sí mismo
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const currentUserId = currentUser.id;
  
  console.log('👤 Usuario actual ID:', currentUserId);
  console.log('👥 Lista de empleados:', empleados);
  
  if (!empleados || empleados.length === 0) {
    return `
      <tr>
        <td colspan="6" class="px-6 py-8 text-center text-gray-400">
          <div class="flex flex-col items-center">
            <svg class="w-12 h-12 mb-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <p class="text-lg font-medium">No hay empleados registrados</p>
            <p class="text-sm">Comienza agregando tu primer empleado</p>
          </div>
        </td>
      </tr>
    `;
  }

  return empleados.map(empleado => {
    // Verificar si este empleado es el usuario actual (gerente general)
    const isCurrentUser = empleado.id === currentUserId;
    const isOwner = empleado.es_propietario || empleado.cargo === 'Gerente General';
    const canDelete = !isCurrentUser && !isOwner;
    
    console.log(`🔍 Empleado ${empleado.nombre_completo}: ID=${empleado.id}, esUsuarioActual=${isCurrentUser}, esPropietario=${isOwner}, puedeEliminar=${canDelete}`);
    
    return `
    <tr class="hover:bg-white/5 transition-colors">
      <td class="px-6 py-4">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center">
            <span class="text-sm font-bold">${empleado.nombre_completo.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p class="text-white font-medium">${empleado.nombre_completo}</p>
            <p class="text-gray-400 text-sm">${empleado.email || 'Sin email'}</p>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 text-gray-300">${empleado.cedula || 'No especificado'}</td>
      <td class="px-6 py-4">
        <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400">
          ${empleado.cargo || 'Sin cargo'}
        </span>
      </td>
      <td class="px-6 py-4 text-gray-300">${formatDate(empleado.fecha_ingreso) || 'No especificada'}</td>
      <td class="px-6 py-4">
        <div class="flex items-center space-x-2">
          <button data-action="edit" data-empleado-id="${empleado.id}" class="p-2 text-blue-400 hover:bg-blue-500/20 rounded transition-colors" title="Editar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
          <button data-action="toggle" data-empleado-id="${empleado.id}" data-empleado-activo="${empleado.activo}" class="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded transition-colors" title="${empleado.activo ? 'Desactivar' : 'Activar'}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </button>
          ${canDelete ? `
            <button data-action="delete" data-empleado-id="${empleado.id}" class="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors" title="Eliminar">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          ` : `
            <div class="p-2 text-gray-600" title="${isCurrentUser ? 'No puedes eliminarte a ti mismo' : 'Usuario protegido - No se puede eliminar'}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
          `}
        </div>
      </td>
    </tr>
  `;
  }).join('');
}

// Función para poblar las tablas separadas de activos e inactivos
function populateEmpleadosTables(empleados) {
  // Separar empleados por estado
  const empleadosActivos = empleados.filter(emp => emp.activo);
  const empleadosInactivos = empleados.filter(emp => !emp.activo);
  
  console.log(`📊 Empleados activos: ${empleadosActivos.length}, Inactivos: ${empleadosInactivos.length}`);
  
  // Poblar tabla de activos
  const tbodyActivos = document.getElementById('empleados-activos-tbody');
  if (tbodyActivos) {
    tbodyActivos.innerHTML = generateEmpleadosRows(empleadosActivos);
  }
  
  // Poblar tabla de inactivos
  const tbodyInactivos = document.getElementById('empleados-inactivos-tbody');
  if (tbodyInactivos) {
    tbodyInactivos.innerHTML = generateEmpleadosRows(empleadosInactivos);
  }
  
  // Actualizar contadores
  const activosCount = document.getElementById('activos-count');
  const inactivosCount = document.getElementById('inactivos-count');
  
  if (activosCount) activosCount.textContent = empleadosActivos.length;
  if (inactivosCount) inactivosCount.textContent = empleadosInactivos.length;
  
  // Mostrar/ocultar tablas según contenido
  const activosTable = document.getElementById('activos-table');
  const inactivosTable = document.getElementById('inactivos-table');
  
  if (activosTable) {
    activosTable.style.display = empleadosActivos.length > 0 ? 'block' : 'none';
  }
  
  if (inactivosTable) {
    inactivosTable.style.display = empleadosInactivos.length > 0 ? 'block' : 'none';
  }
}

// Setup event listeners para empleados
function setupEmpleadosEventListeners() {
  // Botón agregar empleado
  const addBtn = document.getElementById('add-empleado-btn');
  console.log('🔍 Botón agregar empleado encontrado:', addBtn);
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      console.log('🔥 Click en botón agregar empleado');
      showAddEmpleadoModal();
    });
  } else {
    console.error('❌ No se encontró el botón add-empleado-btn');
  }

  // Botón agregar empleado (cuando está vacío)
  const addBtnEmpty = document.getElementById('add-empleado-btn-empty');
  console.log('🔍 Botón agregar empleado vacío encontrado:', addBtnEmpty);
  if (addBtnEmpty) {
    addBtnEmpty.addEventListener('click', () => {
      console.log('🔥 Click en botón agregar empleado (vacío)');
      showAddEmpleadoModal();
    });
  }

  // Buscador
  const searchInput = document.getElementById('search-empleados');
  if (searchInput) {
    searchInput.addEventListener('input', filterEmpleados);
  }

  // Filtros
  const filterCargo = document.getElementById('filter-cargo');
  const filterEstado = document.getElementById('filter-estado');
  
  if (filterCargo) filterCargo.addEventListener('change', filterEmpleados);
  if (filterEstado) filterEstado.addEventListener('change', filterEmpleados);
  
  // Event delegation para botones de acción de empleados - Tabla Activos
  const empleadosActivosTable = document.getElementById('empleados-activos-tbody');
  if (empleadosActivosTable) {
    empleadosActivosTable.addEventListener('click', async (e) => {
      const button = e.target.closest('button[data-action]');
      if (!button) return;
      
      const action = button.getAttribute('data-action');
      const empleadoId = parseInt(button.getAttribute('data-empleado-id'));
      
      console.log(`🎯 Acción ${action} para empleado activo ID: ${empleadoId}`);
      
      switch (action) {
        case 'edit':
          await editEmpleado(empleadoId);
          break;
        case 'toggle':
          const isActive = button.getAttribute('data-empleado-activo') === 'true';
          await toggleEmpleadoStatus(empleadoId, isActive);
          break;
        case 'delete':
          await deleteEmpleado(empleadoId);
          break;
        default:
          console.warn('Acción no reconocida:', action);
      }
    });
  }
  
  // Event delegation para botones de acción de empleados - Tabla Inactivos
  const empleadosInactivosTable = document.getElementById('empleados-inactivos-tbody');
  if (empleadosInactivosTable) {
    empleadosInactivosTable.addEventListener('click', async (e) => {
      const button = e.target.closest('button[data-action]');
      if (!button) return;
      
      const action = button.getAttribute('data-action');
      const empleadoId = parseInt(button.getAttribute('data-empleado-id'));
      
      console.log(`🎯 Acción ${action} para empleado inactivo ID: ${empleadoId}`);
      
      switch (action) {
        case 'edit':
          await editEmpleado(empleadoId);
          break;
        case 'toggle':
          const isActive = button.getAttribute('data-empleado-activo') === 'true';
          await toggleEmpleadoStatus(empleadoId, isActive);
          break;
        case 'delete':
          await deleteEmpleado(empleadoId);
          break;
        default:
          console.warn('Acción no reconocida:', action);
      }
    });
  }
  
  // Toggle buttons para colapsar/expandir tablas
  const toggleActivos = document.getElementById('toggle-activos');
  const toggleInactivos = document.getElementById('toggle-inactivos');
  const activosTable = document.getElementById('activos-table');
  const inactivosTable = document.getElementById('inactivos-table');
  
  if (toggleActivos && activosTable) {
    toggleActivos.addEventListener('click', () => {
      const isHidden = activosTable.style.display === 'none';
      activosTable.style.display = isHidden ? 'block' : 'none';
      const icon = toggleActivos.querySelector('svg');
      if (icon) {
        icon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(-90deg)';
      }
    });
  }
  
  if (toggleInactivos && inactivosTable) {
    toggleInactivos.addEventListener('click', () => {
      const isHidden = inactivosTable.style.display === 'none';
      inactivosTable.style.display = isHidden ? 'block' : 'none';
      const icon = toggleInactivos.querySelector('svg');
      if (icon) {
        icon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(-90deg)';
      }
    });
  }
  
  // Event listener para botón de reintentar carga
  const retryButton = document.querySelector('button[data-action="retry-load"]');
  if (retryButton) {
    retryButton.addEventListener('click', () => {
      console.log('🔄 Reintentando cargar empleados...');
      loadEmpleadosContent();
    });
  }
  
  // Asegurar que el sidebar esté visible después de cargar el contenido
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    console.log('✅ Forzando visibilidad del sidebar');
    sidebar.style.display = 'block';
    sidebar.style.visibility = 'visible';
    sidebar.style.opacity = '1';
    sidebar.style.position = 'fixed';
    sidebar.style.zIndex = '100500';
    console.log('📍 Sidebar después de corrección:', sidebar.style.cssText);
  }
}

// Función para mostrar modal de agregar empleado
function showAddEmpleadoModal() {
  console.log('🚀 Ejecutando showAddEmpleadoModal');
  
  // Verificar si ya hay un modal
  const existingModal = document.querySelector('.modal-overlay');
  if (existingModal) {
    console.log('⚠️ Modal ya existe, removiendo...');
    existingModal.remove();
  }
  
  // Crear modal
  const modal = document.createElement('div');
  modal.id = 'empleado-modal';
  modal.className = 'fixed bg-black/50 flex items-center justify-center p-4 modal-overlay';
  
  // Detectar si estamos en desktop (>= 1024px) para ajustar la posición del modal
  const isDesktop = window.innerWidth >= 1024;
  const sidebar = document.getElementById('sidebar');
  const sidebarVisible = isDesktop && sidebar && !sidebar.classList.contains('hidden');
  
  const leftOffset = sidebarVisible ? '256px' : '0px';
  const widthCalc = sidebarVisible ? 'calc(100vw - 256px)' : '100vw';
  
  modal.style.cssText = `z-index: 100000 !important; position: fixed !important; top: 0 !important; left: ${leftOffset} !important; width: ${widthCalc} !important; height: 100vh !important; display: flex !important;`;
  
  console.log('📝 Creando contenido del modal...');
  modal.innerHTML = `
    <div class="bg-gray-900 rounded-xl border border-white/10 w-full max-w-md relative modal-content">
      <div class="flex items-center justify-between p-6 border-b border-white/10">
        <h3 class="text-lg font-semibold text-white">Agregar Nuevo Empleado</h3>
        <button id="close-modal" class="text-gray-400 hover:text-white">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <form id="empleado-form" class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Nombre Completo *</label>
          <input type="text" name="nombre_completo" required 
                 class="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Cédula</label>
          <input type="text" name="cedula" placeholder="000-0000000-0"
                 class="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Cargo *</label>
          <select name="cargo" required
                  class="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:border-cyan-500 focus:outline-none">
            <option value="">Seleccionar cargo</option>
            <option value="Cajero">Cajero</option>
            <option value="Vendedor">Vendedor</option>
            <option value="Supervisor">Supervisor</option>
            <option value="Gerente">Gerente</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Email</label>
          <input type="email" name="email" placeholder="ejemplo@correo.com"
                 class="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Teléfono</label>
          <input type="tel" name="telefono" placeholder="(809) 000-0000"
                 class="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Fecha de Ingreso</label>
          <input type="date" name="fecha_ingreso"
                 class="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:border-cyan-500 focus:outline-none">
        </div>
        <div class="flex justify-end space-x-3 pt-4">
          <button type="button" id="cancel-btn" class="px-4 py-2 text-gray-400 hover:text-white transition-colors">
            Cancelar
          </button>
          <button type="submit" class="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200">
            Agregar Empleado
          </button>
        </div>
      </form>
    </div>
  `;

  console.log('🔧 Agregando modal al DOM...');
  document.body.appendChild(modal);
  
  console.log('✅ Modal agregado. Verificando visibilidad...');
  console.log('📍 Modal en DOM:', document.getElementById('empleado-modal'));
  console.log('📍 Modal className:', modal.className);
  console.log('📍 Modal style:', modal.style.cssText);
  
  // Forzar reflow para asegurar que el modal aparezca
  modal.offsetHeight;
  
  console.log('🎯 Configurando event listeners...');

  // Event listeners del modal
  const closeBtn = document.getElementById('close-modal');
  const cancelBtn = document.getElementById('cancel-btn');
  const form = document.getElementById('empleado-form');

  const closeModal = () => {
    console.log('🚪 Cerrando modal...');
    if (modal && modal.parentNode) {
      document.body.removeChild(modal);
      console.log('✅ Modal cerrado');
    }
  };

  console.log('🔗 Asignando event listeners...');
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Set default date to today
  const fechaInput = modal.querySelector('input[name="fecha_ingreso"]');
  if (fechaInput) {
    fechaInput.value = new Date().toISOString().split('T')[0];
  }

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleAddEmpleado(form, closeModal);
  });
}

// Función para manejar agregar empleado
async function handleAddEmpleado(form, closeModal) {
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Agregando...';

  try {
    const formData = new FormData(form);
    const empleadoData = {
      nombre_completo: formData.get('nombre_completo')?.trim(),
      cedula: formData.get('cedula')?.trim() || null,
      cargo: formData.get('cargo')?.trim(),
      email: formData.get('email')?.trim() || null,
      telefono: formData.get('telefono')?.trim() || null,
      fecha_ingreso: formData.get('fecha_ingreso') || new Date().toISOString().split('T')[0]
    };

    console.log('📤 Datos del empleado a enviar:', empleadoData);
    console.log('📅 Fecha de ingreso específica:', empleadoData.fecha_ingreso);

    // Validación adicional
    if (!empleadoData.nombre_completo) {
      showNotification('El nombre completo es requerido', 'error');
      return;
    }

    if (!empleadoData.cargo) {
      showNotification('El cargo es requerido', 'error');
      return;
    }

    const result = await window.electronAPI.addEmpleado(empleadoData);
    if (result.success) {
      closeModal();
      loadEmpleadosContent(); // Recargar la lista
      showNotification(`Empleado agregado exitosamente. Usuario: ${result.username}, Contraseña: ${result.password}`, 'success');
    } else {
      showNotification('Error al agregar empleado: ' + result.message, 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification('Error al agregar empleado', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Agregar Empleado';
  }
}

// Función para filtrar empleados
async function filterEmpleados() {
  const searchTerm = document.getElementById('search-empleados')?.value.toLowerCase() || '';
  const cargoFilter = document.getElementById('filter-cargo')?.value || '';
  const estadoFilter = document.getElementById('filter-estado')?.value || '';

  try {
    const empleados = await window.electronAPI.getEmpleados();
    const filteredEmpleados = empleados.filter(empleado => {
      const matchesSearch = empleado.nombre_completo.toLowerCase().includes(searchTerm) ||
                           (empleado.cedula && empleado.cedula.includes(searchTerm));
      const matchesCargo = !cargoFilter || empleado.cargo === cargoFilter;
      const matchesEstado = !estadoFilter || empleado.activo.toString() === estadoFilter;
      
      return matchesSearch && matchesCargo && matchesEstado;
    });

    // Usar la nueva función para poblar las tablas separadas
    populateEmpleadosTables(filteredEmpleados);
  } catch (error) {
    console.error('Error filtrando empleados:', error);
  }
}

// Función para editar empleado
function editEmpleado(id) {
  showNotification('Función de edición en desarrollo', 'info');
}

// Función para cambiar estado de empleado
async function toggleEmpleadoStatus(id, currentStatus) {
  try {
    const result = await window.electronAPI.toggleEmpleadoStatus(id, !currentStatus);
    if (result.success) {
      loadEmpleadosContent(); // Recargar la lista
      showNotification(`Empleado ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`, 'success');
    } else {
      showNotification('Error al cambiar estado del empleado', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification('Error al cambiar estado del empleado', 'error');
  }
}

// Función para editar empleado
async function editEmpleado(id) {
  console.log('✏️ Editando empleado con ID:', id);
  showNotification('Función de editar empleado en desarrollo', 'info');
  // TODO: Implementar modal de edición de empleado
}

// Función para eliminar empleado
async function deleteEmpleado(id) {
  // Obtener el usuario actual para verificación adicional
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const currentUserId = currentUser.id;
  
  // Verificar que no se trate del usuario actual
  if (id === currentUserId) {
    showNotification('No puedes eliminarte a ti mismo', 'error');
    return;
  }
  
  if (confirm('¿Estás seguro de que quieres eliminar este empleado? Esta acción no se puede deshacer.')) {
    try {
      console.log('🗑️ Intentando eliminar empleado con ID:', id);
      const result = await window.electronAPI.deleteEmpleado(id);
      
      if (result.success) {
        loadEmpleadosContent(); // Recargar la lista
        showNotification(result.message || 'Empleado eliminado exitosamente', 'success');
      } else {
        showNotification(result.message || 'Error al eliminar empleado', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('Error al eliminar empleado', 'error');
    }
  }
}

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white font-medium transition-all duration-300 transform translate-x-full ${
    type === 'success' ? 'bg-green-600' :
    type === 'error' ? 'bg-red-600' :
    type === 'warning' ? 'bg-yellow-600' :
    'bg-blue-600'
  }`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => notification.classList.remove('translate-x-full'), 100);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.add('translate-x-full');
    setTimeout(() => document.body.removeChild(notification), 300);
  }, 3000);
}

// ===============================
// Funciones para gestión de productos
// ===============================

async function loadProductosContent() {
  if (!contentArea) return;
  
  // Mostrar loading
  contentArea.innerHTML = `
    <div class="flex items-center justify-center py-20">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p class="text-gray-400">Cargando productos...</p>
      </div>
    </div>
  `;
  
  try {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const localId = currentUser.local_id;
  const productos = await window.electronAPI.getProductos(localId);
    
    contentArea.innerHTML = `
      <div class="mb-6 flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-white mb-2">Gestión de Productos</h2>
          <p class="text-gray-400">Administra el catálogo de productos</p>
        </div>
        <button id="add-producto-btn" class="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
          </svg>
          Nuevo Producto
        </button>
      </div>
      
      <!-- Filtros -->
      <div class="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-4 mb-6">
        <div class="flex flex-wrap gap-4 items-center">
          <div class="flex-1 min-w-64">
            <input type="text" id="search-productos" placeholder="Buscar productos..." 
                   class="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500">
          </div>
          <div>
            <select id="filter-categoria" class="px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-500">
              <option value="">Todas las categorías</option>
            </select>
          </div>
          <div>
            <select id="filter-estado" class="px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-500">
              <option value="">Todos los estados</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- Tabla de productos -->
      <div class="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
        <div class="px-6 py-4 border-b border-white/10">
          <h3 class="text-lg font-semibold text-white">Catálogo de Productos (${productos.length})</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-black/40">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Producto</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Código</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Categoría</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Precio</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Stock</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Estado</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody id="productos-tbody" class="bg-black/20 divide-y divide-white/10">
              ${productos.length > 0 ? productos.map(producto => generateProductoRow(producto)).join('') : `
                <tr>
                  <td colspan="7" class="px-6 py-8 text-center text-gray-400">
                    <div class="flex flex-col items-center">
                      <svg class="w-12 h-12 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                      </svg>
                      <p class="text-lg font-medium">No hay productos registrados</p>
                      <p class="text-sm">Agrega tu primer producto para comenzar</p>
                    </div>
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    // Configurar event listeners
    setupProductosEventListeners();
    
    // Cargar datos para filtros
    await loadProductosFilters();
    
  } catch (error) {
    console.error('❌ Error cargando productos:', error);
    contentArea.innerHTML = `
      <div class="text-center py-20">
        <div class="text-red-400 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-gray-300 mb-2">Error al cargar productos</h3>
        <p class="text-gray-400 mb-4">No se pudieron obtener los productos</p>
        <button onclick="loadProductosContent()" class="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors">
          Reintentar
        </button>
      </div>
    `;
  }
}

function generateProductoRow(producto) {
  const formatPrice = (price) => price ? `$${parseFloat(price).toFixed(2)}` : 'N/A';
  const stockClass = producto.stock <= producto.stock_minimo ? 'text-red-400' : 'text-green-400';
  
  return `
    <tr class="hover:bg-white/5 transition-colors">
      <td class="px-6 py-4">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold mr-3">
            ${producto.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <div class="text-sm font-medium text-white">${producto.nombre}</div>
            <div class="text-sm text-gray-400">${producto.descripcion || 'Sin descripción'}</div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4">
        <div class="text-sm text-gray-300">${producto.codigo_interno || 'N/A'}</div>
        ${producto.codigo_barras ? `<div class="text-xs text-gray-500">${producto.codigo_barras}</div>` : ''}
      </td>
      <td class="px-6 py-4">
        <div class="text-sm text-gray-300">${producto.categoria_nombre || 'Sin categoría'}</div>
        ${producto.marca_nombre ? `<div class="text-xs text-gray-500">${producto.marca_nombre}</div>` : ''}
      </td>
      <td class="px-6 py-4">
        <div class="text-sm font-medium text-white">${formatPrice(producto.precio_venta)}</div>
        ${producto.costo_promedio > 0 ? `<div class="text-xs text-gray-500">Costo: ${formatPrice(producto.costo_promedio)}</div>` : ''}
      </td>
      <td class="px-6 py-4">
        <div class="text-sm font-medium ${stockClass}">${producto.stock || 0}</div>
        ${producto.stock_minimo > 0 ? `<div class="text-xs text-gray-500">Mín: ${producto.stock_minimo}</div>` : ''}
      </td>
      <td class="px-6 py-4">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          producto.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }">
          ${producto.activo ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td class="px-6 py-4">
        <div class="flex items-center space-x-2">
          <button data-action="edit" data-producto-id="${producto.id}" 
                  class="text-blue-400 hover:text-blue-300 transition-colors" title="Editar">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
          <button data-action="toggle" data-producto-id="${producto.id}" data-producto-activo="${producto.activo}"
                  class="${producto.activo ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'} transition-colors" 
                  title="${producto.activo ? 'Desactivar' : 'Activar'}">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${producto.activo ? 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636' : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'}"/>
            </svg>
          </button>
          <button data-action="delete" data-producto-id="${producto.id}"
                  class="text-red-400 hover:text-red-300 transition-colors" title="Eliminar">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `;
}

function setupProductosEventListeners() {
  // Botón agregar producto
  const addBtn = document.getElementById('add-producto-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => showProductoModal());
  }
  
  // Event delegation para botones de acción
  const productosTable = document.getElementById('productos-tbody');
  if (productosTable) {
    productosTable.addEventListener('click', async (e) => {
      const button = e.target.closest('button[data-action]');
      if (!button) return;
      
      const action = button.getAttribute('data-action');
      const productoId = parseInt(button.getAttribute('data-producto-id'));
      
      console.log(`🎯 Acción ${action} para producto ID: ${productoId}`);
      
      switch (action) {
        case 'edit':
          await editProducto(productoId);
          break;
        case 'toggle':
          const isActive = button.getAttribute('data-producto-activo') === 'true';
          await toggleProductoStatus(productoId, !isActive);
          break;
        case 'delete':
          await deleteProducto(productoId);
          break;
        default:
          console.warn('Acción no reconocida:', action);
      }
    });
  }
  
  // Filtros
  const searchInput = document.getElementById('search-productos');
  const categoriaFilter = document.getElementById('filter-categoria');
  const estadoFilter = document.getElementById('filter-estado');
  
  if (searchInput) {
    searchInput.addEventListener('input', filterProductos);
  }
  if (categoriaFilter) {
    categoriaFilter.addEventListener('change', filterProductos);
  }
  if (estadoFilter) {
    estadoFilter.addEventListener('change', filterProductos);
  }
}

async function loadProductosFilters() {
  try {
    const categorias = await window.electronAPI.getCategorias();
    const categoriaSelect = document.getElementById('filter-categoria');
    
    if (categoriaSelect && categorias.length > 0) {
      categorias.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria.id;
        option.textContent = categoria.nombre;
        categoriaSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('❌ Error cargando filtros:', error);
  }
}

async function filterProductos() {
  // Recargar productos con filtros aplicados
  await loadProductosContent();
}

function showProductoModal(producto = null) {
  // TODO: Implementar modal de producto
  showNotification(producto ? 'Función de editar producto próximamente' : 'Función de agregar producto próximamente', 'info');
}

async function editProducto(id) {
  // TODO: Implementar edición de producto
  showNotification('Función de editar producto próximamente', 'info');
}

async function toggleProductoStatus(id, newStatus) {
  try {
    const result = await window.electronAPI.toggleProductoStatus(id, newStatus);
    
    if (result.success) {
      showNotification(`Producto ${newStatus ? 'activado' : 'desactivado'} exitosamente`, 'success');
      await loadProductosContent(); // Recargar lista
    } else {
      showNotification(result.message || 'Error al cambiar estado del producto', 'error');
    }
  } catch (error) {
    console.error('❌ Error cambiando estado del producto:', error);
    showNotification('Error al cambiar estado del producto', 'error');
  }
}

async function deleteProducto(id) {
  if (!confirm('¿Estás seguro de que deseas eliminar este producto?\n\nEsta acción no se puede deshacer.')) {
    return;
  }
  
  try {
    const result = await window.electronAPI.deleteProducto(id);
    
    if (result.success) {
      showNotification('Producto eliminado exitosamente', 'success');
      await loadProductosContent(); // Recargar lista
    } else {
      showNotification(result.message || 'Error al eliminar producto', 'error');
    }
  } catch (error) {
    console.error('❌ Error eliminando producto:', error);
    showNotification('Error al eliminar producto', 'error');
  }
}
