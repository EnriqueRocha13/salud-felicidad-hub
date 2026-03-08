export type Lang = "es" | "en";

export const translations: Record<Lang, Record<string, string>> = {
  es: {
    // Navbar
    "nav.catalog": "Catálogo",
    "nav.support": "Soporte",
    "nav.login": "Iniciar Sesión",
    "nav.logout": "Cerrar Sesión",
    "nav.cart": "Carrito",

    // Index
    "hero.badge": "Tu salud es nuestra prioridad",
    "hero.subtitle": "Productos médicos de calidad para tu bienestar. Descubre nuestro catálogo completo con envío directo a tu ubicación.",
    "hero.cta_catalog": "Ver Catálogo",
    "hero.cta_support": "Contactar Soporte",
    "index.medical_articles": "Artículos Médicos",
    "index.no_image": "Sin imagen",
    "index.cta_title": "Empieza a cuidar tu salud hoy",
    "index.cta_subtitle": "Regístrate y accede a todos nuestros productos con precios especiales y envío a domicilio.",
    "index.cta_button": "Crear Cuenta",

    // Catalog
    "catalog.title": "Catálogo",
    "catalog.subtitle": "Explora nuestros productos de salud",
    "catalog.no_image": "Sin imagen",
    "catalog.view": "Ver",
    "catalog.add": "Agregar",
    "catalog.bundles": "Conjuntos",
    "catalog.no_products": "Sin productos",

    // Product Detail
    "product.back": "Volver",
    "product.no_image": "Sin imagen",
    "product.add_to_cart": "Agregar al Carrito",
    "product.buy_now": "Comprar Ahora",
    "product.not_found": "Producto no encontrado",
    "product.copy_link": "Copiar Enlace",
    "product.link_copied": "¡Enlace copiado!",
    "product.link_copied_desc": "Pega este enlace en Facebook o Instagram como botón de compra.",
    "product.share_hint": "💡 Usa este enlace como URL del botón de compra en Facebook e Instagram.",

    // Bundle Detail
    "bundle.back": "Volver",
    "bundle.not_found": "Conjunto no encontrado",
    "bundle.copy_link": "Copiar enlace para compartir",
    "bundle.link_copied": "Enlace copiado",
    "bundle.link_copied_desc": "Pega este enlace como URL del botón de compra en Facebook o Instagram.",
    "bundle.products_title": "Productos del conjunto",
    "bundle.view": "Ver",
    "bundle.add": "Agregar",
    "bundle.no_image": "Sin imagen",

    // Cart
    "cart.empty_title": "Tu carrito está vacío",
    "cart.empty_subtitle": "Explora nuestro catálogo y agrega productos",
    "cart.view_catalog": "Ver Catálogo",
    "cart.title": "Carrito",
    "cart.total": "Total:",
    "cart.clear": "Vaciar Carrito",
    "cart.checkout": "Proceder al Pago",

    // Checkout
    "checkout.title": "Checkout",
    "checkout.summary": "Resumen del pedido",
    "checkout.total": "Total",
    "checkout.location": "Ubicación de entrega",
    "checkout.location_share": "Comparte tu ubicación para la entrega",
    "checkout.location_captured": "Ubicación capturada",
    "checkout.location_update": "Actualizar",
    "checkout.location_get": "Obtener",
    "checkout.gps_error": "Error GPS",
    "checkout.pay": "Pagar con Stripe",
    "checkout.order_error": "No se pudo crear el pedido",
    "checkout.payment_error": "No se pudo iniciar el pago con Stripe",
    "checkout.unexpected_error": "Ocurrió un error inesperado",

    // Auth
    "auth.login": "Iniciar Sesión",
    "auth.register": "Registrarse",
    "auth.login_desc": "Ingresa tus credenciales",
    "auth.register_desc": "Crea una cuenta nueva",
    "auth.name": "Nombre",
    "auth.email": "Correo electrónico",
    "auth.password": "Contraseña",
    "auth.submit_login": "Entrar",
    "auth.submit_register": "Registrarse",
    "auth.loading": "Cargando...",
    "auth.switch_to_register": "¿No tienes cuenta? Regístrate",
    "auth.switch_to_login": "¿Ya tienes cuenta? Inicia sesión",
    "auth.welcome": "¡Bienvenido!",
    "auth.register_success": "Registro exitoso",
    "auth.register_confirm": "Revisa tu correo para confirmar tu cuenta.",

    // Support
    "support.title": "Soporte",
    "support.login_prompt": "Inicia sesión para acceder al chat de soporte",
    "support.login": "Iniciar Sesión",
    "support.empty": "Envía un mensaje para iniciar la conversación",
    "support.placeholder": "Escribe un mensaje...",

    // Payment Success
    "payment.title": "¡Pago exitoso!",
    "payment.description": "Tu pedido ha sido procesado correctamente. Recibirás una confirmación pronto.",
    "payment.back": "Volver al inicio",

    // Not Found
    "notfound.title": "Página no encontrada",
    "notfound.back": "Volver al inicio",

    // Footer
    "footer.rights": "Todos los derechos reservados",

    // Admin
    "admin.products": "Productos",
    "admin.bundles": "Conjuntos",
    "admin.users": "Usuarios",
    "admin.orders": "Pedidos",
    "admin.support": "Soporte",
    "admin.public_site": "Sitio Público",
    "admin.logout": "Cerrar Sesión",
    "admin.access": "Acceso Administrador",
    "admin.admin_email": "Correo del administrador",
    "admin.password": "Contraseña",
    "admin.verifying": "Verificando...",
    "admin.enter": "Acceder",

    // Admin Products
    "admin.add_product": "Agregar Producto",
    "admin.edit_product": "Editar Producto",
    "admin.new_product": "Nuevo Producto",
    "admin.product_name": "Nombre",
    "admin.product_desc": "Descripción",
    "admin.product_price": "Precio",
    "admin.product_image": "Imagen del producto",
    "admin.medical_article": "Artículo médico (aparece en carrusel)",
    "admin.saving": "Guardando...",
    "admin.save": "Guardar",
    "admin.product_updated": "Producto actualizado",
    "admin.product_created": "Producto creado",
    "admin.product_deleted": "Producto eliminado",
    "admin.no_products": "No hay productos aún",
    "admin.link_copied": "Enlace copiado",

    // Admin Bundles
    "admin.bundle_title": "Conjuntos de Productos",
    "admin.create_bundle": "Generar Conjunto",
    "admin.edit_bundle": "Editar Conjunto",
    "admin.new_bundle": "Nuevo Conjunto",
    "admin.bundle_name": "Nombre del conjunto",
    "admin.bundle_desc": "Descripción",
    "admin.select_products": "Seleccionar productos",
    "admin.save_changes": "Guardar Cambios",
    "admin.bundle_updated": "Conjunto actualizado",
    "admin.bundle_created": "Conjunto creado",
    "admin.bundle_deleted": "Conjunto eliminado",
    "admin.no_bundles": "No hay conjuntos aún",
    "admin.products_count": "productos",
    "admin.copy_link": "Copiar enlace",

    // Admin Users
    "admin.user_name": "Nombre",
    "admin.user_email": "Email",
    "admin.user_orders": "Pedidos",
    "admin.user_gps": "GPS",
    "admin.user_registered": "Registro",
    "admin.no_users": "Sin usuarios",

    // Admin Orders
    "admin.order_email": "Email:",
    "admin.order_gps": "GPS Pedido:",
    "admin.user_gps_label": "GPS Usuario:",
    "admin.payment_method": "Método de pago:",
    "admin.order_products": "Productos:",
    "admin.no_orders": "Sin pedidos",

    // Admin Chat
    "admin.chat_title": "Chat de Soporte",
    "admin.chat_user": "Usuario",
    "admin.no_conversations": "Sin conversaciones",
    "admin.select_user": "Selecciona un usuario para ver la conversación",
    "admin.reply_placeholder": "Responder...",

    // General
    "error": "Error",
  },
  en: {
    // Navbar
    "nav.catalog": "Catalog",
    "nav.support": "Support",
    "nav.login": "Sign In",
    "nav.logout": "Sign Out",
    "nav.cart": "Cart",

    // Index
    "hero.badge": "Your health is our priority",
    "hero.subtitle": "Quality medical products for your well-being. Discover our full catalog with direct delivery to your location.",
    "hero.cta_catalog": "View Catalog",
    "hero.cta_support": "Contact Support",
    "index.medical_articles": "Medical Articles",
    "index.no_image": "No image",
    "index.cta_title": "Start taking care of your health today",
    "index.cta_subtitle": "Sign up and access all our products with special prices and home delivery.",
    "index.cta_button": "Create Account",

    // Catalog
    "catalog.title": "Catalog",
    "catalog.subtitle": "Explore our health products",
    "catalog.no_image": "No image",
    "catalog.view": "View",
    "catalog.add": "Add",
    "catalog.bundles": "Bundles",
    "catalog.no_products": "No products",

    // Product Detail
    "product.back": "Back",
    "product.no_image": "No image",
    "product.add_to_cart": "Add to Cart",
    "product.buy_now": "Buy Now",
    "product.not_found": "Product not found",
    "product.copy_link": "Copy Link",
    "product.link_copied": "Link copied!",
    "product.link_copied_desc": "Paste this link as the buy button URL on Facebook or Instagram.",
    "product.share_hint": "💡 Use this link as the buy button URL on Facebook and Instagram.",

    // Bundle Detail
    "bundle.back": "Back",
    "bundle.not_found": "Bundle not found",
    "bundle.copy_link": "Copy link to share",
    "bundle.link_copied": "Link copied",
    "bundle.link_copied_desc": "Paste this link in your Facebook or Instagram post",
    "bundle.products_title": "Bundle products",
    "bundle.view": "View",
    "bundle.add": "Add",
    "bundle.no_image": "No image",

    // Cart
    "cart.empty_title": "Your cart is empty",
    "cart.empty_subtitle": "Explore our catalog and add products",
    "cart.view_catalog": "View Catalog",
    "cart.title": "Cart",
    "cart.total": "Total:",
    "cart.clear": "Clear Cart",
    "cart.checkout": "Proceed to Payment",

    // Checkout
    "checkout.title": "Checkout",
    "checkout.summary": "Order summary",
    "checkout.total": "Total",
    "checkout.location": "Delivery location",
    "checkout.location_share": "Share your location for delivery",
    "checkout.location_captured": "Location captured",
    "checkout.location_update": "Update",
    "checkout.location_get": "Get",
    "checkout.gps_error": "GPS Error",
    "checkout.pay": "Pay with Stripe",
    "checkout.order_error": "Could not create the order",
    "checkout.payment_error": "Could not start Stripe payment",
    "checkout.unexpected_error": "An unexpected error occurred",

    // Auth
    "auth.login": "Sign In",
    "auth.register": "Sign Up",
    "auth.login_desc": "Enter your credentials",
    "auth.register_desc": "Create a new account",
    "auth.name": "Name",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.submit_login": "Sign In",
    "auth.submit_register": "Sign Up",
    "auth.loading": "Loading...",
    "auth.switch_to_register": "Don't have an account? Sign up",
    "auth.switch_to_login": "Already have an account? Sign in",
    "auth.welcome": "Welcome!",
    "auth.register_success": "Registration successful",
    "auth.register_confirm": "Check your email to confirm your account.",

    // Support
    "support.title": "Support",
    "support.login_prompt": "Sign in to access the support chat",
    "support.login": "Sign In",
    "support.empty": "Send a message to start the conversation",
    "support.placeholder": "Write a message...",

    // Payment Success
    "payment.title": "Payment successful!",
    "payment.description": "Your order has been processed correctly. You will receive a confirmation soon.",
    "payment.back": "Back to home",

    // Not Found
    "notfound.title": "Page not found",
    "notfound.back": "Back to home",

    // Footer
    "footer.rights": "All rights reserved",

    // Admin
    "admin.products": "Products",
    "admin.bundles": "Bundles",
    "admin.users": "Users",
    "admin.orders": "Orders",
    "admin.support": "Support",
    "admin.public_site": "Public Site",
    "admin.logout": "Sign Out",
    "admin.access": "Admin Access",
    "admin.admin_email": "Admin email",
    "admin.password": "Password",
    "admin.verifying": "Verifying...",
    "admin.enter": "Enter",

    // Admin Products
    "admin.add_product": "Add Product",
    "admin.edit_product": "Edit Product",
    "admin.new_product": "New Product",
    "admin.product_name": "Name",
    "admin.product_desc": "Description",
    "admin.product_price": "Price",
    "admin.product_image": "Product image",
    "admin.medical_article": "Medical article (shows in carousel)",
    "admin.saving": "Saving...",
    "admin.save": "Save",
    "admin.product_updated": "Product updated",
    "admin.product_created": "Product created",
    "admin.product_deleted": "Product deleted",
    "admin.no_products": "No products yet",
    "admin.link_copied": "Link copied",

    // Admin Bundles
    "admin.bundle_title": "Product Bundles",
    "admin.create_bundle": "Create Bundle",
    "admin.edit_bundle": "Edit Bundle",
    "admin.new_bundle": "New Bundle",
    "admin.bundle_name": "Bundle name",
    "admin.bundle_desc": "Description",
    "admin.select_products": "Select products",
    "admin.save_changes": "Save Changes",
    "admin.bundle_updated": "Bundle updated",
    "admin.bundle_created": "Bundle created",
    "admin.bundle_deleted": "Bundle deleted",
    "admin.no_bundles": "No bundles yet",
    "admin.products_count": "products",
    "admin.copy_link": "Copy link",

    // Admin Users
    "admin.user_name": "Name",
    "admin.user_email": "Email",
    "admin.user_orders": "Orders",
    "admin.user_gps": "GPS",
    "admin.user_registered": "Registered",
    "admin.no_users": "No users",

    // Admin Orders
    "admin.order_email": "Email:",
    "admin.order_gps": "Order GPS:",
    "admin.user_gps_label": "User GPS:",
    "admin.payment_method": "Payment method:",
    "admin.order_products": "Products:",
    "admin.no_orders": "No orders",

    // Admin Chat
    "admin.chat_title": "Support Chat",
    "admin.chat_user": "User",
    "admin.no_conversations": "No conversations",
    "admin.select_user": "Select a user to view the conversation",
    "admin.reply_placeholder": "Reply...",

    // General
    "error": "Error",
  },
};
