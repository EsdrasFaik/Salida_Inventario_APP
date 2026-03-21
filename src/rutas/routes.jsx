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

export const routes = createBrowserRouter(
  createRoutesFromElements(
    <Route>

      <Route path="/" element={<HomeProductos />} />

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