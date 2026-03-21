import { mostraAlertaError, mostraAlertaOk, mostraAlertaPregunta } from "../../componentes/alerts/sweetAlert";
import { useEffect, useState } from "react";
import { AxiosPrivado } from "../../componentes/axios/Axios";
import { ProductosEliminar, ProductosListar } from "../../configuracion/apiUrls";

const EliminarProducto = ({ datos, token, setListaProductos, ActualizarLista }) => {
    const [eliminar, setEliminar] = useState(false);

    useEffect(() => {
        if (eliminar) eliminarProducto();
        return () => setEliminar(false);
    }, [eliminar]);

    const eliminarProductoPregunta = () => {
        if (datos.tieneRegistrosVinculados) {
            mostraAlertaError(`El producto "${datos.nombre}" no se puede eliminar porque tiene registros vinculados.`);
            return;
        }
        mostraAlertaPregunta(
            setEliminar,
            `¿Deseas eliminar el producto "${datos.nombre}" de forma permanente?`,
            "warning"
        );
    };

    // --- ELIMINAR PRODUCTO ---
    const eliminarProducto = async () => {
        if (!datos.id) return mostraAlertaError("Seleccione un producto");
        if (datos.tieneRegistrosVinculados) {
            mostraAlertaError(`El producto "${datos.nombre}" no se puede eliminar porque tiene registros vinculados.`);
            setEliminar(false);
            return;
        }

        try {
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            await AxiosPrivado.delete(ProductosEliminar + datos.id, config);
            mostraAlertaOk("Producto eliminado correctamente");
            ActualizarLista(ProductosListar, setListaProductos);
        } catch (error) {
            console.error(error);
            const msjError = error.response?.data?.error || "Ocurrió un error desconocido al eliminar.";
            mostraAlertaError(msjError);
        } finally {
            setEliminar(false);
        }
    };

    return (
        <button type="button" className="btn btn-danger" onClick={eliminarProductoPregunta}>
            <i className="fas fa-trash" />
        </button>
    );
};

export default EliminarProducto;