import { Navigate, useOutlet } from "react-router-dom";
import { mostraAlertaError } from "../componentes/alerts/sweetAlert";
import { useContextUsuario } from "../contexto/usuario/UsuarioContext";

export const UsuarioLayout = () => {
    const outlet = useOutlet();
    const { usuario } = useContextUsuario();

    if (usuario?.tipoUsuario !== "Administrador") {
        mostraAlertaError("No tienes permiso para acceder a este sitio.");
        return <Navigate to="/login" />;
    }

    return outlet;
};