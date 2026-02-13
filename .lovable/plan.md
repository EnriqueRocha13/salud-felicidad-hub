

# Salud=Felicidad(); — Plan de Implementación Completo

## 🎨 Tema y Diseño
- **Primario (verde vibrante):** #2ECC71
- **Fondo:** #F8F9FA (gris casi blanco)
- **Detalles/sombras:** #6C757D (gris metálico)
- Diseño responsivo en todas las páginas
- El nombre "Salud=Felicidad();" visible en todas las secciones
- Acceso secreto al admin: **Click izquierdo + Shift + Ctrl** sobre el nombre de la marca

---

## 🔐 Autenticación y Roles (Supabase Auth)
- **Registro e inicio de sesión** para usuarios públicos (email/contraseña)
- **Panel de administrador** protegido con rol de admin en base de datos (NO credenciales hardcodeadas en el frontend por seguridad)
- El admin se autenticará con su email (enriquedominguez1375@gmail.com) vía Supabase Auth
- Opción para cambiar el correo del admin solicitando contraseña
- Sistema de roles seguro usando tabla `user_roles` con RLS

---

## 🏠 Panel Público (Página Principal)
- **Barra de navegación:** Logo/nombre, Catálogo, Soporte, Iniciar Sesión, Carrito
- **Hero section** con información de la marca
- **Carrusel de artículos médicos** con imágenes debajo del hero
- Si el usuario no tiene sesión y quiere comprar, se le pide iniciar sesión y continúa el proceso

### Catálogo
- Muestra todos los productos agregados por el admin
- Al hacer click en un producto: página individual con imagen 2D o **modelo 3D interactivo** (usando react-three-fiber), nombre, descripción, precio
- Botones de **"Agregar al carrito"** y **"Comprar"**
- Conjuntos de productos con sus propias páginas y enlaces compartibles

### Carrito y Checkout
- Carrito con lista de productos, cantidades y total
- Al comprar: captura de **ubicación GPS** del usuario
- Integración con **Stripe** y **PayPal** para pagos
- Página de confirmación post-pago

### Soporte
- **Chat en tiempo real** con el administrador (usando Supabase Realtime)
- Notificación por email a los participantes cuando llega un mensaje

---

## ⚙️ Panel de Administrador
Acceso oculto vía click+shift+ctrl sobre "Salud=Felicidad();"

### Gestión de Productos
- **Agregar productos:** nombre, descripción, precio, imágenes 2D y modelos 3D (.glb/.gltf)
- Cada producto genera una **página individual con enlace compartible**
- **Artículos médicos** con imágenes para el carrusel público

### Conjuntos de Productos
- Crear conjuntos agrupando productos existentes
- Cada conjunto genera su propia **página con enlace**
- Botones para **compartir en Facebook e Instagram**

### Gestión de Usuarios
- Lista de usuarios registrados con su información
- Cantidad de pedidos por usuario
- Datos de GPS de cada usuario

### Gestión de Pedidos
- Lista de todos los pedidos realizados
- Cada pedido muestra: productos, cantidades, precios, total, datos del usuario y ubicación GPS
- Estado del pedido

### Chat de Soporte
- Vista de conversaciones por usuario
- Capacidad de agregar diferentes correos para recibir notificaciones
- Los mensajes llegan por email a los participantes

---

## 📦 Base de Datos (Supabase)
- Tablas: productos, conjuntos, usuarios/perfiles, pedidos, items de pedido, mensajes de chat, roles
- Storage para imágenes 2D y modelos 3D
- Políticas RLS para seguridad
- Realtime para chat en vivo

## 💳 Pagos
- **Stripe** (integración nativa de Lovable) para tarjetas
- **PayPal** como opción adicional

## 📱 Responsive
- Todas las vistas adaptadas a móvil, tablet y escritorio

