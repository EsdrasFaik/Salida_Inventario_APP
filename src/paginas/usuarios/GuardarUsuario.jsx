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
import SelectInput from "../../componentes/inputs/Select";
import {
    UsuariosGuardar,
    UsuariosBuscar,
    UsuariosActualizar,
    SucursalesListar,
} from "../../configuracion/apiUrls";
import { regexNombre, regexEmail, regexContrasena } from "../../configuracion/validaciones";
import { useContextUsuario } from "../../contexto/usuario/UsuarioContext";
import "../styles/styles.css";

const GuardarUsuario = () => {
    const { token, ActualizarLista, listaSucursales, listaUsuarios, setListaUsuarios } = useContextUsuario();
    const navigate = useNavigate();
    const location = useLocation();
    const usuarioId = new URLSearchParams(location.search).get("id");
    const esEdicion = !!usuarioId;

    const [cargando, setCargando] = useState(esEdicion);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [passwordConfirm, setPasswordConfirm] = useState("");

    const [formulario, setFormulario] = useState({
        nombre: "",
        correo: "",
        contrasena: "",
        tipoUsuario: "Empleado",
        sucursalId: "",
        estado: "Activo",
    });

    const [errorNombre, setErrorNombre] = useState(false);
    const [errorCorreo, setErrorCorreo] = useState(false);
    const [errorContrasena, setErrorContrasena] = useState(false);
    const [errorConfirmarContrasena, setErrorConfirmarContrasena] = useState(false);

    const pageDatos = {
        titulo: {
            titulo: esEdicion ? "Editar usuario" : "Nuevo usuario",
            url: "/app/usuarios/inicio",
            tituloUrl: "inicio",
            nombreUrl: esEdicion ? "editar" : "nuevo",
        },
    };

    const opcionesTipoUsuario = [
        { value: "Empleado", label: "Empleado" },
        { value: "Jefe de bodega", label: "Jefe de bodega" },
        { value: "Administrador", label: "Administrador" },
    ];
    // --- EFECTOS ---
    useEffect(() => {
        if (esEdicion) cargarUsuario();
    }, [token]);

    useEffect(() => {
        setErrorNombre(formulario.nombre.length > 0 && !regexNombre.test(formulario.nombre));
        setErrorCorreo(formulario.correo.length > 0 && !regexEmail.test(formulario.correo));
        if (!esEdicion || formulario.contrasena.length > 0) {
            setErrorContrasena(formulario.contrasena.length > 0 && !regexContrasena.test(formulario.contrasena));
            setErrorConfirmarContrasena(formulario.contrasena !== passwordConfirm && passwordConfirm.length > 0);
        }
    }, [formulario, passwordConfirm]);

    // --- CARGAR USUARIO (solo edición) ---
    const cargarUsuario = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await AxiosPrivado.get(UsuariosBuscar + usuarioId, config);
            setFormulario({
                nombre: data.nombre || "",
                correo: data.correo || "",
                contrasena: "",
                tipoUsuario: data.tipoUsuario || "Empleado",
                sucursalId: data.Sucursal?.id ? String(data.Sucursal.id) : "",
                estado: data.estado || "Activo",
            });
        } catch (error) {
            mostraAlertaError(error.response?.data?.error || "Error al cargar el usuario.");
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

    // --- VALIDAR ---
    const validar = () => {
        const nombreErr = !regexNombre.test(formulario.nombre);
        const correoErr = !regexEmail.test(formulario.correo);
        const contrasenaErr = !esEdicion && !regexContrasena.test(formulario.contrasena);
        const confirmarErr = !esEdicion && formulario.contrasena !== passwordConfirm;

        setErrorNombre(nombreErr);
        setErrorCorreo(correoErr);
        setErrorContrasena(contrasenaErr);
        setErrorConfirmarContrasena(confirmarErr);

        if (nombreErr || correoErr || contrasenaErr || confirmarErr) {
            mostraAlertaError("Existen errores en el formulario. Por favor corrígelos.");
            return false;
        }
        if (!formulario.nombre.trim()) { mostraAlertaWarning("El nombre es obligatorio."); return false; }
        if (!formulario.correo.trim()) { mostraAlertaWarning("El correo es obligatorio."); return false; }
        if (!esEdicion && !formulario.contrasena.trim()) { mostraAlertaWarning("La contraseña es obligatoria."); return false; }
        return true;
    };

    // --- GUARDAR O ACTUALIZAR ---
    const handleGuardar = async () => {
        if (!validar()) return;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const payload = {
                nombre: formulario.nombre,
                correo: formulario.correo,
                tipoUsuario: formulario.tipoUsuario,
                sucursalId: formulario.sucursalId || null,
                estado: formulario.estado,
                ...(!esEdicion && { contrasena: formulario.contrasena }),
            };

            if (esEdicion) {
                await AxiosPrivado.put(UsuariosActualizar + usuarioId, payload, config);
                mostraAlertaOk("Usuario actualizado correctamente.");
                navigate("/app/usuarios/inicio");
            } else {
                await AxiosPrivado.post(UsuariosGuardar, payload, config);
                mostraAlertaOk("Usuario guardado correctamente.");
                limpiar();
            }
        } catch (error) {
            const mensajeError = error.response?.data?.errors?.[0]?.msg
                || error.response?.data?.error
                || "Error al guardar el usuario.";
            mostraAlertaError(mensajeError);
        }
    };

    // --- LIMPIAR ---
    const limpiar = () => {
        setFormulario({ nombre: "", correo: "", contrasena: "", tipoUsuario: "Empleado", sucursalId: "", estado: "Activo" });
        setPasswordConfirm("");
        setErrorNombre(false);
        setErrorCorreo(false);
        setErrorContrasena(false);
        setErrorConfirmarContrasena(false);
    };

    const BotonesAccion = () => (
        <>
            <button type="button" className={`btn ${esEdicion ? "btn-warning" : "btn-success"} mr-2`} onClick={handleGuardar}>
                <i className={`fas ${esEdicion ? "fa-pen" : "fa-save"} mx-1`} />
                {esEdicion ? "Actualizar" : "Guardar"}
            </button>
            {esEdicion ? (
                <button type="button" className="btn btn-secondary" onClick={() => navigate("/app/usuarios/inicio")}>
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
                    <Card titulo="Datos del usuario" pie={<BotonesAccion />}>
                        <form onSubmit={e => e.preventDefault()}>

                            {/* --- NOMBRE Y CORREO --- */}
                            <h5>Datos generales</h5>
                            <hr />
                            <div className="row">
                                <div className="col-md-6 col-sm-12">
                                    <div className="form-group">
                                        <label htmlFor="nombre">Nombre de usuario</label>
                                        <input
                                            type="text"
                                            id="nombre"
                                            name="nombre"
                                            className={`form-control ${errorNombre ? "is-invalid" : ""}`}
                                            placeholder="Ej: juan.perez..."
                                            value={formulario.nombre}
                                            onChange={manejador}
                                        />
                                        {errorNombre && <div className="invalid-feedback">El nombre debe tener al menos 3 caracteres.</div>}
                                    </div>
                                </div>
                                <div className="col-md-6 col-sm-12">
                                    <div className="form-group">
                                        <label htmlFor="correo">Correo electrónico</label>
                                        <input
                                            type="email"
                                            id="correo"
                                            name="correo"
                                            className={`form-control ${errorCorreo ? "is-invalid" : ""}`}
                                            placeholder="Ej: juan@correo.com"
                                            value={formulario.correo}
                                            onChange={manejador}
                                        />
                                        {errorCorreo && <div className="invalid-feedback">Ingrese un correo electrónico válido.</div>}
                                    </div>
                                </div>
                            </div>

                            {/* --- TIPO USUARIO Y SUCURSAL --- */}
                            {/* --- TIPO USUARIO Y SUCURSAL --- */}
                            <div className="row">
                                <div className="col-md-6 col-sm-12">
                                    <div className="form-group">
                                        <label>Rol</label>
                                        <SelectInput
                                            options={opcionesTipoUsuario}
                                            value={formulario.tipoUsuario}
                                            onChange={(v) => setFormulario(prev => ({ ...prev, tipoUsuario: v || "Empleado" }))}
                                            placeholder="Seleccionar rol..."
                                            isClearable={false}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6 col-sm-12">
                                    <div className="form-group">
                                        <label>Sucursal</label>
                                        <SelectInput
                                            options={[
                                                { value: "", label: "Sin sucursal" },
                                                ...listaSucursales
                                                    .filter(s => s.estado === "Activo")
                                                    .map(s => ({ value: String(s.id), label: s.nombre }))
                                            ]}
                                            value={formulario.sucursalId}
                                            onChange={(v) => setFormulario(prev => ({ ...prev, sucursalId: v || "" }))}
                                            placeholder="Sin sucursal"
                                            isClearable={true}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* --- ESTADO --- */}
                            <div className="row">
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

                            {/* --- CONTRASEÑA (solo creación) --- */}
                            {!esEdicion && (
                                <>
                                    <h5 className="mt-3">Contraseña</h5>
                                    <hr />
                                    <div className="row">
                                        <div className="col-md-6 col-sm-12">
                                            <div className="form-group">
                                                <label htmlFor="contrasena">Contraseña</label>
                                                <div className="input-group">
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        id="contrasena"
                                                        name="contrasena"
                                                        className={`form-control ${errorContrasena ? "is-invalid" : ""}`}
                                                        placeholder="Contraseña..."
                                                        value={formulario.contrasena}
                                                        onChange={manejador}
                                                    />
                                                    <div className="input-group-append">
                                                        <div className="input-group-text" onClick={() => setShowPassword(!showPassword)} style={{ cursor: "pointer" }}>
                                                            <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
                                                        </div>
                                                    </div>
                                                    {errorContrasena && (
                                                        <div className="invalid-feedback">
                                                            Debe tener mayúscula, minúscula, número, símbolo y entre 6-12 caracteres.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6 col-sm-12">
                                            <div className="form-group">
                                                <label htmlFor="confirmarContrasena">Confirmar contraseña</label>
                                                <div className="input-group">
                                                    <input
                                                        type={showPasswordConfirm ? "text" : "password"}
                                                        id="confirmarContrasena"
                                                        className={`form-control ${errorConfirmarContrasena ? "is-invalid" : ""}`}
                                                        placeholder="Confirmar contraseña..."
                                                        value={passwordConfirm}
                                                        onChange={e => setPasswordConfirm(e.target.value)}
                                                    />
                                                    <div className="input-group-append">
                                                        <div className="input-group-text" onClick={() => setShowPasswordConfirm(!showPasswordConfirm)} style={{ cursor: "pointer" }}>
                                                            <i className={`fas ${showPasswordConfirm ? "fa-eye-slash" : "fa-eye"}`} />
                                                        </div>
                                                    </div>
                                                    {errorConfirmarContrasena && (
                                                        <div className="invalid-feedback">Las contraseñas no coinciden.</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                        </form>
                    </Card>
                </div>
            </div>
        </Page >
    );
};

export default GuardarUsuario;