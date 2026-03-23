import { useState, useMemo } from "react";
import { useContextUsuario } from "../../contexto/usuario/UsuarioContext";
import SelectInput from "../../componentes/inputs/Select";
import "../styles/styles.css";

const opcionesTipo = [
    { value: "Todos", label: "Todos los roles" },
    { value: "Administrador", label: "Administrador" },
    { value: "Jefe de bodega", label: "Jefe de bodega" },
    { value: "Empleado", label: "Empleado" },
];

const opcionesEstado = [
    { value: "Activo", label: "Activos" },
    { value: "Inactivo", label: "Inactivos" },
];

const opcionesPorPagina = [5, 10, 25, 50].map(n => ({ value: n, label: `Mostrar ${n}` }));

const TablaUsuarios = ({ datos = [], onEditar }) => {
    const { token, setListaUsuarios, ActualizarLista } = useContextUsuario();

    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("Activo");
    const [filtroTipo, setFiltroTipo] = useState("Todos");
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
        let lista = datos.filter((u) => {
            const coincideBusqueda =
                u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
                u.correo?.toLowerCase().includes(busqueda.toLowerCase()) ||
                u.Sucursal?.nombre?.toLowerCase().includes(busqueda.toLowerCase());
            const coincideEstado = filtroEstado === "Todos" || u.estado === filtroEstado;
            const coincideTipo = filtroTipo === "Todos" || u.tipoUsuario === filtroTipo;
            return coincideBusqueda && coincideEstado && coincideTipo;
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
    }, [datos, busqueda, filtroEstado, filtroTipo, orden]);

    const totalPaginas = Math.ceil(datosFiltrados.length / porPagina);
    const datosPaginados = datosFiltrados.slice((pagina - 1) * porPagina, pagina * porPagina);

    const cambiarPagina = (p) => {
        if (p < 1 || p > totalPaginas) return;
        setPagina(p);
    };

    const colorTipo = (tipo) => {
        if (tipo === "Administrador") return "bg-danger";
        if (tipo === "Jefe de bodega") return "bg-warning";
        return "bg-info";
    };

    const colorEstado = (estado) => {
        if (estado === "Activo") return "bg-success";
        if (estado === "Bloqueado") return "bg-danger";
        if (estado === "Logeado") return "bg-primary";
        return "bg-secondary";
    };

    return (
        <>
            {/* --- BARRA DE HERRAMIENTAS --- */}
            <div className="tp-toolbar">
                <div className="tp-search">
                    <i className="fas fa-search" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, correo o sucursal..."
                        value={busqueda}
                        onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
                    />
                </div>
                <SelectInput
                    options={opcionesTipo}
                    value={filtroTipo}
                    onChange={(v) => { setFiltroTipo(v || "Todos"); setPagina(1); }}
                    placeholder="Todos los roles"
                    isClearable={false}
                    minWidth={160}
                />
                <SelectInput
                    options={opcionesEstado}
                    value={filtroEstado}
                    onChange={(v) => { setFiltroEstado(v || "Activo"); setPagina(1); }}
                    placeholder="Estado..."
                    isClearable={false}
                    minWidth={130}
                />
                <SelectInput
                    options={opcionesPorPagina}
                    value={porPagina}
                    onChange={(v) => { setPorPagina(Number(v)); setPagina(1); }}
                    placeholder="Mostrar..."
                    isClearable={false}
                    minWidth={130}
                />
            </div>

            {/* --- TABLA --- */}
            <div className="tp-table-wrap">
                <table className="tp-table">
                    <thead>
                        <tr>
                            <th className="no-sort">Opciones</th>
                            <th onClick={() => toggleOrden("id")}>ID {iconOrden("id")}</th>
                            <th onClick={() => toggleOrden("nombre")}>Nombre {iconOrden("nombre")}</th>
                            <th onClick={() => toggleOrden("correo")}>Correo {iconOrden("correo")}</th>
                            <th onClick={() => toggleOrden("tipoUsuario")}>Rol {iconOrden("tipoUsuario")}</th>
                            <th>Sucursal</th>
                            <th onClick={() => toggleOrden("estado")}>Estado {iconOrden("estado")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {datosPaginados.length === 0 ? (
                            <tr>
                                <td colSpan={7}>
                                    <div className="tp-empty">
                                        <i className="fas fa-users-slash" />
                                        <span>No hay usuarios registrados</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            datosPaginados.map((usuario) => (
                                <tr key={usuario.id}>
                                    <td>
                                        <div className="tp-actions">
                                            <button
                                                className="tp-btn-editar"
                                                onClick={() => onEditar(usuario)}
                                                title="Editar usuario"
                                            >
                                                <i className="fas fa-edit" /> Editar
                                            </button>
                                        </div>
                                    </td>
                                    <td>{usuario.id}</td>
                                    <td>{usuario.nombre}</td>
                                    <td>{usuario.correo}</td>
                                    <td>
                                        <span className={`tp-badge badge ${colorTipo(usuario.tipoUsuario)}`}>
                                            {usuario.tipoUsuario}
                                        </span>
                                    </td>
                                    <td>{usuario.Sucursal?.nombre || <span className="text-muted">—</span>}</td>
                                    <td>
                                        <span className={`tp-badge badge ${colorEstado(usuario.estado)}`}>
                                            {usuario.estado}
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

export default TablaUsuarios;