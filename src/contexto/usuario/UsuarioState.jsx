import axios from "axios";
import React, { useState, useEffect } from "react";
import { useSessionStorage } from "../storage/useSessionStorage";
import {
    ProductosListar,
    CategoriaListar,
    LotesListar,
    SalidaListar,
    SucursalesListar
} from "../../configuracion/apiUrls";
import { UsuarioContext } from "./UsuarioContext";

const UsuarioState = (props) => {
    // --- Sesión ---
    const [usuario, setUsuario] = useSessionStorage("usuario_almacenado", null);
    const [token, setToken] = useSessionStorage("toke_almacenado", null);

    // --- Listas ---
    const [listaProductos, setListaProductos] = useState([]);
    const [listaCategorias, setListaCategorias] = useState([]);
    const [listaLotes, setListaLotes] = useState([]);
    const [listaSalida, setListaSalida] = useState([]);
    const [listaSucursales, setListaSucursales] = useState([]);
    const [actualizar, setActualizar] = useState(false);

    useEffect(() => {
        Lista();
    }, []);

    // --- Autenticación ---
    const setCerrarSesion = () => {
        setUsuario(null);
        setToken(null);
    };

    const setLogin = async (data) => {
        try {
            setUsuario(data.usuario);
            setToken(data.token);
        } catch (error) {
            console.log(error);
        }
    };

    // --- Carga inicial de listas ---
    const Lista = async () => {
        try {
            const productos = await axios.get(ProductosListar);
            setListaProductos(productos.data || []);

            const categorias = await axios.get(CategoriaListar);
            setListaCategorias(categorias.data || []);

            const lotes = await axios.get(LotesListar);
            setListaLotes(lotes.data || []);

            const salida = await axios.get(SalidaListar);
            setListaSalida(salida.data || []);

            const sucursales = await axios.get(SucursalesListar);
            setListaSucursales(sucursales.data || []);
        } catch (error) {
            console.error("Error al obtener datos:", error);
            setListaProductos([]);
            setListaCategorias([]);
            setListaLotes([]);
            setListaSalida([]);
            setListaSucursales([]);
        }
    };

    // --- Actualizar lista individual ---
    const ActualizarLista = async (url, setDatos) => {
        try {
            const respuesta = await axios.get(url);
            const data = respuesta.data || [];
            setDatos(data);
            return data;
        } catch (error) {
            console.error(`Error al actualizar la lista desde ${url}:`, error);
            setDatos([]);
            return [];
        }
    };

    return (
        <UsuarioContext.Provider
            value={{
                // Sesión
                usuario,
                token,
                setLogin,
                setCerrarSesion,

                // Listas
                listaProductos,
                listaCategorias,
                listaLotes,
                listaSalida,
                listaSucursales,
                actualizar,

                // Setters
                setActualizar,
                setListaProductos,
                setListaCategorias,
                setListaLotes,
                setListaSalida,
                setListaSucursales,

                // Funciones
                Lista,
                ActualizarLista,
            }}
        >
            {props.children}
        </UsuarioContext.Provider>
    );
};

export default UsuarioState;