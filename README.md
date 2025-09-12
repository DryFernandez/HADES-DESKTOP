# HADES Desktop - Login con MySQL

## 🚀 Características

- **Interfaz moderna** con Tailwind CSS
- **Autenticación real** con MySQL
- **Arquitectura segura** con Electron
- **Base de datos automática** se crea al iniciar

## 📋 Prerrequisitos

1. **Node.js** (v14 o superior)
2. **MySQL Server** instalado y ejecutándose
3. **Git** (opcional)

## ⚙️ Configuración

### 1. Configurar MySQL

```sql
-- Crear usuario (opcional)
CREATE USER 'hades_user'@'localhost' IDENTIFIED BY 'tu_contraseña';
GRANT ALL PRIVILEGES ON hades_db.* TO 'hades_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Configurar variables de entorno

1. Copia el archivo de ejemplo:
```bash
cp .env.example .env
```

2. Edita el archivo `.env` con tus credenciales:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña_mysql
DB_NAME=HADES
DB_PORT=3306
```

**⚠️ Importante:** El archivo `.env` contiene información sensible y no debe subirse a git.

## 🎯 Usuario por defecto

La aplicación crea automáticamente:
- **Usuario:** admin
- **Contraseña:** admin123
- **Email:** admin@hades.com

## 🚀 Ejecutar la aplicación

```bash
# Desarrollo (compila CSS y ejecuta)
npm run dev

# Solo ejecutar
npm start

# Compilar CSS en modo watch
npm run build-css
```

## 📁 Estructura de archivos

```
HADES/
├── main.js          # Proceso principal de Electron
├── database.js      # Configuración y funciones de MySQL
├── preload.js       # Comunicación segura entre procesos
├── renderer.js      # Lógica del frontend
├── index.html       # Interfaz de login
├── styles.css       # CSS compilado de Tailwind
└── src/
    └── input.css    # CSS fuente de Tailwind
```

## 🔧 Solución de problemas

### Error de conexión MySQL
1. Verificar que MySQL esté ejecutándose
2. Comprobar credenciales en `database.js`
3. Verificar que el puerto 3306 esté disponible

### Error de compilación CSS
```bash
npm run build-css-once
```

### Limpiar y reinstalar
```bash
rm -rf node_modules package-lock.json
npm install
```

## 🛡️ Seguridad

- Las contraseñas se almacenan en texto plano (solo para demo)
- En producción usar bcrypt para hash de contraseñas
- Configurar SSL para MySQL en producción
- Validar y sanitizar todas las entradas

## 📝 TODO

- [ ] Hash de contraseñas con bcrypt
- [ ] Configuración con variables de entorno
- [ ] Ventana principal post-login
- [ ] Gestión de sesiones
- [ ] Logs de auditoría
