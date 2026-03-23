// --- IMPORTACIONES ---
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    mostraAlertaError,
    mostraAlertaOk,
    mostraAlertaWarning,
} from "../../componentes/alerts/sweetAlert";
import { AxiosPrivado } from "../../componentes/axios/Axios";
import Card from "../../componentes/contenedores/Card";
import Page from "../../componentes/plantilla/Page";
import SelectInput from "../../componentes/inputs/Select";
import {
    SalidaGuardar,
    SalidaSimular,
    SalidaListar,
    ImagenProductos,
} from "../../configuracion/apiUrls";
import { useContextUsuario } from "../../contexto/usuario/UsuarioContext";
import "../styles/styles.css";

const LIMITE_ENVIADAS = 5000;

const GuardarSalida = () => {
    const { token, usuario, listaProductos, listaSucursales, listaSalida } = useContextUsuario();
    const navigate = useNavigate();

    const esJefeBodega = usuario?.tipoUsuario === "Jefe de bodega";

    const [sucursalDestinoId, setSucursalDestinoId] = useState("");
    const [cantidad, setCantidad] = useState("");
    const [simulando, setSimulando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [detalleGrid, setDetalleGrid] = useState([]);
    const [modalProductoOpen, setModalProductoOpen] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [busquedaProducto, setBusquedaProducto] = useState("");

    const pageDatos = {
        titulo: {
            titulo: "Nueva salida de inventario",
            url: "/app/salidas/inicio",
            tituloUrl: "Inicio",
            nombreUrl: "Nueva salida",
        },
    };



    useEffect(() => {
        document.body.style.overflow = modalProductoOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [modalProductoOpen]);

    // --- SUCURSALES DESTINO ---
    const sucursalesDestino = useMemo(() =>
        listaSucursales.filter(s =>
            s.estado === "Activo" && s.id !== usuario?.sucursalId
        ), [listaSucursales, usuario]);

    const opcionesSucursalesDestino = useMemo(() => [
        { value: "", label: "Seleccione una sucursal..." },
        ...sucursalesDestino.map(s => ({ value: String(s.id), label: s.nombre }))
    ], [sucursalesDestino]);

    // --- TOTAL EN ENVIADAS PARA SUCURSAL DESTINO ---
    const totalEnviadasDestino = useMemo(() => {
        if (!sucursalDestinoId) return 0;
        return listaSalida
            .filter(s =>
                s.sucursalDestinoId === Number(sucursalDestinoId) &&
                s.estado === "Enviada a sucursal"
            )
            .reduce((sum, s) => sum + parseFloat(s.totalCosto || 0), 0);
    }, [sucursalDestinoId, listaSalida]);

    const margenDisponible = LIMITE_ENVIADAS - totalEnviadasDestino;

    // --- TOTAL COSTO GRID ACTUAL ---
    const totalCostoGrid = useMemo(() =>
        detalleGrid.reduce((sum, item) =>
            sum + item.lotes.reduce((s, l) => s + parseFloat(l.costoTotalLinea), 0), 0
        ), [detalleGrid]);

    // --- TOTAL PROYECTADO (enviadas destino + grid actual) ---
    const totalProyectado = totalEnviadasDestino + totalCostoGrid;
    const superaLimite = totalProyectado > LIMITE_ENVIADAS;

    // --- PRODUCTOS FILTRADOS ---
    const productosFiltrados = useMemo(() =>
        listaProductos.filter(p =>
            p.estado === "Activo" && (
                busquedaProducto === "" ||
                p.nombre?.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
                p.sku?.toLowerCase().includes(busquedaProducto.toLowerCase())
            )
        ), [listaProductos, busquedaProducto]);

    // --- SIMULAR Y AGREGAR AL GRID ---
    const handleAgregar = async () => {
        if (!sucursalDestinoId) return mostraAlertaWarning("Seleccione una sucursal destino.");
        if (!productoSeleccionado) return mostraAlertaWarning("Seleccione un producto.");
        if (!cantidad || Number(cantidad) <= 0) return mostraAlertaWarning("Ingrese una cantidad válida.");

        const yaExiste = detalleGrid.find(d => d.productoId === productoSeleccionado.id);
        if (yaExiste) return mostraAlertaWarning("Este producto ya está en el listado. Elimínalo primero si deseas cambiar la cantidad.");

        setSimulando(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await AxiosPrivado.post(SalidaSimular, {
                sucursalOrigenId: usuario.sucursalId,
                productoId: productoSeleccionado.id,
                cantidad: Number(cantidad),
            }, config);

            // --- VALIDAR QUE EL COSTO DEL NUEVO ITEM NO SUPERE EL LÍMITE ---
            const costoNuevoItem = data.lotes.reduce((s, l) => s + parseFloat(l.costoTotalLinea), 0);
            const totalConNuevoItem = totalEnviadasDestino + totalCostoGrid + costoNuevoItem;

            if (totalConNuevoItem > LIMITE_ENVIADAS) {
                mostraAlertaError(
                    `No se puede agregar este producto. El costo total proyectado sería L. ${totalConNuevoItem.toFixed(2)}, ` +
                    `lo que supera el límite de L. ${LIMITE_ENVIADAS.toFixed(2)} para la sucursal destino. ` +
                    `Margen disponible: L. ${(LIMITE_ENVIADAS - totalEnviadasDestino - totalCostoGrid).toFixed(2)}.`
                );
                return;
            }

            setDetalleGrid(prev => [...prev, {
                productoId: productoSeleccionado.id,
                nombre: productoSeleccionado.nombre,
                sku: productoSeleccionado.sku,
                imagen: productoSeleccionado.ImagenProductos?.[0]?.imagen,
                cantidadTotal: data.cantidadAsignada,
                lotes: data.lotes,
            }]);

            setProductoSeleccionado(null);
            setCantidad("");
        } catch (error) {
            const mensajeBase = error.response?.data?.errors?.[0]?.msg
                || error.response?.data?.error
                || "Error al verificar el inventario.";
            const inventarioActual = error.response?.data?.inventarioActual;
            mostraAlertaError(
                inventarioActual !== undefined
                    ? `${mensajeBase} Existencia actual en esta sucursal: ${inventarioActual} unidades.`
                    : mensajeBase
            );
        } finally {
            setSimulando(false);
        }
    };

    // --- QUITAR DEL GRID ---
    const handleQuitarItem = (productoId) => {
        setDetalleGrid(prev => prev.filter(d => d.productoId !== productoId));
    };

    // --- REGISTRAR SALIDA ---
    const handleRegistrar = async () => {
        if (!sucursalDestinoId) return mostraAlertaWarning("Seleccione una sucursal destino.");
        if (detalleGrid.length === 0) return mostraAlertaWarning("Agregue al menos un producto al listado.");
        if (superaLimite) return mostraAlertaError(`El costo total supera el límite de L. ${LIMITE_ENVIADAS.toFixed(2)} para la sucursal destino.`);

        const detalles = detalleGrid.flatMap(item =>
            item.lotes.map(lote => ({
                loteId: lote.loteId,
                cantidad: lote.cantidadTomada,
                costoHistorico: Number(lote.costoUnitario),
            }))
        );

        setGuardando(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await AxiosPrivado.post(SalidaGuardar, {
                sucursalOrigenId: usuario.sucursalId,
                sucursalDestinoId: Number(sucursalDestinoId),
                detalles,
            }, config);

            mostraAlertaOk("Salida registrada correctamente.");
            navigate("/app/salidas/inicio");
        } catch (error) {
            mostraAlertaError(error.response?.data?.error || "Error al registrar la salida.");
        } finally {
            setGuardando(false);
        }
    };

    if (!esJefeBodega) {
        return (
            <Page datos={pageDatos}>
                <div className="alert alert-danger d-flex align-items-center gap-2">
                    <i className="fas fa-ban fa-lg mr-2" />
                    <strong>Acceso denegado.</strong>&nbsp;Solo los Jefes de Bodega pueden realizar salidas de inventario.
                </div>
            </Page>
        );
    }

    if (!usuario?.sucursalId) {
        return (
            <Page datos={pageDatos}>
                <div className="alert alert-warning d-flex align-items-center gap-2">
                    <i className="fas fa-exclamation-triangle fa-lg mr-2" />
                    Tu usuario no tiene una sucursal asignada. Contacta al administrador.
                </div>
            </Page>
        );
    }

    return (
        <Page datos={pageDatos}>
            {/* ── Encabezado ── */}
            <Card titulo="Datos de la salida">
                <div className="row">
                    <div className="col-md-6 col-sm-12">
                        <div className="form-group">
                            <label>Sucursal origen</label>
                            <input
                                type="text"
                                className="form-control"
                                value={listaSucursales.find(s => s.id === usuario.sucursalId)?.nombre || `Sucursal #${usuario.sucursalId}`}
                                readOnly
                            />
                        </div>
                    </div>
                    <div className="col-md-6 col-sm-12">
                        <div className="form-group mb-0">
                            <label>Sucursal destino <span className="text-danger">*</span></label>
                            <SelectInput
                                options={opcionesSucursalesDestino}
                                value={sucursalDestinoId}
                                onChange={(v) => {
                                    setSucursalDestinoId(v || "");
                                    setDetalleGrid([]);
                                }}
                                placeholder="Seleccione una sucursal..."
                                isClearable={true}
                            />

                            {/* Indicador de capacidad de la sucursal destino */}
                            {sucursalDestinoId && (
                                <div className="gs-limite-bar-wrap mt-2">
                                    {(() => {
                                        const porcentaje = Math.min((totalEnviadasDestino / LIMITE_ENVIADAS) * 100, 100);
                                        const color = porcentaje >= 100 ? "#dc2626" : porcentaje >= 75 ? "#d97706" : "#16a34a";
                                        const claseAlerta = porcentaje >= 100 ? "alert-danger" : porcentaje >= 75 ? "alert-warning" : "alert-success";
                                        return (
                                            <div className={`alert ${claseAlerta} py-2 px-3 mb-0`} style={{ fontSize: ".82rem" }}>
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <span>
                                                        <i className={`fas ${porcentaje >= 100 ? "fa-times-circle" : porcentaje >= 75 ? "fa-exclamation-triangle" : "fa-check-circle"} mr-1`} />
                                                        Salidas pendientes en destino: <strong>L. {totalEnviadasDestino.toFixed(2)}</strong> / L. {LIMITE_ENVIADAS.toFixed(2)}
                                                    </span>
                                                    <strong>{porcentaje.toFixed(0)}%</strong>
                                                </div>
                                                <div className="gs-limite-bar-bg">
                                                    <div className="gs-limite-bar-fill" style={{ width: `${porcentaje}%`, background: color }} />
                                                </div>
                                                {porcentaje < 100 && (
                                                    <div className="mt-1">Margen disponible: <strong>L. {margenDisponible.toFixed(2)}</strong></div>
                                                )}
                                                {porcentaje >= 100 && (
                                                    <div className="mt-1 font-weight-bold">Esta sucursal no puede recibir más envíos hasta recibir los pendientes.</div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* ── Agregar producto ── */}
            <Card titulo="Agregar producto">
                <div className="row align-items-end">
                    <div className="col-md-6 col-sm-12">
                        <div className="form-group mb-0">
                            <label>Producto <span className="text-danger">*</span></label>
                            <button
                                type="button"
                                className={`gs-producto-btn ${productoSeleccionado ? "seleccionado" : ""}`}
                                onClick={() => setModalProductoOpen(true)}
                                disabled={!sucursalDestinoId || totalEnviadasDestino >= LIMITE_ENVIADAS}
                            >
                                {productoSeleccionado ? (
                                    <>
                                        <img
                                            src={ImagenProductos + (productoSeleccionado.ImagenProductos?.[0]?.imagen || "producto_default.jpeg")}
                                            alt={productoSeleccionado.nombre}
                                            onError={e => { e.target.onerror = null; e.target.src = "/producto_default.jpeg"; }}
                                        />
                                        <span className="gs-producto-nombre">{productoSeleccionado.nombre}</span>
                                        {productoSeleccionado.sku && <span className="gs-producto-sku">{productoSeleccionado.sku}</span>}
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-search" style={{ color: "#94a3b8" }} />
                                        <span style={{ color: "#94a3b8" }}>
                                            {!sucursalDestinoId
                                                ? "Primero seleccione la sucursal destino..."
                                                : totalEnviadasDestino >= LIMITE_ENVIADAS
                                                    ? "Sucursal destino sin capacidad disponible"
                                                    : "Seleccionar producto..."
                                            }
                                        </span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="col-md-3 col-sm-12">
                        <div className="form-group mb-0">
                            <label>Cantidad <span className="text-danger">*</span></label>
                            <input
                                type="number"
                                className="form-control"
                                placeholder="Ej: 50"
                                min={1}
                                value={cantidad}
                                onChange={e => setCantidad(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleAgregar()}
                                disabled={!sucursalDestinoId || totalEnviadasDestino >= LIMITE_ENVIADAS}
                            />
                        </div>
                    </div>
                    <div className="col-md-3 col-sm-12">
                        <button
                            type="button"
                            className="btn btn-primary w-100"
                            onClick={handleAgregar}
                            disabled={simulando || !sucursalDestinoId || totalEnviadasDestino >= LIMITE_ENVIADAS}
                        >
                            {simulando
                                ? <><i className="fas fa-spinner fa-spin mr-1" /> Verificando...</>
                                : <><i className="fas fa-plus mr-1" /> Agregar</>
                            }
                        </button>
                    </div>
                </div>
            </Card>

            {/* ── Grid ── */}
            <Card
                titulo={`Detalle de salida (${detalleGrid.length} producto${detalleGrid.length !== 1 ? "s" : ""})`}
                pie={
                    <div className="d-flex justify-content-between align-items-center w-100">
                        <button type="button" className="btn btn-secondary" onClick={() => navigate("/app/salidas/inicio")}>
                            <i className="fas fa-times mr-1" /> Cancelar
                        </button>
                        <button
                            className="gs-btn-registrar"
                            onClick={handleRegistrar}
                            disabled={guardando || detalleGrid.length === 0 || !sucursalDestinoId || superaLimite}
                            title={superaLimite ? `El costo total supera el límite de L. ${LIMITE_ENVIADAS.toFixed(2)}` : ""}
                        >
                            {guardando
                                ? <><i className="fas fa-spinner fa-spin" /> Registrando...</>
                                : <><i className="fas fa-paper-plane" /> Registrar salida</>
                            }
                        </button>
                    </div>
                }
            >
                {detalleGrid.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                        <i className="fas fa-inbox fa-2x mb-3 d-block" style={{ color: "#e2e8f0" }} />
                        <span>Agrega productos para comenzar</span>
                    </div>
                ) : (
                    <>
                        <div className="gs-grid-wrap">
                            <table className="gs-grid">
                                <thead>
                                    <tr>
                                        <th>Imagen</th>
                                        <th>ID</th>
                                        <th>Producto</th>
                                        <th>SKU</th>
                                        <th>Lote</th>
                                        <th>Fecha venc.</th>
                                        <th>Cantidad</th>
                                        <th>Costo unit.</th>
                                        <th>Subtotal</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detalleGrid.map(item =>
                                        item.lotes.map((lote, idx) => (
                                            <tr key={`${item.productoId}-${lote.loteId}`}>
                                                {idx === 0 && (
                                                    <td rowSpan={item.lotes.length}>
                                                        <img
                                                            className="gs-grid-img"
                                                            src={ImagenProductos + (item.imagen || "producto_default.jpeg")}
                                                            alt={item.nombre}
                                                            onError={e => { e.target.onerror = null; e.target.src = "/producto_default.jpeg"; }}
                                                        />
                                                    </td>
                                                )}
                                                {idx === 0 && <td rowSpan={item.lotes.length}>{item.productoId}</td>}
                                                {idx === 0 && <td rowSpan={item.lotes.length}><strong>{item.nombre}</strong></td>}
                                                {idx === 0 && (
                                                    <td rowSpan={item.lotes.length}>
                                                        {item.sku && <span className="gs-lote-badge">{item.sku}</span>}
                                                    </td>
                                                )}
                                                <td><span className="gs-lote-badge">{lote.numeroLote}</span></td>
                                                <td>{lote.fechaVencimiento}</td>
                                                <td>{lote.cantidadTomada}</td>
                                                <td>L. {Number(lote.costoUnitario).toFixed(2)}</td>
                                                <td><strong>L. {Number(lote.costoTotalLinea).toFixed(2)}</strong></td>
                                                {idx === 0 && (
                                                    <td rowSpan={item.lotes.length}>
                                                        <button className="gs-btn-quitar" onClick={() => handleQuitarItem(item.productoId)}>
                                                            <i className="fas fa-trash" />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Totales */}
                        <div className="gs-totales">
                            <div className="gs-total-item">
                                <div className="gs-total-label">Pendiente en destino</div>
                                <div className="gs-total-valor">L. {totalEnviadasDestino.toFixed(2)}</div>
                            </div>
                            <div className="gs-total-item">
                                <div className="gs-total-label">Este envío</div>
                                <div className="gs-total-valor">L. {totalCostoGrid.toFixed(2)}</div>
                            </div>
                            <div className={`gs-total-item ${superaLimite ? "peligro" : totalProyectado / LIMITE_ENVIADAS >= 0.75 ? "advertencia" : "ok"}`}>
                                <div className="gs-total-label">Total proyectado</div>
                                <div className="gs-total-valor">L. {totalProyectado.toFixed(2)}</div>
                                <div style={{ fontSize: ".72rem", marginTop: 2, opacity: .8 }}>
                                    {superaLimite
                                        ? `⚠ Supera el límite de L. ${LIMITE_ENVIADAS.toFixed(2)}`
                                        : `Límite: L. ${LIMITE_ENVIADAS.toFixed(2)}`
                                    }
                                </div>
                            </div>
                            <div className={`gs-total-item ${margenDisponible - totalCostoGrid <= 0 ? "peligro" : "ok"}`}>
                                <div className="gs-total-label">Margen restante</div>
                                <div className="gs-total-valor">L. {Math.max(margenDisponible - totalCostoGrid, 0).toFixed(2)}</div>
                            </div>
                        </div>
                    </>
                )}
            </Card>

            {/* ── Modal selector producto ── */}
            {modalProductoOpen && (
                <div className="csm-overlay" onClick={() => setModalProductoOpen(false)}>
                    <div className="csm-dialog" onClick={e => e.stopPropagation()}>
                        <div className="csm-handle"><div className="csm-handle-bar" /></div>
                        <div className="csm-header">
                            <h5><i className="fas fa-box" /> Seleccionar producto</h5>
                            <button className="csm-close" onClick={() => setModalProductoOpen(false)}>&times;</button>
                        </div>
                        <div className="csm-toolbar">
                            <div className="csm-search">
                                <i className="fas fa-search" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o SKU..."
                                    value={busquedaProducto}
                                    onChange={e => setBusquedaProducto(e.target.value)}
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
                                    <span>No hay productos activos</span>
                                </div>
                            ) : (
                                <div className="d-flex flex-column gap-2 mt-2">
                                    {productosFiltrados.map(producto => {
                                        const esSeleccionado = productoSeleccionado?.id === producto.id;
                                        const yaEnGrid = detalleGrid.some(d => d.productoId === producto.id);
                                        return (
                                            <div
                                                key={producto.id}
                                                className={`csm-card${esSeleccionado ? " selected" : ""}${yaEnGrid ? " inactive" : ""}`}
                                                onClick={() => { if (yaEnGrid) return; setProductoSeleccionado(producto); setModalProductoOpen(false); }}
                                                style={{ cursor: yaEnGrid ? "default" : "pointer" }}
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
                                                        {yaEnGrid && <span className="badge bg-secondary" style={{ fontSize: ".62rem" }}>Ya agregado</span>}
                                                    </div>
                                                    {!yaEnGrid && (
                                                        <div className="csm-card-actions">
                                                            <button className="csm-btn-sel" onClick={e => { e.stopPropagation(); setProductoSeleccionado(producto); setModalProductoOpen(false); }}>
                                                                {esSeleccionado
                                                                    ? <><i className="fas fa-check" /><span className="csm-btn-sel-text mx-1">Seleccionado</span></>
                                                                    : <><i className="fas fa-hand-pointer" /><span className="csm-btn-sel-text mx-1">Seleccionar</span></>
                                                                }
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Page>
    );
};

export default GuardarSalida;