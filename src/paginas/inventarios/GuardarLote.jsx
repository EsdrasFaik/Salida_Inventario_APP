// --- IMPORTACIONES ---
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    mostraAlertaError,
    mostraAlertaOk,
    mostraAlertaWarning,
} from "../../componentes/alerts/sweetAlert";
import { AxiosPrivado } from "../../componentes/axios/Axios";
import Card from "../../componentes/contenedores/Card";
import Page from "../../componentes/plantilla/Page";
import DatePicker from "../../componentes/inputs/DatePicker";
import {
    LotesGuardar,
    LotesBuscar,
    LotesEditar,
    ImagenProductos,
} from "../../configuracion/apiUrls";
import { useContextUsuario } from "../../contexto/usuario/UsuarioContext";
import "../styles/styles.css";

const GuardarLote = () => {
    const { token, usuario, listaProductos, listaSucursales, ActualizarLista, setListaLotes } = useContextUsuario();
    const navigate = useNavigate();
    const location = useLocation();
    const loteId = new URLSearchParams(location.search).get("id");
    const esEdicion = !!loteId;

    const [cargando, setCargando] = useState(esEdicion);
    const [modalProductoOpen, setModalProductoOpen] = useState(false);
    const [nombreProductoSeleccionado, setNombreProductoSeleccionado] = useState("");

    const [formulario, setFormulario] = useState({
        numeroLote: "",
        fechaVencimiento: "",
        cantidadActual: 0,
        costoUnitario: "",
        estado: "Activo",
        productoId: null,
    });

    const [errorNumeroLote, setErrorNumeroLote] = useState(false);
    const [errorFechaVencimiento, setErrorFechaVencimiento] = useState(false);
    const [errorCantidad, setErrorCantidad] = useState(false);
    const [errorCosto, setErrorCosto] = useState(false);
    const [errorProducto, setErrorProducto] = useState(false);

    const pageDatos = {
        titulo: {
            titulo: esEdicion ? "Editar lote" : "Nuevo lote",
            url: "/app/lotes/inicio",
            tituloUrl: "inicio",
            nombreUrl: esEdicion ? "editar" : "nuevo",
        },
    };

    // --- EFECTOS ---
    useEffect(() => {
        if (esEdicion) cargarLote();
    }, [token]);

    useEffect(() => {
        document.body.style.overflow = modalProductoOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [modalProductoOpen]);

    useEffect(() => {
        setErrorNumeroLote(formulario.numeroLote.length > 0 && formulario.numeroLote.trim().length < 2);
        setErrorFechaVencimiento(formulario.fechaVencimiento !== "" && formulario.fechaVencimiento < new Date().toISOString().split("T")[0]);
        setErrorCantidad(formulario.cantidadActual !== "" && (isNaN(formulario.cantidadActual) || Number(formulario.cantidadActual) < 0));
        setErrorCosto(formulario.costoUnitario !== "" && (isNaN(formulario.costoUnitario) || Number(formulario.costoUnitario) <= 0));
        setErrorProducto(!formulario.productoId);
    }, [formulario]);

    // --- CARGAR LOTE (solo edición) ---
    const cargarLote = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await AxiosPrivado.get(LotesBuscar + loteId, config);

            // ← Eliminar el sufijo " - Nombre Sucursal" antes de mostrar en el form
            const sucursalNombre = listaSucursales.find(s => s.id === data.sucursalId)?.nombre || "";
            const numeroLoteSinSufijo = sucursalNombre
                ? data.numeroLote.replace(` - ${sucursalNombre}`, "").trim()
                : data.numeroLote;

            setFormulario({
                numeroLote: numeroLoteSinSufijo, // ← sin sufijo
                fechaVencimiento: data.fechaVencimiento || "",
                cantidadActual: data.cantidadActual ?? 0,
                costoUnitario: data.costoUnitario || "",
                estado: data.estado || "Activo",
                productoId: data.productoId || null,
            });
            setNombreProductoSeleccionado(data.Producto?.nombre || "");
        } catch (error) {
            mostraAlertaError(error.response?.data?.error || "Error al cargar el lote.");
        } finally {
            setCargando(false);
        }
    };

    // --- MANEJADOR ---
    const manejador = (e) => {
        const { name, value, type, checked } = e.target;
        setFormulario(prev => ({
            ...prev,
            [name]: type === "checkbox" ? (checked ? "Activo" : "Inactivo") : value,
        }));
    };

    // --- SELECCIONAR PRODUCTO ---
    const handleProductoSeleccionado = (producto) => {
        setFormulario(prev => ({ ...prev, productoId: producto.id }));
        setNombreProductoSeleccionado(producto.nombre);
        setErrorProducto(false);
        setModalProductoOpen(false);
    };

    // --- VALIDAR ---
    const validar = () => {
        // Verificar sucursal del usuario
        if (!usuario?.sucursalId) {
            mostraAlertaError("Tu usuario no tiene una sucursal asignada. Contacta al administrador.");
            return false;
        }

        const numeroLoteErr = !formulario.numeroLote.trim() || formulario.numeroLote.trim().length < 2;
        const fechaErr = !formulario.fechaVencimiento;
        const cantidadErr = formulario.cantidadActual === "" || isNaN(formulario.cantidadActual) || Number(formulario.cantidadActual) < 0;
        const costoErr = !formulario.costoUnitario || isNaN(formulario.costoUnitario) || Number(formulario.costoUnitario) <= 0;
        const productoErr = !formulario.productoId;

        setErrorNumeroLote(numeroLoteErr);
        setErrorFechaVencimiento(fechaErr);
        setErrorCantidad(cantidadErr);
        setErrorCosto(costoErr);
        setErrorProducto(productoErr);

        if (numeroLoteErr || fechaErr || cantidadErr || costoErr || productoErr) {
            mostraAlertaError("Existen errores en el formulario. Por favor corrígelos.");
            return false;
        }
        return true;
    };

    const handleGuardar = async () => {
        if (!validar()) return;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const payload = {
                numeroLote: formulario.numeroLote,
                fechaVencimiento: formulario.fechaVencimiento,
                cantidadActual: Number(formulario.cantidadActual),
                costoUnitario: Number(formulario.costoUnitario),
                estado: formulario.estado,
                productoId: formulario.productoId,
                sucursalId: usuario.sucursalId,
            };

            if (esEdicion) {
                await AxiosPrivado.put(LotesEditar + loteId, payload, config);
                mostraAlertaOk("Lote actualizado correctamente.");
                navigate("/app/lotes/inicio");
            } else {
                await AxiosPrivado.post(LotesGuardar, payload, config);
                mostraAlertaOk("Lote guardado correctamente.");
                limpiar();
            }
        } catch (error) {
            // El backend devuelve el mensaje de validación en errors[0].msg o en error
            const mensajeError = error.response?.data?.errors?.[0]?.msg
                || error.response?.data?.error
                || "Error al guardar el lote.";
            mostraAlertaError(mensajeError);
        }
    };

    // --- LIMPIAR ---
    const limpiar = () => {
        setFormulario({ numeroLote: "", fechaVencimiento: "", cantidadActual: 0, costoUnitario: "", estado: "Activo", productoId: null });
        setNombreProductoSeleccionado("");
        setErrorNumeroLote(false);
        setErrorFechaVencimiento(false);
        setErrorCantidad(false);
        setErrorCosto(false);
        setErrorProducto(false);
    };

    const BotonesAccion = () => (
        <>
            <button type="button" className={`btn ${esEdicion ? "btn-warning" : "btn-success"} mr-2`} onClick={handleGuardar}>
                <i className={`fas ${esEdicion ? "fa-pen" : "fa-save"} mx-1`} />
                {esEdicion ? "Actualizar" : "Guardar"}
            </button>
            {esEdicion ? (
                <button type="button" className="btn btn-secondary" onClick={() => navigate("/app/lotes/inicio")}>
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
                    <Card titulo="Datos del lote" pie={<BotonesAccion />}>
                        <form onSubmit={e => e.preventDefault()}>

                            {/* --- INFO SUCURSAL --- */}
                            <div className="alert alert-info d-flex align-items-center gap-2 mb-4" role="alert">
                                <i className="fas fa-store mr-2" />
                                <span>
                                    Sucursal asignada: <strong>{usuario?.sucursalId ? `ID ${usuario.sucursalId}` : "Sin sucursal"}</strong>
                                    {!usuario?.sucursalId && (
                                        <span className="text-danger ml-2">— No podrás guardar sin una sucursal asignada.</span>
                                    )}
                                </span>
                            </div>

                            {/* --- NÚMERO LOTE Y FECHA VENCIMIENTO --- */}
                            <h5>Datos del lote</h5>
                            <hr />
                            <div className="row">
                                <div className="col-md-6 col-sm-12">
                                    <div className="form-group">
                                        <label htmlFor="numeroLote">Número de lote</label>
                                        <input
                                            type="text"
                                            id="numeroLote"
                                            name="numeroLote"
                                            className={`form-control ${errorNumeroLote ? "is-invalid" : ""}`}
                                            placeholder="Ej: LOT-2024-001..."
                                            value={formulario.numeroLote}
                                            onChange={manejador}
                                        />
                                        {errorNumeroLote && <div className="invalid-feedback">Ingrese un número de lote válido (mín. 2 caracteres).</div>}
                                    </div>
                                </div>
                                <div className="col-md-6 col-sm-12">
                                    <div className="form-group">
                                        <label>Fecha de vencimiento</label>
                                        <DatePicker
                                            value={formulario.fechaVencimiento}
                                            onChange={(fecha) => setFormulario(prev => ({ ...prev, fechaVencimiento: fecha }))}
                                            placeholder="Seleccionar fecha..."
                                            className={errorFechaVencimiento ? "is-invalid" : ""}
                                            minDate={new Date()}
                                        />
                                        {errorFechaVencimiento && (
                                            <div className="invalid-feedback" style={{ display: "block" }}>
                                                La fecha de vencimiento no puede ser anterior a hoy.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* --- CANTIDAD Y COSTO --- */}
                            <div className="row">
                                <div className="col-md-6 col-sm-12">
                                    <div className="form-group">
                                        <label htmlFor="cantidadActual">Cantidad</label>
                                        <input
                                            type="number"
                                            id="cantidadActual"
                                            name="cantidadActual"
                                            className={`form-control ${errorCantidad ? "is-invalid" : ""}`}
                                            placeholder="Ej: 100"
                                            min={0}
                                            value={formulario.cantidadActual}
                                            onChange={manejador}
                                        />
                                        {errorCantidad && <div className="invalid-feedback">Ingrese una cantidad válida (mayor o igual a 0).</div>}
                                    </div>
                                </div>
                                <div className="col-md-6 col-sm-12">
                                    <div className="form-group">
                                        <label htmlFor="costoUnitario">Costo unitario</label>
                                        <div className="input-group">
                                            <div className="input-group-prepend">
                                                <span className="input-group-text">L.</span>
                                            </div>
                                            <input
                                                type="number"
                                                id="costoUnitario"
                                                name="costoUnitario"
                                                className={`form-control ${errorCosto ? "is-invalid" : ""}`}
                                                placeholder="Ej: 25.50"
                                                min={0}
                                                step="0.01"
                                                value={formulario.costoUnitario}
                                                onChange={manejador}
                                            />
                                            {errorCosto && <div className="invalid-feedback">Ingrese un costo válido (mayor a 0).</div>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* --- PRODUCTO Y ESTADO --- */}
                            <div className="row">
                                <div className="col-md-8 col-sm-12">
                                    <div className="form-group">
                                        <label>Producto</label>
                                        <div className="input-group">
                                            <input
                                                type="text"
                                                className={`form-control ${errorProducto ? "is-invalid" : ""}`}
                                                value={nombreProductoSeleccionado || "Ningún producto seleccionado"}
                                                readOnly
                                            />
                                            <div className="input-group-append">
                                                <button
                                                    className="btn btn-outline-primary"
                                                    type="button"
                                                    onClick={() => setModalProductoOpen(true)}
                                                >
                                                    <i className="fas fa-search" />
                                                </button>
                                            </div>
                                            {errorProducto && (
                                                <div className="invalid-feedback" style={{ display: "block" }}>
                                                    Debe seleccionar un producto.
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

                        </form>
                    </Card>
                </div>
            </div>

            {/* --- MODAL SELECTOR DE PRODUCTO --- */}
            {modalProductoOpen && (
                <ProductoSelectorModal
                    productos={listaProductos}
                    productoSeleccionadoId={formulario.productoId}
                    onSeleccionar={handleProductoSeleccionado}
                    onCerrar={() => setModalProductoOpen(false)}
                />
            )}
        </Page>
    );
};


/* ─────────────────────────────────────────────
   PRODUCTO SELECTOR MODAL
───────────────────────────────────────────── */
const ProductoSelectorModal = ({ productos, productoSeleccionadoId, onSeleccionar, onCerrar }) => {
    const [busqueda, setBusqueda] = useState("");

    const productosFiltrados = productos.filter(p => {
        const coincide =
            p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
            p.sku?.toLowerCase().includes(busqueda.toLowerCase());
        return coincide && p.estado === "Activo";
    });

    return (
        <>
            <div className="csm-overlay" onClick={onCerrar}>
                <div className="csm-dialog" onClick={e => e.stopPropagation()}>

                    <div className="csm-handle"><div className="csm-handle-bar" /></div>

                    <div className="csm-header">
                        <h5><i className="fas fa-box" /> Seleccionar producto</h5>
                        <button className="csm-close" onClick={onCerrar}>&times;</button>
                    </div>

                    <div className="csm-toolbar">
                        <div className="csm-search">
                            <i className="fas fa-search" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o SKU..."
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="csm-count">
                        {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? "s" : ""} activo{productosFiltrados.length !== 1 ? "s" : ""}
                    </div>

                    <div className="csm-body">
                        {productosFiltrados.length === 0 ? (
                            <div className="csm-empty">
                                <i className="fas fa-box-open" />
                                <span>No hay productos activos registrados</span>
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-2 mt-2">
                                {productosFiltrados.map(producto => {
                                    const esSeleccionado = productoSeleccionadoId === producto.id;
                                    return (
                                        <div
                                            key={producto.id}
                                            className={`csm-card${esSeleccionado ? " selected" : ""}`}
                                            onClick={() => onSeleccionar(producto)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <div className="csm-card-inner">
                                                <div className="csm-card-img">
                                                    <img
                                                        src={ImagenProductos + (producto.ImagenProductos?.[0]?.imagen || "producto_default.jpeg")}
                                                        alt={producto.nombre}
                                                        onError={e => { e.target.onerror = null; e.target.src = "/producto_default.jpeg"; }}
                                                    />
                                                </div>
                                                <div className="csm-card-info">
                                                    <div className="csm-card-nombre">{producto.nombre}</div>
                                                    <div className="csm-card-desc">
                                                        {producto.sku && <span className="tp-sku mr-2">{producto.sku}</span>}
                                                        {producto.CategoriaProducto?.Categoria}
                                                    </div>
                                                </div>
                                                <div className="csm-card-actions">
                                                    <button className="csm-btn-sel" onClick={e => { e.stopPropagation(); onSeleccionar(producto); }}>
                                                        {esSeleccionado
                                                            ? <><i className="fas fa-check" /><span className="csm-btn-sel-text mx-1">Seleccionado</span></>
                                                            : <><i className="fas fa-hand-pointer" /><span className="csm-btn-sel-text mx-1">Seleccionar</span></>
                                                        }
                                                    </button>
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
        </>
    );
};

export default GuardarLote;