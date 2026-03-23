import { Navigate, Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';
import PageHome from '../componentes/plantilla/PageHome';
import ModalRegistroUsuario from "../paginas/login/ModalRegistroCliente";
import ActualizarContrasena from "../paginas/login/ActualizarContraseña";
import EnviarPin from "../paginas/login/EnviarPin";
import Login from "../paginas/login/Login";
import { AutenticacionRoute } from "./AutenticacionRoute";
import ProductoLayout from "./ProductoLayout";
import HomeProductos from "../paginas/productos/HomeProductos";
import GuardarProducto from "../paginas/productos/GuardarProducto";
import SucuralLayout from "./SucuralLayout";
import HomeSucursales from "../paginas/sucursales/HomeSucursal";
import GuardarSucursal from "../paginas/sucursales/GuardarSucursal";
import { UsuarioLayout } from "./UsuarioLayout";
import HomeUsuarios from "../paginas/usuarios/HomeUsuario";
import GuardarUsuario from "../paginas/usuarios/GuardarUsuario";
import LoteLayout from "./LoteLayout";
import HomeLotes from "../paginas/inventarios/HomeLote";
import GuardarLote from "../paginas/inventarios/GuardarLote";
import SalidaLayout from "./SalidasLayout";
import HomeSalidas from "../paginas/movimientos/HomeSalidas";
import GuardarSalida from "../paginas/movimientos/GuardarSalida";

export const routes = createBrowserRouter(
  createRoutesFromElements(
    <Route>

      <Route path="/" element={<Login />} />

      <Route path="/login" element={<Login />} />
      <Route path="/recuperar-pin" element={<EnviarPin />} />
      <Route path="/actualizar-contrasena" element={<ActualizarContrasena />} />
      <Route path="/registro-cliente" element={<ModalRegistroUsuario />} />
      <Route path="app/" element={<AutenticacionRoute />}>

        <Route path="productos" element={<ProductoLayout />}>
          <Route path="inicio" element={<HomeProductos />} />
          <Route path="nuevo" element={<GuardarProducto />} />
          <Route path="editar" element={<GuardarProducto />} />
        </Route>

        <Route path="sucursales" element={<SucuralLayout />}>
          <Route path="inicio" element={<HomeSucursales />} />
          <Route path="nuevo" element={<GuardarSucursal />} />
          <Route path="editar" element={<GuardarSucursal />} />
        </Route>

        <Route path="usuarios" element={<UsuarioLayout />}>
          <Route path="inicio" element={<HomeUsuarios />} />
          <Route path="nuevo" element={<GuardarUsuario />} />
          <Route path="editar" element={<GuardarUsuario />} />
        </Route>

        <Route path="lotes" element={<LoteLayout />}>
          <Route path="inicio" element={<HomeLotes />} />
          <Route path="nuevo" element={<GuardarLote />} />
          <Route path="editar" element={<GuardarLote />} />
        </Route>

        <Route path="salidas" element={<SalidaLayout />}>
          <Route path="inicio" element={<HomeSalidas />} />
          <Route path="nuevo" element={<GuardarSalida />} />
          <Route path="editar" element={<GuardarSalida />} />
        </Route>

        <Route path="home" element={<PageHome />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Route>
  ),
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  }
);