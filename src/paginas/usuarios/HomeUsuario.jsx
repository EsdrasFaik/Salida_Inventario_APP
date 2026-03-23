// --- IMPORTACIONES ---
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../componentes/contenedores/Card";
import Page from "../../componentes/plantilla/Page";
import { useContextUsuario } from "../../contexto/usuario/UsuarioContext";
import TablaUsuarios from "./TablaUsuario";
import { UsuariosListar } from "../../configuracion/apiUrls";

const HomeUsuarios = () => {
    const { token, ActualizarLista, listaUsuarios, setListaUsuarios } = useContextUsuario();
    const navigate = useNavigate();

    const pageDatos = {
        titulo: {
            titulo: "Gestión de usuarios",
            nombreUrl: "inicio",
        },
    };

    useEffect(() => {
        if (token) ActualizarLista(UsuariosListar, setListaUsuarios);
    }, [token]);

    return (
        <Page datos={pageDatos}>

            {/* --- CARD DESCRIPCIÓN + BOTÓN NUEVO --- */}
            <Card
                titulo="Módulo de gestión de usuarios"
                pie={
                    <button className="btn btn-success" onClick={() => navigate("/app/usuarios/nuevo")}>
                        <i className="fas fa-plus mx-1" /> Nuevo usuario
                    </button>
                }
            >
                <p className="card-text">
                    Este módulo permite administrar los usuarios del sistema, incluyendo su rol,
                    sucursal asignada y estado. Use el botón <strong>Nuevo usuario</strong> para agregar,
                    o el botón editar de la tabla para modificar.
                </p>
            </Card>

            {/* --- CARD TABLA --- */}
            <Card titulo="Lista de usuarios">
                <TablaUsuarios
                    datos={listaUsuarios}
                    onEditar={(usuario) => navigate(`/app/usuarios/editar?id=${usuario.id}`)}
                />
            </Card>

        </Page>
    );
};

export default HomeUsuarios;