// --- IMPORTACIONES ---
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../componentes/contenedores/Card";
import Page from "../../componentes/plantilla/Page";
import { useContextUsuario } from "../../contexto/usuario/UsuarioContext";
import TablaSucursales from "./TablaSucursal";
import { SucursalesListar } from "../../configuracion/apiUrls";

const HomeSucursales = () => {
    const { token, ActualizarLista, listaSucursales, setListaSucursales } = useContextUsuario();
    const navigate = useNavigate();

    const pageDatos = {
        titulo: {
            titulo: "Gestión de sucursales",
            url: "/app/sucursales",
            tituloUrl: "sucursales",
            nombreUrl: "inicio",
        },
    };

    useEffect(() => {
        ActualizarLista(SucursalesListar, setListaSucursales);
    }, []);

    return (
        <Page datos={pageDatos}>

            {/* --- CARD DESCRIPCIÓN + BOTÓN NUEVO --- */}
            <Card
                titulo="Módulo de gestión de sucursales"
                pie={
                    <button className="btn btn-success" onClick={() => navigate("/app/sucursales/nuevo")}>
                        <i className="fas fa-plus mx-1" /> Nueva sucursal
                    </button>
                }
            >
                <p className="card-text">
                    Este módulo permite administrar las sucursales del sistema, incluyendo su nombre,
                    ubicación y estado. Use el botón <strong>Nueva sucursal</strong> para agregar,
                    o los botones de la tabla para editar o eliminar.
                </p>
            </Card>

            {/* --- CARD TABLA --- */}
            <Card titulo="Lista de sucursales">
                <TablaSucursales
                    datos={listaSucursales}
                    onEditar={(sucursal) => navigate(`/app/sucursales/editar?id=${sucursal.id}`)}
                />
            </Card>

        </Page>
    );
};

export default HomeSucursales;