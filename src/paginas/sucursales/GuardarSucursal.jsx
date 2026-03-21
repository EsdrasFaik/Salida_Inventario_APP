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
import {
    SucursalesGuardar,
    SucursalesBuscar,
    SucursalesEditar,
} from "../../configuracion/apiUrls";
import { regexNombre } from "../../configuracion/validaciones";
import { useContextUsuario } from "../../contexto/usuario/UsuarioContext";
import "../styles/styles.css";

const GuardarSucursal = () => {
    const { token } = useContextUsuario();
    const navigate = useNavigate();
    const location = useLocation();
    const sucursalId = new URLSearchParams(location.search).get("id");
    const esEdicion = !!sucursalId;

    const [cargando, setCargando] = useState(esEdicion);

    const [formulario, setFormulario] = useState({
        nombre: "",
        ubicacion: "",
        estado: "Activo",
    });

    const [errorNombre, setErrorNombre] = useState(false);
    const [errorUbicacion, setErrorUbicacion] = useState(false);

    const pageDatos = {
        titulo: {
            titulo: esEdicion ? "Editar sucursal" : "Nueva sucursal",
            url: "/app/admin/sucursales",
            tituloUrl: "sucursales",
            nombreUrl: esEdicion ? "editar" : "nuevo",
        },
    };

    // --- EFECTOS ---
    useEffect(() => {
        if (esEdicion) cargarSucursal();
    }, [token]);

    useEffect(() => {
        setErrorNombre(formulario.nombre.length > 0 && !regexNombre.test(formulario.nombre));
    }, [formulario.nombre]);

    useEffect(() => {
        setErrorUbicacion(formulario.ubicacion.length > 0 && formulario.ubicacion.trim().length < 3);
    }, [formulario.ubicacion]);

    // --- CARGAR SUCURSAL (solo edición) ---
    const cargarSucursal = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await AxiosPrivado.get(SucursalesBuscar + sucursalId, config);
            setFormulario({
                nombre: data.nombre || "",
                ubicacion: data.ubicacion || "",
                estado: data.estado || "Activo",
            });
        } catch (error) {
            mostraAlertaError(error.response?.data?.error || "Error al cargar la sucursal.");
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

    // --- VALIDAR ---
    const validar = () => {
        const nombreErr = !regexNombre.test(formulario.nombre);
        const ubicacionErr = !formulario.ubicacion.trim() || formulario.ubicacion.trim().length < 3;
        setErrorNombre(nombreErr);
        setErrorUbicacion(ubicacionErr);

        if (nombreErr || ubicacionErr) {
            mostraAlertaError("Existen errores en el formulario. Por favor corrígelos.");
            return false;
        }
        if (!formulario.nombre.trim()) { mostraAlertaWarning("El nombre es obligatorio."); return false; }
        if (!formulario.ubicacion.trim()) { mostraAlertaWarning("La ubicación es obligatoria."); return false; }
        return true;
    };

    // --- GUARDAR O ACTUALIZAR ---
    const handleGuardar = async () => {
        if (!validar()) return;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            if (esEdicion) {
                await AxiosPrivado.put(SucursalesEditar + sucursalId, formulario, config);
                mostraAlertaOk("Sucursal actualizada correctamente.");
                navigate("/app/sucursales/listado");
            } else {
                await AxiosPrivado.post(SucursalesGuardar, formulario, config);
                mostraAlertaOk("Sucursal guardada correctamente.");
                limpiar();
            }
        } catch (error) {
            mostraAlertaError(error.response?.data?.error || "Error al guardar la sucursal.");
        }
    };

    // --- LIMPIAR (solo creación) ---
    const limpiar = () => {
        setFormulario({ nombre: "", ubicacion: "", estado: "Activo" });
        setErrorNombre(false);
        setErrorUbicacion(false);
    };

    // --- BOTONES ---
    const BotonesAccion = () => (
        <>
            <button type="button" className={`btn ${esEdicion ? "btn-warning" : "btn-success"} mr-2`} onClick={handleGuardar}>
                <i className={`fas ${esEdicion ? "fa-pen" : "fa-save"} mx-1`} />
                {esEdicion ? "Actualizar" : "Guardar"}
            </button>
            {esEdicion ? (
                <button type="button" className="btn btn-secondary" onClick={() => navigate("/app/sucursales/listado")}>
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
                    <Card titulo="Datos de la sucursal" pie={<BotonesAccion />}>
                        <form onSubmit={e => e.preventDefault()}>

                            {/* --- NOMBRE Y ESTADO --- */}
                            <div className="row">
                                <div className="col-md-8 col-sm-12">
                                    <div className="form-group">
                                        <label htmlFor="nombre">Nombre de la sucursal</label>
                                        <input
                                            type="text"
                                            id="nombre"
                                            name="nombre"
                                            className={`form-control ${errorNombre ? "is-invalid" : ""}`}
                                            placeholder="Ej: Sucursal Central..."
                                            value={formulario.nombre}
                                            onChange={manejador}
                                        />
                                        {errorNombre && <div className="invalid-feedback">Ingrese un nombre válido (mín. 3 caracteres).</div>}
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

                            {/* --- UBICACIÓN --- */}
                            <div className="row">
                                <div className="col-12">
                                    <div className="form-group">
                                        <label htmlFor="ubicacion">Ubicación</label>
                                        <textarea
                                            id="ubicacion"
                                            name="ubicacion"
                                            className={`form-control ${errorUbicacion ? "is-invalid" : ""}`}
                                            placeholder="Ej: Av. Principal #123, Tegucigalpa..."
                                            rows={3}
                                            value={formulario.ubicacion}
                                            onChange={manejador}
                                        />
                                        {errorUbicacion && <div className="invalid-feedback">Ingrese una ubicación válida (mín. 3 caracteres).</div>}
                                    </div>
                                </div>
                            </div>

                        </form>
                    </Card>
                </div>
            </div>
        </Page>
    );
};

export default GuardarSucursal;