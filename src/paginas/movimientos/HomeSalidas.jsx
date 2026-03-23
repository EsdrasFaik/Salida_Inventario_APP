// --- IMPORTACIONES ---
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../../configuracion/socket";
import {
    mostraAlertaError,
    mostraAlertaOk,
    mostraAlertaPregunta,
} from "../../componentes/alerts/sweetAlert";
import DatePicker from "../../componentes/inputs/DatePicker";
import SelectInput from "../../componentes/inputs/Select";
import { AxiosPrivado } from "../../componentes/axios/Axios";
import Card from "../../componentes/contenedores/Card";
import Page from "../../componentes/plantilla/Page";
import {
    SalidaListar,
    SalidaBuscar,
    SalidaEstado,
    SalidaEliminar,
} from "../../configuracion/apiUrls";
import { useContextUsuario } from "../../contexto/usuario/UsuarioContext";
import "../styles/styles.css";

const HomeSalidas = () => {
    const { token, usuario, listaSalida, setListaSalida, ActualizarLista, listaSucursales } = useContextUsuario();
    const navigate = useNavigate();

    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [filtroSucursalDestino, setFiltroSucursalDestino] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("");
    const [procesando, setProcesando] = useState(null);
    const [socketConectado, setSocketConectado] = useState(false);
    const [filaExpandida, setFilaExpandida] = useState(null);
    const [detallesSalida, setDetallesSalida] = useState({});
    const [cargandoDetalle, setCargandoDetalle] = useState(null);



    // --- PAGINACIÓN ---
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = useState(10);

    const esJefeBodega = usuario?.tipoUsuario === "Jefe de bodega";

    const opcionesSucursales = [
        { value: "", label: "Todas" },
        ...listaSucursales.map(s => ({ value: String(s.id), label: s.nombre }))
    ];

    const opcionesEstado = [
        { value: "", label: "Todos" },
        { value: "Enviada", label: "Enviada" },
        { value: "Recibida", label: "Recibida" },
        { value: "Anulada", label: "Anulada" },
    ];

    const opcionesPorPagina = [5, 10, 25, 50].map(n => ({ value: n, label: `${n} por página` }));


    const pageDatos = {
        titulo: {
            titulo: "Salidas de inventario",


            nombreUrl: "inicio",
        },
    };


    // --- CARGA INICIAL ---
    useEffect(() => {
        if (token) ActualizarLista(SalidaListar, setListaSalida);
    }, [token]);

    // --- WEBSOCKET ---
    useEffect(() => {
        const recargarLista = () => {
            if (token) ActualizarLista(SalidaListar, setListaSalida);
        };
        const handleConectado = () => setSocketConectado(true);
        const handleDesconectado = () => setSocketConectado(false);

        socket.on("connect", handleConectado);
        socket.on("disconnect", handleDesconectado);
        socket.on("nueva_salida", recargarLista);
        socket.on("salida_actualizada", recargarLista);
        socket.on("salida_anulada", recargarLista);

        return () => {
            socket.off("connect", handleConectado);
            socket.off("disconnect", handleDesconectado);
            socket.off("nueva_salida", recargarLista);
            socket.off("salida_actualizada", recargarLista);
            socket.off("salida_anulada", recargarLista);
        };
    }, [token]);

    // --- FILTRADO ---
    const salidasFiltradas = useMemo(() => {
        setPagina(1);
        return listaSalida.filter(s => {
            const fecha = new Date(s.createdAt);
            const coincideFechaInicio = !fechaInicio || fecha >= new Date(fechaInicio);
            const coincideFechaFin = !fechaFin || fecha <= new Date(fechaFin + "T23:59:59.999Z");
            const coincideSucursal = !filtroSucursalDestino || String(s.sucursalDestinoId) === filtroSucursalDestino;
            const coincideEstado = !filtroEstado || s.estado === filtroEstado;
            return coincideFechaInicio && coincideFechaFin && coincideSucursal && coincideEstado;
        });
    }, [listaSalida, fechaInicio, fechaFin, filtroSucursalDestino, filtroEstado]);

    // --- PAGINACIÓN ---
    const totalPaginas = Math.ceil(salidasFiltradas.length / porPagina);
    const salidasPaginadas = salidasFiltradas.slice((pagina - 1) * porPagina, pagina * porPagina);

    const cambiarPagina = (p) => {
        if (p < 1 || p > totalPaginas) return;
        setPagina(p);
    };

    // --- EXPANDIR FILA Y CARGAR DETALLE ---
    const handleExpandir = async (salida) => {
        if (filaExpandida === salida.id) {
            setFilaExpandida(null);
            return;
        }
        setFilaExpandida(salida.id);

        // Si ya tiene detalle cargado no volver a pedir
        if (detallesSalida[salida.id]) return;

        setCargandoDetalle(salida.id);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await AxiosPrivado.get(SalidaBuscar + salida.id, config);
            setDetallesSalida(prev => ({ ...prev, [salida.id]: data }));
        } catch (error) {
            const mensajeError = error.response?.data?.errors?.[0]?.msg
                || error.response?.data?.error
                || "Error al cargar el detalle de la salida.";
            mostraAlertaError(mensajeError);
            setFilaExpandida(null);
        } finally {
            setCargandoDetalle(null);
        }
    };

    // --- RECIBIR SALIDA ---
    const handleRecibir = (salida) => {
        if (salida.estado !== "Enviada") return mostraAlertaError("Solo se pueden recibir salidas en estado 'Enviada'.");
        mostraAlertaPregunta(
            async (confirmado) => {
                if (!confirmado) return;
                setProcesando(salida.id);
                try {
                    const config = { headers: { Authorization: `Bearer ${token}` } };
                    await AxiosPrivado.put(SalidaEstado + salida.id, { estado: "Recibida" }, config);
                    mostraAlertaOk("Salida recibida correctamente. El inventario fue actualizado.");
                    setDetallesSalida(prev => { const n = { ...prev }; delete n[salida.id]; return n; });
                    ActualizarLista(SalidaListar, setListaSalida);
                } catch (error) {
                    const mensajeError = error.response?.data?.errors?.[0]?.msg
                        || error.response?.data?.error
                        || "Error al recibir la salida.";
                    mostraAlertaError(mensajeError);
                } finally {
                    setProcesando(null);
                }
            },
            `¿Confirmas la recepción de la salida #${salida.id}? El inventario será acreditado a tu sucursal.`,
            "question"
        );
    };

    // --- ANULAR SALIDA ---
    const handleAnular = (salida) => {
        if (!esJefeBodega) return mostraAlertaError("Solo los Jefes de Bodega pueden anular salidas.");
        if (salida.estado === "Recibida") return mostraAlertaError("No se puede anular una salida ya recibida.");
        if (salida.estado === "Anulada") return mostraAlertaError("Esta salida ya está anulada.");

        mostraAlertaPregunta(
            async (confirmado) => {
                if (!confirmado) return;
                setProcesando(salida.id);
                try {
                    const config = { headers: { Authorization: `Bearer ${token}` } };
                    await AxiosPrivado.delete(SalidaEliminar + salida.id, config);
                    mostraAlertaOk("Salida anulada. El stock fue devuelto al origen.");
                    setDetallesSalida(prev => { const n = { ...prev }; delete n[salida.id]; return n; });
                    ActualizarLista(SalidaListar, setListaSalida);
                } catch (error) {
                    const mensajeError = error.response?.data?.errors?.[0]?.msg
                        || error.response?.data?.error
                        || "Error al anular la salida.";
                    mostraAlertaError(mensajeError);
                } finally {
                    setProcesando(null);
                }
            },
            `¿Anular la salida #${salida.id}? El stock será devuelto a la sucursal origen.`,
            "warning"
        );
    };

    const colorEstado = (estado) => {
        if (estado === "Enviada") return "bg-primary";
        if (estado === "Recibida") return "bg-success";
        if (estado === "Anulada") return "bg-danger";
        return "bg-secondary";
    };

    return (
        <Page datos={pageDatos}>

            {/* ── Filtros ── */}
            <Card titulo="Filtros">
                <div className="hs-toolbar">
                    <div className="hs-field">
                        <label>Fecha inicio</label>
                        <DatePicker
                            value={fechaInicio}
                            onChange={setFechaInicio}
                            placeholder="Desde..."
                        />
                    </div>
                    <div className="hs-field">
                        <label>Fecha fin</label>
                        <DatePicker
                            value={fechaFin}
                            onChange={setFechaFin}
                            placeholder="Hasta..."
                        />
                    </div>
                    <div className="hs-field">
                        <label>Sucursal destino</label>
                        <SelectInput
                            options={opcionesSucursales}
                            value={filtroSucursalDestino}
                            onChange={setFiltroSucursalDestino}
                            placeholder="Todas"
                            minWidth={180}
                        />
                    </div>

                    <div className="hs-field">
                        <label>Estado</label>
                        <SelectInput
                            options={opcionesEstado}
                            value={filtroEstado}
                            onChange={setFiltroEstado}
                            placeholder="Todos"
                            minWidth={140}
                        />
                    </div>

                    <div className="hs-field">
                        <label>Mostrar</label>
                        <SelectInput
                            options={opcionesPorPagina}
                            value={porPagina}
                            onChange={(v) => { setPorPagina(Number(v)); setPagina(1); }}
                            placeholder="10 por página"
                            isClearable={false}
                            minWidth={130}
                        />
                    </div>

                    {/* Solo mostrar botón si es Jefe de Bodega */}
                    {esJefeBodega && (
                        <button className="hs-btn-nuevo" onClick={() => navigate("/app/salidas/nuevo")}>
                            <i className="fas fa-paper-plane" /> Nueva salida
                        </button>
                    )}
                </div>

                {/* Resumen */}
                <div className="hs-resumen">
                    <div className="hs-resumen-item">
                        <div className="hs-resumen-valor">{salidasFiltradas.length}</div>
                        <div className="hs-resumen-label">Total salidas</div>
                    </div>
                    <div className="hs-resumen-item">
                        <div className="hs-resumen-valor" style={{ color: "#2563eb" }}>
                            {salidasFiltradas.filter(s => s.estado === "Enviada").length}
                        </div>
                        <div className="hs-resumen-label">Enviadas</div>
                    </div>
                    <div className="hs-resumen-item">
                        <div className="hs-resumen-valor" style={{ color: "#16a34a" }}>
                            {salidasFiltradas.filter(s => s.estado === "Recibida").length}
                        </div>
                        <div className="hs-resumen-label">Recibidas</div>
                    </div>
                    <div className="hs-resumen-item">
                        <div className="hs-resumen-valor" style={{ color: "#dc2626" }}>
                            {salidasFiltradas.filter(s => s.estado === "Anulada").length}
                        </div>
                        <div className="hs-resumen-label">Anuladas</div>
                    </div>
                    <div className="hs-resumen-item">
                        <div className="hs-resumen-valor">
                            L. {salidasFiltradas.reduce((s, i) => s + parseFloat(i.totalCosto || 0), 0).toFixed(2)}
                        </div>
                        <div className="hs-resumen-label">Costo total</div>
                    </div>
                </div>
            </Card>

            {/* ── Tabla ── */}
            <Card titulo={`Listado de salidas (${salidasFiltradas.length})`}>
                <div className="hs-table-wrap">
                    <table className="hs-table">
                        <thead>
                            <tr>
                                <th style={{ width: 32 }}></th>
                                <th>Opciones</th>
                                <th># Salida</th>
                                <th>Fecha</th>
                                <th>Origen</th>
                                <th>Destino</th>
                                <th>Unidades</th>
                                <th>Costo total</th>
                                <th>Estado</th>
                                <th>Registrada por</th>
                                <th>Recibida por</th>
                                <th>Fecha recepción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salidasPaginadas.length === 0 ? (
                                <tr>
                                    <td colSpan={12}>
                                        <div className="hs-empty">
                                            <i className="fas fa-paper-plane" />
                                            <span>No hay salidas registradas</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                salidasPaginadas.map(salida => (
                                    <>
                                        {/* ── Fila principal ── */}
                                        <tr
                                            key={`row-${salida.id}`}
                                            className={`principal${filaExpandida === salida.id ? " expandida" : ""}`}
                                            onClick={() => handleExpandir(salida)}
                                        >
                                            <td>
                                                <i className={`fas fa-chevron-right hs-expand-icon${filaExpandida === salida.id ? " abierto" : ""}`}
                                                    style={{ color: "#94a3b8", fontSize: ".75rem" }} />
                                            </td>
                                            <td onClick={e => e.stopPropagation()}>
                                                <div className="hs-actions">
                                                    {salida.sucursalDestinoId === usuario?.sucursalId && salida.estado === "Enviada" && (
                                                        <button
                                                            className="hs-btn-recibir"
                                                            onClick={() => handleRecibir(salida)}
                                                            disabled={procesando === salida.id}
                                                        >
                                                            {procesando === salida.id
                                                                ? <i className="fas fa-spinner fa-spin" />
                                                                : <><i className="fas fa-check-circle" /> Recibir</>
                                                            }
                                                        </button>
                                                    )}
                                                    {esJefeBodega && salida.sucursalOrigenId === usuario?.sucursalId && salida.estado === "Enviada" && (
                                                        <button
                                                            className="hs-btn-anular"
                                                            onClick={() => handleAnular(salida)}
                                                            disabled={procesando === salida.id}
                                                        >
                                                            <i className="fas fa-ban" /> Anular
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td><strong>#{salida.id}</strong></td>
                                            <td>{new Date(salida.createdAt).toLocaleDateString("es-HN")}</td>
                                            <td>{salida.SucursalOrigen?.nombre || "—"}</td>
                                            <td>{salida.SucursalDestino?.nombre || "—"}</td>
                                            <td>{salida.unidadesTotales ?? "—"}</td>
                                            <td><strong>L. {Number(salida.totalCosto).toFixed(2)}</strong></td>
                                            <td>
                                                <span className={`hs-badge badge ${colorEstado(salida.estado)}`}>
                                                    {salida.estado}
                                                </span>
                                            </td>
                                            <td>{salida.UsuarioRegistra?.nombre || "—"}</td>
                                            <td>{salida.UsuarioRecibe?.nombre || "—"}</td>
                                            <td>
                                                {salida.fechaRecibido
                                                    ? new Date(salida.fechaRecibido).toLocaleDateString("es-HN")
                                                    : "—"
                                                }
                                            </td>
                                        </tr>

                                        {/* ── Fila de detalle expandido ── */}
                                        {filaExpandida === salida.id && (
                                            <tr key={`detalle-${salida.id}`} className="hs-detalle-row">
                                                <td colSpan={12}>
                                                    <div className="hs-detalle-wrap">
                                                        {cargandoDetalle === salida.id ? (
                                                            <div className="text-center py-3">
                                                                <i className="fas fa-spinner fa-spin mr-2" style={{ color: "#3b82f6" }} />
                                                                <span style={{ color: "#64748b", fontSize: ".85rem" }}>Cargando detalle...</span>
                                                            </div>
                                                        ) : detallesSalida[salida.id] ? (
                                                            <>
                                                                <div className="hs-detalle-titulo">
                                                                    <i className="fas fa-list" />
                                                                    Detalle de salida #{salida.id}
                                                                    <span style={{ fontWeight: 400, color: "#64748b", textTransform: "none", letterSpacing: 0 }}>
                                                                        — {detallesSalida[salida.id].SalidaDetalles?.length || 0} lote(s)
                                                                    </span>
                                                                </div>
                                                                <table className="hs-detalle-table">
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Lote</th>
                                                                            <th>Fecha venc.</th>
                                                                            <th>Cantidad</th>
                                                                            <th>Costo histórico</th>
                                                                            <th>Subtotal</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {detallesSalida[salida.id].SalidaDetalles?.map((det, idx) => (
                                                                            <tr key={idx}>
                                                                                <td>
                                                                                    <span className="hs-lote-badge">
                                                                                        {det.Lote?.numeroLote || `#${det.loteId}`}
                                                                                    </span>
                                                                                </td>
                                                                                <td>{det.Lote?.fechaVencimiento || "—"}</td>
                                                                                <td>{det.cantidad}</td>
                                                                                <td>L. {Number(det.costoHistorico).toFixed(2)}</td>
                                                                                <td>
                                                                                    <strong>
                                                                                        L. {(det.cantidad * Number(det.costoHistorico)).toFixed(2)}
                                                                                    </strong>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Paginación ── */}
                <div className="hs-footer">
                    <span>
                        Mostrando {salidasFiltradas.length === 0 ? 0 : (pagina - 1) * porPagina + 1} a{" "}
                        {Math.min(pagina * porPagina, salidasFiltradas.length)} de {salidasFiltradas.length} resultado(s)
                    </span>
                    <div className="hs-pagination">
                        <button className="hs-page-btn" onClick={() => cambiarPagina(1)} disabled={pagina === 1}>
                            <i className="fas fa-angle-double-left" />
                        </button>
                        <button className="hs-page-btn" onClick={() => cambiarPagina(pagina - 1)} disabled={pagina === 1}>
                            <i className="fas fa-angle-left" />
                        </button>
                        {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPaginas || Math.abs(p - pagina) <= 1)
                            .reduce((acc, p, idx, arr) => {
                                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((item, idx) =>
                                item === "..." ? (
                                    <span key={idx} className="hs-page-btn" style={{ cursor: "default", border: "none" }}>…</span>
                                ) : (
                                    <button key={idx} className={`hs-page-btn ${pagina === item ? "active" : ""}`} onClick={() => cambiarPagina(item)}>
                                        {item}
                                    </button>
                                )
                            )
                        }
                        <button className="hs-page-btn" onClick={() => cambiarPagina(pagina + 1)} disabled={pagina === totalPaginas || totalPaginas === 0}>
                            <i className="fas fa-angle-right" />
                        </button>
                        <button className="hs-page-btn" onClick={() => cambiarPagina(totalPaginas)} disabled={pagina === totalPaginas || totalPaginas === 0}>
                            <i className="fas fa-angle-double-right" />
                        </button>
                    </div>
                </div>
            </Card>
        </Page>
    );
};

export default HomeSalidas;