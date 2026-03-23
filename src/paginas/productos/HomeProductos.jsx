// --- IMPORTACIONES ---
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../componentes/contenedores/Card";
import Page from "../../componentes/plantilla/Page";
import { useContextUsuario } from "../../contexto/usuario/UsuarioContext";
import TablaProductos from "./TablaProducto";
import { ProductosListar } from "../../configuracion/apiUrls";


const HomeProductos = () => {
    const { token, ActualizarLista } = useContextUsuario();
    const { listaProductos, setListaProductos } = useContextUsuario(); // ajusta al contexto que uses
    const navigate = useNavigate();

    const pageDatos = {
        titulo: {
            titulo: "Gestión de productos",
            nombreUrl: "inicio",
        },
    };

    // --- CARGAR LISTA AL MONTAR ---
    useEffect(() => {
        ActualizarLista(ProductosListar, setListaProductos);
    }, []);

    return (
        <Page datos={pageDatos}>

            {/* --- CARD DESCRIPCIÓN + BOTÓN NUEVO --- */}
            <Card
                titulo="Módulo de gestión de productos"
                pie={
                    <button className="btn btn-success" onClick={() => navigate("/app/productos/nuevo")}>
                        <i className="fas fa-plus mx-1" /> Nuevo producto
                    </button>
                }
            >
                <p className="card-text">
                    Este módulo permite administrar el catálogo de productos, incluyendo su categoría,
                    imágenes, SKU y estado. Use el botón <strong>Nuevo producto</strong> para agregar,
                    o los botones de la tabla para editar o eliminar.
                </p>
            </Card>

            {/* --- CARD TABLA --- */}
            <Card titulo="Lista de productos">
                <TablaProductos
                    datos={listaProductos}
                    onEditar={(producto) => navigate(`/app/productos/editar?id=${producto.id}`)}
                />
            </Card>

        </Page>
    );
};

export default HomeProductos;