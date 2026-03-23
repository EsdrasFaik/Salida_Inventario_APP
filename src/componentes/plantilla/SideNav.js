import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useContextUsuario } from "../../contexto/usuario/UsuarioContext";
import CerrarSesionButton from "../contenedores/CerrarSesion";
import RelojDigital from "./RelojDigital";

const navItemsTodos = [
  { nombre: "Productos", icono: "fas fa-pills", url: "/app/productos/inicio" },
  { nombre: "Lotes", icono: "fas fa-boxes", url: "/app/lotes/inicio" },
  { nombre: "Salidas", icono: "fas fa-paper-plane", url: "/app/salidas/inicio" },
];

const navItemsAdmin = [
  { nombre: "Sucursales", icono: "fas fa-store", url: "/app/sucursales/inicio" },
  { nombre: "Usuarios", icono: "fas fa-user", url: "/app/usuarios/inicio" },
];

const SideNav = () => {
  const { usuario, listaSucursales } = useContextUsuario();
  const navigate = useNavigate();

  const [colapsado, setColapsado] = useState(
    () => document.body.classList.contains("sidebar-collapse")
  );

  const nombreUsuario = usuario?.nombre ?? "Usuario";
  const esAdmin = usuario?.tipoUsuario === "Administrador";
  const nombreSucursal = listaSucursales.find(s => s.id === usuario?.sucursalId)?.nombre || null;
  const items = esAdmin ? [...navItemsTodos, ...navItemsAdmin] : navItemsTodos;

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setColapsado(document.body.classList.contains("sidebar-collapse"));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <aside
        className="main-sidebar main-sidebar-custom sidebar-dark-warning elevation-4"
        style={{ backgroundColor: "#1c0989ff" }}
      >
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
              {nombreSucursal && (
                <span className="d-block" style={{ color: "rgba(255,255,255,.6)", fontSize: ".75rem" }}>
                  <i className="fas fa-store mr-1" />
                  {nombreSucursal}
                </span>
              )}
            </div>
          </div>

          <nav className="mt-2">
            <ul
              className="nav nav-pills nav-sidebar flex-column nav-legacy nav-child-indent"
              role="menu"
            >
              <li className="nav-header">Menu Principal</li>
              {items.map(item => (
                <li key={item.url} className="nav-item">
                  <a
                    className="nav-link"
                    onClick={() => navigate(item.url)}
                    style={{ cursor: "pointer" }}
                  >
                    <i className={`nav-icon ${item.icono}`} />
                    <p>{item.nombre}</p>
                  </a>
                </li>
              ))}
              {!colapsado && (
                <li className="nav-item">
                  <RelojDigital />
                </li>
              )}
            </ul>
          </nav>
        </div>

        <div className="sidebar-custom d-flex justify-content-between align-items-center">
          <CerrarSesionButton />
        </div>
      </aside>
    </>
  );
};

export default SideNav;