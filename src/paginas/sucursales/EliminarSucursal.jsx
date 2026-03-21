import { mostraAlertaError, mostraAlertaOk, mostraAlertaPregunta } from "../../componentes/alerts/sweetAlert";
import { useEffect, useState } from "react";
import { AxiosPrivado } from "../../componentes/axios/Axios";
import { SucursalesEliminar, SucursalesListar } from "../../configuracion/apiUrls";

const EliminarSucursal = ({ datos, token, setListaSucursales, ActualizarLista }) => {
    const [eliminar, setEliminar] = useState(false);

    useEffect(() => {
        if (eliminar) eliminarSucursal();
        return () => setEliminar(false);
    }, [eliminar]);

    const eliminarSucursalPregunta = () => {
        if (datos.tieneRegistrosVinculados) {
            mostraAlertaError(`La sucursal "${datos.nombre}" no se puede eliminar porque tiene registros vinculados.`);
            return;
        }
        mostraAlertaPregunta(
            setEliminar,
            `¿Deseas eliminar la sucursal "${datos.nombre}" de forma permanente?`,
            "warning"
        );
    };

    const eliminarSucursal = async () => {
        if (!datos.id) return mostraAlertaError("Seleccione una sucursal");
        if (datos.tieneRegistrosVinculados) {
            mostraAlertaError(`La sucursal "${datos.nombre}" no se puede eliminar porque tiene registros vinculados.`);
            setEliminar(false);
            return;
        }

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await AxiosPrivado.delete(SucursalesEliminar + datos.id, config);
            mostraAlertaOk("Sucursal eliminada correctamente");
            ActualizarLista(SucursalesListar, setListaSucursales);
        } catch (error) {
            console.error(error);
            const msjError = error.response?.data?.error || "Ocurrió un error desconocido al eliminar.";
            mostraAlertaError(msjError);
        } finally {
            setEliminar(false);
        }
    };

    return (
        <button type="button" className="btn btn-danger" onClick={eliminarSucursalPregunta}>
            <i className="fas fa-trash" />
        </button>
    );
};

export default EliminarSucursal;