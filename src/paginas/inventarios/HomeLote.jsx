// --- IMPORTACIONES ---
import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../../configuracion/socket";
import Card from "../../componentes/contenedores/Card";
import Page from "../../componentes/plantilla/Page";
import CardLote from "../../componentes/contenedores/CardLote";
import SelectInput from "../../componentes/inputs/Select";
import { LotesListar, ImagenCategorias } from "../../configuracion/apiUrls";
import { useContextUsuario } from "../../contexto/usuario/UsuarioContext";
import "../styles/styles.css";

const HomeLotes = () => {
    const { token, usuario, ActualizarLista, listaLotes, setListaLotes, listaCategorias, listaSucursales } = useContextUsuario();
    const navigate = useNavigate();

    const [filtroCategoriaId, setFiltroCategoriaId] = useState(null);
    const [mostrarInactivos, setMostrarInactivos] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [busquedaCategoria, setBusquedaCategoria] = useState("");
    const [verOtrasSucursales, setVerOtrasSucursales] = useState(false);
    const [filtroSucursalId, setFiltroSucursalId] = useState("");

    const lotesRef = useRef(null);

    const pageDatos = {
        titulo: {
            titulo: "Gestión de lotes",
            nombreUrl: "inicio",
        },
    };

    useEffect(() => {
        if (token) ActualizarLista(LotesListar, setListaLotes);
    }, [token]);

    useEffect(() => {
        const recargar = () => {
            if (token) ActualizarLista(LotesListar, setListaLotes);
        };
        socket.on("salida_actualizada", recargar);
        socket.on("nueva_salida", recargar);
        return () => {
            socket.off("salida_actualizada", recargar);
            socket.off("nueva_salida", recargar);
        };
    }, [token]);

    // --- OTRAS SUCURSALES (sin la del usuario) ---
    const otrasSucursales = useMemo(() =>
        listaSucursales.filter(s => s.id !== usuario?.sucursalId && s.estado === "Activo"),
        [listaSucursales, usuario]
    );

    const opcionesOtrasSucursales = useMemo(() => [
        { value: "", label: "Todas las sucursales" },
        ...otrasSucursales.map(s => ({ value: String(s.id), label: s.nombre }))
    ], [otrasSucursales]);

    // --- CATEGORÍAS CON LOTES ---
    const categoriasConLotes = useMemo(() => {
        return listaCategorias.filter(cat =>
            cat.estado === "Activo" &&
            listaLotes.some(l => l.Producto?.CategoriaProducto?.id === cat.id)
        ).filter(cat =>
            busquedaCategoria === "" ||
            cat.Categoria.toLowerCase().includes(busquedaCategoria.toLowerCase())
        );
    }, [listaCategorias, listaLotes, busquedaCategoria]);

    // --- LOTES FILTRADOS ---
    const lotesFiltrados = useMemo(() => {
        return listaLotes.filter(l => {
            const esMiSucursal = l.sucursalId === usuario?.sucursalId;
            if (!verOtrasSucursales && !esMiSucursal) return false;
            if (verOtrasSucursales && esMiSucursal) return false;

            // Filtro por sucursal específica en otras sucursales
            if (verOtrasSucursales && filtroSucursalId && l.sucursalId !== Number(filtroSucursalId)) return false;

            const coincideEstado = mostrarInactivos
                ? l.estado === "Inactivo"
                : l.estado === "Activo";

            const coincideCategoria = filtroCategoriaId === null ||
                l.Producto?.CategoriaProducto?.id === filtroCategoriaId;

            const coincideBusqueda =
                busqueda === "" ||
                l.numeroLote?.toLowerCase().includes(busqueda.toLowerCase()) ||
                l.Producto?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
                l.Producto?.sku?.toLowerCase().includes(busqueda.toLowerCase());

            return coincideEstado && coincideCategoria && coincideBusqueda;
        });
    }, [listaLotes, usuario, verOtrasSucursales, filtroSucursalId, mostrarInactivos, filtroCategoriaId, busqueda]);

    const aplicarFiltroCategoria = (catId) => {
        setFiltroCategoriaId(catId);
        if (lotesRef.current) lotesRef.current.scrollIntoView({ behavior: "smooth" });
    };

    const handleCambiarTab = (otras) => {
        setVerOtrasSucursales(otras);
        setFiltroSucursalId(""); // limpiar filtro de sucursal al cambiar tab
    };

    return (
        <Page datos={pageDatos}>

            {/* ── Filtro por categoría ── */}
            <Card titulo="Filtrar por categoría">
                <div className="hl-cats-scroll">
                    {/* Buscador fijo a la izquierda con separador */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <div className="hl-cats-search">
                                <i className="fas fa-search" />
                                <input
                                    type="text"
                                    placeholder="Buscar categoría..."
                                    value={busquedaCategoria}
                                    onChange={e => setBusquedaCategoria(e.target.value)}
                                />
                            </div>
                            <span style={{ fontSize: ".72rem", color: "#94a3b8", fontWeight: 600, textAlign: "center" }}>
                                {categoriasConLotes.length} con lotes
                            </span>
                        </div>
                        {/* Separador vertical */}
                        <div style={{ width: 1, background: "#e2e8f0", alignSelf: "stretch", margin: "2px 6px 14px" }} />
                    </div>

                    {/* Todos */}
                    <div className="hl-cat-item" onClick={() => aplicarFiltroCategoria(null)}>
                        <div className={`hl-cat-img-wrap ${filtroCategoriaId === null ? "activa" : ""}`}>
                            <img src="/categoria_default.jpeg" alt="Todos" onError={e => { e.target.onerror = null; e.target.src = "/categoria_default.jpeg"; }} />
                        </div>
                        <div className={`hl-cat-nombre ${filtroCategoriaId === null ? "activa" : ""}`}>Todos</div>
                    </div>

                    {categoriasConLotes.map(cat => (
                        <div key={cat.id} className="hl-cat-item" onClick={() => aplicarFiltroCategoria(cat.id)}>
                            <div className={`hl-cat-img-wrap ${filtroCategoriaId === cat.id ? "activa" : ""}`}>
                                <img
                                    src={ImagenCategorias + cat.imagen}
                                    alt={cat.Categoria}
                                    onError={e => { e.target.onerror = null; e.target.src = "/categoria_default.jpeg"; }}
                                />
                            </div>
                            <div className={`hl-cat-nombre ${filtroCategoriaId === cat.id ? "activa" : ""}`}>
                                {cat.Categoria}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* ── Card principal ── */}
            <div className="row mt-3">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Lista de lotes</h3>
                            <div className="card-tools">
                                <button type="button" className="btn btn-tool" data-card-widget="collapse">
                                    <i className="fas fa-minus" />
                                </button>
                            </div>
                        </div>
                        <div className="card-body">

                            {/* Alerta sin sucursal */}
                            {!usuario?.sucursalId && (
                                <div className="hl-alert-sucursal">
                                    <i className="fas fa-exclamation-triangle" />
                                    Tu usuario no tiene una sucursal asignada. Solo puedes visualizar lotes de otras sucursales. Contacta al administrador.
                                </div>
                            )}

                            {/* Fila 1: Tabs + select sucursal / nuevo lote + espacio + inactivos */}
                            <div className="hl-toolbar" style={{ marginBottom: 8 }}>
                                {/* Tabs */}
                                <button
                                    className={`hl-tab ${!verOtrasSucursales ? "activo" : ""}`}
                                    onClick={() => handleCambiarTab(false)}
                                >
                                    <i className="fas fa-store" /> Mi sucursal
                                </button>
                                <button
                                    className={`hl-tab ${verOtrasSucursales ? "activo" : ""}`}
                                    onClick={() => handleCambiarTab(true)}
                                >
                                    <i className="fas fa-eye" /> Otras sucursales
                                </button>

                                {/* Al lado de las tabs: select sucursal O nuevo lote según tab activa */}
                                {verOtrasSucursales ? (
                                    <SelectInput
                                        options={opcionesOtrasSucursales}
                                        value={filtroSucursalId}
                                        onChange={(v) => setFiltroSucursalId(v || "")}
                                        placeholder="Todas las sucursales"
                                        isClearable={true}
                                        minWidth={180}
                                        menuPortalTarget={document.body}
                                        menuPosition="fixed"
                                    />
                                ) : (
                                    <button
                                        className="hl-btn-nuevo"
                                        disabled={!usuario?.sucursalId}
                                        onClick={() => navigate("/app/lotes/nuevo")}
                                        title={!usuario?.sucursalId ? "Sin sucursal asignada" : ""}
                                    >
                                        <i className="fas fa-plus" /> Nuevo lote
                                    </button>
                                )}

                                {/* Espacio flexible */}
                                <div style={{ flex: 1 }} />

                                {/* Toggle inactivos — siempre al final */}
                                <label className="hl-toggle-wrap">
                                    <div className="hl-toggle-pill">
                                        <input
                                            type="checkbox"
                                            checked={mostrarInactivos}
                                            onChange={e => setMostrarInactivos(e.target.checked)}
                                        />
                                        <span className="hl-toggle-track" />
                                    </div>
                                    Inactivos
                                </label>
                            </div>

                            {/* Fila 2: Buscador */}
                            <div className="hl-toolbar" style={{ marginBottom: 16 }}>
                                <div className="hl-search">
                                    <i className="fas fa-search" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por lote, producto o SKU..."
                                        value={busqueda}
                                        onChange={e => setBusqueda(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Contador */}
                            <div className="hl-count">
                                {lotesFiltrados.length} lote{lotesFiltrados.length !== 1 ? "s" : ""}{" "}
                                {mostrarInactivos ? "inactivo(s)" : "activo(s)"}
                                {filtroCategoriaId && ` · ${listaCategorias.find(c => c.id === filtroCategoriaId)?.Categoria}`}
                                {verOtrasSucursales
                                    ? filtroSucursalId
                                        ? ` · ${listaSucursales.find(s => s.id === Number(filtroSucursalId))?.nombre}`
                                        : " · Todas las sucursales"
                                    : " · Mi sucursal"
                                }
                            </div>

                            {/* Grid */}
                            <div ref={lotesRef} className="row g-3">
                                {lotesFiltrados.length === 0 ? (
                                    <div className="col-12">
                                        <div className="hl-empty">
                                            <i className="fas fa-boxes" />
                                            <span>
                                                No hay lotes {mostrarInactivos ? "inactivos" : "activos"}
                                                {verOtrasSucursales ? " en otras sucursales" : " en tu sucursal"}
                                                {filtroCategoriaId ? " de esta categoría" : ""}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    lotesFiltrados.map(lote => (
                                        <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={lote.id}>
                                            <CardLote
                                                lote={lote}
                                                esMiSucursal={!verOtrasSucursales}
                                            />
                                        </div>
                                    ))
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </Page>
    );
};

export default HomeLotes;