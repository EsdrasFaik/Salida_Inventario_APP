import { useEffect, useState } from "react";
import {
    mostraAlertaError,
    mostraAlertaOk,
    mostraAlertaPregunta,
    mostraAlertaWarning,
} from "../../../componentes/alerts/sweetAlert";
import { AxiosPrivado } from "../../../componentes/axios/Axios";
import Dropzone from "../../../componentes/imagenes/Dropzone";
import ModalButtonLess from "../../../componentes/modal/ModalButtonLess";
import {
    ImagenCategorias,
    CategoriaEliminar,
    CategoriaGuardar,
    CategoriaEditar,
    CategoriaListar,
} from "../../../configuracion/apiUrls";
import { regexNombre } from "../../../configuracion/validaciones";
import "../../styles/styles.css";

export const ModalFormularioCategoria = ({ isOpen, setIsOpen, datos, onGuardado, token }) => {
    const esEdicion = !!datos;
    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [estado, setEstado] = useState("Activo");
    const [imagen, setImagen] = useState(null);
    const [errorNombre, setErrorNombre] = useState(false);
    const [errorDescripcion, setErrorDescripcion] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setNombre(datos?.Categoria || "");
            setDescripcion(datos?.Descripcion || "");
            setEstado(datos?.estado || "Activo");
            setImagen(null);
        }
    }, [isOpen, datos]);

    useEffect(() => {
        setErrorNombre(nombre.length > 0 && !regexNombre.test(nombre));
        setErrorDescripcion(descripcion.length > 50);
    }, [nombre, descripcion]);

    const handleGuardar = async () => {
        if (!nombre || errorNombre || errorDescripcion)
            return mostraAlertaWarning("Por favor, corrige los errores en el formulario.");

        const formData = new FormData();
        formData.append("Categoria", nombre);
        formData.append("Descripcion", descripcion);
        formData.append("estado", estado);
        if (imagen) formData.append("imagen", Array.isArray(imagen) ? imagen[0] : imagen);

        try {
            AxiosPrivado.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            const config = { headers: { "Content-Type": "multipart/form-data" } };
            if (esEdicion) {
                await AxiosPrivado.put(CategoriaEditar + datos.id, formData, config);
                mostraAlertaOk("Categoría actualizada correctamente");
            } else {
                await AxiosPrivado.post(CategoriaGuardar, formData, config);
                mostraAlertaOk("Categoría guardada correctamente");
            }
            setIsOpen(false);
            onGuardado();
        } catch (error) {
            const mensajeError = error.response?.data?.errors?.[0]?.msg
                || error.response?.data?.error
                || "Error en la petición";
            mostraAlertaError(mensajeError);
        }
    };

    return (
        <>
            <ModalButtonLess
                titulo={esEdicion ? `Editando: ${datos?.Categoria}` : "Nueva categoría"}
                modalIsOpen={isOpen}
                setModalIsOpen={setIsOpen}
                size="md"
                pie={
                    <div className="d-flex justify-content-end gap-2">
                        <button className={`mcf-btn-save btn ${esEdicion ? "editar" : ""}`} onClick={handleGuardar}>
                            <i className={`fas ${esEdicion ? "fa-pen" : "fa-save"} mx-1`} />
                            {esEdicion ? "Actualizar" : "Guardar"}
                        </button>
                    </div>
                }
            >
                <div className="d-flex flex-column gap-3">
                    <div>
                        <div className="mcf-label">Nombre de la categoría</div>
                        <input
                            type="text"
                            className={`form-control ${errorNombre ? "is-invalid" : ""}`}
                            placeholder="Ej: Medicamentos, Alimentos, Bebidas..."
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                        />
                        {errorNombre && (
                            <div className="invalid-feedback">El nombre debe tener al menos 3 caracteres.</div>
                        )}
                    </div>

                    <div>
                        <div className="mcf-label">Descripción</div>
                        <textarea
                            className={`form-control ${errorDescripcion ? "is-invalid" : ""}`}
                            placeholder="Descripción de la categoría..."
                            rows={3}
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                        />
                        {errorDescripcion && (
                            <div className="invalid-feedback">La descripción no puede superar 50 caracteres.</div>
                        )}
                        <small className={`text-end d-block mt-1 ${descripcion.length > 50 ? "text-danger" : "text-muted"}`}>
                            {descripcion.length}/50
                        </small>
                    </div>

                    {esEdicion && datos?.imagen && (
                        <div>
                            <div className="mcf-label">Imagen actual</div>
                            <div className="mcf-img-preview">
                                <img
                                    src={ImagenCategorias + datos.imagen}
                                    alt={datos.Categoria}
                                    onError={(e) => { e.target.src = ImagenCategorias + "categoria_default.jpeg"; }}
                                />
                                <span className="text-muted small">{datos.imagen}</span>
                            </div>
                        </div>
                    )}

                    <div>
                        <div className="mcf-label">{esEdicion ? "Nueva imagen (opcional)" : "Imagen"}</div>
                        <Dropzone max={1} files={imagen} setFiles={setImagen} />
                    </div>

                    <div>
                        <div className="mcf-label">Estado</div>
                        <div className="mcf-estado-row">
                            <label className="mcf-toggle">
                                <input
                                    type="checkbox"
                                    checked={estado === "Activo"}
                                    onChange={(e) => setEstado(e.target.checked ? "Activo" : "Inactivo")}
                                />
                                <span className="mcf-toggle-track" />
                            </label>
                            <span className="fw-semibold" style={{ color: estado === "Activo" ? "#16a34a" : "#94a3b8" }}>
                                {estado}
                            </span>
                        </div>
                    </div>
                </div>
            </ModalButtonLess>
        </>
    );
};


// --- GALERÍA DE CATEGORÍAS ---

const ModalCategoria = ({ token, listaCategorias = [], setListaCategorias, ActualizarLista }) => {
    const [mostrarInactivos, setMostrarInactivos] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [modalFormOpen, setModalFormOpen] = useState(false);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

    useEffect(() => {
        ActualizarLista(CategoriaListar, setListaCategorias);
    }, []);

    const refrescar = () => ActualizarLista(CategoriaListar, setListaCategorias);
    const abrirCrear = () => { setCategoriaSeleccionada(null); setModalFormOpen(true); };
    const abrirEditar = (categoria) => { setCategoriaSeleccionada(categoria); setModalFormOpen(true); };

    const handleEliminar = (categoria) => {
        if (categoria.tieneRegistrosVinculados) {
            mostraAlertaError(`La categoría "${categoria.Categoria}" no se puede eliminar porque tiene registros vinculados.`);
            return;
        }
        mostraAlertaPregunta(
            async (confirmado) => {
                if (!confirmado) return;
                try {
                    await AxiosPrivado.delete(CategoriaEliminar + categoria.id, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    mostraAlertaOk("Categoría eliminada correctamente");
                    refrescar();
                } catch (error) {
                    mostraAlertaError(error.response?.data?.error || "Ocurrió un error al eliminar.");
                }
            },
            `¿Deseas eliminar la categoría "${categoria.Categoria}" de forma permanente?`,
            "warning"
        );
    };

    const categoriasFiltradas = listaCategorias.filter((c) => {
        const coincideBusqueda = c.Categoria.toLowerCase().includes(busqueda.toLowerCase());
        const coincideEstado = mostrarInactivos ? c.estado === "Inactivo" : c.estado === "Activo";
        return coincideBusqueda && coincideEstado;
    });

    return (
        <>
            <div className="gc-toolbar">
                <div className="gc-search">
                    <i className="fas fa-search" />
                    <input
                        type="text"
                        placeholder="Buscar categoría..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
                <select
                    className="gc-select"
                    value={mostrarInactivos ? "Inactivo" : "Activo"}
                    onChange={(e) => setMostrarInactivos(e.target.value === "Inactivo")}
                >
                    <option value="Activo">Activos</option>
                    <option value="Inactivo">Inactivos</option>
                </select>
                <button className="gc-btn-nueva" onClick={abrirCrear}>
                    <i className="fas fa-plus" /> Nueva categoría
                </button>
            </div>

            <div className="gc-count">
                {categoriasFiltradas.length} categoría{categoriasFiltradas.length !== 1 ? "s" : ""}{" "}
                {mostrarInactivos ? "inactiva(s)" : "activa(s)"}
            </div>

            {categoriasFiltradas.length === 0 ? (
                <div className="gc-empty">
                    <i className="fas fa-list" />
                    <span>No hay categorías {mostrarInactivos ? "inactivas" : "activas"} registradas</span>
                </div>
            ) : (
                <div className="row g-3">
                    {categoriasFiltradas.map((categoria) => (
                        <div className="col-6 col-sm-4 col-md-3" key={categoria.id}>
                            <div className="gc-card">
                                <div className="gc-card-img">
                                    <img
                                        src={ImagenCategorias + categoria.imagen}
                                        alt={categoria.Categoria}
                                        onError={(e) => { e.target.src = ImagenCategorias + "categoria_default.jpeg"; }}
                                    />
                                </div>
                                <div className="gc-card-body">
                                    <div className="gc-card-nombre" title={categoria.Categoria}>{categoria.Categoria}</div>
                                    <div className="gc-card-desc" title={categoria.Descripcion}>{categoria.Descripcion}</div>
                                    <span className={`gc-badge badge ${categoria.estado === "Activo" ? "bg-success" : "bg-secondary"}`}>
                                        {categoria.estado}
                                    </span>
                                    <div className="gc-card-actions">
                                        <button className="gc-btn-editar" onClick={() => abrirEditar(categoria)}>
                                            <i className="fas fa-edit me-1" /> Editar
                                        </button>
                                        <button className="gc-btn-eliminar" onClick={() => handleEliminar(categoria)} title="Eliminar">
                                            <i className="fas fa-trash" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ModalFormularioCategoria
                isOpen={modalFormOpen}
                setIsOpen={setModalFormOpen}
                datos={categoriaSeleccionada}
                onGuardado={refrescar}
                token={token}
            />
        </>
    );
};

export default ModalCategoria;