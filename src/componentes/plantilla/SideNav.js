import React from "react";
import { Link } from "react-router-dom";
import { useContextUsuario } from "../../contexto/usuario/UsuarioContext";
import CerrarSesionButton from "../contenedores/CerrarSesion";
import NavItems from "./NavItems";
import RelojDigital from "./RelojDigital";

const navItemsTodos = [
  { nombre: "Productos", icono: "fas fa-pills", url: "/app/productos", urls: [{ url: "/app/productos/inicio", nombre: "Inicio" }] },
  { nombre: "Lotes", icono: "fas fa-boxes", url: "/app/lotes", urls: [{ url: "/app/lotes/inicio", nombre: "Inicio" }] },
  { nombre: "Salidas", icono: "fas fa-paper-plane", url: "/app/salidas", urls: [{ url: "/app/salidas/inicio", nombre: "Inicio" }] },
];

const navItemsAdmin = [
  { nombre: "Sucursales", icono: "fas fa-store", url: "/app/sucursales", urls: [{ url: "/app/sucursales/inicio", nombre: "Inicio" }] },
  { nombre: "Usuarios", icono: "fas fa-user", url: "/app/usuarios", urls: [{ url: "/app/usuarios/inicio", nombre: "Inicio" }] },
];

const SideNav = () => {
  const { usuario } = useContextUsuario();
  const nombreUsuario = usuario?.nombre ?? "Usuario";
  const esAdmin = usuario?.tipoUsuario === "Administrador";

  const items = esAdmin
    ? [...navItemsTodos, ...navItemsAdmin]
    : navItemsTodos;

  return (
    <aside className="main-sidebar main-sidebar-custom sidebar-dark-warning elevation-4"
      style={{ backgroundColor: "#1c0989ff" }}
    >
      {/* Logo — no clickeable */}
      <span className="brand-link d-flex align-items-center" style={{ cursor: "default" }}>
        <img
          src="/AppTest.png"
          alt="Logo"
          className="brand-image img-circle elevation-3"
          style={{ opacity: ".8", width: "35px", height: "35px" }}
        />
        <span className="brand-text font-weight-semibold h2 mx-2">FARSIMAN</span>
      </span>

      <div className="sidebar">
        <div className="user-panel mt-3 pb-3 mb-3 d-flex align-items-center">
          <div className="image">
            <i className="fas fa-user-circle fa-2x" style={{ color: "#fff" }} />
          </div>
          <div className="info ml-2">
            <span className="d-block" style={{ color: "#fff" }}>{nombreUsuario}</span>
          </div>
        </div>

        <nav className="mt-2">
          <ul className="nav nav-pills nav-sidebar flex-column nav-legacy nav-child-indent"
            data-widget="treeview" role="menu" data-accordion="false">
            <li className="nav-header">Menu Principal</li>
            <NavItems items={items} />
            <li className="nav-item">
              <RelojDigital />
            </li>
          </ul>
        </nav>
      </div>

      <div className="sidebar-custom d-flex justify-content-between align-items-center">
        <CerrarSesionButton />
      </div>
    </aside>
  );
};

export default SideNav;