import { mostraAlertaError, mostraAlertaOk, mostraAlertaPregunta } from "../../../componentes/alerts/sweetAlert";
import { useEffect, useState } from "react";
import { AxiosPrivado } from "../../../componentes/axios/Axios";
import { CategoriaEliminar, CategoriaListar } from "../../../configuracion/apiUrls";


const EliminarCategoria = ({ datos, token, setListaCategorias, ActualizarLista }) => {
    const [eliminar, setEliminar] = useState(false);

    useEffect(() => {
        if (eliminar) {
            eliminarCategoria();
        }
        return () => setEliminar(false);
    }, [eliminar]);

    const eliminarCategoriaPregunta = () => {
        if (datos.tieneRegistrosVinculados) {
            mostraAlertaError(`La categoría "${datos.Categoria}" no se puede eliminar porque tiene registros vinculados.`);
            return;
        }

        mostraAlertaPregunta(
            setEliminar,
            `¿Deseas eliminar la categoría "${datos.Categoria}" de forma permanente?`,
            "warning"
        );
    };

    const eliminarCategoria = async () => {
        if (!datos.id) {
            return mostraAlertaError("Seleccione una categoría");
        }
        if (datos.tieneRegistrosVinculados) {
            mostraAlertaError(`La categoría "${datos.Categoria}" no se puede eliminar porque tiene registros vinculados.`);
            setEliminar(false);
            return;
        }

        try {
            const config = {
                headers: { 'Authorization': `Bearer ${token}` }
            };
            await AxiosPrivado.delete(CategoriaEliminar + datos.id, config);

            mostraAlertaOk("Categoría eliminada correctamente");
            ActualizarLista(CategoriaListar, setListaCategorias);

        } catch (error) {
            console.error(error);
            const msjError = error.response?.data?.error || "Ocurrió un error desconocido al eliminar.";
            mostraAlertaError(msjError);
        } finally {
            setEliminar(false);
        }
    };

    return (
        <button type="button" className="btn btn-danger" onClick={eliminarCategoriaPregunta}>
            <i className="fas fa-trash" />
        </button>
    );
};

export default EliminarCategoria;