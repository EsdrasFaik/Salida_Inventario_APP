import { useState, useMemo } from "react";
import { useContextUsuario } from "../../contexto/usuario/UsuarioContext";
import EliminarSucursal from "./EliminarSucursal";
import "../styles/styles.css";

const TablaSucursal = ({ datos = [], onEditar }) => {
    const { token, setListaSucursales, ActualizarLista } = useContextUsuario();

    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("Activo");
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = useState(10);
    const [orden, setOrden] = useState({ col: "id", dir: "asc" });

    const toggleOrden = (col) => {
        setOrden((prev) => ({ col, dir: prev.col === col && prev.dir === "asc" ? "desc" : "asc" }));
        setPagina(1);
    };

    const iconOrden = (col) => {
        if (orden.col !== col) return <i className="fas fa-sort ms-1 text-muted opacity-50" />;
        return orden.dir === "asc"
            ? <i className="fas fa-sort-up ms-1" style={{ color: "#3b82f6" }} />
            : <i className="fas fa-sort-down ms-1" style={{ color: "#3b82f6" }} />;
    };

    const datosFiltrados = useMemo(() => {
        let lista = datos.filter((s) => {
            const coincideBusqueda =
                s.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
                s.ubicacion?.toLowerCase().includes(busqueda.toLowerCase());
            const coincideEstado = filtroEstado === "Todos" || s.estado === filtroEstado;
            return coincideBusqueda && coincideEstado;
        });

        lista = [...lista].sort((a, b) => {
            let valA = a[orden.col] ?? "";
            let valB = b[orden.col] ?? "";
            if (typeof valA === "string") valA = valA.toLowerCase();
            if (typeof valB === "string") valB = valB.toLowerCase();
            if (valA < valB) return orden.dir === "asc" ? -1 : 1;
            if (valA > valB) return orden.dir === "asc" ? 1 : -1;
            return 0;
        });

        return lista;
    }, [datos, busqueda, filtroEstado, orden]);

    const totalPaginas = Math.ceil(datosFiltrados.length / porPagina);
    const datosPaginados = datosFiltrados.slice((pagina - 1) * porPagina, pagina * porPagina);

    const cambiarPagina = (p) => {
        if (p < 1 || p > totalPaginas) return;
        setPagina(p);
    };

    return (
        <>
            {/* --- BARRA DE HERRAMIENTAS --- */}
            <div className="tp-toolbar">
                <div className="tp-search">
                    <i className="fas fa-search" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o ubicación..."
                        value={busqueda}
                        onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
                    />
                </div>
                <select className="tp-select" value={filtroEstado} onChange={(e) => { setFiltroEstado(e.target.value); setPagina(1); }}>
                    <option value="Activo">Activos</option>
                    <option value="Inactivo">Inactivos</option>
                    <option value="Todos">Todos</option>
                </select>
                <select className="tp-select" value={porPagina} onChange={(e) => { setPorPagina(Number(e.target.value)); setPagina(1); }}>
                    {[5, 10, 25, 50].map((n) => <option key={n} value={n}>Mostrar {n}</option>)}
                </select>
            </div>

            {/* --- TABLA --- */}
            <div className="tp-table-wrap">
                <table className="tp-table">
                    <thead>
                        <tr>
                            <th className="no-sort">Opciones</th>
                            <th onClick={() => toggleOrden("id")}>ID {iconOrden("id")}</th>
                            <th onClick={() => toggleOrden("nombre")}>Nombre {iconOrden("nombre")}</th>
                            <th onClick={() => toggleOrden("ubicacion")}>Ubicación {iconOrden("ubicacion")}</th>
                            <th onClick={() => toggleOrden("estado")}>Estado {iconOrden("estado")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {datosPaginados.length === 0 ? (
                            <tr>
                                <td colSpan={5}>
                                    <div className="tp-empty">
                                        <i className="fas fa-store-slash" />
                                        <span>No hay sucursales registradas</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            datosPaginados.map((sucursal) => (
                                <tr key={sucursal.id}>
                                    <td>
                                        <div className="tp-actions">
                                            <button
                                                className="tp-btn-editar"
                                                onClick={() => onEditar(sucursal)}
                                                title="Editar sucursal"
                                            >
                                                <i className="fas fa-edit" /> Editar
                                            </button>
                                            <EliminarSucursal
                                                datos={sucursal}
                                                token={token}
                                                setListaSucursales={setListaSucursales}
                                                ActualizarLista={ActualizarLista}
                                            />
                                        </div>
                                    </td>
                                    <td>{sucursal.id}</td>
                                    <td>{sucursal.nombre}</td>
                                    <td>{sucursal.ubicacion}</td>
                                    <td>
                                        <span className={`tp-badge badge ${sucursal.estado === "Activo" ? "bg-success" : "bg-secondary"}`}>
                                            {sucursal.estado}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- FOOTER PAGINACIÓN --- */}
            <div className="tp-footer">
                <span>
                    Mostrando {datosFiltrados.length === 0 ? 0 : (pagina - 1) * porPagina + 1} a{" "}
                    {Math.min(pagina * porPagina, datosFiltrados.length)} de {datosFiltrados.length} resultado(s)
                </span>
                <div className="tp-pagination">
                    <button className="tp-page-btn" onClick={() => cambiarPagina(1)} disabled={pagina === 1}>
                        <i className="fas fa-angle-double-left" />
                    </button>
                    <button className="tp-page-btn" onClick={() => cambiarPagina(pagina - 1)} disabled={pagina === 1}>
                        <i className="fas fa-angle-left" />
                    </button>

                    {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalPaginas || Math.abs(p - pagina) <= 1)
                        .reduce((acc, p, idx, arr) => {
                            if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                            acc.push(p);
                            return acc;
                        }, [])
                        .map((item, idx) =>
                            item === "..." ? (
                                <span key={idx} className="tp-page-btn" style={{ cursor: "default", border: "none" }}>…</span>
                            ) : (
                                <button
                                    key={idx}
                                    className={`tp-page-btn ${pagina === item ? "active" : ""}`}
                                    onClick={() => cambiarPagina(item)}
                                >
                                    {item}
                                </button>
                            )
                        )}

                    <button className="tp-page-btn" onClick={() => cambiarPagina(pagina + 1)} disabled={pagina === totalPaginas || totalPaginas === 0}>
                        <i className="fas fa-angle-right" />
                    </button>
                    <button className="tp-page-btn" onClick={() => cambiarPagina(totalPaginas)} disabled={pagina === totalPaginas || totalPaginas === 0}>
                        <i className="fas fa-angle-double-right" />
                    </button>
                </div>
            </div>
        </>
    );
};

export default TablaSucursal;