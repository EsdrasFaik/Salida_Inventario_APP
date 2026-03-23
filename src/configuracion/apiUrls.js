export const Servidor = process.env.REACT_APP_API_URL + '/api/';
//export const Servidor = 'http://localhost:3001/api/';
export const UsuarioIniciarSesion = 'usuarios/iniciarsesion';
export const UsuarioEnviarPin = 'usuarios/pin';
export const UsuarioActualizarContrasena = 'usuarios/actualizar/contrasena';
//Usuarios
export const UsuariosGuardar = Servidor + 'usuarios/guardar';
export const UsuariosListar = Servidor + 'usuarios/listar';
export const UsuariosBuscar = Servidor + 'usuarios/buscar?id=';
export const UsuariosActualizar = Servidor + 'usuarios/editar?id=';
//Imagenes
export const ImagenProductos = Servidor + 'imagenes/productos/';
export const ImagenCategorias = Servidor + 'imagenes/productos/categorias/';
//Productos
export const ProductosListar = Servidor + 'productos/listar';
export const ProductosBuscar = Servidor + 'productos/buscar?id=';
export const ProductosGuardar = Servidor + 'productos/guardar';
export const ProductosEditar = Servidor + 'productos/editar?id=';
export const ProductosEliminar = Servidor + 'productos/eliminar?id=';
//Categorias
export const CategoriaListar = Servidor + 'categorias/listar';
export const CategoriaBuscar = Servidor + 'categorias/buscar?id=';
export const CategoriaGuardar = Servidor + 'categorias/guardar';
export const CategoriaEditar = Servidor + 'categorias/editar?id=';
export const CategoriaEliminar = Servidor + 'categorias/eliminar?id=';
//Lotes
export const LotesListar = Servidor + 'lotes/listar';
export const LotesBuscar = Servidor + 'lotes/buscar?id=';
export const LotesGuardar = Servidor + 'lotes/guardar';
export const LotesEditar = Servidor + 'lotes/editar?id=';
export const LotesEliminar = Servidor + 'lotes/eliminar?id=';
//Salidas
export const SalidaListar = Servidor + 'salidas/listar';
export const SalidaBuscar = Servidor + 'salidas/buscar?id=';
export const SalidaGuardar = Servidor + 'salidas/guardar';
export const SalidaEstado = Servidor + 'salidas/estado?id=';
export const SalidaEliminar = Servidor + 'salidas/eliminar?id=';
export const SalidaSimular = Servidor + 'salidas/simular';
//Sucursales
export const SucursalesListar = Servidor + 'sucursales/listar';
export const SucursalesBuscar = Servidor + 'sucursales/buscar?id=';
export const SucursalesGuardar = Servidor + 'sucursales/guardar';
export const SucursalesEditar = Servidor + 'sucursales/editar?id=';
export const SucursalesEliminar = Servidor + 'sucursales/eliminar?id=';












