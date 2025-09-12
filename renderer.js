// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// Sistema de login para HADES - Soporta administradores y usuarios de locales

console.log('Sistema de login HADES iniciado');
console.log('Tipos de usuario soportados: Administradores (a_users) y Usuarios de Locales (users)');

// Login functionality
document.addEventListener('DOMContentLoaded', async () => {
  // Test database connection on startup
  try {
    console.log('🔄 Probando conexión a base de datos HADES...');
    const connectionResult = await window.electronAPI.testConnection();
    if (connectionResult && connectionResult.success) {
      console.log('✅ Conexión a base de datos HADES establecida');
    } else {
      console.warn('⚠️ No se pudo conectar a la base de datos HADES');
    }
  } catch (error) {
    console.error('❌ Error probando conexión:', error);
  }

  const loginForm = document.getElementById('loginForm');
  const togglePassword = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');
  const usernameInput = document.getElementById('username');
  const eyeIcon = document.getElementById('eyeIcon');
  const loginButton = document.getElementById('loginButton');
  const loginText = document.getElementById('loginText');
  const loadingIcon = document.getElementById('loadingIcon');

  // Limpiar sesiones anteriores
  localStorage.removeItem('currentUser');
  sessionStorage.clear();

  // Enfocar el campo de usuario
  if (usernameInput) {
    usernameInput.focus();
  }

  // Toggle password visibility
  if (togglePassword && passwordInput && eyeIcon) {
    togglePassword.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      
      // Update eye icon
      if (type === 'text') {
        eyeIcon.innerHTML = `
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878A3 3 0 0012 9z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 15.536L8.464 8.464"/>
        `;
      } else {
        eyeIcon.innerHTML = `
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        `;
      }
    });
  }

  // Permitir navegación con Enter
  if (usernameInput) {
    usernameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        passwordInput.focus();
      }
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        loginForm.dispatchEvent(new Event('submit'));
      }
    });
  }

  // Handle form submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = usernameInput.value.trim();
      const password = passwordInput.value;

      // Validaciones básicas
      if (!username || !password) {
        showError('Por favor, completa todos los campos');
        return;
      }
      
      // Show loading state
      loginText.textContent = 'Autenticando...';
      loadingIcon.classList.remove('hidden');
      loginButton.disabled = true;
      
      try {
        console.log('🔐 Intentando autenticación para:', username);
        
        // Use real MySQL authentication with new HADES structure
        const result = await window.electronAPI.login({ username, password });
        
        if (result && result.id) {
          console.log('✅ Login exitoso:', result);
          
          // Preparar datos del usuario para guardar
          const userData = {
            id: result.id,
            username: result.username,
            nombre_completo: result.nombre_completo,
            email: result.email,
            tipo_usuario: result.tipo_usuario,
            ultimo_acceso: result.ultimo_acceso
          };
          
          // Si es usuario de local, agregar información del local
          if (result.tipo_usuario === 'LOCAL' && result.local) {
            userData.local = result.local;
            userData.cedula = result.cedula;
            userData.cargo = result.cargo;
            userData.es_propietario = result.es_propietario;
          }
          
          // Guardar en localStorage
          localStorage.setItem('currentUser', JSON.stringify(userData));
          
          // Mensaje de éxito personalizado
          const tipoUsuario = result.tipo_usuario === 'ADMIN' ? 'Administrador' : 'Usuario de Local';
          const nombreCompleto = result.nombre_completo || result.username;
          
          let mensajeBienvenida = '';
          if (result.tipo_usuario === 'ADMIN') {
            mensajeBienvenida = `¡Bienvenido ${nombreCompleto}! Accediendo al panel de administración...`;
          } else {
            mensajeBienvenida = `¡Bienvenido ${nombreCompleto}! Accediendo al sistema de ${result.local.nombre_comercial}...`;
          }
          
          loginText.textContent = mensajeBienvenida;
          loginButton.classList.remove('from-cyan-500', 'to-purple-600');
          loginButton.classList.add('from-green-500', 'to-green-600');
          
          // Mostrar mensaje temporal de éxito
          showSuccessMessage(mensajeBienvenida);
          
          setTimeout(() => {
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
          }, 1500);
          
        } else {
          console.log('❌ Login fallido');
          loginText.textContent = 'Usuario o contraseña incorrectos';
          loginButton.classList.remove('from-cyan-500', 'to-purple-600');
          loginButton.classList.add('from-red-500', 'to-red-600');
          
          // Shake animation
          loginButton.classList.add('animate-pulse');
          
          setTimeout(() => {
            resetLoginForm();
          }, 3000);
        }
      } catch (error) {
        console.error('❌ Error durante el login:', error);
        loginText.textContent = 'Error de conexión a la base de datos';
        loginButton.classList.remove('from-cyan-500', 'to-purple-600');
        loginButton.classList.add('from-red-500', 'to-red-600');
        
        setTimeout(() => {
          resetLoginForm();
        }, 3000);
      }
    });
  }

  function resetLoginForm() {
    loginText.textContent = 'Iniciar Sesión';
    loadingIcon.classList.add('hidden');
    loginButton.disabled = false;
    loginButton.classList.remove('from-green-500', 'to-green-600', 'from-red-500', 'to-red-600', 'animate-pulse');
    loginButton.classList.add('from-cyan-500', 'to-purple-600');
  }

  function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  }

  function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv);
      }
    }, 3000);
  }

  // Add some nice focus effects to inputs
  const inputs = document.querySelectorAll('input[type="text"], input[type="password"]');
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      input.parentElement.classList.add('scale-[1.02]');
    });
    
    input.addEventListener('blur', () => {
      input.parentElement.classList.remove('scale-[1.02]');
    });
  });
});
