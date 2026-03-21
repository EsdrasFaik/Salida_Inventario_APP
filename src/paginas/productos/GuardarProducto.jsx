// --- IMPORTACIONES ---
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    mostraAlertaError,
    mostraAlertaOk,
    mostraAlertaWarning,
} from "../../componentes/alerts/sweetAlert";
import { AxiosImagen, AxiosPrivado } from "../../componentes/axios/Axios";
import Card from "../../componentes/contenedores/Card";
import Dropzone from "../../componentes/imagenes/Dropzone";
import Page from "../../componentes/plantilla/Page";
import { ModalFormularioCategoria } from "./categorias/ModalCategoria";
import EliminarCategoria from "./categorias/EliminarCategoria";
import {
    ProductosGuardar,
    ProductosBuscar,
    ProductosEditar,
    CategoriaListar,
    ImagenCategorias,
    ImagenProductos,
} from "../../configuracion/apiUrls";
import { regexNombre } from "../../configuracion/validaciones";
import { useContextUsuario } from "../../contexto/usuario/UsuarioContext";
import "../styles/styles.css";

// --- PÁGINA GUARDAR / EDITAR PRODUCTO ---
const GuardarProducto = () => {
    const { token, ActualizarLista } = useContextUsuario();
    const navigate = useNavigate();
    const location = useLocation();
    const productoId = new URLSearchParams(location.search).get("id");
    const esEdicion = !!productoId;

    const [cargando, setCargando] = useState(esEdicion);

    const [formulario, setFormulario] = useState({
        nombre: "",
        descripcion: "",
        sku: "",
        estado: "Activo",
        categoriaId: null,
    });

    const [nuevasImagenes, setNuevasImagenes] = useState([]);
    const [dropzoneKey, setDropzoneKey] = useState(Date.now());
    const [imagenesExistentes, setImagenesExistentes] = useState([]);
    const [imagenesAEliminarIds, setImagenesAEliminarIds] = useState([]);

    const [listaCategorias, setListaCategorias] = useState([]);
    const [nombreCategoriaSeleccionada, setNombreCategoriaSeleccionada] = useState("");
    const [modalCategoriaOpen, setModalCategoriaOpen] = useState(false);

    const [errorNombre, setErrorNombre] = useState(false);
    const [errorCategoria, setErrorCategoria] = useState(false);

    const pageDatos = {
        titulo: {
            titulo: esEdicion ? "Editar producto" : "Nuevo producto",
            url: "/app/admin/productos",
            tituloUrl: "productos",
            nombreUrl: esEdicion ? "editar" : "nuevo",
        },
    };

    // --- EFECTOS ---
    useEffect(() => {
        ActualizarLista(CategoriaListar, setListaCategorias);
        if (esEdicion) cargarProducto();
    }, [token]);

    useEffect(() => {
        document.body.style.overflow = modalCategoriaOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [modalCategoriaOpen]);

    useEffect(() => {
        setErrorNombre(formulario.nombre.length > 0 && !regexNombre.test(formulario.nombre));
    }, [formulario.nombre]);

    useEffect(() => {
        setErrorCategoria(!formulario.categoriaId);
    }, [formulario.categoriaId]);

    // --- CARGAR PRODUCTO (solo edición) ---
    const cargarProducto = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await AxiosPrivado.get(ProductosBuscar + productoId, config);
            setFormulario({
                nombre: data.nombre || "",
                descripcion: data.descripcion || "",
                sku: data.sku || "",
                estado: data.estado || "Activo",
                categoriaId: data.categoriaId || null,
            });
            setNombreCategoriaSeleccionada(data.CategoriaProducto?.Categoria || "");
            setImagenesExistentes(
                data.ImagenProductos?.map(img => ({
                    id: img.id,
                    url: ImagenProductos + img.imagen,
                    nombre: img.imagen,
                })) || []
            );
            setImagenesAEliminarIds([]);
        } catch (error) {
            mostraAlertaError(error.response?.data?.error || "Error al cargar el producto.");
        } finally {
            setCargando(false);
        }
    };

    // --- MANEJADOR DE CAMPOS ---
    const manejador = (e) => {
        const { name, value, type, checked } = e.target;
        setFormulario(prev => ({
            ...prev,
            [name]: type === "checkbox" ? (checked ? "Activo" : "Inactivo") : value,
        }));
    };

    // --- SELECCIONAR CATEGORÍA ---
    const handleCategoriaSeleccionada = (categoria) => {
        setFormulario(prev => ({ ...prev, categoriaId: categoria.id }));
        setNombreCategoriaSeleccionada(categoria.Categoria);
        setErrorCategoria(false);
        setModalCategoriaOpen(false);
    };

    // --- ELIMINAR IMAGEN EXISTENTE ---
    const handleEliminarImagenExistente = (imgId) => {
        setImagenesExistentes(prev => prev.filter(img => img.id !== imgId));
        setImagenesAEliminarIds(prev => [...prev, imgId]);
        mostraAlertaOk("Imagen marcada para eliminación. Guarda los cambios para aplicar.");
    };

    // --- VALIDAR ---
    const validar = () => {
        const nombreErr = !regexNombre.test(formulario.nombre);
        const categoriaErr = !formulario.categoriaId;
        setErrorNombre(nombreErr);
        setErrorCategoria(categoriaErr);

        if (nombreErr || categoriaErr) {
            mostraAlertaError("Existen errores en el formulario. Por favor corrígelos.");
            return false;
        }
        if (!formulario.nombre.trim()) { mostraAlertaWarning("El nombre es obligatorio."); return false; }
        if (!formulario.categoriaId) { mostraAlertaWarning("Debe seleccionar una categoría."); return false; }
        if (!esEdicion && nuevasImagenes.length === 0) {
            mostraAlertaWarning("Debe adjuntar al menos una imagen del producto.");
            return false;
        }
        if (esEdicion && imagenesExistentes.length === 0 && nuevasImagenes.length === 0) {
            mostraAlertaWarning("Debe haber al menos una imagen del producto.");
            return false;
        }
        return true;
    };

    // --- GUARDAR O ACTUALIZAR ---
    const handleGuardar = async () => {
        if (!validar()) return;

        const formData = new FormData();
        formData.append("nombre", formulario.nombre);
        formData.append("descripcion", formulario.descripcion);
        formData.append("sku", formulario.sku);
        formData.append("estado", formulario.estado);
        formData.append("categoriaId", formulario.categoriaId);
        nuevasImagenes.forEach(file => formData.append("imagenes", file));
        if (esEdicion && imagenesAEliminarIds.length > 0) {
            formData.append("imagenesAEliminar", JSON.stringify(imagenesAEliminarIds));
        }

        try {
            AxiosImagen.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            if (esEdicion) {
                await AxiosImagen.put(ProductosEditar + productoId, formData);
                mostraAlertaOk("Producto actualizado correctamente.");
                navigate("/app/productos/listado");
            } else {
                await AxiosImagen.post(ProductosGuardar, formData);
                mostraAlertaOk("Producto guardado correctamente.");
                limpiar();
            }
        } catch (error) {
            mostraAlertaError(error.response?.data?.error || "Error al guardar el producto.");
        }
    };

    // --- LIMPIAR (solo creación) ---
    const limpiar = () => {
        setFormulario({ nombre: "", descripcion: "", sku: "", estado: "Activo", categoriaId: null });
        setNuevasImagenes([]);
        setDropzoneKey(Date.now());
        setNombreCategoriaSeleccionada("");
        setErrorNombre(false);
        setErrorCategoria(false);
    };

    const refrescarCategorias = () => ActualizarLista(CategoriaListar, setListaCategorias);

    // --- BOTONES ---
    const BotonesAccion = () => (
        <>
            <button type="button" className={`btn ${esEdicion ? "btn-warning" : "btn-success"} mr-2`} onClick={handleGuardar}>
                <i className={`fas ${esEdicion ? "fa-pen" : "fa-save"} mx-1`} />
                {esEdicion ? "Actualizar" : "Guardar"}
            </button>
            {esEdicion ? (
                <button type="button" className="btn btn-secondary" onClick={() => navigate("/app/productos/listado")}>
                    <i className="fas fa-times mx-1" /> Cancelar
                </button>
            ) : (
                <button type="button" className="btn btn-warning" onClick={limpiar}>
                    <i className="fas fa-broom mx-1" /> Limpiar
                </button>
            )}
        </>
    );

    if (cargando) {
        return (
            <Page datos={pageDatos}>
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 200 }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="sr-only">Cargando...</span>
                    </div>
                </div>
            </Page>
        );
    }

    return (
        <Page datos={pageDatos}>
            <div className="row">
                <div className="col-12">
                    <Card titulo="Datos del producto" pie={<BotonesAccion />}>
                        <form onSubmit={e => e.preventDefault()}>

                            {/* --- NOMBRE Y SKU --- */}
                            <div className="row">
                                <div className="col-md-8 col-sm-12">
                                    <div className="form-group">
                                        <label htmlFor="nombre">Nombre del producto</label>
                                        <input
                                            type="text"
                                            id="nombre"
                                            name="nombre"
                                            className={`form-control ${errorNombre ? "is-invalid" : ""}`}
                                            placeholder="Ej: Amoxicilina 500mg..."
                                            value={formulario.nombre}
                                            onChange={manejador}
                                        />
                                        {errorNombre && <div className="invalid-feedback">Ingrese un nombre válido (mín. 3 caracteres).</div>}
                                    </div>
                                </div>
                                <div className="col-md-4 col-sm-12">
                                    <div className="form-group">
                                        <label htmlFor="sku">SKU</label>
                                        <input
                                            type="text"
                                            id="sku"
                                            name="sku"
                                            className="form-control"
                                            placeholder="Ej: AMX-500"
                                            value={formulario.sku}
                                            onChange={manejador}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* --- DESCRIPCIÓN --- */}
                            <div className="row">
                                <div className="col-12">
                                    <div className="form-group">
                                        <label htmlFor="descripcion">Descripción</label>
                                        <textarea
                                            id="descripcion"
                                            name="descripcion"
                                            className="form-control"
                                            placeholder="Descripción del producto..."
                                            rows={3}
                                            value={formulario.descripcion}
                                            onChange={manejador}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* --- CATEGORÍA Y ESTADO --- */}
                            <div className="row">
                                <div className="col-md-8 col-sm-12">
                                    <div className="form-group">
                                        <label>Categoría</label>
                                        <div className="input-group">
                                            <input
                                                type="text"
                                                className={`form-control ${errorCategoria ? "is-invalid" : ""}`}
                                                value={nombreCategoriaSeleccionada || "Ninguna categoría seleccionada"}
                                                readOnly
                                            />
                                            <div className="input-group-append">
                                                <button
                                                    className="btn btn-outline-primary"
                                                    type="button"
                                                    onClick={() => setModalCategoriaOpen(true)}
                                                >
                                                    <i className="fas fa-search" />
                                                </button>
                                            </div>
                                            {errorCategoria && (
                                                <div className="invalid-feedback" style={{ display: "block" }}>
                                                    Debe seleccionar una categoría.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4 col-sm-12">
                                    <div className="form-group">
                                        <label>Estado</label>
                                        <div className="custom-control custom-switch custom-switch-off-danger custom-switch-on-success">
                                            <input
                                                type="checkbox"
                                                className="custom-control-input"
                                                id="estadoSwitch"
                                                name="estado"
                                                checked={formulario.estado === "Activo"}
                                                onChange={manejador}
                                            />
                                            <label className="custom-control-label" htmlFor="estadoSwitch">
                                                {formulario.estado}
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* --- IMÁGENES --- */}
                            <h5 className="mt-4">Imágenes del producto</h5>
                            <hr />

                            {/* --- IMÁGENES EXISTENTES (solo edición) --- */}
                            {esEdicion && imagenesExistentes.length > 0 && (
                                <>
                                    <h6>Imágenes actuales</h6>
                                    <div className="d-flex flex-wrap gap-2 mb-3">
                                        {imagenesExistentes.map(img => (
                                            <div key={img.id} className="position-relative" style={{ width: 110 }}>
                                                <img
                                                    src={img.url}
                                                    alt="Imagen producto"
                                                    className="img-thumbnail"
                                                    style={{ width: "100%", height: 90, objectFit: "cover" }}
                                                    onError={e => { e.target.onerror = null; e.target.src = "/producto_default.jpg"; }}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-danger btn-sm position-absolute"
                                                    style={{
                                                        top: 4, right: 4, borderRadius: "50%",
                                                        width: 24, height: 24, padding: 0,
                                                        display: "flex", alignItems: "center",
                                                        justifyContent: "center", fontSize: ".7rem",
                                                    }}
                                                    title="Eliminar imagen"
                                                    onClick={() => handleEliminarImagenExistente(img.id)}
                                                >
                                                    ✖
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* --- DROPZONE NUEVAS IMÁGENES --- */}
                            <h6>{esEdicion ? "Añadir nuevas imágenes" : "Imágenes"}</h6>
                            <div className="row mb-3">
                                <div className="col-12">
                                    <div className="form-group">
                                        <Dropzone key={dropzoneKey} max={5} files={nuevasImagenes} setFiles={setNuevasImagenes} />
                                    </div>
                                </div>
                            </div>

                        </form>
                    </Card>
                </div>
            </div>

            {/* --- MODAL SELECTOR DE CATEGORÍA --- */}
            {modalCategoriaOpen && (
                <CategoriaSelectorModal
                    categorias={listaCategorias}
                    setListaCategorias={setListaCategorias}
                    categoriaSeleccionadaId={formulario.categoriaId}
                    onSeleccionar={handleCategoriaSeleccionada}
                    onCerrar={() => setModalCategoriaOpen(false)}
                    token={token}
                    onCategoriaCreada={refrescarCategorias}
                    ActualizarLista={ActualizarLista}
                />
            )}
        </Page>
    );
};


/* ─────────────────────────────────────────────
   CATEGORÍA SELECTOR MODAL
───────────────────────────────────────────── */
const CategoriaSelectorModal = ({
    categorias, setListaCategorias, categoriaSeleccionadaId,
    onSeleccionar, onCerrar, token, onCategoriaCreada, ActualizarLista
}) => {
    const [busqueda, setBusqueda] = useState("");
    const [mostrarInactivos, setMostrarInactivos] = useState(false);
    const [modalFormOpen, setModalFormOpen] = useState(false);
    const [categoriaEditando, setCategoriaEditando] = useState(null);

    const abrirEditar = (e, categoria) => { e.stopPropagation(); setCategoriaEditando(categoria); setModalFormOpen(true); };
    const abrirCrear = () => { setCategoriaEditando(null); setModalFormOpen(true); };

    const categoriasFiltradas = categorias.filter(c => {
        const coincideEstado = mostrarInactivos ? c.estado === "Inactivo" : c.estado === "Activo";
        const coincideBusqueda = c.Categoria.toLowerCase().includes(busqueda.toLowerCase());
        return coincideEstado && coincideBusqueda;
    });

    return (
        <>

            <div className="csm-overlay" onClick={onCerrar}>
                <div className="csm-dialog" onClick={e => e.stopPropagation()}>

                    <div className="csm-handle"><div className="csm-handle-bar" /></div>

                    <div className="csm-header">
                        <h5><i className="fas fa-list" /> Seleccionar categoría</h5>
                        <button className="csm-close" onClick={onCerrar}>&times;</button>
                    </div>

                    <div className="csm-toolbar">
                        <div className="csm-search">
                            <i className="fas fa-search" />
                            <input
                                type="text"
                                placeholder="Buscar categoría por nombre..."
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="csm-toolbar-row2">
                            <label className="csm-toggle-wrap">
                                <div className="csm-toggle-pill">
                                    <input type="checkbox" checked={mostrarInactivos} onChange={e => setMostrarInactivos(e.target.checked)} />
                                    <span className="csm-toggle-track" />
                                </div>
                                Inactivos
                            </label>
                            <button className="csm-btn-nueva" onClick={abrirCrear}>
                                <i className="fas fa-plus" /> Nueva categoría
                            </button>
                        </div>
                    </div>

                    <div className="csm-count">
                        {categoriasFiltradas.length} categoría{categoriasFiltradas.length !== 1 ? "s" : ""}{" "}
                        {mostrarInactivos ? "inactiva(s)" : "activa(s)"}
                    </div>

                    <div className="csm-body">
                        {categoriasFiltradas.length === 0 ? (
                            <div className="csm-empty">
                                <i className="fas fa-list" />
                                <span>No hay categorías {mostrarInactivos ? "inactivas" : "activas"} registradas</span>
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-2 mt-2">
                                {categoriasFiltradas.map(categoria => {
                                    const esInactiva = categoria.estado === "Inactivo";
                                    const esSeleccionada = categoriaSeleccionadaId === categoria.id;
                                    return (
                                        <div
                                            key={categoria.id}
                                            className={`csm-card${esSeleccionada ? " selected" : ""}${esInactiva ? " inactive" : ""}`}
                                            onClick={() => !esInactiva && onSeleccionar(categoria)}
                                            style={{ cursor: esInactiva ? "default" : "pointer" }}
                                        >
                                            <div className="csm-card-inner">
                                                <div className="csm-card-img">
                                                    <img
                                                        src={ImagenCategorias + categoria.imagen}
                                                        alt={categoria.Categoria}
                                                        onError={e => { e.target.onerror = null; e.target.src = "/categoria_default.jpeg"; }}
                                                    />
                                                </div>
                                                <div className="csm-card-info">
                                                    <div className="csm-card-nombre">{categoria.Categoria}</div>
                                                    <div className="csm-card-desc">{categoria.Descripcion}</div>
                                                    <span className={`csm-card-badge badge ${esInactiva ? "bg-secondary" : "bg-success"}`}>
                                                        {categoria.estado}
                                                    </span>
                                                </div>
                                                <div className="csm-card-actions">
                                                    {!esInactiva && (
                                                        <button className="csm-btn-sel" onClick={e => { e.stopPropagation(); onSeleccionar(categoria); }}>
                                                            {esSeleccionada
                                                                ? <><i className="fas fa-check" /><span className="csm-btn-sel-text mx-1">Seleccionada</span></>
                                                                : <><i className="fas fa-hand-pointer" /><span className="csm-btn-sel-text mx-1">Seleccionar</span></>
                                                            }
                                                        </button>
                                                    )}
                                                    <button className="csm-btn-edit" onClick={e => abrirEditar(e, categoria)} title="Editar categoría">
                                                        <i className="fas fa-edit" />
                                                    </button>
                                                    <div onClick={e => e.stopPropagation()}>
                                                        <EliminarCategoria
                                                            datos={categoria}
                                                            token={token}
                                                            setListaCategorias={setListaCategorias}
                                                            ActualizarLista={ActualizarLista}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ModalFormularioCategoria
                isOpen={modalFormOpen}
                setIsOpen={setModalFormOpen}
                datos={categoriaEditando}
                onGuardado={onCategoriaCreada}
                token={token}
            />
        </>
    );
};

export default GuardarProducto;